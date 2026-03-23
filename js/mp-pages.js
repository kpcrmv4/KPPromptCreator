// =============================================
// KP Prompt Creator — Pages (Marketplace, Detail, Topup, Orders, Account)
// =============================================

// =============================================
// Marketplace — Browse Prompts
// =============================================
async function loadSellerHeader(sellerId) {
  const header = document.getElementById('seller-header');
  if (!header) return;
  try {
    const { prompts } = await api(`/prompts?seller_id=${sellerId}&limit=1`);
    const seller = prompts[0]?.seller;
    if (seller) {
      header.classList.remove('hidden');
      header.innerHTML = `
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <div class="text-left">
            <h2 class="text-xl font-bold text-white">${escapeHtml(seller.display_name)}</h2>
            <p class="text-indigo-200 text-sm">ร้านค้าของ ${escapeHtml(seller.display_name)}</p>
          </div>
        </div>
      `;
    }
  } catch {}
}

async function loadPrompts(params = {}) {
  const container = document.getElementById('prompts-grid');
  if (!container) return;

  // Check seller filter from URL
  const sellerId = new URLSearchParams(window.location.search).get('seller');
  if (sellerId) params.seller_id = sellerId;

  container.innerHTML = '<div class="col-span-full flex flex-col items-center py-20 gap-3 text-slate-400"><div class="spinner"></div><p class="text-sm">กำลังโหลด...</p></div>';

  try {
    const query = new URLSearchParams(params).toString();
    const { prompts, total } = await api(`/prompts?${query}`);

    if (prompts.length === 0) {
      container.innerHTML = `<div class="col-span-full flex flex-col items-center py-20 gap-3 text-slate-400">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        <p>ยังไม่มี Prompt ในหมวดนี้</p>
      </div>`;
      return;
    }

    container.innerHTML = prompts.map(p => `
      <a href="/prompt-detail.html?id=${p.id}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300">
        ${p.preview_image_url
          ? `<div class="aspect-video overflow-hidden bg-slate-100"><img src="${escapeHtml(p.preview_image_url)}" alt="${escapeHtml(p.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"></div>`
          : `<div class="aspect-video bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center"><svg class="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>`
        }
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">${escapeHtml(p.category)}</span>
            <span class="text-lg font-bold text-indigo-600">฿${parseFloat(p.price).toFixed(0)}</span>
          </div>
          <h3 class="font-semibold text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">${escapeHtml(p.title)}</h3>
          <p class="text-sm text-slate-500 line-clamp-2 mb-3">${escapeHtml(p.preview_text || p.description).substring(0, 120)}</p>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              ${escapeHtml(p.seller?.display_name || '')}
            </span>
            <span class="flex items-center gap-2">
              <span class="flex items-center gap-0.5"><svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> ${p.avg_rating || '—'}</span>
              <span>${p.purchase_count || 0} ขาย</span>
            </span>
          </div>
        </div>
      </a>
    `).join('');

    renderPagination(total, params.page || 1, params.limit || 20);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">โหลดข้อมูลไม่สำเร็จ</div>';
  }
}

function renderPagination(total, currentPage, limit) {
  const container = document.getElementById('pagination');
  if (!container) return;
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === Number(currentPage) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}" onclick="changePage(${i})">${i}</button>`;
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
  if (!id) { container.innerHTML = '<p class="text-center text-slate-400 py-20">ไม่พบ Prompt</p>'; return; }

  container.innerHTML = '<div class="flex justify-center py-20"><div class="spinner"></div></div>';

  try {
    const { prompt, purchased } = await api(`/prompts/${id}`);

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
          <div>
            <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">${escapeHtml(prompt.category)}</span>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">${escapeHtml(prompt.title)}</h1>
            <div class="flex items-center gap-4 mt-3 text-sm text-slate-500">
              <span class="flex items-center gap-1.5">
                <div class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center"><svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
                <a href="/marketplace.html?seller=${prompt.seller?.id}" class="hover:text-indigo-600 transition-colors">${escapeHtml(prompt.seller?.display_name || '')}</a>
              </span>
              <span class="flex items-center gap-1"><svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> ${prompt.avg_rating || '—'}</span>
              <span>${prompt.purchase_count || 0} ขาย</span>
              <span>${prompt.view_count || 0} เข้าชม</span>
            </div>
          </div>

          ${prompt.images?.length ? `
            <div class="flex gap-3 overflow-x-auto pb-2">
              ${prompt.images.map(img => `<img src="${escapeHtml(img.image_url)}" alt="Preview" class="h-48 rounded-xl object-cover border border-slate-200 hover:scale-[1.02] transition-transform cursor-pointer flex-shrink-0">`).join('')}
            </div>
          ` : ''}

          <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-slate-800">รายละเอียด</h2>
            <div class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">${escapeHtml(prompt.description)}</div>

            ${prompt.tech_stack?.length ? `
              <div>
                <h3 class="text-sm font-semibold text-slate-700 mb-2">Tech Stack</h3>
                <div class="flex flex-wrap gap-1.5">${prompt.tech_stack.map(t => `<span class="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">${escapeHtml(t)}</span>`).join('')}</div>
              </div>
            ` : ''}

            ${prompt.tags?.length ? `
              <div>
                <h3 class="text-sm font-semibold text-slate-700 mb-2">Tags</h3>
                <div class="flex flex-wrap gap-1.5">${prompt.tags.map(t => `<span class="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">${escapeHtml(t)}</span>`).join('')}</div>
              </div>
            ` : ''}

            ${prompt.demo_url ? `
              <div>
                <h3 class="text-sm font-semibold text-slate-700 mb-2">Demo</h3>
                <a href="${escapeHtml(prompt.demo_url)}" target="_blank" class="text-indigo-600 hover:underline text-sm">${escapeHtml(prompt.demo_url)}</a>
              </div>
            ` : ''}
          </div>

          <!-- Reviews -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">รีวิว (${prompt.reviews?.length || 0})</h2>
            ${prompt.reviews?.length ? prompt.reviews.map(r => `
              <div class="py-3 border-b border-slate-100 last:border-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm text-slate-700">${escapeHtml(r.buyer?.display_name || 'ผู้ใช้')}</span>
                  <span class="text-amber-400 text-sm">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                </div>
                ${r.comment ? `<p class="text-sm text-slate-500">${escapeHtml(r.comment)}</p>` : ''}
                <small class="text-xs text-slate-400">${new Date(r.created_at).toLocaleDateString('th-TH')}</small>
              </div>
            `).join('') : '<p class="text-sm text-slate-400">ยังไม่มีรีวิว</p>'}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-20 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div class="text-3xl font-bold text-indigo-600">฿${parseFloat(prompt.price).toFixed(0)}</div>
            ${purchased
              ? `<button onclick="downloadPrompt('${prompt.id}')" class="w-full py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  ดาวน์โหลด Prompt
                </button>
                <div class="text-center"><span class="inline-flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ซื้อแล้ว</span></div>`
              : `<button onclick="purchasePrompt('${prompt.id}')" class="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"></path></svg>
                  ซื้อ Prompt
                </button>`
            }
            <div class="text-xs text-slate-400 text-center">ซื้อแล้วดาวน์โหลดได้ตลอด</div>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<p class="text-center text-slate-400 py-20">โหลดข้อมูลไม่สำเร็จ</p>';
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
    loadPromptDetail();
  } catch (err) {
    if (err.need_topup) {
      showToast(`${err.error} — เติมเงินก่อน`, 'error');
      if (confirm('ต้องการไปเติมเงินหรือไม่?')) window.location.href = '/topup.html';
    } else {
      showToast(err.error || 'ซื้อไม่สำเร็จ', 'error');
    }
  }
}

async function downloadPrompt(promptId) {
  try {
    const data = await api(`/prompts/download?prompt_id=${promptId}`);
    if (data.download_url) {
      const a = document.createElement('a');
      a.href = data.download_url;
      a.download = `${data.title}.md`;
      a.target = '_blank';
      a.click();
    } else {
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
    if (!transactions || transactions.length === 0) {
      container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">ยังไม่มีประวัติ</p>';
      return;
    }
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-slate-200">
            <th class="text-left py-3 px-3 text-slate-500 font-medium">วันที่</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">รายการ</th>
            <th class="text-right py-3 px-3 text-slate-500 font-medium">จำนวน</th>
            <th class="text-right py-3 px-3 text-slate-500 font-medium">คงเหลือ</th>
          </tr></thead>
          <tbody>${transactions.map(t => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="py-2.5 px-3 text-slate-500">${new Date(t.created_at).toLocaleDateString('th-TH')}</td>
              <td class="py-2.5 px-3 text-slate-700">${escapeHtml(t.description || t.type)}</td>
              <td class="py-2.5 px-3 text-right font-medium ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}">${t.amount >= 0 ? '+' : ''}฿${parseFloat(t.amount).toFixed(2)}</td>
              <td class="py-2.5 px-3 text-right text-slate-600">฿${parseFloat(t.balance_after).toFixed(2)}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    `;
  } catch { container.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">โหลดไม่สำเร็จ</p>'; }
}

// =============================================
// Orders
// =============================================
async function loadOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  try {
    const { orders } = await api('/orders');
    if (!orders || orders.length === 0) {
      container.innerHTML = `<div class="text-center py-16 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        <p class="mb-4">ยังไม่มีคำสั่งซื้อ</p>
        <a href="/marketplace.html" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">เลือกซื้อ Prompt</a>
      </div>`;
      return;
    }
    container.innerHTML = orders.map(o => {
      const review = Array.isArray(o.review) ? o.review[0] : o.review;
      return `
      <div class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-800 truncate">${escapeHtml(o.prompt?.title || 'Prompt')}</h3>
            <p class="text-xs text-slate-400 mt-0.5">${new Date(o.created_at).toLocaleDateString('th-TH')} &bull; ฿${parseFloat(o.amount).toFixed(0)}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button onclick="downloadPrompt('${o.prompt?.id}')" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3"></path></svg> ดาวน์โหลด
            </button>
            <a href="/prompt-detail.html?id=${o.prompt?.id}" class="px-2 py-1.5 border border-slate-200 text-slate-500 text-xs rounded-lg hover:bg-slate-50 transition-colors">ดู</a>
            ${review
              ? `<span class="text-xs text-amber-500 font-medium">${'★'.repeat(review.rating)} รีวิวแล้ว</span>`
              : `<button onclick="openReviewModal('${o.id}', '${o.prompt?.id}', '${escapeHtml(o.prompt?.title || '')}')" class="px-3 py-1.5 border border-indigo-200 text-indigo-600 text-xs rounded-lg hover:bg-indigo-50 transition-colors">รีวิว</button>`
            }
          </div>
        </div>
        ${review?.comment ? `<div class="mt-2 pt-2 border-t border-slate-100 text-sm text-slate-500"><span class="text-amber-400">${'★'.repeat(review.rating)}</span> ${escapeHtml(review.comment)}</div>` : ''}
      </div>`;
    }).join('');
  } catch {
    container.innerHTML = '<p class="text-center text-slate-400 py-8">โหลดไม่สำเร็จ</p>';
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
        <h2>รีวิว "${escapeHtml(promptTitle)}"</h2>
        <button class="modal-close" onclick="closeModal('review-modal')">&times;</button>
      </div>
      <form onsubmit="handleCreateReview(event, '${orderId}', '${promptId}')">
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-2">คะแนน</label>
          <div class="star-rating" id="star-rating">
            ${[1,2,3,4,5].map(n => `<button type="button" class="star-btn text-2xl" onclick="setRating(${n})">☆</button>`).join('')}
          </div>
          <input type="hidden" name="rating" id="review-rating" required value="">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">ความคิดเห็น (ไม่บังคับ)</label>
          <textarea name="comment" rows="3" placeholder="แชร์ประสบการณ์..." class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"></textarea>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">ส่งรีวิว</button>
          <button type="button" class="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors" onclick="closeModal('review-modal')">ยกเลิก</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

function setRating(n) {
  document.getElementById('review-rating').value = n;
  const stars = document.querySelectorAll('#star-rating .star-btn');
  stars.forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
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
      body: JSON.stringify({ order_id: orderId, prompt_id: promptId, rating, comment: form.comment.value || '' })
    });
    showToast('ส่งรีวิวสำเร็จ!', 'success');
    closeModal('review-modal');
    loadOrders();
  } catch (err) {
    showToast(err.error || 'ส่งรีวิวไม่สำเร็จ', 'error');
  } finally { btn.disabled = false; }
}

// =============================================
// Account
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
          <label class="block text-sm font-medium text-slate-700 mb-1">เบอร์ TrueMoney Wallet</label>
          <input type="tel" name="truemoney_phone" value="${escapeHtml(u.truemoney_phone || '')}" placeholder="09xxxxxxxx" pattern="0[0-9]{8,9}" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">สิทธิ์</label>
            <input type="text" value="${u.role}" disabled class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เครดิต</label>
            <input type="text" value="฿${parseFloat(u.credit_balance).toFixed(2)}" disabled class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-emerald-600 font-semibold">
          </div>
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
        display_name: form.display_name.value,
        truemoney_phone: form.truemoney_phone?.value || ''
      })
    });
    currentUser.display_name = user.display_name;
    currentUser.truemoney_phone = user.truemoney_phone;
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
