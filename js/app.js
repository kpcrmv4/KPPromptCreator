// ===== Prompt Creator - App Logic =====

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
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

    // Tech stack validation
    document.querySelectorAll('input[name="platform"]').forEach(radio => {
        radio.addEventListener('change', applyValidationRules);
    });
    document.querySelectorAll('input[name="database"]').forEach(radio => {
        radio.addEventListener('change', applyValidationRules);
    });
    document.querySelectorAll('input[name="pageType"]').forEach(radio => {
        radio.addEventListener('change', applyValidationRules);
    });
    applyValidationRules();

    // Fetch skills button
    document.getElementById('fetchSkillsBtn').addEventListener('click', fetchSkills);

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generatePrompt);

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', copyResult);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);
}

// ===== Tech Stack Validation =====

// Compatibility rules: [platform][option] => allowed databases/options
const COMPAT_RULES = {
    // platform -> allowed databases
    database: {
        'google-apps-script': {
            allowed: ['google-sheets'],
            blocked: ['supabase'],
            reason: 'Google Apps Script ใช้ได้กับ Google Sheets เท่านั้น'
        },
        'react-vercel': {
            allowed: ['supabase'],
            blocked: ['google-sheets'],
            reason: 'React + Vercel แนะนำใช้กับ Supabase (Google Sheets ไม่รองรับ)'
        }
    },
    // platform -> allowed page types
    pageType: {
        'google-apps-script': {
            allowed: ['single-page'],
            blocked: ['spa'],
            reason: 'Google Apps Script รองรับเฉพาะ Single Page'
        }
    }
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

    if (platform === 'google-apps-script') {
        relevantTags.add('gas');
        relevantTags.add('google');
        relevantTags.add('sheets');
    } else {
        relevantTags.add('react');
        relevantTags.add('vercel');
        relevantTags.add('deploy');
    }

    if (database === 'google-sheets') {
        relevantTags.add('google');
        relevantTags.add('sheets');
    } else {
        relevantTags.add('supabase');
        relevantTags.add('database');
        relevantTags.add('auth');
    }

    if (cssFramework === 'bootstrap') {
        relevantTags.add('bootstrap');
    } else {
        relevantTags.add('tailwind');
    }

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
            listEl.innerHTML = '<p class="form-hint">ไม่พบ skills ที่เกี่ยวข้อง ลองอธิบายโปรเจกต์ให้ละเอียดขึ้น</p>';
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

// ===== Generate Prompt =====

async function generatePrompt() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showToast('กรุณาใส่ Gemini API Key');
        return;
    }

    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showToast('กรุณาใส่ชื่อโปรเจกต์');
        return;
    }

    const projectDesc = document.getElementById('projectDesc').value.trim();
    if (!projectDesc) {
        showToast('กรุณาอธิบายหลักการทำงาน');
        return;
    }

    const platform = getRadioValue('platform');
    const database = getRadioValue('database');
    const cssFramework = getRadioValue('cssFramework');
    const pageType = getRadioValue('pageType');
    const pwa = getRadioValue('pwa');
    const responsive = getRadioValue('responsive');
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
        'other': 'AI_INSTRUCTIONS.md'
    };
    const fileName = fileNames[targetAI];

    // Platform names
    const platformNames = {
        'google-apps-script': 'Google Apps Script (GAS)',
        'react-vercel': 'React + Vercel'
    };

    const dbNames = {
        'google-sheets': 'Google Sheets',
        'supabase': 'Supabase (PostgreSQL)'
    };

    const cssNames = {
        'bootstrap': 'Bootstrap',
        'tailwind': 'Tailwind CSS'
    };

    const pageNames = {
        'single-page': 'Single Page (หน้าเดียว)',
        'spa': 'SPA - Single Page Application (หลายหน้า มี routing)'
    };

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
- **รูปแบบหน้าเว็บ**: ${pageNames[pageType]}
- **PWA**: ${pwa === 'yes' ? 'ต้องการ PWA (Progressive Web App)' : 'ไม่ต้องการ PWA'}
- **การแสดงผล**: ${responsive === 'responsive' ? 'Responsive (รองรับทุกขนาดหน้าจอ)' : 'Desktop Only'}

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
    generateBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> กำลังสร้าง...';

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const response = await callGeminiAPI(apiKey, geminiPrompt);

        resultLoading.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.textContent = response;

        // Store for download
        resultSection.dataset.content = response;
        resultSection.dataset.fileName = fileName;

    } catch (error) {
        resultLoading.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.textContent = `Error: ${error.message}\n\nกรุณาตรวจสอบ API Key และลองใหม่อีกครั้ง`;
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
        throw new Error('ไม่ได้รับผลลัพธ์จาก Gemini กรุณาลองใหม่');
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('ผลลัพธ์ว่างเปล่า กรุณาลองใหม่');
    }

    return text;
}

// ===== Copy & Download =====

function copyResult() {
    const content = document.getElementById('result-section').dataset.content;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
        showToast('คัดลอกแล้ว!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('คัดลอกแล้ว!');
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

    showToast(`ดาวน์โหลด ${fileName} แล้ว!`);
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
