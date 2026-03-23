const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return listPrompts(req, res);
  if (req.method === 'PUT') return moderatePrompt(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listPrompts(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { status = 'pending', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabaseAdmin
    .from('prompts')
    .select('id, title, description, category, tech_stack, price, preview_text, status, created_at, seller:users!seller_id(id, display_name, email)', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ prompts: data, total: count });
}

async function moderatePrompt(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { prompt_id, action, rejection_reason } = req.body;
  if (!prompt_id || !action) return res.status(400).json({ error: 'กรุณาระบุ prompt_id และ action' });

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action ต้องเป็น approve หรือ reject' });
  }

  const updates = {
    status: action === 'approve' ? 'approved' : 'rejected',
    updated_at: new Date().toISOString()
  };
  if (action === 'reject' && rejection_reason) {
    updates.rejection_reason = rejection_reason;
  }

  const { data, error } = await supabaseAdmin
    .from('prompts').update(updates).eq('id', prompt_id).select('id, title, status').single();

  if (error) return res.status(500).json({ error: 'อัปเดตไม่สำเร็จ' });
  res.json({ prompt: data });
}
