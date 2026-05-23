-- =============================================
-- Update: Save Phase A template URL to courses.meta
-- Run once in Supabase SQL Editor after creating the Sandbox Sheet
-- =============================================

UPDATE courses
SET meta = jsonb_set(
  COALESCE(meta, '{}'::jsonb),
  '{templates}',
  '[
    {
      "phase": "A",
      "covers_modules": [1, 2, 3],
      "title": "GAS Sandbox (Sheet-bound)",
      "description": "Sandbox สำหรับ Module 1-3 — มี Config / Data / Output / Logs พร้อมข้อมูลตัวอย่าง 20 แถว",
      "copy_url": "https://docs.google.com/spreadsheets/d/1h2HCokpLq5_5qKBeCldFHzpHf9QQT9zsSr1LEmjlCxE/copy",
      "view_url": "https://docs.google.com/spreadsheets/d/1h2HCokpLq5_5qKBeCldFHzpHf9QQT9zsSr1LEmjlCxE/edit"
    }
  ]'::jsonb
)
WHERE slug = 'gas-mastery'
RETURNING slug, meta;
