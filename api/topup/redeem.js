const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

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

  // 2. เช็ค hash ซ้ำในฐานข้อมูลก่อน
  const { data: used } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('ref_id', hash)
    .maybeSingle();

  if (used) return res.status(409).json({ error: 'ซองอั่งเปานี้ถูกใช้แล้วในระบบ' });

  // 3. ดึงเบอร์โทรระบบ
  const ownerPhone = process.env.TRUEMONEY_PHONE;
  if (!ownerPhone) return res.status(500).json({ error: 'ระบบยังไม่ได้ตั้งค่าเบอร์รับเงิน' });

  // 4. POST redeem ไปที่ TrueMoney API
  let tmResponse;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(
      `https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'th-TH,th;q=0.9',
          'Origin': 'https://gift.truemoney.com',
          'Referer': 'https://gift.truemoney.com/campaign/'
        },
        body: JSON.stringify({ mobile: ownerPhone, voucher_hash: hash }),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);

    const text = await response.text();
    console.log('TrueMoney response:', response.status, text.substring(0, 500));
    try {
      tmResponse = JSON.parse(text);
    } catch {
      console.error('TrueMoney non-JSON response:', response.status, text.substring(0, 500));
      return res.status(502).json({
        error: `TrueMoney ตอบกลับผิดปกติ (HTTP ${response.status}) กรุณาลองใหม่ภายหลัง`
      });
    }
  } catch (err) {
    console.error('TrueMoney fetch error:', err.message);
    const msg = err.name === 'AbortError'
      ? 'TrueMoney ไม่ตอบกลับ (timeout) กรุณาลองใหม่'
      : 'ไม่สามารถเชื่อมต่อ TrueMoney ได้ กรุณาลองใหม่';
    return res.status(502).json({ error: msg });
  }

  // 5. เช็ค status จาก TrueMoney
  if (!tmResponse || tmResponse.status?.code !== 'SUCCESS') {
    const statusCode = tmResponse?.status?.code || tmResponse?.status || 'UNKNOWN';
    const errorMessages = {
      'VOUCHER_NOT_FOUND': 'ไม่พบซองอั่งเปานี้',
      'VOUCHER_EXPIRED': 'ซองอั่งเปาหมดอายุแล้ว',
      'VOUCHER_REDEEMED': 'ซองอั่งเปานี้ถูกใช้ไปแล้ว',
      'VOUCHER_OUT_OF_BUDGET': 'ซองอั่งเปาหมดงบประมาณ',
      'TARGET_USER_NOT_FOUND': 'เบอร์รับเงินไม่ถูกต้อง'
    };
    return res.status(400).json({
      error: errorMessages[statusCode] || `ไม่สามารถใช้ซองอั่งเปาได้ (${statusCode})`,
      code: statusCode
    });
  }

  // 6. สำเร็จ → เติมเครดิต
  const amount = parseFloat(tmResponse.data?.voucher?.amount_baht || tmResponse.data?.amount_baht || 0);
  if (amount <= 0) return res.status(500).json({ error: 'ไม่สามารถอ่านจำนวนเงินจาก TrueMoney ได้' });

  // อัปเดตเครดิตใน users
  const newBalance = parseFloat(user.credit_balance) + amount;
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ credit_balance: newBalance })
    .eq('id', user.id);

  if (updateError) {
    // CRITICAL: เงินเข้าเบอร์ระบบแล้ว แต่เครดิตไม่เข้า → ต้อง log ไว้
    console.error('CRITICAL: TrueMoney redeemed but credit update failed', {
      user_id: user.id, hash, amount, error: updateError
    });
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการเติมเครดิต กรุณาติดต่อ Admin พร้อมแจ้งหมายเลข: ' + hash
    });
  }

  // บันทึก transaction
  await supabaseAdmin.from('transactions').insert({
    user_id: user.id,
    type: 'topup',
    amount: amount,
    balance_after: newBalance,
    ref_id: hash,
    description: `เติมเงินจากอั่งเปา ฿${amount}`
  });

  res.json({
    success: true,
    amount,
    new_balance: newBalance,
    message: `เติมเงิน ฿${amount} สำเร็จ`
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
