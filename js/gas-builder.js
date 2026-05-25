/**
 * gas-builder.js — Wizard state management + pricing engine
 *
 * State stored in `state` object (also synced to localStorage for autosave)
 * Pricing engine: catalog-driven (ADDONS constant) — single source of truth
 * Mode A/B auto-detect based on selected add-ons
 */

// ──────────────────────────────────────────────────────────
// Catalog — single source of truth (match BUSINESS-MODEL.md)
// ──────────────────────────────────────────────────────────

const FLOOR_PRICE = 499;

/**
 * Each add-on: { code, label, price, group, forceMode, dependsOn }
 * forceMode: 'B' = บังคับใช้ Mode B ถ้าเลือก
 */
// forceMode='B' means: ฟีเจอร์นี้ใช้ใน HTMLService ของ GAS ไม่ได้ ต้องมี Vercel frontend
// bReason: คำอธิบาย (แสดงใน warning modal)
//
// หมายเหตุ: SPA / Alpine.js / multi-lang / Google APIs (Calendar/Drive/Sheet) / AI server call
// ทั้งหมดทำได้ใน HTMLService — ไม่ต้อง force B
const ADDONS = [
  // Architecture
  { code: 'spa', label: 'SPA (single-page, fast)', price: 100, group: 'arch' },
  { code: 'pwa', label: 'PWA + offline', price: 200, group: 'arch', forceMode: 'B', bReason: 'Service Worker ต้องการ domain จริง — HtmlService iframe sandbox ไม่รองรับ', dependsOn: 'spa' },
  { code: 'dark-mode', label: 'Dark mode (user toggle)', price: 100, group: 'arch' },
  { code: 'multi-lang', label: 'Multi-language TH/EN', price: 200, group: 'arch' },

  // Auth (radio — เลือกได้ 1, ราคา +฿300 เท่ากันทุกตัว ยกเว้น no-auth = ฟรี)
  { code: 'no-auth', label: 'ไม่ต้อง login', price: 0, group: 'auth', radio: true, default: true },
  { code: 'google-oauth', label: 'Google OAuth (built-in ใน Mode A)', price: 300, group: 'auth', radio: true },
  { code: 'line-login', label: 'LINE Login', price: 300, group: 'auth', radio: true, forceMode: 'B', bReason: 'LINE Console ไม่รับ script.google.com เป็น callback URL ที่ stable' },
  { code: 'email-password', label: 'Email/Password', price: 300, group: 'auth', radio: true, forceMode: 'B', bReason: 'auth flow ต้องการ session management ที่ HtmlService ไม่ครอบคลุม' },

  // Role/Permission (single option)
  { code: 'role-permission', label: 'Role-based access (admin/user/custom roles, row-level)', price: 300, group: 'role' },

  // Integration
  { code: 'line-push', label: 'LINE Push (Messaging API one-way)', price: 500, group: 'integration' },
  { code: 'line-bot', label: 'LINE Bot (Messaging API + webhook)', price: 1000, group: 'integration' },
  { code: 'telegram-bot', label: 'Telegram Bot', price: 400, group: 'integration' },
  { code: 'email-send', label: 'Email (SendGrid/Resend)', price: 400, group: 'integration' },
  { code: 'promptpay', label: 'PromptPay QR (รับเงิน)', price: 500, group: 'integration' },
  { code: 'slip-verify', label: 'Slip verify (Slip2Go)', price: 700, group: 'integration' },
  { code: 'google-calendar', label: 'Google Calendar sync', price: 500, group: 'integration' },
  { code: 'google-drive-upload', label: 'Google Drive upload', price: 300, group: 'integration' },
  { code: 'google-maps', label: 'Google Maps', price: 500, group: 'integration', forceMode: 'B', bReason: 'Google Maps SDK ใน iframe ของ HtmlService มี restriction หลายอย่าง + ต้องผูกบัตรเครดิต' },

  // Features
  { code: 'charts', label: 'Charts / dashboard', price: 500, group: 'feature' },
  { code: 'view-calendar', label: 'Calendar view', price: 400, group: 'feature' },
  { code: 'view-kanban', label: 'Kanban view', price: 400, group: 'feature' },
  { code: 'view-map', label: 'Map view', price: 600, group: 'feature', forceMode: 'B', bReason: 'ใช้ Google Maps SDK เหมือนกัน — มี iframe restriction' },
  { code: 'file-upload', label: 'File upload (Drive)', price: 400, group: 'feature' },
  { code: 'image-gallery', label: 'Image gallery', price: 300, group: 'feature' },
  { code: 'camera-capture', label: 'Camera capture ⭐', price: 500, group: 'feature', forceMode: 'B', bReason: 'Google บล็อกการใช้กล้องใน HtmlService' },
  { code: 'barcode-scan', label: 'Barcode/QR scan ⭐', price: 700, group: 'feature', forceMode: 'B', bReason: 'ใช้กล้องเหมือนกัน — Google บล็อก' },
  { code: 'signature-pad', label: 'Signature pad', price: 500, group: 'feature' },
  { code: 'pdf-export', label: 'PDF export/print', price: 500, group: 'feature' },
  { code: 'excel-export', label: 'Excel/CSV export', price: 300, group: 'feature' },
  { code: 'csv-import', label: 'CSV bulk import', price: 400, group: 'feature' },
  { code: 'approval-workflow', label: 'Approval workflow (multi-step)', price: 1000, group: 'feature' },
  { code: 'notification-center', label: 'Notification center', price: 500, group: 'feature' },
  { code: 'audit-log', label: 'Activity log / audit', price: 500, group: 'feature' },
  { code: 'gps-checkin', label: 'GPS check-in', price: 500, group: 'feature' },

  // AI
  { code: 'ai-chat', label: 'AI chat assistant', price: 1500, group: 'ai', forceMode: 'B', bReason: 'AI streaming response + GAS execution limit 6 นาทีต่อ request — UX จะแย่ใน HtmlService' },
  { code: 'ai-search', label: 'AI semantic search', price: 1000, group: 'ai', forceMode: 'B', bReason: 'Embedding lookup ต้องการ persistent connection ที่ HtmlService ไม่รองรับ' },
  { code: 'ai-summary', label: 'AI summary เอกสาร', price: 800, group: 'ai' },
  { code: 'ai-ocr', label: 'OCR (อ่านบิล/สลิป)', price: 1200, group: 'ai' },
];

const ADDON_GROUPS = [
  { id: 'arch', icon: 'layout-grid', label: 'Architecture' },
  { id: 'auth', icon: 'shield-check', label: 'Authentication (เลือก 1)' },
  { id: 'role', icon: 'users', label: 'Role / Permission' },
  { id: 'integration', icon: 'plug', label: 'Integrations' },
  { id: 'feature', icon: 'sparkles', label: 'Features' },
  { id: 'ai', icon: 'bot', label: 'AI Features (มี recurring cost)' },
];

const TRAINING_ADDON_PRICE = 300;
const SETUP_SERVICE_PRICE = 1200;

// ──────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'gas_builder_draft_v1';

const state = {
  step: 1,
  template: null,         // { code, name, base_price_mode_a, base_price_mode_b, forced_mode }
  templates: [],
  mode: 'A',              // auto-detected
  style: {
    project_name: '',
    theme: 'minimal-blue',
    font: 'thai-modern',
    dark_mode: false,
    logo_url: null,
  },
  selectedAddons: new Set(['no-auth']),
  chatLog: [],
  delivery_method: 'mode-a-done-for-you',  // updated based on mode
  training_addon: false,
  contact: {
    name: '',
    email: '',
    line_id: '',
  },
  agree_refund: false,
  agree_line: false,
};

function saveDraft() {
  try {
    const snapshot = {
      ...state,
      selectedAddons: Array.from(state.selectedAddons),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Save draft failed:', e);
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.assign(state, data);
    state.selectedAddons = new Set(data.selectedAddons || ['no-auth']);
  } catch (e) {
    console.warn('Load draft failed:', e);
  }
}

// Autosave every 30s
setInterval(saveDraft, 30000);

// ──────────────────────────────────────────────────────────
// Pricing engine
// ──────────────────────────────────────────────────────────

function detectMode() {
  // Mode B if any selected addon has forceMode='B'
  for (const code of state.selectedAddons) {
    const addon = ADDONS.find(a => a.code === code);
    if (addon?.forceMode === 'B') return 'B';
  }
  // Or if template forces B
  if (state.template?.forced_mode === 'B') return 'B';
  return 'A';
}

function getBaseTemplatePrice() {
  if (!state.template) return 0;
  const mode = detectMode();
  return mode === 'A' ? state.template.base_price_mode_a : state.template.base_price_mode_b;
}

function calculateTotal() {
  let total = getBaseTemplatePrice();

  for (const code of state.selectedAddons) {
    const addon = ADDONS.find(a => a.code === code);
    if (addon) total += addon.price;
  }

  if (state.style.dark_mode) {
    // dark-mode is implicit add-on
    // already counted as part of state if user toggles
  }

  if (state.training_addon) total += TRAINING_ADDON_PRICE;
  if (state.delivery_method === 'mode-b-setup-service') total += SETUP_SERVICE_PRICE;

  return Math.max(total, FLOOR_PRICE);  // enforce floor
}

function determineTier(total) {
  if (total <= 799) return 'starter';
  if (total <= 1500) return 'standard';
  return 'pro';
}

function etaForTier(tier) {
  return tier === 'starter' ? 2 : tier === 'standard' ? 3 : 5;
}

// ──────────────────────────────────────────────────────────
// Rendering
// ──────────────────────────────────────────────────────────

async function loadTemplates() {
  try {
    const res = await fetch('/api/gas-templates');
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    state.templates = data.templates || [];
  } catch (e) {
    // Fallback to hardcoded (in case API not deployed yet)
    state.templates = [
      { code: 'crm-basic', name: 'CRM พื้นฐาน', description: 'จัดการลูกค้า ดีล ติดตาม', category: 'sales', base_price_mode_a: 499, base_price_mode_b: 499, forced_mode: null },
      { code: 'inventory', name: 'สต็อกสินค้า', description: 'รับเข้า-เบิกออก', category: 'inventory', base_price_mode_a: 499, base_price_mode_b: 499, forced_mode: null },
      { code: 'booking', name: 'จองคิว/นัดหมาย', description: 'คลินิก ร้านเสริมสวย', category: 'service', base_price_mode_a: 499, base_price_mode_b: 499, forced_mode: null },
      { code: 'pos-simple', name: 'POS บันทึกขาย', description: 'ร้านค้าเล็ก', category: 'sales', base_price_mode_a: 499, base_price_mode_b: 499, forced_mode: null },
      { code: 'form-dashboard', name: 'Form + Dashboard', description: 'สำรวจ + สรุปผล', category: 'data', base_price_mode_a: 499, base_price_mode_b: 499, forced_mode: null },
      { code: 'employee-checkin', name: 'เช็คอินพนักงาน', description: 'GPS + รูป (ต้องกล้อง)', category: 'hr', base_price_mode_a: null, base_price_mode_b: 900, forced_mode: 'B' },
      { code: 'hr-leave', name: 'HR ลา/OT', description: 'พนักงาน <50 คน', category: 'hr', base_price_mode_a: 800, base_price_mode_b: 800, forced_mode: null },
      { code: 'order-online', name: 'Order online', description: 'รับออเดอร์ + ติดตาม', category: 'sales', base_price_mode_a: 800, base_price_mode_b: 800, forced_mode: null },
      { code: 'custom', name: 'Custom (AI ออกแบบ)', description: 'ตามที่ลูกค้าเล่า', category: 'custom', base_price_mode_a: 1500, base_price_mode_b: 1500, forced_mode: null },
    ];
  }
  renderTemplates();
}

function renderTemplates() {
  const grid = document.getElementById('templateGrid');
  const search = document.getElementById('templateSearch').value.toLowerCase();
  const cat = document.getElementById('templateCategory').value;

  const filtered = state.templates.filter(t => {
    if (cat && t.category !== cat) return false;
    if (search && !`${t.name} ${t.description}`.toLowerCase().includes(search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-8">ไม่พบ template</div>';
    return;
  }

  grid.innerHTML = filtered.map(t => {
    const isB = t.forced_mode === 'B';
    const selected = state.template?.code === t.code ? 'selected' : '';
    const priceLabel = isB
      ? `<span class="badge-mode-b-only">B-only · เริ่ม ฿${t.base_price_mode_b}</span>`
      : `<div class="text-sm text-slate-700">เริ่ม ฿${t.base_price_mode_a || t.base_price_mode_b}</div>`;

    return `
      <div class="template-card ${selected}" data-template-code="${t.code}">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-slate-900">${t.name}</h3>
          ${priceLabel}
        </div>
        <p class="text-sm text-slate-500">${t.description || ''}</p>
        ${t.category ? `<div class="mt-2 text-xs text-slate-400">หมวด: ${t.category}</div>` : ''}
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const code = card.dataset.templateCode;
      state.template = state.templates.find(t => t.code === code);
      renderTemplates();
      updateTotalsDisplay();
      updateNavButtons();
      saveDraft();
    });
  });
}

function updateNavButtons() {
  const btnNext = document.getElementById('btnNext');
  if (btnNext) btnNext.disabled = !canAdvance(state.step);
}

function renderAddons() {
  const container = document.getElementById('addonsContainer');
  container.innerHTML = ADDON_GROUPS.map(group => {
    const addons = ADDONS.filter(a => a.group === group.id);
    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i data-lucide="${group.icon}" class="w-4 h-4 text-brand-600"></i>
          ${group.label}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${addons.map(addon => {
            const checked = state.selectedAddons.has(addon.code);
            const inputType = addon.radio ? 'radio' : 'checkbox';
            const name = addon.radio ? `radio_${group.id}` : '';
            const forceClass = addon.forceMode === 'B' ? 'force-mode-b' : '';
            return `
              <label class="addon-card ${forceClass}">
                <input type="${inputType}" name="${name}" value="${addon.code}"
                  ${checked ? 'checked' : ''}
                  data-addon-code="${addon.code}"
                  data-force-mode="${addon.forceMode || ''}"
                  data-depends-on="${addon.dependsOn || ''}"
                  class="mt-1 addon-input">
                <span class="addon-content text-sm">
                  ${addon.label}
                  ${addon.price > 0 ? `<span class="text-brand-600 ml-1">+฿${addon.price}</span>` : ''}
                </span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.addon-input').forEach(input => {
    input.addEventListener('change', handleAddonChange);
  });

  if (window.lucide) lucide.createIcons();
}

function handleAddonChange(e) {
  const code = e.target.dataset.addonCode;
  const forceMode = e.target.dataset.forceMode;
  const dependsOn = e.target.dataset.dependsOn;
  const addon = ADDONS.find(a => a.code === code);

  // Check dependency
  if (e.target.checked && dependsOn && !state.selectedAddons.has(dependsOn)) {
    e.preventDefault();
    e.target.checked = false;
    alert(`ฟีเจอร์นี้ต้องเลือก "${ADDONS.find(a => a.code === dependsOn)?.label}" ก่อน`);
    return;
  }

  // Force Mode B confirmation
  if (e.target.checked && forceMode === 'B' && detectMode() === 'A') {
    showForceModeBModal(addon, () => {
      // Accept → continue
      applyAddonChange(e);
    }, () => {
      // Cancel → uncheck
      e.target.checked = false;
    });
    return;
  }

  applyAddonChange(e);
}

function applyAddonChange(e) {
  const code = e.target.dataset.addonCode;
  const addon = ADDONS.find(a => a.code === code);

  if (addon.radio) {
    // Remove other radios in same group
    ADDONS.filter(a => a.group === addon.group && a.radio).forEach(a => {
      state.selectedAddons.delete(a.code);
    });
    if (e.target.checked) state.selectedAddons.add(code);
  } else {
    if (e.target.checked) state.selectedAddons.add(code);
    else state.selectedAddons.delete(code);
  }

  state.mode = detectMode();
  updateDeliveryMethodForMode();
  updateTotalsDisplay();
  saveDraft();
}

function updateDeliveryMethodForMode() {
  // Switch delivery_method if mode changed
  if (state.mode === 'A' && state.delivery_method.startsWith('mode-b')) {
    state.delivery_method = 'mode-a-done-for-you';
  } else if (state.mode === 'B' && state.delivery_method.startsWith('mode-a')) {
    state.delivery_method = 'mode-b-self-setup';
  }
}

function showForceModeBModal(addon, onAccept, onCancel) {
  const modal = document.getElementById('forceModeBModal');
  const reason = addon.bReason || 'ฟีเจอร์นี้ใช้ใน HTMLService ของ GAS ไม่ได้';
  document.getElementById('forceModeBReason').innerHTML =
    `ฟีเจอร์ <strong>"${escapeHtml(addon.label)}"</strong> ต้องใช้ Mode Hybrid (Vercel + GAS)<br><br><span class="text-xs text-slate-500">เหตุผล: ${escapeHtml(reason)}</span>`;
  modal.classList.remove('hidden');

  const accept = document.getElementById('modeBAccept');
  const cancel = document.getElementById('modeBCancel');
  const close = () => modal.classList.add('hidden');

  accept.onclick = () => { close(); onAccept(); };
  cancel.onclick = () => { close(); onCancel(); };
}

function renderDeliveryChoices() {
  const container = document.getElementById('deliveryChoices');
  const hint = document.getElementById('deliveryHint');

  if (state.mode === 'A') {
    hint.innerHTML = '📍 ระบบของคุณจะถูกติดตั้งใน Google Drive ของคุณเอง · ฟรีตลอดชีพ · ไม่มีค่ารายปี';
    container.innerHTML = `
      <div class="delivery-choice ${state.delivery_method === 'mode-a-done-for-you' ? 'selected' : ''}"
        data-method="mode-a-done-for-you">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-bold text-slate-900">🎯 ส่งมอบให้เลย<span class="recommended-badge">แนะนำ</span></h3>
        </div>
        <p class="text-sm text-slate-600 mb-3">คลิก authorize 1 ครั้ง · เรา deploy ให้ผ่าน Apps Script API</p>
        <ul class="text-xs text-slate-500 space-y-1">
          <li>⏱ คุณใช้เวลา &lt; 1 นาที</li>
          <li>🔧 เราทำให้ทั้งหมด</li>
          <li>🔒 token ใช้แล้วลบทันที</li>
          <li>📝 update ในอนาคต re-authorize 1 คลิก</li>
        </ul>
      </div>
      <div class="delivery-choice ${state.delivery_method === 'mode-a-diy' ? 'selected' : ''}"
        data-method="mode-a-diy">
        <h3 class="font-bold text-slate-900 mb-2">🛠️ ฉัน deploy เอง</h3>
        <p class="text-sm text-slate-600 mb-3">เราส่งโค้ด + วิดีโอสอน · คุณ deploy ตามคู่มือ</p>
        <ul class="text-xs text-slate-500 space-y-1">
          <li>⏱ คุณใช้เวลา 10-15 นาที</li>
          <li>🔧 คุณทำเองตามคู่มือ</li>
          <li>🔒 ไม่ต้อง OAuth กับเรา</li>
          <li>📝 ต้อง re-deploy เองทุกครั้งที่ update</li>
        </ul>
      </div>
    `;
  } else {
    hint.innerHTML = '📍 Frontend = Vercel ของเรา · Backend (Sheet) = ใน Drive ของคุณ · ฿300/ปี ตั้งแต่ปีที่ 2';
    container.innerHTML = `
      <div class="delivery-choice ${state.delivery_method === 'mode-b-self-setup' ? 'selected' : ''}"
        data-method="mode-b-self-setup">
        <h3 class="font-bold text-slate-900 mb-2">🛠️ ฉันตั้งเอง</h3>
        <p class="text-sm text-slate-600 mb-3">เราส่งคู่มือ + screenshot · คุณตั้ง Google Cloud ตามขั้นตอน</p>
        <ul class="text-xs text-slate-500 space-y-1">
          <li>⏱ ใช้เวลา 30-60 นาที</li>
          <li>📋 ทำตาม 12 steps</li>
          <li>⚠️ Maps ต้องผูกบัตรเครดิต</li>
          <li>💰 ฟรี</li>
        </ul>
      </div>
      <div class="delivery-choice ${state.delivery_method === 'mode-b-setup-service' ? 'selected' : ''}"
        data-method="mode-b-setup-service">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-bold text-slate-900">🎯 ให้เราตั้งให้<span class="recommended-badge">แนะนำ</span></h3>
        </div>
        <p class="text-sm text-slate-600 mb-3">Screen share 45 นาที · เราทำให้ทุก step</p>
        <ul class="text-xs text-slate-500 space-y-1">
          <li>⏱ ใช้เวลา 45 นาที</li>
          <li>🤝 ทำพร้อมเรา</li>
          <li>⚠️ เราอธิบาย limit ของ Maps ให้</li>
          <li>💰 +฿${SETUP_SERVICE_PRICE.toLocaleString()}</li>
        </ul>
      </div>
    `;
  }

  container.querySelectorAll('.delivery-choice').forEach(card => {
    card.addEventListener('click', () => {
      state.delivery_method = card.dataset.method;
      renderDeliveryChoices();
      updateTotalsDisplay();
      saveDraft();
    });
  });
}

function renderQuoteBreakdown() {
  const container = document.getElementById('quoteBreakdown');
  const items = [];

  if (state.template) {
    const price = getBaseTemplatePrice();
    items.push({ label: `Template: ${state.template.name}`, price });
  }

  for (const code of state.selectedAddons) {
    const addon = ADDONS.find(a => a.code === code);
    if (addon && addon.price > 0) {
      items.push({ label: addon.label, price: addon.price });
    }
  }

  if (state.training_addon) items.push({ label: 'Training 30 นาที', price: TRAINING_ADDON_PRICE });
  if (state.delivery_method === 'mode-b-setup-service') {
    items.push({ label: 'Setup Service (Google Cloud)', price: SETUP_SERVICE_PRICE });
  }

  container.innerHTML = items.map(i => `
    <div class="flex justify-between">
      <span class="text-slate-600">${i.label}</span>
      <span class="font-medium">฿${i.price.toLocaleString()}</span>
    </div>
  `).join('') || '<div class="text-slate-400 text-sm">ยังไม่ได้เลือกอะไร</div>';

  const total = calculateTotal();
  document.getElementById('quoteTotal').textContent = '฿' + total.toLocaleString();
  const tier = determineTier(total);
  document.getElementById('quoteTier').textContent = `Tier: ${tier.toUpperCase()} · Mode ${state.mode}`;
  document.getElementById('etaText').textContent = etaForTier(tier);

  document.getElementById('recurringFeeText').textContent = state.mode === 'A'
    ? 'Mode A: ไม่มีค่ารายปี ตลอดชีพ'
    : 'Mode B: ฿300/ปี ตั้งแต่ปีที่ 2';
}

function renderFinalSummary() {
  const dl = document.getElementById('finalSummary');
  dl.innerHTML = `
    <div class="flex justify-between"><dt class="text-slate-500">ระบบ:</dt><dd class="font-medium">${state.style.project_name || '(ยังไม่กรอกชื่อ)'}</dd></div>
    <div class="flex justify-between"><dt class="text-slate-500">Template:</dt><dd>${state.template?.name || '-'}</dd></div>
    <div class="flex justify-between"><dt class="text-slate-500">Mode:</dt><dd>${state.mode} · ${state.mode === 'A' ? 'Pure GAS' : 'Hybrid'}</dd></div>
    <div class="flex justify-between"><dt class="text-slate-500">Delivery:</dt><dd>${state.delivery_method}</dd></div>
    <div class="flex justify-between"><dt class="text-slate-500">Add-ons:</dt><dd>${state.selectedAddons.size} รายการ</dd></div>
  `;
  document.getElementById('finalTotal').textContent = '฿' + calculateTotal().toLocaleString();
}

function updateTotalsDisplay() {
  const total = calculateTotal();
  document.getElementById('stickyTotal').textContent = total.toLocaleString();
  document.getElementById('stickyMode').textContent = state.template ? `· Mode ${state.mode} · ${determineTier(total).toUpperCase()}` : '';

  const modeInd = document.getElementById('modeIndicator');
  if (modeInd) {
    modeInd.textContent = state.mode === 'A'
      ? '📦 Mode A · Pure GAS · ฟรีตลอดชีพ'
      : '📦 Mode B · Hybrid · +฿300/ปี';
    modeInd.className = `text-sm px-3 py-1.5 rounded-full ${state.mode === 'A' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`;
  }

  // Update step-specific
  if (state.step === 4) renderQuoteBreakdown();
  if (state.step === 6) renderFinalSummary();
}

// ──────────────────────────────────────────────────────────
// Step navigation
// ──────────────────────────────────────────────────────────

function showStep(n) {
  state.step = n;
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  document.querySelector(`[data-step-content="${n}"]`).classList.remove('hidden');

  document.querySelectorAll('.step').forEach(el => {
    const step = +el.dataset.step;
    el.classList.toggle('active', step === n);
    el.classList.toggle('completed', step < n);
  });

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnSubmit = document.getElementById('btnSubmit');

  btnPrev.classList.toggle('hidden', n === 1);
  btnNext.classList.toggle('hidden', n === 6);
  btnSubmit.classList.toggle('hidden', n !== 6);

  // Render step-specific content
  if (n === 3) renderAddons();
  if (n === 4) renderQuoteBreakdown();
  if (n === 5) renderDeliveryChoices();
  if (n === 6) renderFinalSummary();

  // Update next button enabled
  btnNext.disabled = !canAdvance(n);

  if (window.lucide) lucide.createIcons();
  saveDraft();
  window.scrollTo(0, 0);
}

function canAdvance(step) {
  if (step === 1) return !!state.template;
  return true;
}

document.getElementById('btnNext').addEventListener('click', () => {
  if (state.step < 6) showStep(state.step + 1);
});
document.getElementById('btnPrev').addEventListener('click', () => {
  if (state.step > 1) showStep(state.step - 1);
});

document.getElementById('btnSubmit').addEventListener('click', submitOrder);

// ──────────────────────────────────────────────────────────
// Step 2 bindings
// ──────────────────────────────────────────────────────────

document.getElementById('projectName').addEventListener('input', (e) => {
  state.style.project_name = e.target.value;
  saveDraft();
});

document.querySelectorAll('input[name="theme"]').forEach(input => {
  input.addEventListener('change', (e) => {
    state.style.theme = e.target.value;
    saveDraft();
  });
});

document.querySelectorAll('input[name="font"]').forEach(input => {
  input.addEventListener('change', (e) => {
    state.style.font = e.target.value;
    saveDraft();
  });
});

document.getElementById('darkModeToggle').addEventListener('change', (e) => {
  state.style.dark_mode = e.target.checked;
  if (e.target.checked) state.selectedAddons.add('dark-mode');
  else state.selectedAddons.delete('dark-mode');
  updateTotalsDisplay();
  saveDraft();
});

// Step 5
document.getElementById('trainingAddon').addEventListener('change', (e) => {
  state.training_addon = e.target.checked;
  updateTotalsDisplay();
  saveDraft();
});

// Step 6 contact
['Name', 'Email', 'LineId'].forEach(field => {
  document.getElementById('customer' + field).addEventListener('input', (e) => {
    state.contact[field.toLowerCase().replace('lineid', 'line_id')] = e.target.value;
    saveDraft();
  });
});

document.getElementById('agreeRefund').addEventListener('change', (e) => {
  state.agree_refund = e.target.checked;
  updateSubmitButton();
});
document.getElementById('agreeLine').addEventListener('change', (e) => {
  state.agree_line = e.target.checked;
  updateSubmitButton();
});

function updateSubmitButton() {
  const btn = document.getElementById('btnSubmit');
  const valid = state.contact.name && state.contact.email && state.agree_refund && state.agree_line;
  btn.disabled = !valid;
}

// ──────────────────────────────────────────────────────────
// Step 1 filter bindings
// ──────────────────────────────────────────────────────────

document.getElementById('templateSearch').addEventListener('input', renderTemplates);
document.getElementById('templateCategory').addEventListener('change', renderTemplates);

// ──────────────────────────────────────────────────────────
// AI Chat (Phase 2 — placeholder)
// ──────────────────────────────────────────────────────────

document.getElementById('chatSendBtn').addEventListener('click', () => {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  appendChat('You', text);
  input.value = '';
  // TODO Phase 2: POST /api/gas-orders/:id/chat
  setTimeout(() => {
    appendChat('AI', 'ขอบคุณครับ — Phase 2 จะใช้ AI ช่วยสรุป spec ตอนนี้แอดมินจะอ่าน chat log นี้แทน');
  }, 500);
});

function appendChat(role, text) {
  state.chatLog.push({ role: role.toLowerCase(), content: text, ts: Date.now() });
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = role === 'You'
    ? 'bg-brand-100 rounded-lg p-2 text-slate-800 text-right'
    : 'bg-slate-100 rounded-lg p-2 text-slate-700';
  div.innerHTML = `<strong>${role}:</strong> ${escapeHtml(text)}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  saveDraft();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ──────────────────────────────────────────────────────────
// Submit order
// ──────────────────────────────────────────────────────────

async function submitOrder() {
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.textContent = 'กำลังบันทึก...';

  try {
    const payload = {
      template_code: state.template.code,
      mode: state.mode,
      delivery_method: state.delivery_method,
      training_addon: state.training_addon,
      addons: Array.from(state.selectedAddons),
      style: state.style,
      chat_log: state.chatLog,
      price: calculateTotal(),
      tier: determineTier(calculateTotal()),
      project_name: state.style.project_name,
      customer_name: state.contact.name,
      customer_email: state.contact.email,
      line_basic_id: state.contact.line_id || null,
    };

    const res = await fetch('/api/gas-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'ส่งคำสั่งซื้อไม่สำเร็จ');
    }

    const { order } = await res.json();
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = `/gas-builder-success.html?order=${order.id}&number=${order.order_number}`;
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + e.message + '\n\n(หมายเหตุ: ระบบยังเป็น preview — API endpoint อาจยังไม่พร้อม)');
    btn.disabled = false;
    btn.textContent = '✓ ยืนยันคำสั่งซื้อ';
  }
}

// ──────────────────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────────────────

(function init() {
  // Check prefill from prompt creator
  const urlParams = new URLSearchParams(window.location.search);
  const fromPrompt = urlParams.get('from');
  const promptId = urlParams.get('promptId');

  loadDraft();
  loadTemplates();
  showStep(state.step);
  updateTotalsDisplay();

  if (fromPrompt === 'prompt' && promptId) {
    // TODO Phase 2: prefill from saved_prompt
    console.log('Prefill from prompt:', promptId);
  }
})();
