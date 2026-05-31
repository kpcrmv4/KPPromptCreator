const { supabaseAdmin } = require('./supabase');
const line = require('./line');

const SITE_URL = process.env.SITE_URL || 'https://kppromptcreator.tech';

/**
 * In-app notification (Supabase notifications table)
 */
async function sendNotification({ user_id, type, title, message, ref_id, ref_type, action_url, target_role }) {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id, type, title, message, ref_id, ref_type, action_url, target_role
    });
  } catch (e) {
    console.warn('[sendNotification]', e.message);
  }
}

async function notifyAdmins({ type, title, message, ref_id, ref_type, action_url }) {
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('status', 'active');

  if (!admins || admins.length === 0) return;

  const notifications = admins.map(admin => ({
    user_id: admin.id,
    type, title, message, ref_id, ref_type, action_url, target_role: 'admin',
  }));

  await supabaseAdmin.from('notifications').insert(notifications);
}

// ──────────────────────────────────────────────────────────
// GAS Builder — LINE-pushed notifications
// ──────────────────────────────────────────────────────────

/**
 * เมื่อ order ใหม่ submit → push admin (LINE)
 */
async function notifyOrderReceived(order) {
  const text = [
    `🔔 มี order ใหม่`,
    ``,
    `รหัส: ${order.order_number}`,
    `จาก: ${order.customer_name} (${order.customer_email})`,
    `LINE: ${order.line_basic_id || '-'}`,
    `ยอด: ฿${(order.price || 0).toLocaleString()}`,
    `แพ็ค: ${order.template_name || order.template_code} · Mode ${order.mode}`,
    `Delivery: ${order.delivery_method}`,
    ``,
    `ดู: ${SITE_URL}/admin-gas-orders.html?id=${order.id}`,
  ].join('\n');

  try {
    await line.pushAdmins({ type: 'text', text });
  } catch (e) {
    console.warn('[notifyOrderReceived LINE]', e.message);
  }

  // In-app
  await notifyAdmins({
    type: 'gas_order_received',
    title: `Order ใหม่ ${order.order_number}`,
    message: `${order.customer_name} · ฿${(order.price || 0).toLocaleString()}`,
    ref_id: order.id,
    ref_type: 'gas_order',
    action_url: `/admin-gas-orders.html?id=${order.id}`,
  });
}

/**
 * เมื่อ admin mark paid → push ลูกค้า
 */
async function notifyPaymentVerified(order) {
  const eta = etaForTier(order.tier);
  const text = [
    `✓ ยืนยันการชำระเงินแล้ว`,
    ``,
    `รหัส: ${order.order_number}`,
    `ยอด: ฿${(order.price || 0).toLocaleString()}`,
    ``,
    `เริ่มสร้างระบบให้คุณ — คาดส่งมอบใน ${eta} วันทำการ`,
    `ติดตามสถานะ: ${SITE_URL}/account.html`,
  ].join('\n');

  if (order.line_user_id) {
    try { await line.pushMessage(order.line_user_id, { type: 'text', text }); }
    catch (e) { console.warn('[notifyPaymentVerified LINE]', e.message); }
  }

  await sendNotification({
    user_id: order.user_id,
    type: 'gas_payment_verified',
    title: 'ยืนยันการชำระเงินแล้ว',
    message: `Order ${order.order_number} · เริ่มสร้างใน ${eta} วัน`,
    ref_id: order.id,
    ref_type: 'gas_order',
    target_role: 'user',
  });
}

/**
 * เมื่อระบบ generate OAuth install link สำหรับ Mode A · Done-For-You
 */
async function notifyOAuthNeeded(order, oauthUrl) {
  const text = [
    `📥 พร้อมติดตั้งระบบของคุณแล้ว`,
    ``,
    `รหัส: ${order.order_number}`,
    `ระบบ: ${order.project_name}`,
    ``,
    `👇 คลิก link เพื่อ authorize:`,
    oauthUrl,
    ``,
    `🔒 เราขอสิทธิ์เฉพาะที่จำเป็น (drive.file, script.projects)`,
    `⏰ link หมดอายุใน 24 ชม.`,
    `🗑 token จะถูกลบทันทีหลัง deploy`,
  ].join('\n');

  if (order.line_user_id) {
    try { await line.pushMessage(order.line_user_id, { type: 'text', text }); }
    catch (e) { console.warn('[notifyOAuthNeeded LINE]', e.message); }
  }

  await sendNotification({
    user_id: order.user_id,
    type: 'gas_oauth_needed',
    title: 'กรุณา authorize เพื่อติดตั้งระบบ',
    message: `Order ${order.order_number} — คลิก link ใน LINE`,
    ref_id: order.id,
    ref_type: 'gas_order',
    action_url: oauthUrl,
    target_role: 'user',
  });
}

/**
 * เมื่อ deploy เสร็จ
 */
async function notifyDelivered(project, order) {
  const url = project.vercel_url || project.gas_web_app_url;
  const text = [
    `🎉 ระบบของคุณพร้อมใช้งานแล้ว!`,
    ``,
    `ระบบ: ${project.project_name}`,
    `URL: ${url}`,
    project.sheet_url ? `Sheet: ${project.sheet_url}` : null,
    ``,
    `📖 คู่มือ: ${SITE_URL}/docs/FAQ-CUSTOMER`,
    `💬 มีคำถาม? ตอบกลับข้อความนี้ได้เลย`,
    ``,
    `ขอบคุณที่ใช้บริการ KP GAS Builder 🙏`,
  ].filter(Boolean).join('\n');

  if (order?.line_user_id) {
    try { await line.pushMessage(order.line_user_id, { type: 'text', text }); }
    catch (e) { console.warn('[notifyDelivered LINE]', e.message); }
  }

  await sendNotification({
    user_id: project.user_id,
    type: 'gas_delivered',
    title: 'ระบบพร้อมใช้งานแล้ว',
    message: `${project.project_name} → ${url}`,
    ref_id: project.id,
    ref_type: 'customer_project',
    action_url: url,
    target_role: 'user',
  });
}

function etaForTier(tier) {
  return tier === 'simple' || tier === 'starter' ? 2
       : tier === 'complex' || tier === 'pro' ? 5
       : 3;
}

module.exports = {
  sendNotification,
  notifyAdmins,
  notifyOrderReceived,
  notifyPaymentVerified,
  notifyOAuthNeeded,
  notifyDelivered,
};
