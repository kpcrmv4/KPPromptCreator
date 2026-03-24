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

  // Validate settings
  const validations = {
    commission_rate: (v) => { const n = parseFloat(v); return n >= 0 && n <= 100; },
    promptpay_number: (v) => !v || /^(0[0-9]{8,9}|[0-9]{13})$/.test(v),
    promptpay_name: (v) => !v || v.length <= 100,
    site_name: (v) => v && v.length > 0 && v.length <= 100
  };

  for (const [key, value] of Object.entries(settings)) {
    if (validations[key] && !validations[key](value)) {
      return res.status(400).json({ error: `ค่า ${key} ไม่ถูกต้อง` });
    }
  }

  const allowedKeys = ['commission_rate', 'promptpay_number', 'promptpay_name', 'site_name'];
  const updates = Object.entries(settings)
    .filter(([key]) => allowedKeys.includes(key))
    .map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));

  for (const item of updates) {
    await supabaseAdmin.from('settings').upsert(item);
  }

  res.json({ success: true, message: 'อัปเดตการตั้งค่าสำเร็จ' });
}
