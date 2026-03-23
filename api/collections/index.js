const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('*, saved_prompts(count)')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const collections = (data || []).map(c => ({
      ...c,
      prompt_count: c.saved_prompts?.[0]?.count || 0
    }));

    return res.json({ collections });
  }

  if (req.method === 'POST') {
    const { name, description, color } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'กรุณาตั้งชื่อคอลเล็คชั่น' });

    const { data: existing } = await supabaseAdmin
      .from('collections')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single();

    if (existing) return res.status(409).json({ error: 'มีชื่อคอลเล็คชั่นนี้แล้ว' });

    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description || '',
        color: color || '#6366f1'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ collection: data });
  }

  if (req.method === 'PUT') {
    const { collection_id, name, description, color } = req.body || {};
    if (!collection_id) return res.status(400).json({ error: 'ระบุ collection_id' });

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('collections')
      .update(updates)
      .eq('id', collection_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ collection: data });
  }

  if (req.method === 'DELETE') {
    const { collection_id } = req.query;
    if (!collection_id) return res.status(400).json({ error: 'ระบุ collection_id' });

    const { error } = await supabaseAdmin
      .from('collections')
      .delete()
      .eq('id', collection_id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'ลบคอลเล็คชั่นสำเร็จ' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
