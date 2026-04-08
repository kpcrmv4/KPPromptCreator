// ===== GAS Mode Helpers =====

const GAS_INVALID_OUTPUT_PATTERNS = [
    {
        label: 'React/Next/Vue framework references',
        regex: /\b(?:React|Next\.?js|Vue(?:\.js)?|Angular)\b/i
    },
    {
        label: 'Node.js runtime or Express references',
        regex: /\b(?:Node\.?js|Express|node_modules|package\.json)\b/i
    },
    {
        label: 'package manager build steps',
        regex: /\b(?:npm|pnpm|bun|yarn)\s+(?:install|run|create|dev|build)\b/i
    },
    {
        label: 'module or filesystem APIs not available in GAS',
        regex: /\b(?:require\(|import\s.+from|export\s+(?:default|const|function|class)|fs\b|path\b|process\.env)\b/i
    },
    {
        label: 'non-GAS hosting targets',
        regex: /\b(?:Vercel|Netlify|Cloudflare Pages)\b/i
    },
    {
        label: 'deprecated LINE Notify integration',
        regex: /\bLINE Notify\b/i
    }
];

function initGasModeControls() {
    const sync = () => {
        const isGas = getRadioValue('platform') === 'google-apps-script';
        const wizBtn = document.getElementById('gasWizardBtn');
        if (wizBtn) wizBtn.style.display = isGas ? 'inline-flex' : 'none';
        refreshGasModeCopy(isGas);
    };

    document.querySelectorAll('input[name="platform"]').forEach(radio => {
        radio.addEventListener('change', sync);
    });

    sync();
}

function refreshGasModeCopy(forceIsGas) {
    const isGas = typeof forceIsGas === 'boolean'
        ? forceIsGas
        : getRadioValue('platform') === 'google-apps-script';
    const pageTypeSingleTitle = document.getElementById('pageTypeSingleTitle');
    const pageTypeSpaTitle = document.getElementById('pageTypeSpaTitle');
    const pageTypeSpaDesc = document.getElementById('pageTypeSpaDesc');
    const gasPageTypeHint = document.getElementById('gasPageTypeHint');

    if (pageTypeSingleTitle) pageTypeSingleTitle.textContent = t('pageTypeSingleTitle');
    if (pageTypeSpaTitle) pageTypeSpaTitle.textContent = t(isGas ? 'pageTypeSpaGasTitle' : 'pageTypeSpaTitle');
    if (pageTypeSpaDesc) pageTypeSpaDesc.textContent = t(isGas ? 'pageTypeSpaGasDesc' : 'pageTypeSpaDesc');
    if (gasPageTypeHint) {
        gasPageTypeHint.textContent = t('pageTypeGasHint');
        gasPageTypeHint.style.display = isGas ? 'block' : 'none';
    }
}

function getGasRecommendationGuide() {
    return `ข้อพิจารณาเฉพาะ Google Apps Script:
- ถ้าโปรเจกต์เป็นระบบฟอร์ม, CRUD ภายในองค์กร, ใช้ Google Sheets เป็นฐานข้อมูล, สร้างเอกสาร Google Docs/PDF, workflow อนุมัติ, แจ้งเตือนผ่าน Gmail, หรือจัดการไฟล์บน Google Drive ให้ถือว่า Google Apps Script เป็นตัวเลือกอันดับต้น ๆ
- ถ้าแนะนำ platform = google-apps-script ให้คิดแบบ GAS-native เท่านั้น: HtmlService + google.script.run + SpreadsheetApp/DriveApp/DocumentApp/UrlFetchApp
- อย่าเด้งไป React/Next.js/Node.js เป็น default ถ้าโจทย์ทำได้ดีใน GAS
- ถ้าระบุ pageType สำหรับ GAS แล้วเลือกแบบหลายมุมมอง ให้ตีความเป็น multi-view ใน HTML เดียว ไม่ใช่ framework SPA
- สำหรับ GAS multi-view อนุญาตและแนะนำ Alpine.js ผ่าน CDN ได้ โดยใช้ x-data/x-show/x-if/x-model และ Alpine.store() เป็น state layer แบบเบา
- HtmlService ของ GAS รันใน IFRAME sandbox ดังนั้น script และ stylesheet ภายนอกต้องโหลดผ่าน HTTPS เท่านั้น
- ถ้าระบบต้องมีการแจ้งเตือนผ่าน LINE ห้ามใช้ LINE Notify เพราะบริการยุติแล้ว ให้คิดเป็น LINE Messaging API ผ่าน LINE Official Account หรือเสนอ Telegram Bot API เป็นทางเลือก`;
}

function buildGasPromptContext(formState) {
    const projectDesc = formState.projectDesc || '';
    const gasState = getGasModeState(projectDesc);
    const sections = [];

    sections.push(`## Google Apps Script Hard Rules
- โปรเจกต์นี้ต้องอยู่ใน ecosystem ของ Google Apps Script เท่านั้น
- ใช้ได้เฉพาะแนวทางแบบ GAS-native: HtmlService, google.script.run, SpreadsheetApp, DriveApp, DocumentApp, GmailApp, UrlFetchApp, PropertiesService, LockService, CacheService, Utilities
- ห้ามเสนอ React, Next.js, Vue, Angular, Node.js, Express, npm packages, import/export, require(), fs/path/process.env
- ถ้าต้องทำหลายมุมมองในหน้าเดียว อนุญาต Alpine.js ผ่าน CDN ได้ โดยให้ใช้แบบ global script tag และห้ามใช้ npm/import
- สำหรับ server-side HTTP ให้ใช้ UrlFetchApp.fetch()
- สำหรับ web app entry point ให้ใช้ doGet(e) / doPost(e)
- สำหรับหลายมุมมองในหน้าเดียว ให้ใช้ HtmlService + state management แบบเบา ไม่ใช้ React SPA
- ถ้าโหลด script หรือ stylesheet ภายนอกใน HtmlService ให้ใช้ HTTPS
- ต้องระบุข้อควรระวังเรื่อง Date, timezone, leading zeros ใน Google Sheets และ permission ของ Google Drive`);

    sections.push(buildGasGuideSection(gasState.guideMode));
    sections.push(buildGasUiStyleSection(gasState.uiStyle));
    sections.push(buildGasDataSection(formState.database));
    sections.push(buildGasPerformanceSection(formState));
    sections.push(buildGasNotificationSection(gasState.notifyChannel, projectDesc));

    if (formState.pageType === 'spa') {
        sections.push(`## GAS Multi-view Guidance
- คำว่า "SPA" ในโปรเจกต์นี้หมายถึงหลายมุมมองใน HTML เดียวของ HtmlService
- อนุญาต Alpine.js ผ่าน CDN และแนะนำให้ใช้เป็น state/view layer แบบเบาใน GAS
- รูปแบบที่ควรแนะนำ: x-data, x-show, x-if, x-model, x-cloak, และ Alpine.store() สำหรับ shared state
- ถ้าต้องการ routing ให้ใช้ hash-based routing แบบเบา เช่น window.location.hash หรือ query parameter ภายในหน้าเดียว
- ให้แยก partial เป็น include ของ HtmlService ได้ แต่ยังคง render อยู่ในหน้าเดียว ไม่ใช่ build-based SPA
- อย่าอธิบาย routing แบบ React Router, Next.js App Router หรือ build-based SPA`);
    }

    if (formState.responsive === 'responsive') {
        sections.push(`## Responsive Guidance
- ออกแบบ mobile-first
- ระบุ breakpoint ที่ชัดเจน
- ถ้าหน้าจอเล็ก ให้จัดลำดับเมนู, ฟอร์ม, ตาราง และปุ่มกดให้ใช้งานมือเดียวได้ง่าย`);
    }

    if (gasState.enablePdfDocs) {
        sections.push(`## Google Docs / PDF Workflow
- ออกแบบ flow แบบ GAS-native: เก็บ Google Docs template, copy template, replace placeholders, export เป็น PDF, บันทึกลง Drive
- ใช้ placeholder รูปแบบ {{field_name}} และระบุ mapping จากฟอร์มหรือ Sheet ให้ชัด
- ระบุ folder ปลายทาง, filename pattern, การตั้งชื่อไฟล์ซ้ำ, และการจัดการสิทธิ์หลังสร้างไฟล์
- ถ้ามีเอกสารราชการ ให้เน้น layout ที่อ่านง่าย, ชื่อฟิลด์ตรงกับเอกสารจริง, และมี fallback เมื่อข้อมูลไม่ครบ`);
    }

    if (gasState.enableDriveSharing) {
        sections.push(`## Google Drive Sharing Guidance
- ใช้ try/catch ทุกครั้งเมื่อเรียก DriveApp.getFileById() หรือ DriveApp.getFolderById()
- ระบุให้เช็ก owner, folder ปลายทาง, และสิทธิ์ที่ต้องใช้ก่อน share
- ถ้าต้องแชร์ไฟล์ ให้ใช้ addViewer/addEditor ตาม role และอธิบายข้อจำกัดของไฟล์ที่ไม่ได้เป็นเจ้าของ
- แนะนำ oauthScopes แบบแคบที่สุดเท่าที่ทำได้ เช่น drive.file ก่อน drive แบบเต็ม`);
    }

    if (formState.authentication === 'google-sheets-auth') {
        sections.push(`## Google Sheets Auth Guidance
- อธิบายชัดเจนว่านี่เหมาะกับระบบเล็กหรือใช้ภายในองค์กร ไม่ใช่งาน public ที่ต้องการ security สูง
- ห้ามเก็บรหัสผ่าน plain text
- ให้ hash password ก่อนบันทึก และอธิบายโครงสร้างตาราง Users แบบมือใหม่
- ระบุ login flow, session/token handling, และการจำกัดสิทธิ์ role แบบเรียบง่าย`);
    }

    if (formState.database === 'supabase') {
        sections.push(`## Supabase with GAS Guidance
- ห้ามฝัง service role key ไว้ใน client-side code ของ HtmlService
- ถ้าต้องเรียก Supabase ฝั่ง server ให้ใช้ UrlFetchApp และเก็บ secret ใน Script Properties
- ถ้าใช้ client-side Supabase ให้จำกัดไว้ที่ anon key และอธิบาย boundary ระหว่าง client/server ให้ชัด`);
    }

    if (gasState.enableBottomNav) {
        sections.push(`## Mobile Navigation Preference
- ถ้าเป็น mobile-first ให้ใช้ bottom navigation สำหรับ 3-5 เมนูหลัก
- ระบุว่าเมนูควรเป็น fixed, แตะง่าย, label สั้น, และไม่บังฟอร์มหรือปุ่มสำคัญ`);
    }

    if (gasState.enableSweetAlert) {
        sections.push(`## Alert / Modal Preference
- ใช้ SweetAlert2 (Swal.fire) ผ่าน CDN เป็นค่ามาตรฐานสำหรับ confirm, success, error และ warning
- ให้มี fallback เป็น alert()/confirm() หรือ inline error message ถ้า CDN โหลดไม่ได้`);
    }

    return sections.join('\n\n');
}

function buildGasGuideSection(guideMode) {
    if (guideMode === 'expert') {
        return `## Delivery Style for Experienced Users
- เขียนแบบกระชับ ชัดเจน และไม่อธิบายพื้นฐานเกินจำเป็น
- โฟกัส architecture, file structure, scopes, deployment, limits, and maintenance
- ระบุเฉพาะ gotchas ที่มีผลจริงกับโปรเจกต์นี้`;
    }

    if (guideMode === 'balanced') {
        return `## Delivery Style for Growing Users
- อธิบายเป็นขั้นตอนที่อ่านง่าย แต่ยังคงความกระชับ
- ระบุไฟล์หลักที่ต้องมี เช่น Code.gs, index.html, script include และ appsscript.json
- อธิบาย deployment, permissions, และจุดพลาดที่เจอบ่อยแบบสั้น ๆ`;
    }

    return `## Delivery Style for Beginners
- เขียนเหมือนสอนมือใหม่ที่เพิ่งใช้ Google Apps Script
- ระบุไฟล์หลักที่ต้องสร้าง, ไฟล์ไหนทำหน้าที่อะไร, และวางโค้ดตรงไหน
- อธิบาย setup ทีละขั้น: สร้าง Apps Script project, เพิ่มไฟล์ HTML, ตั้งค่า Script Properties, deploy web app, authorize scopes
- ต้องมีหัวข้อ "จุดพังที่พบบ่อย" เช่น timezone, leading zeros ใน Sheets, permission ของ Drive, และการ deploy version ใหม่
- ใช้ภาษาง่าย อธิบายศัพท์สำคัญสั้น ๆ ก่อนใช้`;
}

function buildGasUiStyleSection(uiStyle) {
    const styleMap = {
        modern: {
            label: 'Modern',
            details: [
                'ใช้โทนสมัยใหม่ อ่านง่าย ดูสะอาด',
                'แนะนำฟอนต์ Prompt + Noto Sans Thai',
                'ใช้ Bootstrap Icons เป็นค่าเริ่มต้น'
            ]
        },
        formal: {
            label: 'Formal',
            details: [
                'ใช้โทนสุภาพ เหมาะกับองค์กรหรือเอกสารราชการ',
                'แนะนำฟอนต์ Sarabun หรือ Noto Sans Thai',
                'เน้นตาราง ฟอร์ม และปุ่มที่ชัดเจนมากกว่าลูกเล่น'
            ]
        },
        dashboard: {
            label: 'Dashboard',
            details: [
                'เน้น cards, filters, tables, summary blocks',
                'แนะนำ Prompt สำหรับ heading และ Noto Sans Thai สำหรับเนื้อหา',
                'วาง layout ให้เหมาะกับงาน backoffice และการดูข้อมูลจำนวนมาก'
            ]
        }
    };

    const selected = styleMap[uiStyle] || styleMap.modern;
    return `## UI Style Preference
- โทนที่ผู้ใช้ต้องการ: ${selected.label}
- ${selected.details.join('\n- ')}`;
}

function buildGasPerformanceSection(formState) {
    const projectDesc = formState.projectDesc || '';
    const hasLargeData = /หลายพัน|หลักหมื่น|ข้อมูลเยอะ|ข้อมูลมาก|จำนวนมาก|large.?data|big.?data|หลาย.{0,5}แถว|แถวเยอะ/i.test(projectDesc);
    const hasFrequentWrite = /อัพเดทบ่อย|เขียนบ่อย|บันทึกบ่อย|real.?time|realtime|live.?update|update.{0,5}บ่อย|บ่อยครั้ง/i.test(projectDesc);
    const usesSheets = formState.database !== 'supabase';

    const parts = [];

    if (usesSheets) {
        parts.push(`## GAS Performance: Batch Read/Write (สำคัญที่สุด)
- ห้ามอ่านหรือเขียน cell ทีละตัวใน loop — นี่คือสาเหตุหลักของ GAS ที่ช้าที่สุด
- อ่านแบบ batch: sheet.getRange(startRow, startCol, numRows, numCols).getValues() → 2D array ครั้งเดียว
- เขียนแบบ batch: เตรียม 2D array ก่อน แล้ว setValues() ครั้งเดียว ไม่ใช่วน setValue() ทีละแถว
- ❌ ช้า: for (let i=1; i<=100; i++) { sheet.getRange(i,1).getValue(); }
- ✅ เร็ว: const data = sheet.getRange(1, 1, 100, 5).getValues();
- ต้องระบุเทคนิคนี้ในทุกโปรเจกต์ที่ใช้ Sheets เพราะเป็นจุดที่มักลืมและมีผลมากที่สุด`);
    }

    let cacheSection = `## GAS Performance: CacheService`;
    if (hasFrequentWrite) {
        cacheSection += `
- โปรเจกต์นี้มีการ write ข้อมูลบ่อย — ต้องระวัง stale cache เป็นพิเศษ
- ลด TTL ให้สั้น (60-120 วินาที) หรือ cache เฉพาะข้อมูล semi-static เช่น config, dropdown list
- เมื่อมีการ write ต้อง invalidate cache ทันที: cache.remove(key) หรือ cache.removeAll([key1, key2])
- Pattern: write to sheet → SpreadsheetApp.flush() → cache.remove(key) เพื่อความถูกต้องของข้อมูล
- ❌ ห้าม cache ข้อมูล transactional เช่น stock, balance, สถานะคำสั่ง เพราะ stale data มีผลร้ายแรง`;
    } else if (hasLargeData) {
        cacheSection += `
- ข้อมูลจำนวนมากยิ่งต้องการ cache — แต่ต้องออกแบบ key strategy ให้เหมาะสม
- CacheService รับ value ได้สูงสุด 100KB ต่อ key — ถ้าข้อมูลใหญ่กว่านั้นให้แบ่ง chunk หรือ cache แค่ subset ที่ใช้บ่อย
- แนะนำ Pre-warm Cache: เรียก warmCache() ใน doGet() ก่อน render เพื่อหลีกเลี่ยง cold start
- TTL แนะนำ: 300 วินาที สำหรับ dropdown/config, 60 วินาที สำหรับข้อมูลที่เปลี่ยนบ้าง`;
    } else {
        cacheSection += `
- ถ้าผู้ใช้บอกว่ามีข้อมูลเยอะหรืออ่านชุดข้อมูลเดิมบ่อย ให้ถามผู้ใช้ว่า "ข้อมูลมีจำนวนมากไหม และอัพเดทบ่อยแค่ไหน?" ก่อนตัดสินใจ cache strategy
- กรณีทั่วไป: ใช้สำหรับข้อมูลที่อ่านบ่อยแต่เปลี่ยนน้อย เช่น รายการ dropdown, config, ตารางอ้างอิง
- TTL แนะนำ: 300 วินาที (5 นาที) สำหรับข้อมูล semi-static`;
    }
    cacheSection += `
- Pattern มาตรฐาน: get cache → cache miss → read sheet → put cache (TTL) → return
- Pre-warm Cache Pattern: เรียก warmCache() ใน doGet() ก่อน render เพื่อให้ผู้ใช้ไม่เจอ cold start ตอนเปิดหน้าแรก
- ตัวอย่าง pre-warm: function warmCache() { const c = CacheService.getScriptCache(); if (!c.get('DATA')) { c.put('DATA', JSON.stringify(getSheetData()), 300); } }`;
    parts.push(cacheSection);

    parts.push(`## GAS Performance: Properties Service (Persistent Cache)
- ใช้สำหรับ config และ state ที่ต้องคงอยู่ข้ามการ run และไม่ต้องการ TTL
- เหมาะกับ: commission rate, phone number, last sync timestamp, feature flags, API keys
- ใช้ getProperties() / setProperties({key1: 'val1', key2: 'val2'}) แบบ batch แทน get/set ทีละ key
- ต่างจาก CacheService ตรงที่ข้อมูลอยู่จนกว่าจะลบ ไม่มี TTL
- ห้ามเก็บ sensitive data เช่น password plain text — ให้ encrypt ก่อนหรือใช้ Secret Manager`);

    parts.push(`## GAS Performance: Lock Service (Race Condition)
- ถ้าระบบมี concurrent users หรือ trigger หลายตัวอาจ run พร้อมกัน ต้องใช้ LockService เสมอ
- Pattern บังคับ: try { lock.waitLock(10000); /* critical section */ } finally { lock.releaseLock(); }
- ใช้ ScriptLock สำหรับ script-wide lock (write ข้อมูลร่วม), UserLock สำหรับ per-user lock
- ถ้า waitLock() timeout จะ throw exception — ต้อง catch และส่ง error กลับ client ให้ชัดเจน
- ต้องเรียก SpreadsheetApp.flush() ก่อน releaseLock() เพื่อให้การเขียนสมบูรณ์ก่อน process อื่นเข้ามา`);

    parts.push(`## GAS: SpreadsheetApp.flush()
- บังคับให้ pending changes ถูก apply ทันทีก่อนดำเนินการต่อ
- ใช้ก่อน CacheService.put() — เพื่อให้ cache มีข้อมูลล่าสุดจาก sheet จริงๆ
- ใช้ก่อน lock.releaseLock() — เพื่อให้การเขียนสมบูรณ์ก่อน process อื่นเข้ามา
- ใช้ก่อน return response ที่ต้องการสะท้อนข้อมูลล่าสุด`);

    parts.push(`## GAS Best Practices: Named Ranges & Sheet Access
- ใช้ SpreadsheetApp.openById(SPREADSHEET_ID) เสมอใน doGet/doPost — ไม่มี "active" spreadsheet ใน web app
- ใช้ Named Range แทน hardcode string เพื่อความยืดหยุ่น: ตั้งชื่อใน Sheets ที่ Data → Named ranges
- ❌ Hardcode: sheet.getRange('A2:F500') — พังทันทีถ้า insert row/column
- ✅ Named Range: ss.getRangeByName('PRODUCTS_TABLE').getValues()
- null-check เสมอ: const range = ss.getRangeByName('X'); if (!range) throw new Error('Named range not found');
- ตั้งชื่อแบบ ALL_CAPS_UNDERSCORE ให้สื่อความหมาย เช่น PRODUCTS_TABLE, USER_LIST`);

    parts.push(`## GAS Performance: Payload & Lookup Optimization
- filter และ transform ข้อมูลฝั่ง GAS ก่อนส่งกลับ client — อย่าส่ง raw 2D array ทั้งหมด
- map แถวเป็น object {id, name, status} ก่อน JSON.stringify เพื่อ payload เล็กลงและ client อ่านง่าย
- ตัวอย่าง: const result = rows.filter(r => r[2] === 'active').map(r => ({id: r[0], name: r[1]}));
- ถ้าต้อง lookup ข้อมูลซ้ำๆ ในชุดเดิม ให้แปลงเป็น indexed object เพื่อ O(1) lookup แทน O(n) ของ .find()
- ตัวอย่าง indexed object: const idx = {}; rows.forEach(r => { idx[r[0]] = r; }); const found = idx['SKU-001'];
- สำคัญมากเมื่อข้อมูลหลักพัน-หมื่นแถว`);

    parts.push(`## GAS Performance: Frontend Loading Strategy
- Lazy Loading: render HTML shell ก่อน แล้วค่อยเรียก google.script.run ดึงข้อมูลหลัง page load เพื่อให้หน้าเปิดไว
- HtmlService Template Pre-render: ถ้าต้องการ inject ข้อมูลตอน render ให้ใช้ tmpl.data = getInitialData() ก่อน tmpl.evaluate()
- ใช้ pagination แทนดึงข้อมูลทั้งหมดครั้งเดียว — กำหนด pageSize เช่น 50-100 แถว
- แสดง skeleton loader หรือ spinner ระหว่าง google.script.run เพื่อ UX ที่ดี`);

    parts.push(`## GAS Execution Limits (ข้อจำกัดที่ต้องรู้)
- Execution time: 6 นาที/ครั้ง — ถ้า operation ยาวให้แบ่ง batch และใช้ time-based trigger
- Simultaneous executions: 30 concurrent — ออกแบบ LockService และ error handling ให้รองรับ
- Response size: 50MB — filter/compress ข้อมูลก่อนส่งเสมอ
- UrlFetch/day: 20,000 ครั้ง — cache ผลลัพธ์ API call ที่เรียกซ้ำด้วย CacheService
- Sheets ช้าตั้งแต่หลักหมื่นแถว — ถ้าข้อมูลเกิน ~10,000 แถว ให้แนะนำผู้ใช้พิจารณา Vercel + Supabase`);

    return parts.join('\n\n');
}

function buildGasDataSection(database) {
    if (database === 'supabase') {
        return `## Data Layer Guidance
- ฐานข้อมูลหลักคือ Supabase
- ระบุว่า GAS ทำหน้าที่เป็น orchestration layer หรือ thin backend
- ถ้ามี auth/data write สำคัญ ให้ชี้ชัดว่าควรทำฝั่ง server ด้วย UrlFetchApp และเก็บ secrets ใน Script Properties`;
    }

    return `## Google Sheets Data Safety
- ถ้าคอลัมน์ใดมีเลข 0 นำหน้า เช่น เบอร์โทร, รหัส, เลขที่เอกสาร ให้ setNumberFormat('@') ก่อนเขียน
- ถ้าต้องอ่านค่าเป็น string ตามที่แสดง ให้ใช้ getDisplayValue() แทน getValue()
- เวลาเขียนวันที่ ให้ใช้ Date object หรือ Utilities.formatDate() ตามบริบท และระบุ timezone ชัดเจน
- ระบุชื่อชีต, ชื่อคอลัมน์, และหน้าที่ของแต่ละตารางให้มือใหม่เห็นภาพง่าย`;
}

function buildGasNotificationSection(notifyChannel, projectDesc) {
    const hasNotifyIntent = /notify|notification|telegram|line|แจ้งเตือน|เตือน|ข้อความ/i.test(projectDesc);
    if (!hasNotifyIntent && notifyChannel === 'none') return '';

    if (notifyChannel === 'line-messaging-api') {
        return `## Notification Channel: LINE Messaging API
- ห้ามใช้ LINE Notify เพราะบริการยุติแล้วตั้งแต่วันที่ 31 มีนาคม 2025
- ถ้าต้องแจ้งเตือนผ่าน LINE ให้ใช้ LINE Messaging API ผ่าน LINE Official Account
- อธิบาย setup สำหรับมือใหม่: สร้าง LINE Official Account, ผูก Messaging API channel, เก็บ channel access token ใน Script Properties, ส่งข้อความผ่าน UrlFetchApp
- ระบุด้วยว่าปริมาณข้อความและค่าใช้จ่ายขึ้นกับแพ็กเกจ/โควตาของ LINE Official Account ตามภูมิภาค จึงควรตรวจสอบแผนล่าสุดก่อนใช้งานจริง
- ถ้าโจทย์เป็นระบบภายในหรือต้องการลดต้นทุน ให้เสนอ Telegram Bot API เป็นทางเลือกในส่วน recommendations ด้วย`;
    }

    if (notifyChannel === 'telegram-bot') {
        return `## Notification Channel: Telegram Bot API
- ใช้ Telegram Bot API เป็นช่องทางแจ้งเตือนหลัก
- อธิบาย setup สำหรับมือใหม่: สร้าง bot ผ่าน BotFather, เก็บ bot token ใน Script Properties, หา chat_id หรือ group id, แล้วส่งข้อความผ่าน UrlFetchApp ไปที่ method sendMessage
- ระบุรูปแบบ payload ที่ชัดเจน เช่น text, parse_mode และการจัดการ error เมื่อ bot ไม่มีสิทธิ์ส่งข้อความ
- ถ้าผู้ใช้ถามถึง LINE ให้บอกว่า LINE Notify ยุติแล้ว และ LINE Messaging API เป็นตัวเลือกที่ต้องวางแผนเรื่อง Official Account และ quota เพิ่ม`;
    }

    if (notifyChannel === 'gmail-app') {
        return `## Notification Channel: Gmail
- ใช้ GmailApp หรือ MailApp สำหรับส่งอีเมลแจ้งเตือน
- ระบุ template อีเมล, ผู้รับ, subject, และ fallback เมื่อส่งไม่สำเร็จ`;
    }

    return `## Notification Guidance
- ถ้าต้องการแจ้งเตือนผ่าน LINE ห้ามใช้ LINE Notify เพราะบริการยุติแล้วตั้งแต่วันที่ 31 มีนาคม 2025
- ให้เลือกช่องทางแจ้งเตือนที่เหมาะสมระหว่าง LINE Messaging API ผ่าน LINE Official Account หรือ Telegram Bot API
- ถ้าโจทย์เน้นต้นทุนต่ำและ setup ง่าย ให้เสนอ Telegram เป็น default alternative
- ถ้าโจทย์บังคับใช้ LINE ให้ระบุข้อจำกัดเรื่อง Official Account, token management, และ quota/plans ให้ชัด`;
}

function getGasModeState(projectDesc) {
    const guideMode = getRadioValue('gasGuideMode') || 'beginner';
    const uiStyle = getRadioValue('gasUiStyle') || 'modern';
    const desc = projectDesc.toLowerCase();

    return {
        guideMode,
        uiStyle,
        notifyChannel: getRadioValue('gasNotifyChannel') || 'none',
        enablePdfDocs: isChecked('gasWorkflowPdf') || /pdf|google doc|docs|เอกสาร|หนังสือราชการ|placeholder|แบบฟอร์ม/i.test(projectDesc),
        enableDriveSharing: isChecked('gasWorkflowDrive') || /drive|แชร์ไฟล์|permission|สิทธิ์|folder|shared/i.test(projectDesc),
        enableBottomNav: isChecked('gasWorkflowBottomNav'),
        enableSweetAlert: isChecked('gasWorkflowSwal') || /swal|sweetalert|modal|notification|แจ้งเตือน/i.test(desc)
    };
}

function detectGasPromptViolations(text) {
    return GAS_INVALID_OUTPUT_PATTERNS
        .filter((pattern) => pattern.regex.test(text))
        .map((pattern) => pattern.label);
}

async function rewriteGasPromptIfNeeded(apiKey, originalPrompt, draft) {
    const violations = detectGasPromptViolations(draft);
    if (violations.length === 0) return draft;

    const repairPrompt = `คุณกำลังแก้ไขไฟล์คำสั่งสำหรับโปรเจกต์ Google Apps Script

Draft เดิมมีการหลุดสโคปดังนี้:
- ${violations.join('\n- ')}

งานของคุณ:
1. Rewrite เนื้อหาทั้งหมดให้ยังคงเจตนาเดิม
2. ตัดหรือแทนที่ทุกส่วนที่พาออกจาก Google Apps Script ecosystem
3. ให้ผลลัพธ์สุดท้ายเป็น GAS-native เท่านั้น

ข้อห้าม:
- React, Next.js, Vue, Angular
- Node.js, Express, npm/pnpm/bun
- import/export, require(), fs/path/process.env
- การ deploy ไป Vercel/Netlify/Cloudflare Pages

ข้อบังคับ:
- ใช้ HtmlService, doGet/doPost, google.script.run, SpreadsheetApp/DriveApp/DocumentApp/UrlFetchApp ตามความเหมาะสม
- ถ้าเป็นหลายมุมมอง ให้ใช้ HtmlService + state management แบบเบา เช่น Alpine.js ผ่าน CDN หรือ vanilla JS global scope
- ต้องคงโทนภาษาไทยปน technical English ตาม draft เดิม
- ตอบเป็น Markdown content only ไม่ต้องครอบด้วย code block

อ้างอิงความต้องการเดิม:
${originalPrompt}

Draft เดิม:
${draft}`;

    const repaired = await callGeminiAPI(apiKey, repairPrompt);
    showToast(t('toastGasRepaired'));
    return repaired;
}

function isChecked(id) {
    const el = document.getElementById(id);
    return !!el && el.checked;
}
