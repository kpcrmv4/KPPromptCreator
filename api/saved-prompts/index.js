const crypto = require('crypto');
const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth, authenticate } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  // GET: list saved prompts (requires auth)
  if (req.method === 'GET') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { collection_id, source, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('saved_prompts')
      .select('*, collection:collections(id, name, color)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (collection_id) query = query.eq('collection_id', collection_id);
    if (source) query = query.eq('source', source);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ saved_prompts: data || [], total: count || 0 });
  }

  // POST: save a new prompt
  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const {
      title, content, target_ai, project_name,
      tech_stack, file_name, collection_id, source
    } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อและเนื้อหา Prompt' });
    }

    // Generate content hash
    const content_hash = crypto.createHash('sha256').update(content).digest('hex');

    // Extract KP signature if present
    const sigMatch = content.match(/<!-- Signature: (KP-[a-f0-9-]+) -->/);
    const kp_signature = sigMatch ? sigMatch[1] : null;

    const { data, error } = await supabaseAdmin
      .from('saved_prompts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content,
        target_ai: target_ai || '',
        project_name: project_name || '',
        tech_stack: tech_stack || [],
        kp_signature,
        content_hash,
        file_name: file_name || 'CLAUDE.md',
        source: source || 'creator',
        collection_id: collection_id || null
      })
      .select('*, collection:collections(id, name, color)')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ saved_prompt: data, message: 'บันทึก Prompt สำเร็จ!' });
  }

  // PUT: update saved prompt (move collection, rename)
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { saved_prompt_id, title, collection_id } = req.body || {};
    if (!saved_prompt_id) return res.status(400).json({ error: 'ระบุ saved_prompt_id' });

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (collection_id !== undefined) updates.collection_id = collection_id || null;

    const { data, error } = await supabaseAdmin
      .from('saved_prompts')
      .update(updates)
      .eq('id', saved_prompt_id)
      .eq('user_id', user.id)
      .select('*, collection:collections(id, name, color)')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ saved_prompt: data });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { saved_prompt_id } = req.query;
    if (!saved_prompt_id) return res.status(400).json({ error: 'ระบุ saved_prompt_id' });

    const { error } = await supabaseAdmin
      .from('saved_prompts')
      .delete()
      .eq('id', saved_prompt_id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'ลบสำเร็จ' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
