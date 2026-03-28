// =============================================
// KP Prompt Creator — Core (Auth, API, Toast, Utils)
// =============================================

const API_BASE = window.location.origin + '/api';

// =============================================
// Auth State
// =============================================
let currentUser = null;
let authToken = localStorage.getItem('kp_token');

function setAuth(user, token) {
  currentUser = user;
  authToken = token;
  if (token) localStorage.setItem('kp_token', token);
  else localStorage.removeItem('kp_token');
  updateAuthUI();
}

function logout() {
  setAuth(null, null);
  window.location.href = '/auth.html';
}

function updateAuthUI() {
  const authLinks = document.querySelectorAll('.auth-links');
  const userMenu = document.querySelectorAll('.user-menu');
  const userNameEls = document.querySelectorAll('.user-display-name');
  const balanceEls = document.querySelectorAll('.user-balance');
  const adminOnly = document.querySelectorAll('.admin-only');

  if (currentUser) {
    authLinks.forEach(el => el.style.display = 'none');
    userMenu.forEach(el => el.style.display = 'flex');
    userNameEls.forEach(el => el.textContent = currentUser.display_name);
    balanceEls.forEach(el => el.textContent = `฿${parseFloat(currentUser.credit_balance).toFixed(2)}`);
    adminOnly.forEach(el => el.style.display = currentUser.role === 'admin' ? '' : 'none');
  } else {
    authLinks.forEach(el => el.style.display = '');
    userMenu.forEach(el => el.style.display = 'none');
    adminOnly.forEach(el => el.style.display = 'none');
  }
}

// =============================================
// API Helper
// =============================================
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw { status: res.status, error: `เซิร์ฟเวอร์ตอบกลับผิดปกติ (${res.status})` };
  }
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// =============================================
// Toast Notification
// =============================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================
// Auth Functions
// =============================================
async function checkAuth() {
  if (!authToken) return;
  try {
    const { user } = await api('/auth/me');
    currentUser = user;
    updateAuthUI();
  } catch {
    setAuth(null, null);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value,
        display_name: form.display_name.value
      })
    });
    setAuth(data.user, data.token);
    showToast('สมัครสมาชิกสำเร็จ!', 'success');
    setTimeout(() => window.location.href = '/marketplace.html', 500);
  } catch (err) {
    showToast(err.error || 'สมัครไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value
      })
    });
    setAuth(data.user, data.token);
    showToast('เข้าสู่ระบบสำเร็จ!', 'success');
    setTimeout(() => window.location.href = '/marketplace.html', 500);
  } catch (err) {
    showToast(err.error || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

// =============================================
// Utils
// =============================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const PROMPT_CATEGORY_LABELS = {
  free: 'ฟรี',
  'web-app': 'Web Application',
  'mobile-app': 'Mobile App',
  api: 'API / Backend',
  ecommerce: 'E-Commerce',
  dashboard: 'Dashboard',
  'landing-page': 'Landing Page',
  automation: 'Automation',
  other: 'อื่นๆ'
};

function normalizePromptPrice(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function isFreePrompt(value) {
  return normalizePromptPrice(value) === 0;
}

function formatPromptPrice(value, options = {}) {
  const amount = normalizePromptPrice(value);
  const decimals = Number.isInteger(options.decimals) ? options.decimals : 0;

  if (amount === 0) return options.freeLabel || 'ฟรี';
  return `฿${amount.toFixed(decimals)}`;
}

function getPromptCategoryLabel(category) {
  return PROMPT_CATEGORY_LABELS[category] || category || PROMPT_CATEGORY_LABELS.other;
}

function renderPromptCategoryBadges(category, price, options = {}) {
  const badges = [];
  const baseClass = options.baseClass || 'text-xs font-medium px-2 py-0.5 rounded-full';
  const freeClass = options.freeClass || 'bg-emerald-50 text-emerald-600';
  const categoryClass = options.categoryClass || 'bg-indigo-50 text-indigo-600';

  if (isFreePrompt(price)) {
    badges.push(`<span class="${baseClass} ${freeClass}">ฟรี</span>`);
  }

  if (category) {
    badges.push(`<span class="${baseClass} ${categoryClass}">${escapeHtml(getPromptCategoryLabel(category))}</span>`);
  }

  return badges.join('');
}

function getPromptPricingNote(value) {
  return isFreePrompt(value)
    ? 'ตั้งราคา 0 บาท ระบบจะขึ้นในหมวดฟรีอัตโนมัติ และจะไม่คิดค่าธรรมเนียม'
    : 'รายการแบบเสียเงินจะคิดค่าคอมตามค่าที่ผู้ดูแลระบบตั้งไว้';
}

function bindPromptPricingHelper(priceInput, helperEl) {
  if (!priceInput || !helperEl) return;

  const sync = () => {
    const freePrompt = isFreePrompt(priceInput.value);
    helperEl.textContent = getPromptPricingNote(priceInput.value);
    helperEl.className = freePrompt
      ? 'mt-1.5 text-xs font-medium text-emerald-600'
      : 'mt-1.5 text-xs text-slate-400';
  };

  priceInput.oninput = sync;
  priceInput.onchange = sync;
  sync();
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

function copyShopLink() {
  if (!currentUser) { showToast('กรุณาเข้าสู่ระบบก่อน', 'error'); return; }
  const url = `${window.location.origin}/marketplace.html?seller=${currentUser.id}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('คัดลอกลิงก์ร้านค้าแล้ว!', 'success');
  }).catch(() => {
    showToast(url, 'info');
  });
}

// =============================================
// File preview handlers
// =============================================
function setupFilePreview(inputId, previewId, options = {}) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', function() {
    const previewContainer = document.getElementById(previewId);
    if (!previewContainer) return;

    if (options.type === 'file') {
      const file = this.files[0];
      if (file) {
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = `<div class="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${escapeHtml(file.name)} <span class="text-emerald-500">(${(file.size / 1024).toFixed(1)} KB)</span></div>`;
      } else {
        previewContainer.style.display = 'none';
      }
    } else if (options.type === 'image') {
      const file = this.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = `<img src="${url}" alt="Preview" class="w-32 h-20 object-cover rounded-lg border border-slate-200">`;
      } else {
        previewContainer.style.display = 'none';
      }
    } else if (options.type === 'images') {
      const files = Array.from(this.files).slice(0, 5);
      if (files.length > 0) {
        previewContainer.style.display = 'flex';
        previewContainer.className = 'flex gap-2 flex-wrap mt-2';
        previewContainer.innerHTML = files.map(f => {
          const url = URL.createObjectURL(f);
          return `<img src="${url}" alt="Preview" class="w-24 h-16 object-cover rounded-lg border border-slate-200">`;
        }).join('');
      } else {
        previewContainer.style.display = 'none';
      }
      if (this.files.length > 5) {
        showToast('เลือกได้สูงสุด 5 รูป', 'error');
      }
    }
  });
}

// =============================================
// Init — detect page and load content
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();

  // Hamburger menu toggle (auto-inject for mp-navbar)
  const navbar = document.querySelector('.mp-navbar');
  if (navbar) {
    const navLinks = navbar.querySelector('.nav-links');
    if (navLinks && !navbar.querySelector('.nav-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.innerHTML = '<i class="bi bi-list"></i>';
      toggle.onclick = () => navLinks.classList.toggle('show');
      navbar.querySelector('.nav-brand')?.after(toggle);
    }
  }

  const page = window.location.pathname;

  if (page.includes('marketplace')) {
    loadPrompts();
    // Check seller filter from URL
    const sellerId = new URLSearchParams(window.location.search).get('seller');
    if (sellerId) loadSellerHeader(sellerId);
  } else if (page.includes('prompt-detail')) {
    loadPromptDetail();
  } else if (page.includes('topup')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    setupFilePreview('slip-image-input', 'slip-preview', { type: 'image' });
    loadCreditHistory();
    loadPendingTopups();
  } else if (page.includes('orders') && !page.includes('admin')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    loadOrders();
  } else if (page.includes('account')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    loadAccountForm();
    loadMyPrompts();
    loadPurchasedPrompts();
    loadCollections();
  } else if (page.includes('dashboard')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    initDashboardTabs();
    setupFilePreview('prompt-file-input', 'prompt-file-info', { type: 'file' });
    setupFilePreview('preview-image-input', 'preview-image-preview', { type: 'image' });
    setupFilePreview('detail-images-input', 'detail-images-preview', { type: 'images' });
    if (typeof setupPromptPricingHelpers === 'function') setupPromptPricingHelpers();
    initPayoutPromptPay();
    loadSellerDashboard();
    loadSellerIncomeHistory();
    loadSellerPayoutHistory();
    loadSellerNotifications();
  } else if (page.includes('admin')) {
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/auth.html'; return;
    }
    initAdminTabs();
    loadAdminOverview();
    loadAdminNotifications();
    loadAdminTopups();
    loadAdminPendingPrompts();
    loadAdminPayouts();
    loadAdminUsers();
    loadAdminSettings();
  }

  // Re-init Lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// =============================================
// Custom Confirm Modal (shared)
// =============================================

if (typeof kpConfirm === 'undefined') {
  window.kpConfirm = function(message, options = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'kp-modal-overlay';

      const iconMap = { 'question-circle': '❓', 'trash': '🗑️', 'cart-check': '🛒', 'check-circle': '✅', 'x-circle': '❌', 'wallet2': '💰', 'coin': '🪙', 'arrow-counterclockwise': '🔄' };
      const icon = options.icon || 'question-circle';
      const hasBootstrapIcons = !!document.querySelector('link[href*="bootstrap-icons"]');
      const iconHtml = hasBootstrapIcons ? `<i class="bi bi-${icon}"></i>` : (iconMap[icon] || '❓');
      const confirmText = options.confirmText || 'ตกลง';
      const cancelText = options.cancelText || 'ยกเลิก';
      const type = options.type || 'confirm';
      const typeClass = type === 'danger' ? 'kp-modal-danger' : type === 'info' ? 'kp-modal-info' : '';

      overlay.innerHTML = `
        <div class="kp-modal ${typeClass}">
          <div class="kp-modal-icon">${iconHtml}</div>
          <div class="kp-modal-message">${message}</div>
          <div class="kp-modal-actions">
            ${type !== 'info' ? `<button class="kp-modal-btn kp-modal-cancel">${cancelText}</button>` : ''}
            <button class="kp-modal-btn kp-modal-confirm">${confirmText}</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));

      function close(result) {
        overlay.classList.remove('show');
        overlay.classList.add('closing');
        setTimeout(() => { overlay.remove(); resolve(result); }, 200);
      }

      overlay.querySelector('.kp-modal-confirm').addEventListener('click', () => close(true));
      const cancelBtn = overlay.querySelector('.kp-modal-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

      const escHandler = (e) => {
        if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); close(false); }
      };
      document.addEventListener('keydown', escHandler);
      overlay.querySelector('.kp-modal-confirm').focus();
    });
  };
}
