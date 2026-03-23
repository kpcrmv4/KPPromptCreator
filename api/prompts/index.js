const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole, authenticate } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return listPrompts(req, res);
  if (req.method === 'POST') return createPrompt(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listPrompts(req, res) {
  const { category, search, sort, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('prompts')
    .select('id, title, description, category, tech_stack, price, preview_text, tags, status, view_count, purchase_count, avg_rating, created_at, seller:users!seller_id(id, display_name, avatar_url)', { count: 'exact' })
    .eq('status', 'approved');

  if (category) query = query.eq('category', category);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else if (sort === 'popular') query = query.order('purchase_count', { ascending: false });
  else if (sort === 'rating') query = query.order('avg_rating', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });

  res.json({ prompts: data, total: count, page: Number(page), limit: Number(limit) });
}

async function createPrompt(req, res) {
  const user = await requireRole(req, res, ['seller', 'admin']);
  if (!user) return;

  const { title, description, category, tech_stack, price, prompt_content, demo_url, preview_text, tags } = req.body;
  const err = validateRequired(req.body, ['title', 'description', 'category', 'price', 'prompt_content']);
  if (err) return res.status(400).json({ error: err });

  const { data, error } = await supabaseAdmin
    .from('prompts')
    .insert({
      seller_id: user.id,
      title, description, category,
      tech_stack: tech_stack || [],
      price: Number(price),
      prompt_content, demo_url,
      preview_text: preview_text || description.substring(0, 200),
      tags: tags || [],
      status: 'pending'
    })
    .select('id, title, status, created_at')
    .single();

  if (error) return res.status(500).json({ error: 'สร้าง prompt ไม่สำเร็จ' });

  res.status(201).json({ prompt: data });
}
