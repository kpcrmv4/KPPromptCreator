// =============================================
// GAS ZIP Builder — Package files into downloadable ZIP
// =============================================
const JSZip = require('jszip');
const { generateReadme } = require('./gas-codegen');

/**
 * Build ZIP buffer from parsed GAS files
 * @param {string} projectName
 * @param {Array<{name: string, content: string}>} files
 * @param {object} options - { includeInstaller: boolean }
 * @returns {Promise<Buffer>} ZIP file as Buffer
 */
async function buildGasZip(projectName, files, options = {}) {
  const zip = new JSZip();
  const folderName = sanitizeFolderName(projectName);
  const folder = zip.folder(folderName);

  // Add source files into src/ subfolder
  const src = folder.folder('src');
  files.forEach(f => {
    src.file(f.name, f.content);
  });

  // Add README
  const readme = generateReadme(projectName, files, options.includeInstaller);
  folder.file('README.md', readme);

  // Add installer files if requested (Phase B)
  if (options.includeInstaller) {
    addInstallerFiles(folder, projectName, files);
  }

  // Generate ZIP
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return zipBuffer;
}

/**
 * Add Phase B installer files to ZIP
 */
function addInstallerFiles(folder, projectName, files) {
  // .clasp.json template (user fills in scriptId after login)
  folder.file('.clasp.json.template', JSON.stringify({
    scriptId: "<SCRIPT_ID_WILL_BE_SET_BY_INSTALLER>",
    rootDir: "src"
  }, null, 2));

  // setup.bat (Windows)
  folder.file('setup.bat', `@echo off
chcp 65001 >nul
title KP GAS Installer - ${projectName}
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   KP GAS Installer                      ║
echo  ║   ${projectName.substring(0, 38).padEnd(38)} ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo  Please install from: https://nodejs.org
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)

echo  [OK] Node.js found:
node --version

:: Install dependencies
echo.
echo  Installing dependencies...
cd /d "%~dp0installer"
call npm install --silent 2>nul

:: Start installer GUI
echo.
echo  Starting installer GUI...
echo  Opening browser at http://localhost:3456
echo.
start http://localhost:3456
node server.js
`);

  // setup.sh (Mac/Linux)
  folder.file('setup.sh', `#!/bin/bash
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   KP GAS Installer                      ║"
echo "  ║   ${projectName.substring(0, 38).padEnd(38)} ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js is not installed!"
    echo "  Please install from: https://nodejs.org"
    echo ""
    exit 1
fi

echo "  [OK] Node.js found: $(node --version)"

# Install dependencies
echo ""
echo "  Installing dependencies..."
cd "$(dirname "$0")/installer"
npm install --silent 2>/dev/null

# Start installer GUI
echo ""
echo "  Starting installer GUI..."
echo "  Opening browser at http://localhost:3456"
echo ""
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3456 &
elif command -v open &> /dev/null; then
    open http://localhost:3456 &
fi
node server.js
`);

  // Installer directory
  const installer = folder.folder('installer');

  // package.json for installer
  installer.file('package.json', JSON.stringify({
    name: 'kp-gas-installer',
    version: '1.0.0',
    private: true,
    dependencies: {
      '@google/clasp': '^2.4.2',
      express: '^4.18.2'
    }
  }, null, 2));

  // Installer server
  installer.file('server.js', generateInstallerServer(projectName));

  // Installer GUI HTML — supports 3 modes: webapp, sheets-new, existing
  installer.file('index.html', generateInstallerHTML(projectName));
}

function sanitizeFolderName(name) {
  return name.replace(/[^a-zA-Z0-9ก-๙\s\-_]/g, '').replace(/\s+/g, '-').substring(0, 50) || 'gas-project';
}

function generateInstallerServer(projectName) {
  const pn = JSON.stringify(projectName);
  // Use regular string concat to avoid template-in-template escaping issues
  var s = '';
  s += 'const express = require("express");\n';
  s += 'const { execSync, exec } = require("child_process");\n';
  s += 'const path = require("path");\n';
  s += 'const fs = require("fs");\n';
  s += 'const app = express();\n';
  s += 'const PORT = 3456;\n\n';
  s += 'const PROJECT_NAME = ' + pn + ';\n';
  s += 'const SRC_DIR = path.join(__dirname, "..", "src");\n';
  s += 'const ROOT_DIR = path.join(__dirname, "..");\n\n';
  s += 'app.use(express.json());\n';
  s += 'app.use(express.static(__dirname));\n\n';
  s += 'let installStatus = {\n';
  s += '  clasp: "pending", login: "pending", create: "pending",\n';
  s += '  push: "pending", deploy: "pending",\n';
  s += '  projectType: null, scriptId: null, sheetUrl: null, webAppUrl: null, error: null\n';
  s += '};\n\n';
  s += 'app.get("/api/status", (req, res) => res.json(installStatus));\n\n';

  // install-clasp
  s += 'app.post("/api/install-clasp", (req, res) => {\n';
  s += '  try {\n';
  s += '    installStatus.clasp = "running";\n';
  s += '    try { execSync("npm list -g @google/clasp", { stdio: "pipe" }); }\n';
  s += '    catch(e) { execSync("npm install -g @google/clasp", { stdio: "pipe", timeout: 60000 }); }\n';
  s += '    installStatus.clasp = "done";\n';
  s += '    res.json({ ok: true });\n';
  s += '  } catch (err) {\n';
  s += '    installStatus.clasp = "error"; installStatus.error = err.message;\n';
  s += '    res.status(500).json({ error: err.message });\n';
  s += '  }\n';
  s += '});\n\n';

  // login
  s += 'app.post("/api/login", (req, res) => {\n';
  s += '  installStatus.login = "running";\n';
  s += '  const child = exec("npx clasp login", { cwd: ROOT_DIR });\n';
  s += '  child.on("close", (code) => {\n';
  s += '    installStatus.login = code === 0 ? "done" : "error";\n';
  s += '    if (code !== 0) installStatus.error = "Login failed";\n';
  s += '  });\n';
  s += '  res.json({ ok: true });\n';
  s += '});\n\n';

  // create (webapp/sheets/docs)
  s += 'app.post("/api/create", (req, res) => {\n';
  s += '  const { projectType } = req.body;\n';
  s += '  installStatus.projectType = projectType || "webapp";\n';
  s += '  try {\n';
  s += '    installStatus.create = "running";\n';
  s += '    const type = projectType || "webapp";\n';
  s += '    execSync("npx clasp create --title \\"" + PROJECT_NAME + "\\" --type " + type + " --rootDir src", { cwd: ROOT_DIR, stdio: "pipe", timeout: 30000 });\n';
  s += '    try {\n';
  s += '      const claspJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, ".clasp.json"), "utf8"));\n';
  s += '      installStatus.scriptId = claspJson.scriptId;\n';
  s += '    } catch(e) {}\n';
  s += '    installStatus.create = "done";\n';
  s += '    res.json({ ok: true, scriptId: installStatus.scriptId });\n';
  s += '  } catch (err) {\n';
  s += '    installStatus.create = "error"; installStatus.error = err.message;\n';
  s += '    res.status(500).json({ error: err.message });\n';
  s += '  }\n';
  s += '});\n\n';

  // clone existing project + optional Sheet ID replacement
  s += 'app.post("/api/clone", (req, res) => {\n';
  s += '  const { scriptId, sheetId } = req.body;\n';
  s += '  if (!scriptId) return res.status(400).json({ error: "scriptId required" });\n';
  s += '  try {\n';
  s += '    installStatus.create = "running";\n';
  s += '    installStatus.scriptId = scriptId;\n';
  s += '    fs.writeFileSync(path.join(ROOT_DIR, ".clasp.json"), JSON.stringify({ scriptId: scriptId, rootDir: "src" }, null, 2));\n';
  s += '    // If sheetId provided, replace openById placeholders in all .gs files\n';
  s += '    if (sheetId) {\n';
  s += '      const srcFiles = fs.readdirSync(SRC_DIR);\n';
  s += '      srcFiles.forEach(function(f) {\n';
  s += '        if (f.endsWith(".gs")) {\n';
  s += '          const fp = path.join(SRC_DIR, f);\n';
  s += '          let code = fs.readFileSync(fp, "utf8");\n';
  s += '          // Replace openById with placeholder patterns\n';
  s += '          code = code.replace(/SpreadsheetApp\\.openById\\(["\'][^"\']*["\']\\)/g, "SpreadsheetApp.openById(\'" + sheetId + "\')");\n';
  s += '          code = code.replace(/SPREADSHEET_ID_HERE/g, sheetId);\n';
  s += '          code = code.replace(/SHEET_ID_HERE/g, sheetId);\n';
  s += '          fs.writeFileSync(fp, code);\n';
  s += '        }\n';
  s += '      });\n';
  s += '    }\n';
  s += '    installStatus.create = "done";\n';
  s += '    res.json({ ok: true });\n';
  s += '  } catch (err) {\n';
  s += '    installStatus.create = "error"; installStatus.error = err.message;\n';
  s += '    res.status(500).json({ error: err.message });\n';
  s += '  }\n';
  s += '});\n\n';

  // push
  s += 'app.post("/api/push", (req, res) => {\n';
  s += '  try {\n';
  s += '    installStatus.push = "running";\n';
  s += '    execSync("npx clasp push --force", { cwd: ROOT_DIR, stdio: "pipe", timeout: 30000 });\n';
  s += '    installStatus.push = "done";\n';
  s += '    res.json({ ok: true });\n';
  s += '  } catch (err) {\n';
  s += '    installStatus.push = "error"; installStatus.error = err.message;\n';
  s += '    res.status(500).json({ error: err.message });\n';
  s += '  }\n';
  s += '});\n\n';

  // deploy
  s += 'app.post("/api/deploy", (req, res) => {\n';
  s += '  try {\n';
  s += '    installStatus.deploy = "running";\n';
  s += '    execSync("npx clasp deploy --description \\"v1 - KP Auto Deploy\\"", { cwd: ROOT_DIR, encoding: "utf8", timeout: 30000 });\n';
  s += '    installStatus.deploy = "done";\n';
  s += '    res.json({ ok: true });\n';
  s += '  } catch (err) {\n';
  s += '    installStatus.deploy = "error"; installStatus.error = err.message;\n';
  s += '    res.status(500).json({ error: err.message });\n';
  s += '  }\n';
  s += '});\n\n';

  // open
  s += 'app.post("/api/open", (req, res) => {\n';
  s += '  try { exec("npx clasp open", { cwd: ROOT_DIR }); res.json({ ok: true }); }\n';
  s += '  catch (err) { res.status(500).json({ error: err.message }); }\n';
  s += '});\n\n';

  s += 'app.listen(PORT, () => console.log("\\n  KP GAS Installer running at http://localhost:" + PORT + "\\n"));\n';

  return s;
}

function generateInstallerHTML(projectName) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KP GAS Installer - ${projectName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',-apple-system,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .container{background:white;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-width:540px;width:100%;overflow:hidden}
    .header{background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 32px;color:white;text-align:center}
    .header h1{font-size:22px;margin-bottom:4px}
    .header p{opacity:0.85;font-size:13px}
    .body{padding:24px 32px 32px}

    /* Mode Selection */
    .mode-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px}
    .mode-card{border:2px solid #e2e8f0;border-radius:14px;padding:16px;cursor:pointer;transition:all 0.2s;text-align:center}
    .mode-card:hover{border-color:#818cf8;background:#f5f3ff}
    .mode-card.selected{border-color:#6366f1;background:#eef2ff;box-shadow:0 0 0 3px rgba(99,102,241,0.15)}
    .mode-icon{font-size:32px;margin-bottom:6px}
    .mode-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:2px}
    .mode-desc{font-size:11px;color:#64748b;line-height:1.5}
    .mode-tag{display:inline-block;font-size:10px;padding:2px 8px;border-radius:99px;margin-top:6px;font-weight:600}
    .tag-recommended{background:#dcfce7;color:#16a34a}
    .tag-advanced{background:#fef3c7;color:#b45309}

    /* Script ID input for existing mode */
    .script-input{display:none;margin:12px 0;padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0}
    .script-input label{display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px}
    .script-input input{width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:monospace;transition:border-color 0.2s}
    .script-input input:focus{outline:none;border-color:#6366f1}
    .script-input .help{font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.6}
    .script-input .help b{color:#475569}

    /* Steps */
    .steps-area{display:none}
    .step{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;margin-bottom:6px;background:#f8fafc;border:1px solid #e2e8f0;transition:all 0.3s}
    .step.active{background:#f5f3ff;border-color:#c4b5fd}
    .step.done{background:#f0fdf4;border-color:#bbf7d0}
    .step.error{background:#fef2f2;border-color:#fecaca}
    .step.skipped{opacity:0.4}
    .step-icon{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;background:#e2e8f0;color:#64748b;flex-shrink:0;font-weight:700}
    .step.active .step-icon{background:#6366f1;color:white;animation:pulse 1.5s infinite}
    .step.done .step-icon{background:#22c55e;color:white}
    .step.error .step-icon{background:#ef4444;color:white}
    .step-text{font-size:13px;font-weight:600;color:#334155}
    .step-desc{font-size:11px;color:#94a3b8}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

    .btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:16px;transition:all 0.2s}
    .btn-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 15px rgba(99,102,241,0.4)}
    .btn-primary:disabled{background:#cbd5e1;transform:none;box-shadow:none;cursor:not-allowed}
    .btn-success{background:linear-gradient(135deg,#22c55e,#16a34a);color:white}
    .btn-success:hover{transform:translateY(-1px);box-shadow:0 4px 15px rgba(34,197,94,0.4)}
    .btn-outline{background:white;color:#6366f1;border:2px solid #6366f1}
    .btn-outline:hover{background:#f5f3ff}

    .result{margin-top:16px;padding:20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:14px;text-align:center;display:none}
    .error-msg{margin-top:8px;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:12px;display:none}
    .status-text{text-align:center;font-size:12px;color:#94a3b8;margin-top:8px;display:none}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KP GAS Installer</h1>
      <p>${projectName}</p>
    </div>
    <div class="body">

      <!-- Mode Selection -->
      <div id="modeSection">
        <p style="font-size:14px;font-weight:700;color:#334155;margin-bottom:12px;">เลือกวิธีติดตั้ง</p>

        <div class="mode-grid">
          <div class="mode-card" onclick="selectMode('webapp')" id="mode-webapp">
            <div class="mode-icon">&#127760;</div>
            <div class="mode-title">Web App</div>
            <div class="mode-desc">สร้างเว็บแอปเปิดผ่าน URL ได้เลย<br>เหมาะกับ: Dashboard, Form, หน้าเว็บทั่วไป</div>
            <div class="mode-tag tag-recommended">แนะนำ</div>
          </div>

          <div class="mode-card" onclick="selectMode('sheets')" id="mode-sheets">
            <div class="mode-icon">&#128202;</div>
            <div class="mode-title">สร้าง Google Sheet + ผูกโค้ด</div>
            <div class="mode-desc">สร้าง Google Sheet ใหม่อัตโนมัติ แล้วผูกโค้ดเข้ากับ Sheet<br>เหมาะกับ: ระบบจัดการข้อมูล, รายงาน, สต็อก</div>
            <div class="mode-tag tag-recommended">แนะนำ</div>
          </div>

          <div class="mode-card" onclick="selectMode('existing')" id="mode-existing">
            <div class="mode-icon">&#128279;</div>
            <div class="mode-title">ผูกกับ Sheet / Doc ที่มีอยู่แล้ว</div>
            <div class="mode-desc">มี Google Sheet/Doc อยู่แล้ว ต้องการเพิ่มโค้ดเข้าไป</div>
            <div class="mode-tag tag-advanced">ขั้นสูง</div>
          </div>
        </div>

        <!-- Existing project inputs -->
        <div class="script-input" id="scriptIdInput">
          <label>&#9312; Script ID ของโปรเจกต์ที่มีอยู่ <span style="color:#ef4444">*</span></label>
          <input type="text" id="existingScriptId" placeholder="เช่น 1BxTjDm8x..." oninput="updateStartBtn()">
          <div class="help">
            <b>วิธีหา Script ID:</b><br>
            1. เปิด Google Sheet/Doc ของคุณ<br>
            2. ไปที่เมนู <b>ส่วนขยาย</b> &gt; <b>Apps Script</b><br>
            3. ในหน้า Apps Script ไปที่ <b>&#9881; ตั้งค่าโปรเจกต์</b><br>
            4. คัดลอก <b>รหัส</b> (Script ID) มาวางที่นี่
          </div>

          <div style="margin-top:12px;">
            <label>&#9313; Sheet ID <span style="color:#94a3b8">(ไม่บังคับ — ใส่ถ้าโค้ดต้องเข้าถึง Sheet)</span></label>
            <input type="text" id="existingSheetId" placeholder="วาง URL ของ Sheet หรือ Sheet ID" oninput="parseSheetUrl()">
            <div id="sheetIdParsed" style="display:none;margin-top:4px;font-size:11px;color:#16a34a;"></div>
            <div class="help">
              <b>วิธีหา:</b> วาง URL ของ Google Sheet ได้เลย ระบบจะดึง ID ให้อัตโนมัติ<br>
              เช่น: https://docs.google.com/spreadsheets/d/<b style="color:#6366f1">ตรงนี้คือ Sheet ID</b>/edit
            </div>
          </div>
        </div>

        <button class="btn btn-primary" id="startBtn" disabled onclick="startInstall()">เลือกวิธีติดตั้งก่อน</button>
      </div>

      <!-- Installation Steps -->
      <div class="steps-area" id="stepsArea">
        <div class="step" id="step-clasp">
          <div class="step-icon">1</div>
          <div><div class="step-text">ติดตั้ง clasp CLI</div><div class="step-desc">เครื่องมือสำหรับจัดการ Google Apps Script</div></div>
        </div>
        <div class="step" id="step-login">
          <div class="step-icon">2</div>
          <div><div class="step-text">ล็อกอิน Google</div><div class="step-desc">จะเปิดหน้าเว็บให้กดอนุญาต</div></div>
        </div>
        <div class="step" id="step-create">
          <div class="step-icon">3</div>
          <div>
            <div class="step-text" id="step-create-text">สร้างโปรเจกต์</div>
            <div class="step-desc" id="step-create-desc">สร้างโปรเจกต์ใหม่บน Google</div>
          </div>
        </div>
        <div class="step" id="step-push">
          <div class="step-icon">4</div>
          <div><div class="step-text">อัปโหลดโค้ด</div><div class="step-desc">Push ไฟล์โค้ดทั้งหมดขึ้น Google</div></div>
        </div>
        <div class="step" id="step-deploy">
          <div class="step-icon">5</div>
          <div><div class="step-text">Deploy</div><div class="step-desc" id="step-deploy-desc">เปิดให้เข้าถึงผ่าน URL</div></div>
        </div>

        <div class="status-text" id="statusText"></div>
        <button class="btn btn-primary" id="installBtn" disabled style="display:none">กำลังติดตั้ง...</button>
      </div>

      <!-- Success Result -->
      <div class="result" id="result">
        <p style="font-size:20px;margin-bottom:6px;">&#9989; สำเร็จ!</p>
        <p id="resultDesc" style="font-size:13px;color:#16a34a;margin-bottom:12px;"></p>
        <div id="resultLinks"></div>
        <button class="btn btn-success" onclick="openProject()" style="margin-top:12px">เปิดโปรเจกต์ใน Google</button>
      </div>

      <div class="error-msg" id="errorMsg"></div>
    </div>
  </div>

  <script>
    let selectedMode = null;

    function selectMode(mode) {
      selectedMode = mode;
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      document.getElementById('mode-' + mode).classList.add('selected');

      // Show/hide Script ID input
      document.getElementById('scriptIdInput').style.display = mode === 'existing' ? 'block' : 'none';

      updateStartBtn();
    }

    function parseSheetUrl() {
      const input = document.getElementById('existingSheetId');
      const parsed = document.getElementById('sheetIdParsed');
      const val = input.value.trim();
      // Try to extract Sheet ID from URL
      const match = val.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9_-]+)/);
      if (match) {
        parsed.textContent = '\\u2705 Sheet ID: ' + match[1];
        parsed.style.display = 'block';
        input.dataset.parsedId = match[1];
      } else if (val && !val.includes('/')) {
        // Assume raw ID
        parsed.textContent = '\\u2705 Sheet ID: ' + val;
        parsed.style.display = 'block';
        input.dataset.parsedId = val;
      } else {
        parsed.style.display = 'none';
        input.dataset.parsedId = '';
      }
    }

    function getSheetId() {
      const el = document.getElementById('existingSheetId');
      return el ? (el.dataset.parsedId || el.value.trim()) : '';
    }

    function updateStartBtn() {
      const btn = document.getElementById('startBtn');
      if (!selectedMode) { btn.disabled = true; btn.textContent = 'เลือกวิธีติดตั้งก่อน'; return; }
      if (selectedMode === 'existing') {
        const sid = document.getElementById('existingScriptId').value.trim();
        btn.disabled = !sid;
        btn.textContent = sid ? 'เริ่มติดตั้ง' : 'กรุณาใส่ Script ID';
      } else {
        btn.disabled = false;
        const labels = { webapp: 'เริ่มติดตั้ง — สร้าง Web App', sheets: 'เริ่มติดตั้ง — สร้าง Sheet + ผูกโค้ด' };
        btn.textContent = labels[selectedMode] || 'เริ่มติดตั้ง';
      }
    }

    function setStep(name, state) {
      const el = document.getElementById('step-' + name);
      if (!el) return;
      el.className = 'step ' + state;
      const icon = el.querySelector('.step-icon');
      if (state === 'done') icon.textContent = '\\u2713';
      else if (state === 'error') icon.textContent = '\\u2717';
      else if (state === 'active') icon.textContent = '\\u27F3';
    }

    function showStatus(msg) {
      const el = document.getElementById('statusText');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function showError(msg) {
      document.getElementById('errorMsg').textContent = msg;
      document.getElementById('errorMsg').style.display = 'block';
    }

    async function apiCall(endpoint, body) {
      const res = await fetch('/api/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    }

    async function pollLogin() {
      showStatus('\\u23F3 กรุณากดอนุญาตในหน้าเว็บ Google ที่เปิดขึ้นมา...');
      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await fetch('/api/status');
        const status = await res.json();
        if (status.login === 'done') return;
        if (status.login === 'error') throw new Error(status.error || 'Login failed');
      }
      throw new Error('Login timeout — กรุณาลองใหม่');
    }

    async function runStep(name, fn) {
      setStep(name, 'active');
      try {
        await fn();
        setStep(name, 'done');
        return true;
      } catch (err) {
        setStep(name, 'error');
        showError(err.message);
        return false;
      }
    }

    async function startInstall() {
      // Hide mode selection, show steps
      document.getElementById('modeSection').style.display = 'none';
      document.getElementById('stepsArea').style.display = 'block';
      document.getElementById('errorMsg').style.display = 'none';

      const isWebApp = selectedMode === 'webapp';
      const isSheets = selectedMode === 'sheets';
      const isExisting = selectedMode === 'existing';

      // Update step labels based on mode
      if (isSheets) {
        document.getElementById('step-create-text').textContent = 'สร้าง Google Sheet + ผูกโค้ด';
        document.getElementById('step-create-desc').textContent = 'สร้าง Sheet ใหม่พร้อมโปรเจกต์ GAS อัตโนมัติ';
        document.getElementById('step-deploy-desc').textContent = 'โค้ดพร้อมใช้งานจากเมนู Sheet';
      } else if (isExisting) {
        document.getElementById('step-create-text').textContent = 'เชื่อมต่อโปรเจกต์ที่มีอยู่';
        document.getElementById('step-create-desc').textContent = 'ผูกกับ Script ID ที่ระบุ';
        document.getElementById('step-deploy-desc').textContent = 'อัปเดตโค้ดในโปรเจกต์ที่มีอยู่';
      }

      // Skip deploy step for sheets/existing (deploy from Sheet menu instead)
      if (isSheets || isExisting) {
        document.getElementById('step-deploy').querySelector('.step-text').textContent = 'เสร็จสิ้น';
        document.getElementById('step-deploy').querySelector('.step-desc').textContent = 'พร้อมใช้งาน';
      }

      // Step 1: Install clasp
      showStatus('กำลังตรวจสอบ clasp CLI...');
      if (!await runStep('clasp', () => apiCall('install-clasp'))) return showRetry();

      // Step 2: Login Google
      showStatus('กำลังเปิดหน้าล็อกอิน Google...');
      if (!await runStep('login', async () => {
        await apiCall('login');
        await pollLogin();
      })) return showRetry();

      // Step 3: Create or Clone
      if (isExisting) {
        showStatus('กำลังเชื่อมต่อกับโปรเจกต์...');
        const scriptId = document.getElementById('existingScriptId').value.trim();
        const sheetId = getSheetId();
        if (!await runStep('create', () => apiCall('clone', { scriptId, sheetId: sheetId || undefined }))) return showRetry();
      } else {
        const typeLabel = isSheets ? 'สร้าง Google Sheet + ผูกโค้ด...' : 'สร้างโปรเจกต์ Web App...';
        showStatus(typeLabel);
        const projectType = isSheets ? 'sheets' : 'webapp';
        if (!await runStep('create', () => apiCall('create', { projectType }))) return showRetry();
      }

      // Step 4: Push code
      showStatus('กำลังอัปโหลดโค้ดทั้งหมด...');
      if (!await runStep('push', () => apiCall('push'))) return showRetry();

      // Step 5: Deploy (webapp only) or mark done
      if (isWebApp) {
        showStatus('กำลัง deploy เป็น Web App...');
        if (!await runStep('deploy', () => apiCall('deploy'))) return showRetry();
      } else {
        setStep('deploy', 'done');
      }

      // Show success
      showStatus('');
      document.getElementById('stepsArea').querySelectorAll('.step').forEach(s => { if (!s.classList.contains('done')) s.classList.add('done'); });

      const resultDesc = document.getElementById('resultDesc');
      const resultLinks = document.getElementById('resultLinks');

      if (isWebApp) {
        resultDesc.textContent = 'Web App สร้างและ deploy เรียบร้อย!';
        resultLinks.innerHTML = '<p style="font-size:12px;color:#64748b;">กดปุ่มด้านล่างเพื่อเปิดโปรเจกต์</p>';
      } else if (isSheets) {
        resultDesc.textContent = 'Google Sheet + โค้ดถูกสร้างเรียบร้อย!';
        resultLinks.innerHTML = '<div style="font-size:12px;color:#475569;text-align:left;background:#f8fafc;padding:12px;border-radius:8px;line-height:2;">'
          + '<b>สิ่งที่สร้างให้แล้ว:</b><br>'
          + '\\u2705 Google Sheet ใหม่<br>'
          + '\\u2705 โค้ด Apps Script ผูกกับ Sheet<br><br>'
          + '<b>วิธีใช้งาน:</b><br>'
          + '1. เปิด Google Sheet ที่สร้าง<br>'
          + '2. ไปที่เมนู <b>ส่วนขยาย</b> &gt; <b>Apps Script</b><br>'
          + '3. โค้ดทั้งหมดจะอยู่ในนั้นพร้อมใช้<br>'
          + '4. ถ้าเป็น Web App ให้กด <b>ทำให้ใช้งานได้</b> &gt; <b>การทำให้ใช้งานได้ใหม่</b>'
          + '</div>';
      } else {
        resultDesc.textContent = 'อัปโหลดโค้ดเข้าโปรเจกต์เรียบร้อย!';
        resultLinks.innerHTML = '<p style="font-size:12px;color:#64748b;">โค้ดถูกอัปเดตในโปรเจกต์ที่ระบุแล้ว</p>';
      }

      document.getElementById('result').style.display = 'block';
    }

    function showRetry() {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn-outline';
      retryBtn.textContent = 'ลองใหม่';
      retryBtn.style.marginTop = '12px';
      retryBtn.onclick = () => location.reload();
      document.getElementById('stepsArea').appendChild(retryBtn);
    }

    async function openProject() {
      await fetch('/api/open', { method: 'POST' });
    }
  </script>
</body>
</html>`;
}

module.exports = { buildGasZip };
