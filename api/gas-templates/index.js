const { supabase } = require('../../lib/supabase');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { category, mode } = req.query;

  let query = supabase
    .from('gas_templates')
    .select('id, code, name, name_en, description, category, base_price_mode_a, base_price_mode_b, forced_mode, preview_image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    console.error('[gas-templates]', error);
    return res.status(500).json({ error: 'โหลด template ไม่สำเร็จ' });
  }

  // Filter Mode A only if requested
  let templates = data;
  if (mode === 'A') {
    templates = data.filter(t => t.forced_mode !== 'B');
  }

  res.json({ templates });
};
