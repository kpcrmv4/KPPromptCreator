const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { sendNotification } = require('../../lib/notify');

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
    .select('id, title, description, category, tech_stack, price, preview_text, status, rejection_reason, created_at, seller:users!seller_id(id, display_name, email)', { count: 'exact' })
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

  // ดึง prompt เดิมเพื่อหา seller_id
  const { data: existing } = await supabaseAdmin
    .from('prompts').select('seller_id, title').eq('id', prompt_id).single();
  if (!existing) return res.status(404).json({ error: 'ไม่พบ prompt' });

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

  // แจ้ง seller ว่า prompt ถูกอนุมัติ/ปฏิเสธ
  await sendNotification({
    user_id: existing.seller_id,
    type: action === 'approve' ? 'prompt_approved' : 'prompt_rejected',
    title: action === 'approve'
      ? `Prompt "${existing.title}" อนุมัติแล้ว!`
      : `Prompt "${existing.title}" ถูกปฏิเสธ`,
    message: action === 'approve'
      ? `Prompt ของคุณพร้อมขายใน Marketplace แล้ว`
      : `เหตุผล: ${rejection_reason || 'ไม่ได้ระบุ'}`,
    ref_id: prompt_id,
    ref_type: 'prompt'
  });

  res.json({ prompt: data });
}
