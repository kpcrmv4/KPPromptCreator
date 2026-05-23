// Admin: lesson CRUD + module CRUD
//
// Lessons:
//   GET    /api/admin/lessons?course_id=<uuid>          — list all lessons in course (incl. unpublished)
//   POST   /api/admin/lessons                            — create lesson
//   PATCH  /api/admin/lessons?id=<uuid>                  — update lesson fields
//   DELETE /api/admin/lessons?id=<uuid>                  — delete lesson
//
// Modules (sub-routes via ?action=module):
//   POST   /api/admin/lessons?action=module               — create module
//   PATCH  /api/admin/lessons?action=module&id=<uuid>     — update module
//   DELETE /api/admin/lessons?action=module&id=<uuid>     — delete module
//
// After mutations: recompute course.total_lessons + course.total_modules

const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

const LESSON_FIELDS = [
  'module_id','course_id','sort_order','title','summary','content_md',
  'code_snippets','image_urls','estimated_minutes','is_free_preview','is_published'
];
const MODULE_FIELDS = ['course_id','sort_order','title','description'];

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const isModule = req.query.action === 'module';

  if (req.method === 'GET' && !isModule) return listLessons(req, res);
  if (req.method === 'POST') return isModule ? createModule(req, res) : createLesson(req, res);
  if (req.method === 'PATCH') return isModule ? updateModule(req, res) : updateLesson(req, res);
  if (req.method === 'DELETE') return isModule ? deleteModule(req, res) : deleteLesson(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listLessons(req, res) {
  const { course_id } = req.query;
  if (!course_id) return res.status(400).json({ error: 'course_id required' });
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('course_id', course_id)
    .order('sort_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ lessons: data });
}

async function createLesson(req, res) {
  const body = pick(req.body || {}, LESSON_FIELDS);
  if (!body.module_id || !body.course_id || !body.title) {
    return res.status(400).json({ error: 'module_id + course_id + title required' });
  }
  if (body.sort_order == null) {
    // auto-pick next sort_order
    const { data: last } = await supabaseAdmin
      .from('lessons')
      .select('sort_order')
      .eq('module_id', body.module_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    body.sort_order = (last?.sort_order ?? 0) + 1;
  }
  body.code_snippets = body.code_snippets ?? [];
  body.image_urls = body.image_urls ?? [];

  const { data, error } = await supabaseAdmin.from('lessons').insert(body).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  await recomputeCourseTotals(body.course_id);
  res.status(201).json({ lesson: data });
}

async function updateLesson(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });
  const patch = pick(req.body || {}, LESSON_FIELDS);
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'no fields to update' });

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (data?.course_id) await recomputeCourseTotals(data.course_id);
  res.json({ lesson: data });
}

async function deleteLesson(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });
  const { data: lesson } = await supabaseAdmin.from('lessons').select('course_id').eq('id', id).single();
  const { error } = await supabaseAdmin.from('lessons').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  if (lesson?.course_id) await recomputeCourseTotals(lesson.course_id);
  res.json({ ok: true });
}

// --- modules ---
async function createModule(req, res) {
  const body = pick(req.body || {}, MODULE_FIELDS);
  if (!body.course_id || !body.title) return res.status(400).json({ error: 'course_id + title required' });
  if (body.sort_order == null) {
    const { data: last } = await supabaseAdmin
      .from('course_modules')
      .select('sort_order')
      .eq('course_id', body.course_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    body.sort_order = (last?.sort_order ?? 0) + 1;
  }
  const { data, error } = await supabaseAdmin.from('course_modules').insert(body).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  await recomputeCourseTotals(body.course_id);
  res.status(201).json({ module: data });
}

async function updateModule(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });
  const patch = pick(req.body || {}, MODULE_FIELDS);
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'no fields to update' });
  const { data, error } = await supabaseAdmin
    .from('course_modules')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ module: data });
}

async function deleteModule(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });
  const { data: mod } = await supabaseAdmin.from('course_modules').select('course_id').eq('id', id).single();
  const { error } = await supabaseAdmin.from('course_modules').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  if (mod?.course_id) await recomputeCourseTotals(mod.course_id);
  res.json({ ok: true });
}

// --- helpers ---
function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

async function recomputeCourseTotals(courseId) {
  const [{ count: lessonCount }, { count: moduleCount }] = await Promise.all([
    supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', courseId).eq('is_published', true),
    supabaseAdmin.from('course_modules').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
  ]);
  await supabaseAdmin
    .from('courses')
    .update({ total_lessons: lessonCount || 0, total_modules: moduleCount || 0 })
    .eq('id', courseId);
}
