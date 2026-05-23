// GET /api/courses — list published courses (public)

const { supabaseAdmin } = require('../../lib/supabase');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('id, slug, title, subtitle, cover_image_url, price, level, language, estimated_hours, total_modules, total_lessons, enrollment_count, tags, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'ดึงข้อมูลคอร์สไม่สำเร็จ' });
  }

  res.json({ courses: data });
};
