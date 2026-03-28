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
        pageTypeSingleTitle: 'Single Page',
        pageTypeSpaTitle: 'SPA / Multi-view',
        pageTypeSpaDesc: 'หลายมุมมองหรือหลายหน้า มี routing/client-side state',
        pageTypeSpaGasTitle: 'Multi-view (GAS-friendly)',
        pageTypeSpaGasDesc: 'หลายมุมมองใน HTML เดียว ใช้ Alpine.js หรือ vanilla JS ผ่าน CDN',
        pageTypeGasHint: 'ถ้าเลือก GAS ตัวเลือกนี้หมายถึงหลายมุมมองใน HtmlService หน้าเดียว และใช้ Alpine.js ผ่าน CDN ได้',
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
        authSheetsTitle: 'Sheets Auth',
        authSheetsDesc: 'เก็บ username/password ใน Google Sheets (hash)',
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

        // GAS Wizard
        gasWizardBtn: 'Google Web App Wizard',
        gasWizardBtnDesc: 'สำหรับมือใหม่ GAS — AI ช่วยทุกขั้นตอน',
        gasWizardTitle: 'Google Web App Wizard',
        gasWizStep1Title: 'อธิบายโปรเจกต์ของคุณ',
        gasWizStep2Title: 'ผลวิเคราะห์ + ตั้งค่า GAS',
        gasWizAnalyzeBtn: 'วิเคราะห์โปรเจกต์',
        gasWizSettingsTitle: 'การตั้งค่า GAS (AI เลือกให้แล้ว — แก้ได้)',
        gasWizGenerateBtn: 'Generate Prompt',
        gasWizComplexity: 'ความซับซ้อน',
        gasGuideModeLabel: 'ระดับคำอธิบาย',
        gasGuideBeginnerTitle: 'Beginner',
        gasGuideBeginnerDesc: 'อธิบาย setup, deploy, scopes และจุดพังบ่อยแบบทีละขั้น',
        gasGuideBalancedTitle: 'Balanced',
        gasGuideBalancedDesc: 'กระชับขึ้น แต่ยังมีคำอธิบายพอเข้าใจ',
        gasGuideExpertTitle: 'Expert',
        gasGuideExpertDesc: 'เน้น architecture, limits และ best practices แบบสั้น',
        gasGuideModeHint: 'Hard rules จะถูกใส่อัตโนมัติทุกโหมด ความต่างคือระดับการอธิบายให้คนอ่าน',
        gasUiStyleLabel: 'โทน UI ที่อยากได้',
        gasUiModernTitle: 'Modern',
        gasUiModernDesc: 'ทันสมัย อ่านง่าย ใช้งานทั่วไป',
        gasUiFormalTitle: 'Formal',
        gasUiFormalDesc: 'สุภาพ เหมาะกับองค์กรหรือราชการ',
        gasUiDashboardTitle: 'Dashboard',
        gasUiDashboardDesc: 'เหมาะกับงานหลังบ้าน ตาราง และตัวกรอง',
        gasWorkflowLabel: 'งานที่ระบบควรเน้น',
        gasWorkflowPdfTitle: 'Docs to PDF',
        gasWorkflowPdfDesc: 'Google Docs template + placeholder + export PDF',
        gasWorkflowDriveTitle: 'Drive Sharing',
        gasWorkflowDriveDesc: 'แชร์ไฟล์ จัดการสิทธิ์ และย้ายโฟลเดอร์',
        gasWorkflowBottomNavTitle: 'Bottom Menu',
        gasWorkflowBottomNavDesc: 'เหมาะกับ mobile-first และเมนูหลักไม่เยอะ',
        gasWorkflowSwalTitle: 'Swal.fire',
        gasWorkflowSwalDesc: 'ใช้แจ้งเตือน ยืนยัน และ error modal เป็นค่าเริ่มต้น',
        gasWorkflowHint: 'ถ้าไม่ติ๊ก ระบบยังพยายามเดาจากคำอธิบายโปรเจกต์ให้อัตโนมัติ',
        gasNotifyLabel: 'ช่องทางแจ้งเตือนหลัก',
        gasNotifyNoneTitle: 'ยังไม่ระบุ',
        gasNotifyNoneDesc: 'ให้ระบบเดาจากคำอธิบายงาน หรือไม่ใส่ส่วนแจ้งเตือนถ้าไม่จำเป็น',
        gasNotifyLineTitle: 'LINE Messaging API',
        gasNotifyLineDesc: 'ใช้ LINE Official Account แทน LINE Notify ที่ยุติบริการแล้ว',
        gasNotifyTelegramTitle: 'Telegram Bot',
        gasNotifyTelegramDesc: 'ตั้งค่าง่ายกว่า เหมาะกับระบบภายในหรือเริ่มต้นไว',
        gasNotifyHint: 'ถ้าโจทย์บังคับใช้ LINE ระบบจะเตือนให้ใช้ LINE Messaging API แทน LINE Notify อัตโนมัติ',
        gasAutoRulesLabel: 'กฎที่ระบบจะใส่อัตโนมัติ',
        gasAutoRuleScope: 'กัน AI หลุดไป React, Next.js, Node.js, npm และ import/export',
        gasAutoRuleDate: 'ย้ำเรื่อง Date, timezone และการใช้ Utilities.formatDate()',
        gasAutoRuleZeros: 'เตือนเรื่องเลข 0 นำหน้าหายใน Google Sheets',
        gasAutoRuleDrive: 'เตือนเรื่อง Drive permission, scope และ try/catch',
        gasAutoRuleMultiView: 'ตีความ multi-view บน GAS เป็น HtmlService หน้าเดียว และแนะนำ Alpine.js ผ่าน CDN',
        gasAutoRuleDeploy: 'บังคับแนวคิด doGet/doPost, HtmlService และ google.script.run',

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
        saveBtn: 'บันทึก Prompt',
        saveModalTitle: 'บันทึก Prompt',
        saveModalSubtitle: 'บันทึกลงคอลเล็คชั่นส่วนตัว',
        saveAuthHint: 'กรุณาเข้าสู่ระบบก่อนบันทึก',
        saveAuthCta: 'เข้าสู่ระบบ / สมัครสมาชิก',
        savePromptTitleLabel: 'ชื่อ Prompt',
        savePromptTitlePlaceholder: 'เช่น E-commerce Next.js',
        saveCollectionLabel: 'คอลเล็คชั่น',
        saveCollectionPlaceholder: '— ไม่ระบุ —',
        saveCollectionCreate: 'สร้างใหม่',
        saveCollectionNewLabel: 'ชื่อคอลเล็คชั่นใหม่',
        saveCollectionNewPlaceholder: 'เช่น E-commerce, Portfolio',
        saveCollectionCreateShort: 'สร้าง',
        savePromptSubmit: 'บันทึก',
        savePromptSaving: 'กำลังบันทึก...',
        resultLoading: 'Gemini กำลังสร้าง prompt...',

        // Footer
        footerText: 'KP Prompt Creator &mdash; สร้างด้วย <i class="bi bi-heart-fill"></i> เพื่อชุมชนนักพัฒนาไทย',

        gasWizProjectDescPlaceholder: 'เช่น ระบบบันทึกรายรับรายจ่าย มีฟอร์มกรอกข้อมูล เก็บลง Google Sheets แดชบอร์ดสรุปยอด แจ้งเตือนผ่าน LINE...',

        // Toast messages
        toastCopied: 'คัดลอกแล้ว!',
        toastDownloaded: 'ดาวน์โหลด {fileName} แล้ว!',
        toastApplied: 'ใช้ Tech Stack ที่เลือกแล้ว!',
        toastGenerated: 'สร้าง prompt สำเร็จ!',
        toastNoApiKey: 'กรุณาใส่ Gemini API Key',
        toastNoApiKeyWizard: 'กรุณาใส่ Gemini API Key ก่อนใช้ Wizard',
        toastNoProject: 'กรุณาใส่ชื่อโปรเจกต์',
        toastNoDesc: 'กรุณาอธิบายหลักการทำงาน',
        toastNoProjectWizard: 'กรุณาใส่ชื่อโปรเจกต์และคำอธิบายก่อน',
        toastNoApiKeyChat: 'กรุณาใส่ Gemini API Key ก่อน',
        toastNoApiKeyWiz: 'กรุณาใส่ Gemini API Key ก่อน',
        toastNoProjectWiz: 'กรุณาใส่ชื่อโปรเจกต์และคำอธิบาย',
        toastGasRepaired: 'GAS Guard ปรับ prompt ให้กลับมาอยู่ในกรอบ Google Apps Script แล้ว',
        toastNoPromptToSave: 'ยังไม่มี Prompt ให้บันทึก',
        toastSaveTitleRequired: 'กรุณาตั้งชื่อ Prompt',
        toastCollectionNameRequired: 'กรุณาตั้งชื่อคอลเล็คชั่น',
        toastCollectionCreated: 'สร้างคอลเล็คชั่น "{name}" สำเร็จ!',
        toastCollectionCreateFailed: 'สร้างคอลเล็คชั่นไม่สำเร็จ',
        toastPromptSaved: 'บันทึก Prompt สำเร็จ!',
        toastPromptSaveFailed: 'บันทึก Prompt ไม่สำเร็จ',

        // Generating state
        generating: 'กำลังสร้าง...',
        errorPrefix: 'กรุณาตรวจสอบ API Key และลองใหม่อีกครั้ง',
        noResultGemini: 'ไม่ได้รับผลลัพธ์จาก Gemini กรุณาลองใหม่',
        emptyResult: 'ผลลัพธ์ว่างเปล่า กรุณาลองใหม่',
        retryBtn: 'ลองใหม่',

        // COMPAT_RULES reasons
        reasonGASDB: 'GAS ใช้ Google Sheets, Supabase ได้ผ่าน UrlFetchApp (MongoDB/Turso ต้องการ driver ที่ GAS ไม่รองรับ)',
        reasonStaticDB: 'Static HTML ใช้ Supabase ได้โดยตรง หรือใช้ Google Sheets ผ่าน GAS API เป็น backend',
        reasonGASCSS: 'GAS ใช้ CDN-based framework ได้ (Bootstrap/Tailwind/DaisyUI) ส่วน Shadcn/MUI ต้องมี React build step',
        reasonGASLang: 'Google Apps Script ใช้ JavaScript เท่านั้น',
        reasonGASAuth: 'GAS ใช้ Google Sheets Auth / Supabase Auth ได้ผ่าน client-side JS ใน HTML template (Clerk ต้องการ framework integration)',
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
        pageNameGasMultiView: 'Multi-view ใน HtmlService หน้าเดียว (GAS + Alpine.js/vanilla JS)',
        authNameNone: 'ไม่มี Authentication',
        pkgNameNone: 'ไม่ใช้ (CDN)',
        testNameNone: 'ไม่มี Testing',

        // Project Templates
        stepTemplates: 'เริ่มต้นง่ายๆ ด้วย Template',
        templateHint: 'เลือก template เพื่อกรอกข้อมูลอัตโนมัติ หรือข้ามไปกรอกเอง',
        tplEcommerce: 'เว็บขายของออนไลน์',
        tplEcommerceDesc: 'ร้านค้า ตะกร้าสินค้า ชำระเงิน',
        tplInventory: 'ระบบจัดการสต็อก',
        tplInventoryDesc: 'CRUD สินค้า แดชบอร์ด รายงาน',
        tplPortfolio: 'เว็บ Portfolio',
        tplPortfolioDesc: 'แสดงผลงาน ประวัติ ติดต่อ',
        tplBooking: 'ระบบจองนัดหมาย',
        tplBookingDesc: 'จองคิว ปฏิทิน แจ้งเตือน',
        tplDashboard: 'แดชบอร์ดข้อมูล',
        tplDashboardDesc: 'กราฟ ตาราง สรุปข้อมูล',
        tplBlog: 'เว็บบล็อก / CMS',
        tplBlogDesc: 'เขียนบทความ จัดหมวดหมู่',
        tplGovDocsPdf: 'ระบบฟอร์มราชการ + PDF',
        tplGovDocsPdfDesc: 'Google Docs template แทนค่าแล้ว export PDF',
        tplApprovalFlow: 'ระบบอนุมัติเอกสาร',
        tplApprovalFlowDesc: 'หลายขั้นตอน มีประวัติ และแจ้งเตือนผู้อนุมัติ',
        tplDriveCenter: 'ศูนย์จัดการไฟล์ Drive',
        tplDriveCenterDesc: 'แชร์ไฟล์ ตั้งสิทธิ์ ค้นหา และติดตามการใช้งาน',
        tplApplied: 'ใช้ template "{name}" แล้ว!',

        // Description Helper
        descHelperLabel: 'คลิกเพื่อเพิ่ม:',
        descChipLogin: 'ระบบ login',
        descChipCRUD: 'CRUD ข้อมูล',
        descChipDashboard: 'แดชบอร์ด',
        descChipSearch: 'ค้นหา/กรอง',
        descChipNotify: 'แจ้งเตือน',
        descChipExport: 'Export Excel/PDF',
        descChipUpload: 'อัปโหลดไฟล์',
        descChipMultilang: 'หลายภาษา',
        descChipLineTelegram: 'LINE/Telegram',
        descChipAlpine: 'Multi-view + Alpine.js',

        // Usage Guide
        guideTitle: 'เอาไปใช้ยังไง?',
        guideClaude1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideClaude2: 'บันทึกเป็นไฟล์ <code>CLAUDE.md</code> ไว้ใน root ของโปรเจกต์',
        guideClaude3: 'เปิด terminal แล้วพิมพ์ <code>claude</code> เพื่อเริ่ม Claude Code',
        guideClaude4: 'Claude จะอ่านไฟล์ CLAUDE.md แล้วเข้าใจโปรเจกต์ของคุณอัตโนมัติ',
        guideGemini1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideGemini2: 'บันทึกเป็นไฟล์ <code>GEMINI.md</code> ไว้ใน root ของโปรเจกต์',
        guideGemini3: 'เปิด terminal แล้วพิมพ์ <code>gemini</code> เพื่อเริ่ม Gemini CLI',
        guideGemini4: 'Gemini จะอ่านไฟล์แล้วเข้าใจโปรเจกต์ของคุณ',
        guideCursor1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideCursor2: 'บันทึกเป็นไฟล์ <code>.cursorrules</code> ไว้ใน root ของโปรเจกต์',
        guideCursor3: 'เปิดโปรเจกต์ด้วย Cursor Editor',
        guideCursor4: 'Cursor จะอ่าน .cursorrules แล้วช่วยเขียนโค้ดตามที่กำหนด',
        guideCopilot1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideCopilot2: 'บันทึกเป็น <code>.github/copilot-instructions.md</code>',
        guideCopilot3: 'เปิดโปรเจกต์ด้วย VS Code ที่มี GitHub Copilot',
        guideCopilot4: 'Copilot จะอ่านคำสั่งแล้วช่วยเขียนโค้ดตามที่กำหนด',
        guideCodex1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideCodex2: 'บันทึกเป็นไฟล์ <code>AGENTS.md</code> ไว้ใน root ของโปรเจกต์',
        guideCodex3: 'เปิด terminal แล้วพิมพ์ <code>codex</code> เพื่อเริ่ม Codex CLI',
        guideCodex4: 'Codex จะอ่าน AGENTS.md แล้วทำงานตามคำสั่ง',
        guideWindsurf1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideWindsurf2: 'บันทึกเป็นไฟล์ <code>.windsurfrules</code> ไว้ใน root ของโปรเจกต์',
        guideWindsurf3: 'เปิดโปรเจกต์ด้วย Windsurf Editor',
        guideWindsurf4: 'Windsurf จะอ่าน .windsurfrules แล้วช่วยเขียนโค้ดตามที่กำหนด',
        guideOther1: 'คัดลอกหรือดาวน์โหลดไฟล์ด้านบน',
        guideOther2: 'บันทึกเป็นไฟล์ <code>AI_INSTRUCTIONS.md</code> ไว้ใน root ของโปรเจกต์',
        guideOther3: 'เปิด AI tool ของคุณแล้ววางเนื้อหาไฟล์ หรือชี้ไปที่ไฟล์นี้',
        guideOther4: 'AI จะเข้าใจโปรเจกต์ของคุณแล้วช่วยสร้างตามคำสั่ง',
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
        pageTypeSingleTitle: 'Single Page',
        pageTypeSpaTitle: 'SPA / Multi-view',
        pageTypeSpaDesc: 'Multiple views or pages with routing/client-side state',
        pageTypeSpaGasTitle: 'Multi-view (GAS-friendly)',
        pageTypeSpaGasDesc: 'Multiple views inside one HTML file using Alpine.js or vanilla JS via CDN',
        pageTypeGasHint: 'For GAS, this means multiple views inside one HtmlService page, not a React-style SPA.',
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
        authSheetsTitle: 'Sheets Auth',
        authSheetsDesc: 'Store username/password in Google Sheets (hashed)',
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

        // GAS Wizard
        gasWizardBtn: 'Google Web App Wizard',
        gasWizardBtnDesc: 'For GAS beginners — AI guides every step',
        gasWizardTitle: 'Google Web App Wizard',
        gasWizStep1Title: 'Describe your project',
        gasWizStep2Title: 'Analysis + GAS Settings',
        gasWizAnalyzeBtn: 'Analyze project',
        gasWizSettingsTitle: 'GAS Settings (AI pre-selected — editable)',
        gasWizGenerateBtn: 'Generate Prompt',
        gasWizComplexity: 'Complexity',
        gasGuideModeLabel: 'Explanation level',
        gasGuideBeginnerTitle: 'Beginner',
        gasGuideBeginnerDesc: 'Explain setup, deploy, scopes, and common failure points step by step',
        gasGuideBalancedTitle: 'Balanced',
        gasGuideBalancedDesc: 'More concise, but still easy to follow',
        gasGuideExpertTitle: 'Expert',
        gasGuideExpertDesc: 'Focus on architecture, limits, and best practices',
        gasGuideModeHint: 'Hard rules are always injected. This only changes how much the prompt explains.',
        gasUiStyleLabel: 'Preferred UI style',
        gasUiModernTitle: 'Modern',
        gasUiModernDesc: 'Clean, current, and easy to use',
        gasUiFormalTitle: 'Formal',
        gasUiFormalDesc: 'Suitable for office or government workflows',
        gasUiDashboardTitle: 'Dashboard',
        gasUiDashboardDesc: 'Great for backoffice tables, filters, and summaries',
        gasWorkflowLabel: 'Workflows to emphasize',
        gasWorkflowPdfTitle: 'Docs to PDF',
        gasWorkflowPdfDesc: 'Google Docs template + placeholder replacement + PDF export',
        gasWorkflowDriveTitle: 'Drive Sharing',
        gasWorkflowDriveDesc: 'Sharing files, permissions, and folder movement',
        gasWorkflowBottomNavTitle: 'Bottom Menu',
        gasWorkflowBottomNavDesc: 'Useful for mobile-first apps with few main actions',
        gasWorkflowSwalTitle: 'Swal.fire',
        gasWorkflowSwalDesc: 'Use it as the default for alerts, confirms, and errors',
        gasWorkflowHint: 'If you do not check these, the generator still tries to infer them from your project description.',
        gasNotifyLabel: 'Primary notification channel',
        gasNotifyNoneTitle: 'Not specified yet',
        gasNotifyNoneDesc: 'Let the generator infer it from the project description, or skip notification guidance entirely',
        gasNotifyLineTitle: 'LINE Messaging API',
        gasNotifyLineDesc: 'Use a LINE Official Account instead of deprecated LINE Notify',
        gasNotifyTelegramTitle: 'Telegram Bot',
        gasNotifyTelegramDesc: 'Simpler setup, good for internal tools or fast rollout',
        gasNotifyHint: 'If the project requires LINE, the generator will automatically steer the prompt to LINE Messaging API instead of LINE Notify.',
        gasAutoRulesLabel: 'Rules injected automatically',
        gasAutoRuleScope: 'Prevents drift into React, Next.js, Node.js, npm, and import/export',
        gasAutoRuleDate: 'Reinforces Date, timezone, and Utilities.formatDate() handling',
        gasAutoRuleZeros: 'Protects leading zeros in Google Sheets',
        gasAutoRuleDrive: 'Warns about Drive permissions, scopes, and try/catch usage',
        gasAutoRuleMultiView: 'Treats multi-view on GAS as one HtmlService page and recommends Alpine.js via CDN',
        gasAutoRuleDeploy: 'Enforces doGet/doPost, HtmlService, and google.script.run patterns',

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
        saveBtn: 'Save Prompt',
        saveModalTitle: 'Save Prompt',
        saveModalSubtitle: 'Save it to your personal collection',
        saveAuthHint: 'Please sign in before saving',
        saveAuthCta: 'Sign in / Register',
        savePromptTitleLabel: 'Prompt title',
        savePromptTitlePlaceholder: 'e.g. E-commerce Next.js',
        saveCollectionLabel: 'Collection',
        saveCollectionPlaceholder: '— Unassigned —',
        saveCollectionCreate: 'Create new',
        saveCollectionNewLabel: 'New collection name',
        saveCollectionNewPlaceholder: 'e.g. E-commerce, Portfolio',
        saveCollectionCreateShort: 'Create',
        savePromptSubmit: 'Save',
        savePromptSaving: 'Saving...',
        resultLoading: 'Gemini is generating prompt...',

        // Footer
        footerText: 'KP Prompt Creator &mdash; Made with <i class="bi bi-heart-fill"></i> for the developer community',

        gasWizProjectDescPlaceholder: 'e.g. Income/expense tracker with form, Google Sheets storage, summary dashboard, LINE notifications...',

        // Toast messages
        toastCopied: 'Copied!',
        toastDownloaded: '{fileName} downloaded!',
        toastApplied: 'Applied selected Tech Stack!',
        toastGenerated: 'Prompt generated successfully!',
        toastNoApiKey: 'Please enter Gemini API Key',
        toastNoApiKeyWizard: 'Please enter Gemini API Key before using the wizard',
        toastNoProject: 'Please enter a project name',
        toastNoDesc: 'Please describe how it works',
        toastNoProjectWizard: 'Please enter project name and description first',
        toastNoApiKeyChat: 'Please enter Gemini API Key first',
        toastNoApiKeyWiz: 'Please enter Gemini API Key first',
        toastNoProjectWiz: 'Please enter project name and description',
        toastGasRepaired: 'GAS Guard rewrote the prompt to stay inside Google Apps Script patterns.',
        toastNoPromptToSave: 'There is no prompt to save yet.',
        toastSaveTitleRequired: 'Please enter a prompt title.',
        toastCollectionNameRequired: 'Please enter a collection name.',
        toastCollectionCreated: 'Created collection "{name}" successfully!',
        toastCollectionCreateFailed: 'Failed to create collection.',
        toastPromptSaved: 'Prompt saved successfully!',
        toastPromptSaveFailed: 'Failed to save prompt.',

        // Generating state
        generating: 'Generating...',
        errorPrefix: 'Please check your API Key and try again',
        noResultGemini: 'No result from Gemini. Please try again.',
        emptyResult: 'Empty result. Please try again.',
        retryBtn: 'Retry',

        // COMPAT_RULES reasons
        reasonGASDB: 'GAS supports Google Sheets, Supabase via UrlFetchApp (MongoDB/Turso require unsupported drivers)',
        reasonStaticDB: 'Static HTML works directly with Supabase, or Google Sheets via GAS API as backend',
        reasonGASCSS: 'GAS supports CDN-based frameworks (Bootstrap/Tailwind/DaisyUI). Shadcn/MUI require React build step',
        reasonGASLang: 'Google Apps Script supports JavaScript only',
        reasonGASAuth: 'GAS supports Google Sheets Auth / Supabase Auth via client-side JS in HTML template (Clerk requires framework integration)',
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
        pageNameGasMultiView: 'Multi-view in one HtmlService page (GAS + Alpine.js/vanilla JS)',
        authNameNone: 'No Authentication',
        pkgNameNone: 'None (CDN)',
        testNameNone: 'No Testing',

        // Project Templates
        stepTemplates: 'Quick Start with Templates',
        templateHint: 'Choose a template to auto-fill, or skip and fill manually',
        tplEcommerce: 'Online Store',
        tplEcommerceDesc: 'Shop, cart, checkout, payments',
        tplInventory: 'Inventory System',
        tplInventoryDesc: 'Product CRUD, dashboard, reports',
        tplPortfolio: 'Portfolio Website',
        tplPortfolioDesc: 'Showcase work, profile, contact',
        tplBooking: 'Booking System',
        tplBookingDesc: 'Appointments, calendar, reminders',
        tplDashboard: 'Data Dashboard',
        tplDashboardDesc: 'Charts, tables, data summary',
        tplBlog: 'Blog / CMS',
        tplBlogDesc: 'Write articles, categories',
        tplGovDocsPdf: 'Government Form + PDF',
        tplGovDocsPdfDesc: 'Google Docs template with placeholder replacement and PDF export',
        tplApprovalFlow: 'Document Approval Flow',
        tplApprovalFlowDesc: 'Multi-step approval with history and reviewer notifications',
        tplDriveCenter: 'Drive File Center',
        tplDriveCenterDesc: 'File sharing, permissions, search, and activity tracking',
        tplApplied: 'Applied "{name}" template!',

        // Description Helper
        descHelperLabel: 'Click to add:',
        descChipLogin: 'Login system',
        descChipCRUD: 'Data CRUD',
        descChipDashboard: 'Dashboard',
        descChipSearch: 'Search/Filter',
        descChipNotify: 'Notifications',
        descChipExport: 'Export Excel/PDF',
        descChipUpload: 'File upload',
        descChipMultilang: 'Multi-language',
        descChipLineTelegram: 'LINE/Telegram',
        descChipAlpine: 'Multi-view + Alpine.js',

        // Usage Guide
        guideTitle: 'How to use this?',
        guideClaude1: 'Copy or download the file above',
        guideClaude2: 'Save as <code>CLAUDE.md</code> in your project root',
        guideClaude3: 'Open terminal and type <code>claude</code> to start Claude Code',
        guideClaude4: 'Claude will read CLAUDE.md and understand your project automatically',
        guideGemini1: 'Copy or download the file above',
        guideGemini2: 'Save as <code>GEMINI.md</code> in your project root',
        guideGemini3: 'Open terminal and type <code>gemini</code> to start Gemini CLI',
        guideGemini4: 'Gemini will read the file and understand your project',
        guideCursor1: 'Copy or download the file above',
        guideCursor2: 'Save as <code>.cursorrules</code> in your project root',
        guideCursor3: 'Open your project with Cursor Editor',
        guideCursor4: 'Cursor will read .cursorrules and code according to your spec',
        guideCopilot1: 'Copy or download the file above',
        guideCopilot2: 'Save as <code>.github/copilot-instructions.md</code>',
        guideCopilot3: 'Open your project with VS Code + GitHub Copilot',
        guideCopilot4: 'Copilot will read the instructions and code accordingly',
        guideCodex1: 'Copy or download the file above',
        guideCodex2: 'Save as <code>AGENTS.md</code> in your project root',
        guideCodex3: 'Open terminal and type <code>codex</code> to start Codex CLI',
        guideCodex4: 'Codex will read AGENTS.md and follow the instructions',
        guideWindsurf1: 'Copy or download the file above',
        guideWindsurf2: 'Save as <code>.windsurfrules</code> in your project root',
        guideWindsurf3: 'Open your project with Windsurf Editor',
        guideWindsurf4: 'Windsurf will read .windsurfrules and code accordingly',
        guideOther1: 'Copy or download the file above',
        guideOther2: 'Save as <code>AI_INSTRUCTIONS.md</code> in your project root',
        guideOther3: 'Open your AI tool and paste the content, or point it to this file',
        guideOther4: 'The AI will understand your project and build accordingly',
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

    if (typeof refreshGasModeCopy === 'function') {
        refreshGasModeCopy();
    }
}
