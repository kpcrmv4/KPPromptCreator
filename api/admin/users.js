const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return listUsers(req, res);
  if (req.method === 'PUT') return updateUser(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listUsers(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('users')
    .select('id, email, display_name, role, credit_balance, status, truemoney_phone, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) query = query.eq('role', role);
  if (search) query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ users: data, total: count });
}

async function updateUser(req, res) {
  const admin = await requireRole(req, res, ['admin']);
  if (!admin) return;

  const { user_id, role, status } = req.body;
  if (!user_id) return res.status(400).json({ error: 'กรุณาระบุ user_id' });

  const updates = {};
  if (role && ['buyer', 'seller', 'admin'].includes(role)) updates.role = role;
  if (status && ['active', 'suspended'].includes(status)) updates.status = status;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('users').update(updates).eq('id', user_id)
    .select('id, email, display_name, role, status')
    .single();

  if (error) return res.status(500).json({ error: 'อัปเดตไม่สำเร็จ' });
  res.json({ user: data });
}
