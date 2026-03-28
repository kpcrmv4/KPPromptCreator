// =============================================
// GAS Code Generator — Parse AI output into files
// =============================================

/**
 * Build the system prompt for Claude API to generate GAS code
 */
function buildCodegenPrompt(promptContent, projectName, options = {}) {
  const includeInstaller = options.includeInstaller || false;

  return `You are an expert Google Apps Script developer.
You will receive a project instruction prompt. Based on it, generate ALL the complete source code files for a Google Apps Script web app.

## Output Format Rules
- Output ONLY code files, no explanation text before or after
- Each file MUST start with a header line: === FILENAME.ext ===
- Supported extensions: .gs, .html
- HTML partials for CSS/JS should use .html extension (GAS convention)
- Include appsscript.json with correct oauthScopes
- Every file must be COMPLETE — no placeholders, no "// TODO", no "..."
- Do NOT use import/export, require(), npm packages
- Use HtmlService.createTemplateFromFile() for includes
- For web app: implement doGet(e) in Code.gs

## File Structure Convention
=== appsscript.json ===
(manifest with timeZone, oauthScopes, webapp config)

=== Code.gs ===
(main backend: doGet, doPost, server functions)

=== Database.gs ===
(SpreadsheetApp CRUD helpers — if using Sheets)

=== Auth.gs ===
(authentication helpers — if login required)

=== Config.gs ===
(configuration constants, Script Properties helpers)

=== Index.html ===
(main HTML page with <?!= include('CSS') ?> and <?!= include('JavaScript') ?>)

=== CSS.html ===
(<style> tag with all CSS)

=== JavaScript.html ===
(<script> tag with all frontend JS)

=== Components.html ===
(reusable HTML components — if needed)

## Technical Rules
- Use google.script.run for client-server communication
- Use google.script.run.withSuccessHandler().withFailureHandler()
- SpreadsheetApp for database operations
- PropertiesService.getScriptProperties() for config/secrets
- LockService for concurrent access protection
- Utilities.formatDate() for date handling with timezone
- CacheService for performance optimization where appropriate
- Error handling with try/catch on both server and client side

## Project Instruction:
${promptContent}

Generate all files now. Start each file with === FILENAME.ext ===`;
}

/**
 * Parse Claude API response into individual files
 */
function parseCodegenOutput(rawOutput) {
  const files = [];
  const fileRegex = /^={3,}\s*(.+?)\s*={3,}\s*$/gm;
  const matches = [...rawOutput.matchAll(fileRegex)];

  if (matches.length === 0) {
    // Fallback: if no file headers found, treat entire output as Code.gs
    files.push({ name: 'Code.gs', content: rawOutput.trim() });
    return files;
  }

  for (let i = 0; i < matches.length; i++) {
    const fileName = matches[i][1].trim();
    const startIdx = matches[i].index + matches[i][0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : rawOutput.length;
    const content = rawOutput.substring(startIdx, endIdx).trim();

    if (content) {
      files.push({ name: fileName, content });
    }
  }

  return files;
}

/**
 * Validate parsed files have minimum required structure
 */
function validateGasFiles(files) {
  const warnings = [];
  const fileNames = files.map(f => f.name.toLowerCase());

  if (!fileNames.some(f => f === 'code.gs')) {
    warnings.push('Missing Code.gs — main entry point');
  }
  if (!fileNames.some(f => f === 'appsscript.json')) {
    warnings.push('Missing appsscript.json — manifest file');
  }
  if (!fileNames.some(f => f === 'index.html')) {
    warnings.push('Missing Index.html — main page');
  }

  // Check for forbidden patterns
  files.forEach(f => {
    if (/\brequire\s*\(/.test(f.content)) {
      warnings.push(`${f.name}: Contains require() — not allowed in GAS`);
    }
    if (/\bimport\s+.+\s+from\s+/.test(f.content)) {
      warnings.push(`${f.name}: Contains ES module import — not allowed in GAS`);
    }
    if (/\bexport\s+(default|function|class|const)/.test(f.content)) {
      warnings.push(`${f.name}: Contains ES module export — not allowed in GAS`);
    }
  });

  return warnings;
}

/**
 * Generate README.md with deploy instructions
 */
function generateReadme(projectName, files, includeInstaller = false) {
  const fileList = files.map(f => `├── ${f.name}`).join('\n');

  let readme = `# ${projectName}

สร้างโดย KP Prompt Creator — AI Code Generation for Google Apps Script

## ไฟล์ในโปรเจกต์
\`\`\`
${fileList}
\`\`\`

## วิธี Deploy แบบ Manual

### ขั้นตอนที่ 1: สร้างโปรเจกต์ Google Apps Script
1. ไปที่ [script.google.com](https://script.google.com)
2. กด **"โปรเจกต์ใหม่"**
3. ตั้งชื่อโปรเจกต์เป็น **"${projectName}"**

### ขั้นตอนที่ 2: คัดลอกไฟล์
1. **Code.gs** — วางทับไฟล์ Code.gs ที่มีอยู่
2. **ไฟล์ .gs อื่นๆ** — กด **+** > **สคริปต์** แล้ววางโค้ด
3. **ไฟล์ .html** — กด **+** > **HTML** แล้ววางโค้ด
4. **appsscript.json** — กด **⚙ ตั้งค่าโปรเจกต์** > เปิด **"แสดงไฟล์ manifest"** > วาง

### ขั้นตอนที่ 3: Deploy เป็น Web App
1. กด **ทำให้ใช้งานได้** > **การทำให้ใช้งานได้ใหม่**
2. เลือกประเภท: **เว็บแอป**
3. ตั้งค่า:
   - คำอธิบาย: \`${projectName} v1\`
   - ดำเนินการในฐานะ: **ฉัน**
   - ผู้ที่มีสิทธิ์เข้าถึง: **ทุกคน**
4. กด **ทำให้ใช้งานได้**
5. คัดลอก URL ที่ได้ — นี่คือลิงก์เว็บแอปของคุณ!
`;

  if (includeInstaller) {
    readme += `
## วิธี Deploy แบบอัตโนมัติ (แนะนำ)

### ข้อกำหนดเบื้องต้น
- ติดตั้ง [Node.js](https://nodejs.org) (v18+)

### Windows
1. ดับเบิลคลิก **setup.bat**
2. จะเปิดหน้าเว็บ installer ขึ้นมา
3. ทำตามขั้นตอนบนหน้าจอ

### Mac / Linux
1. เปิด Terminal ในโฟลเดอร์นี้
2. รัน \`chmod +x setup.sh && ./setup.sh\`
3. จะเปิดหน้าเว็บ installer ขึ้นมา
4. ทำตามขั้นตอนบนหน้าจอ
`;
  }

  readme += `
---
สร้างโดย [KP Prompt Creator](https://kppromptcreator.tech)
`;

  return readme;
}

module.exports = {
  buildCodegenPrompt,
  parseCodegenOutput,
  validateGasFiles,
  generateReadme
};
