const { supabaseAdmin } = require('./supabase');

/**
 * ส่ง notification ให้ user
 */
async function sendNotification({ user_id, type, title, message, ref_id, ref_type }) {
  await supabaseAdmin.from('notifications').insert({
    user_id, type, title, message, ref_id, ref_type
  });
}

/**
 * ส่ง notification ให้ admin ทุกคน
 */
async function notifyAdmins({ type, title, message, ref_id, ref_type }) {
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('status', 'active');

  if (!admins || admins.length === 0) return;

  const notifications = admins.map(admin => ({
    user_id: admin.id,
    type, title, message, ref_id, ref_type
  }));

  await supabaseAdmin.from('notifications').insert(notifications);
}

module.exports = { sendNotification, notifyAdmins };
