// ===== Prompt Creator - App Logic =====

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// ===== Project Templates =====
const PROJECT_TEMPLATES = {
    ecommerce: {
        name: { th: 'ร้านค้าออนไลน์', en: 'Online Store' },
        desc: { th: 'เว็บขายของออนไลน์ มีระบบสมัครสมาชิก/login, แสดงรายการสินค้า, ตะกร้าสินค้า, ชำระเงิน, ประวัติการสั่งซื้อ, แดชบอร์ดสำหรับ admin จัดการสินค้าและออเดอร์', en: 'Online store with user registration/login, product listing, shopping cart, checkout, order history, admin dashboard for managing products and orders' },
        techStack: { platform: 'nextjs-vercel', database: 'supabase', cssFramework: 'tailwind', language: 'typescript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'supabase-auth', apiStyle: 'rest', packageManager: 'pnpm', testing: 'vitest', hosting: 'vercel' }
    },
    inventory: {
        name: { th: 'ระบบจัดการสต็อกสินค้า', en: 'Inventory Management System' },
        desc: { th: 'ระบบจัดการสต็อกสินค้า มีระบบ login, เพิ่ม/แก้ไข/ลบสินค้า, ติดตามจำนวนสต็อก, แจ้งเตือนสินค้าใกล้หมด, แดชบอร์ดสรุปยอดขาย, export รายงานเป็น Excel', en: 'Inventory management system with login, add/edit/delete products, stock tracking, low stock alerts, sales dashboard, Excel report export' },
        techStack: { platform: 'google-apps-script', database: 'google-sheets', cssFramework: 'bootstrap', language: 'javascript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'none', apiStyle: 'rest', packageManager: 'none', testing: 'none', hosting: 'gas-deploy' }
    },
    portfolio: {
        name: { th: 'เว็บ Portfolio', en: 'Portfolio Website' },
        desc: { th: 'เว็บแสดงผลงาน Portfolio มีหน้าแนะนำตัว, แสดงผลงาน/โปรเจกต์พร้อมรูปภาพ, ทักษะ/Skills, ประวัติการทำงาน, แบบฟอร์มติดต่อ, ลิงก์ social media', en: 'Portfolio website with intro page, project showcase with images, skills section, work experience, contact form, social media links' },
        techStack: { platform: 'static-html', database: 'google-sheets', cssFramework: 'tailwind', language: 'javascript', pageType: 'single-page', pwa: 'no', responsive: 'responsive', authentication: 'none', apiStyle: 'rest', packageManager: 'none', testing: 'none', hosting: 'netlify' }
    },
    booking: {
        name: { th: 'ระบบจองนัดหมาย', en: 'Appointment Booking System' },
        desc: { th: 'ระบบจองนัดหมาย มี login สำหรับลูกค้าและ admin, ปฏิทินแสดงช่วงเวลาว่าง, จองนัด/ยกเลิก, แจ้งเตือนผ่าน email, admin จัดการตารางนัด, ประวัติการจอง', en: 'Appointment booking system with customer/admin login, calendar with available slots, book/cancel appointments, email notifications, admin schedule management, booking history' },
        techStack: { platform: 'nextjs-vercel', database: 'supabase', cssFramework: 'tailwind', language: 'typescript', pageType: 'spa', pwa: 'yes', responsive: 'responsive', authentication: 'supabase-auth', apiStyle: 'rest', packageManager: 'pnpm', testing: 'vitest', hosting: 'vercel' }
    },
    dashboard: {
        name: { th: 'แดชบอร์ดสรุปข้อมูล', en: 'Data Dashboard' },
        desc: { th: 'แดชบอร์ดแสดงข้อมูลสรุป มีกราฟ/ชาร์ตหลายรูปแบบ, ตารางข้อมูล, กรองตามช่วงวันที่, export เป็น PDF/Excel, รองรับข้อมูล real-time', en: 'Data summary dashboard with various charts/graphs, data tables, date range filter, PDF/Excel export, real-time data support' },
        techStack: { platform: 'react-vercel', database: 'firebase-firestore', cssFramework: 'tailwind', language: 'typescript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'firebase-auth', apiStyle: 'rest', packageManager: 'npm', testing: 'vitest', hosting: 'vercel' }
    },
    blog: {
        name: { th: 'เว็บบล็อก', en: 'Blog Website' },
        desc: { th: 'เว็บบล็อก/CMS มีระบบเขียนบทความพร้อม rich text editor, จัดหมวดหมู่/แท็ก, ค้นหาบทความ, ระบบ comment, admin จัดการบทความ, SEO friendly', en: 'Blog/CMS with rich text editor, categories/tags, article search, comment system, admin article management, SEO friendly' },
        techStack: { platform: 'nextjs-vercel', database: 'supabase', cssFramework: 'daisyui', language: 'typescript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'supabase-auth', apiStyle: 'rest', packageManager: 'pnpm', testing: 'jest', hosting: 'vercel' }
    }
};

function applyTemplate(templateId) {
    const tpl = PROJECT_TEMPLATES[templateId];
    if (!tpl) return;

    const lang = currentLang || 'th';

    // Fill project name and description
    document.getElementById('projectName').value = tpl.name[lang] || tpl.name.th;
    document.getElementById('projectDesc').value = tpl.desc[lang] || tpl.desc.th;

    // Set all radio buttons
    for (const [name, value] of Object.entries(tpl.techStack)) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // Highlight active template
    document.querySelectorAll('.template-card').forEach(card => card.classList.remove('active'));
    const activeCard = document.querySelector(`.template-card[data-template="${templateId}"]`);
    if (activeCard) activeCard.classList.add('active');

    // Scroll to project section
    document.getElementById('project-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    showToast(t('tplApplied', { name: tpl.name[lang] || tpl.name.th }));
}

// ===== Description Helper =====
function initDescHelper() {
    document.querySelectorAll('.desc-helper-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const textarea = document.getElementById('projectDesc');
            const appendText = chip.dataset.append;
            if (textarea.value && !textarea.value.endsWith(', ') && !textarea.value.endsWith('\n')) {
                textarea.value += ', ';
            }
            textarea.value += appendText;
            textarea.focus();
        });
    });
}

// ===== Usage Guide =====
function renderUsageGuide(targetAI) {
    const guideSteps = document.getElementById('usageGuideSteps');
    if (!guideSteps) return;

    const guideMap = {
        'claude': 'Claude',
        'gemini-cli': 'Gemini',
        'cursor': 'Cursor',
        'github-copilot': 'Copilot',
        'codex': 'Codex',
        'windsurf': 'Windsurf',
        'other': 'Other'
    };
    const prefix = 'guide' + (guideMap[targetAI] || 'Other');

    guideSteps.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
        const li = document.createElement('li');
        li.innerHTML = t(prefix + i);
        guideSteps.appendChild(li);
    }
}

function initApp() {
    // Template click handlers
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => applyTemplate(card.dataset.template));
    });

    // Description helper
    initDescHelper();

    // Load saved API key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        document.getElementById('apiKey').value = savedKey;
    }

    // Save API key on change
    document.getElementById('apiKey').addEventListener('input', (e) => {
        localStorage.setItem('gemini_api_key', e.target.value.trim());
    });

    // Toggle API key visibility
    document.getElementById('toggleApiKey').addEventListener('click', () => {
        const input = document.getElementById('apiKey');
        const icon = document.querySelector('#toggleApiKey i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    });

    // Show/hide "other AI" input
    document.querySelectorAll('input[name="targetAI"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const otherGroup = document.getElementById('otherAiGroup');
            otherGroup.style.display = radio.value === 'other' && radio.checked ? 'block' : 'none';
        });
    });

    // Tech stack validation - listen on all relevant fields
    ['platform', 'database', 'pageType', 'cssFramework', 'language', 'authentication', 'apiStyle', 'packageManager', 'testing', 'hosting'].forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.addEventListener('change', applyValidationRules);
        });
    });
    applyValidationRules();

    // Fetch skills button
    document.getElementById('fetchSkillsBtn').addEventListener('click', fetchSkills);

    // Magic Wizard button
    document.getElementById('magicWizardBtn').addEventListener('click', openMagicWizard);
    document.getElementById('wizardClose').addEventListener('click', closeWizard);
    document.getElementById('wizardCancel').addEventListener('click', closeWizard);
    document.getElementById('wizardApply').addEventListener('click', applyWizardSelections);
    document.getElementById('wizardOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeWizard();
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generatePrompt);

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', copyResult);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);

    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Chat mode
    document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    document.getElementById('chatResetBtn').addEventListener('click', resetChat);

    // Wizard mode
    document.getElementById('wizAnalyzeBtn').addEventListener('click', startWizardAnalysis);
    document.getElementById('wizGenerateBtn').addEventListener('click', wizardGenerate);

    // Initialize i18n
    updateLangToggle();
    applyTranslations();
}

// ===== Tech Stack Validation =====

// Compatibility rules: when platform X is selected, restrict field Y
const COMPAT_RULES = {
    database: {
        'google-apps-script': {
            allowed: ['google-sheets', 'supabase', 'firebase-firestore'],
            blocked: ['mongodb-atlas', 'turso'],
            reason: t('reasonGASDB')
        },
        'static-html': {
            allowed: ['google-sheets', 'firebase-firestore', 'supabase'],
            blocked: ['mongodb-atlas', 'turso'],
            reason: t('reasonStaticDB')
        }
    },
    cssFramework: {
        'google-apps-script': {
            allowed: ['bootstrap', 'tailwind', 'daisyui'],
            blocked: ['shadcn-ui', 'material-ui'],
            reason: t('reasonGASCSS')
        }
    },
    language: {
        'google-apps-script': {
            allowed: ['javascript'],
            blocked: ['typescript'],
            reason: t('reasonGASLang')
        }
    },
    authentication: {
        'google-apps-script': {
            allowed: ['none', 'firebase-auth', 'supabase-auth'],
            blocked: ['clerk'],
            reason: t('reasonGASAuth')
        }
    },
    apiStyle: {
        'google-apps-script': {
            allowed: ['rest', 'graphql'],
            blocked: ['trpc'],
            reason: t('reasonGASAPI')
        }
    },
    packageManager: {
        'google-apps-script': {
            allowed: ['none'],
            blocked: ['npm', 'pnpm', 'bun'],
            reason: t('reasonGASPkg')
        },
        'static-html': {
            allowed: ['none'],
            blocked: ['pnpm', 'bun'],
            reason: t('reasonStaticPkg')
        }
    },
    testing: {
        'google-apps-script': {
            allowed: ['none'],
            blocked: ['vitest', 'jest', 'playwright'],
            reason: t('reasonGASTest')
        }
    },
    hosting: {
        'google-apps-script': {
            allowed: ['gas-deploy'],
            blocked: ['vercel', 'netlify', 'cloudflare-pages', 'firebase-hosting'],
            reason: t('reasonGASHost')
        },
        'react-vercel': {
            allowed: ['vercel'],
            blocked: ['gas-deploy', 'netlify'],
            reason: t('reasonReactHost')
        },
        'nextjs-vercel': {
            allowed: ['vercel'],
            blocked: ['gas-deploy', 'netlify', 'cloudflare-pages'],
            reason: t('reasonNextHost')
        },
        'vue-netlify': {
            allowed: ['netlify'],
            blocked: ['gas-deploy', 'vercel'],
            reason: t('reasonVueHost')
        }
    },
    pageType: {}
};

function applyValidationRules() {
    const platform = getRadioValue('platform');

    // Validate database
    applyRule('database', platform);

    // Validate page type
    applyRule('pageType', platform);
}

function applyRule(fieldName, platform) {
    const rule = COMPAT_RULES[fieldName]?.[platform];
    if (!rule) {
        // No rule = enable all options
        document.querySelectorAll(`input[name="${fieldName}"]`).forEach(radio => {
            const card = radio.closest('.option-card');
            card.classList.remove('disabled');
            radio.disabled = false;
        });
        removeWarning(fieldName);
        return;
    }

    let needSwitch = false;
    const currentValue = getRadioValue(fieldName);

    document.querySelectorAll(`input[name="${fieldName}"]`).forEach(radio => {
        const card = radio.closest('.option-card');
        if (rule.blocked.includes(radio.value)) {
            card.classList.add('disabled');
            radio.disabled = true;
            if (radio.checked) {
                radio.checked = false;
                needSwitch = true;
            }
        } else {
            card.classList.remove('disabled');
            radio.disabled = false;
        }
    });

    // Auto-select allowed option if current was blocked
    if (needSwitch && rule.allowed.length > 0) {
        const allowedRadio = document.querySelector(`input[name="${fieldName}"][value="${rule.allowed[0]}"]`);
        if (allowedRadio) {
            allowedRadio.checked = true;
        }
    }

    // Show/update warning
    showWarning(fieldName, rule.reason);
}

function showWarning(fieldName, message) {
    const group = document.querySelector(`input[name="${fieldName}"]`).closest('.form-group');
    removeWarning(fieldName);

    const warning = document.createElement('div');
    warning.className = 'validation-warning';
    warning.dataset.field = fieldName;
    warning.innerHTML = `<i class="bi bi-info-circle"></i> ${message}`;
    group.appendChild(warning);
}

function removeWarning(fieldName) {
    const existing = document.querySelector(`.validation-warning[data-field="${fieldName}"]`);
    if (existing) existing.remove();
}

// ===== Skills Fetching =====

const SKILLS_CATALOG = [
    {
        name: 'anthropics/skills/frontend-design',
        title: 'Frontend Design',
        description: 'Design system and philosophy for bold aesthetic choices, distinctive typography, purposeful color palettes, and intentional animations.',
        installs: '277K+',
        tags: ['design', 'ui', 'frontend', 'css']
    },
    {
        name: 'anthropics/skills/web-interface-guidelines',
        title: 'Web Interface Guidelines',
        description: 'Comprehensive web interface validation standards for accessibility, performance, and best practices.',
        installs: '133K+',
        tags: ['web', 'validation', 'accessibility', 'guidelines']
    },
    {
        name: 'anthropics/skills/create-mcp-server',
        title: 'Create MCP Server',
        description: 'Guide for creating Model Context Protocol servers for AI tool integration.',
        installs: '50K+',
        tags: ['mcp', 'server', 'api', 'integration']
    },
    {
        name: 'obra/superpowers',
        title: 'Superpowers',
        description: '20+ battle-tested skills including TDD, debugging, and collaboration patterns for coding agents.',
        installs: '45K+',
        tags: ['tdd', 'debugging', 'testing', 'development']
    },
    {
        name: 'anthropics/skills/remotion',
        title: 'Remotion',
        description: 'Create videos programmatically with React. Translate natural language into working Remotion components.',
        installs: '30K+',
        tags: ['video', 'react', 'animation', 'media']
    },
    {
        name: 'alirezarezvani/claude-skills/pwa-builder',
        title: 'PWA Builder',
        description: 'Progressive Web App creation with service workers, manifest, offline support, and installability.',
        installs: '18K+',
        tags: ['pwa', 'service-worker', 'offline', 'mobile']
    },
    {
        name: 'alirezarezvani/claude-skills/supabase-integration',
        title: 'Supabase Integration',
        description: 'Supabase database setup, auth, real-time subscriptions, and API integration patterns.',
        installs: '22K+',
        tags: ['supabase', 'database', 'auth', 'backend']
    },
    {
        name: 'alirezarezvani/claude-skills/react-best-practices',
        title: 'React Best Practices',
        description: 'React patterns, hooks, state management, and performance optimization guidelines.',
        installs: '35K+',
        tags: ['react', 'hooks', 'state', 'frontend']
    },
    {
        name: 'alirezarezvani/claude-skills/tailwind-components',
        title: 'Tailwind Components',
        description: 'Pre-built Tailwind CSS component patterns for rapid UI development.',
        installs: '28K+',
        tags: ['tailwind', 'css', 'components', 'ui']
    },
    {
        name: 'alirezarezvani/claude-skills/bootstrap-templates',
        title: 'Bootstrap Templates',
        description: 'Bootstrap layout templates and component patterns for responsive web design.',
        installs: '20K+',
        tags: ['bootstrap', 'css', 'templates', 'responsive']
    },
    {
        name: 'alirezarezvani/claude-skills/google-apps-script',
        title: 'Google Apps Script',
        description: 'Google Apps Script patterns for Sheets, Forms, Docs automation and web apps.',
        installs: '15K+',
        tags: ['gas', 'google', 'sheets', 'automation']
    },
    {
        name: 'alirezarezvani/claude-skills/spa-routing',
        title: 'SPA Routing',
        description: 'Single Page Application routing patterns with client-side navigation and history API.',
        installs: '12K+',
        tags: ['spa', 'routing', 'navigation', 'frontend']
    },
    {
        name: 'alirezarezvani/claude-skills/responsive-design',
        title: 'Responsive Design',
        description: 'Mobile-first responsive design patterns, breakpoints, and adaptive layouts.',
        installs: '25K+',
        tags: ['responsive', 'mobile', 'layout', 'css']
    },
    {
        name: 'alirezarezvani/claude-skills/vercel-deployment',
        title: 'Vercel Deployment',
        description: 'Vercel deployment configuration, serverless functions, and CI/CD setup.',
        installs: '19K+',
        tags: ['vercel', 'deploy', 'serverless', 'ci-cd']
    },
    {
        name: 'alirezarezvani/claude-skills/api-design',
        title: 'API Design',
        description: 'RESTful API design patterns, error handling, authentication, and documentation.',
        installs: '21K+',
        tags: ['api', 'rest', 'backend', 'design']
    }
];

function fetchSkills() {
    const projectDesc = document.getElementById('projectDesc').value.toLowerCase();
    const platform = getRadioValue('platform');
    const database = getRadioValue('database');
    const cssFramework = getRadioValue('cssFramework');
    const pageType = getRadioValue('pageType');
    const pwa = getRadioValue('pwa');
    const responsive = getRadioValue('responsive');

    const loadingEl = document.getElementById('skillsLoading');
    const listEl = document.getElementById('skillsList');

    loadingEl.style.display = 'flex';
    listEl.innerHTML = '';

    // Build relevance tags based on selections
    const relevantTags = new Set();
    relevantTags.add('web');
    relevantTags.add('frontend');

    const platformTags = {
        'google-apps-script': ['gas', 'google', 'sheets'],
        'react-vercel': ['react', 'vercel', 'deploy'],
        'nextjs-vercel': ['react', 'vercel', 'deploy', 'ssr'],
        'vue-netlify': ['vue', 'netlify', 'deploy'],
        'static-html': ['html', 'vanilla']
    };
    (platformTags[platform] || []).forEach(t => relevantTags.add(t));

    const dbTags = {
        'google-sheets': ['google', 'sheets'],
        'supabase': ['supabase', 'database', 'auth'],
        'firebase-firestore': ['firebase', 'database', 'nosql'],
        'mongodb-atlas': ['mongodb', 'database', 'nosql'],
        'turso': ['sqlite', 'database', 'edge']
    };
    (dbTags[database] || []).forEach(t => relevantTags.add(t));

    const cssTags = {
        'bootstrap': ['bootstrap'], 'tailwind': ['tailwind'],
        'daisyui': ['tailwind', 'daisyui'], 'shadcn-ui': ['tailwind', 'react'],
        'material-ui': ['react', 'material']
    };
    (cssTags[cssFramework] || []).forEach(t => relevantTags.add(t));

    if (pageType === 'spa') {
        relevantTags.add('spa');
        relevantTags.add('routing');
    }

    if (pwa === 'yes') {
        relevantTags.add('pwa');
        relevantTags.add('service-worker');
    }

    if (responsive === 'responsive') {
        relevantTags.add('responsive');
        relevantTags.add('mobile');
    }

    relevantTags.add('ui');
    relevantTags.add('css');
    relevantTags.add('design');

    // Score and sort skills by relevance
    const scoredSkills = SKILLS_CATALOG.map(skill => {
        let score = 0;
        for (const tag of skill.tags) {
            if (relevantTags.has(tag)) score += 2;
        }
        // Boost if description matches project description keywords
        if (projectDesc) {
            const words = projectDesc.split(/\s+/);
            for (const word of words) {
                if (word.length > 2 && skill.description.toLowerCase().includes(word)) {
                    score += 1;
                }
            }
        }
        return { ...skill, score };
    });

    scoredSkills.sort((a, b) => b.score - a.score);

    // Show top relevant skills
    const topSkills = scoredSkills.filter(s => s.score > 0).slice(0, 8);

    setTimeout(() => {
        loadingEl.style.display = 'none';

        if (topSkills.length === 0) {
            listEl.innerHTML = '<p class="form-hint">' + t('skillsEmpty') + '</p>';
            return;
        }

        topSkills.forEach((skill, index) => {
            const checked = skill.score >= 3 ? 'checked' : '';
            const html = `
                <label class="skill-item">
                    <input type="checkbox" name="skills" value="${skill.name}" ${checked}>
                    <div class="skill-info">
                        <span class="skill-name">${skill.title}</span>
                        <span class="skill-desc">${skill.description}</span>
                        <span class="skill-meta"><code>${skill.name}</code> &middot; ${skill.installs} installs</span>
                    </div>
                </label>
            `;
            listEl.innerHTML += html;
        });
    }, 800);
}

// ===== Magic Wizard =====

let wizardSelections = {};

async function openMagicWizard() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKeyWizard'));
        return;
    }
    const projectName = document.getElementById('projectName').value.trim();
    const projectDesc = document.getElementById('projectDesc').value.trim();
    if (!projectName || !projectDesc) {
        showToast(t('toastNoProjectWizard'));
        return;
    }

    // Show modal with loading
    const overlay = document.getElementById('wizardOverlay');
    const body = document.getElementById('wizardBody');
    const footer = document.getElementById('wizardFooter');
    overlay.classList.add('active');
    footer.style.display = 'none';
    body.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>' + t('wizardLoading') + '</span></div>';

    const wizardPrompt = `คุณเป็นผู้เชี่ยวชาญด้าน web development tech stack
วิเคราะห์โปรเจกต์นี้และแนะนำ tech stack ที่เหมาะสมที่สุด

โปรเจกต์: ${projectName}
คำอธิบาย: ${projectDesc}

ตอบเป็น JSON เท่านั้น (ไม่ต้องครอบด้วย code block) ตามรูปแบบนี้:
{
  "summary": "สรุปสั้นๆ ว่าทำไมถึงแนะนำ stack นี้",
  "recommendations": {
    "platform": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "database": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "cssFramework": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "language": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "pageType": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "pwa": { "value": "...", "reason": "..." },
    "responsive": { "value": "...", "reason": "..." },
    "authentication": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "apiStyle": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "packageManager": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "testing": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." },
    "hosting": { "value": "...", "reason": "...", "alt_value": "...", "alt_reason": "..." }
  }
}

ค่า value ที่ใช้ได้:
- platform: google-apps-script, react-vercel, nextjs-vercel, vue-netlify, static-html
- database: google-sheets, supabase, firebase-firestore, mongodb-atlas, turso
- cssFramework: bootstrap, tailwind, daisyui, shadcn-ui, material-ui
- language: javascript, typescript
- pageType: single-page, spa
- pwa: yes, no
- responsive: responsive, desktop-only
- authentication: none, firebase-auth, supabase-auth, clerk
- apiStyle: rest, graphql, trpc
- packageManager: none, npm, pnpm, bun
- testing: none, vitest, jest, playwright
- hosting: gas-deploy, vercel, netlify, cloudflare-pages, firebase-hosting

ตอบเป็น JSON เท่านั้น`;

    try {
        const raw = await callGeminiAPI(apiKey, wizardPrompt);
        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const data = JSON.parse(jsonStr);
        renderWizardResults(data);
    } catch (err) {
        body.innerHTML = `<div class="wizard-error"><i class="bi bi-exclamation-triangle"></i><p>${err.message}</p><button class="btn btn-outline btn-sm" onclick="openMagicWizard()">${t('retryBtn')}</button></div>`;
    }
}

function getWizardLabels() {
    return {
        platform: t('wlPlatform'), database: t('wlDatabase'), cssFramework: t('wlCSSFramework'),
        language: t('wlLanguage'), pageType: t('wlPageType'), pwa: t('wlPWA'),
        responsive: t('wlResponsive'), authentication: t('wlAuthentication'), apiStyle: t('wlAPIStyle'),
        packageManager: t('wlPackageManager'), testing: t('wlTesting'), hosting: t('wlHosting')
    };
}

function renderWizardResults(data) {
    const body = document.getElementById('wizardBody');
    const footer = document.getElementById('wizardFooter');
    wizardSelections = {};

    let html = '';
    if (data.summary) {
        html += `<div class="wizard-summary">${data.summary}</div>`;
    }

    for (const [field, rec] of Object.entries(data.recommendations)) {
        const label = getWizardLabels()[field] || field;
        wizardSelections[field] = rec.value;

        html += `<div class="wizard-item"><div class="wizard-item-label">${label}</div><div class="wizard-item-options">`;

        // Recommended option
        html += `<button class="wizard-option selected" data-field="${field}" data-value="${rec.value}" onclick="selectWizardOption(this)">
            <div class="wizard-option-radio"></div>
            <div class="wizard-option-content">
                <div class="wizard-option-header">
                    <span class="wizard-option-title">${rec.value}</span>
                    <span class="wizard-option-badge recommended">${t('wizardRecommended')}</span>
                </div>
                <span class="wizard-option-reason">${rec.reason}</span>
            </div>
        </button>`;

        // Alternative option (if exists)
        if (rec.alt_value) {
            html += `<button class="wizard-option" data-field="${field}" data-value="${rec.alt_value}" onclick="selectWizardOption(this)">
                <div class="wizard-option-radio"></div>
                <div class="wizard-option-content">
                    <div class="wizard-option-header">
                        <span class="wizard-option-title">${rec.alt_value}</span>
                        <span class="wizard-option-badge alternative">${t('wizardAlternative')}</span>
                    </div>
                    <span class="wizard-option-reason">${rec.alt_reason}</span>
                </div>
            </button>`;
        }

        html += '</div></div>';
    }

    body.innerHTML = html;
    footer.style.display = 'flex';
}

function selectWizardOption(btn) {
    const field = btn.dataset.field;
    const value = btn.dataset.value;
    wizardSelections[field] = value;

    // Toggle selected state within same wizard-item
    const parent = btn.closest('.wizard-item-options');
    parent.querySelectorAll('.wizard-option').forEach(opt => opt.classList.remove('selected'));
    btn.classList.add('selected');
}

function applyWizardSelections() {
    for (const [field, value] of Object.entries(wizardSelections)) {
        const radio = document.querySelector(`input[name="${field}"][value="${value}"]`);
        if (radio && !radio.disabled) {
            radio.checked = true;
        }
    }
    applyValidationRules();
    closeWizard();
    showToast(t('toastApplied'));

    // Scroll to tech section
    document.getElementById('tech-section').scrollIntoView({ behavior: 'smooth' });
}

function closeWizard() {
    document.getElementById('wizardOverlay').classList.remove('active');
}

// ===== Generate Prompt =====

async function generatePrompt() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKey'));
        return;
    }

    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showToast(t('toastNoProject'));
        return;
    }

    const projectDesc = document.getElementById('projectDesc').value.trim();
    if (!projectDesc) {
        showToast(t('toastNoDesc'));
        return;
    }

    const platform = getRadioValue('platform');
    const database = getRadioValue('database');
    const cssFramework = getRadioValue('cssFramework');
    const language = getRadioValue('language');
    const pageType = getRadioValue('pageType');
    const pwa = getRadioValue('pwa');
    const responsive = getRadioValue('responsive');
    const authentication = getRadioValue('authentication');
    const apiStyle = getRadioValue('apiStyle');
    const packageManager = getRadioValue('packageManager');
    const testing = getRadioValue('testing');
    const hosting = getRadioValue('hosting');
    const targetAI = getRadioValue('targetAI');
    const otherAiName = document.getElementById('otherAiName').value.trim();

    // Get selected skills
    const selectedSkills = [];
    document.querySelectorAll('input[name="skills"]:checked').forEach(cb => {
        const skill = SKILLS_CATALOG.find(s => s.name === cb.value);
        if (skill) selectedSkills.push(skill);
    });

    // Build AI target name
    const aiNames = {
        'claude': 'Claude (Anthropic Claude Code)',
        'gemini-cli': 'Gemini CLI (Google)',
        'cursor': 'Cursor AI Editor',
        'github-copilot': 'GitHub Copilot',
        'codex': 'OpenAI Codex CLI',
        'windsurf': 'Windsurf AI Editor',
        'other': otherAiName || 'AI Agent'
    };
    const aiName = aiNames[targetAI];

    // Build file name based on target AI
    const fileNames = {
        'claude': 'CLAUDE.md',
        'gemini-cli': 'GEMINI.md',
        'cursor': '.cursorrules',
        'github-copilot': '.github/copilot-instructions.md',
        'codex': 'AGENTS.md',
        'windsurf': '.windsurfrules',
        'other': 'AI_INSTRUCTIONS.md'
    };
    const fileName = fileNames[targetAI];

    const platformNames = {
        'google-apps-script': 'Google Apps Script (GAS)',
        'react-vercel': 'React + Vercel',
        'nextjs-vercel': 'Next.js + Vercel',
        'vue-netlify': 'Vue.js + Netlify',
        'static-html': 'Static HTML/JS'
    };
    const dbNames = {
        'google-sheets': 'Google Sheets',
        'supabase': 'Supabase (PostgreSQL)',
        'firebase-firestore': 'Firebase Firestore',
        'mongodb-atlas': 'MongoDB Atlas',
        'turso': 'Turso (SQLite Edge)'
    };
    const cssNames = {
        'bootstrap': 'Bootstrap',
        'tailwind': 'Tailwind CSS',
        'daisyui': 'DaisyUI (Tailwind)',
        'shadcn-ui': 'Shadcn/ui',
        'material-ui': 'Material UI'
    };
    const langNames = { 'javascript': 'JavaScript', 'typescript': 'TypeScript' };
    const pageNames = {
        'single-page': t('pageNameSingle'),
        'spa': t('pageNameSPA')
    };
    const authNames = {
        'none': t('authNameNone'),
        'firebase-auth': 'Firebase Auth',
        'supabase-auth': 'Supabase Auth',
        'clerk': 'Clerk'
    };
    const apiNames = { 'rest': 'REST API', 'graphql': 'GraphQL', 'trpc': 'tRPC' };
    const pkgNames = { 'none': t('pkgNameNone'), 'npm': 'npm', 'pnpm': 'pnpm', 'bun': 'Bun' };
    const testNames = { 'none': t('testNameNone'), 'vitest': 'Vitest', 'jest': 'Jest', 'playwright': 'Playwright' };
    const hostNames = {
        'gas-deploy': 'GAS Web App Deploy',
        'vercel': 'Vercel',
        'netlify': 'Netlify',
        'cloudflare-pages': 'Cloudflare Pages',
        'firebase-hosting': 'Firebase Hosting'
    };

    // Build context-aware notes based on combo selections
    const comboNotes = [];
    if (platform === 'google-apps-script' && pageType === 'spa') {
        comboNotes.push(`- **สำคัญ**: เนื่องจากใช้ GAS เป็น SPA ให้ใช้ Alpine.js สำหรับจัดการ client-side routing และ state management ภายใน HTML template ของ GAS
- โครงสร้าง: ใช้ไฟล์ HTML เดียวใน GAS แล้วใช้ Alpine.js x-show/x-if สลับหน้า
- ใช้ hash-based routing (window.location.hash) สำหรับการนำทางระหว่างหน้า
- โหลด Alpine.js ผ่าน CDN ใน <script> tag`);
    }
    if (platform === 'google-apps-script' && pwa === 'yes') {
        comboNotes.push(`- **หมายเหตุ PWA บน GAS**: ต้อง deploy GAS เป็น Web App แล้วใช้ Service Worker แยก, manifest.json จะต้อง serve จาก GAS endpoint`);
    }
    if (platform === 'react-vercel' && pageType === 'spa') {
        comboNotes.push(`- ใช้ React Router สำหรับ client-side routing
- ตั้งค่า vercel.json rewrites ให้ redirect ทุก path ไปที่ index.html`);
    }

    const comboNotesText = comboNotes.length > 0
        ? `\n## หมายเหตุเฉพาะสำหรับ Tech Stack ที่เลือก\n${comboNotes.join('\n')}\n`
        : '';

    // Build prompt for Gemini
    const skillsText = selectedSkills.length > 0
        ? selectedSkills.map(s => `- ${s.title} (${s.name}): ${s.description}`).join('\n')
        : 'ไม่มี skills เพิ่มเติม';

    const geminiPrompt = `คุณเป็นผู้เชี่ยวชาญในการสร้างไฟล์คำสั่งสำหรับ AI Coding Agent ต่างๆ

โปรดสร้างไฟล์ "${fileName}" สำหรับ ${aiName} เพื่อใช้ในการสร้างโปรเจกต์เว็บตามข้อมูลต่อไปนี้:

## ข้อมูลโปรเจกต์
- **ชื่อโปรเจกต์**: ${projectName}
- **คำอธิบาย**: ${projectDesc}

## Tech Stack ที่เลือก
- **แพลตฟอร์ม**: ${platformNames[platform]}
- **ฐานข้อมูล**: ${dbNames[database]}
- **CSS Framework**: ${cssNames[cssFramework]}
- **ภาษา**: ${langNames[language]}
- **รูปแบบหน้าเว็บ**: ${pageNames[pageType]}${platform === 'google-apps-script' && pageType === 'spa' ? ' (ใช้ Alpine.js สำหรับ routing/state)' : ''}
- **PWA**: ${pwa === 'yes' ? 'ต้องการ PWA (Progressive Web App)' : 'ไม่ต้องการ PWA'}
- **การแสดงผล**: ${responsive === 'responsive' ? 'Responsive (รองรับทุกขนาดหน้าจอ)' : 'Desktop Only'}
- **Authentication**: ${authNames[authentication]}
- **API Style**: ${apiNames[apiStyle]}
- **Package Manager**: ${pkgNames[packageManager]}
- **Testing**: ${testNames[testing]}
- **Hosting**: ${hostNames[hosting]}
${comboNotesText}
## Skills ที่เกี่ยวข้อง
${skillsText}

## คำแนะนำในการสร้างไฟล์
1. เขียนเป็น Markdown format
2. ระบุโครงสร้างโปรเจกต์ (project structure) ที่แนะนำ
3. ระบุ tech stack และ dependencies ที่ต้องใช้
4. ให้คำแนะนำเกี่ยวกับ coding standards และ conventions
5. ระบุขั้นตอนการ setup โปรเจกต์
6. ระบุ features หลักที่ต้องสร้างพร้อมรายละเอียด
7. ให้คำแนะนำเกี่ยวกับ deployment
8. ระบุ best practices สำหรับ tech stack ที่เลือก
${pwa === 'yes' ? '9. รวมคำแนะนำ PWA: service worker, manifest.json, offline support\n' : ''}${responsive === 'responsive' ? '10. รวมแนวทาง responsive design: breakpoints, mobile-first approach\n' : ''}
${targetAI === 'claude' ? '11. ใช้รูปแบบที่เหมาะกับ CLAUDE.md โดยเฉพาะ มี section สำหรับ project overview, development guidelines, และ key commands' : ''}
${targetAI === 'cursor' ? '11. ใช้รูปแบบ .cursorrules ที่เหมาะกับ Cursor AI' : ''}
${targetAI === 'github-copilot' ? '11. ใช้รูปแบบที่เหมาะกับ GitHub Copilot instructions' : ''}
${targetAI === 'codex' ? '11. ใช้รูปแบบ AGENTS.md ที่เหมาะกับ OpenAI Codex CLI' : ''}
${targetAI === 'windsurf' ? '11. ใช้รูปแบบ .windsurfrules ที่เหมาะกับ Windsurf AI Editor' : ''}

## สิ่งสำคัญ
- เขียนเป็นภาษาไทยปนอังกฤษ (ส่วนที่เป็น technical term ใช้ภาษาอังกฤษ)
- ให้ครอบคลุมและละเอียดพอที่ AI จะสามารถสร้างโปรเจกต์ได้ทั้งหมด
- รวม skills ที่ระบุไว้เป็นส่วนหนึ่งของคำสั่ง
- Output เป็น Markdown content เท่านั้น ไม่ต้องครอบด้วย code block

เริ่มเขียนไฟล์ "${fileName}" เลย:`;

    // Show result section
    const resultSection = document.getElementById('result-section');
    const resultLoading = document.getElementById('resultLoading');
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const generateBtn = document.getElementById('generateBtn');

    resultSection.style.display = 'block';
    resultLoading.style.display = 'flex';
    resultContent.style.display = 'none';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> ' + t('generating');

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const response = await callGeminiAPI(apiKey, geminiPrompt);

        resultLoading.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.textContent = response;

        // Show usage guide for the target AI
        renderUsageGuide(targetAI);

        // Store for download
        resultSection.dataset.content = response;
        resultSection.dataset.fileName = fileName;

    } catch (error) {
        resultLoading.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.textContent = `Error: ${error.message}\n\n${t('errorPrefix')}`;
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Prompt';
    }
}

// ===== Gemini API Call =====

async function callGeminiAPI(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error(t('noResultGemini'));
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error(t('emptyResult'));
    }

    return text;
}

// ===== Copy & Download =====

function copyResult() {
    const content = document.getElementById('result-section').dataset.content;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
        showToast(t('toastCopied'));
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(t('toastCopied'));
    });
}

function downloadResult() {
    const resultSection = document.getElementById('result-section');
    const content = resultSection.dataset.content;
    const fileName = resultSection.dataset.fileName || 'CLAUDE.md';
    if (!content) return;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(t('toastDownloaded', {fileName}));
}

// ===== Utilities =====

function getRadioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
}

function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Mode Switching =====

let currentMode = 'manual';

function switchMode(mode) {
    currentMode = mode;

    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Toggle manual sections
    const manualSections = document.querySelectorAll('.manual-section');
    manualSections.forEach(el => {
        el.style.display = mode === 'manual' ? '' : 'none';
    });

    // Toggle AI sections
    document.getElementById('chat-section').style.display = mode === 'ai-chat' ? '' : 'none';
    document.getElementById('wizard-section').style.display = mode === 'ai-wizard' ? '' : 'none';

    // Result section stays visible if it has content
    // Initialize chat on first open
    if (mode === 'ai-chat' && !chatInitialized) {
        initChat();
    }
}

// ===== AI Chat Mode =====

let chatInitialized = false;
let chatHistory = [];
let chatConversation = []; // For Gemini context
let chatPhase = 0; // 0=intro, 1=project, 2=features, 3=users, 4=constraints, 5=summary
let chatProjectData = {};

function initChat() {
    chatInitialized = true;
    chatHistory = [];
    chatConversation = [];
    chatPhase = 0;
    chatProjectData = {};

    const messagesEl = document.getElementById('chatMessages');
    messagesEl.innerHTML = '';

    addChatBubble('ai', t('chatGreeting'));
    addChatBubble('ai', t('chatStart'), [
        t('chatQuickStock'),
        t('chatQuickShop'),
        t('chatQuickDashboard'),
        t('chatQuickBooking')
    ]);

    enableChatInput();
}

function resetChat() {
    chatInitialized = false;
    initChat();
}

function enableChatInput() {
    document.getElementById('chatInput').disabled = false;
    document.getElementById('chatSendBtn').disabled = false;
    document.getElementById('chatInput').focus();
}

function disableChatInput() {
    document.getElementById('chatInput').disabled = true;
    document.getElementById('chatSendBtn').disabled = true;
}

function addChatBubble(type, text, quickReplies) {
    const messagesEl = document.getElementById('chatMessages');

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;

    if (type === 'ai') {
        bubble.innerHTML = `<div class="chat-sender">AI Assistant</div>${text}`;
    } else if (type === 'system') {
        bubble.textContent = text;
    } else {
        bubble.textContent = text;
    }

    messagesEl.appendChild(bubble);

    // Add quick replies
    if (quickReplies && quickReplies.length > 0) {
        const repliesDiv = document.createElement('div');
        repliesDiv.className = 'chat-quick-replies';
        quickReplies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'chat-quick-reply';
            btn.textContent = reply;
            btn.addEventListener('click', () => {
                document.getElementById('chatInput').value = reply;
                sendChatMessage();
                repliesDiv.remove();
            });
            repliesDiv.appendChild(btn);
        });
        messagesEl.appendChild(repliesDiv);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTypingIndicator() {
    const messagesEl = document.getElementById('chatMessages');
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chatTyping';
    typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKeyChat'));
        return;
    }

    // Remove any quick replies
    document.querySelectorAll('.chat-quick-replies').forEach(el => el.remove());

    addChatBubble('user', message);
    input.value = '';
    disableChatInput();
    showTypingIndicator();

    // Add to conversation history
    chatConversation.push({ role: 'user', parts: [{ text: message }] });

    try {
        const aiResponse = await processChatMessage(apiKey, message);
        removeTypingIndicator();

        if (aiResponse.message) {
            addChatBubble('ai', aiResponse.message, aiResponse.quickReplies);
        }
        if (aiResponse.system) {
            addChatBubble('system', aiResponse.system);
        }

        // Add AI response to conversation
        if (aiResponse.message) {
            chatConversation.push({ role: 'model', parts: [{ text: aiResponse.message }] });
        }

        if (!aiResponse.done) {
            enableChatInput();
        }
    } catch (err) {
        removeTypingIndicator();
        addChatBubble('ai', t('chatError', {error: err.message}));
        enableChatInput();
    }
}

async function processChatMessage(apiKey, userMessage) {
    chatPhase++;

    if (chatPhase === 1) {
        // User described their project - ask about features
        chatProjectData.description = userMessage;

        const prompt = `คุณเป็น AI ที่ช่วยวิเคราะห์โปรเจกต์เว็บ ผู้ใช้อธิบายโปรเจกต์ว่า: "${userMessage}"

ให้ถามคำถามต่อเกี่ยวกับฟีเจอร์หลักที่ต้องการ เช่น ระบบ login, CRUD, แดชบอร์ด, แจ้งเตือน, export ข้อมูล เป็นต้น
ตอบเป็นภาษาไทยสั้นๆ ไม่เกิน 3 ประโยค ถามเฉพาะเรื่องฟีเจอร์`;

        const response = await callGeminiAPI(apiKey, prompt);
        return { message: response, quickReplies: ['มีระบบ login, CRUD, แดชบอร์ด', 'เน้น CRUD อย่างเดียว', 'ครบทุกอย่าง login, CRUD, export, แจ้งเตือน'] };
    }

    if (chatPhase === 2) {
        // User described features - ask about users/scale
        chatProjectData.features = userMessage;

        const prompt = `คุณเป็น AI ที่ช่วยวิเคราะห์โปรเจกต์เว็บ
โปรเจกต์: ${chatProjectData.description}
ฟีเจอร์: ${userMessage}

ให้ถามคำถามเกี่ยวกับ:
- ใครเป็นผู้ใช้ (คนเดียว, ทีมเล็ก, องค์กร, สาธารณะ)
- ข้อมูลมากแค่ไหน
ตอบเป็นภาษาไทยสั้นๆ ไม่เกิน 2 ประโยค`;

        const response = await callGeminiAPI(apiKey, prompt);
        return { message: response, quickReplies: ['ใช้คนเดียว ข้อมูลไม่มาก', 'ทีมเล็ก 5-10 คน', 'หลายคนใช้พร้อมกัน ข้อมูลเยอะ'] };
    }

    if (chatPhase === 3) {
        // User described users - ask about constraints/preferences
        chatProjectData.users = userMessage;

        const prompt = `คุณเป็น AI ที่ช่วยวิเคราะห์โปรเจกต์เว็บ
โปรเจกต์: ${chatProjectData.description}
ฟีเจอร์: ${chatProjectData.features}
ผู้ใช้: ${userMessage}

ให้ถามคำถามสุดท้ายเกี่ยวกับ:
- มีข้อจำกัดหรือ preference อะไรไหม (ฟรี, ง่าย, ใช้ Google, ต้องรัน offline)
- จะใช้ AI ตัวไหนสั่งงาน (Claude, Cursor, Gemini CLI ฯลฯ)
ตอบเป็นภาษาไทยสั้นๆ ไม่เกิน 2 ประโยค`;

        const response = await callGeminiAPI(apiKey, prompt);
        return { message: response, quickReplies: ['อยากใช้ฟรี ง่ายที่สุด ใช้ Claude', 'ใช้ฟรี อยู่บน Google ใช้ Claude', 'ไม่จำกัด budget ใช้ Cursor'] };
    }

    if (chatPhase === 4) {
        // Final - AI analyzes everything and generates prompt
        chatProjectData.constraints = userMessage;

        addChatBubble('system', t('chatAnalyzing'));

        const analysisPrompt = `คุณเป็นผู้เชี่ยวชาญด้าน web development ช่วยวิเคราะห์โปรเจกต์นี้:

โปรเจกต์: ${chatProjectData.description}
ฟีเจอร์ที่ต้องการ: ${chatProjectData.features}
ผู้ใช้/ขนาด: ${chatProjectData.users}
ข้อจำกัด/preference: ${chatProjectData.constraints}

ให้วิเคราะห์และตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):
{
  "projectName": "ชื่อโปรเจกต์ที่เหมาะ",
  "summary": "สรุปวิเคราะห์ 2-3 ประโยค ว่าทำไมเลือก stack นี้",
  "features": ["ฟีเจอร์ 1", "ฟีเจอร์ 2"],
  "techStack": {
    "platform": "google-apps-script | react-vercel | nextjs-vercel | vue-netlify | static-html",
    "database": "google-sheets | supabase | firebase-firestore | mongodb-atlas | turso",
    "cssFramework": "bootstrap | tailwind | daisyui | shadcn-ui | material-ui",
    "language": "javascript | typescript",
    "pageType": "single-page | spa",
    "pwa": "yes | no",
    "responsive": "responsive | desktop-only",
    "authentication": "none | firebase-auth | supabase-auth | clerk",
    "apiStyle": "rest | graphql | trpc",
    "packageManager": "none | npm | pnpm | bun",
    "testing": "none | vitest | jest | playwright",
    "hosting": "gas-deploy | vercel | netlify | cloudflare-pages | firebase-hosting"
  },
  "targetAI": "claude | gemini-cli | cursor | github-copilot | codex",
  "reasoning": {
    "platform": "เหตุผล",
    "database": "เหตุผล"
  }
}`;

        const raw = await callGeminiAPI(apiKey, analysisPrompt);
        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const analysis = JSON.parse(jsonStr);

        chatProjectData.analysis = analysis;

        // Show analysis
        let summaryHtml = `<strong>${analysis.projectName}</strong><br><br>${analysis.summary}<br><br>`;
        summaryHtml += `<strong>${t('chatTechRecommended')}</strong><br>`;

        const labelMap = getWizardLabels();

        for (const [key, val] of Object.entries(analysis.techStack)) {
            const label = labelMap[key] || key;
            const reason = analysis.reasoning?.[key] || '';
            summaryHtml += `• <strong>${label}:</strong> ${val}${reason ? ` <em>(${reason})</em>` : ''}<br>`;
        }

        addChatBubble('ai', summaryHtml);
        addChatBubble('ai', t('chatConfirm'), [t('chatQuickOK'), t('chatQuickPlatform'), t('chatQuickDB')]);

        enableChatInput();
        chatPhase = 5; // Wait for confirmation
        return { done: false };
    }

    if (chatPhase >= 5) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('ตกลง') || lower.includes('generate') || lower.includes('ok') || lower.includes('โอเค') || lower.includes('เลย')) {
            // Generate the prompt
            addChatBubble('system', t('chatGenerating'));
            await generateFromChatData(apiKey);
            return { done: true };
        } else {
            // User wants to adjust - send to Gemini for adjustment
            const adjustPrompt = `ผู้ใช้ต้องการปรับ tech stack:
ข้อมูลปัจจุบัน: ${JSON.stringify(chatProjectData.analysis.techStack)}
คำขอปรับ: ${userMessage}

ตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):
{"adjusted": {เฉพาะ field ที่เปลี่ยน}, "message": "อธิบายสิ่งที่เปลี่ยนสั้นๆ ภาษาไทย"}`;

            const raw = await callGeminiAPI(apiKey, adjustPrompt);
            const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const adj = JSON.parse(jsonStr);

            // Apply adjustments
            Object.assign(chatProjectData.analysis.techStack, adj.adjusted);

            return {
                message: `${adj.message}<br><br>ต้องการปรับอะไรเพิ่มไหม? ถ้าโอเคแล้วพิมพ์ "ตกลง" ครับ`,
                quickReplies: ['ตกลง generate เลย', 'ปรับอีก']
            };
        }
    }

    return { message: 'เกิดข้อผิดพลาด ลองเริ่มใหม่ครับ' };
}

async function generateFromChatData(apiKey) {
    const analysis = chatProjectData.analysis;
    const ts = analysis.techStack;
    const targetAI = analysis.targetAI || 'claude';

    // Set form values to match analysis (so generatePrompt works)
    setRadioIfExists('platform', ts.platform);
    setRadioIfExists('database', ts.database);
    setRadioIfExists('cssFramework', ts.cssFramework);
    setRadioIfExists('language', ts.language);
    setRadioIfExists('pageType', ts.pageType);
    setRadioIfExists('pwa', ts.pwa);
    setRadioIfExists('responsive', ts.responsive);
    setRadioIfExists('authentication', ts.authentication);
    setRadioIfExists('apiStyle', ts.apiStyle);
    setRadioIfExists('packageManager', ts.packageManager);
    setRadioIfExists('testing', ts.testing);
    setRadioIfExists('hosting', ts.hosting);
    setRadioIfExists('targetAI', targetAI);

    // Set project info
    document.getElementById('projectName').value = analysis.projectName || chatProjectData.description;
    document.getElementById('projectDesc').value = `${chatProjectData.description}\n\nฟีเจอร์: ${chatProjectData.features}\nผู้ใช้: ${chatProjectData.users}\nข้อจำกัด: ${chatProjectData.constraints}`;

    // Trigger generate
    await generatePrompt();

    addChatBubble('system', t('chatGenerated'));
}

function setRadioIfExists(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
}

// ===== AI Wizard Mode =====

let wizardData = {};

async function startWizardAnalysis() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKeyWiz'));
        return;
    }

    const name = document.getElementById('wizProjectName').value.trim();
    const desc = document.getElementById('wizProjectDesc').value.trim();
    const targetAI = document.getElementById('wizTargetAI').value;

    if (!name || !desc) {
        showToast(t('toastNoProjectWiz'));
        return;
    }

    wizardData = { name, desc, targetAI };

    // Mark step 1 as completed, activate step 2
    document.getElementById('wizStep1').className = 'wizard-step completed';
    document.getElementById('wizStep2').className = 'wizard-step active';
    document.getElementById('wizAnalysisLoading').style.display = 'flex';
    document.getElementById('wizAnalysisContent').innerHTML = '';

    // Step 2: Analyze requirements
    const analysisPrompt = `คุณเป็นนักวิเคราะห์ระบบ (Business Analyst / System Analyst) ที่เก่งมาก
วิเคราะห์โปรเจกต์เว็บนี้แล้วตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):

ชื่อ: ${name}
คำอธิบาย: ${desc}

{
  "summary": "สรุปโปรเจกต์ 2-3 ประโยค",
  "features": [
    {"name": "ชื่อฟีเจอร์", "description": "อธิบายสั้นๆ", "priority": "high|medium|low"}
  ],
  "userTypes": [
    {"name": "ประเภทผู้ใช้", "description": "อธิบาย"}
  ],
  "dataModels": [
    {"name": "ชื่อ model/ตาราง", "fields": ["field1", "field2"]}
  ],
  "nonFunctional": ["ความต้องการที่ไม่ใช่ฟีเจอร์ เช่น performance, security"],
  "estimatedComplexity": "simple|moderate|complex",
  "risks": ["ความเสี่ยงที่ต้องระวัง"]
}`;

    try {
        const raw = await callGeminiAPI(apiKey, analysisPrompt);
        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const analysis = JSON.parse(jsonStr);
        wizardData.analysis = analysis;

        document.getElementById('wizAnalysisLoading').style.display = 'none';
        renderWizardAnalysis(analysis);

        // Auto-proceed to step 3
        setTimeout(() => startWizardTechRecommendation(apiKey), 500);
    } catch (err) {
        document.getElementById('wizAnalysisLoading').style.display = 'none';
        document.getElementById('wizAnalysisContent').innerHTML = `<div class="wizard-error"><i class="bi bi-exclamation-triangle"></i><p>${err.message}</p></div>`;
    }
}

function renderWizardAnalysis(analysis) {
    let html = `<div class="wiz-summary-box">${analysis.summary}</div>`;

    // Features
    html += `<div class="wiz-analysis-card"><h4><i class="bi bi-puzzle"></i> ${t('wizFeatures')}</h4><ul>`;
    analysis.features.forEach(f => {
        const badge = f.priority === 'high' ? '🔴' : f.priority === 'medium' ? '🟡' : '🟢';
        html += `<li>${badge} <strong>${f.name}</strong> - ${f.description}</li>`;
    });
    html += `</ul></div>`;

    // User types
    if (analysis.userTypes && analysis.userTypes.length > 0) {
        html += `<div class="wiz-analysis-card"><h4><i class="bi bi-people"></i> ${t('wizUserTypes')}</h4><ul>`;
        analysis.userTypes.forEach(u => {
            html += `<li><strong>${u.name}</strong> - ${u.description}</li>`;
        });
        html += `</ul></div>`;
    }

    // Data models
    if (analysis.dataModels && analysis.dataModels.length > 0) {
        html += `<div class="wiz-analysis-card"><h4><i class="bi bi-database"></i> Data Models</h4><ul>`;
        analysis.dataModels.forEach(m => {
            html += `<li><strong>${m.name}</strong>: ${m.fields.join(', ')}</li>`;
        });
        html += `</ul></div>`;
    }

    // Complexity & Risks
    const complexityLabel = { simple: t('wizComplexitySimple'), moderate: t('wizComplexityModerate'), complex: t('wizComplexityComplex') };
    html += `<div class="wiz-analysis-card"><h4><i class="bi bi-speedometer2"></i> ความซับซ้อน: ${complexityLabel[analysis.estimatedComplexity] || analysis.estimatedComplexity}</h4>`;
    if (analysis.risks && analysis.risks.length > 0) {
        html += `<ul>`;
        analysis.risks.forEach(r => { html += `<li>${r}</li>`; });
        html += `</ul>`;
    }
    html += `</div>`;

    document.getElementById('wizAnalysisContent').innerHTML = html;
}

async function startWizardTechRecommendation(apiKey) {
    document.getElementById('wizStep2').className = 'wizard-step completed';
    document.getElementById('wizStep3').className = 'wizard-step active';
    document.getElementById('wizTechLoading').style.display = 'flex';
    document.getElementById('wizTechContent').innerHTML = '';

    const analysis = wizardData.analysis;

    const techPrompt = `คุณเป็นผู้เชี่ยวชาญด้าน web development tech stack
จากการวิเคราะห์โปรเจกต์นี้:

ชื่อ: ${wizardData.name}
คำอธิบาย: ${wizardData.desc}
ฟีเจอร์: ${analysis.features.map(f => f.name).join(', ')}
ความซับซ้อน: ${analysis.estimatedComplexity}
ผู้ใช้: ${analysis.userTypes.map(u => u.name).join(', ')}

แนะนำ tech stack ที่เหมาะสม ตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):
{
  "summary": "สรุปว่าทำไมถึงแนะนำ stack นี้ 2-3 ประโยค",
  "techStack": {
    "platform": {"value": "...", "reason": "..."},
    "database": {"value": "...", "reason": "..."},
    "cssFramework": {"value": "...", "reason": "..."},
    "language": {"value": "...", "reason": "..."},
    "pageType": {"value": "...", "reason": "..."},
    "pwa": {"value": "...", "reason": "..."},
    "responsive": {"value": "...", "reason": "..."},
    "authentication": {"value": "...", "reason": "..."},
    "apiStyle": {"value": "...", "reason": "..."},
    "packageManager": {"value": "...", "reason": "..."},
    "testing": {"value": "...", "reason": "..."},
    "hosting": {"value": "...", "reason": "..."}
  }
}

ค่า value ที่ใช้ได้:
- platform: google-apps-script, react-vercel, nextjs-vercel, vue-netlify, static-html
- database: google-sheets, supabase, firebase-firestore, mongodb-atlas, turso
- cssFramework: bootstrap, tailwind, daisyui, shadcn-ui, material-ui
- language: javascript, typescript
- pageType: single-page, spa
- pwa: yes, no
- responsive: responsive, desktop-only
- authentication: none, firebase-auth, supabase-auth, clerk
- apiStyle: rest, graphql, trpc
- packageManager: none, npm, pnpm, bun
- testing: none, vitest, jest, playwright
- hosting: gas-deploy, vercel, netlify, cloudflare-pages, firebase-hosting`;

    try {
        const raw = await callGeminiAPI(apiKey, techPrompt);
        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const techData = JSON.parse(jsonStr);
        wizardData.techRecommendation = techData;

        document.getElementById('wizTechLoading').style.display = 'none';
        renderWizardTech(techData);

        // Activate step 4
        document.getElementById('wizStep3').className = 'wizard-step completed';
        document.getElementById('wizStep4').className = 'wizard-step active';
        document.getElementById('wizGenerateBody').style.display = 'block';
        renderWizardFinalSummary();
    } catch (err) {
        document.getElementById('wizTechLoading').style.display = 'none';
        document.getElementById('wizTechContent').innerHTML = `<div class="wizard-error"><i class="bi bi-exclamation-triangle"></i><p>${err.message}</p></div>`;
    }
}

function renderWizardTech(techData) {
    const labelMap = getWizardLabels();

    let html = `<div class="wiz-summary-box">${techData.summary}</div>`;

    for (const [key, rec] of Object.entries(techData.techStack)) {
        html += `<div class="wiz-tech-item">
            <div class="wiz-tech-label">${labelMap[key] || key}</div>
            <div>
                <div class="wiz-tech-value">${rec.value}</div>
                <div class="wiz-tech-reason">${rec.reason}</div>
            </div>
        </div>`;
    }

    document.getElementById('wizTechContent').innerHTML = html;
}

function renderWizardFinalSummary() {
    const analysis = wizardData.analysis;
    const tech = wizardData.techRecommendation;

    let html = `<strong>${wizardData.name}</strong><br>`;
    html += `${analysis.summary}<br><br>`;
    html += `<strong>ฟีเจอร์:</strong> ${analysis.features.map(f => f.name).join(', ')}<br>`;
    html += `<strong>Tech Stack:</strong> ${tech.techStack.platform.value} + ${tech.techStack.database.value} + ${tech.techStack.cssFramework.value}<br>`;
    html += `<strong>Target AI:</strong> ${wizardData.targetAI}`;

    document.getElementById('wizFinalSummary').innerHTML = html;
}

async function wizardGenerate() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKey'));
        return;
    }

    const tech = wizardData.techRecommendation.techStack;

    // Set form values
    for (const [key, rec] of Object.entries(tech)) {
        setRadioIfExists(key, rec.value);
    }
    setRadioIfExists('targetAI', wizardData.targetAI);

    // Set project info
    document.getElementById('projectName').value = wizardData.name;

    const analysis = wizardData.analysis;
    let richDesc = wizardData.desc;
    richDesc += `\n\n## ฟีเจอร์ที่วิเคราะห์ได้:\n`;
    analysis.features.forEach(f => {
        richDesc += `- ${f.name} (${f.priority}): ${f.description}\n`;
    });
    if (analysis.userTypes) {
        richDesc += `\n## ผู้ใช้งาน:\n`;
        analysis.userTypes.forEach(u => {
            richDesc += `- ${u.name}: ${u.description}\n`;
        });
    }
    if (analysis.dataModels) {
        richDesc += `\n## Data Models:\n`;
        analysis.dataModels.forEach(m => {
            richDesc += `- ${m.name}: ${m.fields.join(', ')}\n`;
        });
    }

    document.getElementById('projectDesc').value = richDesc;

    // Make manual sections visible briefly for generatePrompt to work
    await generatePrompt();

    showToast(t('toastGenerated'));
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
}
