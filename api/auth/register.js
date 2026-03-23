const { supabaseAdmin } = require('../../lib/supabase');
const { createToken } = require('../../lib/auth');
const { cors, validateRequired } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, display_name } = req.body;
  const err = validateRequired(req.body, ['email', 'password', 'display_name']);
  if (err) return res.status(400).json({ error: err });

  if (password.length < 6) return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });

  const userRole = 'user';

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name, role: userRole }
    });

    if (authError) {
      console.error('Register auth error:', authError.message);
      if (authError.message.includes('already') || authError.message.includes('exists')) {
        return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }
      return res.status(500).json({ error: 'สร้างบัญชีไม่สำเร็จ: ' + authError.message });
    }

    // 2. Insert profile in public.users with Supabase Auth ID
    const { data: user, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        password_hash: 'supabase-auth',
        display_name,
        role: userRole
      })
      .select('id, email, display_name, role, credit_balance')
      .single();

    if (profileError) {
      console.error('Register profile error:', profileError.message);
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'สร้างบัญชีไม่สำเร็จ' });
    }

    const token = createToken({ sub: user.id, role: user.role });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register unexpected error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
};
