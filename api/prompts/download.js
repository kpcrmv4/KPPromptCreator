const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { prompt_id } = req.query;
  if (!prompt_id) return res.status(400).json({ error: 'กรุณาระบุ prompt_id' });

  // เช็คว่าซื้อแล้วหรือเป็นเจ้าของ
  const { data: prompt } = await supabaseAdmin
    .from('prompts')
    .select('id, title, prompt_content, prompt_file_url, seller_id')
    .eq('id', prompt_id)
    .single();

  if (!prompt) return res.status(404).json({ error: 'ไม่พบ prompt' });

  const isOwner = prompt.seller_id === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('prompt_id', prompt_id)
      .single();

    if (!order) return res.status(403).json({ error: 'กรุณาซื้อ prompt ก่อนดาวน์โหลด' });
  }

  // ถ้ามีไฟล์ใน Storage → สร้าง signed URL ให้ดาวน์โหลด
  if (prompt.prompt_file_url) {
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('prompt-files')
      .createSignedUrl(prompt.prompt_file_url, 60 * 5); // 5 นาที

    if (!signError && signedData?.signedUrl) {
      return res.json({
        title: prompt.title,
        download_url: signedData.signedUrl,
        content: prompt.prompt_content  // fallback
      });
    }
  }

  // fallback: ส่ง content ตรงๆ (สำหรับ prompt เก่าที่ยังไม่มีไฟล์)
  res.json({
    title: prompt.title,
    content: prompt.prompt_content
  });
};
