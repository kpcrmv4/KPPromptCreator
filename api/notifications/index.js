const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return getNotifications(req, res);
  if (req.method === 'PUT') return markRead(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function getNotifications(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { unread_only } = req.query;

  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unread_only === 'true') query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });

  // นับจำนวนยังไม่อ่าน
  const { count: unreadCount } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  res.json({ notifications: data, unread_count: unreadCount || 0 });
}

async function markRead(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { notification_id, mark_all } = req.body;

  if (mark_all) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  } else if (notification_id) {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', user.id);
  }

  res.json({ success: true });
}
