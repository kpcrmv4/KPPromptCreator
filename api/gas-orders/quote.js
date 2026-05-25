/**
 * POST /api/gas-orders/quote
 * Server-side price calculator (mirror of client) — เผื่อ client ส่งราคา manipulated
 * รับ { template_code, addons[], delivery_method, training_addon, style }
 * คืน { total, tier, mode, breakdown[] }
 */

const { supabaseAdmin } = require('../../lib/supabase');
const { cors } = require('../../lib/helpers');

const FLOOR_PRICE = 499;
const TRAINING_PRICE = 300;
const SETUP_SERVICE_PRICE = 1200;

// Mirror of js/gas-builder.js ADDONS (keep in sync)
const ADDON_PRICES = {
  // arch
  'spa': 100, 'pwa': 200, 'dark-mode': 100, 'multi-lang': 200,
  // auth (uniform +300, no-auth = 0, phone-otp removed)
  'no-auth': 0, 'google-oauth': 300, 'line-login': 300, 'email-password': 300,
  // role (consolidated to single option)
  'role-permission': 300,
  // integration (sms-thai + webhook-out removed)
  'line-push': 500, 'line-bot': 1000, 'telegram-bot': 400, 'email-send': 400,
  'promptpay': 500, 'slip-verify': 700, 'google-calendar': 500, 'google-drive-upload': 300,
  'google-maps': 500,
  // feature
  'charts': 500, 'view-calendar': 400, 'view-kanban': 400, 'view-map': 600,
  'file-upload': 400, 'image-gallery': 300, 'camera-capture': 500, 'barcode-scan': 700,
  'signature-pad': 500, 'pdf-export': 500, 'excel-export': 300, 'csv-import': 400,
  'approval-workflow': 1000, 'notification-center': 500, 'audit-log': 500, 'gps-checkin': 500,
  // ai
  'ai-chat': 1500, 'ai-search': 1000, 'ai-summary': 800, 'ai-ocr': 1200,
};

// Keep in sync with js/gas-builder.js ADDONS where forceMode='B'
// Reason: features ที่ทำงานใน HtmlService ของ GAS ไม่ได้จริง
const FORCE_MODE_B_ADDONS = new Set([
  'pwa',                              // Service Worker
  'line-login', 'email-password',     // auth flow ที่ HtmlService ทำได้ลำบาก
  'google-maps', 'view-map',          // Maps SDK + billing friction
  'camera-capture', 'barcode-scan',   // camera blocked in HtmlService
  'ai-chat', 'ai-search',             // streaming + 6min execution limit
]);

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { template_code, addons = [], delivery_method, training_addon, style } = req.body;

  if (!template_code) return res.status(400).json({ error: 'template_code required' });

  // Lookup template
  const { data: tpl, error } = await supabaseAdmin
    .from('gas_templates')
    .select('code, base_price_mode_a, base_price_mode_b, forced_mode')
    .eq('code', template_code)
    .single();

  if (error || !tpl) return res.status(404).json({ error: 'template not found' });

  // Detect mode
  let mode = tpl.forced_mode || 'A';
  for (const code of addons) {
    if (FORCE_MODE_B_ADDONS.has(code)) {
      mode = 'B';
      break;
    }
  }

  // Base
  const basePrice = mode === 'A'
    ? (tpl.base_price_mode_a || tpl.base_price_mode_b)
    : tpl.base_price_mode_b;

  const breakdown = [{ label: `Template (${tpl.code})`, price: basePrice }];

  // Addons
  for (const code of addons) {
    const price = ADDON_PRICES[code];
    if (price !== undefined && price > 0) {
      breakdown.push({ label: code, price });
    }
  }

  // Style: dark mode
  if (style?.dark_mode && !addons.includes('dark-mode')) {
    breakdown.push({ label: 'dark-mode', price: ADDON_PRICES['dark-mode'] });
  }

  // Training
  if (training_addon) breakdown.push({ label: 'training-30min', price: TRAINING_PRICE });

  // Setup service
  if (delivery_method === 'mode-b-setup-service') {
    breakdown.push({ label: 'setup-service-google-cloud', price: SETUP_SERVICE_PRICE });
  }

  // Sum + floor
  const sum = breakdown.reduce((s, i) => s + i.price, 0);
  const total = Math.max(sum, FLOOR_PRICE);
  const tier = total <= 799 ? 'starter' : total <= 1500 ? 'standard' : 'pro';

  res.json({ total, tier, mode, breakdown });
};
