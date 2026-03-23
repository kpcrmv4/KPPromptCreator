const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  // จำนวน prompt
  const { count: totalPrompts } = await supabaseAdmin
    .from('prompts').select('id', { count: 'exact', head: true }).eq('seller_id', user.id);

  const { count: approvedPrompts } = await supabaseAdmin
    .from('prompts').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'approved');

  // ยอดขาย
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('seller_amount')
    .eq('seller_id', user.id)
    .eq('status', 'completed');

  const totalSales = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.seller_amount), 0) || 0;

  // Prompts ของ seller
  const { data: prompts } = await supabaseAdmin
    .from('prompts')
    .select('id, title, price, status, purchase_count, avg_rating, view_count, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  res.json({
    stats: {
      total_prompts: totalPrompts,
      approved_prompts: approvedPrompts,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      credit_balance: parseFloat(user.credit_balance)
    },
    prompts: prompts || []
  });
};
