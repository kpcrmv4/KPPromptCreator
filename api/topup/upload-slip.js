const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { notifyAdmins } = require('../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { topup_id, slip_image_base64 } = req.body;

  if (!topup_id) {
    return res.status(400).json({ error: 'กรุณาระบุ topup_id' });
  }
  if (!slip_image_base64) {
    return res.status(400).json({ error: 'กรุณาอัปโหลดรูปสลิปการโอนเงิน' });
  }

  // Verify user owns this topup and it's still pending
  const { data: topup, error: fetchError } = await supabaseAdmin
    .from('pending_topups')
    .select('*')
    .eq('id', topup_id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single();

  if (fetchError || !topup) {
    return res.status(404).json({ error: 'ไม่พบรายการเติมเงินนี้ หรือถูกดำเนินการแล้ว' });
  }

  // Upload slip image to Supabase Storage
  const matches = slip_image_base64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'รูปภาพไม่ถูกต้อง' });

  const contentType = matches[1];
  const ext = contentType.split('/')[1] || 'jpg';
  const buffer = Buffer.from(matches[2], 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'รูปภาพต้องมีขนาดไม่เกิน 5MB' });
  }

  const filename = `topup-slips/${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('topup-slips')
    .upload(filename, buffer, { contentType, upsert: false });

  if (uploadError) {
    console.error('Slip upload error:', uploadError);
    return res.status(500).json({ error: 'อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่' });
  }

  const { data: urlData } = supabaseAdmin.storage.from('topup-slips').getPublicUrl(filename);
  const slipUrl = urlData?.publicUrl || null;

  // Update pending topup with slip URL
  const { error: updateError } = await supabaseAdmin
    .from('pending_topups')
    .update({ slip_image_url: slipUrl })
    .eq('id', topup_id);

  if (updateError) {
    console.error('Failed to update topup with slip:', updateError);
    return res.status(500).json({ error: 'บันทึกสลิปไม่สำเร็จ' });
  }

  // Notify admins about slip upload
  await notifyAdmins({
    type: 'topup_slip_uploaded',
    title: 'มีการอัปโหลดสลิปเติมเครดิต',
    message: `${user.display_name} อัปโหลดสลิปเติมเครดิต ฿${topup.requested_amount} (ยอดโอน ฿${parseFloat(topup.unique_amount).toFixed(2)})`,
    ref_id: topup_id,
    ref_type: 'topup'
  });

  res.json({
    success: true,
    message: 'อัปโหลดสลิปสำเร็จ รอ Admin ตรวจสอบ',
    slip_url: slipUrl
  });
};
