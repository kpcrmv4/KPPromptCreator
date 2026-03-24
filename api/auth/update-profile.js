const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { display_name, bio, promptpay_number, promptpay_name, current_password, new_password } = req.body;

  // อัปเดตโปรไฟล์
  if (display_name || bio !== undefined || promptpay_number !== undefined || promptpay_name !== undefined) {
    const updates = {};
    if (display_name) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (promptpay_number !== undefined) {
      // Validate: phone (0xxxxxxxxx) or national ID (13 digits)
      const num = promptpay_number.trim();
      if (num && !/^(0[0-9]{8,9}|[0-9]{13})$/.test(num)) {
        return res.status(400).json({ error: 'หมายเลขพร้อมเพย์ไม่ถูกต้อง (เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก)' });
      }
      updates.promptpay_number = num;
    }
    if (promptpay_name !== undefined) {
      updates.promptpay_name = promptpay_name.trim();
    }
    updates.updated_at = new Date().toISOString();

    await supabaseAdmin.from('users').update(updates).eq('id', user.id);
  }

  // เปลี่ยนรหัสผ่านผ่าน Supabase Auth
  if (current_password && new_password) {
    if (new_password.length < 6) return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });

    // ตรวจรหัสผ่านปัจจุบันโดย signIn
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: current_password
    });

    if (verifyError) {
      return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // อัปเดตรหัสผ่านใน Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: new_password
    });

    if (updateError) {
      console.error('Password update error:', updateError.message);
      return res.status(500).json({ error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
    }
  }

  // ดึงข้อมูลล่าสุด
  const { data: updated } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, role, credit_balance, bio, promptpay_number, promptpay_name')
    .eq('id', user.id)
    .single();

  res.json({ user: updated });
};
