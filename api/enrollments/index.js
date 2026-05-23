// GET /api/enrollments — list courses ที่ user ลงทะเบียน

const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id, enrolled_at, progress_pct, last_lesson_id, last_seen_at,
      course:courses!course_id (
        id, slug, title, subtitle, cover_image_url,
        total_modules, total_lessons, estimated_hours
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  }

  res.json({ enrollments: data });
};
