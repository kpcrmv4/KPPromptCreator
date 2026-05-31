// POST /api/course-orders — buy course (promptpay_slip auto-verify)
// GET  /api/course-orders — list user's own course orders
//
// Slip flow:
//   1. validate input
//   2. upload slip image to storage
//   3. insert course_orders (status='verifying')
//   4. call Slip2Go via lib/slip2go.js
//   5. validate (amount, age, receiver, dedup transRef)
//   6. ok → enroll_course RPC → status='approved'
//      fail → status='pending_review' (fallback) หรือ 'rejected'

const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { verifySlipByQR, validateForPurchase, errorMessageTH } = require('../../lib/slip2go');

const SLIP_BUCKET = 'codegen'; // reuse existing bucket (course-slips/{user_id}/...)
const COURSE_SLIP_FOLDER = 'course-slips';

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method === 'GET') return listOrders(req, res);
  if (req.method === 'POST') return createOrder(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listOrders(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from('course_orders')
    .select(`
      id, amount, payment_method, status, slip_image_url, slip_verify_error,
      admin_note, created_at, processed_at, enrollment_id,
      course:courses!course_id ( id, slug, title )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ orders: data });
}

async function createOrder(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    course_id,
    payment_method,
    slip_image_base64,
    slip_filename,
    qr_code,
  } = req.body || {};

  if (!course_id) return res.status(400).json({ error: 'missing course_id' });
  if (payment_method !== 'promptpay_slip') {
    return res.status(400).json({ error: 'payment_method ไม่ถูกต้อง' });
  }

  // ดึง course เพื่อรู้ราคา + ตรวจ status
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, title, price, status')
    .eq('id', course_id)
    .single();

  if (!course || course.status !== 'published') {
    return res.status(404).json({ error: 'ไม่พบคอร์สหรือยังไม่เปิดขาย' });
  }

  // กันซื้อซ้ำ (RPC ก็จับ แต่ early return ดีกว่า)
  const { data: existingEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .maybeSingle();
  if (existingEnrollment) {
    return res.status(409).json({ error: 'คุณซื้อคอร์สนี้ไปแล้ว', already_enrolled: true });
  }

  return handleSlipPayment(user, course, { slip_image_base64, slip_filename, qr_code }, res);
}

// --- Slip path (auto-verify) ---
async function handleSlipPayment(user, course, payload, res) {
  const { slip_image_base64, slip_filename, qr_code } = payload;

  if (!slip_image_base64 || !slip_filename) {
    return res.status(400).json({ error: 'กรุณาแนบสลิป' });
  }
  if (!qr_code || typeof qr_code !== 'string') {
    return res.status(400).json({ error: 'ไม่พบ QR ในสลิป — ลองภาพที่ชัดกว่า' });
  }

  // ---- upload slip image ----
  const slipBase64 = slip_image_base64.replace(/^data:image\/\w+;base64,/, '');
  const slipBuffer = Buffer.from(slipBase64, 'base64');
  if (slipBuffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'สลิปต้องมีขนาดไม่เกิน 5MB' });
  }

  const ext = (slip_filename.split('.').pop() || 'jpg').toLowerCase();
  const slipPath = `${COURSE_SLIP_FOLDER}/${user.id}/${Date.now()}_${slip_filename}`;
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(SLIP_BUCKET)
    .upload(slipPath, slipBuffer, { contentType, upsert: false });
  if (uploadErr) {
    return res.status(500).json({ error: 'อัปโหลดสลิปไม่สำเร็จ' });
  }
  const { data: urlData } = supabaseAdmin.storage.from(SLIP_BUCKET).getPublicUrl(slipPath);
  const slipImageUrl = urlData.publicUrl;

  // ---- create order row (status='verifying') ----
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('course_orders')
    .insert({
      user_id: user.id,
      course_id: course.id,
      amount: course.price,
      payment_method: 'promptpay_slip',
      slip_image_url: slipImageUrl,
      slip_qr_code: qr_code,
      status: 'verifying',
    })
    .select('id')
    .single();
  if (orderErr) return res.status(500).json({ error: 'สร้างคำสั่งซื้อไม่สำเร็จ' });

  // ---- call Slip2Go ----
  // checkDuplicate กันสลิปถูกตรวจซ้ำใน Slip2Go เอง
  // (receiver validation ทำฝั่งเราด้วย phone last 4 — แม่นยำกว่า name match)
  const checkCondition = { checkDuplicate: true };
  const slipResult = await verifySlipByQR(qr_code, { checkCondition });

  if (!slipResult.ok) {
    // Slip2Go ล่ม/quota/auth issue → fallback to manual review
    const fallbackToManual = ['slip2go_unavailable', 'slip2go_timeout', 'slip2go_network_error', 'slip2go_invalid_response', 'slip2go_not_configured', '401001', '429001'].includes(slipResult.error);
    const newStatus = fallbackToManual ? 'pending_review' : 'rejected';

    await supabaseAdmin
      .from('course_orders')
      .update({
        status: newStatus,
        slip_verify_error: slipResult.error,
        slip_verify_response: slipResult.raw || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return res.status(newStatus === 'pending_review' ? 202 : 400).json({
      order_id: order.id,
      status: newStatus,
      error: slipResult.error,
      message: errorMessageTH(slipResult.error),
    });
  }

  // ---- local validation ----
  // derive last 4 digits of our PromptPay phone for receiver check (more reliable than name)
  const ourPhoneLast4 = (process.env.PROMPTPAY_NUMBER || '').replace(/\D/g, '').slice(-4) || null;
  const validationErr = validateForPurchase(slipResult.data, {
    amount: Number(course.price),
    receiverPhoneLast4: ourPhoneLast4,
  });

  if (validationErr) {
    await supabaseAdmin
      .from('course_orders')
      .update({
        status: 'rejected',
        slip_verify_error: validationErr,
        slip_verify_response: slipResult.data,
        processed_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    return res.status(400).json({
      order_id: order.id,
      status: 'rejected',
      error: validationErr,
      message: errorMessageTH(validationErr),
    });
  }

  // ---- save trans_ref (UNIQUE catches replay) ----
  const transRef = slipResult.data.transRef;
  const { error: refErr } = await supabaseAdmin
    .from('course_orders')
    .update({
      slip_trans_ref: transRef,
      slip_verified_at: new Date().toISOString(),
      slip_verify_response: slipResult.data,
    })
    .eq('id', order.id);

  if (refErr) {
    // 23505 = unique_violation
    const isDup = refErr.code === '23505' || /duplicate key/i.test(refErr.message || '');
    await supabaseAdmin
      .from('course_orders')
      .update({
        status: 'rejected',
        slip_verify_error: isDup ? 'slip_already_used' : 'db_error',
        processed_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    return res.status(isDup ? 409 : 500).json({
      order_id: order.id,
      status: 'rejected',
      error: isDup ? 'slip_already_used' : 'db_error',
      message: errorMessageTH(isDup ? 'slip_already_used' : 'db_error'),
    });
  }

  // ---- enroll ----
  const { data: enrollResult, error: rpcErr } = await supabaseAdmin.rpc('enroll_course', {
    p_user_id: user.id,
    p_course_id: course.id,
    p_payment_method: 'slip_verified',
    p_course_order_id: order.id,
  });

  if (rpcErr) {
    await supabaseAdmin
      .from('course_orders')
      .update({
        status: 'pending_review', // เก็บไว้ให้ admin ดู — สลิปจริงแต่ enroll fail
        slip_verify_error: rpcErr.message,
        processed_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    return res.status(500).json({
      order_id: order.id,
      status: 'pending_review',
      error: rpcErr.message,
      message: 'สลิปถูกต้อง แต่ลงทะเบียนไม่สำเร็จ — admin จะตรวจสอบ',
    });
  }

  await supabaseAdmin
    .from('course_orders')
    .update({
      status: 'approved',
      enrollment_id: enrollResult.enrollment_id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  return res.json({
    order_id: order.id,
    status: 'approved',
    enrollment_id: enrollResult.enrollment_id,
    course_title: course.title,
  });
}

function thaiMessageForRpcError(msg) {
  const map = {
    user_not_found: 'ไม่พบบัญชีผู้ใช้',
    course_not_found_or_unpublished: 'ไม่พบคอร์สหรือยังไม่เปิดขาย',
    already_enrolled: 'คุณซื้อคอร์สนี้ไปแล้ว',
    invalid_payment_method: 'รูปแบบการชำระเงินไม่รองรับ',
  };
  return map[msg] || `ลงทะเบียนไม่สำเร็จ (${msg})`;
}
