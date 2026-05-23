// Slip2Go API client + validator
// Docs: https://slip2go.com/  (POST /api/verify-slip/qr-code/info)
//
// Required env:
//   SLIP2GO_API_URL   e.g. https://connect.slip2go.com
//   SLIP2GO_SECRET    Bearer token from Slip2Go dashboard

const DEFAULT_TIMEOUT_MS = 10000;
const SLIP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 ชม.

// เรียก Slip2Go ตรวจสอบสลิปจาก QR code string
// ถ้ายิงไม่ได้/quota หมด/timeout → return { ok:false, error:'slip2go_unavailable' }
// ถ้า Slip2Go reject (เช่น checkCondition ไม่ผ่าน) → return { ok:false, error:'<code>', raw }
// ถ้าสำเร็จ → return { ok:true, data:<slip data>, raw }
async function verifySlipByQR(qrCode, opts = {}) {
  const baseUrl = process.env.SLIP2GO_API_URL;
  const secret = process.env.SLIP2GO_SECRET;
  if (!baseUrl || !secret) {
    return { ok: false, error: 'slip2go_not_configured' };
  }

  const payload = { qrCode };
  if (opts.checkCondition) payload.checkCondition = opts.checkCondition;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || DEFAULT_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${baseUrl}/api/verify-slip/qr-code/info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.name === 'AbortError' ? 'slip2go_timeout' : 'slip2go_network_error' };
  }
  clearTimeout(timer);

  let json;
  try { json = await res.json(); }
  catch { return { ok: false, error: 'slip2go_invalid_response', status: res.status }; }

  // Slip2Go ใช้ code "200000" = success
  if (json.code !== '200000' || !json.data) {
    return { ok: false, error: json.code || 'slip2go_error', message: json.message, raw: json };
  }

  return { ok: true, data: json.data, raw: json };
}

// ตรวจ slip data ตามเงื่อนไขฝั่งเรา (amount + age)
// คืน null = ผ่าน, คืน string = error code
function validateForPurchase(slipData, expected) {
  if (!slipData) return 'slip_no_data';

  // ราคา
  if (typeof slipData.amount !== 'number') return 'slip_invalid_amount_type';
  if (Number(slipData.amount) !== Number(expected.amount)) return 'amount_mismatch';

  // วันที่
  const ts = Date.parse(slipData.dateTime);
  if (!Number.isFinite(ts)) return 'slip_invalid_datetime';
  const ageMs = Date.now() - ts;
  if (ageMs < -5 * 60 * 1000) return 'slip_future_date';       // อนุญาต clock skew 5 นาที
  if (ageMs > (expected.maxAgeMs || SLIP_MAX_AGE_MS)) return 'slip_too_old';

  // ผู้รับ (optional — ถ้า expected.receiverName ระบุไว้)
  if (expected.receiverName) {
    const name = slipData.receiver?.account?.name || '';
    if (!name.includes(expected.receiverName)) return 'wrong_receiver_name';
  }

  // transRef ต้องมี
  if (!slipData.transRef) return 'slip_no_trans_ref';

  return null;
}

// แปลง error code → ข้อความภาษาไทย (สำหรับ user-facing)
function errorMessageTH(code) {
  const map = {
    slip2go_not_configured: 'ระบบตรวจสลิปยังไม่พร้อมใช้งาน',
    slip2go_unavailable: 'ระบบตรวจสลิปไม่ว่าง กรุณารอแอดมินอนุมัติ',
    slip2go_timeout: 'ตรวจสอบสลิปไม่สำเร็จ (timeout) — รอแอดมิน',
    slip2go_network_error: 'ตรวจสอบสลิปไม่สำเร็จ (network) — รอแอดมิน',
    slip2go_invalid_response: 'ระบบตรวจสลิปตอบกลับผิดรูปแบบ — รอแอดมิน',
    '401001': 'ระบบตรวจสลิปยังไม่พร้อม (auth)',
    '403001': 'ระบบตรวจสลิปปฏิเสธคำขอ',
    '429001': 'ตรวจสอบสลิปบ่อยเกินไป กรุณารอสักครู่',
    slip_no_data: 'ไม่พบข้อมูลสลิป',
    slip_no_trans_ref: 'สลิปไม่มีรหัสอ้างอิง',
    slip_invalid_amount_type: 'ข้อมูลจำนวนเงินผิด',
    slip_invalid_datetime: 'ข้อมูลวันที่สลิปผิด',
    slip_future_date: 'วันที่สลิปไม่ถูกต้อง (อยู่ในอนาคต)',
    slip_too_old: 'สลิปเกิน 24 ชั่วโมง กรุณาโอนใหม่',
    amount_mismatch: 'จำนวนเงินไม่ตรงกับราคาคอร์ส',
    wrong_receiver_name: 'โอนเข้าบัญชีไม่ถูกต้อง',
    slip_already_used: 'สลิปนี้ถูกใช้ไปแล้ว',
  };
  return map[code] || `เกิดข้อผิดพลาด (${code})`;
}

module.exports = {
  verifySlipByQR,
  validateForPurchase,
  errorMessageTH,
  SLIP_MAX_AGE_MS,
};
