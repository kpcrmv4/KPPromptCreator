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
            <div class="flex flex-wrap gap-1.5">${renderPromptCategoryBadges(p.category, p.price)}</div>
            <span class="text-lg font-bold ${isFreePrompt(p.price) ? 'text-emerald-600' : 'text-indigo-600'}">${formatPromptPrice(p.price)}</span>
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
            <div class="flex flex-wrap gap-1.5">${renderPromptCategoryBadges(prompt.category, prompt.price, { baseClass: 'text-xs font-medium px-2.5 py-1 rounded-full' })}</div>
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
            <div class="text-3xl font-bold ${isFreePrompt(prompt.price) ? 'text-emerald-600' : 'text-indigo-600'}">${formatPromptPrice(prompt.price)}</div>
            ${purchased
              ? `<button onclick="downloadPrompt('${prompt.id}')" class="w-full py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  ดาวน์โหลด Prompt
                </button>
                <div class="text-center"><span class="inline-flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ${isFreePrompt(prompt.price) ? 'รับแล้ว' : 'ซื้อแล้ว'}</span></div>`
              : `<button onclick="purchasePrompt('${prompt.id}', ${normalizePromptPrice(prompt.price)})" class="w-full py-3 rounded-xl font-semibold text-white ${isFreePrompt(prompt.price) ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200'} transition-all flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"></path></svg>
                  ${isFreePrompt(prompt.price) ? 'รับ Prompt ฟรี' : 'ซื้อ Prompt'}
                </button>`
            }
            <div class="text-xs text-slate-400 text-center">${isFreePrompt(prompt.price) ? 'กดรับฟรีแล้วดาวน์โหลดได้ตลอด' : 'ซื้อแล้วดาวน์โหลดได้ตลอด'}</div>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<p class="text-center text-slate-400 py-20">โหลดข้อมูลไม่สำเร็จ</p>';
  }
}

async function purchasePrompt(promptId, price = null) {
  if (!currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อนซื้อ', 'error');
    window.location.href = '/auth.html';
    return;
  }
  const freePrompt = isFreePrompt(price);
  const ok = await kpConfirm(freePrompt ? 'ยืนยันการรับ Prompt ฟรีนี้?' : 'ยืนยันการซื้อ Prompt นี้?', { icon: 'cart-check', confirmText: freePrompt ? 'รับเลย' : 'ซื้อเลย' });
  if (!ok) return;

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
      const goTopup = await kpConfirm('ต้องการไปเติมเงินหรือไม่?', { icon: 'wallet2', confirmText: 'ไปเติมเงิน' });
      if (goTopup) window.location.href = '/topup.html';
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
// Current topup session data
let currentTopupSession = null;

function selectAmount(amount) {
  document.getElementById('topup-amount').value = amount;
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'text-indigo-700');
    btn.classList.add('border-slate-200', 'text-slate-600');
  });
  event.target.classList.add('border-indigo-500', 'bg-indigo-50', 'text-indigo-700');
  event.target.classList.remove('border-slate-200', 'text-slate-600');
}

// Step 1: Generate QR Code
async function handleGenerateQR(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('btn-generate-qr');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:1rem;height:1rem;border-width:2px;"></div> กำลังสร้าง QR...';

  try {
    const amount = parseInt(form.amount.value);
    if (!amount || amount < 1) {
      showToast('กรุณาระบุจำนวนเงิน', 'error');
      return;
    }

    const data = await api('/topup/redeem', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });

    // Save session data
    currentTopupSession = {
      topup_id: data.topup_id,
      requested_amount: data.requested_amount,
      unique_amount: data.unique_amount,
      promptpay_number: data.promptpay_number,
      promptpay_name: data.promptpay_name
    };

    // Show Step 2 with QR
    showQRStep(data);
  } catch (err) {
    showToast(err.error || 'สร้าง QR ไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function showQRStep(data) {
  // Hide step 1, show step 2
  document.getElementById('topup-step1').style.display = 'none';
  document.getElementById('topup-step2').style.display = 'block';

  // Set QR image from promptpay.io
  const qrImg = document.getElementById('qr-code-img');
  const ppNumber = data.promptpay_number || '';
  const uniqueAmount = parseFloat(data.unique_amount).toFixed(2);
  qrImg.src = `https://promptpay.io/${ppNumber}/${uniqueAmount}`;
  qrImg.alt = `PromptPay QR ฿${uniqueAmount}`;

  // Set amount display
  document.getElementById('qr-unique-amount').textContent = `฿${uniqueAmount}`;
  document.getElementById('qr-promptpay-number').textContent = ppNumber;
  document.getElementById('qr-requested-amount').textContent = `฿${data.requested_amount}`;

  // Show name if available
  const nameRow = document.getElementById('qr-promptpay-name-row');
  if (data.promptpay_name) {
    nameRow.style.display = 'flex';
    document.getElementById('qr-promptpay-name').textContent = data.promptpay_name;
  } else {
    nameRow.style.display = 'none';
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Step 2: Upload slip
async function handleUploadSlip(e) {
  e.preventDefault();
  if (!currentTopupSession) {
    showToast('ไม่พบรายการเติมเงิน กรุณาสร้าง QR ใหม่', 'error');
    resetTopupFlow();
    return;
  }

  const btn = document.getElementById('btn-upload-slip');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:1rem;height:1rem;border-width:2px;"></div> กำลังอัปโหลด...';

  try {
    const fileInput = document.getElementById('slip-image-input');
    const file = fileInput?.files[0];
    if (!file) {
      showToast('กรุณาเลือกรูปสลิปการโอนเงิน', 'error');
      return;
    }

    const slip_image_base64 = await readFileAsBase64(file);

    await api('/topup/upload-slip', {
      method: 'POST',
      body: JSON.stringify({
        topup_id: currentTopupSession.topup_id,
        slip_image_base64
      })
    });

    showToast('อัปโหลดสลิปสำเร็จ รอ Admin ตรวจสอบ', 'success');
    resetTopupFlow();
    loadPendingTopups();
  } catch (err) {
    showToast(err.error || 'อัปโหลดสลิปไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function resetTopupFlow() {
  currentTopupSession = null;
  document.getElementById('topup-step1').style.display = 'block';
  document.getElementById('topup-step2').style.display = 'none';

  // Reset form
  const amountInput = document.getElementById('topup-amount');
  if (amountInput) amountInput.value = '';
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'text-indigo-700');
    btn.classList.add('border-slate-200', 'text-slate-600');
  });

  // Reset slip
  const slipInput = document.getElementById('slip-image-input');
  if (slipInput) slipInput.value = '';
  const slipPreview = document.getElementById('slip-preview');
  if (slipPreview) { slipPreview.style.display = 'none'; slipPreview.innerHTML = ''; }
}

async function loadPendingTopups() {
  const container = document.getElementById('pending-topups');
  if (!container) return;

  try {
    const { topups } = await api('/credits/pending');
    if (!topups || topups.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    container.innerHTML = `
      <h3 style="font-size:0.9rem; font-weight:600; color:#f59e0b; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
        <i data-lucide="clock" style="width:1rem; height:1rem;"></i> รอยืนยัน (${topups.length})
      </h3>
      ${topups.map(t => `
        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:0.75rem; padding:0.75rem 1rem; margin-bottom:0.5rem; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="color:#92400e; font-weight:500;">เติมเครดิต ฿${t.requested_amount || t.amount || '?'}</span>
            <span style="color:#a16207; font-size:0.75rem; margin-left:0.5rem;">${new Date(t.created_at).toLocaleString('th-TH')}</span>
          </div>
          <span style="background:#fef3c7; color:#92400e; padding:0.25rem 0.75rem; border-radius:9999px; font-size:0.7rem; font-weight:600;">รอยืนยัน</span>
        </div>
      `).join('')}
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch {
    // silently fail
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
            <p class="text-xs text-slate-400 mt-0.5">${new Date(o.created_at).toLocaleDateString('th-TH')} &bull; ${formatPromptPrice(o.amount)}</p>
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
// Codegen Orders (AI Code Generation)
// =============================================
async function loadCodegenOrders() {
  const container = document.getElementById('codegen-orders-list');
  if (!container) return;

  try {
    const res = await api('/codegen-orders');
    const orders = res.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">ยังไม่มีคำสั่งซื้อ Code Generation</div>`;
      return;
    }

    const statusConfig = {
      pending_payment: { label: 'รอตรวจสอบยอดเงิน', color: 'amber', icon: '🟡', desc: 'กำลังตรวจสอบการชำระเงินของคุณ' },
      generating: { label: 'กำลังสร้างโค้ด...', color: 'blue', icon: '🔵', desc: 'AI กำลังสร้างโค้ดให้คุณ' },
      review: { label: 'กำลังทดสอบคุณภาพ', color: 'indigo', icon: '🔍', desc: 'ทีมงานกำลังทดสอบและตรวจสอบคุณภาพโค้ด' },
      completed: { label: 'พร้อมดาวน์โหลด!', color: 'emerald', icon: '✅', desc: 'โค้ดของคุณพร้อมใช้งานแล้ว' },
      rejected: { label: 'ไม่สำเร็จ', color: 'red', icon: '🔴', desc: '' }
    };

    container.innerHTML = orders.map(o => {
      const st = statusConfig[o.status] || statusConfig.pending_payment;
      const tierLabel = { simple: 'ง่าย', moderate: 'ปานกลาง', complex: 'ซับซ้อน' };
      const uiStyleLabel = { 
        'modern-clean': 'Modern & Clean', 
        'corporate-formal': 'Corporate & Formal', 
        'vibrant-playful': 'Vibrant & Playful', 
        'minimalist': 'Minimalist' 
      };
      const isProcessing = ['pending_payment', 'generating', 'review'].includes(o.status);

      return `<div class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-800 truncate">${escapeHtml(o.project_name)}</h3>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <p class="text-xs text-slate-400">${new Date(o.created_at).toLocaleDateString('th-TH')} &bull; ฿${(o.price || 0).toLocaleString()} &bull; ${tierLabel[o.tier] || o.tier}</p>
              ${o.ui_style ? `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium uppercase tracking-wider">${uiStyleLabel[o.ui_style] || o.ui_style}</span>` : ''}
            </div>
          </div>
          <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-${st.color}-50 text-${st.color}-600 flex-shrink-0">${st.icon} ${st.label}</span>
        </div>
        ${st.desc ? `<p class="mt-2 text-xs text-${st.color}-600">${st.desc}</p>` : ''}
        ${isProcessing ? `
          <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-start gap-2">
              <span class="text-amber-500 flex-shrink-0">⏱</span>
              <div class="text-xs text-amber-800 leading-relaxed">
                <div class="font-semibold">ใช้เวลาทำและทดสอบประมาณ 1-3 วัน</div>
                <div class="mt-0.5 text-amber-600">โค้ดจะถูกสร้าง ทดสอบ และตรวจสอบคุณภาพก่อนส่งมอบ เมื่อเสร็จแล้วจะแจ้งเตือนให้ดาวน์โหลดได้ทันที</div>
              </div>
            </div>
          </div>
          <div class="mt-2"><div class="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-${st.color}-500 rounded-full animate-pulse" style="width:${o.status === 'pending_payment' ? '20' : o.status === 'generating' ? '50' : '80'}%"></div></div></div>
        ` : ''}
        ${o.status === 'completed' ? `
          <div class="mt-3 flex gap-2">
            <button onclick="downloadCodegenOrder('${o.download_token}')" class="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"></path></svg>
              ดาวน์โหลด ZIP${o.file_count ? ' (' + o.file_count + ' ไฟล์)' : ''}
            </button>
          </div>` : ''}
        ${o.status === 'rejected' && o.admin_note ? `<p class="mt-2 text-xs text-red-500">เหตุผล: ${escapeHtml(o.admin_note)}</p>` : ''}
      </div>`;
    }).join('');
  } catch {
    container.innerHTML = '<p class="text-center text-slate-400 py-8">โหลดไม่สำเร็จ</p>';
  }
}

async function downloadCodegenOrder(token) {
  try {
    const tkn = localStorage.getItem('kp_token');
    const res = await fetch(`/api/codegen-orders/download?token=${token}`, {
      headers: { 'Authorization': `Bearer ${tkn}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Download failed');
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || '';
    const filename = cd.match(/filename="?([^"]+)"?/)?.[1] || 'project.zip';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดสำเร็จ', 'success');
  } catch (err) {
    showToast(err.message || 'ดาวน์โหลดไม่สำเร็จ', 'error');
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
          <label class="block text-sm font-medium text-slate-700 mb-1">หมายเลขพร้อมเพย์</label>
          <input type="text" name="promptpay_number" value="${escapeHtml(u.promptpay_number || '')}" placeholder="เบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อบัญชีพร้อมเพย์</label>
          <input type="text" name="promptpay_name" value="${escapeHtml(u.promptpay_name || '')}" placeholder="ชื่อ-นามสกุล ตามบัญชี" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none">
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
        ${p.tech_stack?.length ? `<div class="flex flex-wrap gap-1 mb-3">${p.tech_stack.slice(0, 4).map(t => `<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">${escapeHtml(t)}</span>`).join('')}${p.tech_stack.length > 4 ? `<span class="text-xs text-slate-400">+${p.tech_stack.length - 4}</span>` : ''}</div>` : ''}
        ${!p.marketplace_prompt_id ? `<button onclick="goToSellPrompt('${p.id}')" class="w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg> ลงขายใน Marketplace
        </button>` : `<div class="flex gap-2">
          <a href="/prompt-detail.html?id=${p.marketplace_prompt_id}" class="flex-1 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> ดูในตลาด
          </a>
          <button onclick="sharePrompt('${p.marketplace_prompt_id}', '${escapeHtml(p.title)}')" class="flex-1 py-2 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors flex items-center justify-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg> แชร์
          </button>
        </div>`}
      </div>
    `).join('')}</div>`;
  } catch {
    container.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">โหลดไม่สำเร็จ</p>';
  }
}

// =============================================
// Account — Purchased Prompts
// =============================================
async function loadPurchasedPrompts() {
  const container = document.getElementById('purchased-prompts-list');
  if (!container) return;

  try {
    const { orders } = await api('/orders');

    if (!orders || orders.length === 0) {
      container.innerHTML = `<div class="text-center py-16">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <p class="text-slate-400 mb-4">ยังไม่มี Prompt ที่ซื้อ</p>
        <a href="/marketplace.html" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">เลือกซื้อ Prompt</a>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${orders.map(o => {
      const p = o.prompt || {};
      return `
      <div class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <h3 class="font-semibold text-slate-800 text-sm truncate mb-1">${escapeHtml(p.title || 'Prompt')}</h3>
        <p class="text-xs text-slate-400 mb-3">${escapeHtml(o.seller?.display_name || '')} — ${formatPromptPrice(o.amount)} — ${new Date(o.created_at).toLocaleDateString('th-TH')}</p>
        <div class="flex gap-2">
          <button onclick="downloadPrompt('${p.id}')" class="flex-1 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3"/></svg> ดาวน์โหลด
          </button>
          <a href="/prompt-detail.html?id=${p.id}" class="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">ดู</a>
        </div>
      </div>`;
    }).join('')}</div>`;
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
        ${!p.marketplace_prompt_id ? `<button onclick="goToSellPrompt('${p.id}')" class="w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4"/></svg> ลงขายใน Marketplace</button>` : `<div class="flex gap-2">
          <a href="/prompt-detail.html?id=${p.marketplace_prompt_id}" class="flex-1 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors text-center">ดูในตลาด</a>
          <button onclick="sharePrompt('${p.marketplace_prompt_id}', '${escapeHtml(p.title)}')" class="flex-1 py-2 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">แชร์</button>
        </div>`}
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

async function sharePrompt(promptId, title) {
  const url = `${window.location.origin}/prompt-detail.html?id=${promptId}`;

  // Try native share first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title: title, text: `ดู Prompt "${title}" บน KP Prompt Creator`, url });
      return;
    } catch {}
  }

  // Fallback: show share modal
  const shareOptions = [
    { name: 'Copy Link', icon: '🔗', action: () => { navigator.clipboard.writeText(url); showToast('คัดลอกลิงก์แล้ว', 'success'); } },
    { name: 'Facebook', icon: '📘', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank') },
    { name: 'LINE', icon: '💬', action: () => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank') },
    { name: 'X (Twitter)', icon: '🐦', action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`ดู Prompt "${title}" บน KP Prompt Creator`)}`, '_blank') },
  ];

  const overlay = document.createElement('div');
  overlay.className = 'kp-modal-overlay';
  overlay.innerHTML = `
    <div class="kp-modal">
      <div class="kp-modal-icon">🔗</div>
      <div class="kp-modal-message" style="margin-bottom:8px;font-weight:600;">แชร์ Prompt</div>
      <input type="text" value="${url}" readonly style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;color:#64748b;margin-bottom:12px;background:#f8fafc;" onclick="this.select()">
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        ${shareOptions.map((s, i) => `<button class="kp-share-btn" data-share-idx="${i}" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;transition:all .2s;font-size:12px;min-width:70px;">
          <span style="font-size:20px;">${s.icon}</span>${s.name}
        </button>`).join('')}
      </div>
      <div class="kp-modal-actions" style="margin-top:16px;">
        <button class="kp-modal-btn kp-modal-cancel">ปิด</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  function close() {
    overlay.classList.remove('show');
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 200);
  }

  overlay.querySelector('.kp-modal-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  shareOptions.forEach((s, i) => {
    overlay.querySelector(`[data-share-idx="${i}"]`).addEventListener('click', () => { s.action(); close(); });
  });
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

// Go to dashboard to sell a saved prompt
async function goToSellPrompt(savedPromptId) {
  // Store the saved prompt ID so dashboard can pre-fill
  localStorage.setItem('kp_sell_prompt_id', savedPromptId);
  window.location.href = '/dashboard.html#tab-create';
}
