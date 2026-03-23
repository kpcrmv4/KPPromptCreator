const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole, authenticate } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');
const { verifyKPFingerprint, generateContentHash, calculateSimilarity } = require('../../lib/prompt-verify');

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

  // ===== 1. ตรวจสอบ KP Fingerprint =====
  const verification = verifyKPFingerprint(prompt_content);
  let kp_verified = verification.valid;
  let kp_signature = verification.valid ? verification.signature : null;

  // ===== 2. สร้าง content hash =====
  const content_hash = generateContentHash(prompt_content);

  // ===== 3. เช็คว่า content hash ซ้ำกับที่มีอยู่แล้วหรือไม่ (exact match) =====
  const { data: exactDuplicate } = await supabaseAdmin
    .from('prompts')
    .select('id, title, seller_id, seller:users!seller_id(display_name)')
    .eq('content_hash', content_hash)
    .single();

  if (exactDuplicate) {
    const isOwnPrompt = exactDuplicate.seller_id === user.id;
    return res.status(409).json({
      error: isOwnPrompt
        ? `เนื้อหานี้ซ้ำกับ Prompt "${exactDuplicate.title}" ของคุณ`
        : `เนื้อหานี้ซ้ำกับ Prompt ที่มีอยู่แล้วในระบบ`,
      duplicate: true,
      duplicate_prompt_id: exactDuplicate.id
    });
  }

  // ===== 4. เช็ค similarity กับ prompts อื่น (ป้องกัน copy เปลี่ยนนิดหน่อย) =====
  const { data: existingPrompts } = await supabaseAdmin
    .from('prompts')
    .select('id, title, prompt_content, seller_id, seller:users!seller_id(display_name)')
    .neq('seller_id', user.id)  // ไม่ต้องเช็คกับของตัวเอง
    .in('status', ['approved', 'pending'])
    .limit(100);  // เช็ค 100 prompt ล่าสุด

  let similarPrompt = null;
  const SIMILARITY_THRESHOLD = 0.7; // 70% ขึ้นไป = น่าสงสัย

  if (existingPrompts) {
    for (const existing of existingPrompts) {
      const similarity = calculateSimilarity(prompt_content, existing.prompt_content);
      if (similarity >= SIMILARITY_THRESHOLD) {
        similarPrompt = {
          id: existing.id,
          title: existing.title,
          seller_name: existing.seller?.display_name,
          similarity: Math.round(similarity * 100)
        };
        break;
      }
    }
  }

  // ===== 5. สร้าง prompt =====
  const promptData = {
    seller_id: user.id,
    title, description, category,
    tech_stack: tech_stack || [],
    price: Number(price),
    prompt_content, demo_url,
    preview_text: preview_text || description.substring(0, 200),
    tags: tags || [],
    content_hash,
    kp_signature,
    status: 'pending'
  };

  const { data, error } = await supabaseAdmin
    .from('prompts')
    .insert(promptData)
    .select('id, title, status, created_at')
    .single();

  if (error) return res.status(500).json({ error: 'สร้าง prompt ไม่สำเร็จ' });

  // ===== 6. สร้าง response พร้อม warnings =====
  const warnings = [];
  if (!kp_verified) {
    warnings.push('ไม่พบ KP Signature — ไฟล์นี้อาจไม่ได้สร้างจาก KP Prompt Creator');
  }
  if (similarPrompt) {
    warnings.push(`เนื้อหาคล้ายกับ "${similarPrompt.title}" ของ ${similarPrompt.seller_name} (${similarPrompt.similarity}%) — Admin จะตรวจสอบเพิ่มเติม`);
  }

  res.status(201).json({
    prompt: data,
    kp_verified,
    warnings: warnings.length > 0 ? warnings : undefined
  });
}
