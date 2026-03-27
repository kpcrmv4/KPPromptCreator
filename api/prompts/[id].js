const { supabaseAdmin } = require('../../lib/supabase');
const { authenticate, requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const { id } = req.query;

  if (req.method === 'GET') return getPrompt(req, res, id);
  if (req.method === 'PUT') return updatePrompt(req, res, id);
  if (req.method === 'DELETE') return deletePrompt(req, res, id);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function getPrompt(req, res, id) {
  const { data: prompt, error } = await supabaseAdmin
    .from('prompts')
    .select('id, title, description, category, tech_stack, price, preview_text, preview_image_url, demo_url, tags, status, view_count, purchase_count, avg_rating, created_at, seller:users!seller_id(id, display_name, avatar_url, bio)')
    .eq('id', id)
    .single();

  if (!prompt || error) return res.status(404).json({ error: 'ไม่พบ prompt' });

  // Increment view count
  await supabaseAdmin.from('prompts').update({ view_count: (prompt.view_count || 0) + 1 }).eq('id', id);

  // Get images
  const { data: images } = await supabaseAdmin
    .from('prompt_images')
    .select('id, image_url, sort_order')
    .eq('prompt_id', id)
    .order('sort_order');

  // Get reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, comment, created_at, buyer:users!buyer_id(display_name, avatar_url)')
    .eq('prompt_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Check if current user has purchased
  let purchased = false;
  const user = await authenticate(req);
  if (user) {
    const { data: order } = await supabaseAdmin
      .from('orders').select('id').eq('buyer_id', user.id).eq('prompt_id', id).single();
    purchased = !!order;
  }

  res.json({ prompt: { ...prompt, images: images || [], reviews: reviews || [] }, purchased });
}

async function updatePrompt(req, res, id) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { data: existing } = await supabaseAdmin
    .from('prompts').select('seller_id').eq('id', id).single();
  if (!existing) return res.status(404).json({ error: 'ไม่พบ prompt' });
  if (existing.seller_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไข' });
  }

  const { title, description, category, tech_stack, price, prompt_content, demo_url, preview_text, tags } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (tech_stack !== undefined) updates.tech_stack = tech_stack;
  if (price !== undefined) {
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      return res.status(400).json({ error: 'ราคาต้องเป็นตัวเลข 0 บาทขึ้นไป' });
    }
    updates.price = priceValue;
  }
  if (prompt_content !== undefined) updates.prompt_content = prompt_content;
  if (demo_url !== undefined) updates.demo_url = demo_url;
  if (preview_text !== undefined) updates.preview_text = preview_text;
  if (tags !== undefined) updates.tags = tags;
  updates.updated_at = new Date().toISOString();
  updates.status = 'pending'; // ต้อง approve ใหม่หลังแก้ไข

  const { data, error } = await supabaseAdmin
    .from('prompts').update(updates).eq('id', id).select('id, title, status').single();

  if (error) return res.status(500).json({ error: 'แก้ไขไม่สำเร็จ' });
  res.json({ prompt: data });
}

async function deletePrompt(req, res, id) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { data: existing } = await supabaseAdmin
    .from('prompts').select('seller_id').eq('id', id).single();
  if (!existing) return res.status(404).json({ error: 'ไม่พบ prompt' });
  if (existing.seller_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบ' });
  }

  await supabaseAdmin.from('prompts').delete().eq('id', id);
  res.json({ success: true });
}
