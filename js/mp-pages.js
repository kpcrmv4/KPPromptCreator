// =============================================
// KP Prompt Creator — Account pages (saved-prompts library + collections + profile)
// =============================================

// =============================================
// Account — Profile
// =============================================
async function loadAccountForm() {
  const container = document.getElementById('account-form');
  if (!container || !currentUser) return;

  try {
    const resp = await api('/auth/me');
    const u = resp.user || currentUser;
    container.innerHTML = `
      <form onsubmit="handleUpdateProfile(event)" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
          <input type="email" value="${escapeHtml(u.email)}" disabled class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อที่แสดง</label>
          <input type="text" name="display_name" value="${escapeHtml(u.display_name)}" required class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">สิทธิ์</label>
          <input type="text" value="${u.role}" disabled class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-500">
        </div>
        <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">บันทึก</button>
      </form>
    `;
  } catch { container.innerHTML = '<p class="text-slate-400 text-sm">โหลดไม่สำเร็จ</p>'; }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const form = e.target;
  try {
    const { user } = await api('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({
        display_name: form.display_name.value
      })
    });
    currentUser.display_name = user.display_name;
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
// Account — My Prompts (saved from Creator)
// =============================================
async function loadMyPrompts() {
  const container = document.getElementById('my-prompts-list');
  if (!container) return;

  try {
    const { saved_prompts } = await api('/saved-prompts?source=creator');

    if (!saved_prompts || saved_prompts.length === 0) {
      container.innerHTML = `<div class="text-center py-16">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <p class="text-slate-400 mb-4">ยังไม่มี Prompt ที่บันทึก</p>
        <a href="/" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">สร้าง Prompt แรก</a>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${saved_prompts.map(p => `
      <div class="prompt-card bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow relative group">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-800 text-sm truncate">${escapeHtml(p.title)}</h3>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              ${p.target_ai ? `<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">${escapeHtml(p.target_ai)}</span>` : ''}
              ${p.collection ? `<span class="collection-chip" style="background:${p.collection.color}20;color:${p.collection.color}">${escapeHtml(p.collection.name)}</span>` : ''}
              ${p.kp_signature ? '<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">KP Verified</span>' : ''}
            </div>
          </div>
          <div class="prompt-card-actions flex items-center gap-1 ml-2">
            <button onclick="downloadSavedPrompt('${p.id}')" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="ดาวน์โหลด">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </button>
            <button onclick="deleteSavedPrompt('${p.id}')" class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="ลบ">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-400 mb-3">${p.project_name ? escapeHtml(p.project_name) + ' — ' : ''}${new Date(p.created_at).toLocaleDateString('th-TH')}</p>
        ${p.tech_stack?.length ? `<div class="flex flex-wrap gap-1 mb-1">${p.tech_stack.slice(0, 4).map(t => `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">${escapeHtml(t)}</span>`).join('')}${p.tech_stack.length > 4 ? `<span class="text-xs text-slate-400">+${p.tech_stack.length - 4}</span>` : ''}</div>` : ''}
      </div>
    `).join('')}</div>`;
  } catch {
    container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">โหลดไม่สำเร็จ</p>';
  }
}

// =============================================
// Account — Collections
// =============================================
async function loadCollections() {
  const container = document.getElementById('collections-list');
  if (!container) return;

  try {
    const { collections } = await api('/collections');

    if (!collections || collections.length === 0) {
      container.innerHTML = `<div class="text-center py-16">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        <p class="text-slate-400 mb-4">ยังไม่มีคอลเล็คชั่น</p>
        <button onclick="openCreateCollectionModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">สร้างคอลเล็คชั่นแรก</button>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${collections.map(c => `
      <div class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer group" onclick="viewCollection('${c.id}', '${escapeHtml(c.name)}')">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background:${c.color}20">
            <svg class="w-5 h-5" style="color:${c.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-800 text-sm truncate">${escapeHtml(c.name)}</h3>
            <p class="text-xs text-slate-400">${c.prompt_count} Prompt${c.description ? ' — ' + escapeHtml(c.description).substring(0, 50) : ''}</p>
          </div>
          <button onclick="event.stopPropagation();deleteCollection('${c.id}')" class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all" title="ลบ">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `).join('')}</div>`;
  } catch {
    container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">โหลดไม่สำเร็จ</p>';
  }
}

// View collection: filter saved prompts by collection
async function viewCollection(collectionId, collectionName) {
  // Switch to My Prompts tab and filter by collection
  const tab = document.querySelector('.acc-tab[data-tab="tab-my-prompts"]');
  if (tab) switchAccountTab('tab-my-prompts', tab);

  const container = document.getElementById('my-prompts-list');
  if (!container) return;
  container.innerHTML = '<div class="flex flex-col items-center py-12 gap-3 text-slate-400"><div class="spinner"></div><p class="text-sm">กำลังโหลด...</p></div>';

  try {
    const { saved_prompts } = await api(`/saved-prompts?collection_id=${collectionId}`);
    const backBtn = `<button onclick="loadMyPrompts()" class="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg> กลับดูทั้งหมด</button>`;
    const heading = `<h3 class="font-semibold text-slate-700 mb-4">${escapeHtml(collectionName)} (${saved_prompts.length})</h3>`;

    if (!saved_prompts.length) {
      container.innerHTML = backBtn + heading + '<p class="text-sm text-slate-400 text-center py-8">ไม่มี Prompt ในคอลเล็คชั่นนี้</p>';
      return;
    }

    // Re-use the same card rendering from loadMyPrompts
    container.innerHTML = backBtn + heading + `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${saved_prompts.map(p => `
      <div class="prompt-card bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow relative group">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-slate-800 text-sm truncate flex-1">${escapeHtml(p.title)}</h3>
          <div class="prompt-card-actions flex items-center gap-1 ml-2">
            <button onclick="downloadSavedPrompt('${p.id}')" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="ดาวน์โหลด"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></button>
          </div>
        </div>
        <p class="text-xs text-slate-400 mb-2">${p.target_ai ? escapeHtml(p.target_ai) + ' — ' : ''}${new Date(p.created_at).toLocaleDateString('th-TH')}</p>
      </div>
    `).join('')}</div>`;
  } catch {
    container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">โหลดไม่สำเร็จ</p>';
  }
}

function switchAccountTab(tabId, btn) {
  document.querySelectorAll('.acc-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.acc-tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

// =============================================
// Saved Prompt Actions
// =============================================
async function downloadSavedPrompt(savedPromptId) {
  try {
    const { saved_prompts } = await api(`/saved-prompts`);
    const p = saved_prompts.find(x => x.id === savedPromptId);
    if (!p) { showToast('ไม่พบ Prompt', 'error'); return; }

    const blob = new Blob([p.content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = p.file_name || 'CLAUDE.md';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('ดาวน์โหลดสำเร็จ', 'success');
  } catch (err) { showToast(err.error || 'ดาวน์โหลดไม่สำเร็จ', 'error'); }
}

async function deleteSavedPrompt(savedPromptId) {
  const ok = await kpConfirm('ลบ Prompt นี้?', { icon: 'trash', type: 'danger', confirmText: 'ลบ' });
  if (!ok) return;
  try {
    await api(`/saved-prompts?saved_prompt_id=${savedPromptId}`, { method: 'DELETE' });
    showToast('ลบสำเร็จ', 'success');
    loadMyPrompts();
  } catch (err) { showToast(err.error || 'ลบไม่สำเร็จ', 'error'); }
}

async function deleteCollection(collectionId) {
  const ok2 = await kpConfirm('ลบคอลเล็คชั่นนี้?<br><small style="color:var(--text-muted)">(Prompt ภายในจะไม่ถูกลบ)</small>', { icon: 'trash', type: 'danger', confirmText: 'ลบ' });
  if (!ok2) return;
  try {
    await api(`/collections?collection_id=${collectionId}`, { method: 'DELETE' });
    showToast('ลบคอลเล็คชั่นสำเร็จ', 'success');
    loadCollections();
  } catch (err) { showToast(err.error || 'ลบไม่สำเร็จ', 'error'); }
}

function openCreateCollectionModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'create-collection-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px;">
      <div class="modal-header">
        <h2>สร้างคอลเล็คชั่นใหม่</h2>
        <button class="modal-close" onclick="closeModal('create-collection-modal')">&times;</button>
      </div>
      <form onsubmit="handleCreateCollection(event)" class="p-4 space-y-3">
        <div><label class="block text-sm font-medium text-slate-700 mb-1">ชื่อคอลเล็คชั่น</label><input type="text" name="name" required placeholder="เช่น E-commerce, Portfolio" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
        <div><label class="block text-sm font-medium text-slate-700 mb-1">คำอธิบาย (ไม่บังคับ)</label><input type="text" name="description" placeholder="รายละเอียดสั้นๆ" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></div>
        <div><label class="block text-sm font-medium text-slate-700 mb-1">สี</label>
          <div class="flex gap-2">${['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4'].map(c => `<button type="button" onclick="this.closest('form').querySelector('[name=color]').value='${c}';this.closest('.flex').querySelectorAll('button').forEach(b=>b.style.outline='');this.style.outline='2px solid ${c}'" class="w-7 h-7 rounded-full border-2 border-white shadow-sm" style="background:${c}"></button>`).join('')}
            <input type="hidden" name="color" value="#6366f1">
          </div>
        </div>
        <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">สร้างคอลเล็คชั่น</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

async function handleCreateCollection(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/collections', {
      method: 'POST',
      body: JSON.stringify({ name: form.name.value, description: form.description.value, color: form.color.value })
    });
    showToast('สร้างคอลเล็คชั่นสำเร็จ!', 'success');
    closeModal('create-collection-modal');
    loadCollections();
  } catch (err) { showToast(err.error || 'สร้างไม่สำเร็จ', 'error'); }
}
