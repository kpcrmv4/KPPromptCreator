/**
 * POST /api/admin/gas-orders/{id}/mark-paid
 * Admin verify slip ใน LINE แล้ว → กดปุ่มนี้
 * → update status = 'paid' → 'in_queue'
 * → LINE Push ลูกค้า "ยืนยันชำระเงินแล้ว"
 */

const { supabaseAdmin } = require('../../../../lib/supabase');
const { requireRole } = require('../../../../lib/auth');
const { cors } = require('../../../../lib/helpers');
const { notifyPaymentVerified } = require('../../../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireRole(req, res, ['admin']);
  if (!admin) return;

  const { id } = req.query;
  const { payment_note } = req.body || {};

  // Get order
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('gas_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !order) return res.status(404).json({ error: 'ไม่พบ order' });

  if (!['submitted', 'in_discussion'].includes(order.status)) {
    return res.status(400).json({ error: `ไม่สามารถ mark paid จากสถานะ ${order.status}` });
  }

  // Update → paid → auto → in_queue
  const { error: updateErr } = await supabaseAdmin
    .from('gas_orders')
    .update({
      status: 'in_queue',
      paid_at: new Date().toISOString(),
      paid_by_admin: admin.id,
      payment_note: payment_note || null,
    })
    .eq('id', id);

  if (updateErr) {
    console.error('[mark-paid]', updateErr);
    return res.status(500).json({ error: 'อัปเดต status ไม่สำเร็จ' });
  }

  // Notify customer (LINE — fail silent)
  try {
    await notifyPaymentVerified(order);
  } catch (e) {
    console.warn('[notify payment]', e.message);
  }

  res.json({ ok: true, order_id: id });
};
