// =============================================
// KP Prompt Creator — Dashboard & Admin
// =============================================

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
  // Check if we need to pre-fill from saved prompt (sell flow)
  prefillFromSavedPrompt();

  const container = document.getElementById('seller-dashboard');
  if (!container) return;

  try {
    const { stats, prompts } = await api('/seller/stats');

    const el = (id) => document.getElementById(id);
    if (el('stat-prompts')) el('stat-prompts').textContent = stats.total_prompts;
    if (el('stat-approved')) el('stat-approved').textContent = stats.approved_prompts;
    if (el('stat-sales')) el('stat-sales').textContent = stats.total_sales;
    if (el('stat-revenue')) el('stat-revenue').textContent = `฿${stats.total_revenue.toFixed(2)}`;
    if (el('stat-balance')) el('stat-balance').textContent = `฿${stats.credit_balance.toFixed(2)}`;

    const list = document.getElementById('seller-prompts');
    if (list) {
      list.innerHTML = prompts.length ? prompts.map(p => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="py-2.5 px-3 text-sm font-medium text-slate-800 max-w-[200px] truncate">${escapeHtml(p.title)}</td>
          <td class="py-2.5 px-3 text-sm font-semibold ${isFreePrompt(p.price) ? 'text-emerald-600' : 'text-indigo-600'}">${formatPromptPrice(p.price)}</td>
          <td class="py-2.5 px-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${
            p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
            p.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
            'bg-amber-50 text-amber-600'
          }">${p.status}</span></td>
          <td class="py-2.5 px-3 text-sm text-slate-600">${p.purchase_count || 0}</td>
          <td class="py-2.5 px-3 text-sm text-amber-500">${p.avg_rating ? '★ ' + p.avg_rating : '—'}</td>
          <td class="py-2.5 px-3">
            <div class="flex gap-1.5">
              <button onclick="openEditPrompt('${p.id}')" class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">แก้ไข</button>
              <button onclick="openImageManager('${p.id}')" class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">รูป</button>
              <a href="/prompt-detail.html?id=${p.id}" class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">ดู</a>
            </div>
          </td>
        </tr>
      `).join('') : '<tr><td colspan="6" class="text-center py-8 text-slate-400 text-sm">ยังไม่มี Prompt</td></tr>';
    }
  } catch (err) {
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

// =============================================
// Create Prompt
// =============================================
async function handleCreatePrompt(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const origText = btn.innerHTML;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> กำลังอัปโหลด...';

  try {
    if (normalizePromptPrice(form.price.value) < 0) {
      showToast('ราคาต้องเป็น 0 บาทขึ้นไป', 'error');
      return;
    }

    const promptFile = document.getElementById('prompt-file-input')?.files[0];
    if (!promptFile) { showToast('กรุณาเลือกไฟล์ Prompt (.md)', 'error'); return; }
    const promptFileBase64 = await readFileAsBase64(promptFile);

    const previewImageFile = document.getElementById('preview-image-input')?.files[0];
    if (!previewImageFile) { showToast('กรุณาเลือกรูปพรีวิว', 'error'); return; }
    if (previewImageFile.size > 5 * 1024 * 1024) { showToast('รูปพรีวิวต้องไม่เกิน 5MB', 'error'); return; }
    const previewImageBase64 = await readFileAsBase64(previewImageFile);

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

    if (result.warnings?.length) result.warnings.forEach(w => showToast(w, 'error'));

    showToast(result.kp_verified
      ? 'สร้าง Prompt สำเร็จ! (KP Verified) รออนุมัติ'
      : 'สร้าง Prompt สำเร็จ! รออนุมัติ', 'success');
    form.reset();
    ['prompt-file-info', 'preview-image-preview', 'detail-images-preview'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    });
    setupPromptPricingHelpers();
    loadSellerDashboard();
    const tab = document.querySelector('.dash-tab[data-tab="tab-prompts"]');
    if (tab) tab.click();
  } catch (err) {
    showToast(err.error || 'สร้างไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origText;
  }
}

// =============================================
// Income History (all transactions)
// =============================================
async function loadSellerIncomeHistory() {
  const container = document.getElementById('seller-income-history');
  if (!container) return;

  try {
    const { transactions } = await api('/credits/history');
    if (!transactions || transactions.length === 0) {
      container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">ยังไม่มีรายการ</p>';
      return;
    }
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-slate-200">
            <th class="text-left py-3 px-3 text-slate-500 font-medium">วันที่</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">รายการ</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">ประเภท</th>
            <th class="text-right py-3 px-3 text-slate-500 font-medium">จำนวน</th>
            <th class="text-right py-3 px-3 text-slate-500 font-medium">คงเหลือ</th>
          </tr></thead>
          <tbody>${transactions.map(t => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="py-2.5 px-3 text-slate-500">${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
              <td class="py-2.5 px-3 text-slate-700">${escapeHtml(t.description || t.type)}</td>
              <td class="py-2.5 px-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${
                t.type === 'topup' ? 'bg-blue-50 text-blue-600' :
                t.type === 'sale' ? 'bg-emerald-50 text-emerald-600' :
                t.type === 'purchase' ? 'bg-violet-50 text-violet-600' :
                'bg-slate-100 text-slate-600'
              }">${t.type}</span></td>
              <td class="py-2.5 px-3 text-right font-medium ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}">${t.amount >= 0 ? '+' : ''}฿${parseFloat(t.amount).toFixed(2)}</td>
              <td class="py-2.5 px-3 text-right text-slate-600">฿${parseFloat(t.balance_after).toFixed(2)}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

// =============================================
// Notifications
// =============================================
function getNotifIcon(type) {
  const icons = {
    prompt_approved: 'check-circle', prompt_rejected: 'x-circle',
    new_sale: 'shopping-bag', system: 'info'
  };
  return icons[type] || 'bell';
}

async function loadSellerNotifications() {
  const container = document.getElementById('seller-notifications');
  const badge = document.getElementById('notif-badge');
  if (!container) return;

  try {
    const { notifications, unread_count } = await api('/notifications');

    if (badge) {
      badge.textContent = unread_count > 0 ? unread_count : '';
      badge.style.display = unread_count > 0 ? '' : 'none';
    }

    if (!notifications || notifications.length === 0) {
      container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">ไม่มีการแจ้งเตือน</p>';
      return;
    }

    container.innerHTML = `
      ${unread_count > 0 ? '<button class="mb-3 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors" onclick="markAllNotificationsRead()">อ่านทั้งหมด</button>' : ''}
      <div class="space-y-2">
        ${notifications.map(n => `
          <div class="notif-item ${n.is_read ? '' : 'notif-unread'}" onclick="markNotificationRead('${n.id}')">
            <div class="notif-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>
            <div class="notif-body">
              <strong>${escapeHtml(n.title)}</strong>
              <p>${escapeHtml(n.message)}</p>
              <small class="text-slate-400">${new Date(n.created_at).toLocaleString('th-TH')}</small>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
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

// =============================================
// Edit Prompt Modal
// =============================================
async function openEditPrompt(promptId) {
  try {
    const { prompt } = await api(`/prompts/${promptId}`);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'edit-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>แก้ไข Prompt</h2>
          <button class="modal-close" onclick="closeModal('edit-modal')">&times;</button>
        </div>
        <form onsubmit="handleEditPrompt(event, '${promptId}')" class="space-y-3">
          <div><label class="block text-sm font-medium text-slate-700 mb-1">ชื่อ</label><input type="text" name="title" value="${escapeHtml(prompt.title)}" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">รายละเอียด</label><textarea name="description" required rows="3" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">${escapeHtml(prompt.description)}</textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-sm font-medium text-slate-700 mb-1">หมวด</label><select name="category" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">${['web-app','mobile-app','api','ecommerce','dashboard','landing-page','automation','other'].map(c => `<option value="${c}" ${prompt.category === c ? 'selected' : ''}>${getPromptCategoryLabel(c)}</option>`).join('')}</select></div>
            <div><label class="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท)</label><input type="number" name="price" value="${prompt.price}" required min="0" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"><p data-price-helper class="mt-1.5 text-xs text-slate-400"></p></div>
          </div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Tech Stack (คั่นด้วย ,)</label><input type="text" name="tech_stack" value="${(prompt.tech_stack || []).join(', ')}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Tags (คั่นด้วย ,)</label><input type="text" name="tags" value="${(prompt.tags || []).join(', ')}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Demo URL</label><input type="url" name="demo_url" value="${escapeHtml(prompt.demo_url || '')}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">บันทึก (ส่งอนุมัติใหม่)</button>
            <button type="button" class="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50" onclick="closeModal('edit-modal')">ยกเลิก</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    setupPromptPricingHelpers(modal);
  } catch (err) { showToast(err.error || 'โหลดไม่สำเร็จ', 'error'); }
}

async function handleEditPrompt(e, promptId) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    if (normalizePromptPrice(form.price.value) < 0) {
      showToast('ราคาต้องเป็น 0 บาทขึ้นไป', 'error');
      return;
    }

    await api(`/prompts/${promptId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: form.title.value, description: form.description.value,
        category: form.category.value, price: Number(form.price.value),
        demo_url: form.demo_url?.value || '',
        tech_stack: form.tech_stack?.value ? form.tech_stack.value.split(',').map(s => s.trim()) : [],
        tags: form.tags?.value ? form.tags.value.split(',').map(s => s.trim()) : []
      })
    });
    showToast('แก้ไขสำเร็จ! ส่งอนุมัติใหม่', 'success');
    closeModal('edit-modal');
    loadSellerDashboard();
  } catch (err) { showToast(err.error || 'แก้ไขไม่สำเร็จ', 'error'); }
  finally { btn.disabled = false; }
}

function setupPromptPricingHelpers(root = document) {
  const priceInput = root.querySelector('input[name="price"]');
  const helperEl = root.querySelector('[data-price-helper]');
  bindPromptPricingHelper(priceInput, helperEl);
}

// =============================================
// Image Manager Modal
// =============================================
async function openImageManager(promptId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>จัดการรูปตัวอย่าง</h2>
        <button class="modal-close" onclick="closeModal('image-modal')">&times;</button>
      </div>
      <div id="image-list" class="image-grid"><div class="flex justify-center py-8"><div class="spinner"></div></div></div>
      <div class="mt-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">อัปโหลดรูปใหม่ (สูงสุด 5, ไม่เกิน 5MB)</label>
        <input type="file" id="image-input" accept="image/jpeg,image/png,image/webp,image/gif" onchange="handleImageUpload('${promptId}')" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2">
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
        <button class="px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded" onclick="deleteImage('${img.id}', '${promptId}')">ลบ</button>
      </div>
    `).join('') : '<p class="text-sm text-slate-400 text-center py-4">ยังไม่มีรูป</p>';
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

async function handleImageUpload(promptId) {
  const input = document.getElementById('image-input');
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('ไม่เกิน 5MB', 'error'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await api('/images/upload', { method: 'POST', body: JSON.stringify({ prompt_id: promptId, image_base64: e.target.result, filename: file.name }) });
      showToast('อัปโหลดสำเร็จ', 'success');
      input.value = '';
      loadPromptImages(promptId);
    } catch (err) { showToast(err.error || 'อัปโหลดไม่สำเร็จ', 'error'); }
  };
  reader.readAsDataURL(file);
}

async function deleteImage(imageId, promptId) {
  const ok = await kpConfirm('ลบรูปนี้?', { icon: 'trash', type: 'danger', confirmText: 'ลบ' });
  if (!ok) return;
  try {
    await api(`/images/delete?image_id=${imageId}`, { method: 'DELETE' });
    showToast('ลบสำเร็จ', 'success');
    loadPromptImages(promptId);
  } catch (err) { showToast(err.error || 'ลบไม่สำเร็จ', 'error'); }
}

// =============================================
// Admin Panel
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
  const hash = window.location.hash.replace('#', '');
  if (hash) { const t = document.querySelector(`.admin-tab[data-tab="${hash}"]`); if (t) t.click(); }
}

async function loadAdminOverview() {
  const container = document.getElementById('admin-overview');
  if (!container) return;
  try {
    const [usersData, promptsAll, promptsPending] = await Promise.all([
      api('/admin/users?limit=1'), api('/admin/prompts?status=approved&limit=1'), api('/admin/prompts?status=pending&limit=1')
    ]);
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
          <div><div class="text-2xl font-bold text-slate-800">${usersData.total || 0}</div><div class="text-xs text-slate-500">สมาชิก</div></div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
          <div><div class="text-2xl font-bold text-slate-800">${promptsAll.total || 0}</div><div class="text-xs text-slate-500">อนุมัติแล้ว</div></div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
          <div><div class="text-2xl font-bold text-slate-800">${promptsPending.total || 0}</div><div class="text-xs text-slate-500">รออนุมัติ</div></div>
        </div>
      </div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

async function loadAdminPendingPrompts() {
  loadAdminPromptsByStatus('pending');
}

async function loadAdminPromptsByStatus(status) {
  const container = document.getElementById('admin-prompts');
  if (!container) return;
  container.innerHTML = '<div class="flex justify-center py-8"><div class="spinner"></div></div>';
  try {
    const { prompts } = await api(`/admin/prompts?status=${status}`);
    container.innerHTML = prompts.length ? prompts.map(p => `
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div class="flex justify-between items-start gap-3 flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <h3 class="font-semibold text-slate-800 mb-1">${escapeHtml(p.title)}</h3>
            <p class="text-sm text-slate-500 mb-2 line-clamp-2">${escapeHtml(p.description).substring(0, 200)}</p>
            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span class="text-slate-500">${escapeHtml(p.seller?.display_name)}</span>
              <span class="font-semibold ${isFreePrompt(p.price) ? 'text-emerald-600' : 'text-indigo-600'}">${formatPromptPrice(p.price)}</span>
              ${renderPromptCategoryBadges(p.category, p.price)}
              ${p.kp_signature
                ? '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">KP Verified</span>'
                : '<span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">ไม่มี KP</span>'
              }
            </div>
          </div>
          <a href="/prompt-detail.html?id=${p.id}" target="_blank" class="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">ดู</a>
        </div>
        ${p.rejection_reason ? `<div class="mt-2 p-2 bg-rose-50 rounded-lg text-sm text-rose-600">เหตุผล: ${escapeHtml(p.rejection_reason)}</div>` : ''}
        ${status === 'pending' ? `
          <div class="flex gap-2 mt-3">
            <button onclick="moderatePrompt('${p.id}', 'approve')" class="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg font-medium hover:bg-emerald-600 transition-colors">อนุมัติ</button>
            <button onclick="moderatePrompt('${p.id}', 'reject')" class="px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg font-medium hover:bg-rose-600 transition-colors">ปฏิเสธ</button>
          </div>
        ` : ''}
      </div>
    `).join('') : `<p class="text-sm text-slate-400 text-center py-8">ไม่มี Prompt สถานะ ${status}</p>`;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

async function moderatePrompt(promptId, action) {
  let rejection_reason = '';
  if (action === 'reject') {
    rejection_reason = prompt('เหตุผลที่ปฏิเสธ:');
    if (rejection_reason === null) return;
  }
  try {
    await api('/admin/prompts', { method: 'PUT', body: JSON.stringify({ prompt_id: promptId, action, rejection_reason }) });
    showToast(`${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}สำเร็จ`, 'success');
    loadAdminPendingPrompts();
  } catch (err) { showToast(err.error || 'ไม่สำเร็จ', 'error'); }
}

// Admin notifications
async function loadAdminNotifications() {
  const container = document.getElementById('admin-notifications');
  const badge = document.getElementById('admin-notif-badge');
  if (!container) return;
  try {
    const { notifications, unread_count } = await api('/notifications');
    if (badge) { badge.textContent = unread_count > 0 ? unread_count : ''; badge.style.display = unread_count > 0 ? '' : 'none'; }
    if (!notifications || notifications.length === 0) { container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">ไม่มีการแจ้งเตือน</p>'; return; }
    container.innerHTML = `
      ${unread_count > 0 ? '<button class="mb-3 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600" onclick="markAllAdminNotifsRead()">อ่านทั้งหมด</button>' : ''}
      <div class="space-y-2">${notifications.slice(0, 20).map(n => `
        <div class="notif-item ${n.is_read ? '' : 'notif-unread'}">
          <div class="notif-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>
          <div class="notif-body"><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.message)}</p><small class="text-slate-400">${new Date(n.created_at).toLocaleString('th-TH')}</small></div>
        </div>
      `).join('')}</div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

async function markAllAdminNotifsRead() {
  try { await api('/notifications', { method: 'PUT', body: JSON.stringify({ mark_all: true }) }); showToast('อ่านทั้งหมดแล้ว', 'success'); loadAdminNotifications(); } catch {}
}

// Admin users
async function loadAdminUsers() {
  const container = document.getElementById('admin-users');
  if (!container) return;
  try {
    const { users } = await api('/admin/users?limit=50');
    container.innerHTML = users.length ? `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-slate-200">
            <th class="text-left py-3 px-3 text-slate-500 font-medium">ชื่อ</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">อีเมล</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">สิทธิ์</th>
            <th class="text-right py-3 px-3 text-slate-500 font-medium">เครดิต</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">สถานะ</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">จัดการ</th>
          </tr></thead>
          <tbody>${users.map(u => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="py-2.5 px-3 font-medium text-slate-800">${escapeHtml(u.display_name)}</td>
              <td class="py-2.5 px-3 text-slate-500">${escapeHtml(u.email)}</td>
              <td class="py-2.5 px-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}">${u.role}</span></td>
              <td class="py-2.5 px-3 text-right font-medium text-emerald-600">฿${parseFloat(u.credit_balance).toFixed(2)}</td>
              <td class="py-2.5 px-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">${u.status}</span></td>
              <td class="py-2.5 px-3">
                <div class="flex gap-1.5 flex-wrap">
                  <select onchange="updateUserRole('${u.id}', this.value)" class="text-xs border border-slate-200 rounded-lg px-2 py-1">
                    <option value="" disabled selected>เปลี่ยน</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onclick="toggleUserStatus('${u.id}', '${u.status === 'active' ? 'suspended' : 'active'}')" class="px-2 py-1 text-xs rounded-lg font-medium ${u.status === 'active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} transition-colors">${u.status === 'active' ? 'ระงับ' : 'เปิดใช้'}</button>
                </div>
              </td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    ` : '<p class="text-sm text-slate-400 text-center py-8">ไม่มีสมาชิก</p>';
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

async function updateUserRole(userId, role) {
  try { await api('/admin/users', { method: 'PUT', body: JSON.stringify({ user_id: userId, role }) }); showToast('เปลี่ยนสิทธิ์สำเร็จ', 'success'); loadAdminUsers(); }
  catch (err) { showToast(err.error || 'ไม่สำเร็จ', 'error'); }
}

async function toggleUserStatus(userId, newStatus) {
  try { await api('/admin/users', { method: 'PUT', body: JSON.stringify({ user_id: userId, status: newStatus }) }); showToast(`${newStatus === 'active' ? 'เปิดใช้' : 'ระงับ'}สำเร็จ`, 'success'); loadAdminUsers(); }
  catch (err) { showToast(err.error || 'ไม่สำเร็จ', 'error'); }
}

// Admin settings
async function loadAdminSettings() {
  const container = document.getElementById('admin-settings');
  if (!container) return;
  try {
    const { settings } = await api('/admin/settings');
    container.innerHTML = `
      <form onsubmit="handleSaveSettings(event)" class="space-y-4 max-w-md">
        <div><label class="block text-sm font-medium text-slate-700 mb-1">ค่าคอมมิชชั่น (%)</label><input type="number" name="commission_rate" value="${settings.commission_rate || 10}" min="0" max="100" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
        <div><label class="block text-sm font-medium text-slate-700 mb-1">หมายเลข PromptPay รับเงิน</label><input type="text" name="promptpay_number" value="${settings.promptpay_number || ''}" placeholder="เบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
        <div><label class="block text-sm font-medium text-slate-700 mb-1">ชื่อบัญชี PromptPay</label><input type="text" name="promptpay_name" value="${settings.promptpay_name || ''}" placeholder="ชื่อ-นามสกุล" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
        <div><label class="block text-sm font-medium text-slate-700 mb-1">ชื่อเว็บไซต์</label><input type="text" name="site_name" value="${settings.site_name || 'KP Prompt Creator'}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
        <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">บันทึกการตั้งค่า</button>
      </form>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: { commission_rate: form.commission_rate.value, promptpay_number: form.promptpay_number.value, promptpay_name: form.promptpay_name.value, site_name: form.site_name.value } })
    });
    showToast('บันทึกสำเร็จ', 'success');
  } catch (err) { showToast(err.error || 'บันทึกไม่สำเร็จ', 'error'); }
}

// =============================================
// Seller Payout (PromptPay)
// =============================================
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
    loadSellerPayoutHistory();
  } catch (err) {
    showToast(err.error || 'ส่งคำขอไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function loadSellerPayoutHistory() {
  const container = document.getElementById('seller-payout-history');
  if (!container) return;

  try {
    const { payouts } = await api('/seller/payouts');
    if (!payouts || payouts.length === 0) {
      container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">ยังไม่มีประวัติการถอน</p>';
      return;
    }
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-slate-200">
            <th class="text-left py-3 px-3 text-slate-500 font-medium">วันที่</th>
            <th class="text-right py-3 px-3 text-slate-500 font-medium">จำนวน</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">บัญชี</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">สถานะ</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">หมายเหตุ</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">หลักฐาน</th>
          </tr></thead>
          <tbody>${payouts.map(p => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="py-2.5 px-3 text-slate-500">${new Date(p.created_at).toLocaleDateString('th-TH')}</td>
              <td class="py-2.5 px-3 text-right font-medium text-slate-800">฿${parseFloat(p.amount).toFixed(2)}</td>
              <td class="py-2.5 px-3 text-slate-600">${escapeHtml(p.payment_account || '')}</td>
              <td class="py-2.5 px-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${
                p.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                p.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                'bg-amber-50 text-amber-600'
              }">${p.status === 'paid' ? 'โอนแล้ว' : p.status === 'rejected' ? 'ปฏิเสธ' : 'รอดำเนินการ'}</span></td>
              <td class="py-2.5 px-3 text-slate-500 text-xs">${escapeHtml(p.admin_note || '—')}</td>
              <td class="py-2.5 px-3">${p.proof_image_url
                ? `<a href="${escapeHtml(p.proof_image_url)}" target="_blank" class="text-indigo-600 hover:underline text-xs">ดูหลักฐาน</a>`
                : '<span class="text-slate-400 text-xs">—</span>'
              }</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

// =============================================
// Admin Payouts
// =============================================
async function loadAdminPayouts() {
  const container = document.getElementById('admin-payouts');
  if (!container) return;

  try {
    const { payouts } = await api('/admin/payouts?status=pending');
    container.innerHTML = payouts.length ? payouts.map(p => `
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div class="flex justify-between items-start gap-3 flex-wrap mb-3">
          <div>
            <div class="font-semibold text-slate-800">${escapeHtml(p.seller?.display_name)}</div>
            <div class="text-xs text-slate-500">${escapeHtml(p.seller?.email)}</div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-emerald-600">฿${parseFloat(p.amount).toFixed(2)}</div>
            <div class="text-xs text-slate-400">${new Date(p.created_at).toLocaleString('th-TH')}</div>
          </div>
        </div>
        <div class="px-3 py-2 bg-indigo-50 rounded-lg text-sm mb-3">
          <strong>PromptPay:</strong> ${escapeHtml(p.payment_account)}
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">หลักฐานการโอน</label>
            <input type="file" id="proof-${p.id}" accept="image/jpeg,image/png,image/webp" class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">หมายเหตุ</label>
            <input type="text" id="note-${p.id}" placeholder="หมายเหตุ (ถ้ามี)" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="processPayout('${p.id}', 'approve')" class="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg font-medium hover:bg-emerald-600 transition-colors">อนุมัติ + โอนแล้ว</button>
          <button onclick="processPayout('${p.id}', 'reject')" class="px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg font-medium hover:bg-rose-600 transition-colors">ปฏิเสธ</button>
        </div>
      </div>
    `).join('') : '<p class="text-sm text-slate-400 text-center py-8">ไม่มีคำขอถอนเงิน</p>';
  } catch (err) { showToast('โหลดไม่สำเร็จ', 'error'); }
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

    await api('/admin/payouts', { method: 'PUT', body: JSON.stringify(body) });
    showToast(`${action === 'approve' ? 'อนุมัติ + แจ้ง Seller แล้ว' : 'ปฏิเสธ + คืนเครดิตแล้ว'}`, 'success');
    loadAdminPayouts();
  } catch (err) { showToast(err.error || 'ดำเนินการไม่สำเร็จ', 'error'); }
}

// =============================================
// Admin — User Detail Modal
// =============================================
async function openUserDetail(userId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'user-detail-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:650px;">
      <div class="modal-header">
        <h2>รายละเอียดสมาชิก</h2>
        <button class="modal-close" onclick="closeModal('user-detail-modal')">&times;</button>
      </div>
      <div id="user-detail-body"><div class="flex justify-center py-8"><div class="spinner"></div></div></div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const { users } = await api(`/admin/users?search=${userId}&limit=50`);
    const u = users.find(x => x.id === userId);

    let txHtml = '<p class="text-sm text-slate-400">ไม่สามารถโหลดประวัติ</p>';
    try {
      const res = await fetch(`${API_BASE}/credits/history?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      const txns = data?.transactions || data?.data?.transactions || [];
      if (Array.isArray(txns) && txns.length > 0) {
        txHtml = `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-slate-200"><th class="text-left py-2 px-2 text-slate-500 text-xs">วันที่</th><th class="text-left py-2 px-2 text-slate-500 text-xs">รายการ</th><th class="text-right py-2 px-2 text-slate-500 text-xs">จำนวน</th><th class="text-right py-2 px-2 text-slate-500 text-xs">คงเหลือ</th></tr></thead><tbody>${txns.slice(0, 20).map(t => `
          <tr class="border-b border-slate-100">
            <td class="py-1.5 px-2 text-xs text-slate-500">${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
            <td class="py-1.5 px-2 text-xs text-slate-700">${escapeHtml(t.description || t.type || '—')}</td>
            <td class="py-1.5 px-2 text-xs text-right font-medium ${parseFloat(t.amount) >= 0 ? 'text-emerald-600' : 'text-rose-500'}">${parseFloat(t.amount) >= 0 ? '+' : ''}฿${parseFloat(t.amount).toFixed(2)}</td>
            <td class="py-1.5 px-2 text-xs text-right text-slate-600">฿${parseFloat(t.balance_after).toFixed(2)}</td>
          </tr>
        `).join('')}</tbody></table></div>`;
      } else {
        txHtml = '<p class="text-sm text-slate-400">ยังไม่มีรายการ</p>';
      }
    } catch {}

    document.getElementById('user-detail-body').innerHTML = u ? `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="p-3 bg-slate-50 rounded-lg"><div class="text-xs text-slate-500">ชื่อ</div><div class="font-semibold text-slate-800">${escapeHtml(u.display_name)}</div></div>
        <div class="p-3 bg-slate-50 rounded-lg"><div class="text-xs text-slate-500">อีเมล</div><div class="text-sm font-medium text-slate-700">${escapeHtml(u.email)}</div></div>
        <div class="p-3 bg-slate-50 rounded-lg"><div class="text-xs text-slate-500">PromptPay</div><div class="font-semibold ${u.promptpay_number ? 'text-indigo-600' : 'text-slate-400'}">${u.promptpay_number ? `${u.promptpay_number}${u.promptpay_name ? ' (' + escapeHtml(u.promptpay_name) + ')' : ''}` : 'ยังไม่ผูก'}</div></div>
        <div class="p-3 bg-slate-50 rounded-lg"><div class="text-xs text-slate-500">เครดิต</div><div class="font-bold text-emerald-600">฿${parseFloat(u.credit_balance).toFixed(2)}</div></div>
        <div class="p-3 bg-slate-50 rounded-lg"><div class="text-xs text-slate-500">สิทธิ์ / สถานะ</div><div class="flex gap-1"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}">${u.role}</span><span class="text-xs font-medium px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">${u.status}</span></div></div>
        <div class="p-3 bg-slate-50 rounded-lg"><div class="text-xs text-slate-500">วันที่สมัคร</div><div class="text-sm">${new Date(u.created_at).toLocaleString('th-TH')}</div></div>
      </div>
      <h3 class="text-sm font-semibold text-slate-700 mb-2">ประวัติ Transaction (ล่าสุด 20)</h3>
      ${txHtml}
    ` : '<p class="text-sm text-slate-400">ไม่พบข้อมูลสมาชิก</p>';
  } catch {
    document.getElementById('user-detail-body').innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>';
  }
}

// =============================================
// =============================================
// Admin Topups (เติมเครดิต)
// =============================================
async function loadAdminTopups() {
  const container = document.getElementById('admin-topups');
  if (!container) return;

  try {
    const { topups } = await api('/admin/topups?status=pending');

    // Update badge
    const badge = document.getElementById('admin-topup-badge');
    if (badge) {
      if (topups.length > 0) {
        badge.textContent = topups.length;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    container.innerHTML = topups.length ? topups.map(t => `
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div class="flex justify-between items-start gap-3 flex-wrap mb-3">
          <div>
            <div class="font-semibold text-slate-800">${escapeHtml(t.user?.display_name || 'Unknown')}</div>
            <div class="text-xs text-slate-500">${escapeHtml(t.user?.email || '')}</div>
          </div>
          <div class="text-right">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
              <i data-lucide="clock" class="w-3 h-3"></i> รอยืนยัน
            </span>
            <div class="text-xs text-slate-400 mt-1">${new Date(t.created_at).toLocaleString('th-TH')}</div>
          </div>
        </div>
        <div class="px-3 py-2 bg-indigo-50 rounded-lg text-sm mb-3">
          <strong>ยอดที่ขอเติม:</strong> ฿${t.requested_amount || '?'}
          ${t.unique_amount ? ` <span class="text-slate-500">(ยอดโอน ฿${parseFloat(t.unique_amount).toFixed(2)})</span>` : ''}
          ${t.slip_image_url ? `<br><a href="${escapeHtml(t.slip_image_url)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 mt-1 text-indigo-600 hover:underline"><i data-lucide="image" class="w-3.5 h-3.5"></i> ดูสลิป</a>` : '<br><span class="text-slate-400">ไม่มีรูปสลิป</span>'}
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">จำนวนเงิน (บาท) *</label>
            <input type="number" id="topup-amount-${t.id}" min="1" step="1" placeholder="เช่น 50" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">หมายเหตุ</label>
            <input type="text" id="topup-note-${t.id}" placeholder="หมายเหตุ (ถ้ามี)" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="processTopup('${t.id}', 'approve')" class="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg font-medium hover:bg-emerald-600 transition-colors">ยืนยัน + เติมเครดิต</button>
          <button onclick="processTopup('${t.id}', 'reject')" class="px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg font-medium hover:bg-rose-600 transition-colors">ปฏิเสธ</button>
        </div>
      </div>
    `).join('') : '<p class="text-sm text-slate-400 text-center py-8">ไม่มีคำขอเติมเครดิต</p>';

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) { showToast('โหลดรายการเติมเครดิตไม่สำเร็จ', 'error'); }
}

async function processTopup(topupId, action) {
  const amountInput = document.getElementById(`topup-amount-${topupId}`);
  const noteInput = document.getElementById(`topup-note-${topupId}`);

  const amount = amountInput ? parseFloat(amountInput.value) : 0;
  const admin_note = noteInput ? noteInput.value : '';

  if (action === 'approve') {
    if (!amount || amount <= 0) {
      showToast('กรุณาระบุจำนวนเงิน', 'error');
      amountInput?.focus();
      return;
    }
    const okCredit = await kpConfirm(`ยืนยันเติมเครดิต ฿${amount} ให้สมาชิก?`, { icon: 'coin', confirmText: 'เติมเลย' });
    if (!okCredit) return;
  } else {
    const okRejectCredit = await kpConfirm('ยืนยันปฏิเสธคำขอเติมเครดิต?', { icon: 'x-circle', type: 'danger', confirmText: 'ปฏิเสธ' });
    if (!okRejectCredit) return;
  }

  try {
    await api('/admin/topups', {
      method: 'PUT',
      body: JSON.stringify({ topup_id: topupId, action, amount, admin_note })
    });
    showToast(action === 'approve' ? 'เติมเครดิตสำเร็จ!' : 'ปฏิเสธแล้ว', 'success');
    loadAdminTopups();
  } catch (err) { showToast(err.error || 'ดำเนินการไม่สำเร็จ', 'error'); }
}

// =============================================
// Pre-fill Dashboard Create Form from Saved Prompt
// =============================================
async function prefillFromSavedPrompt() {
  const savedId = localStorage.getItem('kp_sell_prompt_id');
  if (!savedId) return;
  localStorage.removeItem('kp_sell_prompt_id');

  try {
    const { saved_prompts } = await api('/saved-prompts');
    const sp = saved_prompts.find(x => x.id === savedId);
    if (!sp) return;

    // Switch to create tab
    setTimeout(() => {
      const createTab = document.querySelector('.dash-tab[data-tab="tab-create"]');
      if (createTab) createTab.click();

      // Pre-fill form fields
      const titleInput = document.querySelector('#tab-create input[name="title"]');
      const descInput = document.querySelector('#tab-create textarea[name="description"]');
      const techInput = document.querySelector('#tab-create input[name="tech_stack"]');

      if (titleInput) titleInput.value = sp.title || '';
      if (descInput) descInput.value = sp.project_name ? `Prompt สำหรับ ${sp.project_name}` : '';
      if (techInput && sp.tech_stack?.length) techInput.value = sp.tech_stack.join(', ');

      showToast('กรุณาอัปโหลดไฟล์ Prompt (.md) และกรอกรายละเอียดเพิ่มเติม', 'info');
    }, 300);
  } catch {}
}
