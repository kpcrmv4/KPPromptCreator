const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return getReviews(req, res);
  if (req.method === 'POST') return createReview(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function getReviews(req, res) {
  const { prompt_id, page = 1, limit = 20 } = req.query;
  if (!prompt_id) return res.status(400).json({ error: 'กรุณาระบุ prompt_id' });

  const offset = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, comment, created_at, buyer:users!buyer_id(display_name, avatar_url)', { count: 'exact' })
    .eq('prompt_id', prompt_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ reviews: data, total: count });
}

async function createReview(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { order_id, prompt_id, rating, comment } = req.body;
  const err = validateRequired(req.body, ['order_id', 'prompt_id', 'rating']);
  if (err) return res.status(400).json({ error: err });

  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'คะแนนต้องอยู่ระหว่าง 1-5' });

  // Verify order belongs to user
  const { data: order } = await supabaseAdmin
    .from('orders').select('id, buyer_id').eq('id', order_id).single();
  if (!order || order.buyer_id !== user.id) {
    return res.status(403).json({ error: 'ต้องซื้อก่อนจึงจะรีวิวได้' });
  }

  // Check existing review
  const { data: existing } = await supabaseAdmin
    .from('reviews').select('id').eq('order_id', order_id).single();
  if (existing) return res.status(409).json({ error: 'รีวิวคำสั่งซื้อนี้แล้ว' });

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({ order_id, buyer_id: user.id, prompt_id, rating: Number(rating), comment })
    .select('id, rating, comment, created_at')
    .single();

  if (error) return res.status(500).json({ error: 'สร้างรีวิวไม่สำเร็จ' });
  res.status(201).json({ review: data });
}
