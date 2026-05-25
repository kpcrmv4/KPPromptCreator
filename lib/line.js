/**
 * LINE Messaging API helper
 * docs: https://developers.line.biz/en/reference/messaging-api/
 *
 * Required env vars:
 *   LINE_CHANNEL_ACCESS_TOKEN
 *   LINE_CHANNEL_SECRET
 *   LINE_OA_BASIC_ID (e.g. '@kpgas')
 *   ADMIN_LINE_USER_IDS (comma-separated)
 */

const crypto = require('crypto');

const LINE_API = 'https://api.line.me/v2/bot';

function getToken() {
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!t) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set');
  return t;
}

/**
 * Push message ไปยัง user
 * @param {string} toUserId - LINE userId (U...)
 * @param {object|object[]} messages - message object หรือ array
 */
async function pushMessage(toUserId, messages) {
  if (!toUserId) {
    console.warn('[LINE push] no user id, skip');
    return null;
  }
  if (!Array.isArray(messages)) messages = [messages];

  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: toUserId, messages })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[LINE push] failed:', res.status, err);
    throw new Error(`LINE push failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Push ไปยัง admin user IDs ที่ตั้งใน env
 */
async function pushAdmins(messages) {
  const ids = (process.env.ADMIN_LINE_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    console.warn('[LINE pushAdmins] no admin IDs configured');
    return;
  }
  const results = await Promise.allSettled(ids.map(id => pushMessage(id, messages)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.warn(`[LINE push admin ${ids[i]}]`, r.reason?.message);
  });
}

/**
 * Reply ไปยัง user ผ่าน replyToken (จาก webhook)
 */
async function replyMessage(replyToken, messages) {
  if (!Array.isArray(messages)) messages = [messages];

  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ replyToken, messages })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[LINE reply] failed:', res.status, err);
    throw new Error(`LINE reply failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Verify webhook signature (X-Line-Signature header)
 */
function verifySignature(rawBody, signature) {
  if (!signature) return false;
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET || '')
    .update(rawBody)
    .digest('base64');
  return hash === signature;
}

/**
 * URL scheme for "Add OA + open chat with prefilled message"
 */
function buildOaMessageUrl(oaId, text) {
  return `https://line.me/R/oaMessage/${encodeURIComponent(oaId)}/?${encodeURIComponent(text)}`;
}

/**
 * QR URL ของ OA
 */
function buildOaQrUrl(oaId) {
  const cleanId = (oaId || '').replace('@', '');
  return `https://qr-official.line.me/sid/L/${cleanId}.png`;
}

module.exports = {
  pushMessage,
  pushAdmins,
  replyMessage,
  verifySignature,
  buildOaMessageUrl,
  buildOaQrUrl,
};
