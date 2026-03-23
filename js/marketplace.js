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

  if (!confirm('ยืนยันการซื้อ Prompt นี้?')) return;

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
      if (confirm('ต้องการไปเติมเงินหรือไม่?')) {
        window.location.href = '/topup.html';
      }
    } else {
      showToast(err.error || 'ซื้อไม่สำเร็จ', 'error');
    }
  }
}

async function downloadPrompt(promptId) {
  try {
    const { title, content } = await api(`/prompts/download?prompt_id=${promptId}`);
    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
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
      body: JSON.stringify({ angpao_link: form.angpao_link.value })
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
            <a href="/prompt-detail.html?id=${p.id}" class="btn btn-sm btn-outline">ดู</a>
          </td>
        </tr>
      `).join('') : '<tr><td colspan="6">ยังไม่มี Prompt</td></tr>';
    }
  } catch (err) {
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

async function handleCreatePrompt(e) {
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
      prompt_content: form.prompt_content.value,
      demo_url: form.demo_url?.value || '',
      preview_text: form.preview_text?.value || '',
      tech_stack: form.tech_stack?.value ? form.tech_stack.value.split(',').map(s => s.trim()) : [],
      tags: form.tags?.value ? form.tags.value.split(',').map(s => s.trim()) : []
    };

    await api('/prompts', { method: 'POST', body: JSON.stringify(body) });
    showToast('สร้าง Prompt สำเร็จ! รออนุมัติ', 'success');
    form.reset();
    loadSellerDashboard();
  } catch (err) {
    showToast(err.error || 'สร้างไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
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
        <p><strong>ผู้ขาย:</strong> ${escapeHtml(p.seller?.display_name)} (${escapeHtml(p.seller?.email)})</p>
        <p><strong>จำนวน:</strong> ฿${parseFloat(p.amount).toFixed(2)}</p>
        <p><strong>บัญชี:</strong> ${escapeHtml(p.payment_account)}</p>
        <div class="admin-actions">
          <button class="btn btn-primary btn-sm" onclick="processPayout('${p.id}', 'approve')">อนุมัติ</button>
          <button class="btn btn-danger btn-sm" onclick="processPayout('${p.id}', 'reject')">ปฏิเสธ</button>
        </div>
      </div>
    `).join('') : '<p class="text-muted">ไม่มีคำขอถอนเงิน</p>';
  } catch (err) {
    showToast('โหลดไม่สำเร็จ', 'error');
  }
}

async function processPayout(payoutId, action) {
  const admin_note = prompt(`หมายเหตุ (${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}):`);
  if (admin_note === null) return;

  try {
    await api('/admin/payouts', {
      method: 'PUT',
      body: JSON.stringify({ payout_id: payoutId, action, admin_note })
    });
    showToast('ดำเนินการสำเร็จ', 'success');
    loadAdminPayouts();
  } catch (err) {
    showToast(err.error || 'ดำเนินการไม่สำเร็จ', 'error');
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

// =============================================
// Init — detect page and load content
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();

  const page = window.location.pathname;

  if (page.includes('marketplace')) {
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
    loadSellerDashboard();
  } else if (page.includes('admin')) {
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/auth.html'; return;
    }
    loadAdminPendingPrompts();
    loadAdminPayouts();
  }
});
