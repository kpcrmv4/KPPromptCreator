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

  // 2. เช็ค hash ซ้ำ
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

  // 4. ลอง Auto-Redeem ผ่าน Supabase Edge Function ก่อน
  const autoResult = await tryAutoRedeem(hash, ownerPhone);

  if (autoResult.success) {
    // Auto สำเร็จ — เติมเครดิตทันที
    const amountBaht = autoResult.amount;
    const currentBalance = parseFloat(user.credit_balance);
    const newBalance = currentBalance + amountBaht;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ credit_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('CRITICAL: Redeem succeeded but credit update failed!', { hash, amount: amountBaht, userId: user.id });
      return res.status(500).json({ error: `เกิดข้อผิดพลาดในการเติมเครดิต กรุณาแจ้ง Admin (hash: ${hash})` });
    }

    // บันทึก transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'topup',
      amount: amountBaht,
      balance_after: newBalance,
      ref_id: hash,
      description: `เติมเงินจากอั่งเปา ฿${amountBaht}`
    });

    return res.json({
      success: true,
      pending: false,
      message: `เติมเครดิต ฿${amountBaht} สำเร็จ!`,
      amount: amountBaht,
      new_balance: newBalance
    });
  }

  // 5. Auto ไม่สำเร็จ — เช็คว่าเป็น error ที่ต้อง reject ทันทีหรือเปล่า
  if (autoResult.reject) {
    return res.status(autoResult.statusCode || 400).json({ error: autoResult.error });
  }

  // 6. Cloudflare บล็อก หรือ network error → Fallback เป็น Manual
  console.log('Auto-redeem failed, falling back to manual:', autoResult.error);

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

  await notifyAdmins({
    type: 'topup_request',
    title: 'มีคำขอเติมเครดิตใหม่',
    message: `${user.display_name} ขอเติมเครดิตด้วยอั่งเปา`,
    ref_id: topup.id,
    ref_type: 'topup'
  });

  const formattedPhone = ownerPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  res.json({
    success: true,
    pending: true,
    topup_id: topup.id,
    phone: formattedPhone,
    message: `กรุณาส่งอั่งเปาไปที่เบอร์ ${formattedPhone} ผ่านแอป TrueMoney Wallet แล้วรอ Admin ยืนยัน`
  });
};

/**
 * ลอง auto-redeem ผ่าน Supabase Edge Function
 * Returns: { success, amount } or { success: false, error, reject? }
 */
async function tryAutoRedeem(hash, mobile) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { success: false, error: 'Missing Supabase config' };
  }

  try {
    const edgeUrl = `${SUPABASE_URL}/functions/v1/truemoney-redeem`;
    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ voucher_hash: hash, mobile }),
      signal: AbortSignal.timeout(20000) // 20s timeout
    });

    const result = await response.json();

    // Cloudflare blocked
    if (result.error === 'cloudflare_blocked') {
      return { success: false, error: 'Cloudflare blocked' };
    }

    // Non-JSON / bad response
    if (result.error === 'invalid_response') {
      return { success: false, error: 'Invalid TrueMoney response' };
    }

    // Edge function internal error
    if (!result.success && !result.data) {
      return { success: false, error: result.error || 'Edge function error' };
    }

    // Parse TrueMoney response
    const tmData = result.data;
    if (!tmData || !tmData.status) {
      return { success: false, error: 'Unexpected TrueMoney response format' };
    }

    const code = tmData.status.code;

    if (code === 'SUCCESS') {
      const amount = parseFloat(tmData.data?.voucher?.amount_baht || tmData.data?.amount_baht || 0);
      if (amount <= 0) {
        return { success: false, error: 'ไม่สามารถอ่านจำนวนเงินได้', reject: true, statusCode: 500 };
      }
      return { success: true, amount };
    }

    // Known TrueMoney errors — reject immediately (no manual fallback)
    const errorMessages = {
      'VOUCHER_NOT_FOUND': 'ไม่พบซองอั่งเปานี้',
      'VOUCHER_EXPIRED': 'ซองอั่งเปาหมดอายุแล้ว',
      'VOUCHER_REDEEMED': 'ซองอั่งเปานี้ถูกใช้ไปแล้ว',
      'VOUCHER_OUT_OF_STOCK': 'ซองอั่งเปานี้ถูกใช้หมดแล้ว',
      'CANNOT_GET_OWN_VOUCHER': 'ไม่สามารถรับอั่งเปาของตัวเองได้',
      'INVALID_INPUT': 'ข้อมูลไม่ถูกต้อง'
    };

    if (errorMessages[code]) {
      return { success: false, error: errorMessages[code], reject: true, statusCode: 400 };
    }

    // Unknown TrueMoney error
    return { success: false, error: `TrueMoney error: ${code}`, reject: true, statusCode: 400 };

  } catch (err) {
    console.error('Auto-redeem error:', err.message);
    // Network/timeout error → fallback to manual
    return { success: false, error: err.message };
  }
}

function parseVoucherHash(link) {
  if (!link) return null;
  try {
    const url = new URL(link);
    if (url.hostname === 'gift.truemoney.com') {
      return url.searchParams.get('v') || null;
    }
  } catch (e) {
    if (/^[a-zA-Z0-9]{10,}$/.test(link.trim())) {
      return link.trim();
    }
  }
  return null;
}
