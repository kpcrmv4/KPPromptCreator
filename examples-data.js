/**
 * examples-data.js — แหล่งข้อมูลกลางของ "Live Examples" (ตัวอย่างกดเล่นได้)
 * ใช้ร่วมกันโดย examples.html (gallery) และ iframe ที่ฝังในบทเรียน (?embed=<id>)
 *
 * โครงสร้างแต่ละ demo:
 *   id       : slug ใช้ใน ```demo <id>``` ในบทเรียน + ?embed=<id>
 *   title    : ชื่อหัวข้อ
 *   concept  : อธิบายสั้น ๆ ว่าเทียบอะไร
 *   tags     : บทที่เกี่ยวข้อง (โชว์เป็น chip)
 *   variants : [{ label, html }] — แต่ละตัวเรนเดอร์ใน iframe แยก (กดเล่นได้ ไม่ชนกัน)
 *   when     : เมื่อไหร่ควรเลือกอันไหน
 *   code     : โค้ดที่แนะนำ (กดคัดลอก)
 *   prompt   : prompt สำเร็จรูปสำหรับสั่ง AI (กดคัดลอก)
 *
 * variant.html = เอกสาร HTML สั้น ๆ ที่รันได้เองใน iframe (self-contained)
 */
window.KP_EXAMPLES = [
  // ─────────────────────────────────────────────────────────
  {
    id: 'light-vs-dark',
    title: 'Light mode vs Dark mode (toggle ได้)',
    concept: 'ทำปุ่มสลับโหมดสว่าง/มืด ด้วย CSS variables + คลาสที่ <html>',
    tags: ['Module 5'],
    when: 'ใส่ dark mode เมื่ออยากให้ผู้ใช้เลือกเองได้ — เก็บค่าที่เลือกใน localStorage จะจำไว้รอบหน้า',
    variants: [
      {
        label: 'กดปุ่มเพื่อสลับโหมด',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--bg:#f8fafc;--card:#fff;--ink:#0f172a;--sub:#64748b;--line:#e2e8f0}
html.dark{--bg:#0f172a;--card:#1e293b;--ink:#f1f5f9;--sub:#94a3b8;--line:#334155}
*{box-sizing:border-box;transition:background .2s,color .2s,border-color .2s}
body{font-family:system-ui,'Noto Sans Thai',sans-serif;background:var(--bg);color:var(--ink);margin:0;padding:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;max-width:320px}
.sub{color:var(--sub);font-size:13px;margin:6px 0 14px}
button{cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:8px 14px;border-radius:9px;font-size:14px}
.dot{width:9px;height:9px;border-radius:50%;background:#22c55e;display:inline-block;margin-right:6px}
</style></head><body>
<div class="card">
  <div style="font-weight:700;font-size:18px"><span class="dot"></span>ยอดขายวันนี้</div>
  <div class="sub">ลองกดปุ่มด้านล่างเพื่อสลับโหมด</div>
  <div style="font-size:30px;font-weight:800">฿12,450</div>
  <button id="t" style="margin-top:14px">🌙 สลับเป็น Dark</button>
</div>
<script>
var b=document.getElementById('t');
b.onclick=function(){var d=document.documentElement.classList.toggle('dark');
b.textContent=d?'☀️ สลับเป็น Light':'🌙 สลับเป็น Dark';};
</script></body></html>`
      }
    ],
    code: `<!-- ใน <head> -->
<style>
  :root { --bg:#f8fafc; --ink:#0f172a; }       /* โหมดสว่าง */
  html.dark { --bg:#0f172a; --ink:#f1f5f9; }   /* โหมดมืด */
  body { background: var(--bg); color: var(--ink); }
</style>

<!-- ปุ่ม + จำค่าที่เลือก -->
<button onclick="toggleTheme()">สลับโหมด</button>
<script>
  // โหลดค่าที่เคยเลือก
  if (localStorage.theme === 'dark') document.documentElement.classList.add('dark');
  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.theme = dark ? 'dark' : 'light';
  }
</script>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยทำระบบ dark mode:
- ใช้ CSS variables (--bg, --ink, --card) แล้วสลับด้วยคลาส .dark ที่ <html>
- มีปุ่มสลับโหมดมุมขวาบน
- จำค่าที่ผู้ใช้เลือกไว้ใน localStorage ให้โหลดมาใช้รอบหน้า
- มี transition นุ่ม ๆ ตอนสลับ`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'alert-vs-swal',
    title: 'alert() ธรรมดา vs SweetAlert2',
    concept: 'ป๊อปอัปยืนยัน/แจ้งเตือน — แบบ built-in vs ไลบรารีสวยงาม',
    tags: ['Module 5.4'],
    when: 'ใช้ SweetAlert2 เมื่ออยากได้ปุ่มยืนยัน/ยกเลิก, ไอคอน, สีตรงแบรนด์ และ UX ที่ดูโปร',
    variants: [
      {
        label: 'alert() / confirm() ธรรมดา',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:24px;text-align:center}
button{cursor:pointer;background:#475569;color:#fff;border:0;padding:11px 18px;border-radius:9px;font-size:14px}
p{color:#64748b;font-size:13px}</style></head><body>
<p>ป๊อปอัปของเบราว์เซอร์ — หน้าตาตายตัว แต่งไม่ได้</p>
<button onclick="if(confirm('ลบรายการนี้?'))alert('ลบแล้ว')">🗑 ลบรายการ</button>
</body></html>`
      },
      {
        label: 'SweetAlert2',
        html: `<!doctype html><html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<style>body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:24px;text-align:center}
button{cursor:pointer;background:#6366f1;color:#fff;border:0;padding:11px 18px;border-radius:9px;font-size:14px}
p{color:#64748b;font-size:13px}</style></head><body>
<p>SweetAlert2 — สวย แต่งได้ มีไอคอน/ปุ่มยืนยัน</p>
<button onclick="ask()">🗑 ลบรายการ</button>
<script>
function ask(){Swal.fire({title:'ลบรายการนี้?',text:'ลบแล้วกู้คืนไม่ได้',icon:'warning',
showCancelButton:true,confirmButtonColor:'#ef4444',cancelButtonColor:'#94a3b8',
confirmButtonText:'ลบเลย',cancelButtonText:'ยกเลิก'}).then(function(r){
if(r.isConfirmed)Swal.fire({title:'ลบแล้ว!',icon:'success',timer:1200,showConfirmButton:false});});}
</script></body></html>`
      }
    ],
    code: `<!-- โหลดจาก CDN ใน <head> -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
function confirmDelete(id) {
  Swal.fire({
    title: 'ลบรายการนี้?',
    text: 'ลบแล้วกู้คืนไม่ได้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'ลบเลย',
    cancelButtonText: 'ยกเลิก'
  }).then((r) => {
    if (r.isConfirmed) {
      google.script.run
        .withSuccessHandler(() => Swal.fire('ลบแล้ว!', '', 'success'))
        .deleteRow(id);
    }
  });
}
</script>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยสร้างปุ่ม "ลบ" ที่:
- กดแล้วเด้ง SweetAlert2 ถามยืนยัน (ไอคอน warning, ปุ่ม "ลบเลย" สีแดง + "ยกเลิก")
- ถ้ายืนยัน เรียก google.script.run.deleteRow(id) แล้วโชว์ popup success
- โหลด SweetAlert2 จาก CDN
- ข้อความเป็นภาษาไทย`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'emoji-vs-fontawesome',
    title: 'Emoji vs Font Awesome (ไอคอน)',
    concept: 'ใช้ emoji (ง่าย แต่หน้าตาต่างกันแต่ละเครื่อง) vs Font Awesome (คม คุมสไตล์ได้)',
    tags: ['Module 5.4'],
    when: 'production ควรใช้ Font Awesome/ไอคอนเซ็ต — emoji ใช้ได้ตอน prototype เร็ว ๆ',
    variants: [
      {
        label: 'Emoji',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:20px}
.row{display:flex;gap:18px;font-size:15px}.row div{display:flex;flex-direction:column;align-items:center;gap:6px}
.ic{font-size:26px}</style></head><body>
<div class="row">
<div><span class="ic">🏠</span>หน้าหลัก</div><div><span class="ic">👤</span>โปรไฟล์</div>
<div><span class="ic">⚙️</span>ตั้งค่า</div><div><span class="ic">🔔</span>แจ้งเตือน</div></div>
</body></html>`
      },
      {
        label: 'Font Awesome',
        html: `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:20px}
.row{display:flex;gap:18px;font-size:15px}.row div{display:flex;flex-direction:column;align-items:center;gap:6px}
.ic{font-size:24px;color:#6366f1}</style></head><body>
<div class="row">
<div><i class="fa-solid fa-house ic"></i>หน้าหลัก</div><div><i class="fa-solid fa-user ic"></i>โปรไฟล์</div>
<div><i class="fa-solid fa-gear ic"></i>ตั้งค่า</div><div><i class="fa-solid fa-bell ic"></i>แจ้งเตือน</div></div>
</body></html>`
      }
    ],
    code: `<!-- โหลด Font Awesome ใน <head> -->
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<!-- ใช้งาน — ปรับสี/ขนาดด้วย CSS ได้ -->
<i class="fa-solid fa-house" style="color:#6366f1"></i> หน้าหลัก
<i class="fa-solid fa-bell"></i> แจ้งเตือน`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยทำแถบเมนูที่ใช้ไอคอน Font Awesome 6
(โหลดจาก CDN) สำหรับเมนู: หน้าหลัก, โปรไฟล์, ตั้งค่า, แจ้งเตือน
ให้ไอคอนเป็นสีแบรนด์ #6366f1 และมีข้อความกำกับใต้ไอคอน`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'plain-vs-spa',
    title: 'หน้าเว็บหลายหน้า vs SPA (หน้าเดียว)',
    concept: 'โหลดใหม่ทั้งหน้าทุกครั้ง vs สลับเนื้อหาทันทีในหน้าเดียว (ไม่กระพริบ)',
    tags: ['Module 4', 'Module 5.3'],
    when: 'GAS Web App นิยมทำ SPA หน้าเดียว เพราะ doGet โหลดใหม่ช้า — สลับ section ด้วย JS ลื่นกว่า',
    variants: [
      {
        label: 'แบบโหลดใหม่ (กระพริบ)',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:0;margin:0}
nav{display:flex;gap:6px;background:#1e293b;padding:10px}
nav a{color:#cbd5e1;text-decoration:none;padding:6px 12px;border-radius:7px;font-size:14px;cursor:pointer}
.body{padding:20px}.flash{animation:f .35s}@keyframes f{from{opacity:0}to{opacity:1}}</style></head><body>
<nav><a onclick="go('หน้าหลัก')">หน้าหลัก</a><a onclick="go('รายงาน')">รายงาน</a><a onclick="go('ตั้งค่า')">ตั้งค่า</a></nav>
<div class="body" id="b"><div class="flash">📄 หน้าหลัก</div></div>
<script>function go(t){var b=document.getElementById('b');
b.innerHTML='<div style="color:#94a3b8">⏳ กำลังโหลดหน้าใหม่...</div>';
setTimeout(function(){b.innerHTML='<div class="flash">📄 '+t+'</div>';},450);}</script>
</body></html>`
      },
      {
        label: 'SPA (สลับทันที)',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:0;margin:0}
nav{display:flex;gap:6px;background:#6366f1;padding:10px}
nav a{color:#e0e7ff;text-decoration:none;padding:6px 12px;border-radius:7px;font-size:14px;cursor:pointer}
nav a.on{background:#fff;color:#6366f1;font-weight:700}.body{padding:20px}</style></head><body>
<nav id="n"><a class="on" onclick="go(this,'หน้าหลัก')">หน้าหลัก</a><a onclick="go(this,'รายงาน')">รายงาน</a><a onclick="go(this,'ตั้งค่า')">ตั้งค่า</a></nav>
<div class="body" id="b">📄 หน้าหลัก</div>
<script>function go(el,t){document.querySelectorAll('#n a').forEach(function(a){a.className='';});
el.className='on';document.getElementById('b').textContent='📄 '+t;}</script>
</body></html>`
      }
    ],
    code: `<!-- SPA: ทุกหน้าอยู่ใน div เดียว สลับด้วย JS -->
<nav>
  <a onclick="show('home')">หน้าหลัก</a>
  <a onclick="show('report')">รายงาน</a>
</nav>
<div id="page-home">...</div>
<div id="page-report" style="display:none">...</div>

<script>
function show(name) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  document.getElementById('page-' + name).style.display = 'block';
}
</script>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยทำ SPA หน้าเดียว 3 หน้า
(หน้าหลัก/รายงาน/ตั้งค่า) ที่สลับเนื้อหาทันทีด้วย JavaScript โดยไม่ reload
มีแถบเมนูด้านบนที่ไฮไลต์หน้าที่กำลังเปิด ใช้ Alpine.js จัดการ state`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'menubar',
    title: 'แถบเมนูบน (Menu bar) หลายสไตล์',
    concept: 'topbar เรียบ vs มี dropdown vs โลโก้กลาง — เลือกตามความซับซ้อนของเมนู',
    tags: ['Module 4-5'],
    when: 'เมนูน้อยใช้แบบเรียบ; เมนูเยอะ/มีหมวดย่อยใช้ dropdown; แบรนด์เด่นใช้โลโก้กลาง',
    variants: [
      {
        label: 'เรียบ ๆ',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0}
nav{display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e2e8f0;padding:12px 16px}
.logo{font-weight:800;color:#6366f1}.links a{margin-left:16px;color:#475569;text-decoration:none;font-size:14px;cursor:pointer}
.links a:hover{color:#6366f1}</style></head><body>
<nav><div class="logo">KP Shop</div><div class="links"><a>หน้าหลัก</a><a>สินค้า</a><a>ติดต่อ</a></div></nav>
</body></html>`
      },
      {
        label: 'มี dropdown',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0}
nav{display:flex;align-items:center;gap:16px;background:#0f172a;padding:12px 16px}
.logo{font-weight:800;color:#fff}a{color:#cbd5e1;text-decoration:none;font-size:14px;cursor:pointer}
.dd{position:relative}.menu{display:none;position:absolute;top:24px;left:0;background:#1e293b;border-radius:9px;padding:6px;min-width:130px}
.dd:hover .menu{display:block}.menu a{display:block;padding:7px 10px;border-radius:6px}.menu a:hover{background:#334155}</style></head><body>
<nav><div class="logo">KP Shop</div><a>หน้าหลัก</a>
<div class="dd"><a>สินค้า ▾</a><div class="menu"><a>เสื้อผ้า</a><a>อุปกรณ์</a><a>โปรโมชั่น</a></div></div><a>ติดต่อ</a></nav>
</body></html>`
      },
      {
        label: 'โลโก้กลาง',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0}
nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;background:#fff;border-bottom:1px solid #e2e8f0;padding:12px 16px}
.l{justify-self:start}.r{justify-self:end}.logo{justify-self:center;font-weight:800;color:#6366f1;font-size:18px}
a{color:#475569;text-decoration:none;font-size:14px;margin:0 8px;cursor:pointer}</style></head><body>
<nav><div class="l"><a>หน้าหลัก</a><a>สินค้า</a></div><div class="logo">KP</div><div class="r"><a>เข้าสู่ระบบ</a></div></nav>
</body></html>`
      }
    ],
    code: `<!-- เมนูมี dropdown (hover เปิด) — pure CSS -->
<nav class="topbar">
  <div class="logo">KP Shop</div>
  <a href="#">หน้าหลัก</a>
  <div class="dropdown">
    <a href="#">สินค้า ▾</a>
    <div class="menu">
      <a href="#">เสื้อผ้า</a><a href="#">อุปกรณ์</a>
    </div>
  </div>
</nav>
<style>
  .dropdown { position: relative; }
  .dropdown .menu { display: none; position: absolute; top: 100%; }
  .dropdown:hover .menu { display: block; }
</style>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยทำแถบเมนูด้านบน (topbar)
มีโลโก้ซ้าย + เมนู หน้าหลัก/สินค้า/ติดต่อ โดยเมนู "สินค้า" เป็น dropdown
(hover แล้วเปิดหมวดย่อย: เสื้อผ้า, อุปกรณ์) ใช้ Tailwind CSS จาก CDN`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'mobile-menu',
    title: 'เมนูบนมือถือ หลายแบบ',
    concept: 'Hamburger drawer vs Bottom nav vs Dropdown — กดเล่นได้ทุกแบบ',
    tags: ['Responsive'],
    when: 'แอปมีไม่กี่หน้าหลัก → Bottom nav กดง่ายด้วยนิ้วโป้ง; เมนูเยอะ → Hamburger drawer',
    variants: [
      {
        label: 'Hamburger + Drawer',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0;height:230px;position:relative;overflow:hidden}
nav{display:flex;justify-content:space-between;align-items:center;background:#6366f1;color:#fff;padding:12px 16px}
.btn{font-size:22px;cursor:pointer;background:none;border:0;color:#fff}
.drawer{position:absolute;top:0;left:-220px;width:200px;height:100%;background:#fff;box-shadow:2px 0 12px rgba(0,0,0,.15);transition:left .25s;padding:16px}
.drawer.open{left:0}.drawer a{display:block;padding:10px;color:#334155;text-decoration:none;border-radius:7px}.drawer a:hover{background:#eef2ff}
.ov{position:absolute;inset:0;background:rgba(0,0,0,.3);display:none}.ov.open{display:block}</style></head><body>
<nav><button class="btn" onclick="o(1)">☰</button><b>KP App</b><span></span></nav>
<div class="ov" id="ov" onclick="o(0)"></div>
<div class="drawer" id="d"><b style="color:#6366f1">เมนู</b><a>หน้าหลัก</a><a>รายงาน</a><a>ตั้งค่า</a><a>ออกจากระบบ</a></div>
<script>function o(s){document.getElementById('d').classList.toggle('open',!!s);document.getElementById('ov').classList.toggle('open',!!s);}</script>
</body></html>`
      },
      {
        label: 'Bottom nav',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0;height:230px;position:relative;background:#f8fafc}
.content{padding:20px;color:#334155}
.bn{position:absolute;bottom:0;left:0;right:0;display:flex;background:#fff;border-top:1px solid #e2e8f0}
.bn button{flex:1;border:0;background:none;padding:9px 0;font-size:11px;color:#94a3b8;cursor:pointer;display:flex;flex-direction:column;gap:3px;align-items:center}
.bn button .i{font-size:19px}.bn button.on{color:#6366f1}</style></head><body>
<div class="content" id="c">📄 หน้าหลัก</div>
<div class="bn" id="bn">
<button class="on" onclick="go(this,'หน้าหลัก')"><span class="i">🏠</span>หน้าหลัก</button>
<button onclick="go(this,'รายงาน')"><span class="i">📊</span>รายงาน</button>
<button onclick="go(this,'แจ้งเตือน')"><span class="i">🔔</span>แจ้งเตือน</button>
<button onclick="go(this,'ฉัน')"><span class="i">👤</span>ฉัน</button></div>
<script>function go(el,t){document.querySelectorAll('#bn button').forEach(function(b){b.className='';});el.className='on';document.getElementById('c').textContent='📄 '+t;}</script>
</body></html>`
      },
      {
        label: 'Dropdown',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0;height:230px}
nav{display:flex;justify-content:space-between;align-items:center;background:#0f172a;color:#fff;padding:12px 16px}
.btn{cursor:pointer;background:#334155;border:0;color:#fff;padding:7px 12px;border-radius:8px;font-size:14px}
.menu{display:none;background:#fff;border-bottom:1px solid #e2e8f0}.menu.open{display:block}
.menu a{display:block;padding:12px 16px;color:#334155;text-decoration:none;border-top:1px solid #f1f5f9}</style></head><body>
<nav><b>KP App</b><button class="btn" onclick="document.getElementById('m').classList.toggle('open')">เมนู ▾</button></nav>
<div class="menu" id="m"><a>หน้าหลัก</a><a>รายงาน</a><a>ตั้งค่า</a></div>
</body></html>`
      }
    ],
    code: `<!-- Hamburger + Drawer (เลื่อนเข้าจากซ้าย) -->
<button onclick="toggleDrawer()">☰</button>
<div id="drawer" class="drawer">
  <a href="#">หน้าหลัก</a><a href="#">รายงาน</a>
</div>
<div id="overlay" onclick="toggleDrawer()"></div>

<style>
  .drawer { position: fixed; top: 0; left: -240px; width: 220px; height: 100%;
            transition: left .25s; }
  .drawer.open { left: 0; }
</style>
<script>
  function toggleDrawer() {
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
  }
</script>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ที่ใช้บนมือถือ ช่วยทำเมนู 2 แบบให้เลือก:
1) Hamburger (☰) ที่กดแล้ว drawer เลื่อนเข้าจากซ้าย + overlay มืดด้านหลัง
2) Bottom navigation 4 ปุ่ม (หน้าหลัก/รายงาน/แจ้งเตือน/ฉัน) ไฮไลต์ปุ่มที่เลือก
ใช้ Tailwind CSS + Alpine.js`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'loading-states',
    title: 'สถานะกำลังโหลด: Spinner vs Skeleton vs Progress',
    concept: 'บอกผู้ใช้ว่ากำลังโหลด — แบบไหนให้ความรู้สึกเร็ว/ลื่นกว่ากัน',
    tags: ['Module 5'],
    when: 'Skeleton ให้ความรู้สึกเร็วที่สุด (เห็นโครงหน้าก่อน); Spinner ใช้ตอนรอสั้น ๆ; Progress ใช้ตอนรู้ %',
    variants: [
      {
        label: 'Spinner',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui;margin:0;height:170px;display:flex;align-items:center;justify-content:center}
.sp{width:38px;height:38px;border:4px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:s 1s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}</style></head><body><div class="sp"></div></body></html>`
      },
      {
        label: 'Skeleton',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui;margin:0;padding:18px}
.sk{background:linear-gradient(90deg,#eef2f7 25%,#e2e8f0 37%,#eef2f7 63%);background-size:400% 100%;animation:sh 1.3s infinite;border-radius:8px}
@keyframes sh{0%{background-position:100% 0}100%{background-position:-100% 0}}
.l{height:14px;margin-bottom:10px}.w70{width:70%}.w90{width:90%}.w50{width:50%}.box{height:54px;margin-bottom:14px}</style></head><body>
<div class="sk box"></div><div class="sk l w90"></div><div class="sk l w70"></div><div class="sk l w50"></div></body></html>`
      },
      {
        label: 'Progress bar',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui;margin:0;height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.bar{width:70%;height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden}
.fill{height:100%;width:0;background:#6366f1;border-radius:99px;transition:width .2s}
span{color:#64748b;font-size:13px}</style></head><body>
<div class="bar"><div class="fill" id="f"></div></div><span id="t">0%</span>
<script>var p=0;setInterval(function(){p=(p+7)%108;var v=Math.min(p,100);
document.getElementById('f').style.width=v+'%';document.getElementById('t').textContent=v+'%';},250);</script>
</body></html>`
      }
    ],
    code: `<!-- Skeleton — โชว์โครงหน้าระหว่างรอ google.script.run -->
<div id="skeleton">
  <div class="sk box"></div><div class="sk line w90"></div>
</div>
<div id="content" style="display:none"></div>

<style>
  .sk { background: linear-gradient(90deg,#eef2f7 25%,#e2e8f0 37%,#eef2f7 63%);
        background-size: 400% 100%; animation: shimmer 1.3s infinite; }
  @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
</style>
<script>
  google.script.run.withSuccessHandler((data) => {
    skeleton.style.display = 'none';
    content.style.display = 'block';
    // ...เติมข้อมูล
  }).getData();
</script>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยทำ skeleton loader:
ระหว่างที่รอ google.script.run.getData() ให้โชว์โครงหน้าแบบ shimmer (กล่อง + เส้น ๆ)
พอข้อมูลมาแล้วค่อยซ่อน skeleton แล้วโชว์เนื้อหาจริง ใช้ CSS animation`
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'toast',
    title: 'แจ้งเตือนแบบ Toast (เด้งมุมจอ)',
    concept: 'ข้อความแจ้งผลสั้น ๆ ที่เด้งขึ้นแล้วหายเอง — ไม่ขวางการใช้งานเหมือน alert()',
    tags: ['Module 5'],
    when: 'ใช้บอกผลการกระทำ (บันทึกแล้ว/ลบแล้ว/ผิดพลาด) โดยไม่ต้องให้ผู้ใช้กดปิด',
    variants: [
      {
        label: 'กดเพื่อดู toast',
        html: `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,'Noto Sans Thai',sans-serif;padding:20px}
button{cursor:pointer;border:0;color:#fff;padding:9px 14px;border-radius:9px;font-size:14px;margin:4px}
.ok{background:#22c55e}.err{background:#ef4444}
#wrap{position:fixed;top:14px;right:14px;display:flex;flex-direction:column;gap:8px}
.toast{background:#0f172a;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.2);animation:in .25s}
.toast.ok{background:#16a34a}.toast.err{background:#dc2626}@keyframes in{from{transform:translateX(40px);opacity:0}}</style></head><body>
<button class="ok" onclick="t('บันทึกสำเร็จ ✓','ok')">บันทึก</button>
<button class="err" onclick="t('เกิดข้อผิดพลาด ✗','err')">ลองพลาด</button>
<div id="wrap"></div>
<script>function t(msg,k){var d=document.createElement('div');d.className='toast '+k;d.textContent=msg;
document.getElementById('wrap').appendChild(d);setTimeout(function(){d.remove();},2200);}</script>
</body></html>`
      }
    ],
    code: `<script>
function toast(msg, type) {        // type: 'ok' | 'err'
  const d = document.createElement('div');
  d.className = 'toast ' + (type || 'ok');
  d.textContent = msg;
  document.getElementById('toast-wrap').appendChild(d);
  setTimeout(() => d.remove(), 2200);
}
// ใช้คู่กับ google.script.run
google.script.run
  .withSuccessHandler(() => toast('บันทึกสำเร็จ ✓', 'ok'))
  .withFailureHandler((e) => toast(e.message, 'err'))
  .saveRow(data);
</script>`,
    prompt: `ในเว็บแอป Google Apps Script (HtmlService) ช่วยทำระบบ toast notification:
- ฟังก์ชัน toast(msg, type) ที่เด้งกล่องข้อความมุมขวาบน แล้วหายเองใน ~2 วินาที
- type 'ok' สีเขียว, 'err' สีแดง, มี animation เลื่อนเข้า
- เรียกใช้ตอน withSuccessHandler / withFailureHandler ของ google.script.run`
  }
];
