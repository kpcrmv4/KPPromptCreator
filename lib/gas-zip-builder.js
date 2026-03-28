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
  installer.file('server.js', `const express = require('express');
const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3456;

const PROJECT_NAME = ${JSON.stringify(projectName)};
const SRC_DIR = path.join(__dirname, '..', 'src');
const ROOT_DIR = path.join(__dirname, '..');

app.use(express.json());
app.use(express.static(__dirname));

// Status tracking
let installStatus = {
  clasp: 'pending',
  login: 'pending',
  create: 'pending',
  push: 'pending',
  deploy: 'pending',
  webAppUrl: null,
  error: null
};

app.get('/api/status', (req, res) => res.json(installStatus));

app.post('/api/install-clasp', (req, res) => {
  try {
    installStatus.clasp = 'running';
    execSync('npm list -g @google/clasp', { stdio: 'pipe' });
    installStatus.clasp = 'done';
    res.json({ ok: true, message: 'clasp already installed' });
  } catch {
    try {
      execSync('npm install -g @google/clasp', { stdio: 'pipe', timeout: 60000 });
      installStatus.clasp = 'done';
      res.json({ ok: true, message: 'clasp installed' });
    } catch (err) {
      installStatus.clasp = 'error';
      installStatus.error = err.message;
      res.status(500).json({ error: 'Failed to install clasp: ' + err.message });
    }
  }
});

app.post('/api/login', (req, res) => {
  installStatus.login = 'running';
  const child = exec('npx clasp login', { cwd: ROOT_DIR });
  child.on('close', (code) => {
    installStatus.login = code === 0 ? 'done' : 'error';
    if (code !== 0) installStatus.error = 'Login failed or cancelled';
  });
  res.json({ ok: true, message: 'Login window opened in browser' });
});

app.post('/api/create', (req, res) => {
  try {
    installStatus.create = 'running';
    execSync(\`npx clasp create --title "\${PROJECT_NAME}" --type webapp --rootDir src\`, { cwd: ROOT_DIR, stdio: 'pipe', timeout: 30000 });
    installStatus.create = 'done';
    res.json({ ok: true });
  } catch (err) {
    installStatus.create = 'error';
    installStatus.error = err.message;
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/push', (req, res) => {
  try {
    installStatus.push = 'running';
    execSync('npx clasp push --force', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 30000 });
    installStatus.push = 'done';
    res.json({ ok: true });
  } catch (err) {
    installStatus.push = 'error';
    installStatus.error = err.message;
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deploy', (req, res) => {
  try {
    installStatus.deploy = 'running';
    const output = execSync('npx clasp deploy --description "v1 - KP Auto Deploy"', { cwd: ROOT_DIR, encoding: 'utf8', timeout: 30000 });
    installStatus.deploy = 'done';

    // Try to get web app URL
    try {
      const openOutput = execSync('npx clasp open --webapp', { cwd: ROOT_DIR, encoding: 'utf8', timeout: 10000 });
      const urlMatch = openOutput.match(/https:\\/\\/script\\.google\\.com[^\\s]+/);
      if (urlMatch) installStatus.webAppUrl = urlMatch[0];
    } catch {}

    res.json({ ok: true, output });
  } catch (err) {
    installStatus.deploy = 'error';
    installStatus.error = err.message;
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/open', (req, res) => {
  try {
    exec('npx clasp open', { cwd: ROOT_DIR });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(\`\\n  KP GAS Installer running at http://localhost:\${PORT}\\n\`);
});
`);

  // Installer GUI HTML
  installer.file('index.html', `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KP GAS Installer - ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #f0f0f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); max-width: 500px; width: 100%; padding: 32px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .step { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0; transition: all 0.3s; }
    .step.active { background: #f5f3ff; border-color: #c4b5fd; }
    .step.done { background: #f0fdf4; border-color: #bbf7d0; }
    .step.error { background: #fef2f2; border-color: #fecaca; }
    .step-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; background: #e2e8f0; color: #64748b; flex-shrink: 0; }
    .step.active .step-icon { background: #7c5cfc; color: white; animation: pulse 1.5s infinite; }
    .step.done .step-icon { background: #22c55e; color: white; }
    .step.error .step-icon { background: #ef4444; color: white; }
    .step-text { font-size: 14px; font-weight: 500; }
    .step-desc { font-size: 12px; color: #94a3b8; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
    .btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: all 0.2s; }
    .btn-primary { background: #7c5cfc; color: white; }
    .btn-primary:hover { background: #6346e0; }
    .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
    .btn-success { background: #22c55e; color: white; }
    .result { margin-top: 16px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; text-align: center; display: none; }
    .result a { color: #7c5cfc; font-weight: 600; word-break: break-all; }
    .error-msg { margin-top: 8px; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 12px; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 KP GAS Installer</h1>
    <p class="subtitle">${projectName}</p>

    <div class="step" id="step-clasp">
      <div class="step-icon">1</div>
      <div><div class="step-text">ติดตั้ง clasp</div><div class="step-desc">Google Apps Script CLI tool</div></div>
    </div>
    <div class="step" id="step-login">
      <div class="step-icon">2</div>
      <div><div class="step-text">ล็อกอิน Google</div><div class="step-desc">ให้สิทธิ์สร้างโปรเจกต์</div></div>
    </div>
    <div class="step" id="step-create">
      <div class="step-icon">3</div>
      <div><div class="step-text">สร้างโปรเจกต์ GAS</div><div class="step-desc">สร้างโปรเจกต์ใหม่บน Google</div></div>
    </div>
    <div class="step" id="step-push">
      <div class="step-icon">4</div>
      <div><div class="step-text">อัปโหลดโค้ด</div><div class="step-desc">Push ไฟล์ทั้งหมดขึ้น GAS</div></div>
    </div>
    <div class="step" id="step-deploy">
      <div class="step-icon">5</div>
      <div><div class="step-text">Deploy Web App</div><div class="step-desc">เปิดให้เข้าถึงผ่าน URL</div></div>
    </div>

    <button class="btn btn-primary" id="startBtn" onclick="startInstall()">เริ่มติดตั้ง</button>

    <div class="result" id="result">
      <p style="font-size:18px;margin-bottom:8px;">✅ สำเร็จ!</p>
      <p style="font-size:13px;color:#64748b;margin-bottom:8px;">โปรเจกต์ถูกสร้างและ deploy แล้ว</p>
      <button class="btn btn-success" onclick="openProject()">เปิดโปรเจกต์ใน Google</button>
    </div>

    <div class="error-msg" id="errorMsg"></div>
  </div>

  <script>
    const steps = ['clasp', 'login', 'create', 'push', 'deploy'];
    let currentStep = 0;

    function setStep(name, state) {
      const el = document.getElementById('step-' + name);
      el.className = 'step ' + state;
      const icon = el.querySelector('.step-icon');
      if (state === 'done') icon.textContent = '✓';
      else if (state === 'error') icon.textContent = '✗';
      else if (state === 'active') icon.textContent = '⟳';
    }

    function showError(msg) {
      const el = document.getElementById('errorMsg');
      el.textContent = msg;
      el.style.display = 'block';
    }

    async function runStep(name) {
      setStep(name, 'active');
      try {
        const res = await fetch('/api/' + (name === 'clasp' ? 'install-clasp' : name), { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        if (name === 'login') {
          // Wait for login — poll status
          document.getElementById('startBtn').textContent = 'กำลังรอล็อกอิน Google... (กดอนุญาตในหน้าเว็บที่เปิดขึ้น)';
          await pollLogin();
        }

        setStep(name, 'done');
        return true;
      } catch (err) {
        setStep(name, 'error');
        showError(err.message);
        return false;
      }
    }

    async function pollLogin() {
      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await fetch('/api/status');
        const status = await res.json();
        if (status.login === 'done') return;
        if (status.login === 'error') throw new Error(status.error || 'Login failed');
      }
      throw new Error('Login timeout');
    }

    async function startInstall() {
      const btn = document.getElementById('startBtn');
      btn.disabled = true;
      document.getElementById('errorMsg').style.display = 'none';

      for (const step of steps) {
        btn.textContent = step === 'login' ? 'กำลังรอล็อกอิน...' : 'กำลังดำเนินการ...';
        const ok = await runStep(step);
        if (!ok) {
          btn.disabled = false;
          btn.textContent = 'ลองใหม่';
          return;
        }
      }

      btn.style.display = 'none';
      document.getElementById('result').style.display = 'block';
    }

    async function openProject() {
      await fetch('/api/open', { method: 'POST' });
    }
  </script>
</body>
</html>
`);
}

function sanitizeFolderName(name) {
  return name.replace(/[^a-zA-Z0-9ก-๙\s\-_]/g, '').replace(/\s+/g, '-').substring(0, 50) || 'gas-project';
}

module.exports = { buildGasZip };
