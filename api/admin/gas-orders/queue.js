const { supabaseAdmin } = require('../../../lib/supabase');
const { requireRole } = require('../../../lib/auth');
const { cors } = require('../../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { status } = req.query;

  let query = supabaseAdmin
    .from('gas_orders')
    .select('id, order_number, project_name, template_code, mode, delivery_method, tier, price, status, customer_name, customer_email, line_basic_id, created_at, paid_at, user_id')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query.limit(100);

  if (error) {
    console.error('[admin/gas-orders/queue]', error);
    return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  }

  res.json({ orders: data });
};
