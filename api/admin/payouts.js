const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return listPayouts(req, res);
  if (req.method === 'PUT') return processPayout(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listPayouts(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { status = 'pending' } = req.query;

  const { data, error } = await supabaseAdmin
    .from('payouts')
    .select('id, amount, status, payment_method, payment_account, admin_note, created_at, processed_at, seller:users!seller_id(id, display_name, email)')
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ payouts: data });
}

async function processPayout(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { payout_id, action, admin_note } = req.body;
  if (!payout_id || !action) return res.status(400).json({ error: 'กรุณาระบุ payout_id และ action' });

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action ต้องเป็น approve หรือ reject' });
  }

  const { data: payout } = await supabaseAdmin
    .from('payouts').select('*').eq('id', payout_id).single();
  if (!payout) return res.status(404).json({ error: 'ไม่พบคำขอถอนเงิน' });
  if (payout.status !== 'pending') return res.status(400).json({ error: 'คำขอนี้ถูกดำเนินการแล้ว' });

  if (action === 'reject') {
    // คืนเครดิตให้ seller
    const { data: seller } = await supabaseAdmin
      .from('users').select('credit_balance').eq('id', payout.seller_id).single();
    const newBalance = parseFloat(seller.credit_balance) + parseFloat(payout.amount);
    await supabaseAdmin.from('users').update({ credit_balance: newBalance }).eq('id', payout.seller_id);

    await supabaseAdmin.from('transactions').insert({
      user_id: payout.seller_id,
      type: 'refund',
      amount: parseFloat(payout.amount),
      balance_after: newBalance,
      ref_id: payout_id,
      description: `คืนเงินจากคำขอถอน (ปฏิเสธ): ${admin_note || ''}`
    });
  }

  const newStatus = action === 'approve' ? 'paid' : 'rejected';
  await supabaseAdmin.from('payouts').update({
    status: newStatus,
    admin_note: admin_note || null,
    processed_at: new Date().toISOString()
  }).eq('id', payout_id);

  res.json({ success: true, status: newStatus });
}
