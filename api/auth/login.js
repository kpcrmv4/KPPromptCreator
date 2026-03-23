const { supabaseAdmin } = require('../../lib/supabase');
const { createToken } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

  try {
    // 1. Authenticate via Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Login auth error:', authError.message);
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const authUser = authData.user;

    // 2. Fetch profile from public.users (by auth ID)
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, role, credit_balance, status')
      .eq('id', authUser.id)
      .single();

    // 3. If not found by ID, try by email (legacy record with different ID)
    if (!user) {
      const { data: legacyUser } = await supabaseAdmin
        .from('users')
        .select('id, email, display_name, role, credit_balance, status')
        .eq('email', authUser.email)
        .single();

      if (legacyUser) {
        // Update legacy record to use Supabase Auth ID
        await supabaseAdmin
          .from('users')
          .update({ id: authUser.id, password_hash: 'supabase-auth' })
          .eq('id', legacyUser.id);
        user = { ...legacyUser, id: authUser.id };
      }
    }

    // 4. If still no profile (e.g. admin created via Supabase dashboard), auto-create
    if (!user) {
      const displayName = authUser.user_metadata?.display_name || email.split('@')[0];
      const role = authUser.user_metadata?.role || 'admin';

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          password_hash: 'supabase-auth',
          display_name: displayName,
          role: role
        })
        .select('id, email, display_name, role, credit_balance, status')
        .single();

      if (createError) {
        console.error('Auto-create profile error:', createError.message, createError.code, createError.details);
        return res.status(500).json({ error: 'สร้างโปรไฟล์ไม่สำเร็จ: ' + createError.message });
      }
      user = newUser;
    }

    if (user.status === 'suspended') return res.status(403).json({ error: 'บัญชีถูกระงับ' });

    const token = createToken({ sub: user.id, role: user.role });
    res.json({ user, token });
  } catch (err) {
    console.error('Login unexpected error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
  }
};
