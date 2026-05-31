// =============================================
// KP Prompt Creator — Admin Panel
// (depends on api / showToast / kpConfirm / escapeHtml from mp-core.js)
// =============================================

// =============================================
// Admin Tabs
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

// =============================================
// Admin Overview (member count only)
// =============================================
async function loadAdminOverview() {
  const container = document.getElementById('admin-overview');
  if (!container) return;
  try {
    const usersData = await api('/admin/users?limit=1');
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
          <div><div class="text-2xl font-bold text-slate-800">${usersData.total || 0}</div><div class="text-xs text-slate-500">สมาชิก</div></div>
        </div>
      </div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400">โหลดไม่สำเร็จ</p>'; }
}

// =============================================
// Admin Notifications
// =============================================
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

// =============================================
// Admin Users
// =============================================
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
            <th class="text-left py-3 px-3 text-slate-500 font-medium">สถานะ</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">จัดการ</th>
          </tr></thead>
          <tbody>${users.map(u => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="py-2.5 px-3 font-medium text-slate-800">${escapeHtml(u.display_name)}</td>
              <td class="py-2.5 px-3 text-slate-500">${escapeHtml(u.email)}</td>
              <td class="py-2.5 px-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}">${u.role}</span></td>
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

// =============================================
// Admin Settings
// =============================================
async function loadAdminSettings() {
  const container = document.getElementById('admin-settings');
  if (!container) return;
  try {
    const { settings } = await api('/admin/settings');
    container.innerHTML = `
      <form onsubmit="handleSaveSettings(event)" class="space-y-4 max-w-md">
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
      body: JSON.stringify({ settings: { site_name: form.site_name.value } })
    });
    showToast('บันทึกสำเร็จ', 'success');
  } catch (err) { showToast(err.error || 'บันทึกไม่สำเร็จ', 'error'); }
}
