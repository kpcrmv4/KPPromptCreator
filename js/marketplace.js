// =============================================
// KP Prompt Creator — Marketplace Frontend Logic
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
  const sellerOnly = document.querySelectorAll('.seller-only');
  const adminOnly = document.querySelectorAll('.admin-only');

  if (currentUser) {
    authLinks.forEach(el => el.style.display = 'none');
    userMenu.forEach(el => el.style.display = '');
    userNameEls.forEach(el => el.textContent = currentUser.display_name);
    balanceEls.forEach(el => el.textContent = `฿${parseFloat(currentUser.credit_balance).toFixed(2)}`);
    sellerOnly.forEach(el => el.style.display = ['seller', 'admin'].includes(currentUser.role) ? '' : 'none');
    adminOnly.forEach(el => el.style.display = currentUser.role === 'admin' ? '' : 'none');
  } else {
    authLinks.forEach(el => el.style.display = '');
    userMenu.forEach(el => el.style.display = 'none');
    sellerOnly.forEach(el => el.style.display = 'none');
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

  const data = await res.json();
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
        display_name: form.display_name.value,
        role: form.role.value
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
// Marketplace — Browse Prompts
// =============================================
async function loadPrompts(params = {}) {
  const container = document.getElementById('prompts-grid');
  if (!container) return;

  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>กำลังโหลด...</p></div>';

  try {
    const query = new URLSearchParams(params).toString();
    const { prompts, total } = await api(`/prompts?${query}`);

    if (prompts.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>ยังไม่มี Prompt ในหมวดนี้</p></div>';
      return;
    }

    container.innerHTML = prompts.map(p => `
      <a href="/prompt-detail.html?id=${p.id}" class="prompt-card">
        ${p.preview_image_url ? `<div class="prompt-card-thumb"><img src="${escapeHtml(p.preview_image_url)}" alt="${escapeHtml(p.title)}" loading="lazy"></div>` : '<div class="prompt-card-thumb prompt-card-thumb-placeholder"><i class="bi bi-file-earmark-code"></i></div>'}
        <div class="prompt-card-body">
          <div class="prompt-card-header">
            <span class="prompt-category">${p.category}</span>
            <span class="prompt-price">฿${parseFloat(p.price).toFixed(0)}</span>
          </div>
          <h3 class="prompt-title">${escapeHtml(p.title)}</h3>
          <p class="prompt-desc">${escapeHtml(p.preview_text || p.description).substring(0, 120)}...</p>
          <div class="prompt-meta">
            <span class="prompt-seller"><i class="bi bi-person"></i> ${escapeHtml(p.seller?.display_name || '')}</span>
            <span class="prompt-rating"><i class="bi bi-star-fill"></i> ${p.avg_rating || '—'}</span>
            <span class="prompt-sales"><i class="bi bi-bag"></i> ${p.purchase_count || 0}</span>
          </div>
        </div>
      </a>
    `).join('');

    renderPagination(total, params.page || 1, params.limit || 20);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>โหลดข้อมูลไม่สำเร็จ</p></div>';
  }
}

function renderPagination(total, currentPage, limit) {
  const container = document.getElementById('pagination');
  if (!container) return;
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === Number(currentPage) ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function changePage(page) {
  const params = getCurrentFilters();
  params.page = page;
  loadPrompts(params);
}

function getCurrentFilters() {
  const params = {};
  const category = document.getElementById('filter-category')?.value;
  const search = document.getElementById('filter-search')?.value;
  const sort = document.getElementById('filter-sort')?.value;
  if (category) params.category = category;
  if (search) params.search = search;
  if (sort) params.sort = sort;
  return params;
}

function applyFilters() {
  loadPrompts(getCurrentFilters());
}

// =============================================
// Prompt Detail
// =============================================
async function loadPromptDetail() {
  const container = document.getElementById('prompt-detail');
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { container.innerHTML = '<p>ไม่พบ Prompt</p>'; return; }

  container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  try {
    const { prompt, purchased } = await api(`/prompts/${id}`);

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-info">
          <span class="prompt-category">${prompt.category}</span>
          <h1>${escapeHtml(prompt.title)}</h1>
          <div class="detail-seller">
            <i class="bi bi-person-circle"></i>
            <span>${escapeHtml(prompt.seller?.display_name || '')}</span>
          </div>
          <div class="detail-stats">
            <span><i class="bi bi-star-fill"></i> ${prompt.avg_rating || '—'} คะแนน</span>
            <span><i class="bi bi-bag"></i> ${prompt.purchase_count || 0} ขายแล้ว</span>
            <span><i class="bi bi-eye"></i> ${prompt.view_count || 0} เข้าชม</span>
          </div>
        </div>
        <div class="detail-action">
          <div class="detail-price">฿${parseFloat(prompt.price).toFixed(0)}</div>
          ${purchased
            ? '<button class="btn btn-primary btn-lg" onclick="downloadPrompt(\'' + prompt.id + '\')"><i class="bi bi-download"></i> ดาวน์โหลด Prompt</button>'
            : '<button class="btn btn-primary btn-lg" onclick="purchasePrompt(\'' + prompt.id + '\')"><i class="bi bi-cart-plus"></i> ซื้อ Prompt</button>'
          }
          ${purchased ? '<span class="badge badge-success">ซื้อแล้ว</span>' : ''}
        </div>
      </div>

      ${prompt.images?.length ? `
        <div class="detail-images">
          ${prompt.images.map(img => `<img src="${escapeHtml(img.image_url)}" alt="Preview" class="detail-img">`).join('')}
        </div>
      ` : ''}

      <div class="detail-body">
        <h2>รายละเอียด</h2>
        <div class="detail-description">${escapeHtml(prompt.description).replace(/\n/g, '<br>')}</div>

        ${prompt.tech_stack?.length ? `
          <h3>Tech Stack</h3>
          <div class="tag-list">${prompt.tech_stack.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        ` : ''}

        ${prompt.tags?.length ? `
          <h3>Tags</h3>
          <div class="tag-list">${prompt.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        ` : ''}

        ${prompt.demo_url ? `<h3>Demo</h3><a href="${escapeHtml(prompt.demo_url)}" target="_blank" class="btn btn-outline">${escapeHtml(prompt.demo_url)}</a>` : ''}
      </div>

      <div class="detail-reviews">
        <h2>รีวิว (${prompt.reviews?.length || 0})</h2>
        ${prompt.reviews?.length ? prompt.reviews.map(r => `
          <div class="review-card">
            <div class="review-header">
              <strong>${escapeHtml(r.buyer?.display_name || 'ไม่ระบุชื่อ')}</strong>
              <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            ${r.comment ? `<p>${escapeHtml(r.comment)}</p>` : ''}
            <small>${new Date(r.created_at).toLocaleDateString('th-TH')}</small>
          </div>
        `).join('') : '<p class="text-muted">ยังไม่มีรีวิว</p>'}
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p>โหลดข้อมูลไม่สำเร็จ</p>';
  }
}

async function purchasePrompt(promptId) {
  if (!currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อนซื้อ', 'error');
    window.location.href = '/auth.html';
    return;
  }

  const ok = await kpConfirm('ยืนยันการซื้อ Prompt นี้?', { icon: 'cart-check', confirmText: 'ซื้อเลย' });
  if (!ok) return;

  try {
    const data = await api('/prompts/purchase', {
      method: 'POST',
      body: JSON.stringify({ prompt_id: promptId })
    });
    showToast(data.message, 'success');
    currentUser.credit_balance = data.new_balance;
    updateAuthUI();
    loadPromptDetail(); // reload
  } catch (err) {
    if (err.need_topup) {
      showToast(`${err.error} — เติมเงินก่อน`, 'error');
      const goTopup = await kpConfirm('ต้องการไปเติมเงินหรือไม่?', { icon: 'wallet2', confirmText: 'ไปเติมเงิน' });
      if (goTopup) {
        window.location.href = '/topup.html';
      }
    } else {
      showToast(err.error || 'ซื้อไม่สำเร็จ', 'error');
    }
  }
}

async function downloadPrompt(promptId) {
  try {
    const data = await api(`/prompts/download?prompt_id=${promptId}`);

    if (data.download_url) {
      // ดาวน์โหลดไฟล์จาก Storage (signed URL)
      const a = document.createElement('a');
      a.href = data.download_url;
      a.download = `${data.title}.md`;
      a.target = '_blank';
      a.click();
    } else {
      // fallback: สร้างไฟล์จาก content (prompt เก่า)
      const blob = new Blob([data.content], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${data.title}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    showToast('ดาวน์โหลดสำเร็จ', 'success');
  } catch (err) {
    showToast(err.error || 'ดาวน์โหลดไม่สำเร็จ', 'error');
  }
}

// =============================================
// Top-up
// =============================================
async function handleTopup(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('/topup/redeem', {
      method: 'POST',
      body: JSON.stringify({ amount: parseInt(form.amount.value), slip_image_base64: form._slip_base64 || '' })
    });
    showToast(data.message, 'success');
    currentUser.credit_balance = data.new_balance;
    updateAuthUI();
    form.reset();
    loadCreditHistory();
  } catch (err) {
    showToast(err.error || 'เติมเงินไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function loadCreditHistory() {
  const container = document.getElementById('credit-history');
  if (!container) return;

  try {
    const { transactions } = await api('/credits/history');
    if (transactions.length === 0) {
      container.innerHTML = '<p class="text-muted">ยังไม่มีประวัติ</p>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>วันที่</th><th>รายการ</th><th>จำนวน</th><th>คงเหลือ</th></tr></thead>
        <tbody>${transactions.map(t => `
          <tr>
            <td>${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
            <td>${escapeHtml(t.description || t.type)}</td>
            <td class="${t.amount >= 0 ? 'text-success' : 'text-danger'}">${t.amount >= 0 ? '+' : ''}฿${parseFloat(t.amount).toFixed(2)}</td>
            <td>฿${parseFloat(t.balance_after).toFixed(2)}</td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
  } catch { container.innerHTML = '<p>โหลดไม่สำเร็จ</p>'; }
}

// =============================================
// Dashboard Tabs
// =============================================
function initDashboardTabs() {
  const tabs = document.querySelectorAll('.dash-tab');
  const contents = document.querySelectorAll('.dash-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });

  // Support hash-based tab navigation (e.g. dashboard.html#tab-payout)
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const tabBtn = document.querySelector(`.dash-tab[data-tab="${hash}"]`);
    if (tabBtn) tabBtn.click();
  }
}

// =============================================
// Seller Dashboard
// =============================================
async function loadSellerDashboard() {
  const container = document.getElementById('seller-dashboard');
  if (!container) return;

  try {
    const { stats, prompts } = await api('/seller/stats');

    document.getElementById('stat-prompts').textContent = stats.total_prompts;
    document.getElementById('stat-approved').textContent = stats.approved_prompts;
    document.getElementById('stat-sales').textContent = stats.total_sales;
    document.getElementById('stat-revenue').textContent = `฿${stats.total_revenue.toFixed(2)}`;
    document.getElementById('stat-balance').textContent = `฿${stats.credit_balance.toFixed(2)}`;

    const list = document.getElementById('seller-prompts');
    if (list) {
      list.innerHTML = prompts.length ? prompts.map(p => `
        <tr>
          <td>${escapeHtml(p.title)}</td>
          <td>฿${parseFloat(p.price).toFixed(0)}</td>
          <td><span class="badge badge-${p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'}">${p.status}</span></td>
          <td>${p.purchase_count || 0}</td>
          <td>${p.avg_rating || '—'}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="openEditPrompt('${p.id}')"><i class="bi bi-pencil"></i> แก้ไข</button>
            <button class="btn btn-sm btn-outline" onclick="openImageManager('${p.id}')"><i class="bi bi-image"></i> รูป</button>
            <a href="/prompt-detail.html?id=${p.id}" class="btn btn-sm btn-outline"><i class="bi bi-eye"></i></a>
          </td>
        </tr>
      `).join('') : '<tr><td colspan="6">ยังไม่มี Prompt</td></tr>';
    }
  } catch (err) {
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// File preview handlers
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
        previewContainer.innerHTML = `<div class="file-info"><i class="bi bi-file-earmark-text"></i> ${escapeHtml(file.name)} <span>(${(file.size / 1024).toFixed(1)} KB)</span></div>`;
      } else {
        previewContainer.style.display = 'none';
      }
    } else if (options.type === 'image') {
      const file = this.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = `<img src="${url}" alt="Preview" class="upload-preview-img">`;
      } else {
        previewContainer.style.display = 'none';
      }
    } else if (options.type === 'images') {
      const files = Array.from(this.files).slice(0, 5);
      if (files.length > 0) {
        previewContainer.style.display = 'flex';
        previewContainer.innerHTML = files.map(f => {
          const url = URL.createObjectURL(f);
          return `<img src="${url}" alt="Preview" class="upload-preview-img">`;
        }).join('');
      } else {
        previewContainer.style.display = 'none';
      }
      if (this.files.length > 5) {
        showToast('เลือกได้สูงสุด 5 รูป — ใช้ 5 รูปแรกเท่านั้น', 'error');
      }
    }
  });
}

async function handleCreatePrompt(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> กำลังอัปโหลด...';

  try {
    // อ่านไฟล์ .md
    const promptFile = document.getElementById('prompt-file-input')?.files[0];
    if (!promptFile) {
      showToast('กรุณาเลือกไฟล์ Prompt (.md)', 'error');
      return;
    }
    const promptFileBase64 = await readFileAsBase64(promptFile);

    // อ่านรูป preview
    const previewImageFile = document.getElementById('preview-image-input')?.files[0];
    if (!previewImageFile) {
      showToast('กรุณาเลือกรูปพรีวิว', 'error');
      return;
    }
    if (previewImageFile.size > 5 * 1024 * 1024) {
      showToast('รูปพรีวิวต้องมีขนาดไม่เกิน 5MB', 'error');
      return;
    }
    const previewImageBase64 = await readFileAsBase64(previewImageFile);

    // อ่านรูปรายละเอียด
    const detailImageFiles = Array.from(document.getElementById('detail-images-input')?.files || []).slice(0, 5);
    const detail_images = [];
    for (const file of detailImageFiles) {
      if (file.size > 5 * 1024 * 1024) continue;
      const base64 = await readFileAsBase64(file);
      detail_images.push({ image_base64: base64, filename: file.name });
    }

    const body = {
      title: form.title.value,
      description: form.description.value,
      category: form.category.value,
      price: Number(form.price.value),
      prompt_file_base64: promptFileBase64,
      prompt_filename: promptFile.name,
      preview_image_base64: previewImageBase64,
      preview_image_filename: previewImageFile.name,
      demo_url: form.demo_url?.value || '',
      preview_text: form.preview_text?.value || '',
      tech_stack: form.tech_stack?.value ? form.tech_stack.value.split(',').map(s => s.trim()) : [],
      tags: form.tags?.value ? form.tags.value.split(',').map(s => s.trim()) : [],
      detail_images
    };

    const result = await api('/prompts', { method: 'POST', body: JSON.stringify(body) });

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(w => showToast(w, 'error'));
    }

    showToast(
      result.kp_verified
        ? 'สร้าง Prompt สำเร็จ! (KP Verified) รออนุมัติ'
        : 'สร้าง Prompt สำเร็จ! รออนุมัติ (แนะนำ: สร้างจาก KP Prompt Creator เพื่อได้ KP Verified badge)',
      'success'
    );
    form.reset();
    // Clear previews
    ['prompt-file-info', 'preview-image-preview', 'detail-images-preview'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    });
    loadSellerDashboard();
    const promptsTab = document.querySelector('.dash-tab[data-tab="tab-prompts"]');
    if (promptsTab) promptsTab.click();
  } catch (err) {
    showToast(err.error || 'สร้างไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-cloud-upload"></i> ส่ง Prompt (รออนุมัติ)';
  }
}

async function loadSellerIncomeHistory() {
  const container = document.getElementById('seller-income-history');
  if (!container) return;

  try {
    const { transactions } = await api('/credits/history?type=sale');
    if (!transactions || transactions.length === 0) {
      container.innerHTML = '<p class="text-muted">ยังไม่มีรายรับ</p>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>วันที่</th><th>รายการ</th><th>จำนวน</th><th>คงเหลือ</th></tr></thead>
        <tbody>${transactions.map(t => `
          <tr>
            <td>${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
            <td>${escapeHtml(t.description || 'รายรับจากการขาย')}</td>
            <td class="text-success">+฿${parseFloat(t.amount).toFixed(2)}</td>
            <td>฿${parseFloat(t.balance_after).toFixed(2)}</td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function loadSellerPayoutHistory() {
  const container = document.getElementById('seller-payout-history');
  if (!container) return;

  try {
    const { payouts } = await api('/seller/payouts');
    if (!payouts || payouts.length === 0) {
      container.innerHTML = '<p class="text-muted">ยังไม่มีประวัติการถอน</p>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>วันที่</th><th>จำนวน</th><th>บัญชี</th><th>สถานะ</th><th>หมายเหตุ</th><th>หลักฐาน</th></tr></thead>
        <tbody>${payouts.map(p => `
          <tr>
            <td>${new Date(p.created_at).toLocaleDateString('th-TH')}</td>
            <td>฿${parseFloat(p.amount).toFixed(2)}</td>
            <td>${escapeHtml(p.payment_account || '')}</td>
            <td>
              <span class="badge badge-${p.status === 'paid' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'}">
                ${p.status === 'paid' ? 'โอนแล้ว' : p.status === 'rejected' ? 'ปฏิเสธ' : 'รอดำเนินการ'}
              </span>
            </td>
            <td>${escapeHtml(p.admin_note || '—')}</td>
            <td>
              ${p.proof_image_url
                ? `<a href="${escapeHtml(p.proof_image_url)}" target="_blank" class="btn btn-sm btn-outline"><i class="bi bi-image"></i> ดูหลักฐาน</a>`
                : '<span class="text-muted">—</span>'
              }
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function loadSellerNotifications() {
  const container = document.getElementById('seller-notifications');
  const badge = document.getElementById('notif-badge');
  if (!container) return;

  try {
    const { notifications, unread_count } = await api('/notifications');

    // แสดง badge จำนวนยังไม่อ่าน
    if (badge) {
      if (unread_count > 0) {
        badge.textContent = unread_count;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }

    if (!notifications || notifications.length === 0) {
      container.innerHTML = '<p class="text-muted">ไม่มีการแจ้งเตือน</p>';
      return;
    }

    container.innerHTML = `
      ${unread_count > 0 ? '<button class="btn btn-sm btn-outline" onclick="markAllNotificationsRead()" style="margin-bottom:0.75rem;"><i class="bi bi-check-all"></i> อ่านทั้งหมด</button>' : ''}
      ${notifications.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'notif-unread'}" onclick="markNotificationRead('${n.id}')">
          <div class="notif-icon">
            <i class="bi bi-${getNotifIcon(n.type)}"></i>
          </div>
          <div class="notif-body">
            <strong>${escapeHtml(n.title)}</strong>
            <p>${escapeHtml(n.message)}</p>
            <small class="text-muted">${new Date(n.created_at).toLocaleString('th-TH')}</small>
          </div>
        </div>
      `).join('')}
    `;
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

function getNotifIcon(type) {
  const icons = {
    payout_approved: 'check-circle-fill',
    payout_rejected: 'x-circle-fill',
    payout_request: 'cash-coin',
    prompt_approved: 'check-circle',
    prompt_rejected: 'x-circle',
    new_sale: 'bag-check-fill',
    system: 'info-circle'
  };
  return icons[type] || 'bell';
}

async function markNotificationRead(notifId) {
  try {
    await api('/notifications', { method: 'PUT', body: JSON.stringify({ notification_id: notifId }) });
    loadSellerNotifications();
  } catch {}
}

async function markAllNotificationsRead() {
  try {
    await api('/notifications', { method: 'PUT', body: JSON.stringify({ mark_all: true }) });
    showToast('อ่านทั้งหมดแล้ว', 'success');
    loadSellerNotifications();
  } catch {}
}

function initPayoutPromptPay() {
  const warningBanner = document.getElementById('promptpay-warning');
  const infoBanner = document.getElementById('promptpay-info');
  const phoneInput = document.getElementById('payout-phone');
  const phoneDisplay = document.getElementById('promptpay-display');
  if (!warningBanner || !infoBanner || !phoneInput) return;

  const ppNumber = currentUser?.promptpay_number;
  if (ppNumber) {
    infoBanner.style.display = '';
    warningBanner.style.display = 'none';
    if (phoneDisplay) phoneDisplay.textContent = ppNumber + (currentUser?.promptpay_name ? ` (${currentUser.promptpay_name})` : '');
    phoneInput.value = ppNumber;
  } else {
    warningBanner.style.display = '';
    infoBanner.style.display = 'none';
  }
}

async function handlePayoutRequest(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('/seller/payouts', {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(form.amount.value),
        payment_account: form.payment_account.value
      })
    });
    showToast(`ส่งคำขอถอนเงินสำเร็จ! ยอดคงเหลือ: ฿${data.new_balance}`, 'success');
    currentUser.credit_balance = data.new_balance;
    updateAuthUI();
    form.reset();
  } catch (err) {
    showToast(err.error || 'ส่งคำขอไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

// =============================================
// Admin Panel
// =============================================
async function loadAdminPendingPrompts() {
  const container = document.getElementById('admin-prompts');
  if (!container) return;

  try {
    const { prompts } = await api('/admin/prompts?status=pending');
    container.innerHTML = prompts.length ? prompts.map(p => `
      <div class="admin-card">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description).substring(0, 200)}...</p>
        <p><strong>ผู้ขาย:</strong> ${escapeHtml(p.seller?.display_name)} (${escapeHtml(p.seller?.email)})</p>
        <p><strong>ราคา:</strong> ฿${parseFloat(p.price).toFixed(0)} | <strong>หมวด:</strong> ${p.category}</p>
        <div class="admin-actions">
          <button class="btn btn-primary btn-sm" onclick="moderatePrompt('${p.id}', 'approve')">อนุมัติ</button>
          <button class="btn btn-danger btn-sm" onclick="moderatePrompt('${p.id}', 'reject')">ปฏิเสธ</button>
        </div>
      </div>
    `).join('') : '<p class="text-muted">ไม่มี Prompt รออนุมัติ</p>';
  } catch (err) {
    showToast('โหลดไม่สำเร็จ', 'error');
  }
}

async function moderatePrompt(promptId, action) {
  let rejection_reason = '';
  if (action === 'reject') {
    rejection_reason = prompt('เหตุผลที่ปฏิเสธ:');
    if (rejection_reason === null) return;
  }

  try {
    await api('/admin/prompts', {
      method: 'PUT',
      body: JSON.stringify({ prompt_id: promptId, action, rejection_reason })
    });
    showToast(`${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}สำเร็จ`, 'success');
    loadAdminPendingPrompts();
  } catch (err) {
    showToast(err.error || 'ดำเนินการไม่สำเร็จ', 'error');
  }
}

async function loadAdminPayouts() {
  const container = document.getElementById('admin-payouts');
  if (!container) return;

  try {
    const { payouts } = await api('/admin/payouts?status=pending');
    container.innerHTML = payouts.length ? payouts.map(p => `
      <div class="admin-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
          <div>
            <div style="font-weight:600;font-size:1rem;color:#1a1a2e;margin-bottom:0.2rem;">
              <i class="bi bi-person-circle" style="color:#6c5ce7;"></i> ${escapeHtml(p.seller?.display_name)}
            </div>
            <div style="font-size:0.84rem;color:#64748b;">${escapeHtml(p.seller?.email)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.2rem;font-weight:700;color:#16a34a;">฿${parseFloat(p.amount).toFixed(2)}</div>
            <div style="font-size:0.8rem;color:#94a3b8;">${new Date(p.created_at).toLocaleString('th-TH')}</div>
          </div>
        </div>
        <div style="padding:0.6rem 0.75rem;background:#f0edff;border-radius:8px;font-size:0.88rem;margin-bottom:0.75rem;">
          <i class="bi bi-phone" style="color:#6c5ce7;"></i> <strong>PromptPay:</strong> ${escapeHtml(p.payment_account)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div class="form-group" style="margin:0;">
            <label style="font-size:0.82rem;"><i class="bi bi-image"></i> หลักฐานการโอน</label>
            <input type="file" id="proof-${p.id}" accept="image/jpeg,image/png,image/webp" style="font-size:0.82rem;">
          </div>
          <div class="form-group" style="margin:0;">
            <label style="font-size:0.82rem;"><i class="bi bi-chat-text"></i> หมายเหตุ</label>
            <input type="text" id="note-${p.id}" placeholder="หมายเหตุ (ถ้ามี)">
          </div>
        </div>
        <div class="admin-actions">
          <button class="btn btn-primary btn-sm" onclick="processPayout('${p.id}', 'approve')">
            <i class="bi bi-check-lg"></i> อนุมัติ + โอนแล้ว
          </button>
          <button class="btn btn-danger btn-sm" onclick="processPayout('${p.id}', 'reject')">
            <i class="bi bi-x-lg"></i> ปฏิเสธ
          </button>
        </div>
      </div>
    `).join('') : '<div class="empty-state"><i class="bi bi-inbox"></i><p>ไม่มีคำขอถอนเงิน</p></div>';
  } catch (err) {
    showToast('โหลดไม่สำเร็จ', 'error');
  }
}

async function processPayout(payoutId, action) {
  const noteInput = document.getElementById(`note-${payoutId}`);
  const admin_note = noteInput ? noteInput.value : '';

  let proof_image_base64 = null;
  let proof_filename = null;

  if (action === 'approve') {
    const fileInput = document.getElementById(`proof-${payoutId}`);
    const file = fileInput?.files[0];

    if (file) {
      // อ่านไฟล์เป็น base64
      proof_image_base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      proof_filename = file.name;
    }

    const okPay = await kpConfirm('ยืนยันว่าโอนเงินให้ผู้ขายแล้ว?', { icon: 'check-circle', confirmText: 'ยืนยัน' });
    if (!okPay) return;
  } else {
    const okReject = await kpConfirm('ยืนยันปฏิเสธคำขอถอนเงิน?<br><small style="color:var(--text-muted)">เครดิตจะถูกคืนให้ผู้ขาย</small>', { icon: 'x-circle', type: 'danger', confirmText: 'ปฏิเสธ' });
    if (!okReject) return;
  }

  try {
    const body = { payout_id: payoutId, action, admin_note };
    if (proof_image_base64) body.proof_image_base64 = proof_image_base64;
    if (proof_filename) body.proof_filename = proof_filename;

    await api('/admin/payouts', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    showToast(`${action === 'approve' ? 'อนุมัติ + แจ้ง Seller แล้ว' : 'ปฏิเสธ + คืนเครดิตแล้ว'}`, 'success');
    loadAdminPayouts();
  } catch (err) {
    showToast(err.error || 'ดำเนินการไม่สำเร็จ', 'error');
  }
}

async function loadAdminNotifications() {
  const container = document.getElementById('admin-notifications');
  const badge = document.getElementById('admin-notif-badge');
  if (!container) return;

  try {
    const { notifications, unread_count } = await api('/notifications');

    if (badge) {
      if (unread_count > 0) {
        badge.textContent = unread_count;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }

    if (!notifications || notifications.length === 0) {
      container.innerHTML = '<p class="text-muted">ไม่มีการแจ้งเตือน</p>';
      return;
    }

    container.innerHTML = `
      ${unread_count > 0 ? '<button class="btn btn-sm btn-outline" onclick="markAllAdminNotifsRead()" style="margin-bottom:0.75rem;"><i class="bi bi-check-all"></i> อ่านทั้งหมด</button>' : ''}
      ${notifications.slice(0, 20).map(n => `
        <div class="notif-item ${n.is_read ? '' : 'notif-unread'}">
          <div class="notif-icon"><i class="bi bi-${getNotifIcon(n.type)}"></i></div>
          <div class="notif-body">
            <strong>${escapeHtml(n.title)}</strong>
            <p>${escapeHtml(n.message)}</p>
            <small class="text-muted">${new Date(n.created_at).toLocaleString('th-TH')}</small>
          </div>
        </div>
      `).join('')}
    `;
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function markAllAdminNotifsRead() {
  try {
    await api('/notifications', { method: 'PUT', body: JSON.stringify({ mark_all: true }) });
    showToast('อ่านทั้งหมดแล้ว', 'success');
    loadAdminNotifications();
  } catch {}
}

// =============================================
// Seller — Edit Prompt (Modal)
// =============================================
async function openEditPrompt(promptId) {
  // ดึงข้อมูล prompt ปัจจุบัน
  try {
    const { prompt } = await api(`/prompts/${promptId}`);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'edit-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2><i class="bi bi-pencil-square"></i> แก้ไข Prompt</h2>
          <button class="modal-close" onclick="closeModal('edit-modal')">&times;</button>
        </div>
        <form onsubmit="handleEditPrompt(event, '${promptId}')">
          <div class="form-group">
            <label>ชื่อ Prompt</label>
            <input type="text" name="title" value="${escapeHtml(prompt.title)}" required>
          </div>
          <div class="form-group">
            <label>รายละเอียด</label>
            <textarea name="description" required>${escapeHtml(prompt.description)}</textarea>
          </div>
          <div class="form-group">
            <label>หมวดหมู่</label>
            <select name="category">
              ${['web-app','mobile-app','api','ecommerce','dashboard','landing-page','automation','other'].map(c =>
                `<option value="${c}" ${prompt.category === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>ราคา (บาท)</label>
            <input type="number" name="price" value="${prompt.price}" required min="0" step="1">
          </div>
          <div class="form-group">
            <label>Tech Stack (คั่นด้วย ,)</label>
            <input type="text" name="tech_stack" value="${(prompt.tech_stack || []).join(', ')}">
          </div>
          <div class="form-group">
            <label>Tags (คั่นด้วย ,)</label>
            <input type="text" name="tags" value="${(prompt.tags || []).join(', ')}">
          </div>
          <div class="form-group">
            <label>ตัวอย่างสั้นๆ</label>
            <textarea name="preview_text" rows="3">${escapeHtml(prompt.preview_text || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Demo URL</label>
            <input type="url" name="demo_url" value="${escapeHtml(prompt.demo_url || '')}">
          </div>
          <div class="form-group" style="display:flex;gap:0.5rem;">
            <button type="submit" class="btn btn-primary" style="flex:1">บันทึก (ส่งอนุมัติใหม่)</button>
            <button type="button" class="btn btn-outline" onclick="closeModal('edit-modal')">ยกเลิก</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (err) {
    showToast(err.error || 'โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

async function handleEditPrompt(e, promptId) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const body = {
      title: form.title.value,
      description: form.description.value,
      category: form.category.value,
      price: Number(form.price.value),
      demo_url: form.demo_url?.value || '',
      preview_text: form.preview_text?.value || '',
      tech_stack: form.tech_stack?.value ? form.tech_stack.value.split(',').map(s => s.trim()) : [],
      tags: form.tags?.value ? form.tags.value.split(',').map(s => s.trim()) : []
    };

    await api(`/prompts/${promptId}`, { method: 'PUT', body: JSON.stringify(body) });
    showToast('แก้ไขสำเร็จ! Prompt จะถูกส่งอนุมัติใหม่', 'success');
    closeModal('edit-modal');
    loadSellerDashboard();
  } catch (err) {
    showToast(err.error || 'แก้ไขไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

// =============================================
// Image Manager (Modal)
// =============================================
async function openImageManager(promptId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="bi bi-images"></i> จัดการรูปตัวอย่าง</h2>
        <button class="modal-close" onclick="closeModal('image-modal')">&times;</button>
      </div>
      <div id="image-list" class="image-grid"><div class="loading-state"><div class="spinner"></div></div></div>
      <div class="form-group" style="margin-top:1rem;">
        <label>อัปโหลดรูปใหม่ (สูงสุด 5 รูป, ไม่เกิน 5MB)</label>
        <input type="file" id="image-input" accept="image/jpeg,image/png,image/webp,image/gif" onchange="handleImageUpload('${promptId}')">
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  loadPromptImages(promptId);
}

async function loadPromptImages(promptId) {
  const container = document.getElementById('image-list');
  if (!container) return;

  try {
    const { prompt } = await api(`/prompts/${promptId}`);
    const images = prompt.images || [];

    container.innerHTML = images.length ? images.map(img => `
      <div class="image-item">
        <img src="${escapeHtml(img.image_url)}" alt="Preview">
        <button class="btn btn-danger btn-sm" onclick="deleteImage('${img.id}', '${promptId}')"><i class="bi bi-trash"></i></button>
      </div>
    `).join('') : '<p class="text-muted">ยังไม่มีรูป</p>';
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function handleImageUpload(promptId) {
  const input = document.getElementById('image-input');
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('ไฟล์ต้องมีขนาดไม่เกิน 5MB', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      await api('/images/upload', {
        method: 'POST',
        body: JSON.stringify({
          prompt_id: promptId,
          image_base64: e.target.result,
          filename: file.name
        })
      });
      showToast('อัปโหลดสำเร็จ', 'success');
      input.value = '';
      loadPromptImages(promptId);
    } catch (err) {
      showToast(err.error || 'อัปโหลดไม่สำเร็จ', 'error');
    }
  };
  reader.readAsDataURL(file);
}

async function deleteImage(imageId, promptId) {
  const ok = await kpConfirm('ลบรูปนี้?', { icon: 'trash', type: 'danger', confirmText: 'ลบ' });
  if (!ok) return;
  try {
    await api(`/images/delete?image_id=${imageId}`, { method: 'DELETE' });
    showToast('ลบรูปสำเร็จ', 'success');
    loadPromptImages(promptId);
  } catch (err) {
    showToast(err.error || 'ลบไม่สำเร็จ', 'error');
  }
}

// =============================================
// Admin — Tabs Init
// =============================================
function initAdminTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const contents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });

  // Support hash-based tab navigation
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const tabBtn = document.querySelector(`.admin-tab[data-tab="${hash}"]`);
    if (tabBtn) tabBtn.click();
  }
}

// =============================================
// Admin — Overview Stats + User Management + Settings
// =============================================
async function loadAdminOverview() {
  const container = document.getElementById('admin-overview');
  if (!container) return;

  try {
    const [usersData, promptsAll, promptsPending] = await Promise.all([
      api('/admin/users?limit=1'),
      api('/admin/prompts?status=approved&limit=1'),
      api('/admin/prompts?status=pending&limit=1')
    ]);

    container.innerHTML = `
      <div class="stats-grid admin-stats-grid">
        <div class="stat-card admin-stat-card">
          <div class="admin-stat-icon" style="background:#f0edff;color:#6c5ce7;"><i class="bi bi-people-fill"></i></div>
          <div class="stat-value">${usersData.total || 0}</div>
          <div class="stat-label">สมาชิกทั้งหมด</div>
        </div>
        <div class="stat-card admin-stat-card">
          <div class="admin-stat-icon" style="background:#dcfce7;color:#16a34a;"><i class="bi bi-check-circle-fill"></i></div>
          <div class="stat-value">${promptsAll.total || 0}</div>
          <div class="stat-label">Prompt อนุมัติแล้ว</div>
        </div>
        <div class="stat-card admin-stat-card">
          <div class="admin-stat-icon" style="background:#fef3c7;color:#d97706;"><i class="bi bi-hourglass-split"></i></div>
          <div class="stat-value">${promptsPending.total || 0}</div>
          <div class="stat-label">รออนุมัติ</div>
        </div>
      </div>
    `;
  } catch {
    container.innerHTML = '<p>โหลดภาพรวมไม่สำเร็จ</p>';
  }
}

async function loadAdminUsers() {
  const container = document.getElementById('admin-users');
  if (!container) return;

  try {
    const { users } = await api('/admin/users?limit=50');
    container.innerHTML = users.length ? `
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>ชื่อ</th><th>อีเมล</th><th>สิทธิ์</th><th>เครดิต</th><th><i class="bi bi-phone"></i> PromptPay</th><th>สถานะ</th><th>วันสมัคร</th><th>จัดการ</th></tr></thead>
          <tbody>${users.map(u => `
            <tr>
              <td>${escapeHtml(u.display_name)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td><span class="badge badge-${u.role === 'admin' ? 'danger' : u.role === 'seller' ? 'warning' : 'success'}">${u.role}</span></td>
              <td>฿${parseFloat(u.credit_balance).toFixed(2)}</td>
              <td>${u.promptpay_number ? `<span style="color:#6c5ce7;font-weight:500;">${escapeHtml(u.promptpay_number)}</span>` : '<span class="text-muted">ยังไม่ผูก</span>'}</td>
              <td><span class="badge badge-${u.status === 'active' ? 'success' : 'danger'}">${u.status}</span></td>
              <td style="font-size:0.8rem;color:#64748b;">${new Date(u.created_at).toLocaleDateString('th-TH')}</td>
              <td>
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                  <select onchange="updateUserRole('${u.id}', this.value)" style="padding:0.25rem;border-radius:4px;border:1px solid #e2e8f0;font-size:0.8rem;">
                    <option value="" disabled selected>เปลี่ยนสิทธิ์</option>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-primary'}"
                          onclick="toggleUserStatus('${u.id}', '${u.status === 'active' ? 'suspended' : 'active'}')">
                    ${u.status === 'active' ? 'ระงับ' : 'เปิดใช้'}
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="openUserDetail('${u.id}')" title="ดูรายละเอียด"><i class="bi bi-eye"></i></button>
                </div>
              </td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    ` : '<p class="text-muted">ไม่มีสมาชิก</p>';
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function openUserDetail(userId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'user-detail-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:650px;">
      <div class="modal-header">
        <h2><i class="bi bi-person-circle"></i> รายละเอียดสมาชิก</h2>
        <button class="modal-close" onclick="closeModal('user-detail-modal')">&times;</button>
      </div>
      <div id="user-detail-body"><div class="loading-state"><div class="spinner"></div></div></div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const { users } = await api(`/admin/users?search=${userId}&limit=50`);
    const u = users.find(x => x.id === userId);

    // Load credit transactions
    let txHtml = '<p class="text-muted">ไม่สามารถโหลดประวัติ</p>';
    try {
      const { data } = await fetch(`${API_BASE}/credits/history?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }).then(r => r.json());
      const txns = data?.transactions || data || [];
      if (Array.isArray(txns) && txns.length > 0) {
        txHtml = `<div class="table-wrapper"><table class="data-table"><thead><tr><th>วันที่</th><th>รายการ</th><th>จำนวน</th><th>คงเหลือ</th></tr></thead><tbody>${txns.slice(0, 20).map(t => `
          <tr>
            <td style="font-size:0.82rem;">${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
            <td style="font-size:0.82rem;">${escapeHtml(t.description || t.type || '—')}</td>
            <td style="font-size:0.82rem;" class="${parseFloat(t.amount) >= 0 ? 'text-success' : 'text-danger'}">${parseFloat(t.amount) >= 0 ? '+' : ''}฿${parseFloat(t.amount).toFixed(2)}</td>
            <td style="font-size:0.82rem;">฿${parseFloat(t.balance_after).toFixed(2)}</td>
          </tr>
        `).join('')}</tbody></table></div>`;
      } else {
        txHtml = '<p class="text-muted">ยังไม่มีรายการ</p>';
      }
    } catch {}

    document.getElementById('user-detail-body').innerHTML = u ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">
        <div style="padding:0.75rem;background:#f8fafc;border-radius:8px;">
          <div style="font-size:0.78rem;color:#64748b;">ชื่อ</div>
          <div style="font-weight:600;">${escapeHtml(u.display_name)}</div>
        </div>
        <div style="padding:0.75rem;background:#f8fafc;border-radius:8px;">
          <div style="font-size:0.78rem;color:#64748b;">อีเมล</div>
          <div style="font-weight:500;font-size:0.9rem;">${escapeHtml(u.email)}</div>
        </div>
        <div style="padding:0.75rem;background:#f8fafc;border-radius:8px;">
          <div style="font-size:0.78rem;color:#64748b;"><i class="bi bi-phone"></i> PromptPay</div>
          <div style="font-weight:600;color:${u.promptpay_number ? '#6c5ce7' : '#94a3b8'};">${u.promptpay_number ? `${u.promptpay_number}${u.promptpay_name ? ' (' + escapeHtml(u.promptpay_name) + ')' : ''}` : 'ยังไม่ผูก'}</div>
        </div>
        <div style="padding:0.75rem;background:#f8fafc;border-radius:8px;">
          <div style="font-size:0.78rem;color:#64748b;">เครดิตคงเหลือ</div>
          <div style="font-weight:700;color:#16a34a;">฿${parseFloat(u.credit_balance).toFixed(2)}</div>
        </div>
        <div style="padding:0.75rem;background:#f8fafc;border-radius:8px;">
          <div style="font-size:0.78rem;color:#64748b;">สิทธิ์ / สถานะ</div>
          <div><span class="badge badge-${u.role === 'admin' ? 'danger' : u.role === 'seller' ? 'warning' : 'success'}">${u.role}</span> <span class="badge badge-${u.status === 'active' ? 'success' : 'danger'}">${u.status}</span></div>
        </div>
        <div style="padding:0.75rem;background:#f8fafc;border-radius:8px;">
          <div style="font-size:0.78rem;color:#64748b;">วันที่สมัคร</div>
          <div style="font-size:0.9rem;">${new Date(u.created_at).toLocaleString('th-TH')}</div>
        </div>
      </div>
      <h3 style="margin-bottom:0.75rem;font-size:0.95rem;"><i class="bi bi-clock-history"></i> ประวัติ Transaction (ล่าสุด 20 รายการ)</h3>
      ${txHtml}
    ` : '<p>ไม่พบข้อมูลสมาชิก</p>';
  } catch {
    document.getElementById('user-detail-body').innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function updateUserRole(userId, role) {
  try {
    await api('/admin/users', { method: 'PUT', body: JSON.stringify({ user_id: userId, role }) });
    showToast('เปลี่ยนสิทธิ์สำเร็จ', 'success');
    loadAdminUsers();
  } catch (err) { showToast(err.error || 'ไม่สำเร็จ', 'error'); }
}

async function toggleUserStatus(userId, newStatus) {
  try {
    await api('/admin/users', { method: 'PUT', body: JSON.stringify({ user_id: userId, status: newStatus }) });
    showToast(`${newStatus === 'active' ? 'เปิดใช้' : 'ระงับ'}สำเร็จ`, 'success');
    loadAdminUsers();
  } catch (err) { showToast(err.error || 'ไม่สำเร็จ', 'error'); }
}

async function loadAdminSettings() {
  const container = document.getElementById('admin-settings');
  if (!container) return;

  try {
    const { settings } = await api('/admin/settings');
    container.innerHTML = `
      <form onsubmit="handleSaveSettings(event)">
        <div class="form-group">
          <label>ค่าคอมมิชชั่น (%)</label>
          <input type="number" name="commission_rate" value="${settings.commission_rate || 10}" min="0" max="100" step="1">
        </div>
        <div class="form-group">
          <label>ถอนขั้นต่ำ (บาท)</label>
          <input type="number" name="min_payout_amount" value="${settings.min_payout_amount || 100}" min="0" step="1">
        </div>
        <div class="form-group">
          <label>หมายเลข PromptPay รับเงิน</label>
          <input type="text" name="promptpay_number" value="${settings.promptpay_number || ''}" placeholder="เบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก">
        </div>
        <div class="form-group">
          <label>ชื่อบัญชี PromptPay</label>
          <input type="text" name="promptpay_name" value="${settings.promptpay_name || ''}" placeholder="ชื่อ-นามสกุล">
        </div>
        <div class="form-group">
          <label>ชื่อเว็บไซต์</label>
          <input type="text" name="site_name" value="${settings.site_name || 'KP Prompt Creator'}">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%"><i class="bi bi-save"></i> บันทึกการตั้งค่า</button>
      </form>
    `;
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        settings: {
          commission_rate: form.commission_rate.value,
          min_payout_amount: form.min_payout_amount.value,
          promptpay_number: form.promptpay_number.value,
          promptpay_name: form.promptpay_name.value,
          site_name: form.site_name.value
        }
      })
    });
    showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
  } catch (err) {
    showToast(err.error || 'บันทึกไม่สำเร็จ', 'error');
  }
}

// =============================================
// Orders Page (Buyer)
// =============================================
async function loadOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  try {
    const { orders } = await api('/orders');
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="bi bi-bag"></i><p>ยังไม่มีคำสั่งซื้อ</p><a href="/marketplace.html" class="btn btn-primary">เลือกซื้อ Prompt</a></div>';
      return;
    }
    container.innerHTML = orders.map(o => {
      const review = Array.isArray(o.review) ? o.review[0] : o.review;
      return `
      <div class="admin-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <div>
            <h3 style="margin:0;">${escapeHtml(o.prompt?.title || 'Prompt')}</h3>
            <small class="text-muted">${new Date(o.created_at).toLocaleDateString('th-TH')} | ฿${parseFloat(o.amount).toFixed(0)}</small>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="downloadPrompt('${o.prompt?.id}')"><i class="bi bi-download"></i> ดาวน์โหลด</button>
            <a href="/prompt-detail.html?id=${o.prompt?.id}" class="btn btn-outline btn-sm"><i class="bi bi-eye"></i></a>
            ${review
              ? `<span class="badge badge-success"><i class="bi bi-star-fill"></i> รีวิวแล้ว (${review.rating}/5)</span>`
              : `<button class="btn btn-sm btn-outline" onclick="openReviewModal('${o.id}', '${o.prompt?.id}', '${escapeHtml(o.prompt?.title || '')}')"><i class="bi bi-star"></i> รีวิว</button>`
            }
          </div>
        </div>
        ${review ? `<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #f1f5f9;"><span style="color:#f59e0b;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span> <span class="text-muted">${escapeHtml(review.comment || '')}</span></div>` : ''}
      </div>`;
    }).join('');
  } catch {
    container.innerHTML = '<p>โหลดไม่สำเร็จ</p>';
  }
}

// =============================================
// Review Modal
// =============================================
function openReviewModal(orderId, promptId, promptTitle) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'review-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="bi bi-star"></i> รีวิว "${escapeHtml(promptTitle)}"</h2>
        <button class="modal-close" onclick="closeModal('review-modal')">&times;</button>
      </div>
      <form onsubmit="handleCreateReview(event, '${orderId}', '${promptId}')">
        <div class="form-group">
          <label>คะแนน</label>
          <div class="star-rating" id="star-rating">
            ${[1,2,3,4,5].map(n => `<button type="button" class="star-btn" onclick="setRating(${n})"><i class="bi bi-star"></i></button>`).join('')}
          </div>
          <input type="hidden" name="rating" id="review-rating" required value="">
        </div>
        <div class="form-group">
          <label>ความคิดเห็น (ไม่บังคับ)</label>
          <textarea name="comment" rows="3" placeholder="แชร์ประสบการณ์ของคุณ..."></textarea>
        </div>
        <div style="display:flex;gap:0.5rem;">
          <button type="submit" class="btn btn-primary" style="flex:1">ส่งรีวิว</button>
          <button type="button" class="btn btn-outline" onclick="closeModal('review-modal')">ยกเลิก</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

function setRating(n) {
  document.getElementById('review-rating').value = n;
  const stars = document.querySelectorAll('#star-rating .star-btn i');
  stars.forEach((s, i) => {
    s.className = i < n ? 'bi bi-star-fill' : 'bi bi-star';
  });
}

async function handleCreateReview(e, orderId, promptId) {
  e.preventDefault();
  const form = e.target;
  const rating = Number(form.rating.value);
  if (!rating || rating < 1 || rating > 5) {
    showToast('กรุณาเลือกคะแนน 1-5 ดาว', 'error');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    await api('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        prompt_id: promptId,
        rating,
        comment: form.comment.value || ''
      })
    });
    showToast('ส่งรีวิวสำเร็จ!', 'success');
    closeModal('review-modal');
    loadOrders(); // reload orders to show review
  } catch (err) {
    showToast(err.error || 'ส่งรีวิวไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

// =============================================
// Account Page
// =============================================
async function loadAccountForm() {
  const container = document.getElementById('account-form');
  if (!container || !currentUser) return;

  const { data: fullUser } = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  }).then(r => r.json()).catch(() => ({ data: null }));

  const u = fullUser?.user || currentUser;
  container.innerHTML = `
    <form onsubmit="handleUpdateProfile(event)">
      <div class="form-group">
        <label>อีเมล</label>
        <input type="email" value="${escapeHtml(u.email)}" disabled style="background:#f1f5f9;">
      </div>
      <div class="form-group">
        <label>ชื่อที่แสดง</label>
        <input type="text" name="display_name" value="${escapeHtml(u.display_name)}" required>
      </div>
      <div class="form-group">
        <label><i class="bi bi-phone"></i> หมายเลขพร้อมเพย์</label>
        <input type="text" name="promptpay_number" value="${escapeHtml(u.promptpay_number || '')}" placeholder="เบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก">
        <small style="color:#64748b;">ใช้สำหรับรับเงินจากการขาย Prompt (ต้องตั้งก่อนถอนเงิน)</small>
      </div>
      <div class="form-group">
        <label>ชื่อบัญชีพร้อมเพย์</label>
        <input type="text" name="promptpay_name" value="${escapeHtml(u.promptpay_name || '')}" placeholder="ชื่อ-นามสกุล ตามบัญชี">
      </div>
      <div class="form-group">
        <label>สิทธิ์</label>
        <input type="text" value="${u.role}" disabled style="background:#f1f5f9;">
      </div>
      <div class="form-group">
        <label>เครดิตคงเหลือ</label>
        <input type="text" value="฿${parseFloat(u.credit_balance).toFixed(2)}" disabled style="background:#f1f5f9;">
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%">บันทึก</button>
    </form>
  `;
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const form = e.target;
  try {
    const { user } = await api('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({
        display_name: form.display_name.value,
        promptpay_number: form.promptpay_number?.value || '',
        promptpay_name: form.promptpay_name?.value || ''
      })
    });
    currentUser.display_name = user.display_name;
    currentUser.promptpay_number = user.promptpay_number;
    currentUser.promptpay_name = user.promptpay_name;
    updateAuthUI();
    showToast('บันทึกสำเร็จ', 'success');
  } catch (err) { showToast(err.error || 'บันทึกไม่สำเร็จ', 'error'); }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: form.current_password.value,
        new_password: form.new_password.value
      })
    });
    showToast('เปลี่ยนรหัสผ่านสำเร็จ', 'success');
    form.reset();
  } catch (err) { showToast(err.error || 'เปลี่ยนไม่สำเร็จ', 'error'); }
}

// =============================================
// Admin — Prompt Status Tabs
// =============================================
async function loadAdminPromptsByStatus(status) {
  const container = document.getElementById('admin-prompts');
  if (!container) return;

  container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  try {
    const { prompts } = await api(`/admin/prompts?status=${status}`);
    container.innerHTML = prompts.length ? prompts.map(p => `
      <div class="admin-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <h3 style="margin-bottom:0.3rem;">${escapeHtml(p.title)}</h3>
            <p style="margin-bottom:0.5rem;">${escapeHtml(p.description).substring(0, 200)}...</p>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;font-size:0.84rem;">
              <span style="color:#475569;"><i class="bi bi-person"></i> ${escapeHtml(p.seller?.display_name)}</span>
              <span style="color:#6c5ce7;font-weight:600;">฿${parseFloat(p.price).toFixed(0)}</span>
              <span class="badge" style="background:#f0edff;color:#6c5ce7;">${p.category}</span>
              ${p.kp_signature
                ? '<span class="badge badge-success"><i class="bi bi-patch-check-fill"></i> KP Verified</span>'
                : '<span class="badge badge-warning"><i class="bi bi-exclamation-triangle"></i> ไม่มี KP Signature</span>'
              }
            </div>
          </div>
          <a href="/prompt-detail.html?id=${p.id}" class="btn btn-sm btn-outline" target="_blank" title="ดูรายละเอียด"><i class="bi bi-eye"></i></a>
        </div>
        ${p.rejection_reason ? `<div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:0.85rem;"><i class="bi bi-x-circle"></i> <strong>เหตุผล:</strong> ${escapeHtml(p.rejection_reason)}</div>` : ''}
        ${status === 'pending' ? `
          <div class="admin-actions">
            <button class="btn btn-primary btn-sm" onclick="moderatePrompt('${p.id}', 'approve')"><i class="bi bi-check-lg"></i> อนุมัติ</button>
            <button class="btn btn-danger btn-sm" onclick="moderatePrompt('${p.id}', 'reject')"><i class="bi bi-x-lg"></i> ปฏิเสธ</button>
          </div>
        ` : ''}
      </div>
    `).join('') : `<div class="empty-state"><i class="bi bi-inbox"></i><p>ไม่มี Prompt สถานะ ${status}</p></div>`;
  } catch { container.innerHTML = '<p>โหลดไม่สำเร็จ</p>'; }
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

// =============================================
// Init — detect page and load content
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();

  // Hamburger menu toggle
  const navbar = document.querySelector('.mp-navbar');
  if (navbar) {
    const navLinks = navbar.querySelector('.nav-links');
    if (navLinks && !navbar.querySelector('.nav-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.innerHTML = '<i class="bi bi-list"></i>';
      toggle.onclick = () => navLinks.classList.toggle('show');
      navbar.querySelector('.nav-brand').after(toggle);
    }
  }

  const page = window.location.pathname;

  if (page.includes('orders') && !page.includes('admin')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    loadOrders();
  } else if (page.includes('account')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    loadAccountForm();
  } else if (page.includes('marketplace')) {
    loadPrompts();
  } else if (page.includes('prompt-detail')) {
    loadPromptDetail();
  } else if (page.includes('topup')) {
    if (!currentUser) { window.location.href = '/auth.html'; return; }
    loadCreditHistory();
  } else if (page.includes('dashboard')) {
    if (!currentUser || !['seller', 'admin'].includes(currentUser.role)) {
      window.location.href = '/auth.html'; return;
    }
    initDashboardTabs();
    setupFilePreview('prompt-file-input', 'prompt-file-info', { type: 'file' });
    setupFilePreview('preview-image-input', 'preview-image-preview', { type: 'image' });
    setupFilePreview('detail-images-input', 'detail-images-preview', { type: 'images' });
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
    loadAdminPendingPrompts();
    loadAdminPayouts();
    loadAdminUsers();
    loadAdminSettings();
  }
});
