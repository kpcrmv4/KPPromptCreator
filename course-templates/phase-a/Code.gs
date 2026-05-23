/**
 * ============================================================
 * KP GAS Sandbox — Setup Script (Phase A: Modules 1-3)
 * ============================================================
 *
 * คอร์ส: Google Apps Script & Web App Mastery
 * เจ้าของ template: KP Prompt Creator
 *
 * วิธีใช้ (สำหรับ admin ที่จะสร้าง template):
 *   1) สร้าง Google Sheet ใหม่ (เปล่า ๆ)
 *   2) Extensions → Apps Script
 *   3) ลบโค้ดเริ่มต้น แล้ววางทั้งหมดนี้ลงไป
 *   4) กด Save (ไอคอนแผ่นดิสก์ หรือ Ctrl+S)
 *   5) เลือก function "setupSandbox" จาก dropdown แล้วกด Run
 *   6) อนุญาต permission ครั้งแรก (Allow → Advanced → Go to ... → Allow)
 *   7) เสร็จ — Sheet จะมี structure ครบ + เมนู "🎓 Sandbox" ขึ้นมา
 *
 * วิธีให้ learner ใช้:
 *   - share Sheet (link "Anyone with link can view")
 *   - ส่งลิงก์รูปนี้ให้ learner: https://docs.google.com/spreadsheets/d/<SHEET_ID>/copy
 *   - learner คลิก → "Make a copy" → ได้ Sheet + Script ใน Drive ตัวเอง
 */

// ============================================================
// MAIN — function ที่ admin/learner กด Run
// ============================================================
function setupSandbox() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename('KP GAS Sandbox');

  setupConfigSheet(ss);
  setupDataSheet(ss);
  setupOutputSheet(ss);
  setupLogsSheet(ss);
  setupReadmeSheet(ss);
  removeDefaultSheet(ss);

  // โหลด menu (ปกติจะรันอัตโนมัติตอนเปิด Sheet ผ่าน onOpen)
  onOpen();

  try {
    SpreadsheetApp.getUi().alert(
      '✅ Setup สำเร็จ!\n\n' +
      'Sheet ของคุณพร้อมแล้ว — เปิดเมนู "🎓 Sandbox" ด้านบนเพื่อใช้งาน\n\n' +
      'เริ่มจากกด "🎓 Sandbox → ▶ Hello World" เพื่อทดสอบ'
    );
  } catch (e) {
    // ถ้า run ผ่าน trigger ไม่มี UI → ข้าม alert
    Logger.log('Setup done.');
  }
}

// ============================================================
// Custom Menu — run อัตโนมัติทุกครั้งที่เปิด Sheet
// ============================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎓 Sandbox')
    .addItem('▶ Hello World', 'helloWorld')
    .addItem('📝 Show Config', 'showConfig')
    .addSeparator()
    .addItem('🧹 Clear Output sheet', 'clearOutput')
    .addItem('🧹 Clear Logs sheet', 'clearLogs')
    .addSeparator()
    .addItem('⚙ Re-setup (reset ทุก sheet)', 'setupSandbox')
    .addToUi();
}

// ============================================================
// Lesson 1.3 — Hello World (ฟังก์ชันแรกที่ learner รัน)
// ============================================================
function helloWorld() {
  Logger.log('สวัสดีครับ จาก GAS! 👋');
  Logger.log('ถ้าคุณเห็นข้อความนี้ใน Execution log = สำเร็จแล้ว');

  // เขียนไปที่ Output sheet ด้วย เพื่อให้เห็นผลใน Sheet
  const sh = SpreadsheetApp.getActive().getSheetByName('Output');
  sh.getRange('A1').setValue('Hello World — ' + new Date().toLocaleString('th-TH'));
  sh.getRange('A1').setFontWeight('bold').setBackground('#dcfce7');

  try {
    SpreadsheetApp.getUi().alert(
      '✅ Hello World สำเร็จ!\n\n' +
      'ดู log ได้ที่:\n' +
      '• View → Execution log (Ctrl+Enter)\n' +
      '• หรือดูที่ sheet "Output" — ข้อความปรากฏใน A1'
    );
  } catch (e) {}
}

// ============================================================
// Lesson 3.x — utility สำหรับใช้ใน lesson ต่อ ๆ ไป
// ============================================================
function showConfig() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Config');
  const values = sh.getDataRange().getValues();
  Logger.log('Config:');
  values.slice(1).forEach((row) => {
    Logger.log(`  ${row[0]} = ${row[1]}`);
  });
}

function clearOutput() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Output');
  sh.clear();
  sh.getRange('A1').setValue('// (clear แล้ว — ลองทำ exercise ต่อได้)')
    .setFontStyle('italic')
    .setFontColor('#94a3b8');
}

function clearLogs() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Logs');
  const lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clear();
}

// ============================================================
// === SETUP HELPERS (admin internal — learner ไม่ต้องสนใจ) ===
// ============================================================

function setupConfigSheet(ss) {
  const sh = ss.getSheetByName('Config') || ss.insertSheet('Config', 0);
  sh.clear();

  sh.getRange('A1:B1').setValues([['Key', 'Value']])
    .setFontWeight('bold')
    .setBackground('#6366f1')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  const config = [
    ['ADMIN_EMAIL',       'your@email.com'],
    ['DATE_FORMAT',       'dd/MM/yyyy'],
    ['DEFAULT_SHEET',     'Data'],
    ['IMGBB_API_KEY',     '(ใส่ที่นี่ภายหลังในบทที่ 3)'],
    ['TIMEZONE',          'Asia/Bangkok'],
    ['LINE_TOKEN',        '(ใส่ที่นี่ภายหลังในบทที่ 11)'],
  ];
  sh.getRange(2, 1, config.length, 2).setValues(config);

  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 320);
  sh.getRange('A:A').setFontFamily('Roboto Mono');

  // ย้ายเป็น sheet แรก
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);
}

function setupDataSheet(ss) {
  const sh = ss.getSheetByName('Data') || ss.insertSheet('Data');
  sh.clear();

  sh.getRange('A1:F1').setValues([['ID', 'Name', 'Email', 'Phone', 'Status', 'CreatedAt']])
    .setFontWeight('bold')
    .setBackground('#6366f1')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  const data = [
    ['C001', 'สมชาย ใจดี',        'somchai@example.com',  '0812345678', 'active',   '2025-01-15 09:30'],
    ['C002', 'สมหญิง สวยงาม',     'somying@example.com',  '0823456789', 'active',   '2025-01-16 10:15'],
    ['C003', 'อนันต์ ฉลาด',       'anan@example.com',     '0834567890', 'pending',  '2025-01-17 11:00'],
    ['C004', 'มาลี ดอกไม้',        'malee@example.com',    '0845678901', 'active',   '2025-01-18 14:20'],
    ['C005', 'วิชัย เจริญสุข',     'wichai@example.com',   '0856789012', 'inactive', '2025-01-19 16:45'],
    ['C006', 'นิภา ส่องแสง',       'nipa@example.com',     '0867890123', 'active',   '2025-01-20 08:30'],
    ['C007', 'ประยุทธ์ มั่นคง',    'prayut@example.com',   '0878901234', 'active',   '2025-01-21 09:00'],
    ['C008', 'ปิยะ ขยัน',          'piya@example.com',     '0889012345', 'pending',  '2025-01-22 13:15'],
    ['C009', 'สุดา รักเรียน',      'suda@example.com',     '0890123456', 'active',   '2025-01-23 10:45'],
    ['C010', 'กฤษณ์ พากเพียร',     'krit@example.com',     '0901234567', 'active',   '2025-01-24 11:30'],
    ['C011', 'อรทัย แสนดี',        'orathai@example.com',  '0812345600', 'inactive', '2025-01-25 15:00'],
    ['C012', 'สมศักดิ์ มาทันเวลา', 'somsak@example.com',   '0823456700', 'active',   '2025-01-26 09:45'],
    ['C013', 'จันทร์เพ็ญ งดงาม',   'janpen@example.com',   '0834567800', 'active',   '2025-01-27 14:30'],
    ['C014', 'ธนากร รวยทรัพย์',    'thanakorn@example.com','0845678900', 'pending',  '2025-01-28 16:00'],
    ['C015', 'นภา สดใส',           'napha@example.com',    '0856789000', 'active',   '2025-01-29 10:15'],
    ['C016', 'รักษ์ สิทธิ์ดี',     'rak@example.com',      '0867890000', 'active',   '2025-01-30 11:45'],
    ['C017', 'พิมพ์ใจ น่ารัก',     'pimjai@example.com',   '0878900000', 'inactive', '2025-01-31 13:00'],
    ['C018', 'ชัยวัฒน์ ก้าวหน้า',  'chaiwat@example.com',  '0890000000', 'active',   '2025-02-01 09:30'],
    ['C019', 'สุภาพ อ่อนน้อม',     'suphap@example.com',   '0801111111', 'pending',  '2025-02-02 14:15'],
    ['C020', 'กิตติ ขยันขันแข็ง',  'kitti@example.com',    '0812222222', 'active',   '2025-02-03 10:00'],
  ];
  sh.getRange(2, 1, data.length, 6).setValues(data);

  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, 6);

  // เพิ่ม conditional format ให้ status
  const statusRange = sh.getRange(2, 5, data.length, 1);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('active')
      .setBackground('#dcfce7').setFontColor('#166534').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('pending')
      .setBackground('#fef3c7').setFontColor('#92400e').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('inactive')
      .setBackground('#fee2e2').setFontColor('#991b1b').setRanges([statusRange]).build(),
  ];
  sh.setConditionalFormatRules(rules);
}

function setupOutputSheet(ss) {
  const sh = ss.getSheetByName('Output') || ss.insertSheet('Output');
  sh.clear();
  sh.getRange('A1').setValue('// ผลลัพธ์ของ exercise ในแต่ละบทจะมาแสดงที่นี่')
    .setFontStyle('italic')
    .setFontColor('#94a3b8');
  sh.setColumnWidth(1, 400);
}

function setupLogsSheet(ss) {
  const sh = ss.getSheetByName('Logs') || ss.insertSheet('Logs');
  sh.clear();
  sh.getRange('A1:C1').setValues([['Timestamp', 'Level', 'Message']])
    .setFontWeight('bold')
    .setBackground('#6366f1')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 80);
  sh.setColumnWidth(3, 500);
}

function setupReadmeSheet(ss) {
  const sh = ss.getSheetByName('README') || ss.insertSheet('README');
  sh.clear();

  const lines = [
    ['📚 KP GAS Sandbox — สำหรับคอร์ส GAS Mastery'],
    [''],
    ['Sheet นี้คือ playground ที่คุณจะใช้ตลอด Module 1-3 ของคอร์ส'],
    [''],
    ['📋 Sheet ต่าง ๆ:'],
    ['   • Config — เก็บ key/value สำหรับการตั้งค่า (ใช้ใน Module 3)'],
    ['   • Data — ข้อมูลตัวอย่าง 20 แถว สำหรับฝึกอ่าน/เขียน'],
    ['   • Output — ผลของ exercise แต่ละบทจะแสดงที่นี่'],
    ['   • Logs — เก็บ log สำหรับฝึกใน Module 1.4'],
    [''],
    ['🎯 เริ่มต้น:'],
    ['   1) คลิกเมนู "🎓 Sandbox" ด้านบน'],
    ['   2) เลือก "▶ Hello World"'],
    ['   3) ดู alert + เปิด Output sheet เพื่อดูผล'],
    [''],
    ['⚠️ ถ้าทำพังจน Sheet เสียหาย:'],
    ['   เมนู "🎓 Sandbox → Re-setup" จะ reset กลับเป็นค่าเริ่มต้น'],
    [''],
    ['🔗 ต้นฉบับ template: https://github.com/kpcrmv4/KPPromptCreator'],
  ];
  sh.getRange(1, 1, lines.length, 1).setValues(lines);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.setColumnWidth(1, 600);
  sh.hideSheet(); // ซ่อน README — เปิดดูได้ผ่านเมนู View → All sheets
}

function removeDefaultSheet(ss) {
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
}
