# GAS Mastery Course — Content Status

**Last bulk insert:** 2026-05-23 (via Supabase MCP)
**Last content revision:** 2026-05-24 — LINE Notify removed (LINE ปิดบริการ 2025) → 7.5 ใช้ Telegram Bot, 11.1 reframe; AI seed-data pattern เพิ่มใน 3.3, 9.5, 12.1
**Last structure revision:** 2026-05-24 — เพิ่ม track system: `is_core` + `is_quick_path` (filter UI 3 view: Quick 12 บท · Core 22 บท · All 57 บท)
**Course slug:** `gas-mastery`
**Supabase project:** `hgjrxixbdmklwzcfyrxm`

## Track system

3 filter views ใน `course-detail.html` + `course-learn.html` sidebar (persist ใน localStorage `kp_course_track`):

| Track | Filter | บท | นาที | สำหรับ |
|---|---|---|---|---|
| 🚀 Quick Path | `is_quick_path = true` | 12 | ~151 (~2.5 ชม.) | พื้นฐาน + ใช้ AI สร้าง Web App + Deploy |
| ✓ แนะนำ (Core) | `is_core = true` | 22 | ~265 (~4.4 ชม.) | เข้าใจ pattern เต็ม |
| 📚 ทั้งหมด | (no filter) | 57 | ~677 (~11.3 ชม.) | reference ลึก/เฉพาะทาง |

DB constraint: `lessons_quick_implies_core` — quick=true → core ต้อง=true (subset relationship)

API `/api/lessons/[id]?track=quick|core|all` — navigation prev/next respect ตาม track

## Lesson Inventory — 56 lessons total

| Module | Title | Lessons | Minutes |
|---|---|---|---|
| 1 | บทที่ 1 — เริ่มต้นกับ GAS | 6 | 69 |
| 2 | บทที่ 2 — JavaScript essentials สำหรับ GAS | 6 | 63 |
| 3 | บทที่ 3 — Sheets operations | 6 | 68 |
| 4 | บทที่ 4 — Web App foundations | 5 | 62 |
| 5 | บทที่ 5 — Alpine.js สำหรับ GAS | 4 | 48 |
| 6 | บทที่ 6 — Authentication | 4 | 52 |
| 7 | บทที่ 7 — Google services integration | 5 | 60 |
| 8 | บทที่ 8 — PDF + QR Code | 4 | 44 |
| 9 | บทที่ 9 — AI prompt engineering สำหรับ GAS | 5 | 62 |
| 10 | บทที่ 10 — clasp + CI/CD | 4 | 40 |
| 11 | บทที่ 11 — Messaging APIs | 4 | 46 |
| 12 | บทที่ 12 — Capstone project | 4 | 63 |
| **รวม** | | **57** | **~677 นาที (~11.3 ชม.)** |

**Code snippets:** 172
**Image placeholders:** 21

## Status flags

- All lessons: `is_published = true`
- First 2 lessons of Module 1: `is_free_preview = true`
- All other lessons: `is_free_preview = false`
- Course `status` = `'draft'` — set to `'published'` when ready to launch

## Files in this folder

```
course-content/
├── STATUS.md (this file)
└── module-01/
    ├── lesson-1.1.sql       — initial seed (text + module rename)
    └── lesson-1.2.sql       — module rename + lesson 1.2
```

Lessons 1.3 onwards were inserted directly via Supabase MCP — not written
to disk as separate SQL files (would have been 50+ files, redundant with
DB source of truth).

## Re-export from DB (if needed for git tracking)

```sql
-- Run in Supabase SQL Editor → save to file
SELECT
  m.sort_order || '.' || l.sort_order AS lesson_id,
  l.title,
  l.summary,
  l.content_md,
  l.code_snippets,
  l.image_urls,
  l.estimated_minutes,
  l.is_free_preview,
  l.is_published
FROM lessons l
JOIN course_modules m ON m.id = l.module_id
WHERE l.course_id = (SELECT id FROM courses WHERE slug = 'gas-mastery')
ORDER BY m.sort_order, l.sort_order;
```

## Image placeholders to replace

21 placeholder URLs in form `https://placeholder.kp/lesson-X.Y-fig-N.png`
need to be replaced with real uploaded image URLs.

To find all placeholders:
```sql
SELECT
  m.sort_order AS mod,
  l.sort_order AS les,
  l.title,
  jsonb_array_elements_text(l.image_urls) AS image_url
FROM lessons l
JOIN course_modules m ON m.id = l.module_id
WHERE l.image_urls::text LIKE '%placeholder%';
```

Workflow per image:
1. Take screenshot per spec
2. Upload to `course-images` bucket
3. Get public URL
4. UPDATE the JSONB to replace placeholder URL

## Voice + Style

All lessons written with:
- Casual Thai "พี่/น้อง" tone (per user spec)
- Beginner-from-zero assumption
- "ครับ", "บอกตรง ๆ", "ลองนึกภาพ" as natural anchors
- Comparison tables + decision flowcharts
- Checkpoint Q&A at end of each lesson
- Code snippets that compile/run as-is

## Next Steps (suggested polish work)

1. **Review + edit** content lesson-by-lesson — tighten wording, add personal voice
2. **Capture screenshots** for 21 placeholders
3. **Test code snippets** in actual GAS — verify they run
4. **Set status='published'** when ready (currently draft)
5. **Optional: add quiz lessons** or supplementary exercises
6. **Marketing copy** for course landing page

## Tech stack covered across course

- Apps Script Sheet/Drive/Gmail/Calendar APIs
- JavaScript ES6+
- HtmlService + google.script.run
- Alpine.js + Tailwind CSS
- SweetAlert2 + Font Awesome
- LINE Messaging API + Flex Cards
- Telegram Bot API
- ImgBB + PromptPay QR
- clasp + GitHub Actions CI/CD
- ChatGPT + OpenAI API
