const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');
const { verifyKPFingerprint, generateContentHash, calculateSimilarity } = require('../../lib/prompt-verify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return listPrompts(req, res);
  if (req.method === 'POST') return createPrompt(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listPrompts(req, res) {
  const { category, search, sort, seller_id } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('prompts')
    .select('id, title, description, category, tech_stack, price, preview_text, preview_image_url, tags, status, view_count, purchase_count, avg_rating, created_at, seller:users!seller_id(id, display_name, avatar_url)', { count: 'exact' })
    .eq('status', 'approved');

  if (seller_id) query = query.eq('seller_id', seller_id);
  if (category === 'free') query = query.eq('price', 0);
  else if (category) query = query.eq('category', category);
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
  const user = await requireAuth(req, res);
  if (!user) return;

  const { title, description, category, tech_stack, price, prompt_file_base64, prompt_filename, preview_image_base64, preview_image_filename, demo_url, preview_text, tags, detail_images } = req.body;
  const err = validateRequired(req.body, ['title', 'description', 'category', 'price', 'prompt_file_base64', 'prompt_filename']);
  if (err) return res.status(400).json({ error: err });

  const priceValue = Number(price);
  if (!Number.isFinite(priceValue) || priceValue < 0) {
    return res.status(400).json({ error: 'ราคาต้องเป็นตัวเลข 0 บาทขึ้นไป' });
  }

  // ===== 0. ตรวจสอบไฟล์ .md =====
  const fileExt = prompt_filename.split('.').pop().toLowerCase();
  if (!['md', 'txt'].includes(fileExt)) {
    return res.status(400).json({ error: 'รองรับเฉพาะไฟล์ .md หรือ .txt' });
  }

  // ถอด base64 prefix ถ้ามี แล้วแปลงเป็น text
  const base64Clean = prompt_file_base64.replace(/^data:[^;]+;base64,/, '');
  const prompt_content = Buffer.from(base64Clean, 'base64').toString('utf-8');

  if (!prompt_content.trim()) {
    return res.status(400).json({ error: 'ไฟล์ prompt ว่างเปล่า' });
  }

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
    .neq('seller_id', user.id)
    .in('status', ['approved', 'pending'])
    .limit(100);

  let similarPrompt = null;
  const SIMILARITY_THRESHOLD = 0.7;

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

  // ===== 5. อัปโหลดไฟล์ .md ไป Storage =====
  const fileBuffer = Buffer.from(base64Clean, 'base64');
  const filePath = `${user.id}/${Date.now()}_${prompt_filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('prompt-files')
    .upload(filePath, fileBuffer, {
      contentType: 'text/markdown',
      upsert: false
    });

  if (uploadError) {
    console.error('Prompt file upload error:', uploadError);
    return res.status(500).json({ error: 'อัปโหลดไฟล์ prompt ไม่สำเร็จ' });
  }

  // สร้าง signed URL (private bucket)
  const { data: signedData } = await supabaseAdmin.storage
    .from('prompt-files')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

  const prompt_file_url = signedData?.signedUrl || filePath;

  // ===== 6. อัปโหลดรูป preview (ถ้ามี) =====
  let preview_image_url = null;
  if (preview_image_base64 && preview_image_filename) {
    const imgExt = preview_image_filename.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(imgExt)) {
      return res.status(400).json({ error: 'รูป preview รองรับเฉพาะ jpg, png, webp, gif' });
    }

    const imgBase64 = preview_image_base64.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(imgBase64, 'base64');

    if (imgBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'รูป preview ต้องมีขนาดไม่เกิน 5MB' });
    }

    const imgPath = `${user.id}/preview_${Date.now()}_${preview_image_filename}`;
    const contentType = `image/${imgExt === 'jpg' ? 'jpeg' : imgExt}`;

    const { error: imgUploadError } = await supabaseAdmin.storage
      .from('prompt-images')
      .upload(imgPath, imgBuffer, { contentType, upsert: false });

    if (!imgUploadError) {
      const { data: imgUrlData } = supabaseAdmin.storage
        .from('prompt-images')
        .getPublicUrl(imgPath);
      preview_image_url = imgUrlData.publicUrl;
    }
  }

  // ===== 7. สร้าง prompt =====
  const promptData = {
    seller_id: user.id,
    title, description, category,
    tech_stack: tech_stack || [],
    price: priceValue,
    prompt_content,
    prompt_file_url: filePath,  // เก็บ path สำหรับ download ผ่าน API
    preview_image_url,
    demo_url,
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

  // ===== 8. อัปโหลดรูปรายละเอียด (detail_images, สูงสุด 5 รูป) =====
  if (detail_images && Array.isArray(detail_images)) {
    const maxImages = Math.min(detail_images.length, 5);
    for (let i = 0; i < maxImages; i++) {
      const img = detail_images[i];
      if (!img.image_base64 || !img.filename) continue;

      const dImgExt = img.filename.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(dImgExt)) continue;

      const dImgBase64 = img.image_base64.replace(/^data:image\/\w+;base64,/, '');
      const dImgBuffer = Buffer.from(dImgBase64, 'base64');
      if (dImgBuffer.length > 5 * 1024 * 1024) continue;

      const dImgPath = `${user.id}/${data.id}/${Date.now()}_${img.filename}`;
      const dContentType = `image/${dImgExt === 'jpg' ? 'jpeg' : dImgExt}`;

      const { error: dUploadError } = await supabaseAdmin.storage
        .from('prompt-images')
        .upload(dImgPath, dImgBuffer, { contentType: dContentType, upsert: false });

      if (!dUploadError) {
        const { data: dUrlData } = supabaseAdmin.storage
          .from('prompt-images')
          .getPublicUrl(dImgPath);

        await supabaseAdmin.from('prompt_images').insert({
          prompt_id: data.id,
          image_url: dUrlData.publicUrl,
          sort_order: i
        });
      }
    }
  }

  // ===== 9. สร้าง response พร้อม warnings =====
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
