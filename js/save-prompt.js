// ===== Save Prompt Overrides =====

function resetSavePromptSubmitButton() {
    const btn = document.getElementById('save-prompt-submit');
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-bookmark-check"></i> <span data-i18n="savePromptSubmit">${t('savePromptSubmit')}</span>`;
}

function openSavePromptModal() {
    const content = document.getElementById('resultText')?.value;
    if (!content) {
        showToast(t('toastNoPromptToSave'));
        return;
    }

    const overlay = document.getElementById('savePromptOverlay');
    const authSection = document.getElementById('save-auth-section');
    const formSection = document.getElementById('save-form-section');
    const token = getSavedToken();

    overlay.style.display = 'flex';
    resetSavePromptSubmitButton();

    if (!token) {
        authSection.style.display = 'block';
        formSection.style.display = 'none';
        return;
    }

    authSection.style.display = 'none';
    formSection.style.display = 'block';

    const projectName = document.getElementById('projectName')?.value || '';
    const targetAI = getRadioValue('targetAI') || 'claude';
    document.getElementById('save-prompt-title').value = projectName ? `${projectName} (${targetAI})` : `Prompt ${targetAI}`;
    loadCollectionsForSave();
}

function closeSaveModal() {
    document.getElementById('savePromptOverlay').style.display = 'none';
    document.getElementById('new-collection-section').style.display = 'none';
    document.getElementById('new-collection-name').value = '';
    resetSavePromptSubmitButton();
}

async function loadCollectionsForSave() {
    const select = document.getElementById('save-collection-select');
    const defaultOption = `<option value="">${t('saveCollectionPlaceholder')}</option>`;

    try {
        const { collections } = await saveApi('/collections');
        select.innerHTML = defaultOption +
            collections.map(c => `<option value="${c.id}">${c.name} (${c.prompt_count})</option>`).join('');
    } catch {
        select.innerHTML = defaultOption;
    }
}

async function createNewCollection() {
    const nameInput = document.getElementById('new-collection-name');
    const name = nameInput.value.trim();
    if (!name) {
        showToast(t('toastCollectionNameRequired'));
        return;
    }

    try {
        const { collection } = await saveApi('/collections', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        showToast(t('toastCollectionCreated', { name }));
        nameInput.value = '';
        document.getElementById('new-collection-section').style.display = 'none';
        await loadCollectionsForSave();
        document.getElementById('save-collection-select').value = collection.id;
    } catch (err) {
        showToast(err.error || t('toastCollectionCreateFailed'));
    }
}

async function handleSavePrompt(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('save-prompt-submit');
    const title = form.title.value.trim();

    if (!title) {
        showToast(t('toastSaveTitleRequired'));
        form.title.focus();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:4px;"></div> ${t('savePromptSaving')}`;

    const content = document.getElementById('resultText')?.value || '';
    const resultSection = document.getElementById('result-section');
    const fileName = resultSection?.dataset.fileName || 'CLAUDE.md';
    const projectName = document.getElementById('projectName')?.value || '';
    const targetAI = getRadioValue('targetAI') || '';

    const techStack = [];
    ['platform', 'database', 'cssFramework', 'language', 'authentication', 'apiStyle', 'hosting'].forEach(name => {
        const val = getRadioValue(name);
        if (val && val !== 'none') techStack.push(val);
    });

    try {
        await saveApi('/saved-prompts', {
            method: 'POST',
            body: JSON.stringify({
                title,
                content,
                target_ai: targetAI,
                project_name: projectName,
                tech_stack: techStack,
                file_name: fileName,
                collection_id: form.collection_id.value || null,
                source: 'creator'
            })
        });
        showToast(t('toastPromptSaved'));
        closeSaveModal();

        // GAS Builder upsell — เด้งถ้าเหมาะ
        try {
            maybeShowGasUpsell({
                platform: getRadioValue('platform') || '',
                content,
                title,
                techStack,
            });
        } catch (e) { /* fail silent */ }
    } catch (err) {
        showToast(err.error || t('toastPromptSaveFailed'));
    } finally {
        resetSavePromptSubmitButton();
    }
}

// ──────────────────────────────────────────────────────────
// GAS Builder Upsell Hook
// ──────────────────────────────────────────────────────────

const GAS_UPSELL_KEYWORDS = /\b(เว็บ|web|sheet|sheets|api|form|dashboard|crm|automation|ระบบ|จัดการ|บันทึก|inventory|booking|pos|order)\b/i;
const GAS_UPSELL_DISMISS_KEY = 'gasUpsellDismissedAt';
const GAS_UPSELL_THROTTLE_MS = 7 * 86400000;  // 7 days

function shouldShowGasUpsell({ platform, content }) {
    if (platform === 'google-apps-script') return true;
    if (GAS_UPSELL_KEYWORDS.test(content || '')) return true;
    return false;
}

function canShowGasUpsell() {
    try {
        const last = localStorage.getItem(GAS_UPSELL_DISMISS_KEY);
        if (!last) return true;
        return (Date.now() - Number(last)) > GAS_UPSELL_THROTTLE_MS;
    } catch { return true; }
}

function maybeShowGasUpsell(meta) {
    if (!shouldShowGasUpsell(meta)) return;
    if (!canShowGasUpsell()) return;

    // Build modal inline (no external dependency)
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    wrap.innerHTML = `
      <div style="background:white;border-radius:16px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.2);">
        <div style="text-align:right;">
          <button id="gas-upsell-close" style="background:none;border:0;font-size:20px;color:#94a3b8;cursor:pointer;">×</button>
        </div>
        <h3 style="margin:0 0 12px;font-size:1.25rem;font-weight:bold;color:#1e293b;">🎯 อยากได้ระบบนี้ใช้งานจริงไหม?</h3>
        <p style="color:#475569;margin:0 0 16px;font-size:0.95rem;line-height:1.5;">
          พร้อมที่คุณเพิ่งสร้างเหมาะกับการทำเป็นระบบบน Google Apps Script + Sheet พอดี<br>
          <strong>เราสร้างให้ได้เลย เริ่มต้น ฿499</strong>
        </p>
        <ul style="color:#475569;font-size:0.9rem;margin:0 0 20px;padding-left:1rem;line-height:1.6;">
          <li>✓ ฟรี hosting ตลอดชีพ (Mode A)</li>
          <li>✓ ส่งมอบใน 3 วันทำการ</li>
          <li>✓ คุณไม่ต้อง deploy เอง</li>
        </ul>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="gas-upsell-dismiss" style="padding:8px 16px;border:1px solid #cbd5e1;background:white;border-radius:8px;font-size:0.9rem;cursor:pointer;">ไม่ตอนนี้</button>
          <button id="gas-upsell-go" style="padding:8px 16px;background:#7c3aed;color:white;border:0;border-radius:8px;font-size:0.9rem;font-weight:500;cursor:pointer;">ดูราคา + สั่งสร้าง →</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const close = () => wrap.remove();
    const dismiss = () => {
        try { localStorage.setItem(GAS_UPSELL_DISMISS_KEY, String(Date.now())); } catch {}
        close();
    };

    wrap.querySelector('#gas-upsell-close').onclick = dismiss;
    wrap.querySelector('#gas-upsell-dismiss').onclick = dismiss;
    wrap.querySelector('#gas-upsell-go').onclick = () => {
        close();
        window.location.href = '/gas-builder.html?from=prompt';
    };
}
