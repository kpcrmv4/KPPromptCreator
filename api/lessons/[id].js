// GET /api/lessons/[id] — full lesson content (gated)
// Access rules:
//   1. lesson.is_free_preview = true     → ทุกคนอ่านได้
//   2. user.role = 'admin'               → อ่านได้หมด (รวม unpublished)
//   3. user enrolled ใน lesson.course    → อ่านได้
//   4. อื่น ๆ                            → 403

const { supabaseAdmin } = require('../../lib/supabase');
const { authenticate } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });

  const user = await authenticate(req).catch(() => null);
  const isAdmin = user?.role === 'admin';

  // Lesson + course context
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select(`
      id, module_id, course_id, sort_order, title, summary,
      content_md, code_snippets, image_urls, estimated_minutes,
      is_free_preview, is_published,
      course:courses!course_id ( id, slug, title, status )
    `)
    .eq('id', id)
    .single();

  if (error || !lesson) return res.status(404).json({ error: 'ไม่พบบทเรียน' });

  // hide unpublished from non-admin
  if ((!lesson.is_published || lesson.course?.status !== 'published') && !isAdmin) {
    return res.status(404).json({ error: 'ไม่พบบทเรียน' });
  }

  // ตรวจ enrollment ก่อน — ใช้ทั้งกับ gate check และ navigation filter
  let enrolled = false;
  if (user && !isAdmin) {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .maybeSingle();
    enrolled = !!enrollment;

    if (enrolled) {
      // bump last_seen
      await supabaseAdmin
        .from('enrollments')
        .update({ last_lesson_id: id, last_seen_at: new Date().toISOString() })
        .eq('id', enrollment.id);
    }
  }

  // gate check
  if (!lesson.is_free_preview && !isAdmin && !enrolled) {
    if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    return res.status(403).json({ error: 'กรุณาซื้อคอร์สก่อนเข้าเรียน' });
  }

  // navigation — prev/next ตามสิทธิ์ของ user (กัน bypass ผ่านปุ่ม next/prev)
  const { data: siblings } = await supabaseAdmin
    .from('lessons')
    .select('id, sort_order, is_published, is_free_preview')
    .eq('course_id', lesson.course_id)
    .order('sort_order', { ascending: true });

  const accessible = (siblings || []).filter((l) => {
    if (!l.is_published && !isAdmin) return false;
    if (isAdmin || enrolled) return true;
    return l.is_free_preview;   // guest/non-enrolled — เฉพาะ free preview
  });
  const idx = accessible.findIndex((l) => l.id === id);
  const prev_lesson_id = idx > 0 ? accessible[idx - 1].id : null;
  const next_lesson_id = idx >= 0 && idx < accessible.length - 1 ? accessible[idx + 1].id : null;

  // remove embedded course before returning
  const { course, ...rest } = lesson;

  res.json({
    lesson: rest,
    course: course
      ? { id: course.id, slug: course.slug, title: course.title }
      : null,
    enrolled,
    is_admin: isAdmin,
    navigation: { prev_lesson_id, next_lesson_id },
  });
};
