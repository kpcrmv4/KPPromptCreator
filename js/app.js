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
        techStack: { platform: 'google-apps-script', database: 'google-sheets', cssFramework: 'bootstrap', language: 'javascript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'none', apiStyle: 'rest', packageManager: 'none', testing: 'none', hosting: 'gas-deploy' },
        gasMode: { gasGuideMode: 'beginner', gasUiStyle: 'dashboard', gasNotifyChannel: 'telegram-bot', gasWorkflowSwal: true }
    },
    govDocsPdf: {
        name: { th: 'ระบบฟอร์มราชการ + PDF', en: 'Government Form + PDF System' },
        desc: { th: 'ระบบกรอกข้อมูลแบบฟอร์มราชการ เก็บข้อมูลลง Google Sheets ใช้ Google Docs template แทนค่า placeholder แล้ว export เป็น PDF บันทึกลง Google Drive พร้อมแชร์เอกสารให้ผู้เกี่ยวข้อง', en: 'A government-style form workflow using Google Sheets, Google Docs templates, placeholder replacement, PDF export, Drive storage, and file sharing.' },
        techStack: { platform: 'google-apps-script', database: 'google-sheets', cssFramework: 'bootstrap', language: 'javascript', pageType: 'single-page', pwa: 'no', responsive: 'responsive', authentication: 'none', apiStyle: 'rest', packageManager: 'none', testing: 'none', hosting: 'gas-deploy' },
        gasMode: { gasGuideMode: 'beginner', gasUiStyle: 'formal', gasNotifyChannel: 'telegram-bot', gasWorkflowPdf: true, gasWorkflowDrive: true, gasWorkflowSwal: true }
    },
    approvalFlow: {
        name: { th: 'ระบบอนุมัติเอกสาร', en: 'Document Approval Flow' },
        desc: { th: 'ระบบยื่นคำขอ อนุมัติหลายขั้นตอน มีสถานะเอกสาร ประวัติการอนุมัติ สร้าง PDF จาก Google Docs และแจ้งเตือนผู้อนุมัติเมื่อมีงานค้าง', en: 'A multi-step approval system with request status, approval history, Google Docs to PDF generation, and notifications for pending approvals.' },
        techStack: { platform: 'google-apps-script', database: 'google-sheets', cssFramework: 'bootstrap', language: 'javascript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'google-sheets-auth', apiStyle: 'rest', packageManager: 'none', testing: 'none', hosting: 'gas-deploy' },
        gasMode: { gasGuideMode: 'balanced', gasUiStyle: 'formal', gasNotifyChannel: 'line-messaging-api', gasWorkflowPdf: true, gasWorkflowDrive: true, gasWorkflowSwal: true }
    },
    driveCenter: {
        name: { th: 'ศูนย์จัดการไฟล์ Drive', en: 'Drive File Center' },
        desc: { th: 'ระบบจัดการไฟล์บน Google Drive อัปโหลด แบ่งหมวดหมู่ ค้นหา แชร์ไฟล์ ตั้งสิทธิ์ และติดตามประวัติการใช้งาน พร้อมแจ้งเตือนเมื่อมีการส่งไฟล์ใหม่', en: 'A Google Drive file management system with categorization, search, sharing, permissions, activity tracking, and file notifications.' },
        techStack: { platform: 'google-apps-script', database: 'google-sheets', cssFramework: 'tailwind', language: 'javascript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'google-sheets-auth', apiStyle: 'rest', packageManager: 'none', testing: 'none', hosting: 'gas-deploy' },
        gasMode: { gasGuideMode: 'balanced', gasUiStyle: 'dashboard', gasNotifyChannel: 'telegram-bot', gasWorkflowDrive: true, gasWorkflowBottomNav: true, gasWorkflowSwal: true }
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
        techStack: { platform: 'react-vercel', database: 'supabase', cssFramework: 'tailwind', language: 'typescript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'supabase-auth', apiStyle: 'rest', packageManager: 'npm', testing: 'vitest', hosting: 'vercel' }
    },
    blog: {
        name: { th: 'เว็บบล็อก', en: 'Blog Website' },
        desc: { th: 'เว็บบล็อก/CMS มีระบบเขียนบทความพร้อม rich text editor, จัดหมวดหมู่/แท็ก, ค้นหาบทความ, ระบบ comment, admin จัดการบทความ, SEO friendly', en: 'Blog/CMS with rich text editor, categories/tags, article search, comment system, admin article management, SEO friendly' },
        techStack: { platform: 'nextjs-vercel', database: 'supabase', cssFramework: 'daisyui', language: 'typescript', pageType: 'spa', pwa: 'no', responsive: 'responsive', authentication: 'supabase-auth', apiStyle: 'rest', packageManager: 'pnpm', testing: 'jest', hosting: 'vercel' }
    }
};

let CURRENT_SKILL_INDEX = {};

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

    if (tpl.gasMode) {
        Object.entries(tpl.gasMode).forEach(([name, value]) => {
            if (typeof value === 'boolean') {
                const checkbox = document.getElementById(name);
                if (checkbox) checkbox.checked = value;
                return;
            }
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
        });
    }

    // Highlight active template
    document.querySelectorAll('.template-card').forEach(card => card.classList.remove('active'));
    const activeCard = document.querySelector(`.template-card[data-template="${templateId}"]`);
    if (activeCard) activeCard.classList.add('active');

    // Show "เลือกจาก Template" button on project section
    const showTplBtn = document.getElementById('showTemplateBtn');
    if (showTplBtn) showTplBtn.style.display = '';

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

    // "เลือกจาก Template" button — scroll back to template section
    const showTemplateBtn = document.getElementById('showTemplateBtn');
    if (showTemplateBtn) {
        showTemplateBtn.addEventListener('click', () => {
            document.getElementById('template-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // GAS Wizard template picker toggle
    const gasWizTemplateToggle = document.getElementById('gasWizTemplateToggle');
    const gasWizTemplatePicker = document.getElementById('gasWizTemplatePicker');
    if (gasWizTemplateToggle && gasWizTemplatePicker) {
        gasWizTemplateToggle.addEventListener('click', () => {
            const isHidden = gasWizTemplatePicker.style.display === 'none';
            gasWizTemplatePicker.style.display = isHidden ? '' : 'none';
            gasWizTemplateToggle.classList.toggle('active', isHidden);
        });

        // GAS template card clicks
        document.querySelectorAll('[data-gas-template]').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.gasTemplate;
                const tpl = PROJECT_TEMPLATES[templateId];
                if (!tpl) return;
                const lang = currentLang || 'th';

                // Fill GAS wizard fields
                document.getElementById('gasWizProjectName').value = tpl.name[lang] || tpl.name.th;
                document.getElementById('gasWizProjectDesc').value = tpl.desc[lang] || tpl.desc.th;

                // Apply gasMode settings if available
                if (tpl.gasMode) {
                    Object.entries(tpl.gasMode).forEach(([name, value]) => {
                        if (typeof value === 'boolean') {
                            const checkbox = document.getElementById(name);
                            if (checkbox) checkbox.checked = value;
                        } else {
                            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
                            if (radio) radio.checked = true;
                        }
                    });
                }

                // Highlight active
                document.querySelectorAll('[data-gas-template]').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Collapse picker and scroll to step 1
                gasWizTemplatePicker.style.display = 'none';
                gasWizTemplateToggle.classList.remove('active');

                showToast(t('tplApplied', { name: tpl.name[lang] || tpl.name.th }));
            });
        });
    }

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

    // API Key security info
    document.getElementById('apiKeySecurityBtn').addEventListener('click', () => {
        kpConfirm(t('apiKeySecurityInfo'), { icon: 'shield-lock-fill', type: 'info', confirmText: t('apiKeySecurityOk') });
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
    if (typeof initGasModeControls === 'function') {
        initGasModeControls();
    }

    // Fetch skills button
    document.getElementById('fetchSkillsBtn').addEventListener('click', fetchSkills);

    // Google Web App Wizard mode
    document.getElementById('gasWizAnalyzeBtn').addEventListener('click', startGasWizardAnalysis);
    document.getElementById('gasWizGenerateBtn').addEventListener('click', gasWizardGenerate);
    initGasWizConsultChat();

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generatePrompt);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetForm);

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', copyResult);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);

    // Mode selector (skip GAS wizard button — it opens modal, not switches mode)
    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
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
            allowed: ['google-sheets', 'supabase'],
            blocked: ['mongodb-atlas', 'turso'],
            reason: t('reasonGASDB')
        },
        'static-html': {
            allowed: ['google-sheets', 'supabase'],
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
            allowed: ['none', 'google-sheets-auth', 'supabase-auth'],
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
            blocked: ['vercel', 'netlify', 'cloudflare-pages'],
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
    Object.keys(COMPAT_RULES).forEach((fieldName) => applyRule(fieldName, platform));
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

    if (needSwitch) {
        showWarning(fieldName, rule.reason);
    } else {
        removeWarning(fieldName);
    }
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
        description: 'Google Apps Script patterns for Sheets, Docs, Drive, HtmlService web apps, and lightweight multi-view UIs.',
        installs: '15K+',
        tags: ['gas', 'google', 'sheets', 'automation', 'htmlservice', 'drive', 'docs', 'alpine', 'multi-view']
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

// Build search keywords from current tech stack selections
function buildSkillSearchQueries() {
    const platform = getRadioValue('platform');
    const database = getRadioValue('database');
    const cssFramework = getRadioValue('cssFramework');
    const pageType = getRadioValue('pageType');
    const pwa = getRadioValue('pwa');
    const authentication = getRadioValue('authentication');
    const testing = getRadioValue('testing');
    const hosting = getRadioValue('hosting');

    const queries = [];
    const isGasMultiView = platform === 'google-apps-script' && pageType === 'spa';

    // Platform-specific
    const platformQueries = {
        'google-apps-script': 'google apps script',
        'react-vercel': 'react',
        'nextjs-vercel': 'nextjs',
        'vue-netlify': 'vue',
        'static-html': 'html css'
    };
    if (platformQueries[platform]) queries.push(platformQueries[platform]);

    // Database-specific
    const dbQueries = {
        'google-sheets': 'google sheets',
        'supabase': 'supabase',
        'mongodb-atlas': 'mongodb',
        'turso': 'sqlite'
    };
    if (dbQueries[database]) queries.push(dbQueries[database]);

    // CSS-specific
    const cssQueries = {
        'bootstrap': 'bootstrap',
        'tailwind': 'tailwind',
        'daisyui': 'tailwind daisyui',
        'shadcn-ui': 'shadcn',
        'material-ui': 'material ui'
    };
    if (cssQueries[cssFramework]) queries.push(cssQueries[cssFramework]);

    // Other features
    if (pageType === 'spa') {
        if (isGasMultiView) {
            queries.push('alpine js htmlservice');
            queries.push('google apps script multi view');
        } else {
            queries.push('spa routing');
        }
    }
    if (pwa === 'yes') queries.push('pwa');
    if (authentication && authentication !== 'none') queries.push(authentication.replace(/-/g, ' '));
    if (testing && testing !== 'none') queries.push(testing);
    if (hosting) {
        const hostQueries = { 'vercel': 'vercel', 'netlify': 'netlify', 'cloudflare-pages': 'cloudflare' };
        if (hostQueries[hosting]) queries.push(hostQueries[hosting]);
    }

    // Always include general web dev
    queries.push(platform === 'google-apps-script' ? 'google apps script ui' : 'frontend design');

    return [...new Set(queries)]; // deduplicate
}

function rememberRenderedSkills(skills) {
    CURRENT_SKILL_INDEX = {};
    skills.forEach((skill) => {
        if (!skill?.name) return;
        CURRENT_SKILL_INDEX[skill.name] = {
            name: skill.name,
            title: skill.title || skill.name,
            description: skill.description || '',
            installs: skill.installs || 'N/A'
        };
    });
}

// Fetch skills from skills.sh API, fallback to hardcoded catalog
async function fetchSkills() {
    const loadingEl = document.getElementById('skillsLoading');
    const listEl = document.getElementById('skillsList');

    loadingEl.style.display = 'flex';
    listEl.innerHTML = '';

    const queries = buildSkillSearchQueries();
    let allSkills = [];

    try {
        // Search skills.sh with multiple queries in parallel
        const searchPromises = queries.slice(0, 5).map(q =>
            fetch(`/api/skills/search?q=${encodeURIComponent(q)}&limit=5`)
                .then(r => r.ok ? r.json() : { skills: [] })
                .catch(() => ({ skills: [] }))
        );

        const results = await Promise.all(searchPromises);

        // Merge and deduplicate results
        const seen = new Set();
        for (const result of results) {
            const skills = result.skills || result || [];
            if (Array.isArray(skills)) {
                for (const skill of skills) {
                    const id = skill.id || skill.slug || skill.name;
                    if (id && !seen.has(id)) {
                        seen.add(id);
                        allSkills.push({
                            name: skill.source || id,
                            title: skill.name || id,
                            description: skill.description || '',
                            installs: skill.installs ? `${skill.installs.toLocaleString()}` : 'N/A',
                            fromAPI: true
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.warn('skills.sh API failed, using fallback catalog:', err.message);
    }

    // Fallback: if API returned nothing, use hardcoded catalog
    if (allSkills.length === 0) {
        allSkills = getLocalSkillsFallback();
    }

    loadingEl.style.display = 'none';

    if (allSkills.length === 0) {
        listEl.innerHTML = '<p class="form-hint">' + t('skillsEmpty') + '</p>';
        return;
    }

    // Show up to 10 skills
    const displaySkills = allSkills.slice(0, 10);
    rememberRenderedSkills(displaySkills);
    displaySkills.forEach((skill, index) => {
        const checked = index < 5 ? 'checked' : ''; // Auto-check top 5
        const badge = skill.fromAPI
            ? '<span class="skill-badge-live">skills.sh</span>'
            : '<span class="skill-badge-local">built-in</span>';
        const html = `
            <label class="skill-item">
                <input type="checkbox" name="skills" value="${skill.name}" ${checked}>
                <div class="skill-info">
                    <span class="skill-name">${skill.title} ${badge}</span>
                    <span class="skill-desc">${skill.description}</span>
                    <span class="skill-meta"><code>${skill.name}</code> &middot; ${skill.installs} installs</span>
                </div>
            </label>
        `;
        listEl.innerHTML += html;
    });
}

// Fallback: score hardcoded skills by relevance (original logic)
function getLocalSkillsFallback() {
    const projectDesc = document.getElementById('projectDesc').value.toLowerCase();
    const platform = getRadioValue('platform');
    const database = getRadioValue('database');
    const cssFramework = getRadioValue('cssFramework');
    const pageType = getRadioValue('pageType');
    const pwa = getRadioValue('pwa');
    const responsive = getRadioValue('responsive');
    const isGasMultiView = platform === 'google-apps-script' && pageType === 'spa';

    const relevantTags = new Set(['web', 'frontend', 'ui', 'css', 'design']);

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
        if (isGasMultiView) {
            relevantTags.add('alpine');
            relevantTags.add('htmlservice');
            relevantTags.add('multi-view');
        } else {
            relevantTags.add('spa');
            relevantTags.add('routing');
        }
    }
    if (pwa === 'yes') { relevantTags.add('pwa'); relevantTags.add('service-worker'); }
    if (responsive === 'responsive') { relevantTags.add('responsive'); relevantTags.add('mobile'); }

    const scoredSkills = SKILLS_CATALOG.map(skill => {
        let score = 0;
        for (const tag of skill.tags) {
            if (relevantTags.has(tag)) score += 2;
        }
        if (projectDesc) {
            const words = projectDesc.split(/\s+/);
            for (const word of words) {
                if (word.length > 2 && skill.description.toLowerCase().includes(word)) {
                    score += 1;
                }
            }
        }
        if (platform === 'google-apps-script' && skill.name === 'alirezarezvani/claude-skills/google-apps-script') {
            score += 6;
        }
        if (isGasMultiView && skill.name === 'alirezarezvani/claude-skills/spa-routing') {
            score -= 4;
        }
        return { ...skill, score };
    });

    scoredSkills.sort((a, b) => b.score - a.score);
    return scoredSkills.filter(s => s.score > 0).slice(0, 8);
}

// ===== Auto-select Skills (for AI Chat & Wizard) =====

async function autoSelectSkills() {
    const queries = buildSkillSearchQueries();
    let allSkills = [];

    // Try skills.sh API first
    try {
        const searchPromises = queries.slice(0, 4).map(q =>
            fetch(`/api/skills/search?q=${encodeURIComponent(q)}&limit=3`)
                .then(r => r.ok ? r.json() : { skills: [] })
                .catch(() => ({ skills: [] }))
        );

        const results = await Promise.all(searchPromises);
        const seen = new Set();
        for (const result of results) {
            const skills = result.skills || result || [];
            if (Array.isArray(skills)) {
                for (const skill of skills) {
                    const id = skill.id || skill.slug || skill.name;
                    if (id && !seen.has(id)) {
                        seen.add(id);
                        allSkills.push({
                            name: skill.source || id,
                            title: skill.name || id,
                            description: skill.description || '',
                            installs: skill.installs ? `${skill.installs.toLocaleString()}` : 'N/A'
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.warn('autoSelectSkills: API failed, using fallback');
    }

    // Fallback to hardcoded catalog
    if (allSkills.length === 0) {
        allSkills = getLocalSkillsFallback();
    }

    const topSkills = allSkills.slice(0, 8);
    rememberRenderedSkills(topSkills);

    // Inject checked checkboxes so generatePrompt() can read them
    const listEl = document.getElementById('skillsList');
    listEl.innerHTML = '';
    topSkills.forEach(skill => {
        listEl.innerHTML += `
            <label class="skill-item">
                <input type="checkbox" name="skills" value="${skill.name}" checked>
                <div class="skill-info">
                    <span class="skill-name">${skill.title}</span>
                    <span class="skill-desc">${skill.description}</span>
                    <span class="skill-meta"><code>${skill.name}</code></span>
                </div>
            </label>
        `;
    });

    return topSkills;
}

// ===== Tech Label Helpers (used by AI Chat + AI Wizard) =====

function getWizardLabels() {
    return {
        platform: t('wlPlatform'), database: t('wlDatabase'), cssFramework: t('wlCSSFramework'),
        language: t('wlLanguage'), pageType: t('wlPageType'), pwa: t('wlPWA'),
        responsive: t('wlResponsive'), authentication: t('wlAuthentication'), apiStyle: t('wlAPIStyle'),
        packageManager: t('wlPackageManager'), testing: t('wlTesting'), hosting: t('wlHosting')
    };
}

// ===== Google Web App Wizard Mode =====

let gasWizData = {};

async function startGasWizardAnalysis() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKeyWiz'));
        return;
    }

    const name = document.getElementById('gasWizProjectName').value.trim();
    const desc = document.getElementById('gasWizProjectDesc').value.trim();
    const targetAI = document.getElementById('gasWizTargetAI').value;

    if (!name || !desc) {
        showToast(t('toastNoProjectWiz'));
        return;
    }

    gasWizData = { name, desc, targetAI };

    // Mark step 1 completed, activate step 2
    document.getElementById('gasWizStep1').className = 'wizard-step completed';
    document.getElementById('gasWizStep2').className = 'wizard-step active';
    document.getElementById('gasWizAnalysisLoading').style.display = 'flex';
    document.getElementById('gasWizAnalysisContent').innerHTML = '';
    document.getElementById('gasWizSettingsPanel').style.display = 'none';

    const prompt = `คุณเป็นผู้เชี่ยวชาญ Google Apps Script web app
วิเคราะห์โปรเจกต์นี้แล้วตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):

ชื่อ: ${name}
คำอธิบาย: ${desc}

{
  "summary": "สรุปโปรเจกต์ 2-3 ประโยค",
  "features": [
    {"name": "ชื่อฟีเจอร์", "description": "อธิบายสั้นๆ", "priority": "high|medium|low"}
  ],
  "dataModels": [
    {"name": "ชื่อแผ่นงาน (Sheet)", "fields": ["field1", "field2"]}
  ],
  "estimatedComplexity": "simple|moderate|complex",
  "gasSettings": {
    "guideMode": "beginner|balanced|expert",
    "uiStyle": "modern|formal|dashboard",
    "database": "google-sheets|supabase",
    "pageType": "single-page|spa",
    "authentication": "none|google-sheets-auth",
    "responsive": "responsive|desktop-only",
    "workflows": { "pdf": true/false, "drive": true/false, "bottomNav": true/false, "swal": true/false },
    "notifyChannel": "none|line-messaging-api|telegram-bot|gmail-app"
  },
  "gasReasons": {
    "guideMode": "เหตุผลสั้นๆ",
    "uiStyle": "เหตุผลสั้นๆ",
    "database": "เหตุผลสั้นๆ",
    "workflows": "เหตุผลสั้นๆ",
    "notifyChannel": "เหตุผลสั้นๆ"
  }
}

หลักเกณฑ์:
- guideMode: ถ้าซับซ้อนหรือไม่ระบุประสบการณ์ → beginner, งานทั่วไป → balanced, advanced → expert
- uiStyle: ราชการ/องค์กร → formal, backoffice/ตาราง → dashboard, ทั่วไป → modern
- database: ถ้าต้องการ relational หรือ auth ซับซ้อน → supabase, ทั่วไป → google-sheets
- pageType: ถ้ามีหลายมุมมอง/เมนู → spa (multi-view), หน้าเดียว → single-page
- authentication: ถ้ามี login → google-sheets-auth, ไม่มี → none
- workflows.pdf: true ถ้ามี PDF/เอกสาร/template/ใบเสนอราคา
- workflows.drive: true ถ้ามีแชร์ไฟล์/สิทธิ์/โฟลเดอร์
- workflows.bottomNav: true ถ้า mobile-first
- workflows.swal: true เกือบทุกกรณี
- notifyChannel: ตามที่ระบุ, ไม่ระบุ → none

ตอบเป็น JSON เท่านั้น`;

    try {
        const raw = await callGeminiAPI(apiKey, prompt);
        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const data = JSON.parse(jsonStr);
        gasWizData.analysis = data;

        document.getElementById('gasWizAnalysisLoading').style.display = 'none';
        renderGasWizAnalysis(data);
        applyGasWizSettings(data.gasSettings);

        document.getElementById('gasWizSettingsPanel').style.display = 'block';
    } catch (err) {
        document.getElementById('gasWizAnalysisLoading').style.display = 'none';
        document.getElementById('gasWizAnalysisContent').innerHTML = `<div class="wizard-error"><i class="bi bi-exclamation-triangle"></i><p>${err.message}</p><button class="btn btn-outline btn-sm" onclick="startGasWizardAnalysis()">${t('retryBtn')}</button></div>`;
    }
}

function renderGasWizAnalysis(analysis) {
    let html = `<div class="wiz-summary-box">${analysis.summary}</div>`;

    // Editable features
    html += `<div class="wiz-analysis-card"><h4><i class="bi bi-puzzle"></i> ${t('wizFeatures')}</h4>`;
    html += `<ul class="gas-wiz-editable-list" id="gasWizFeatureList">`;
    analysis.features.forEach((f, i) => {
        html += renderGasWizFeatureItem(f, i);
    });
    html += `</ul>`;
    html += `<button type="button" class="btn btn-outline btn-sm gas-wiz-add-btn" id="gasWizAddFeature"><i class="bi bi-plus-circle"></i> ${t('gasWizAddFeature')}</button>`;
    html += `</div>`;

    // Editable data models
    if (analysis.dataModels && analysis.dataModels.length > 0) {
        html += `<div class="wiz-analysis-card"><h4><i class="bi bi-database"></i> ${t('gasWizDataModelsTitle')}</h4>`;
        html += `<ul class="gas-wiz-editable-list" id="gasWizDataModelList">`;
        analysis.dataModels.forEach((m, i) => {
            html += renderGasWizDataModelItem(m, i);
        });
        html += `</ul>`;
        html += `<button type="button" class="btn btn-outline btn-sm gas-wiz-add-btn" id="gasWizAddDataModel"><i class="bi bi-plus-circle"></i> ${t('gasWizAddDataModel')}</button>`;
        html += `</div>`;
    }

    const complexityLabel = { simple: t('wizComplexitySimple'), moderate: t('wizComplexityModerate'), complex: t('wizComplexityComplex') };
    html += `<div class="wiz-analysis-card"><h4><i class="bi bi-speedometer2"></i> ${t('gasWizComplexity')}: ${complexityLabel[analysis.estimatedComplexity] || analysis.estimatedComplexity}</h4></div>`;

    document.getElementById('gasWizAnalysisContent').innerHTML = html;

    // Show consult AI section
    const consultSection = document.getElementById('gasWizConsultSection');
    if (consultSection) consultSection.style.display = '';

    // Bind editable events
    bindGasWizEditableEvents();
}

function renderGasWizFeatureItem(f, index) {
    const priorityOptions = ['high', 'medium', 'low'];
    const badge = f.priority === 'high' ? '🔴' : f.priority === 'medium' ? '🟡' : '🟢';
    let selectHtml = `<select class="gas-wiz-priority-select" data-feature-index="${index}">`;
    priorityOptions.forEach(p => {
        const label = p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Medium' : '🟢 Low';
        selectHtml += `<option value="${p}" ${f.priority === p ? 'selected' : ''}>${label}</option>`;
    });
    selectHtml += `</select>`;

    return `<li class="gas-wiz-editable-item" data-feature-index="${index}">
        <div class="gas-wiz-item-content">
            <input type="text" class="gas-wiz-edit-name" data-feature-index="${index}" value="${escapeHtml(f.name)}">
            <input type="text" class="gas-wiz-edit-desc" data-feature-index="${index}" value="${escapeHtml(f.description)}">
        </div>
        <div class="gas-wiz-item-actions">
            ${selectHtml}
            <button type="button" class="btn-icon gas-wiz-delete-btn" data-feature-index="${index}" title="ลบ"><i class="bi bi-trash"></i></button>
        </div>
    </li>`;
}

function renderGasWizDataModelItem(m, index) {
    return `<li class="gas-wiz-editable-item" data-model-index="${index}">
        <div class="gas-wiz-item-content">
            <input type="text" class="gas-wiz-edit-model-name" data-model-index="${index}" value="${escapeHtml(m.name)}">
            <input type="text" class="gas-wiz-edit-model-fields" data-model-index="${index}" value="${escapeHtml(m.fields.join(', '))}">
        </div>
        <div class="gas-wiz-item-actions">
            <button type="button" class="btn-icon gas-wiz-delete-model-btn" data-model-index="${index}" title="ลบ"><i class="bi bi-trash"></i></button>
        </div>
    </li>`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function bindGasWizEditableEvents() {
    const analysis = gasWizData.analysis;
    if (!analysis) return;

    // Feature name/desc/priority changes
    document.querySelectorAll('.gas-wiz-edit-name').forEach(input => {
        input.addEventListener('input', () => {
            const i = parseInt(input.dataset.featureIndex);
            if (analysis.features[i]) analysis.features[i].name = input.value;
        });
    });
    document.querySelectorAll('.gas-wiz-edit-desc').forEach(input => {
        input.addEventListener('input', () => {
            const i = parseInt(input.dataset.featureIndex);
            if (analysis.features[i]) analysis.features[i].description = input.value;
        });
    });
    document.querySelectorAll('.gas-wiz-priority-select').forEach(select => {
        select.addEventListener('change', () => {
            const i = parseInt(select.dataset.featureIndex);
            if (analysis.features[i]) analysis.features[i].priority = select.value;
        });
    });

    // Delete feature
    document.querySelectorAll('.gas-wiz-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.featureIndex);
            analysis.features.splice(i, 1);
            renderGasWizAnalysis(analysis);
        });
    });

    // Add feature
    const addFeatureBtn = document.getElementById('gasWizAddFeature');
    if (addFeatureBtn) {
        addFeatureBtn.addEventListener('click', () => {
            analysis.features.push({ name: '', description: '', priority: 'medium' });
            renderGasWizAnalysis(analysis);
            // Focus the new feature name input
            const inputs = document.querySelectorAll('.gas-wiz-edit-name');
            if (inputs.length > 0) inputs[inputs.length - 1].focus();
        });
    }

    // Data model name/fields changes
    document.querySelectorAll('.gas-wiz-edit-model-name').forEach(input => {
        input.addEventListener('input', () => {
            const i = parseInt(input.dataset.modelIndex);
            if (analysis.dataModels[i]) analysis.dataModels[i].name = input.value;
        });
    });
    document.querySelectorAll('.gas-wiz-edit-model-fields').forEach(input => {
        input.addEventListener('input', () => {
            const i = parseInt(input.dataset.modelIndex);
            if (analysis.dataModels[i]) {
                analysis.dataModels[i].fields = input.value.split(',').map(s => s.trim()).filter(Boolean);
            }
        });
    });

    // Delete data model
    document.querySelectorAll('.gas-wiz-delete-model-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.modelIndex);
            analysis.dataModels.splice(i, 1);
            renderGasWizAnalysis(analysis);
        });
    });

    // Add data model
    const addModelBtn = document.getElementById('gasWizAddDataModel');
    if (addModelBtn) {
        addModelBtn.addEventListener('click', () => {
            if (!analysis.dataModels) analysis.dataModels = [];
            analysis.dataModels.push({ name: '', fields: ['id'] });
            renderGasWizAnalysis(analysis);
            const inputs = document.querySelectorAll('.gas-wiz-edit-model-name');
            if (inputs.length > 0) inputs[inputs.length - 1].focus();
        });
    }
}

// ===== GAS Wizard: Consult AI Chat =====
let gasWizChatHistory = [];

function initGasWizConsultChat() {
    const toggleBtn = document.getElementById('gasWizConsultToggle');
    const chatArea = document.getElementById('gasWizConsultChat');
    const sendBtn = document.getElementById('gasWizChatSendBtn');
    const input = document.getElementById('gasWizChatInput');
    const reanalyzeBtn = document.getElementById('gasWizReanalyzeBtn');

    if (!toggleBtn || !chatArea) return;

    toggleBtn.addEventListener('click', () => {
        const isHidden = chatArea.style.display === 'none';
        chatArea.style.display = isHidden ? '' : 'none';
        toggleBtn.classList.toggle('active', isHidden);
        if (isHidden && gasWizChatHistory.length === 0) {
            // Show initial AI greeting
            appendGasWizChatMsg('ai', t('gasWizChatGreeting'));
        }
    });

    sendBtn.addEventListener('click', () => sendGasWizChatMsg());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendGasWizChatMsg();
        }
    });

    if (reanalyzeBtn) {
        reanalyzeBtn.addEventListener('click', () => reanalyzeWithChat());
    }
}

function appendGasWizChatMsg(role, text) {
    const container = document.getElementById('gasWizChatMessages');
    const div = document.createElement('div');
    div.className = `gas-wiz-chat-msg gas-wiz-chat-${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function sendGasWizChatMsg() {
    const input = document.getElementById('gasWizChatInput');
    const msg = input.value.trim();
    if (!msg) return;

    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) { showToast(t('toastNoApiKey')); return; }

    input.value = '';
    appendGasWizChatMsg('user', msg);
    gasWizChatHistory.push({ role: 'user', text: msg });

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'gas-wiz-chat-msg gas-wiz-chat-ai gas-wiz-typing';
    typingDiv.textContent = '...';
    const container = document.getElementById('gasWizChatMessages');
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;

    // Build context with current analysis
    const analysis = gasWizData.analysis;
    const contextPrompt = `คุณเป็นที่ปรึกษา Google Apps Script ผู้เชี่ยวชาญ
กำลังช่วยผู้ใช้ปรับปรุงผลวิเคราะห์โปรเจกต์นี้:

ชื่อโปรเจกต์: ${gasWizData.name}
คำอธิบาย: ${gasWizData.desc}

ผลวิเคราะห์ปัจจุบัน:
${JSON.stringify(analysis, null, 2)}

ประวัติการสนทนา:
${gasWizChatHistory.map(h => `${h.role === 'user' ? 'ผู้ใช้' : 'AI'}: ${h.text}`).join('\n')}

ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย ไม่ต้องใส่ code block
ถ้าผู้ใช้ถามเรื่องฟีเจอร์/โครงสร้าง ให้แนะนำเพิ่มเติมหรืออธิบาย
ถ้าผู้ใช้บอกว่าอยากเพิ่ม/ลบ/แก้อะไร ให้แนะนำวิธีปรับ`;

    try {
        const reply = await callGeminiAPI(apiKey, contextPrompt);
        typingDiv.remove();
        appendGasWizChatMsg('ai', reply);
        gasWizChatHistory.push({ role: 'ai', text: reply });

        // Show re-analyze button after first exchange
        const reanalyzeBtn = document.getElementById('gasWizReanalyzeBtn');
        if (reanalyzeBtn) reanalyzeBtn.style.display = '';
    } catch (err) {
        typingDiv.remove();
        appendGasWizChatMsg('ai', `เกิดข้อผิดพลาด: ${err.message}`);
    }
}

async function reanalyzeWithChat() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) { showToast(t('toastNoApiKey')); return; }

    const reanalyzeBtn = document.getElementById('gasWizReanalyzeBtn');
    if (reanalyzeBtn) {
        reanalyzeBtn.disabled = true;
        reanalyzeBtn.innerHTML = `<span class="spinner-sm"></span> ${t('gasWizReanalyzing')}`;
    }

    const chatContext = gasWizChatHistory.map(h =>
        `${h.role === 'user' ? 'ผู้ใช้' : 'AI'}: ${h.text}`
    ).join('\n');

    const prompt = `คุณเป็นผู้เชี่ยวชาญ Google Apps Script web app
วิเคราะห์โปรเจกต์นี้ใหม่ โดยอิงจากข้อมูลเดิมและการสนทนาเพิ่มเติม
ตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):

ชื่อ: ${gasWizData.name}
คำอธิบาย: ${gasWizData.desc}

ผลวิเคราะห์เดิม:
${JSON.stringify(gasWizData.analysis, null, 2)}

การสนทนาเพิ่มเติม:
${chatContext}

ให้ปรับ JSON ตามที่ผู้ใช้คุยไว้ (เพิ่ม/ลบ/แก้ฟีเจอร์, แผ่นงาน, ความซับซ้อน, ตั้งค่า):
{
  "summary": "สรุปโปรเจกต์ 2-3 ประโยค (ปรับตามที่คุย)",
  "features": [
    {"name": "ชื่อฟีเจอร์", "description": "อธิบายสั้นๆ", "priority": "high|medium|low"}
  ],
  "dataModels": [
    {"name": "ชื่อแผ่นงาน (Sheet)", "fields": ["field1", "field2"]}
  ],
  "estimatedComplexity": "simple|moderate|complex",
  "gasSettings": {
    "guideMode": "beginner|balanced|expert",
    "uiStyle": "modern|formal|dashboard",
    "database": "google-sheets|supabase",
    "pageType": "single-page|spa",
    "authentication": "none|google-sheets-auth",
    "responsive": "responsive|desktop-only",
    "workflows": { "pdf": true/false, "drive": true/false, "bottomNav": true/false, "swal": true/false },
    "notifyChannel": "none|line-messaging-api|telegram-bot|gmail-app"
  },
  "gasReasons": {
    "guideMode": "เหตุผลสั้นๆ",
    "uiStyle": "เหตุผลสั้นๆ",
    "database": "เหตุผลสั้นๆ",
    "workflows": "เหตุผลสั้นๆ",
    "notifyChannel": "เหตุผลสั้นๆ"
  }
}

ตอบเป็น JSON เท่านั้น`;

    try {
        const raw = await callGeminiAPI(apiKey, prompt);
        const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const data = JSON.parse(jsonStr);
        gasWizData.analysis = data;

        renderGasWizAnalysis(data);
        applyGasWizSettings(data.gasSettings);

        // Reset chat
        gasWizChatHistory = [];
        document.getElementById('gasWizChatMessages').innerHTML = '';
        document.getElementById('gasWizConsultChat').style.display = 'none';
        document.getElementById('gasWizConsultToggle').classList.remove('active');
        if (reanalyzeBtn) { reanalyzeBtn.style.display = 'none'; }

        showToast(t('gasWizReanalyzeDone'));
    } catch (err) {
        showToast(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
        if (reanalyzeBtn) {
            reanalyzeBtn.disabled = false;
            reanalyzeBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i> ${t('gasWizReanalyzeBtn')}`;
        }
    }
}

function applyGasWizSettings(settings) {
    if (!settings) return;

    if (settings.guideMode) {
        const radio = document.querySelector(`input[name="gasGuideMode"][value="${settings.guideMode}"]`);
        if (radio) radio.checked = true;
    }
    if (settings.uiStyle) {
        const radio = document.querySelector(`input[name="gasUiStyle"][value="${settings.uiStyle}"]`);
        if (radio) radio.checked = true;
    }
    if (settings.database) {
        setRadioIfExists('database', settings.database);
    }
    if (settings.pageType) {
        setRadioIfExists('pageType', settings.pageType);
    }
    if (settings.authentication) {
        setRadioIfExists('authentication', settings.authentication);
    }
    if (settings.responsive) {
        setRadioIfExists('responsive', settings.responsive);
    }
    if (settings.workflows) {
        const map = { pdf: 'gasWorkflowPdf', drive: 'gasWorkflowDrive', bottomNav: 'gasWorkflowBottomNav', swal: 'gasWorkflowSwal' };
        for (const [key, id] of Object.entries(map)) {
            const cb = document.getElementById(id);
            if (cb) cb.checked = !!settings.workflows[key];
        }
    }
    if (settings.notifyChannel) {
        const radio = document.querySelector(`input[name="gasNotifyChannel"][value="${settings.notifyChannel}"]`);
        if (radio) radio.checked = true;
    }
}

async function gasWizardGenerate() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast(t('toastNoApiKey'));
        return;
    }

    // Force GAS platform + settings into main form
    setRadioIfExists('platform', 'google-apps-script');
    setRadioIfExists('hosting', 'gas-deploy');
    setRadioIfExists('cssFramework', 'bootstrap');
    setRadioIfExists('language', 'javascript');
    setRadioIfExists('packageManager', 'none');
    setRadioIfExists('testing', 'none');
    setRadioIfExists('apiStyle', 'rest');
    setRadioIfExists('pwa', 'no');
    setRadioIfExists('targetAI', gasWizData.targetAI);

    // Set project info into main form
    document.getElementById('projectName').value = gasWizData.name;

    const analysis = gasWizData.analysis;
    let richDesc = gasWizData.desc;
    richDesc += `\n\n## ฟีเจอร์ที่วิเคราะห์ได้:\n`;
    analysis.features.forEach(f => {
        richDesc += `- ${f.name} (${f.priority}): ${f.description}\n`;
    });
    if (analysis.dataModels && analysis.dataModels.length > 0) {
        richDesc += `\n## แผ่นงาน (Sheets):\n`;
        analysis.dataModels.forEach(m => {
            richDesc += `- ${m.name}: ${m.fields.join(', ')}\n`;
        });
    }
    document.getElementById('projectDesc').value = richDesc;

    applyValidationRules();

    // Generate prompt using the main generatePrompt function
    await generatePrompt();

    showToast(t('toastGenerated'));
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
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
        const skill = CURRENT_SKILL_INDEX[cb.value] || SKILLS_CATALOG.find(s => s.name === cb.value);
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
        'spa': platform === 'google-apps-script' ? t('pageNameGasMultiView') : t('pageNameSPA')
    };
    const authNames = {
        'none': t('authNameNone'),
        'google-sheets-auth': 'Google Sheets Auth (Hash)',
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
    };

    // Build context-aware notes based on combo selections
    const comboNotes = [];
    if (platform === 'google-apps-script' && pageType === 'spa') {
        comboNotes.push(`- **สำคัญ**: สำหรับ GAS คำว่า multi-view หมายถึงหลายมุมมองภายใน HtmlService หน้าเดียว ไม่ใช่ React/Next SPA
- ใช้ Alpine.js ผ่าน CDN ได้ และเหมาะกับงาน state/view แบบเบาใน GAS เช่น x-data, x-show, x-if, x-model, x-cloak และ Alpine.store()
- โครงสร้างที่แนะนำ: ใช้ไฟล์ HTML หลักหน้าเดียว แล้วสลับ view ภายในหน้า พร้อม include partial จาก HtmlService ตามความเหมาะสม
- ถ้าต้องการนำทางระหว่างมุมมอง ให้ใช้ hash-based routing (window.location.hash) หรือ query parameter แบบเบา
- script และ stylesheet ภายนอกที่โหลดใน HtmlService ต้องเป็น HTTPS`);
    }
    if (platform === 'google-apps-script' && pwa === 'yes') {
        comboNotes.push(`- **หมายเหตุ PWA บน GAS**: ต้อง deploy GAS เป็น Web App แล้วใช้ Service Worker แยก, manifest.json จะต้อง serve จาก GAS endpoint`);
    }
    if (authentication === 'google-sheets-auth') {
        comboNotes.push(`- **ระบบ Auth ผ่าน Google Sheets**: เก็บข้อมูล username/password ใน Google Sheets
- Password ต้อง hash ด้วย SHA-256 (หรือ bcrypt ถ้ามี library) ก่อนบันทึก ห้ามเก็บ plain text
- ตาราง Users ใน Sheet: columns = username, password_hash, salt, role, created_at
- Login flow: รับ username+password → hash password+salt → เทียบกับ password_hash ใน Sheet
- Register flow: สร้าง salt → hash password+salt → เพิ่มแถวใหม่ใน Sheet
- ใช้ session token (JWT หรือ random token) เก็บใน localStorage หลัง login สำเร็จ`);
    }
    if (platform === 'react-vercel' && pageType === 'spa') {
        comboNotes.push(`- ใช้ React Router สำหรับ client-side routing
- ตั้งค่า vercel.json rewrites ให้ redirect ทุก path ไปที่ index.html`);
    }

    const comboNotesText = comboNotes.length > 0
        ? `\n## หมายเหตุเฉพาะสำหรับ Tech Stack ที่เลือก\n${comboNotes.join('\n')}\n`
        : '';

    // Build prompt for Gemini
    const gasPromptContext = platform === 'google-apps-script' && typeof buildGasPromptContext === 'function'
        ? buildGasPromptContext({ projectDesc, database, authentication, pageType, responsive })
        : '';
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
- **รูปแบบหน้าเว็บ**: ${pageNames[pageType]}
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

    const finalGeminiPrompt = gasPromptContext
        ? geminiPrompt.replace('\n## Skills', `\n${gasPromptContext}\n\n## Skills`)
        : geminiPrompt;

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
        let response = await callGeminiAPI(apiKey, finalGeminiPrompt);
        if (platform === 'google-apps-script' && typeof rewriteGasPromptIfNeeded === 'function') {
            response = await rewriteGasPromptIfNeeded(apiKey, finalGeminiPrompt, response);
        }

        // สร้าง KP Fingerprint (พิสูจน์ว่าสร้างจากระบบ KP Prompt Creator)
        const kpFingerprint = generateKPFingerprint(response, projectName);
        const responseWithFingerprint = response + '\n\n' + kpFingerprint;

        resultLoading.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.value = responseWithFingerprint;

        // Show signature warning
        document.getElementById('signatureWarning').style.display = 'flex';

        // Auto-resize textarea
        resultText.style.height = 'auto';
        resultText.style.height = Math.min(resultText.scrollHeight, 600) + 'px';

        // Show usage guide for the target AI
        renderUsageGuide(targetAI);

        // Store filename for download
        resultSection.dataset.fileName = fileName;

        // Show GAS codegen card if platform is GAS
        const codegenCard = document.getElementById('codegenCard');
        if (codegenCard) {
            const isGas = platform === 'google-apps-script';
            codegenCard.style.display = isGas ? '' : 'none';
            if (isGas) renderCodegenEstimate(responseWithFingerprint);
        }

        // Track stats
        trackPromptGenerated(platform, currentMode);

    } catch (error) {
        resultLoading.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.value = `Error: ${error.message}\n\n${t('errorPrefix')}`;
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
    const content = document.getElementById('resultText').value;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
        showToast(t('toastCopied'));
    }).catch(() => {
        // Fallback
        const resultText = document.getElementById('resultText');
        resultText.select();
        document.execCommand('copy');
        showToast(t('toastCopied'));
    });
}

function downloadResult() {
    const resultSection = document.getElementById('result-section');
    const content = document.getElementById('resultText').value;
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

// ===== Custom Confirm Modal =====

function kpConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'kp-modal-overlay';

        const icon = options.icon || 'question-circle';
        const confirmText = options.confirmText || 'ตกลง';
        const cancelText = options.cancelText || 'ยกเลิก';
        const type = options.type || 'confirm'; // confirm | danger | info

        const typeClass = type === 'danger' ? 'kp-modal-danger' : type === 'info' ? 'kp-modal-info' : '';

        overlay.innerHTML = `
            <div class="kp-modal ${typeClass}">
                <div class="kp-modal-icon">
                    <i class="bi bi-${icon}"></i>
                </div>
                <div class="kp-modal-message">${message}</div>
                <div class="kp-modal-actions">
                    ${type !== 'info' ? `<button class="kp-modal-btn kp-modal-cancel">${cancelText}</button>` : ''}
                    <button class="kp-modal-btn kp-modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('show'));

        function close(result) {
            overlay.classList.remove('show');
            overlay.classList.add('closing');
            setTimeout(() => { overlay.remove(); resolve(result); }, 200);
        }

        overlay.querySelector('.kp-modal-confirm').addEventListener('click', () => close(true));
        const cancelBtn = overlay.querySelector('.kp-modal-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));

        // Click outside to cancel
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });

        // Escape key to cancel
        const escHandler = (e) => {
            if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); close(false); }
        };
        document.addEventListener('keydown', escHandler);

        // Focus confirm button
        overlay.querySelector('.kp-modal-confirm').focus();
    });
}

function kpAlert(message, options = {}) {
    return kpConfirm(message, { ...options, type: 'info', confirmText: options.confirmText || 'ตกลง' });
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
    document.getElementById('gas-wizard-section').style.display = mode === 'gas-wizard' ? '' : 'none';

    // Result section stays visible if it has content
    // Initialize chat on first open
    if (mode === 'ai-chat' && !chatInitialized) {
        initChat();
    }

    // When entering GAS wizard mode, force platform to GAS
    if (mode === 'gas-wizard') {
        const gasRadio = document.querySelector('input[name="platform"][value="google-apps-script"]');
        if (gasRadio) {
            gasRadio.checked = true;
            gasRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
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
    "database": "google-sheets | supabase | mongodb-atlas | turso",
    "cssFramework": "bootstrap | tailwind | daisyui | shadcn-ui | material-ui",
    "language": "javascript | typescript",
    "pageType": "single-page | spa",
    "pwa": "yes | no",
    "responsive": "responsive | desktop-only",
    "authentication": "none | google-sheets-auth | supabase-auth | clerk",
    "apiStyle": "rest | graphql | trpc",
    "packageManager": "none | npm | pnpm | bun",
    "testing": "none | vitest | jest | playwright",
    "hosting": "gas-deploy | vercel | netlify | cloudflare-pages"
  },
  "targetAI": "claude | gemini-cli | cursor | github-copilot | codex",
  "reasoning": {
    "platform": "เหตุผล",
    "database": "เหตุผล"
  }
}`;

        const gasRecommendationGuide = typeof getGasRecommendationGuide === 'function' ? getGasRecommendationGuide() : '';
        const finalAnalysisPrompt = gasRecommendationGuide ? `${analysisPrompt}\n\n${gasRecommendationGuide}` : analysisPrompt;
        const raw = await callGeminiAPI(apiKey, finalAnalysisPrompt);
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

สำคัญ: ค่าที่ตอบต้องตรงกับค่าที่อนุญาตเท่านั้น:
- platform: google-apps-script | react-vercel | nextjs-vercel | vue-netlify | static-html
- database: google-sheets | supabase | mongodb-atlas | turso
- cssFramework: bootstrap | tailwind | daisyui | shadcn-ui | material-ui
- language: javascript | typescript
- pageType: single-page | spa
- pwa: yes | no
- responsive: responsive | desktop-only
- authentication: none | google-sheets-auth | supabase-auth | clerk
- apiStyle: rest | graphql | trpc
- packageManager: none | npm | pnpm | bun
- testing: none | vitest | jest | playwright
- hosting: gas-deploy | vercel | netlify | cloudflare-pages

ตอบเป็น JSON เท่านั้น (ไม่ต้อง code block):
{"adjusted": {เฉพาะ field ที่เปลี่ยน ใช้ค่าที่อนุญาตด้านบนเท่านั้น}, "message": "อธิบายสิ่งที่เปลี่ยนสั้นๆ ภาษาไทย"}`;

            const raw = await callGeminiAPI(apiKey, adjustPrompt);
            const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const adj = JSON.parse(jsonStr);

            // Apply adjustments (normalize values to match radio button values)
            const adjNormalized = { ...adj.adjusted };
            const valueNorms = {
                'cssFramework': { 'tailwindcss': 'tailwind', 'tailwind-css': 'tailwind', 'tailwind css': 'tailwind', 'daisy-ui': 'daisyui', 'mui': 'material-ui' },
                'platform': { 'gas': 'google-apps-script', 'react': 'react-vercel', 'nextjs': 'nextjs-vercel', 'next': 'nextjs-vercel', 'vue': 'vue-netlify', 'static': 'static-html', 'html': 'static-html' },
                'database': { 'sheets': 'google-sheets', 'googlesheets': 'google-sheets', 'mongodb': 'mongodb-atlas', 'mongo': 'mongodb-atlas', 'sqlite': 'turso' },
                'language': { 'js': 'javascript', 'ts': 'typescript' },
                'authentication': { 'sheets-auth': 'google-sheets-auth', 'sheets auth': 'google-sheets-auth', 'supabase': 'supabase-auth' },
                'hosting': { 'gas': 'gas-deploy', 'cloudflare': 'cloudflare-pages' }
            };
            for (const [field, val] of Object.entries(adjNormalized)) {
                const norms = valueNorms[field];
                if (norms && typeof val === 'string') {
                    const lower = val.toLowerCase().trim();
                    if (norms[lower]) adjNormalized[field] = norms[lower];
                }
            }
            Object.assign(chatProjectData.analysis.techStack, adjNormalized);

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

    // Normalize AI-returned values to match exact radio button values
    const normalizeMap = {
        'platform': {
            'gas': 'google-apps-script', 'google-apps-script': 'google-apps-script',
            'react': 'react-vercel', 'react-vercel': 'react-vercel',
            'nextjs': 'nextjs-vercel', 'next': 'nextjs-vercel', 'nextjs-vercel': 'nextjs-vercel',
            'vue': 'vue-netlify', 'vue-netlify': 'vue-netlify',
            'static': 'static-html', 'html': 'static-html', 'static-html': 'static-html'
        },
        'database': {
            'google-sheets': 'google-sheets', 'sheets': 'google-sheets', 'googlesheets': 'google-sheets',
            'supabase': 'supabase',
            'mongodb-atlas': 'mongodb-atlas', 'mongodb': 'mongodb-atlas', 'mongo': 'mongodb-atlas',
            'turso': 'turso', 'sqlite': 'turso'
        },
        'cssFramework': {
            'bootstrap': 'bootstrap',
            'tailwind': 'tailwind', 'tailwindcss': 'tailwind', 'tailwind-css': 'tailwind', 'tailwind css': 'tailwind',
            'daisyui': 'daisyui', 'daisy-ui': 'daisyui', 'daisy': 'daisyui',
            'shadcn-ui': 'shadcn-ui', 'shadcn': 'shadcn-ui',
            'material-ui': 'material-ui', 'mui': 'material-ui', 'material': 'material-ui'
        },
        'language': {
            'javascript': 'javascript', 'js': 'javascript',
            'typescript': 'typescript', 'ts': 'typescript'
        },
        'pageType': {
            'single-page': 'single-page', 'single': 'single-page',
            'spa': 'spa'
        },
        'authentication': {
            'none': 'none',
            'google-sheets-auth': 'google-sheets-auth', 'sheets-auth': 'google-sheets-auth', 'sheets auth': 'google-sheets-auth',
            'supabase-auth': 'supabase-auth', 'supabase': 'supabase-auth',
            'clerk': 'clerk'
        },
        'hosting': {
            'gas-deploy': 'gas-deploy', 'gas': 'gas-deploy',
            'vercel': 'vercel',
            'netlify': 'netlify',
            'cloudflare-pages': 'cloudflare-pages', 'cloudflare': 'cloudflare-pages',
        }
    };

    function normalizeValue(field, value) {
        if (!value) return value;
        const map = normalizeMap[field];
        if (!map) return value;
        const lower = value.toLowerCase().trim();
        return map[lower] || value;
    }

    // Normalize tech stack values before setting radio buttons
    ts.platform = normalizeValue('platform', ts.platform);
    ts.database = normalizeValue('database', ts.database);
    ts.cssFramework = normalizeValue('cssFramework', ts.cssFramework);
    ts.language = normalizeValue('language', ts.language);
    ts.pageType = normalizeValue('pageType', ts.pageType);
    ts.authentication = normalizeValue('authentication', ts.authentication);
    ts.hosting = normalizeValue('hosting', ts.hosting);

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

    // Auto-select relevant skills based on tech stack
    const autoSkills = await autoSelectSkills();
    if (autoSkills.length > 0) {
        addChatBubble('system', `🔧 เลือก Skills อัตโนมัติ ${autoSkills.length} รายการ: ${autoSkills.map(s => s.title).join(', ')}`);
    }

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
    {"name": "ชื่อแผ่นงาน (Sheet)", "fields": ["field1", "field2"]}
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
        html += `<div class="wiz-analysis-card"><h4><i class="bi bi-database"></i> ${t('gasWizDataModelsTitle')}</h4><ul>`;
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
    const gasRecommendationGuide = typeof getGasRecommendationGuide === 'function' ? getGasRecommendationGuide() : '';

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
- database: google-sheets, supabase, mongodb-atlas, turso
- cssFramework: bootstrap, tailwind, daisyui, shadcn-ui, material-ui
- language: javascript, typescript
- pageType: single-page, spa
- pwa: yes, no
- responsive: responsive, desktop-only
- authentication: none, google-sheets-auth, supabase-auth, clerk
- apiStyle: rest, graphql, trpc
- packageManager: none, npm, pnpm, bun
- testing: none, vitest, jest, playwright
- hosting: gas-deploy, vercel, netlify, cloudflare-pages`;

    try {
        const finalTechPrompt = gasRecommendationGuide ? `${techPrompt}\n\n${gasRecommendationGuide}` : techPrompt;
        const raw = await callGeminiAPI(apiKey, finalTechPrompt);
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
        richDesc += `\n## แผ่นงาน (Sheets):\n`;
        analysis.dataModels.forEach(m => {
            richDesc += `- ${m.name}: ${m.fields.join(', ')}\n`;
        });
    }

    document.getElementById('projectDesc').value = richDesc;

    // Auto-select relevant skills based on tech stack
    await autoSelectSkills();

    // Make manual sections visible briefly for generatePrompt to work
    await generatePrompt();

    showToast(t('toastGenerated'));
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== Reset Form =====

async function resetForm() {
    const ok = await kpConfirm('รีเซ็ตตัวเลือกทั้งหมดเป็นค่าเริ่มต้น?<br><small style="color:var(--text-muted)">(API Key จะไม่ถูกลบ)</small>', { icon: 'arrow-counterclockwise', type: 'danger', confirmText: 'รีเซ็ต' });
    if (!ok) return;

    // Reset text inputs (except API key)
    document.getElementById('projectName').value = '';
    document.getElementById('projectDesc').value = '';
    document.getElementById('otherAiName').value = '';

    // Reset wizard fields
    const wizProjectName = document.getElementById('wizProjectName');
    const wizProjectDesc = document.getElementById('wizProjectDesc');
    if (wizProjectName) wizProjectName.value = '';
    if (wizProjectDesc) wizProjectDesc.value = '';
    const wizTargetAI = document.getElementById('wizTargetAI');
    if (wizTargetAI) wizTargetAI.selectedIndex = 0;

    // Reset all radio buttons to first (checked by default in HTML)
    const radioGroups = ['platform', 'database', 'cssFramework', 'language', 'pageType', 'pwa', 'responsive', 'authentication', 'apiStyle', 'packageManager', 'testing', 'hosting', 'targetAI', 'gasGuideMode', 'gasUiStyle', 'gasNotifyChannel'];
    radioGroups.forEach(name => {
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        radios.forEach((radio, i) => {
            radio.checked = radio.defaultChecked;
        });
    });

    document.querySelectorAll('#gas-wizard-section input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.defaultChecked;
    });

    // Reset GAS wizard section
    const gasWizName = document.getElementById('gasWizProjectName');
    const gasWizDesc = document.getElementById('gasWizProjectDesc');
    if (gasWizName) gasWizName.value = '';
    if (gasWizDesc) gasWizDesc.value = '';
    const gasWizTarget = document.getElementById('gasWizTargetAI');
    if (gasWizTarget) gasWizTarget.selectedIndex = 0;
    document.getElementById('gasWizStep1').className = 'wizard-step active';
    document.getElementById('gasWizStep2').className = 'wizard-step';
    document.getElementById('gasWizAnalysisContent').innerHTML = '';
    document.getElementById('gasWizSettingsPanel').style.display = 'none';
    // Reset consult chat
    gasWizChatHistory = [];
    const consultChat = document.getElementById('gasWizConsultChat');
    if (consultChat) consultChat.style.display = 'none';
    const consultSection = document.getElementById('gasWizConsultSection');
    if (consultSection) consultSection.style.display = 'none';
    const chatMsgs = document.getElementById('gasWizChatMessages');
    if (chatMsgs) chatMsgs.innerHTML = '';
    const reanalyzeBtn = document.getElementById('gasWizReanalyzeBtn');
    if (reanalyzeBtn) reanalyzeBtn.style.display = 'none';
    gasWizData = {};

    applyValidationRules();
    if (typeof initGasModeControls === 'function') {
        initGasModeControls();
    }

    // Clear skills checkboxes
    document.querySelectorAll('#skillsList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    CURRENT_SKILL_INDEX = {};

    // Hide result section
    const resultSection = document.getElementById('result-section');
    resultSection.style.display = 'none';
    document.getElementById('resultText').value = '';
    document.getElementById('signatureWarning').style.display = 'none';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast('รีเซ็ตเรียบร้อยแล้ว');
}

// ===== KP Fingerprint System =====
// สร้าง fingerprint เพื่อพิสูจน์ว่าไฟล์นี้สร้างจาก KP Prompt Creator

function generateKPFingerprint(content, projectName) {
    const timestamp = new Date().toISOString();
    const contentHash = simpleHash(content);
    const signature = simpleHash(`KP:${contentHash}:${timestamp}:${projectName}`);

    return [
        '---',
        `<!-- KP-PROMPT-CREATOR-SIGNATURE -->`,
        `<!-- Generated: ${timestamp} -->`,
        `<!-- Content-Hash: ${contentHash} -->`,
        `<!-- Signature: KP-${signature} -->`,
        '<!-- DO NOT REMOVE: This signature verifies this prompt was created by KP Prompt Creator -->'
    ].join('\n');
}

// Simple hash function (ใช้ฝั่ง client — ไม่ต้อง crypto dependency)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // แปลงเป็น hex + เพิ่ม timestamp component ให้ unique
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const timePart = Date.now().toString(36);
    return `${hex}-${timePart}`;
}

// =============================================
// Save Prompt to Personal Library
// =============================================
const SAVE_API = window.location.origin + '/api';

function getSavedToken() {
  return localStorage.getItem('kp_token');
}

async function saveApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getSavedToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${SAVE_API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const rawText = await res.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { error: rawText || `HTTP ${res.status}` };
  }
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// =============================================
// Top Bar Profile Dropdown
// =============================================
let kpUser = null;

function toggleKpProfile() {
  const dd = document.getElementById('kpProfileDropdown');
  dd.classList.toggle('show');
}

// Close dropdown on click outside
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('kpProfileWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('kpProfileDropdown')?.classList.remove('show');
  }
});

async function initKpProfile() {
  const token = getSavedToken();
  const contentEl = document.getElementById('kp-profile-content');
  const profileBtn = document.getElementById('kpProfileBtn');
  if (!contentEl) return;

  if (!token) {
    // Guest state
    contentEl.innerHTML = `
      <div class="kp-dd-guest">
        <div style="font-size:32px;color:var(--primary-light);margin-bottom:8px;"><i class="bi bi-person-circle"></i></div>
        <p>เข้าสู่ระบบเพื่อบันทึก Prompt<br>และเข้าถึง Marketplace</p>
        <div class="kp-dd-guest-btns">
          <a href="/auth.html" class="btn-login">เข้าสู่ระบบ</a>
          <a href="/auth.html?tab=register" class="btn-register">สมัคร</a>
        </div>
      </div>
    `;
    return;
  }

  try {
    const { user } = await saveApi('/auth/me');
    kpUser = user;
    profileBtn.classList.add('logged-in');
    profileBtn.innerHTML = `<span style="font-size:13px;font-weight:700;">${(user.display_name || 'U')[0].toUpperCase()}</span>`;

    contentEl.innerHTML = `
      <div class="kp-dd-header">
        <div class="kp-dd-name">${escapeHtmlSimple(user.display_name)}</div>
        <div class="kp-dd-email">${escapeHtmlSimple(user.email)}</div>
        <div class="kp-dd-balance"><i class="bi bi-wallet2"></i> ฿${parseFloat(user.credit_balance).toFixed(2)}</div>
      </div>
      <div class="kp-dd-links">
        <a href="/account.html" class="kp-dd-link"><i class="bi bi-person"></i> บัญชีของฉัน</a>
        <a href="/account.html#tab-my-prompts" class="kp-dd-link"><i class="bi bi-bookmark"></i> Prompt ที่บันทึก</a>
        <a href="/orders.html" class="kp-dd-link"><i class="bi bi-bag-check"></i> คำสั่งซื้อ</a>
        <a href="/topup.html" class="kp-dd-link"><i class="bi bi-wallet2"></i> เติมเครดิต</a>
        <a href="/marketplace.html" class="kp-dd-link"><i class="bi bi-shop"></i> Marketplace</a>
        ${user.role === 'admin' || user.role === 'seller' ? '<a href="/dashboard.html" class="kp-dd-link"><i class="bi bi-speedometer2"></i> Dashboard</a>' : ''}
        ${user.role === 'admin' ? '<a href="/admin.html" class="kp-dd-link"><i class="bi bi-shield-check"></i> Admin Panel</a>' : ''}
        <div class="kp-dd-divider"></div>
        <a href="#" onclick="kpLogout();return false;" class="kp-dd-link danger"><i class="bi bi-box-arrow-right"></i> ออกจากระบบ</a>
      </div>
    `;
  } catch {
    // Token expired
    localStorage.removeItem('kp_token');
    contentEl.innerHTML = `
      <div class="kp-dd-guest">
        <div style="font-size:32px;color:var(--primary-light);margin-bottom:8px;"><i class="bi bi-person-circle"></i></div>
        <p>เข้าสู่ระบบเพื่อบันทึก Prompt<br>และเข้าถึง Marketplace</p>
        <div class="kp-dd-guest-btns">
          <a href="/auth.html" class="btn-login">เข้าสู่ระบบ</a>
          <a href="/auth.html?tab=register" class="btn-register">สมัคร</a>
        </div>
      </div>
    `;
  }
}

function kpLogout() {
  localStorage.removeItem('kp_token');
  kpUser = null;
  showToast('ออกจากระบบแล้ว');
  initKpProfile();
  document.getElementById('kpProfileDropdown')?.classList.remove('show');
}

function escapeHtmlSimple(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  initKpProfile();
});

function openSavePromptModal() {
  const content = document.getElementById('resultText')?.value;
  if (!content) { showToast('ยังไม่มี Prompt ให้บันทึก'); return; }

  const overlay = document.getElementById('savePromptOverlay');
  overlay.style.display = 'flex';

  const token = getSavedToken();
  const authSection = document.getElementById('save-auth-section');
  const formSection = document.getElementById('save-form-section');

  if (!token) {
    authSection.style.display = 'block';
    formSection.style.display = 'none';
  } else {
    authSection.style.display = 'none';
    formSection.style.display = 'block';
    // Pre-fill title from project name
    const projectName = document.getElementById('projectName')?.value || '';
    const targetAI = getRadioValue('targetAI') || 'claude';
    document.getElementById('save-prompt-title').value = projectName ? `${projectName} (${targetAI})` : `Prompt ${targetAI}`;
    loadCollectionsForSave();
  }
}

function closeSaveModal() {
  document.getElementById('savePromptOverlay').style.display = 'none';
  document.getElementById('new-collection-section').style.display = 'none';
}

async function loadCollectionsForSave() {
  const select = document.getElementById('save-collection-select');
  try {
    const { collections } = await saveApi('/collections');
    select.innerHTML = '<option value="">— ไม่ระบุ —</option>' +
      collections.map(c => `<option value="${c.id}">${c.name} (${c.prompt_count})</option>`).join('');
  } catch {
    select.innerHTML = '<option value="">— ไม่ระบุ —</option>';
  }
}

function toggleNewCollection() {
  const section = document.getElementById('new-collection-section');
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
  if (section.style.display === 'block') {
    document.getElementById('new-collection-name').focus();
  }
}

async function createNewCollection() {
  const nameInput = document.getElementById('new-collection-name');
  const name = nameInput.value.trim();
  if (!name) { showToast('กรุณาตั้งชื่อคอลเล็คชั่น'); return; }

  try {
    const { collection } = await saveApi('/collections', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    showToast(`สร้างคอลเล็คชั่น "${name}" สำเร็จ!`);
    nameInput.value = '';
    document.getElementById('new-collection-section').style.display = 'none';
    await loadCollectionsForSave();
    // Auto-select the new collection
    document.getElementById('save-collection-select').value = collection.id;
  } catch (err) {
    showToast(err.error || 'สร้างไม่สำเร็จ');
  }
}

async function handleSavePrompt(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('save-prompt-submit');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:4px;"></div> กำลังบันทึก...';

  const content = document.getElementById('resultText')?.value || '';
  const resultSection = document.getElementById('result-section');
  const fileName = resultSection?.dataset.fileName || 'CLAUDE.md';
  const projectName = document.getElementById('projectName')?.value || '';
  const targetAI = getRadioValue('targetAI') || '';

  // Collect tech stack
  const techStack = [];
  ['platform', 'database', 'cssFramework', 'language', 'authentication', 'apiStyle', 'hosting'].forEach(name => {
    const val = getRadioValue(name);
    if (val && val !== 'none') techStack.push(val);
  });

  try {
    await saveApi('/saved-prompts', {
      method: 'POST',
      body: JSON.stringify({
        title: form.title.value,
        content,
        target_ai: targetAI,
        project_name: projectName,
        tech_stack: techStack,
        file_name: fileName,
        collection_id: form.collection_id.value || null,
        source: 'creator'
      })
    });
    showToast('บันทึก Prompt สำเร็จ!');
    closeSaveModal();
  } catch (err) {
    showToast(err.error || 'บันทึกไม่สำเร็จ');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-bookmark-check"></i> บันทึก';
  }
}

// ===== Stats Tracking =====

function getStats() {
    try {
        return JSON.parse(localStorage.getItem('kp_prompt_stats') || 'null') || {
            total: 0,
            platforms: {},
            modes: {},
            firstUsed: null,
            lastUsed: null
        };
    } catch {
        return { total: 0, platforms: {}, modes: {}, firstUsed: null, lastUsed: null };
    }
}

function saveStats(stats) {
    localStorage.setItem('kp_prompt_stats', JSON.stringify(stats));
}

function trackPromptGenerated(platform, mode) {
    const stats = getStats();
    const now = new Date().toISOString();

    stats.total++;
    stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
    stats.modes[mode] = (stats.modes[mode] || 0) + 1;
    if (!stats.firstUsed) stats.firstUsed = now;
    stats.lastUsed = now;

    saveStats(stats);
    renderFooterStatsGlobal();

    // Sync to server
    syncStatsToServer(platform, mode);

    // Update vote count
    updateVoteCount();
}

function getTopKey(obj) {
    let topKey = null, topVal = 0;
    for (const [key, val] of Object.entries(obj)) {
        if (val > topVal) { topKey = key; topVal = val; }
    }
    return topKey;
}

// ===== GAS Code Generation =====

/**
 * Estimate price based on prompt content analysis
 * Base: 500 (simple) / 700 (moderate) / 900 (complex)
 * Auto-detect from the generated prompt text
 */
function estimateCodegenPrice(promptText) {
    const text = promptText.toLowerCase();
    let score = 0;
    const breakdown = [];

    // Count features (lines starting with - that describe functionality)
    const featureLines = (text.match(/^[\-\*]\s+.{10,}/gm) || []).length;
    score += Math.min(featureLines, 20);

    // Detect complexity signals
    const signals = [
        { pattern: /login|auth|สมัครสมาชิก|password|session|ล็อกอิน/i, points: 3, label: 'Auth/Login' },
        { pattern: /pdf|google docs|template.*placeholder|ใบ.*ราคา|เอกสาร/i, points: 3, label: 'PDF/Docs' },
        { pattern: /line messaging|telegram bot|แจ้งเตือน.*line|notify/i, points: 3, label: 'Notification' },
        { pattern: /drive.*sharing|แชร์ไฟล์|permission.*drive|สิทธิ์/i, points: 3, label: 'Drive' },
        { pattern: /dashboard|แดชบอร์ด|chart|กราฟ|สรุป.*ยอด/i, points: 2, label: 'Dashboard' },
        { pattern: /crud|เพิ่ม.*แก้ไข.*ลบ|create.*read.*update/i, points: 2, label: 'CRUD' },
        { pattern: /multi.*view|หลายมุมมอง|alpine\.js|spa/i, points: 2, label: 'Multi-view' },
        { pattern: /approval|อนุมัติ|หลายขั้นตอน|workflow/i, points: 3, label: 'Workflow' },
        { pattern: /upload|อัปโหลด|แนบไฟล์/i, points: 2, label: 'Upload' },
        { pattern: /export.*excel|export.*pdf|ส่งออก/i, points: 2, label: 'Export' },
        { pattern: /role|บทบาท|admin.*user|สิทธิ์.*ผู้ใช้/i, points: 2, label: 'Roles' },
        { pattern: /search|ค้นหา|filter|กรอง/i, points: 1, label: 'Search/Filter' },
    ];

    signals.forEach(s => {
        if (s.pattern.test(text)) {
            score += s.points;
            breakdown.push(s.label);
        }
    });

    // Count sheets/data models mentioned
    const sheetMatches = text.match(/sheet|แผ่นงาน|ตาราง|spreadsheet/gi) || [];
    score += Math.min(sheetMatches.length, 5);

    // Determine tier
    let tier, price, tierLabel, tierClass;
    if (score <= 10) {
        tier = 'simple'; price = 1000; tierLabel = t('codegenTierSimple'); tierClass = 'est-tag-simple';
    } else if (score <= 20) {
        tier = 'moderate'; price = 1500; tierLabel = t('codegenTierModerate'); tierClass = 'est-tag-moderate';
    } else {
        tier = 'complex'; price = 2000; tierLabel = t('codegenTierComplex'); tierClass = 'est-tag-complex';
    }

    return { tier, price, tierLabel, tierClass, breakdown, score };
}

function renderCodegenEstimate(promptText) {
    const est = estimateCodegenPrice(promptText);
    const detailsEl = document.getElementById('codegenEstimateDetails');
    const priceEl = document.getElementById('codegenPrice');
    if (!detailsEl || !priceEl) return;

    const tags = est.breakdown.slice(0, 5).map(b => `<span class="est-tag">${b}</span>`).join(' ');
    detailsEl.innerHTML = `<span class="est-tag ${est.tierClass}">${est.tierLabel}</span> ${tags}`;
    priceEl.textContent = `฿${est.price.toLocaleString()}`;

    // Store price for later use
    window._kpCodegenPrice = est.price;
}

function initCodegenButton() {
    const btn = document.getElementById('codegenBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const promptContent = document.getElementById('resultText')?.value;
        const projectName = document.getElementById('projectName')?.value || 'GAS Project';

        if (!promptContent) {
            showToast(t('codegenNoPrompt'), 'error');
            return;
        }

        // Check login — show modal if not logged in
        const token = localStorage.getItem('kp_token');
        if (!token) {
            const loggedIn = await showAuthModal();
            if (!loggedIn) return;
        }

        // Show payment modal
        const est = estimateCodegenPrice(promptContent);
        showPaymentModal({
            projectName,
            promptContent,
            tier: est.tier,
            price: est.price,
            includeInstaller: document.getElementById('codegenInstaller')?.checked !== false
        });
    });
}

// ===== Own API Code Generation =====

function initCodegenOwnApiButton() {
    const btn = document.getElementById('codegenOwnApiBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const promptContent = document.getElementById('resultText')?.value;
        const projectName = document.getElementById('projectName')?.value || 'GAS Project';

        if (!promptContent) {
            showToast(t('codegenNoPrompt'), 'error');
            return;
        }

        // Check login — show modal if not logged in
        const token = localStorage.getItem('kp_token');
        if (!token) {
            const loggedIn = await showAuthModal();
            if (!loggedIn) return;
        }

        // Check API key
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            showToast(t('codegenOwnApiNoKey'), 'error');
            return;
        }

        // Confirm before generating
        const est = estimateCodegenPrice(promptContent);
        const estimatedRequests = est.tier === 'simple' ? '1-2' : est.tier === 'moderate' ? '3-5' : '8-15';
        const confirmed = await kpConfirm(
            `<div style="text-align:left;font-size:13px;line-height:1.8;">
                <div style="font-weight:700;font-size:15px;margin-bottom:8px;text-align:center;">
                    <i class="bi bi-key"></i> ${t('codegenOwnApiBtn')}
                </div>
                <div style="padding:10px;background:#fef3c7;border-radius:8px;margin-bottom:12px;">
                    <i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b;"></i>
                    <strong>${t('codegenTierLabel') || est.tierLabel} (${est.tierLabel})</strong> —
                    ประมาณ <strong>${estimatedRequests} requests</strong>
                </div>
                <div><i class="bi bi-info-circle"></i> ${t('codegenOwnApiWarning')}</div>
                <div style="margin-top:8px;color:#64748b;font-size:12px;">
                    <i class="bi bi-lightbulb"></i> ${t('codegenOwnApiQuotaHint')}
                </div>
            </div>`,
            { icon: 'cpu', type: 'warning', confirmText: t('codegenOwnApiBtn') }
        );
        if (!confirmed) return;

        // Start generating with own API
        await generateCodeWithOwnApi(apiKey, promptContent, projectName);
    });
}

async function generateCodeWithOwnApi(apiKey, promptContent, projectName) {
    const progressEl = document.getElementById('codegenProgress');
    const progressFill = document.getElementById('codegenProgressFill');
    const progressText = document.getElementById('codegenProgressText');
    const ownApiBtn = document.getElementById('codegenOwnApiBtn');

    if (progressEl) progressEl.style.display = '';
    if (ownApiBtn) ownApiBtn.disabled = true;

    try {
        // Step 1: Generate code
        if (progressFill) progressFill.style.width = '20%';
        if (progressText) progressText.textContent = t('codegenOwnApiGenerating');

        const codeGenPrompt = buildOwnApiCodegenPrompt(promptContent, projectName);
        const generatedCode = await callGeminiAPI(apiKey, codeGenPrompt);

        // Step 2: Show result
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = t('codegenOwnApiSuccess');

        // Display generated code in a modal
        showGeneratedCodeModal(generatedCode, projectName);

        showToast(t('codegenOwnApiSuccess'));

    } catch (error) {
        console.error('Own API codegen error:', error);
        showToast(t('codegenOwnApiError'), 'error');

        // Show quota hint
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            showToast(t('codegenOwnApiQuotaHint'), 'warning');
        }
    } finally {
        if (ownApiBtn) ownApiBtn.disabled = false;
        setTimeout(() => {
            if (progressEl) progressEl.style.display = 'none';
            if (progressFill) progressFill.style.width = '0%';
        }, 2000);
    }
}

function buildOwnApiCodegenPrompt(promptContent, projectName) {
    return `You are an expert Google Apps Script developer. Based on the following project prompt, generate complete, working GAS code.

PROJECT NAME: ${projectName}

PROJECT PROMPT:
${promptContent}

REQUIREMENTS:
1. Generate complete, ready-to-use Google Apps Script code
2. Include all necessary files (Code.gs, HTML files, appsscript.json)
3. Add clear comments in the code
4. Do NOT use import/export statements (GAS doesn't support them)
5. Do NOT use npm packages
6. Use Google Apps Script built-in services only
7. Include error handling
8. Format output as separate files clearly marked with filename headers like:
   === filename.gs ===
   (code here)
   === filename.html ===
   (code here)

Generate the complete code now:`;
}

function showGeneratedCodeModal(code, projectName) {
    const overlay = document.createElement('div');
    overlay.className = 'kp-modal-overlay';
    overlay.innerHTML = `
    <div class="kp-modal" style="max-width:700px;max-height:85vh;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
                <div style="font-size:16px;font-weight:700;"><i class="bi bi-code-slash"></i> ${projectName}</div>
                <div style="font-size:12px;color:var(--text-muted);">Generated with your Gemini API</div>
            </div>
            <button class="kp-modal-close-btn" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div style="position:relative;">
            <textarea id="generatedCodeOutput" readonly style="width:100%;height:50vh;padding:12px;font-family:'Fira Code',monospace;font-size:13px;border:1px solid var(--border);border-radius:8px;background:var(--surface);resize:vertical;line-height:1.6;white-space:pre;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn btn-primary" id="copyGeneratedCode" style="flex:1;">
                <i class="bi bi-clipboard"></i> Copy Code
            </button>
            <button class="btn btn-outline" id="downloadGeneratedCode" style="flex:1;">
                <i class="bi bi-download"></i> Download .txt
            </button>
            <button class="btn btn-outline kp-modal-cancel-btn" style="flex:0 0 auto;">
                <i class="bi bi-x"></i> Close
            </button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    function close() {
        overlay.classList.remove('show');
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 200);
    }

    overlay.querySelector('.kp-modal-close-btn').addEventListener('click', close);
    overlay.querySelector('.kp-modal-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Copy
    document.getElementById('copyGeneratedCode').addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
            showToast('Copied!');
        });
    });

    // Download
    document.getElementById('downloadGeneratedCode').addEventListener('click', () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}_code.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });
}


// ===== Auth Modal (Login/Register without page change) =====

function showAuthModal() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'kp-modal-overlay';
        overlay.innerHTML = `
        <div class="kp-modal" style="max-width:400px;text-align:left;">
            <div class="kp-modal-icon"><i class="bi bi-person-lock"></i></div>
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:16px;font-weight:700;">${t('authModalTitle')}</div>
                <div style="font-size:13px;color:var(--text-muted);">${t('authModalDesc')}</div>
            </div>
            <div id="authModalTabs" style="display:flex;gap:0;margin-bottom:16px;">
                <button class="auth-tab active" data-tab="login" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px 0 0 8px;cursor:pointer;font-weight:600;font-size:13px;background:var(--primary);color:white;">${t('authLogin')}</button>
                <button class="auth-tab" data-tab="register" style="flex:1;padding:8px;border:1px solid var(--border);border-left:none;border-radius:0 8px 8px 0;cursor:pointer;font-weight:600;font-size:13px;background:var(--surface);color:var(--text-muted);">${t('authRegister')}</button>
            </div>
            <form id="authModalForm">
                <div id="authRegisterFields" style="display:none;">
                    <input type="text" id="authModalName" placeholder="${t('authNamePlaceholder')}" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;font-size:14px;">
                </div>
                <input type="email" id="authModalEmail" placeholder="${t('authEmailPlaceholder')}" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;font-size:14px;" required>
                <input type="password" id="authModalPassword" placeholder="${t('authPasswordPlaceholder')}" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;font-size:14px;" required>
                <div id="authModalError" style="display:none;color:#ef4444;font-size:12px;margin-bottom:8px;"></div>
                <button type="submit" class="kp-modal-btn kp-modal-confirm" style="width:100%;padding:12px;" id="authModalSubmit">${t('authLogin')}</button>
            </form>
            <div class="kp-modal-actions" style="margin-top:12px;">
                <button class="kp-modal-btn kp-modal-cancel" style="width:100%;">${t('authClose')}</button>
            </div>
        </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        let mode = 'login';

        function close(result) {
            overlay.classList.remove('show');
            overlay.classList.add('closing');
            setTimeout(() => { overlay.remove(); resolve(result); }, 200);
        }

        // Tab switching
        overlay.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                mode = tab.dataset.tab;
                overlay.querySelectorAll('.auth-tab').forEach(t => {
                    t.style.background = t.dataset.tab === mode ? 'var(--primary)' : 'var(--surface)';
                    t.style.color = t.dataset.tab === mode ? 'white' : 'var(--text-muted)';
                    t.classList.toggle('active', t.dataset.tab === mode);
                });
                document.getElementById('authRegisterFields').style.display = mode === 'register' ? '' : 'none';
                document.getElementById('authModalSubmit').textContent = mode === 'login' ? t('authLogin') : t('authRegister');
            });
        });

        // Close
        overlay.querySelector('.kp-modal-cancel').addEventListener('click', () => close(false));
        overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });

        // Submit
        document.getElementById('authModalForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('authModalError');
            const submitBtn = document.getElementById('authModalSubmit');
            errEl.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = '...';

            const email = document.getElementById('authModalEmail').value.trim();
            const password = document.getElementById('authModalPassword').value;

            try {
                let res;
                if (mode === 'register') {
                    const name = document.getElementById('authModalName').value.trim();
                    if (!name) throw new Error(t('authNameRequired'));
                    res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password, display_name: name })
                    });
                } else {
                    res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                }

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed');

                // Save token
                localStorage.setItem('kp_token', data.token);
                if (data.user) localStorage.setItem('kp_user', JSON.stringify(data.user));

                showToast(mode === 'login' ? t('authLoginSuccess') : t('authRegisterSuccess'));
                close(true);
            } catch (err) {
                errEl.textContent = err.message;
                errEl.style.display = '';
                submitBtn.disabled = false;
                submitBtn.textContent = mode === 'login' ? t('authLogin') : t('authRegister');
            }
        });
    });
}

// ===== Payment Modal (QR PromptPay + Slip Upload) =====

function showPaymentModal(orderData) {
    // Get PromptPay number from admin settings or fallback
    const promptpayNumber = window._kpPromptPayNumber || '0000000000';

    const overlay = document.createElement('div');
    overlay.className = 'kp-modal-overlay';
    overlay.innerHTML = `
    <div class="kp-modal" style="max-width:440px;text-align:left;">
        <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:18px;font-weight:700;">${t('paymentTitle')}</div>
            <div style="font-size:13px;color:var(--text-muted);">${orderData.projectName}</div>
        </div>

        <div style="text-align:center;padding:20px;background:#f8fafc;border-radius:12px;margin-bottom:16px;">
            <div style="font-size:32px;font-weight:800;color:var(--primary);margin-bottom:8px;">฿${orderData.price.toLocaleString()}</div>
            <img id="paymentQR" src="https://promptpay.io/${promptpayNumber}/${orderData.price}.png" alt="QR PromptPay" style="width:200px;height:200px;margin:0 auto;border-radius:8px;border:1px solid #e2e8f0;">
            <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">${t('paymentScanQR')}</div>
        </div>

        <div style="margin-bottom:16px;">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">${t('paymentUploadSlip')}</label>
            <div id="paymentSlipArea" style="border:2px dashed #cbd5e1;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;" onclick="document.getElementById('paymentSlipInput').click()">
                <div style="font-size:24px;margin-bottom:4px;">📎</div>
                <div style="font-size:13px;color:var(--text-muted);">${t('paymentClickUpload')}</div>
                <img id="paymentSlipPreview" style="display:none;max-width:200px;max-height:200px;margin:8px auto 0;border-radius:6px;">
            </div>
            <input type="file" id="paymentSlipInput" accept="image/*" style="display:none;">
        </div>

        <div id="paymentError" style="display:none;color:#ef4444;font-size:12px;margin-bottom:8px;"></div>

        <button class="kp-modal-btn kp-modal-confirm" style="width:100%;padding:12px;" id="paymentSubmitBtn" disabled>${t('paymentSubmit')}</button>
        <div class="kp-modal-actions" style="margin-top:8px;">
            <button class="kp-modal-btn kp-modal-cancel" style="width:100%;">${t('paymentCancel')}</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    let slipBase64 = null;
    let slipFilename = null;

    function close() {
        overlay.classList.remove('show');
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 200);
    }

    overlay.querySelector('.kp-modal-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Slip upload preview
    document.getElementById('paymentSlipInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        slipFilename = file.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
            slipBase64 = ev.target.result;
            const preview = document.getElementById('paymentSlipPreview');
            preview.src = slipBase64;
            preview.style.display = '';
            document.getElementById('paymentSlipArea').style.borderColor = '#22c55e';
            document.getElementById('paymentSubmitBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    });

    // Submit order
    document.getElementById('paymentSubmitBtn').addEventListener('click', async () => {
        const submitBtn = document.getElementById('paymentSubmitBtn');
        const errEl = document.getElementById('paymentError');
        errEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = t('paymentSubmitting');

        try {
            const token = localStorage.getItem('kp_token');
            const res = await fetch('/api/codegen-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectName: orderData.projectName,
                    promptContent: orderData.promptContent,
                    tier: orderData.tier,
                    price: orderData.price,
                    includeInstaller: orderData.includeInstaller,
                    slipImageBase64: slipBase64,
                    slipFilename: slipFilename
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            close();

            // Show success modal
            await kpConfirm(
                `<div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:8px;">✅</div>
                    <div style="font-size:15px;font-weight:600;margin-bottom:4px;">${t('paymentSuccess')}</div>
                    <div style="font-size:13px;color:var(--text-muted);line-height:1.6;">${t('paymentSuccessDesc')}</div>
                    <div style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:8px;font-size:12px;color:var(--text-muted);">
                        ${t('paymentOrderId')}: <strong>${data.order.id.substring(0, 8)}...</strong>
                    </div>
                </div>`,
                { icon: 'check-circle', type: 'info', confirmText: t('paymentGoToOrders') }
            );

            // Redirect to orders page
            window.location.href = '/orders.html';

        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = '';
            submitBtn.disabled = false;
            submitBtn.textContent = t('paymentSubmit');
        }
    });
}

// Load PromptPay number from public config
async function loadPromptPayNumber() {
    try {
        const res = await fetch('/api/codegen-orders/config');
        if (res.ok) {
            const data = await res.json();
            if (data?.promptpayNumber) window._kpPromptPayNumber = data.promptpayNumber;
        }
    } catch {}
}


// ===== Supabase Stats Sync =====

const STATS_API_URL = '/api/stats';

function getVisitorId() {
    let id = localStorage.getItem('kp_visitor_id');
    if (!id) {
        id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('kp_visitor_id', id);
    }
    return id;
}

async function syncStatsToServer(platform, mode) {
    try {
        await fetch(STATS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'prompt', platform, mode })
        });
    } catch { /* silent fail — localStorage is primary */ }
}

async function fetchGlobalStats() {
    try {
        const res = await fetch(STATS_API_URL);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

async function submitVote() {
    const btn = document.getElementById('voteHeartBtn');
    const countEl = document.getElementById('voteCount');
    if (!btn || btn.classList.contains('voted')) return;

    btn.classList.add('voted');
    btn.querySelector('i').className = 'bi bi-heart-fill';
    localStorage.setItem('kp_voted_ai_code_gen', '1');

    // Particle animation
    createVoteParticles();

    // Animate count
    const current = parseInt(countEl.textContent) || 0;
    countEl.textContent = current + 1;

    // Update progress bar
    updateVoteProgress(current + 1);

    try {
        await fetch(STATS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'vote', visitorId: getVisitorId() })
        });
    } catch { /* voted locally */ }
}

function createVoteParticles() {
    const container = document.getElementById('voteParticles');
    if (!container) return;

    const emojis = ['❤️', '💜', '🧡', '💙', '✨', '⭐'];
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('span');
        particle.className = 'vote-particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
        particle.style.setProperty('--y', -(Math.random() * 120 + 40) + 'px');
        particle.style.animationDelay = (Math.random() * 0.3) + 's';
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

function initVoteButton() {
    const btn = document.getElementById('voteHeartBtn');
    if (!btn) return;

    btn.addEventListener('click', submitVote);

    // Check if already voted
    if (localStorage.getItem('kp_voted_ai_code_gen')) {
        btn.classList.add('voted');
        btn.querySelector('i').className = 'bi bi-heart-fill';
    }

    // Initialize progress bar with current count
    updateVoteCount();
}

// Enhanced renderFooterStats with global data
async function renderFooterStatsGlobal() {
    const container = document.getElementById('footerStats');
    if (!container) return;

    const globalStats = await fetchGlobalStats();
    const localStats = getStats();

    // Use global if available, fallback to local
    const total = globalStats ? globalStats.totalPrompts : localStats.total;
    const voteCount = globalStats ? globalStats.aiCodeGenVotes : 0;

    container.style.display = '';

    const platformLabels = {
        'google-apps-script': 'Google Apps Script',
        'nextjs-vercel': 'Next.js',
        'react-vercel': 'React',
        'static-html': 'Static HTML',
        'vue-vercel': 'Vue.js',
        'svelte-vercel': 'SvelteKit',
        'nuxt-vercel': 'Nuxt'
    };

    let html = `<div class="footer-stats-title"><i class="bi bi-bar-chart-fill"></i> ${t('footerStatsTitle')}</div>`;
    html += `<div class="footer-stats-grid">`;

    // Total prompts
    html += `<div class="footer-stat-item">
        <span class="footer-stat-number">${total.toLocaleString()}</span>
        <span class="footer-stat-label">${t('footerStatTotal')}</span>
    </div>`;

    // Vote count with progress bar
    const VOTE_GOAL = 100;
    const votePct = Math.min(Math.round((voteCount / VOTE_GOAL) * 100), 100);
    let voteMsg = '';
    let voteMsgClass = '';
    if (voteCount >= VOTE_GOAL) {
        voteMsg = '🎉🎊 ครบ 100 คนแล้ว! เตรียมพัฒนาได้เลย! 🚀';
        voteMsgClass = 'goal-reached';
    } else if (voteCount >= 75) {
        voteMsg = '🔥🔥🔥 ใกล้มากแล้ว! อีกแค่ ' + (VOTE_GOAL - voteCount) + ' คน!';
        voteMsgClass = 'milestone-hit';
    } else if (voteCount >= 50) {
        voteMsg = '🚀 ครึ่งทางแล้ว! มาช่วยกันดันให้ถึงเป้า!';
        voteMsgClass = 'milestone-hit';
    } else if (voteCount >= 25) {
        voteMsg = '💪 เยี่ยมมาก! กำลังไปได้ดี! ชวนเพื่อนมาอีก!';
    } else if (voteCount >= 10) {
        voteMsg = '💪 เริ่มต้นดี! ชวนเพื่อนมาโหวตกัน!';
    } else {
        voteMsg = '✨ มาร่วมโหวตกันเถอะ!';
    }

    html += `<div class="footer-stat-item footer-vote-progress-wrapper">
        <div class="footer-vote-header">
            <span class="footer-stat-number footer-stat-heart">❤️ ${voteCount.toLocaleString()}</span>
            <span class="footer-stat-label">${t('footerStatVotes')}</span>
        </div>
        <div class="vote-progress-section footer-vote-progress ${voteMsgClass}">
            <div class="vote-progress-header">
                <span class="vote-progress-label">🔥 ${voteCount} / ${VOTE_GOAL} คน</span>
                <span class="vote-progress-percent">${votePct}%</span>
            </div>
            <div class="vote-progress-track">
                <div class="vote-progress-fill" style="width: ${votePct}%"></div>
                <div class="vote-progress-glow" style="--glow-width: ${votePct}%"></div>
            </div>
            <div class="vote-progress-msg">${voteMsg}</div>
            <div class="vote-milestone-markers">
                <span class="vote-milestone ${voteCount >= 25 ? 'reached' : ''}" data-at="25">25</span>
                <span class="vote-milestone ${voteCount >= 50 ? 'reached' : ''}" data-at="50">50</span>
                <span class="vote-milestone ${voteCount >= 75 ? 'reached' : ''}" data-at="75">75</span>
                <span class="vote-milestone milestone-goal ${voteCount >= 100 ? 'reached' : ''}" data-at="100">🎯 100</span>
            </div>
        </div>
    </div>`;

    // Platform breakdown
    const platforms = globalStats ? globalStats.platforms : Object.entries(localStats.platforms).map(([platform, count]) => ({ platform, count }));
    if (platforms && platforms.length > 0) {
        const platformTotal = platforms.reduce((sum, p) => sum + (p.count || 0), 0);
        html += `<div class="footer-stat-item footer-stat-breakdown">
            <span class="footer-stat-label">${t('footerStatBreakdown')}</span>
            <div class="footer-stat-bars">`;
        platforms.forEach(p => {
            const pct = platformTotal > 0 ? Math.round((p.count / platformTotal) * 100) : 0;
            const label = platformLabels[p.platform] || p.platform;
            html += `<div class="footer-stat-bar-row">
                <span class="footer-stat-bar-label">${label}</span>
                <div class="footer-stat-bar"><div class="footer-stat-bar-fill" style="width:${pct}%"></div></div>
                <span class="footer-stat-bar-count">${p.count}</span>
            </div>`;
        });
        html += `</div></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Update vote progress bar
function updateVoteProgress(count) {
    const GOAL = 100;
    const pct = Math.min(Math.round((count / GOAL) * 100), 100);

    const fill = document.getElementById('voteProgressFill');
    const glow = document.getElementById('voteProgressGlow');
    const percentEl = document.getElementById('voteProgressPercent');
    const countDisplay = document.getElementById('voteProgressCount');
    const msgEl = document.getElementById('voteProgressMsg');
    const section = document.getElementById('voteProgressSection');

    if (!fill) return;

    fill.style.width = pct + '%';
    if (glow) glow.style.setProperty('--glow-width', pct + '%');
    if (percentEl) percentEl.textContent = pct + '%';
    if (countDisplay) countDisplay.textContent = count;

    // Update milestones
    document.querySelectorAll('.vote-milestone').forEach(m => {
        const at = parseInt(m.dataset.at);
        if (count >= at) m.classList.add('reached');
        else m.classList.remove('reached');
    });

    // Motivational messages
    if (section) {
        section.classList.remove('goal-reached', 'milestone-hit');
    }

    if (msgEl) {
        if (count >= GOAL) {
            msgEl.textContent = '🎉🎊 ครบ 100 คนแล้ว! เตรียมพัฒนาได้เลย! 🚀';
            if (section) section.classList.add('goal-reached');
        } else if (count >= 75) {
            msgEl.textContent = '🔥🔥🔥 ใกล้มากแล้ว! อีกแค่ ' + (GOAL - count) + ' คน!';
            if (section) section.classList.add('milestone-hit');
        } else if (count >= 50) {
            msgEl.textContent = '🚀 ครึ่งทางแล้ว! มาช่วยกันดันให้ถึงเป้า!';
            if (section) section.classList.add('milestone-hit');
        } else if (count >= 25) {
            msgEl.textContent = '💪 เยี่ยมมาก! กำลังไปได้ดี! ชวนเพื่อนมาอีก!';
        } else if (count >= 10) {
            msgEl.textContent = '💪 เริ่มต้นดี! ชวนเพื่อนมาโหวตกัน!';
        } else {
            msgEl.textContent = '✨ มาร่วมโหวตกันเถอะ!';
        }
    }
}

// Update vote count when result section shows
async function updateVoteCount() {
    const countEl = document.getElementById('voteCount');
    if (!countEl) return;
    const globalStats = await fetchGlobalStats();
    if (globalStats) {
        const votes = globalStats.aiCodeGenVotes || 0;
        countEl.textContent = votes;
        updateVoteProgress(votes);
    }
}

// Init footer stats on load
document.addEventListener('DOMContentLoaded', () => {
    renderFooterStatsGlobal();
    initVoteButton();
    initCodegenButton();
    initCodegenOwnApiButton();
    loadPromptPayNumber();
});
