const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { sendNotification } = require('../../lib/notify');

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
    .select('id, amount, status, payment_method, payment_account, admin_note, proof_image_url, created_at, processed_at, seller:users!seller_id(id, display_name, email)')
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ payouts: data });
}

async function processPayout(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { payout_id, action, admin_note, proof_image_base64, proof_filename } = req.body;
  if (!payout_id || !action) return res.status(400).json({ error: 'กรุณาระบุ payout_id และ action' });

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action ต้องเป็น approve หรือ reject' });
  }

  const { data: payout } = await supabaseAdmin
    .from('payouts').select('*').eq('id', payout_id).single();
  if (!payout) return res.status(404).json({ error: 'ไม่พบคำขอถอนเงิน' });
  if (payout.status !== 'pending') return res.status(400).json({ error: 'คำขอนี้ถูกดำเนินการแล้ว' });

  let proofImageUrl = null;

  if (action === 'approve') {
    // อัปโหลดรูปหลักฐานการโอน (ถ้ามี)
    if (proof_image_base64 && proof_filename) {
      const base64Data = proof_image_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = proof_filename.split('.').pop().toLowerCase();
      const filePath = `${payout_id}/${Date.now()}_proof.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('payout-proofs')
        .upload(filePath, buffer, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('payout-proofs')
          .getPublicUrl(filePath);
        proofImageUrl = urlData.publicUrl;
      }
    }

    // บันทึก transaction สำหรับการจ่ายเงิน
    const { data: seller } = await supabaseAdmin
      .from('users').select('credit_balance').eq('id', payout.seller_id).single();
    const currentBalance = parseFloat(seller.credit_balance);

    await supabaseAdmin.from('transactions').insert({
      user_id: payout.seller_id,
      type: 'payout',
      amount: 0,  // เงินถูกหักไปตอนสร้าง payout request แล้ว
      balance_after: currentBalance,
      ref_id: payout_id,
      description: `ถอนเงิน ฿${payout.amount} → ${payout.payment_account} (โอนแล้ว)`
    });

    // แจ้ง seller ว่าถอนเงินสำเร็จ
    await sendNotification({
      user_id: payout.seller_id,
      type: 'payout_approved',
      title: 'ถอนเงินสำเร็จ',
      message: `Admin อนุมัติการถอนเงิน ฿${payout.amount} ไปที่ ${payout.payment_account} แล้ว${admin_note ? ` — ${admin_note}` : ''}`,
      ref_id: payout_id,
      ref_type: 'payout'
    });
  }

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

    // แจ้ง seller ว่าถูกปฏิเสธ
    await sendNotification({
      user_id: payout.seller_id,
      type: 'payout_rejected',
      title: 'คำขอถอนเงินถูกปฏิเสธ',
      message: `Admin ปฏิเสธการถอนเงิน ฿${payout.amount}${admin_note ? ` — เหตุผล: ${admin_note}` : ''} เครดิตถูกคืนเข้าบัญชีแล้ว`,
      ref_id: payout_id,
      ref_type: 'payout'
    });
  }

  const newStatus = action === 'approve' ? 'paid' : 'rejected';
  const updateData = {
    status: newStatus,
    admin_note: admin_note || null,
    processed_at: new Date().toISOString()
  };
  if (proofImageUrl) updateData.proof_image_url = proofImageUrl;

  await supabaseAdmin.from('payouts').update(updateData).eq('id', payout_id);

  res.json({ success: true, status: newStatus, proof_image_url: proofImageUrl });
}
