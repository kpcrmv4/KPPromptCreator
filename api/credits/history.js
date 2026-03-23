const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { page = 1, limit = 20, type } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('transactions')
    .select('id, type, amount, balance_after, ref_id, description, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });

  res.json({ transactions: data, total: count });
};
