const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { sendNotification } = require('../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return listTopups(req, res);
  if (req.method === 'PUT') return processTopup(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listTopups(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { status = 'pending' } = req.query;

  const { data, error } = await supabaseAdmin
    .from('pending_topups')
    .select('id, voucher_hash, angpao_link, amount, status, admin_note, created_at, processed_at, user:users!user_id(id, display_name, email)')
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ topups: data });
}

async function processTopup(req, res) {
  const admin = await requireRole(req, res, ['admin']);
  if (!admin) return;

  const { topup_id, action, amount, admin_note } = req.body;
  if (!topup_id || !action) return res.status(400).json({ error: 'กรุณาระบุ topup_id และ action' });
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action ต้องเป็น approve หรือ reject' });
  }

  // ดึงข้อมูล topup
  const { data: topup } = await supabaseAdmin
    .from('pending_topups').select('*').eq('id', topup_id).single();

  if (!topup) return res.status(404).json({ error: 'ไม่พบรายการเติมเงิน' });
  if (topup.status !== 'pending') return res.status(400).json({ error: 'รายการนี้ถูกดำเนินการแล้ว' });

  if (action === 'approve') {
    const topupAmount = parseFloat(amount);
    if (!topupAmount || topupAmount <= 0) {
      return res.status(400).json({ error: 'กรุณาระบุจำนวนเงิน' });
    }

    // เติมเครดิตให้ user
    const { data: userData } = await supabaseAdmin
      .from('users').select('credit_balance, display_name').eq('id', topup.user_id).single();

    const newBalance = parseFloat(userData.credit_balance) + topupAmount;
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ credit_balance: newBalance })
      .eq('id', topup.user_id);

    if (updateError) {
      console.error('Failed to update credit:', updateError);
      return res.status(500).json({ error: 'เติมเครดิตไม่สำเร็จ' });
    }

    // บันทึก transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: topup.user_id,
      type: 'topup',
      amount: topupAmount,
      balance_after: newBalance,
      ref_id: topup.voucher_hash,
      description: `เติมเงินจากอั่งเปา ฿${topupAmount} (ยืนยันโดย Admin)`
    });

    // แจ้ง user
    await sendNotification({
      user_id: topup.user_id,
      type: 'topup_approved',
      title: 'เติมเครดิตสำเร็จ',
      message: `Admin ยืนยันการเติมเงิน ฿${topupAmount} เรียบร้อย ยอดคงเหลือ ฿${newBalance.toFixed(2)}`,
      ref_id: topup.id,
      ref_type: 'topup'
    });

    // อัปเดต pending_topups
    await supabaseAdmin.from('pending_topups').update({
      status: 'approved',
      amount: topupAmount,
      admin_note: admin_note || null,
      processed_by: admin.id,
      processed_at: new Date().toISOString()
    }).eq('id', topup_id);

    return res.json({ success: true, status: 'approved', new_balance: newBalance });
  }

  if (action === 'reject') {
    await supabaseAdmin.from('pending_topups').update({
      status: 'rejected',
      admin_note: admin_note || null,
      processed_by: admin.id,
      processed_at: new Date().toISOString()
    }).eq('id', topup_id);

    // แจ้ง user
    await sendNotification({
      user_id: topup.user_id,
      type: 'topup_rejected',
      title: 'เติมเครดิตไม่สำเร็จ',
      message: `Admin ปฏิเสธการเติมเงิน${admin_note ? ` — เหตุผล: ${admin_note}` : ''} กรุณาตรวจสอบและลองใหม่`,
      ref_id: topup.id,
      ref_type: 'topup'
    });

    return res.json({ success: true, status: 'rejected' });
  }
}
