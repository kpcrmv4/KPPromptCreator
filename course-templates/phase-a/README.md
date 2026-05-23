# KP GAS Sandbox — Phase A Template

Template สำหรับคอร์ส GAS Mastery Modules 1-3 (Sheet-bound)

## สิ่งที่ผู้สร้าง template (admin) ต้องทำ — ทำครั้งเดียว

### ขั้นที่ 1 — สร้าง Sheet ต้นฉบับ

1. ไปที่ https://sheets.new (สร้าง Google Sheet เปล่า)
2. เปลี่ยนชื่อเป็น `KP GAS Sandbox` (จะถูก rename อัตโนมัติตอน setup ก็ได้)
3. เมนู **Extensions → Apps Script**
4. ลบโค้ดเริ่มต้นใน `Code.gs` ทิ้ง
5. เปิดไฟล์ [`Code.gs`](./Code.gs) ใน repo → คัดลอกทั้งหมด → paste ลงไป
6. Save (Ctrl+S หรือไอคอนแผ่นดิสก์)
7. เปลี่ยนชื่อ project ของ Apps Script เป็น `KP GAS Sandbox` (คลิกชื่อ Untitled Project ด้านบน)

### ขั้นที่ 2 — รัน setup ครั้งแรก

1. ใน Apps Script editor — เลือก function `setupSandbox` จาก dropdown ด้านบน
2. กด **Run**
3. ครั้งแรกจะมี popup ขออนุญาต — ทำตาม:
   - "Review permissions" → เลือกบัญชี Google ของคุณ
   - "Google hasn't verified this app" → คลิก **Advanced**
   - "Go to KP GAS Sandbox (unsafe)" → คลิก
   - "Allow"
4. กลับมาที่ Sheet — refresh หน้า (F5)
5. ดูว่ามี:
   - เมนู `🎓 Sandbox` โผล่ขึ้นมา
   - Sheet: Config / Data / Output / Logs (README ถูกซ่อน)
   - ใน Data sheet มี sample data 20 แถว พร้อม conditional formatting (สี active/pending/inactive)

### ขั้นที่ 3 — ทดสอบ

1. คลิก **🎓 Sandbox → ▶ Hello World**
2. ควรเห็น alert + Output sheet มี `Hello World — <วันเวลา>`
3. เปิด **View → Execution log** (Ctrl+Enter) → ควรเห็น log

ถ้าทำได้ทั้ง 3 ข้อนี้ = template พร้อมใช้

### ขั้นที่ 4 — Publish ให้ learner copy ได้

1. กลับมาที่ Sheet (ไม่ใช่ script editor)
2. เมนู **File → Share → Share with others**
3. ตั้ง **"Anyone with the link"** → permission = **Viewer**
4. คัดลอก share URL — ตัวอย่าง:
   ```
   https://docs.google.com/spreadsheets/d/1abc...XYZ/edit?usp=sharing
   ```
5. แก้ URL — เปลี่ยนส่วนท้ายจาก `/edit?usp=sharing` เป็น `/copy`:
   ```
   https://docs.google.com/spreadsheets/d/1abc...XYZ/copy
   ```
6. ทดสอบ — เปิด URL นี้ใน incognito (หรือ logout) → ควรเห็นปุ่ม "Make a copy"

### ขั้นที่ 5 — เอา /copy URL ใส่ในระบบเรา

1. ไปที่ `/admin-courses.html`
2. เลือกคอร์ส GAS Mastery
3. (ตรงนี้ต้องเพิ่ม UI ใส่ template URL — รอ feature ต่อไป)

**ชั่วคราว** — update ผ่าน Supabase SQL:
```sql
UPDATE courses
SET meta = jsonb_set(
  COALESCE(meta, '{}'::jsonb),
  '{templates}',
  '[{
    "phase": "A",
    "covers_modules": [1, 2, 3],
    "title": "GAS Sandbox (Sheet-bound)",
    "copy_url": "https://docs.google.com/spreadsheets/d/<SHEET_ID>/copy"
  }]'::jsonb
)
WHERE slug = 'gas-mastery';
```

---

## โครงสร้างของ Sandbox Sheet หลัง setup

```
KP GAS Sandbox
├── Config    — key/value สำหรับ ADMIN_EMAIL, DATE_FORMAT, ฯลฯ (ใช้ใน Module 3)
├── Data      — 20 แถว customer ตัวอย่าง (ID, Name, Email, Phone, Status, CreatedAt)
├── Output    — ผลของ exercise แต่ละบทจะแสดงที่นี่
├── Logs      — สำหรับ exercise Logger.log ใน Module 1.4
└── README    — (hidden) instructions สำหรับ learner
```

### Apps Script project

```
KP GAS Sandbox
└── Code.gs   — มีทุกอย่างใน 1 ไฟล์ (lesson ถัดไปจะให้ learner สร้างไฟล์เพิ่ม)
    ├── setupSandbox()         — สร้าง/reset structure (admin ใช้)
    ├── onOpen()                — สร้างเมนู (รันอัตโนมัติเมื่อเปิด Sheet)
    ├── helloWorld()            — ฟังก์ชันแรกที่ learner รัน
    ├── showConfig()            — แสดง config ใน log
    ├── clearOutput() / clearLogs()
    └── setup helpers (private — _setupConfigSheet ฯลฯ)
```

---

## เมื่อมี update Code.gs ในอนาคต

ถ้าผมแก้ `Code.gs` ใน repo — แล้วต้องการให้ template Sheet ของคุณ sync ด้วย:

1. เปิด Sheet ของคุณ → Apps Script
2. คัดลอกเนื้อหา `Code.gs` ใหม่ทั้งหมด → paste ทับของเดิม
3. Save
4. รัน `setupSandbox` อีกครั้ง (จะ reset structure แต่ไม่กระทบ learner ที่ copy ไปแล้ว)

---

## หมายเหตุสำคัญ

- **learner ที่ "Make a copy" ก่อน update — จะมี code เก่า** ตลอดไป (เป็นเรื่องปกติของ Google Drive)
- ถ้า bug ร้ายแรง — แจ้ง learner ทาง notification ในระบบเรา + ให้ "Make a copy ใหม่"
- เก็บ `SHEET_ID` ของ template ต้นฉบับไว้ดี ๆ — เปลี่ยนทีหลังจะกระทบ /copy URL
