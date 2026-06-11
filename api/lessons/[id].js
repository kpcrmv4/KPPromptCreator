// GET  /api/lessons/[id] — full lesson content (gated)
// POST /api/lessons/[id] — mark/unmark lesson complete (body: { completed: boolean })
// Access rules:
//   1. lesson.is_free_preview = true     → ทุกคนอ่านได้
//   2. user.role = 'admin'               → อ่านได้หมด (รวม unpublished)
//   3. user enrolled ใน lesson.course    → อ่านได้
//   4. อื่น ๆ                            → 403

const { supabaseAdmin } = require('../../lib/supabase');
const { authenticate, requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

// คำนวณ % จากบทที่ published เท่านั้น แล้ว sync ลง enrollments.progress_pct
async function recomputeProgress(enrollmentId, courseId) {
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_published', true);
  const publishedIds = new Set((lessons || []).map((l) => l.id));

  const { data: done } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id')
    .eq('enrollment_id', enrollmentId);
  const completedIds = (done || []).map((d) => d.lesson_id).filter((id) => publishedIds.has(id));

  const pct = publishedIds.size > 0
    ? Math.round((completedIds.length / publishedIds.size) * 100)
    : 0;

  await supabaseAdmin
    .from('enrollments')
    .update({ progress_pct: pct })
    .eq('id', enrollmentId);

  return { progress_pct: pct, completed_lesson_ids: completedIds };
}

async function handleMarkComplete(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });

  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, course_id, is_published')
    .eq('id', id)
    .single();
  if (!lesson || !lesson.is_published) return res.status(404).json({ error: 'ไม่พบบทเรียน' });

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.course_id)
    .maybeSingle();
  // admin ที่ดูคอร์สโดยไม่ enroll → ไม่มีอะไรให้บันทึก
  if (!enrollment) return res.status(403).json({ error: 'กรุณาซื้อคอร์สก่อนเข้าเรียน' });

  const completed = req.body?.completed !== false;
  if (completed) {
    await supabaseAdmin
      .from('lesson_progress')
      .upsert(
        { enrollment_id: enrollment.id, lesson_id: id },
        { onConflict: 'enrollment_id,lesson_id', ignoreDuplicates: true }
      );
  } else {
    await supabaseAdmin
      .from('lesson_progress')
      .delete()
      .eq('enrollment_id', enrollment.id)
      .eq('lesson_id', id);
  }

  const progress = await recomputeProgress(enrollment.id, lesson.course_id);
  res.json({ completed, ...progress });
}

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method === 'POST') return handleMarkComplete(req, res);
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
      content_md, code_snippets, image_urls, quiz, estimated_minutes,
      is_free_preview, is_published, is_core, is_quick_path,
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

  // navigation — prev/next ตามสิทธิ์ของ user + filter track
  // ต้อง sort ตาม module.sort_order ก่อน แล้วค่อย lesson.sort_order
  // (ไม่งั้นทุก lesson ที่ sort_order=1 จะปนกันเพราะ Postgres ไม่มี tie-break)
  const track = (req.query.track || 'all').toLowerCase();
  const { data: siblings } = await supabaseAdmin
    .from('lessons')
    .select('id, sort_order, is_published, is_free_preview, is_core, is_quick_path, module:course_modules!module_id(sort_order)')
    .eq('course_id', lesson.course_id);

  const ordered = (siblings || []).slice().sort((a, b) => {
    const mA = a.module?.sort_order ?? 0;
    const mB = b.module?.sort_order ?? 0;
    if (mA !== mB) return mA - mB;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const accessible = ordered.filter((l) => {
    if (!l.is_published && !isAdmin) return false;
    // track filter — กัน prev/next กระโดดข้ามไป lesson นอก track
    if (track === 'quick' && !l.is_quick_path && l.id !== id) return false;
    if (track === 'core' && !l.is_core && l.id !== id) return false;
    // access gate
    if (isAdmin || enrolled) return true;
    return l.is_free_preview;
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
