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
    } catch (err) {
        showToast(err.error || t('toastPromptSaveFailed'));
    } finally {
        resetSavePromptSubmitButton();
    }
}
