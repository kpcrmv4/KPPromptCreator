// GET /api/courses/[slug] — single course + modules + lesson outline (no content_md)
// Public. ถ้า user login + enrolled → ใส่ field `enrolled: true` + last_lesson_id

const { supabaseAdmin } = require('../../lib/supabase');
const { authenticate } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'missing slug' });

  // ตรวจ user (optional)
  const user = await authenticate(req).catch(() => null);
  const isAdmin = user?.role === 'admin';

  // Course
  const { data: course, error: courseErr } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single();

  if (courseErr || !course) return res.status(404).json({ error: 'ไม่พบคอร์ส' });
  if (course.status !== 'published' && !isAdmin) {
    return res.status(404).json({ error: 'ไม่พบคอร์ส' });
  }

  // Modules
  const { data: modules } = await supabaseAdmin
    .from('course_modules')
    .select('id, sort_order, title, description')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });

  // Lessons (outline only — no content_md / code / images)
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, module_id, sort_order, title, summary, estimated_minutes, is_free_preview, is_published, is_core, is_quick_path')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });

  // Group lessons under modules
  const lessonsByModule = {};
  for (const l of lessons || []) {
    if (!l.is_published && !isAdmin) continue;
    (lessonsByModule[l.module_id] ||= []).push(l);
  }
  const modulesWithLessons = (modules || []).map((m) => ({
    ...m,
    lessons: lessonsByModule[m.id] || [],
  }));

  // Enrollment status
  let enrolled = false;
  let last_lesson_id = null;
  let progress_pct = 0;
  let completed_lesson_ids = [];
  if (user) {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, last_lesson_id, progress_pct')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();
    if (enrollment) {
      enrolled = true;
      last_lesson_id = enrollment.last_lesson_id;
      progress_pct = enrollment.progress_pct;

      const { data: done } = await supabaseAdmin
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id);
      completed_lesson_ids = (done || []).map((d) => d.lesson_id);
    }
  }

  res.json({
    course,
    modules: modulesWithLessons,
    enrolled,
    is_admin: isAdmin,
    last_lesson_id,
    progress_pct,
    completed_lesson_ids,
  });
};
