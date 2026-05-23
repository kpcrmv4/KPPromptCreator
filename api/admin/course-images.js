// POST /api/admin/course-images — upload image to course-images bucket
// Returns the public URL ready to drop into lessons.image_urls or courses.cover_image_url

const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

const BUCKET = 'course-images';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { image_base64, filename, folder = 'lessons' } = req.body || {};
  if (!image_base64 || !filename) {
    return res.status(400).json({ error: 'image_base64 + filename required' });
  }

  const base64 = image_base64.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(base64, 'base64');
  if (buf.length > MAX_SIZE) return res.status(400).json({ error: 'ขนาดเกิน 10MB' });

  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
  const safeExt = ['jpg','jpeg','png','webp','gif'].includes(ext) ? ext : 'jpg';
  const contentType = `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`;
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buf, { contentType, upsert: false });
  if (uploadErr) return res.status(500).json({ error: 'อัปโหลดไม่สำเร็จ: ' + uploadErr.message });

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  res.status(201).json({ url: data.publicUrl, path });
};
