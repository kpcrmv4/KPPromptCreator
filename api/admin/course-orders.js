// Admin: course-orders queue (for pending_review fallback)
//   GET  /api/admin/course-orders?status=pending_review   — list orders
//   POST /api/admin/course-orders?id=<uuid>&action=approve — manual enroll
//   POST /api/admin/course-orders?id=<uuid>&action=reject  — reject + note

const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  if (req.method === 'GET') return listOrders(req, res);
  if (req.method === 'POST') return processOrder(req, res, user);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listOrders(req, res) {
  const { status = 'pending_review' } = req.query;
  const { data, error } = await supabaseAdmin
    .from('course_orders')
    .select(`
      id, amount, payment_method, status, slip_image_url, slip_qr_code,
      slip_trans_ref, slip_verify_error, slip_verify_response,
      admin_note, created_at, processed_at, enrollment_id,
      user:users!user_id ( id, email, display_name ),
      course:courses!course_id ( id, slug, title )
    `)
    .eq('status', status)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data });
}

async function processOrder(req, res, admin) {
  const { id, action } = req.query;
  const { note } = req.body || {};
  if (!id || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'missing id or invalid action' });
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('course_orders')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });

  if (action === 'reject') {
    const { data, error } = await supabaseAdmin
      .from('course_orders')
      .update({
        status: 'rejected',
        admin_note: note || null,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ order: data });
  }

  // approve → enroll
  const { data: enrollResult, error: rpcErr } = await supabaseAdmin.rpc('enroll_course', {
    p_user_id: order.user_id,
    p_course_id: order.course_id,
    p_payment_method: 'admin_grant',
    p_course_order_id: order.id,
  });
  if (rpcErr) {
    if (/already_enrolled/.test(rpcErr.message)) {
      // มี enrollment อยู่แล้ว — แค่ mark approved
    } else {
      return res.status(500).json({ error: rpcErr.message });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('course_orders')
    .update({
      status: 'approved',
      admin_note: note || null,
      processed_by: admin.id,
      processed_at: new Date().toISOString(),
      enrollment_id: enrollResult?.enrollment_id || order.enrollment_id || null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ order: data, enrollment_id: enrollResult?.enrollment_id });
}
