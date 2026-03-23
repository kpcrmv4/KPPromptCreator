// ===== i18n - Internationalization =====

const TRANSLATIONS = {
    th: {
        // Header
        tagline: 'สร้างไฟล์แนะนำโปรเจกต์ให้ AI <br class="mobile-br">เข้าใจงานของคุณได้ทันที',

        // Step 1: API Key
        apiKeyLabel: 'API Key <a href="https://aistudio.google.com/apikey" target="_blank" class="link-small">(รับ API Key ฟรี)</a>',
        apiKeyPlaceholder: 'ใส่ Gemini API Key ของคุณ',
        apiKeyToggleTitle: 'แสดง/ซ่อน',
        apiKeyHint: 'API Key จะถูกเก็บไว้ใน browser ของคุณเท่านั้น ไม่ถูกส่งไปที่อื่น',

        // Step 2: Mode
        stepMode: 'เลือกโหมดการใช้งาน',
        modeManualDesc: 'เลือก tech stack เอง',
        modeChatDesc: 'คุยกับ AI ทีละขั้นตอน',
        modeWizardDesc: 'AI วิเคราะห์เป็น step cards',

        // Chat Mode
        chatResetBtn: 'เริ่มใหม่',
        chatPlaceholder: 'พิมพ์คำตอบของคุณ...',

        // Wizard Mode
        wizStep1Title: 'อธิบายโปรเจกต์ของคุณ',
        wizProjectNameLabel: 'ชื่อโปรเจกต์',
        wizProjectNamePlaceholder: 'เช่น ระบบจัดการสต็อกสินค้า',
        wizProjectDescLabel: 'อธิบายสิ่งที่ต้องการ ยิ่งละเอียดยิ่งดี',
        wizProjectDescPlaceholder: 'เช่น ต้องการเว็บจัดการสินค้า มีระบบ login, เพิ่ม/แก้ไข/ลบสินค้า, แดชบอร์ดสรุปยอดขาย, export เป็น Excel...',
        wizTargetAILabel: 'AI ที่จะนำไปใช้',
        wizTargetAIOther: 'อื่นๆ',
        wizAnalyzeBtn: 'วิเคราะห์โปรเจกต์',
        wizStep2Title: 'AI วิเคราะห์ความต้องการ',
        wizStep3Title: 'Tech Stack ที่แนะนำ',
        wizStep4Title: 'สร้าง Prompt',
        wizAnalysisLoading: 'AI กำลังวิเคราะห์โปรเจกต์...',
        wizTechLoading: 'AI กำลังแนะนำ Tech Stack...',

        // Step 3: Project Info
        stepProjectInfo: 'ข้อมูลโปรเจกต์',
        projectNameLabel: 'ชื่อเว็บไซต์ / โปรเจกต์',
        projectNamePlaceholder: 'เช่น ระบบจัดการสต็อกสินค้า',
        projectDescLabel: 'อธิบายหลักการทำงาน',
        projectDescPlaceholder: 'อธิบายว่าเว็บไซต์นี้ทำอะไร มีฟีเจอร์อะไรบ้าง เช่น ระบบล็อกอิน, CRUD สินค้า, แดชบอร์ดสรุปยอด...',

        // Step 4: Tech Stack
        stepTechStack: 'เลือก Tech Stack',
        labelPlatform: 'แพลตฟอร์ม',
        labelDatabase: 'ฐานข้อมูล',
        labelCSSFramework: 'CSS Framework',
        labelLanguage: 'ภาษา',
        labelPageType: 'รูปแบบหน้าเว็บ',
        labelPWA: 'Progressive Web App (PWA)',
        labelResponsive: 'การแสดงผล',
        labelAuthentication: 'Authentication',
        labelAPIStyle: 'API Style',
        labelPackageManager: 'Package Manager',
        labelTesting: 'Testing',
        labelHosting: 'Hosting / Deployment',

        // Option descriptions
        gasDesc: 'ใช้งานง่าย โฮสต์ฟรีบน Google',
        reactVercelDesc: 'Modern framework, deploy ง่าย',
        vueNetlifyDesc: 'Progressive framework ยืดหยุ่น',
        staticHtmlDesc: 'ไม่ใช้ framework, เบาและเร็ว',
        googleSheetsDesc: 'เหมาะกับ GAS, ใช้งานง่าย',
        tursoDesc: 'SQLite Edge, เร็วมาก',
        bootstrapDesc: 'Component-rich, เรียนรู้ง่าย',
        tailwindDesc: 'Utility-first, ยืดหยุ่นสูง',
        daisyuiDesc: 'Tailwind + Components สวยๆ',
        jsDesc: 'ใช้งานได้ทุกที่ ไม่ต้อง compile',
        tsDesc: 'Type-safe, จับ bug ได้ตั้งแต่เขียน',
        singlePageDesc: 'หน้าเดียว เรียบง่าย',
        spaDesc: 'หลายหน้า มี routing',
        pwaNo: 'ไม่ต้องการ',
        pwaNoDesc: 'เว็บปกติ',
        pwaYes: 'ต้องการ PWA',
        pwaYesDesc: 'ติดตั้งได้เหมือนแอป',
        desktopOnlyDesc: 'แสดงผลบนเดสก์ท็อปเท่านั้น',
        responsiveDesc: 'รองรับทุกขนาดหน้าจอ',
        authNone: 'ไม่ต้องการ',
        authNoneDesc: 'ไม่มีระบบ login',
        restDesc: 'มาตรฐาน, ใช้งานง่าย',
        graphqlDesc: 'Query ยืดหยุ่น, type-safe',
        pkgNone: 'ไม่ใช้',
        pkgNoneDesc: 'ใช้ CDN / ไม่มี build step',
        npmDesc: 'มาตรฐาน, มาพร้อม Node.js',
        pnpmDesc: 'เร็ว, ประหยัด disk space',
        bunDesc: 'เร็วที่สุด, all-in-one toolkit',
        testNone: 'ไม่ต้องการ',
        testNoneDesc: 'ไม่ต้องเขียน test',
        vitestDesc: 'เร็ว, รองรับ Vite ecosystem',
        jestDesc: 'ได้รับความนิยมสูง, ครบครัน',
        vercelDesc: 'เร็ว, CI/CD อัตโนมัติ',
        netlifyDesc: 'ใช้งานง่าย, Functions',
        cloudflareDesc: 'Edge network, เร็วทั่วโลก',

        // Step 5: Target AI
        stepTargetAI: 'เลือก AI ที่จะนำไปใช้',
        targetAILabel: 'AI ที่จะนำไฟล์ .md ไปสั่งงาน',
        otherAI: 'อื่นๆ',
        otherAIDesc: 'AI ตัวอื่น',
        otherAINameLabel: 'ระบุชื่อ AI',
        otherAINamePlaceholder: 'เช่น Aider, Cline...',

        // Step 6: Skills
        stepSkills: 'Skills ที่เกี่ยวข้อง',
        fetchSkillsBtn: 'ค้นหา Skills',
        skillsHint: 'ค้นหา skills จาก <a href="https://skills.sh/trending" target="_blank">skills.sh/trending</a> ที่เกี่ยวข้องกับโปรเจกต์ของคุณ',
        skillsLoading: 'กำลังค้นหา skills ที่เกี่ยวข้อง...',
        skillsEmpty: 'ไม่พบ skills ที่เกี่ยวข้อง ลองอธิบายโปรเจกต์ให้ละเอียดขึ้น',

        // Result
        stepResult: 'ผลลัพธ์',
        copyBtn: 'คัดลอก',
        downloadBtn: 'ดาวน์โหลด .md',
        resultLoading: 'Gemini กำลังสร้าง prompt...',

        // Footer
        footerText: 'KP Prompt Creator &mdash; สร้างด้วย <i class="bi bi-heart-fill"></i> เพื่อชุมชนนักพัฒนาไทย',

        // Magic Wizard Modal
        wizardSubtitle: 'AI วิเคราะห์โปรเจกต์และแนะนำ Tech Stack ที่เหมาะสม',
        wizardLoading: 'Gemini กำลังวิเคราะห์โปรเจกต์ของคุณ...',
        wizardApply: 'ใช้ที่เลือกทั้งหมด',
        wizardCancel: 'ปิด',
        wizardRecommended: 'แนะนำ',
        wizardAlternative: 'ทางเลือก',

        // Toast messages
        toastCopied: 'คัดลอกแล้ว!',
        toastDownloaded: 'ดาวน์โหลด {fileName} แล้ว!',
        toastApplied: 'ใช้ Tech Stack ที่เลือกแล้ว!',
        toastGenerated: 'สร้าง prompt สำเร็จ!',
        toastNoApiKey: 'กรุณาใส่ Gemini API Key',
        toastNoApiKeyWizard: 'กรุณาใส่ Gemini API Key ก่อนใช้ Magic Wizard',
        toastNoProject: 'กรุณาใส่ชื่อโปรเจกต์',
        toastNoDesc: 'กรุณาอธิบายหลักการทำงาน',
        toastNoProjectWizard: 'กรุณาใส่ชื่อโปรเจกต์และคำอธิบายก่อน',
        toastNoApiKeyChat: 'กรุณาใส่ Gemini API Key ก่อน',
        toastNoApiKeyWiz: 'กรุณาใส่ Gemini API Key ก่อน',
        toastNoProjectWiz: 'กรุณาใส่ชื่อโปรเจกต์และคำอธิบาย',

        // Generating state
        generating: 'กำลังสร้าง...',
        errorPrefix: 'กรุณาตรวจสอบ API Key และลองใหม่อีกครั้ง',
        noResultGemini: 'ไม่ได้รับผลลัพธ์จาก Gemini กรุณาลองใหม่',
        emptyResult: 'ผลลัพธ์ว่างเปล่า กรุณาลองใหม่',
        retryBtn: 'ลองใหม่',

        // COMPAT_RULES reasons
        reasonGASDB: 'GAS ใช้ Google Sheets, Supabase, Firebase ได้ผ่าน UrlFetchApp (MongoDB/Turso ต้องการ driver ที่ GAS ไม่รองรับ)',
        reasonStaticDB: 'Static HTML ใช้ Supabase/Firebase ได้โดยตรง หรือใช้ Google Sheets ผ่าน GAS API เป็น backend',
        reasonGASCSS: 'GAS ใช้ CDN-based framework ได้ (Bootstrap/Tailwind/DaisyUI) ส่วน Shadcn/MUI ต้องมี React build step',
        reasonGASLang: 'Google Apps Script ใช้ JavaScript เท่านั้น',
        reasonGASAuth: 'GAS ใช้ Firebase Auth / Supabase Auth ได้ผ่าน client-side JS ใน HTML template (Clerk ต้องการ framework integration)',
        reasonGASAPI: 'GAS ใช้ REST (doGet/doPost) หรือเรียก GraphQL ผ่าน UrlFetchApp ได้ (tRPC ต้องการ TypeScript build)',
        reasonGASPkg: 'GAS ไม่รองรับ package manager ใช้ CDN แทน',
        reasonStaticPkg: 'Static HTML แนะนำใช้ CDN หรือ npm เท่านั้น',
        reasonGASTest: 'GAS ไม่มี testing framework มาตรฐาน',
        reasonGASHost: 'GAS ต้อง deploy ผ่าน Google Apps Script เท่านั้น',
        reasonReactHost: 'React + Vercel แนะนำ deploy บน Vercel',
        reasonNextHost: 'Next.js แนะนำ deploy บน Vercel (รองรับ SSR เต็มที่)',
        reasonVueHost: 'Vue + Netlify แนะนำ deploy บน Netlify',

        // Wizard labels
        wlPlatform: 'แพลตฟอร์ม', wlDatabase: 'ฐานข้อมูล', wlCSSFramework: 'CSS Framework',
        wlLanguage: 'ภาษา', wlPageType: 'รูปแบบหน้าเว็บ', wlPWA: 'PWA',
        wlResponsive: 'การแสดงผล', wlAuthentication: 'Authentication', wlAPIStyle: 'API Style',
        wlPackageManager: 'Package Manager', wlTesting: 'Testing', wlHosting: 'Hosting',

        // Wizard analysis
        wizFeatures: 'ฟีเจอร์ที่วิเคราะห์ได้',
        wizUserTypes: 'ประเภทผู้ใช้',
        wizComplexitySimple: 'ง่าย',
        wizComplexityModerate: 'ปานกลาง',
        wizComplexityComplex: 'ซับซ้อน',

        // Chat
        chatGreeting: 'สวัสดีครับ! ผม AI Assistant ที่จะช่วยวิเคราะห์โปรเจกต์ของคุณ แล้วสร้าง prompt ที่เหมาะสมให้',
        chatStart: 'เริ่มต้นเลย - โปรเจกต์ของคุณชื่ออะไร แล้วทำเกี่ยวกับอะไรครับ?',
        chatQuickStock: 'ระบบจัดการสต็อกสินค้า',
        chatQuickShop: 'เว็บขายของออนไลน์',
        chatQuickDashboard: 'แดชบอร์ดสรุปข้อมูล',
        chatQuickBooking: 'ระบบจองนัดหมาย',
        chatAnalyzing: 'AI กำลังวิเคราะห์ทั้งหมดและสร้าง prompt...',
        chatGenerating: 'กำลังสร้าง prompt...',
        chatGenerated: 'สร้าง prompt สำเร็จแล้ว! เลื่อนลงดูผลลัพธ์ด้านล่างได้เลย',
        chatError: 'เกิดข้อผิดพลาด: {error} ลองพิมพ์ใหม่อีกครั้งครับ',
        chatConfirm: 'ต้องการปรับอะไรไหม? ถ้าโอเคแล้ว พิมพ์ "ตกลง" หรือ "generate" ได้เลยครับ',
        chatQuickOK: 'ตกลง generate เลย',
        chatQuickPlatform: 'เปลี่ยน platform',
        chatQuickDB: 'เปลี่ยน database',
        chatTechRecommended: 'Tech Stack ที่แนะนำ:',

        // Page names in prompt
        pageNameSingle: 'Single Page (หน้าเดียว)',
        pageNameSPA: 'SPA - Single Page Application (หลายหน้า มี routing)',
        authNameNone: 'ไม่มี Authentication',
        pkgNameNone: 'ไม่ใช้ (CDN)',
        testNameNone: 'ไม่มี Testing',
    },
    en: {
        // Header
        tagline: 'Create project instruction files <br class="mobile-br">for AI to understand your work instantly',

        // Step 1: API Key
        apiKeyLabel: 'API Key <a href="https://aistudio.google.com/apikey" target="_blank" class="link-small">(Get free API Key)</a>',
        apiKeyPlaceholder: 'Enter your Gemini API Key',
        apiKeyToggleTitle: 'Show/Hide',
        apiKeyHint: 'Your API Key is stored only in your browser and never sent elsewhere',

        // Step 2: Mode
        stepMode: 'Select Usage Mode',
        modeManualDesc: 'Choose tech stack manually',
        modeChatDesc: 'Chat with AI step by step',
        modeWizardDesc: 'AI analyzes as step cards',

        // Chat Mode
        chatResetBtn: 'Reset',
        chatPlaceholder: 'Type your answer...',

        // Wizard Mode
        wizStep1Title: 'Describe Your Project',
        wizProjectNameLabel: 'Project Name',
        wizProjectNamePlaceholder: 'e.g. Inventory Management System',
        wizProjectDescLabel: 'Describe what you need (the more detail the better)',
        wizProjectDescPlaceholder: 'e.g. A product management website with login, add/edit/delete products, sales dashboard, Excel export...',
        wizTargetAILabel: 'Target AI',
        wizTargetAIOther: 'Other',
        wizAnalyzeBtn: 'Analyze Project',
        wizStep2Title: 'AI Requirement Analysis',
        wizStep3Title: 'Recommended Tech Stack',
        wizStep4Title: 'Generate Prompt',
        wizAnalysisLoading: 'AI is analyzing your project...',
        wizTechLoading: 'AI is recommending Tech Stack...',

        // Step 3: Project Info
        stepProjectInfo: 'Project Info',
        projectNameLabel: 'Website / Project Name',
        projectNamePlaceholder: 'e.g. Inventory Management System',
        projectDescLabel: 'Describe how it works',
        projectDescPlaceholder: 'Describe what the website does, features like login system, product CRUD, sales dashboard...',

        // Step 4: Tech Stack
        stepTechStack: 'Select Tech Stack',
        labelPlatform: 'Platform',
        labelDatabase: 'Database',
        labelCSSFramework: 'CSS Framework',
        labelLanguage: 'Language',
        labelPageType: 'Page Type',
        labelPWA: 'Progressive Web App (PWA)',
        labelResponsive: 'Display',
        labelAuthentication: 'Authentication',
        labelAPIStyle: 'API Style',
        labelPackageManager: 'Package Manager',
        labelTesting: 'Testing',
        labelHosting: 'Hosting / Deployment',

        // Option descriptions
        gasDesc: 'Easy to use, free hosting on Google',
        reactVercelDesc: 'Modern framework, easy deploy',
        vueNetlifyDesc: 'Progressive framework, flexible',
        staticHtmlDesc: 'No framework, lightweight & fast',
        googleSheetsDesc: 'Great with GAS, easy to use',
        tursoDesc: 'SQLite Edge, ultra fast',
        bootstrapDesc: 'Component-rich, easy to learn',
        tailwindDesc: 'Utility-first, highly flexible',
        daisyuiDesc: 'Tailwind + Beautiful Components',
        jsDesc: 'Works everywhere, no compile needed',
        tsDesc: 'Type-safe, catch bugs at dev time',
        singlePageDesc: 'Single page, simple',
        spaDesc: 'Multiple pages with routing',
        pwaNo: 'Not needed',
        pwaNoDesc: 'Regular website',
        pwaYes: 'Enable PWA',
        pwaYesDesc: 'Installable like an app',
        desktopOnlyDesc: 'Desktop only display',
        responsiveDesc: 'Support all screen sizes',
        authNone: 'Not needed',
        authNoneDesc: 'No login system',
        restDesc: 'Standard, easy to use',
        graphqlDesc: 'Flexible query, type-safe',
        pkgNone: 'None',
        pkgNoneDesc: 'Use CDN / no build step',
        npmDesc: 'Standard, comes with Node.js',
        pnpmDesc: 'Fast, saves disk space',
        bunDesc: 'Fastest, all-in-one toolkit',
        testNone: 'Not needed',
        testNoneDesc: 'No testing required',
        vitestDesc: 'Fast, Vite ecosystem support',
        jestDesc: 'Most popular, full-featured',
        vercelDesc: 'Fast, automatic CI/CD',
        netlifyDesc: 'Easy to use, Functions',
        cloudflareDesc: 'Edge network, fast worldwide',

        // Step 5: Target AI
        stepTargetAI: 'Select Target AI',
        targetAILabel: 'AI to use the .md file with',
        otherAI: 'Other',
        otherAIDesc: 'Other AI',
        otherAINameLabel: 'Specify AI name',
        otherAINamePlaceholder: 'e.g. Aider, Cline...',

        // Step 6: Skills
        stepSkills: 'Related Skills',
        fetchSkillsBtn: 'Find Skills',
        skillsHint: 'Find skills from <a href="https://skills.sh/trending" target="_blank">skills.sh/trending</a> related to your project',
        skillsLoading: 'Searching for related skills...',
        skillsEmpty: 'No related skills found. Try describing your project in more detail.',

        // Result
        stepResult: 'Result',
        copyBtn: 'Copy',
        downloadBtn: 'Download .md',
        resultLoading: 'Gemini is generating prompt...',

        // Footer
        footerText: 'KP Prompt Creator &mdash; Made with <i class="bi bi-heart-fill"></i> for the developer community',

        // Magic Wizard Modal
        wizardSubtitle: 'AI analyzes your project and recommends the best Tech Stack',
        wizardLoading: 'Gemini is analyzing your project...',
        wizardApply: 'Apply All Selected',
        wizardCancel: 'Close',
        wizardRecommended: 'Recommended',
        wizardAlternative: 'Alternative',

        // Toast messages
        toastCopied: 'Copied!',
        toastDownloaded: '{fileName} downloaded!',
        toastApplied: 'Applied selected Tech Stack!',
        toastGenerated: 'Prompt generated successfully!',
        toastNoApiKey: 'Please enter Gemini API Key',
        toastNoApiKeyWizard: 'Please enter Gemini API Key before using Magic Wizard',
        toastNoProject: 'Please enter a project name',
        toastNoDesc: 'Please describe how it works',
        toastNoProjectWizard: 'Please enter project name and description first',
        toastNoApiKeyChat: 'Please enter Gemini API Key first',
        toastNoApiKeyWiz: 'Please enter Gemini API Key first',
        toastNoProjectWiz: 'Please enter project name and description',

        // Generating state
        generating: 'Generating...',
        errorPrefix: 'Please check your API Key and try again',
        noResultGemini: 'No result from Gemini. Please try again.',
        emptyResult: 'Empty result. Please try again.',
        retryBtn: 'Retry',

        // COMPAT_RULES reasons
        reasonGASDB: 'GAS supports Google Sheets, Supabase, Firebase via UrlFetchApp (MongoDB/Turso require unsupported drivers)',
        reasonStaticDB: 'Static HTML works directly with Supabase/Firebase, or Google Sheets via GAS API as backend',
        reasonGASCSS: 'GAS supports CDN-based frameworks (Bootstrap/Tailwind/DaisyUI). Shadcn/MUI require React build step',
        reasonGASLang: 'Google Apps Script supports JavaScript only',
        reasonGASAuth: 'GAS supports Firebase Auth / Supabase Auth via client-side JS in HTML template (Clerk requires framework integration)',
        reasonGASAPI: 'GAS supports REST (doGet/doPost) or GraphQL via UrlFetchApp (tRPC requires TypeScript build)',
        reasonGASPkg: 'GAS does not support package managers. Use CDN instead',
        reasonStaticPkg: 'Static HTML recommends using CDN or npm only',
        reasonGASTest: 'GAS has no standard testing framework',
        reasonGASHost: 'GAS must be deployed via Google Apps Script only',
        reasonReactHost: 'React + Vercel recommended to deploy on Vercel',
        reasonNextHost: 'Next.js recommended to deploy on Vercel (full SSR support)',
        reasonVueHost: 'Vue + Netlify recommended to deploy on Netlify',

        // Wizard labels
        wlPlatform: 'Platform', wlDatabase: 'Database', wlCSSFramework: 'CSS Framework',
        wlLanguage: 'Language', wlPageType: 'Page Type', wlPWA: 'PWA',
        wlResponsive: 'Display', wlAuthentication: 'Authentication', wlAPIStyle: 'API Style',
        wlPackageManager: 'Package Manager', wlTesting: 'Testing', wlHosting: 'Hosting',

        // Wizard analysis
        wizFeatures: 'Analyzed Features',
        wizUserTypes: 'User Types',
        wizComplexitySimple: 'Simple',
        wizComplexityModerate: 'Moderate',
        wizComplexityComplex: 'Complex',

        // Chat
        chatGreeting: 'Hello! I\'m an AI Assistant that will analyze your project and create the right prompt for you.',
        chatStart: 'Let\'s begin - What\'s your project name and what does it do?',
        chatQuickStock: 'Inventory Management System',
        chatQuickShop: 'Online Store',
        chatQuickDashboard: 'Data Dashboard',
        chatQuickBooking: 'Appointment Booking System',
        chatAnalyzing: 'AI is analyzing everything and generating prompt...',
        chatGenerating: 'Generating prompt...',
        chatGenerated: 'Prompt generated successfully! Scroll down to see the result.',
        chatError: 'Error: {error}. Please try again.',
        chatConfirm: 'Want to adjust anything? If it looks good, type "ok" or "generate".',
        chatQuickOK: 'OK, generate now',
        chatQuickPlatform: 'Change platform',
        chatQuickDB: 'Change database',
        chatTechRecommended: 'Recommended Tech Stack:',

        // Page names in prompt
        pageNameSingle: 'Single Page',
        pageNameSPA: 'SPA - Single Page Application (multi-page with routing)',
        authNameNone: 'No Authentication',
        pkgNameNone: 'None (CDN)',
        testNameNone: 'No Testing',
    }
};

let currentLang = localStorage.getItem('kp_lang') || 'th';

function t(key, params) {
    let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['th'][key] || key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
    }
    return text;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('kp_lang', lang);
    document.documentElement.lang = lang === 'th' ? 'th' : 'en';
    applyTranslations();
    updateLangToggle();
}

function toggleLanguage() {
    setLanguage(currentLang === 'th' ? 'en' : 'th');
}

function updateLangToggle() {
    const btn = document.getElementById('langToggle');
    if (btn) {
        btn.textContent = currentLang === 'th' ? 'EN' : 'TH';
        btn.title = currentLang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย';
    }
}

function applyTranslations() {
    // Apply all data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.innerHTML = t(key);
    });

    // Apply data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    // Apply data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}
