const { supabaseAdmin } = require('../../lib/supabase');
const { hashPassword, createToken } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, display_name, role } = req.body;
  const err = validateRequired(req.body, ['email', 'password', 'display_name']);
  if (err) return res.status(400).json({ error: err });

  if (password.length < 6) return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });

  const userRole = ['buyer', 'seller'].includes(role) ? role : 'buyer';

  // Check existing user
  const { data: existing } = await supabaseAdmin
    .from('users').select('id').eq('email', email).single();
  if (existing) return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });

  const password_hash = hashPassword(password);

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ email, password_hash, display_name, role: userRole })
    .select('id, email, display_name, role, credit_balance')
    .single();

  if (error) return res.status(500).json({ error: 'สร้างบัญชีไม่สำเร็จ' });

  const token = createToken({ sub: user.id, role: user.role });

  res.status(201).json({ user, token });
};
