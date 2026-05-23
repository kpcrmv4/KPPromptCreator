// Admin: update course meta (status, title, price, preview_lesson_count, ...)
// GET /api/admin/courses              — list ALL courses (including draft/archived)
// PATCH /api/admin/courses?id=<uuid>  — update course fields
// POST /api/admin/courses             — create new course

const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

const UPDATABLE = [
  'title','subtitle','description','cover_image_url','trailer_url',
  'price','level','language','estimated_hours',
  'preview_lesson_count','status','tags','meta'
];

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  if (req.method === 'GET') return listCourses(req, res);
  if (req.method === 'PATCH') return updateCourse(req, res);
  if (req.method === 'POST') return createCourse(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listCourses(_req, res) {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('id, slug, title, subtitle, price, status, total_modules, total_lessons, enrollment_count, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ courses: data });
}

async function updateCourse(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });

  const patch = {};
  for (const k of UPDATABLE) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'no fields to update' });

  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ course: data });
}

async function createCourse(req, res) {
  const { slug, title, price = 999, description = '', subtitle = '' } = req.body || {};
  if (!slug || !title) return res.status(400).json({ error: 'slug + title required' });
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({ slug, title, price, description, subtitle, status: 'draft' })
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ course: data });
}
