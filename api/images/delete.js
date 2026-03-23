const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { image_id } = req.query;
  if (!image_id) return res.status(400).json({ error: 'กรุณาระบุ image_id' });

  // ดึงข้อมูลรูป + เช็คสิทธิ์
  const { data: image } = await supabaseAdmin
    .from('prompt_images')
    .select('id, image_url, prompt_id')
    .eq('id', image_id)
    .single();

  if (!image) return res.status(404).json({ error: 'ไม่พบรูป' });

  const { data: prompt } = await supabaseAdmin
    .from('prompts')
    .select('seller_id')
    .eq('id', image.prompt_id)
    .single();

  if (prompt.seller_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบรูปนี้' });
  }

  // ลบจาก Storage (extract path from URL)
  try {
    const url = new URL(image.image_url);
    const pathParts = url.pathname.split('/storage/v1/object/public/prompt-images/');
    if (pathParts[1]) {
      await supabaseAdmin.storage.from('prompt-images').remove([decodeURIComponent(pathParts[1])]);
    }
  } catch (e) {
    console.error('Storage delete error:', e);
  }

  // ลบจาก DB
  await supabaseAdmin.from('prompt_images').delete().eq('id', image_id);

  res.json({ success: true });
};
