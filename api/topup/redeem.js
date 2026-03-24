const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { notifyAdmins } = require('../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { angpao_link } = req.body;
  if (!angpao_link) return res.status(400).json({ error: 'กรุณาวางลิงก์อั่งเปา' });

  // 1. Parse voucher hash from URL
  const hash = parseVoucherHash(angpao_link);
  if (!hash) return res.status(400).json({ error: 'ลิงก์อั่งเปาไม่ถูกต้อง' });

  // 2. เช็ค hash ซ้ำในฐานข้อมูล (ทั้ง transactions ที่สำเร็จแล้ว และ pending_topups ที่รออยู่)
  const { data: usedTx } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('ref_id', hash)
    .maybeSingle();

  if (usedTx) return res.status(409).json({ error: 'ซองอั่งเปานี้ถูกใช้แล้วในระบบ' });

  const { data: pendingTx } = await supabaseAdmin
    .from('pending_topups')
    .select('id')
    .eq('voucher_hash', hash)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingTx) return res.status(409).json({ error: 'ซองอั่งเปานี้อยู่ระหว่างรอยืนยัน' });

  // 3. ดึงเบอร์โทรระบบ
  const ownerPhone = process.env.TRUEMONEY_PHONE;
  if (!ownerPhone) return res.status(500).json({ error: 'ระบบยังไม่ได้ตั้งค่าเบอร์รับเงิน' });

  // 4. สร้างรายการรอยืนยัน
  const { data: topup, error: insertError } = await supabaseAdmin
    .from('pending_topups')
    .insert({
      user_id: user.id,
      voucher_hash: hash,
      angpao_link: angpao_link,
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create pending topup:', insertError);
    return res.status(500).json({ error: 'ไม่สามารถสร้างรายการเติมเงินได้' });
  }

  // 5. แจ้ง admin ทุกคน
  const maskedPhone = ownerPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1-xxxx-$2');
  await notifyAdmins({
    type: 'topup_request',
    title: 'มีคำขอเติมเครดิตใหม่',
    message: `${user.display_name} ขอเติมเครดิตด้วยอั่งเปา`,
    ref_id: topup.id,
    ref_type: 'topup'
  });

  // 6. ส่งเบอร์โทร + คำแนะนำกลับไป
  const formattedPhone = ownerPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  res.json({
    success: true,
    pending: true,
    topup_id: topup.id,
    phone: formattedPhone,
    message: `กรุณาส่งอั่งเปาไปที่เบอร์ ${formattedPhone} ผ่านแอป TrueMoney Wallet แล้วรอ Admin ยืนยัน`
  });
};

function parseVoucherHash(link) {
  if (!link) return null;
  // Format: https://gift.truemoney.com/campaign/?v=HASH
  try {
    const url = new URL(link);
    if (url.hostname === 'gift.truemoney.com') {
      return url.searchParams.get('v') || null;
    }
  } catch (e) {
    // Maybe just a hash string
    if (/^[a-zA-Z0-9]{10,}$/.test(link.trim())) {
      return link.trim();
    }
  }
  return null;
}
