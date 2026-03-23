const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireRole(req, res, ['seller', 'admin']);
  if (!user) return;

  const { prompt_id, image_base64, filename, sort_order } = req.body;

  if (!prompt_id || !image_base64 || !filename) {
    return res.status(400).json({ error: 'กรุณาส่ง prompt_id, image_base64 และ filename' });
  }

  // ตรวจสอบว่า prompt เป็นของ seller คนนี้
  const { data: prompt } = await supabaseAdmin
    .from('prompts')
    .select('id, seller_id')
    .eq('id', prompt_id)
    .single();

  if (!prompt) return res.status(404).json({ error: 'ไม่พบ prompt' });
  if (prompt.seller_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์อัปโหลดรูปให้ prompt นี้' });
  }

  // ตรวจสอบจำนวนรูปที่มีอยู่ (จำกัด 5 รูปต่อ prompt)
  const { count } = await supabaseAdmin
    .from('prompt_images')
    .select('id', { count: 'exact', head: true })
    .eq('prompt_id', prompt_id);

  if (count >= 5) {
    return res.status(400).json({ error: 'อัปโหลดได้สูงสุด 5 รูปต่อ Prompt' });
  }

  // ตรวจสอบ file type
  const ext = filename.split('.').pop().toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return res.status(400).json({ error: 'รองรับเฉพาะไฟล์ jpg, png, webp, gif' });
  }

  // แปลง base64 เป็น Buffer
  const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // ตรวจสอบขนาด (5MB max)
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' });
  }

  // Upload ไปที่ Supabase Storage
  const filePath = `${user.id}/${prompt_id}/${Date.now()}_${filename}`;
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('prompt-images')
    .upload(filePath, buffer, {
      contentType,
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return res.status(500).json({ error: 'อัปโหลดรูปไม่สำเร็จ' });
  }

  // สร้าง public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('prompt-images')
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;

  // บันทึกลง prompt_images table
  const { data: imageRecord, error: dbError } = await supabaseAdmin
    .from('prompt_images')
    .insert({
      prompt_id,
      image_url: imageUrl,
      sort_order: sort_order || 0
    })
    .select('id, image_url, sort_order')
    .single();

  if (dbError) {
    return res.status(500).json({ error: 'บันทึกข้อมูลรูปไม่สำเร็จ' });
  }

  res.status(201).json({ image: imageRecord });
};
