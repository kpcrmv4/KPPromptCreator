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

  const payoutAmount = parseFloat(amount);

  // เช็คขั้นต่ำ
  const { data: setting } = await supabaseAdmin
    .from('settings').select('value').eq('key', 'min_payout_amount').single();
  const minAmount = parseFloat(setting?.value || 100);

  if (payoutAmount < minAmount) {
    return res.status(400).json({ error: `ถอนขั้นต่ำ ฿${minAmount}` });
  }

  // เช็คยอดเครดิต
  const { data: freshUser } = await supabaseAdmin
    .from('users').select('credit_balance').eq('id', user.id).single();
  const balance = parseFloat(freshUser.credit_balance);

  if (balance < payoutAmount) {
    return res.status(400).json({ error: `เครดิตไม่พอ (มี ฿${balance})` });
  }

  // เช็คว่ามี payout pending อยู่หรือไม่
  const { data: pendingPayout } = await supabaseAdmin
    .from('payouts').select('id').eq('seller_id', user.id).eq('status', 'pending').single();
  if (pendingPayout) {
    return res.status(409).json({ error: 'มีคำขอถอนเงินที่รอดำเนินการอยู่แล้ว' });
  }

  // หักเครดิต
  const newBalance = balance - payoutAmount;
  await supabaseAdmin.from('users').update({ credit_balance: newBalance }).eq('id', user.id);

  // สร้าง payout
  const { data: payout, error } = await supabaseAdmin
    .from('payouts')
    .insert({
      seller_id: user.id,
      amount: payoutAmount,
      payment_method: 'truemoney',
      payment_account,
      status: 'pending'
    })
    .select('id, amount, status, created_at')
    .single();

  if (error) return res.status(500).json({ error: 'สร้างคำขอถอนเงินไม่สำเร็จ' });

  // บันทึก transaction
  await supabaseAdmin.from('transactions').insert({
    user_id: user.id,
    type: 'payout',
    amount: -payoutAmount,
    balance_after: newBalance,
    ref_id: payout.id,
    description: `ถอนเงิน ฿${payoutAmount} ไปที่ ${payment_account}`
  });

  // แจ้งเตือน admin ทุกคน
  await notifyAdmins({
    type: 'payout_request',
    title: 'คำขอถอนเงินใหม่',
    message: `${user.display_name} ขอถอนเงิน ฿${payoutAmount} ไปที่ ${payment_account}`,
    ref_id: payout.id,
    ref_type: 'payout'
  });

  res.json({ payout, new_balance: newBalance });
}
