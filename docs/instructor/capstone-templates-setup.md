# [Instructor] วิธี publish Template ของ Capstone (A · B · C)

> เอกสารนี้สำหรับ **เจ้าของคอร์ส** เท่านั้น — ไม่ได้อยู่ในบทเรียนที่นักเรียนเห็น
> เป้าหมาย: เปลี่ยนโค้ดในบทเรียน (`code_snippets`) ให้เป็น **Google template ที่กด "ทำสำเนา" ได้ในคลิกเดียว**
> นักเรียนแค่กดลิงก์ `/copy` → ได้ระบบที่รันได้ทันที โดยไม่ต้อง copy-paste ทีละไฟล์

แต่ละ Capstone ทำเหมือนกัน 6 ขั้น ต่างกันแค่ชื่อแท็บ Sheet กับไฟล์ในสคริปต์

---

## ขั้นทั่วไป (ทำกับทุก Project)

1. **สร้าง Google Sheet ใหม่** ตั้งชื่อสื่อความ เช่น `Template — Project A (Event Registration)`
2. **สร้างแท็บ + หัวคอลัมน์** ตามตารางของแต่ละ project ด้านล่าง (พิมพ์หัวคอลัมน์แถวที่ 1 ให้ตรงเป๊ะ — โค้ดอ้างชื่อคอลัมน์)
3. **Extensions → Apps Script** → วางไฟล์จาก `code_snippets` ของบทนั้น
   - ไฟล์ `.gs`: วางใน `Code.gs` (หรือสร้างไฟล์ `.gs` เพิ่มถ้าบทแยกหลายไฟล์)
   - ไฟล์ `.html`: กด **+ → HTML** ตั้งชื่อ **ไม่ต้องใส่ `.html`** (เช่น `Index`, `Admin`, `Staff`, `CheckIn`, `Dashboard`)
   - `appsscript.json`: **Project Settings (⚙️) → ☑ Show "appsscript.json"** แล้ววางทับ
4. **ใส่ข้อมูลตัวอย่าง 1 แถว** ในแท็บหลัก (ดูด้านล่าง) เพื่อให้เปิดมาเห็นของจริงทำงาน
5. **Share → General access → Anyone with the link = Viewer**
6. ก๊อป URL มา **เปลี่ยนท้าย** `/edit#gid=0` → `/copy`
   - ได้: `https://docs.google.com/spreadsheets/d/<ID>/copy`
   - เปิดลิงก์นี้ = Google เด้งถาม "ทำสำเนา" ทันที
7. เอาลิงก์ `/copy` ไป **แทน `(#)`** ใน "ขั้นที่ 0" ของบทเรียน
   (แก้ใน DB — บอก Claude พร้อมลิงก์ แล้วจะ `UPDATE lessons ... content_md` ให้)

> 💡 ถ้าใช้ LINE (Project B/C): ตั้ง token ผ่าน **Project Settings → Script properties**
> `LINE_TOKEN`, `LINE_ADMIN` (B) — ถ้าไม่ตั้ง ระบบหลักทำงานปกติ แค่ไม่ส่ง LINE (ออกแบบให้ no-op)

---

## Project A — Event Registration  (`lesson 12.2`)
แท็บ Sheet:
- **Events** — `EventID · Title · Date · Venue · MaxAttendees · Status`  (ใส่ตัวอย่าง 1 แถว, Status = `active`)
- **Registrations** — `RegID · EventID · Name · Email · Phone · QRToken · Status · RegisteredAt · CheckedInAt`
- **CheckInLog** — `QRToken · Name · Timestamp`

ไฟล์สคริปต์: `appsscript.json` · `Code.gs` · `Index` · `CheckIn` · `Dashboard`
หลัง publish: deploy เป็น Web App (Execute as **Me**, access **Anyone**) เพื่อทดสอบ QR/อีเมล

---

## Project B — Order Management  (`lesson 12.3`)
แท็บ Sheet:
- **Products** — `ProductID · Name · Price · Stock · Image · Active`  (ใส่สินค้าตัวอย่าง 2-3 แถว, Active = `TRUE`)
- **Orders** — `OrderID · CustomerName · Phone · Email · LineUserId · Address · ItemsJSON · Total · Status · CreatedAt · UpdatedAt`

ไฟล์สคริปต์: `appsscript.json` · `Code.gs` · `Index` (ร้านค้า) · `Admin`
Script properties (ออปชัน): `ADMIN_PASSCODE` (ถ้าไม่ตั้ง default `admin1234` — **ควรเปลี่ยน**), `LINE_TOKEN`, `LINE_ADMIN`

---

## Project C — Appointment Booking  (`lesson 12.4`)
แท็บ Sheet:
- **Services** — `ServiceID · Name · DurationMin · Price · Active`  (ใส่บริการตัวอย่าง 1-2 แถว)
- **Bookings** — `BookingID · Name · Email · Phone · LineUserId · ServiceID · StartTime · EndTime · Status · CalEventID · CreatedAt`
- **Schedule** — `DayOfWeek · OpenTime · CloseTime · Active`  (0=อา..6=ส, เช่น 1 / 09:00 / 17:00 / TRUE)
- **TimeOffs** — `Date · Reason`

ไฟล์สคริปต์: `appsscript.json` · `Code.gs` · `Index` (จองคิว) · `Staff`
หลัง deploy: รัน `setupReminders()` 1 ครั้ง เพื่อสร้าง time-trigger เตือนนัด
**สำคัญ:** ตั้ง `appsscript.json` → `timeZone = "Asia/Bangkok"` ให้ตรง (โค้ดคำนวณวันในสัปดาห์อิง TZ นี้)

---

## หมายเหตุ
- โค้ดทุก project **ไม่มี ID ให้แก้** — ใช้ `SpreadsheetApp.getActive()` (script ผูกกับ Sheet ที่ copy มา),
  `CalendarApp.getDefaultCalendar()`, `ScriptApp.getService().getUrl()` → "ทำสำเนา" แล้ว deploy ได้เลย
- ถ้ายังไม่ publish template: นักเรียนยัง **สร้างเองจากศูนย์ได้** ทันทีจากไฟล์เต็มใน `code_snippets` (มีปุ่มคัดลอกในหน้าเรียน) — ไม่มีใครติดค้าง
