-- =============================================
-- Lesson 1.2 — Container-bound vs Standalone
-- Module 1 · Position 2 · Free preview · Published
-- Re-runnable
--
-- ALSO includes:
--   - Rename all modules: "Module N —" → "บทที่ N —" (12 rows)
--   - Update Module 1 description to match new lesson plan
--
-- 🖼 IMAGES NEEDED (placeholder URLs ใน content รอเปลี่ยน):
--   fig-1: Google Sheet เมนู Extensions → Apps Script
--          → ถ่ายตอนเปิด Sheet เปล่า ๆ แล้วคลิก Extensions
--   fig-2: หน้า script.google.com landing page
--          → ถ่ายหน้าแรกหลัง login
--   fig-3: Google Drive แสดง 2 ไฟล์เคียงกัน
--          → 1 Sheet (icon เขียว) + 1 standalone script (icon สีน้ำเงิน)
--          → screenshot ใน Drive list view
-- =============================================

-- ==========================================
-- 1) Rename all module titles to Thai
-- ==========================================
UPDATE course_modules SET title = 'บทที่ 1 — เริ่มต้นกับ GAS',
  description = 'GAS คืออะไร, Container-bound vs Standalone, Hello World ครั้งแรก, Editor + Logger.log, ไฟล์อยู่ที่ไหน, สำเนา template มาเริ่มเรียน'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 1;

UPDATE course_modules SET title = 'บทที่ 2 — JavaScript essentials สำหรับ GAS'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 2;

UPDATE course_modules SET title = 'บทที่ 3 — Sheets operations'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 3;

UPDATE course_modules SET title = 'บทที่ 4 — Web App foundations'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 4;

UPDATE course_modules SET title = 'บทที่ 5 — Alpine.js สำหรับ GAS'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 5;

UPDATE course_modules SET title = 'บทที่ 6 — Authentication'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 6;

UPDATE course_modules SET title = 'บทที่ 7 — Google services integration'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 7;

UPDATE course_modules SET title = 'บทที่ 8 — PDF + QR Code'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 8;

UPDATE course_modules SET title = 'บทที่ 9 — AI prompt engineering สำหรับ GAS'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 9;

UPDATE course_modules SET title = 'บทที่ 10 — clasp + CI/CD'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 10;

UPDATE course_modules SET title = 'บทที่ 11 — Messaging APIs'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 11;

UPDATE course_modules SET title = 'บทที่ 12 — Capstone project'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery') AND sort_order = 12;


-- ==========================================
-- 2) Insert/Update lesson 1.2
-- ==========================================
WITH target AS (
  SELECT cm.id AS module_id, cm.course_id
  FROM course_modules cm
  JOIN courses c ON c.id = cm.course_id
  WHERE c.slug = 'gas-mastery' AND cm.sort_order = 1
)
INSERT INTO lessons (
  module_id, course_id, sort_order, title, summary,
  content_md, code_snippets, image_urls,
  estimated_minutes, is_free_preview, is_published
)
SELECT
  module_id, course_id, 2,
  'Container-bound vs Standalone — เลือกแบบไหนดี',
  'ทำความเข้าใจ 2 แบบของ GAS — script ที่ผูกกับ Sheet/Doc/Form vs ไฟล์อิสระใน Drive · เลือกแบบไหน เมื่อไหร่',
  $LESSON$ตอนคุณค้นหาวิธีเขียน GAS ในเน็ต จะเจอตัวอย่างแบ่งเป็น 2 แบบ — บางคนสอนให้เปิดผ่าน Google Sheet เลย บางคนสอนให้ไปที่ script.google.com — **ทั้ง 2 แบบไม่ผิด** แค่เป็นคนละแบบ และเหมาะกับงานคนละประเภท

บทนี้จะอธิบายให้คุณ "เลือกถูก" ตั้งแต่บทแรก ไม่ต้องเสียเวลาทำผิดทางแล้วมาย้ายทีหลัง

## แบบที่ 1 — Container-bound (ผูกกับไฟล์)

ชื่อยาวสุดของศาลเลย แต่แปลตรง ๆ คือ **"script ที่อยู่ในกล่อง (container)"** ซึ่งกล่องนั้นคือไฟล์ Google ที่มันผูกอยู่ — อาจจะเป็น Sheet, Doc, Form, หรือ Slide

วิธีสร้าง:
1. เปิด Google Sheet (หรือ Doc/Form/Slide) ที่ต้องการ
2. เมนู **Extensions → Apps Script**
3. หน้าต่าง script editor จะเปิดมา — script ที่สร้างจะ "ผูก" กับไฟล์นี้ตลอดไป

![เปิด Apps Script ผ่าน Extensions menu](https://placeholder.kp/lesson-1.2-fig-1.png)

**จุดเด่นของ container-bound:**

- เข้าถึงไฟล์ที่ผูกอยู่ได้ทันที — `SpreadsheetApp.getActive()` คืนค่า Sheet นั้นเลย โดยไม่ต้องระบุ ID
- ใช้ `onOpen()` ทำเมนูใน Sheet ได้
- ใช้ `onEdit()` รู้ได้ทันทีเวลา user แก้ cell
- share script พ่วงไปกับ share Sheet — ไม่ต้องตั้ง permission แยก
- copy Sheet → script ถูก copy ไปด้วยอัตโนมัติ (สำคัญมาก — ใช้กระจาย template ในคอร์สนี้)

**จุดอ่อน:**

- script ผูกกับไฟล์เดียว — ลบ Sheet = script หายไปด้วย
- หาเจอยาก — ไม่โผล่ใน Drive ตรง ๆ ต้องเปิดจาก Sheet เท่านั้น
- ถ้าจะรัน script จากที่อื่นต้องเปิด Sheet นั้นก่อน

**ใช้เมื่อไหร่:**
ถ้า workflow ของคุณวนเวียนรอบ Sheet/Doc/Form ใดไฟล์หนึ่งโดยเฉพาะ — เช่น ระบบจัดการออเดอร์ที่ทุกอย่างอยู่ใน Sheet เดียว, ฟอร์มลงทะเบียนที่อ่านเขียน Doc เดียว

## แบบที่ 2 — Standalone (ไฟล์อิสระ)

Standalone = script ที่อยู่ใน Drive ของคุณเหมือนไฟล์ปกติ ไม่ได้ผูกกับใคร เปิดได้เลยตรง ๆ จาก Drive

วิธีสร้าง:
1. ไปที่ https://script.google.com (หรือพิมพ์ "Apps Script" ใน Google search)
2. คลิก **+ New project**
3. ได้ project เปล่า — script จะเก็บใน Drive ตรง ๆ

![หน้า script.google.com](https://placeholder.kp/lesson-1.2-fig-2.png)

**จุดเด่นของ standalone:**

- ไฟล์อิสระ — เห็นใน Drive list view, จัดการเหมือนไฟล์อื่น
- ทำงานกับหลาย Sheet ได้ — `SpreadsheetApp.openById('xxx')` เปิดได้ทุกไฟล์ที่มี access
- ทำ Web App ได้เต็มรูปแบบ (มี URL public ของตัวเอง)
- เหมาะทำ library ที่ project อื่นมา import ใช้

**จุดอ่อน:**

- ไม่มี `onOpen()` (เพราะไม่มี container ให้เปิด)
- ทุกครั้งที่จะแตะ Sheet ต้องระบุ ID ก่อน — มี boilerplate มากกว่า
- share permission ต้องตั้งแยก

**ใช้เมื่อไหร่:**
ถ้าจะทำ Web App, ระบบที่ทำงานกับหลาย Sheet พร้อมกัน, ระบบที่ trigger จากภายนอก, หรือ library ที่จะให้ project อื่นใช้

## เปรียบเทียบให้เห็นภาพ

| หัวข้อ | Container-bound | Standalone |
|---|---|---|
| ตำแหน่งไฟล์ | ฝังใน Sheet/Doc/Form/Slide | ใน Drive เหมือนไฟล์อื่น |
| เปิดได้จาก | เมนู Extensions ของไฟล์แม่ | Drive list, script.google.com |
| `getActive()` | ✅ ได้ — คืนไฟล์แม่ทันที | ❌ ต้องใช้ `openById()` |
| `onOpen()` / `onEdit()` | ✅ ใช้ได้ | ❌ ใช้ไม่ได้ |
| Custom menu ใน Sheet | ✅ ทำได้ | ❌ ไม่ได้ |
| Web App deployment | ⚠ ทำได้ แต่ไม่แนะนำ | ✅ เหมาะที่สุด |
| Share พร้อม Sheet | ✅ อัตโนมัติ | ❌ ตั้งแยก |
| Copy Sheet พร้อม script | ✅ ติดไปด้วย | ❌ คนละไฟล์ |

## ดูจาก Drive — ต่างกันยังไง

เปิด Google Drive ของคุณ จะเห็นไฟล์ทั้ง 2 ประเภทอยู่คนละแบบ:

- **Sheet (ที่มี container-bound script ฝังอยู่)** — icon Sheet สีเขียวปกติ ไม่มีอะไรบอกว่ามี script ข้างใน
- **Standalone script** — icon ของ Apps Script เอง (สี่เหลี่ยมสีน้ำเงิน) ชื่อไฟล์ลงท้าย ".gs" หรือไม่มี extension

![เปรียบเทียบใน Drive](https://placeholder.kp/lesson-1.2-fig-3.png)

> 💡 **เคล็ดลับ:** ถ้าจำไม่ได้ว่า Sheet ไหนมี script ฝังอยู่ — เปิด Sheet แล้วดูเมนู Extensions ถ้าโผล่ "Apps Script" + ชื่อ project แสดงว่ามี

## Decision Flowchart — ฉันควรเลือกแบบไหน

ถามตัวเอง 3 ข้อนี้ตามลำดับ:

**1. ระบบนี้จะมี UI/หน้าจอที่ user เข้ามาใช้ผ่านเว็บไหม?**
- ใช่ → **Standalone** (ทำ Web App)
- ไม่ → ไปข้อ 2

**2. ระบบนี้ทำงานกับ Sheet/Doc/Form **ไฟล์เดียว** เป็นหลักไหม?**
- ใช่ → **Container-bound** (เพราะใช้ `getActive()` + `onOpen()` ได้)
- ไม่ → **Standalone**

**3. (สำหรับ container-bound) ต้องการให้ user copy ไฟล์ไปใช้เองได้ไหม?**
- ใช่ → **Container-bound** เหมาะ (copy Sheet = ได้ script ติดไปด้วย)
- ไม่ → ทางไหนก็ได้

## ตัวอย่างจริง — ในเคสนี้ใช้แบบไหน?

ลองดูเคสจริง 4 เคส ตอบในใจก่อน แล้วเช็คคำตอบ:

**เคส 1:** ระบบจัดการลูกค้าที่ทุกอย่างอยู่ใน Sheet เดียว — มีปุ่ม "ส่ง email" บนเมนู Sheet
→ **Container-bound** (ใช้ `onOpen()` ทำเมนู + getActive() เข้าถึง Sheet ตรง ๆ)

**เคส 2:** Web App ลงทะเบียนเรียนออนไลน์ที่มีหน้า login + ฟอร์ม
→ **Standalone** (Web App)

**เคส 3:** ระบบรายงานยอดขายที่ดึงข้อมูลจาก 5 Sheet ของสาขาต่างกัน รวมเป็น 1 Sheet สรุป
→ **Standalone** (ต้อง `openById()` หลายไฟล์ — `getActive()` ไม่พอ)

**เคส 4:** template สำหรับร้านขายของออนไลน์ที่จะให้คนอื่น copy ไปใช้
→ **Container-bound** (copy Sheet → script ติดไปด้วยอัตโนมัติ)

## ย้ายระหว่าง 2 แบบได้ไหม?

ได้ครับ แต่ทำมือ — ไม่มีปุ่ม "convert":

- **Container → Standalone:** copy โค้ดทั้งหมดไปวางใน standalone project ใหม่ + แก้ `getActive()` เป็น `openById()`
- **Standalone → Container:** copy โค้ดไปวางใน script editor ของ Sheet + แก้ `openById()` เป็น `getActive()` (ถ้าใช้ Sheet เดียว)

ดังนั้นเลือกถูกตั้งแต่แรกประหยัดเวลา

## สรุปบทนี้

- **Container-bound** = script ฝังใน Sheet/Doc/Form/Slide → ใช้กับงานที่วนรอบไฟล์เดียว
- **Standalone** = script อิสระใน Drive → ใช้กับ Web App หรือทำงานหลายไฟล์
- ใช้ flowchart 3 ข้อตัดสินใจ
- ในคอร์สนี้ Module 1-3 ใช้ **container-bound** (เริ่มจากของง่าย), Module 4+ จะเปลี่ยนไปใช้ **standalone** (Web App)

## ต่อไปเรียนอะไร

บทถัดไป (1.3) เราจะลงมือ **เขียน Hello World** ตัวแรก — สร้าง project, รัน function, ผ่านหน้า OAuth popup ที่น่ากลัว, แล้วดู log แรกของคุณ

---

> 💡 **Checkpoint:** ลองตอบเอง
>
> - container-bound กับ standalone ต่างกันที่อะไรเป็นหลัก?
> - ถ้าจะทำเมนูใน Sheet — ต้องใช้แบบไหน?
> - ถ้าจะทำ Web App — ต้องใช้แบบไหน?
> - ในคอร์สนี้ Module 1-3 ใช้แบบไหน?$LESSON$,
  '[]'::jsonb,
  '["https://placeholder.kp/lesson-1.2-fig-1.png", "https://placeholder.kp/lesson-1.2-fig-2.png", "https://placeholder.kp/lesson-1.2-fig-3.png"]'::jsonb,
  12, true, true
FROM target
ON CONFLICT (module_id, sort_order) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_md = EXCLUDED.content_md,
  code_snippets = EXCLUDED.code_snippets,
  image_urls = EXCLUDED.image_urls,
  estimated_minutes = EXCLUDED.estimated_minutes,
  is_free_preview = EXCLUDED.is_free_preview,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


-- ==========================================
-- 3) Recompute totals
-- ==========================================
UPDATE courses SET
  total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id AND is_published = true),
  total_modules = (SELECT COUNT(*) FROM course_modules WHERE course_id = courses.id)
WHERE slug = 'gas-mastery';


-- ==========================================
-- 4) Verify
-- ==========================================
SELECT
  l.sort_order, l.title, l.is_free_preview, l.is_published, l.estimated_minutes,
  length(l.content_md) AS content_chars,
  jsonb_array_length(l.image_urls) AS image_count
FROM lessons l
JOIN course_modules m ON m.id = l.module_id
JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'gas-mastery' AND m.sort_order = 1
ORDER BY l.sort_order;
