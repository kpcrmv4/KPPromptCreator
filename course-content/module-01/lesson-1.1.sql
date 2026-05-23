-- =============================================
-- Lesson 1.1 — Google Apps Script คืออะไร
-- Module 1 · Position 1 · Free preview · Published
-- Re-runnable (ON CONFLICT updates content)
-- =============================================

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
  module_id, course_id, 1,
  'Google Apps Script คืออะไร — ทำไมต้องเรียน',
  'แนะนำให้รู้จัก GAS, เปรียบเทียบกับ VBA/Zapier/Python, ใครเหมาะ-ไม่เหมาะ, quota limits',
  $LESSON$ก่อนจะลงโค้ดบรรทัดแรก เรามาเข้าใจกันก่อนว่า Google Apps Script (เรียกสั้น ๆ ว่า **GAS**) มันคืออะไร เกิดมาทำอะไร และทำไมคนถึงเลือกใช้

## ลองนึกภาพปัญหานี้ดู

สมมุติคุณเปิดร้านขายของออนไลน์เล็ก ๆ ทุกวันคุณต้องทำสิ่งเดิม ๆ ซ้ำกัน:

- เปิด Google Sheet เช็คออเดอร์ใหม่
- copy ที่อยู่ลูกค้าไปแปะลงไฟล์ Word ทำใบส่ง
- copy เบอร์โทรลูกค้าไปแปะใน LINE เพื่อยืนยันออเดอร์
- พอเช็คเงินเข้าธนาคารแล้ว ก็มา mark "จ่ายแล้ว" ใน Sheet

วันละ 10 ออเดอร์ = วันละ 30 นาทีหายไปกับงาน copy-paste

**คำถามคือ — งานพวกนี้คอมพ์ทำเองได้ไหม?**

ได้ครับ เครื่องมือนึงที่ทำได้คือ **Google Apps Script**

## GAS คืออะไรกันแน่

ถ้าจะอธิบายแบบสั้นที่สุด:

> **Google Apps Script คือเครื่องมือเขียนสคริปต์ที่ทำให้ Google Sheet, Gmail, Drive, Calendar, Form (และอื่น ๆ) ทำงานอัตโนมัติได้**

มันใช้ภาษาคล้าย ๆ JavaScript เขียนผ่านเว็บ บันทึกอยู่ใน Google Drive รันบนเซิร์ฟเวอร์ของ Google ฟรี — ไม่ต้องลงโปรแกรม ไม่ต้องเช่า server ไม่ต้องมีบัตรเครดิต

ตัวอย่างสิ่งที่ทำได้:

- เปิด Sheet แล้วมีปุ่ม "ส่งใบเสนอราคา" — กดปุ่มแล้วระบบสร้าง PDF + ส่งเข้า Gmail ลูกค้าให้
- ทุกเที่ยงคืน — ระบบเช็คข้อมูลใน Sheet แล้วส่ง LINE แจ้งทีมว่ามีอะไรค้าง
- ลูกค้ากรอก Google Form — ระบบเขียนลง Sheet + ส่ง email ยืนยัน + เพิ่ม event ใน Calendar
- ทำ **Web App เต็มรูปแบบ** — มีหน้า login, ฟอร์มกรอกข้อมูล, dashboard — โดยไม่ต้องเช่า hosting

ใช่ — ทำได้แม้กระทั่ง web app

## GAS ต่างจากเครื่องมืออื่นยังไง

หลายคนเคยใช้เครื่องมือสายอัตโนมัติมาบ้าง เปรียบเทียบให้เห็นภาพชัด ๆ:

| เครื่องมือ | จุดเด่น | จุดอ่อน | เหมาะกับ |
|---|---|---|---|
| **Excel + VBA** | คุ้นเคยถ้าใช้ Office | offline เท่านั้น, share ยาก, ไม่เชื่อมต่อ Google services | งาน desktop เก่า ๆ |
| **Zapier / Make.com** | ลากบล็อก ไม่ต้องเขียนโค้ด | ฟรี tier จำกัดมาก, ราคาแพงตอน scale | งาน automate ระหว่างแอปเล็ก ๆ |
| **Python + gspread** | flexible สุด, library เยอะ | ต้องลง Python, ตั้ง server เอง, ลงทุน learning curve | engineer ที่มี infra อยู่แล้ว |
| **Google Apps Script** | ฟรี, integrate Google ทุกตัว, รันบน Google server, ไม่ต้องลงอะไร | ภาษาเฉพาะตัว (JS-like แต่ไม่เป๊ะ), debug ลำบากหน่อย | ทุกคนที่ใช้ Google Workspace |

สรุปง่าย ๆ — ถ้างานคุณวนเวียนอยู่กับ Google services (Sheet, Drive, Gmail, Form, Calendar) **GAS คือคำตอบที่ตรงที่สุด** เพราะมันออกแบบมาเพื่ออันนี้โดยเฉพาะ

## ใครควรเรียน GAS

ลองดูตัวเอง ถ้าตรงข้อใดข้อหนึ่ง คอร์สนี้เหมาะกับคุณ:

- ✅ ใช้ Google Sheet เป็นประจำ และเริ่มรู้สึกว่าทำซ้ำ ๆ
- ✅ อยากทำ web app เล็ก ๆ แต่ไม่อยากเช่า server
- ✅ มีธุรกิจเล็ก ๆ และอยากให้ระบบทำงานเองมากขึ้น
- ✅ ทำงานกับ Google Form, Calendar, Gmail บ่อย ๆ
- ✅ เคยลอง Zapier แล้วรู้สึกว่ามันแพงเกิน (หรือยืดหยุ่นไม่พอ)

## ใครไม่ควรเรียน

ตรงไปตรงมา — ไม่ใช่ทุกคนเหมาะกับ GAS:

- ❌ ถ้าระบบที่จะทำต้องรองรับผู้ใช้พร้อมกัน 1,000+ คน (GAS มี quota)
- ❌ ถ้าต้องทำอะไรที่ไม่เกี่ยวกับ Google เลย (เช่น Microsoft 365 ทั้งระบบ)
- ❌ ถ้าอยากเขียน app บนมือถือ (GAS ทำได้แค่ web app — ไม่ใช่ native app)
- ❌ ถ้าต้องการ performance สูงมาก (เรียก database ทุก ms — GAS ไม่ถนัด)

## ข้อจำกัดที่ต้องรู้ตั้งแต่วันนี้

GAS ฟรี แต่ฟรีของ Google มี quota — เป็นเรื่องปกติ ตัวเลขสำคัญที่ควรจำ (สำหรับ Gmail บัญชีฟรี):

| สิ่งที่ทำ | จำกัด/วัน |
|---|---|
| ส่ง email | 100 ฉบับ |
| ฟังก์ชันรันต่อเนื่อง | 6 นาที |
| Trigger รวมต่อ script | 90 นาที |
| URL fetch (เรียก API ภายนอก) | 20,000 ครั้ง |

สำหรับ Workspace (อีเมล @companyname.com แบบเสียเงิน) จำนวนจะเพิ่ม

**บอกตามตรง:** ถ้าคุณยังไม่ได้รันธุรกิจที่ใหญ่มาก quota พวกนี้คุณ "ใช้ไม่ถึง" หรอก คนส่วนใหญ่ทำงานได้สบายมาก

## สรุปบทนี้

- GAS = เครื่องมือเขียนสคริปต์ของ Google ที่ทำให้ Sheet/Drive/Gmail/etc. ทำงานอัตโนมัติได้
- ใช้ภาษาคล้าย ๆ JavaScript เขียนผ่านเว็บ ฟรี ไม่ต้องลงอะไร
- เหมาะกับคนที่ใช้ Google Workspace เป็นประจำ
- มี quota แต่ใช้งานทั่วไป "ไม่ถึง"

## ต่อไปเรียนอะไร

ในบทถัดไป (1.2) เราจะมาดูเรื่องที่หลายคน **งง** กันมาก — GAS มี 2 แบบ:

- แบบที่ผูกกับ Sheet/Doc/Form (เรียกว่า **Container-bound**)
- แบบไฟล์อิสระ (เรียกว่า **Standalone**)

ต่างกันยังไง เลือกแบบไหนเมื่อไหร่ — ไปดูกัน

---

> 💡 **Checkpoint:** ก่อนไปบทถัดไป ลองตอบตัวเองดู
>
> - GAS ใช้ภาษาคล้ายอะไร?
> - งานแบบไหนเหมาะกับ GAS / ไม่เหมาะ?
> - ถ้าเปรียบเทียบกับ Zapier — GAS เหนือกว่าตรงไหน?$LESSON$,
  '[]'::jsonb,
  '[]'::jsonb,
  10, true, true
FROM target
ON CONFLICT (module_id, sort_order) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_md = EXCLUDED.content_md,
  code_snippets = EXCLUDED.code_snippets,
  estimated_minutes = EXCLUDED.estimated_minutes,
  is_free_preview = EXCLUDED.is_free_preview,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Recompute course totals
UPDATE courses
SET
  total_lessons = (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id AND is_published = true),
  total_modules = (SELECT COUNT(*) FROM course_modules WHERE course_id = courses.id)
WHERE slug = 'gas-mastery';

-- Verify
SELECT
  l.sort_order, l.title, l.is_free_preview, l.is_published, l.estimated_minutes,
  length(l.content_md) AS content_chars
FROM lessons l
JOIN course_modules m ON m.id = l.module_id
JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'gas-mastery' AND m.sort_order = 1
ORDER BY l.sort_order;
