const { supabaseAdmin } = require('../../lib/supabase');
const { verifyPassword, createToken } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, password_hash, display_name, role, credit_balance, status')
    .eq('email', email)
    .single();

  if (!user || error) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'บัญชีถูกระงับ' });

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  const token = createToken({ sub: user.id, role: user.role });

  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, token });
};
