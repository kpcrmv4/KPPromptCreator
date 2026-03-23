const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return getOrders(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function getOrders(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabaseAdmin
    .from('orders')
    .select('id, amount, commission, status, created_at, prompt:prompts!prompt_id(id, title, category, price)', { count: 'exact' })
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ orders: data, total: count });
}
