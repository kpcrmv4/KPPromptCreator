const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return getSettings(req, res);
  if (req.method === 'PUT') return updateSettings(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function getSettings(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { data, error } = await supabaseAdmin.from('settings').select('key, value');
  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });

  const settings = {};
  data.forEach(s => { settings[s.key] = s.value; });
  res.json({ settings });
}

async function updateSettings(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'กรุณาส่ง settings เป็น object' });
  }

  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString()
  }));

  for (const item of updates) {
    await supabaseAdmin.from('settings').upsert(item);
  }

  res.json({ success: true, message: 'อัปเดตการตั้งค่าสำเร็จ' });
}
