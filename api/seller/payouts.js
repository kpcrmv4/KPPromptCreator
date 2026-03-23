const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');
const { notifyAdmins } = require('../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return getPayouts(req, res);
  if (req.method === 'POST') return requestPayout(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function getPayouts(req, res) {
  const user = await requireRole(req, res, ['seller', 'admin']);
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ payouts: data });
}

async function requestPayout(req, res) {
  const user = await requireRole(req, res, ['seller', 'admin']);
  if (!user) return;

  const { amount, payment_account } = req.body;
  const err = validateRequired(req.body, ['amount', 'payment_account']);
  if (err) return res.status(400).json({ error: err });

  // ดึงขั้นต่ำ
  const { data: setting } = await supabaseAdmin
    .from('settings').select('value').eq('key', 'min_payout_amount').single();
  const minAmount = parseFloat(setting?.value || 100);

  // Atomic payout via DB function (ป้องกัน race condition)
  const { data, error } = await supabaseAdmin.rpc('request_payout', {
    p_seller_id: user.id,
    p_amount: parseFloat(amount),
    p_payment_account: payment_account,
    p_min_amount: minAmount
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('below_minimum')) return res.status(400).json({ error: `ถอนขั้นต่ำ ฿${minAmount}` });
    if (msg.includes('insufficient_balance')) return res.status(400).json({ error: 'เครดิตไม่พอ' });
    if (msg.includes('pending_exists')) return res.status(409).json({ error: 'มีคำขอถอนเงินที่รอดำเนินการอยู่แล้ว' });
    return res.status(500).json({ error: 'สร้างคำขอถอนเงินไม่สำเร็จ' });
  }

  // แจ้ง admin ทุกคน
  await notifyAdmins({
    type: 'payout_request',
    title: 'คำขอถอนเงินใหม่',
    message: `${user.display_name} ขอถอนเงิน ฿${amount} ไปที่ ${payment_account}`,
    ref_id: data.payout_id,
    ref_type: 'payout'
  });

  res.json({ payout: { id: data.payout_id, amount: data.amount }, new_balance: data.new_balance });
}
