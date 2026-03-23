const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth, hashPassword, verifyPassword } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { display_name, bio, current_password, new_password } = req.body;

  // อัปเดตโปรไฟล์
  if (display_name || bio !== undefined) {
    const updates = {};
    if (display_name) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    updates.updated_at = new Date().toISOString();

    await supabaseAdmin.from('users').update(updates).eq('id', user.id);
  }

  // เปลี่ยนรหัสผ่าน
  if (current_password && new_password) {
    if (new_password.length < 6) return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });

    const { data: fullUser } = await supabaseAdmin
      .from('users').select('password_hash').eq('id', user.id).single();

    if (!verifyPassword(current_password, fullUser.password_hash)) {
      return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const password_hash = hashPassword(new_password);
    await supabaseAdmin.from('users').update({ password_hash }).eq('id', user.id);
  }

  // ดึงข้อมูลล่าสุด
  const { data: updated } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, role, credit_balance, bio')
    .eq('id', user.id)
    .single();

  res.json({ user: updated });
};
