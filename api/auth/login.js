const { supabaseAdmin } = require('../../lib/supabase');
const { verifyPassword, createToken } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, display_name, role, credit_balance, status')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Login DB error:', error.message, error.code);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
    }

    if (!user) return res.status(401).json({ error: 'ไม่พบบัญชีนี้ กรุณาสมัครสมาชิกก่อน' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'บัญชีถูกระงับ' });

    const valid = verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

    const token = createToken({ sub: user.id, role: user.role });

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login unexpected error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
};
