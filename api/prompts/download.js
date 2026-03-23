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
    .select('id, title, prompt_content, seller_id')
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

  res.json({
    title: prompt.title,
    content: prompt.prompt_content
  });
};
