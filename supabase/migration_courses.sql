-- =============================================
-- Migration: Course Selling System (Phase 1 — Schema)
-- Run this SQL in Supabase SQL Editor
--
-- Adds:
--   - courses, course_modules, lessons (content layer)
--   - enrollments, lesson_progress (access + tracking)
--   - course_orders (payment flow with Slip2Go integration)
--   - RPC: enroll_course (atomic)
--   - Storage bucket: course-images (public read)
--   - Seed: 1 course (GAS Mastery) + 12 modules (lessons added later)
-- =============================================

BEGIN;

-- =============================================
-- 1. courses — สินค้าคอร์ส
-- =============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_image_url TEXT,
  trailer_url TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 999 CHECK (price >= 0),
  level TEXT CHECK (level IN ('beginner','intermediate','advanced','all-levels')) DEFAULT 'all-levels',
  language TEXT NOT NULL DEFAULT 'th',
  estimated_hours INT,
  total_lessons INT NOT NULL DEFAULT 0,
  total_modules INT NOT NULL DEFAULT 0,
  enrollment_count INT NOT NULL DEFAULT 0,
  preview_lesson_count INT NOT NULL DEFAULT 2,  -- จำนวน lesson แรกที่เปิดให้อ่านฟรี (เรียงตาม sort)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  tags JSONB NOT NULL DEFAULT '[]',
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_status ON courses(status);

-- =============================================
-- 2. course_modules — บท/หมวด
-- =============================================
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, sort_order)
);

CREATE INDEX idx_course_modules_course ON course_modules(course_id, sort_order);

-- =============================================
-- 3. lessons — บทเรียน (text + รูป + script)
-- =============================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,                                        -- 1-2 ประโยค แสดงในรายการ
  content_md TEXT,                                     -- เนื้อหา markdown (ข้อความหลัก)
  code_snippets JSONB NOT NULL DEFAULT '[]',           -- [{ title, language, code }]
  image_urls JSONB NOT NULL DEFAULT '[]',              -- ["url1","url2",...]
  estimated_minutes INT,
  is_free_preview BOOLEAN NOT NULL DEFAULT false,      -- บทแสดงฟรี
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, sort_order)
);

CREATE INDEX idx_lessons_module ON lessons(module_id, sort_order);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_free ON lessons(course_id, is_free_preview) WHERE is_free_preview = true;

-- =============================================
-- 4. enrollments — สิทธิ์เข้าถึง (lifetime)
-- =============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id),
  order_id UUID,                                       -- → course_orders (set after FK created)
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  -- ตลอดชีพ → ไม่มี expires_at
  progress_pct INT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  last_lesson_id UUID REFERENCES lessons(id),
  last_seen_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- =============================================
-- 5. lesson_progress — บทไหนอ่านจบแล้ว
-- =============================================
CREATE TABLE lesson_progress (
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- =============================================
-- 6. course_orders — คำสั่งซื้อ + ตรวจสลิป Slip2Go
-- =============================================
CREATE TABLE course_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('credit','promptpay_slip')) NOT NULL,

  -- Slip2Go fields
  slip_image_url TEXT,
  slip_qr_code TEXT,
  slip_trans_ref TEXT,                                 -- unique เมื่อมีค่า (ดู index ด้านล่าง)
  slip_verified_at TIMESTAMPTZ,
  slip_verify_response JSONB,
  slip_verify_error TEXT,

  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','verifying','pending_review','approved','rejected','cancelled')),
  admin_note TEXT,
  processed_by UUID REFERENCES users(id),
  enrollment_id UUID REFERENCES enrollments(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_course_orders_user ON course_orders(user_id);
CREATE INDEX idx_course_orders_status ON course_orders(status);
CREATE INDEX idx_course_orders_course ON course_orders(course_id);

-- กันสลิปซ้ำ (สำคัญมาก) — UNIQUE เฉพาะตอน trans_ref ไม่ใช่ NULL
CREATE UNIQUE INDEX idx_course_orders_trans_ref_unique
  ON course_orders(slip_trans_ref)
  WHERE slip_trans_ref IS NOT NULL;

-- Add FK from enrollments.order_id back to course_orders (circular OK if delete cascade not set)
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_order_fk
  FOREIGN KEY (order_id) REFERENCES course_orders(id) ON DELETE SET NULL;

-- =============================================
-- 7. updated_at triggers
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_course_modules_updated BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- 8. RLS policies
-- =============================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_orders ENABLE ROW LEVEL SECURITY;

-- Courses: ทุกคนเห็น published, admin เห็นทั้งหมด
CREATE POLICY "courses_select_published" ON courses FOR SELECT
  USING (status = 'published' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "courses_admin_all" ON courses FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Modules: ติดตาม course
CREATE POLICY "modules_select" ON course_modules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id
      AND (c.status = 'published' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  )
);
CREATE POLICY "modules_admin_all" ON course_modules FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Lessons: เห็นแค่ free preview + admin + enrolled
-- หมายเหตุ: เนื้อหา content_md จริง ๆ ดึงผ่าน API ที่ใช้ service-role + ตรวจ enrollment เอง
-- RLS ระดับ row นี้เป็น defense in depth สำหรับ direct query
CREATE POLICY "lessons_select_preview" ON lessons FOR SELECT USING (
  is_published = true
  AND is_free_preview = true
  AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.status = 'published')
);
CREATE POLICY "lessons_select_enrolled" ON lessons FOR SELECT USING (
  is_published = true
  AND EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = lessons.course_id AND e.user_id = auth.uid())
);
CREATE POLICY "lessons_admin_all" ON lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Enrollments: user เห็นของตัวเอง, admin เห็นทั้งหมด
CREATE POLICY "enrollments_select_own" ON enrollments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Lesson progress: user แก้/เห็นของตัวเอง
CREATE POLICY "lesson_progress_owner" ON lesson_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- Course orders: user เห็นของตัวเอง, admin เห็นทั้งหมด, user สร้างของตัวเอง
CREATE POLICY "course_orders_select" ON course_orders FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "course_orders_insert_own" ON course_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "course_orders_admin_update" ON course_orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- 9. RPC: enroll_course (atomic)
-- =============================================
CREATE OR REPLACE FUNCTION enroll_course(
  p_user_id UUID,
  p_course_id UUID,
  p_payment_method TEXT,            -- 'credit' | 'slip_verified' | 'admin_grant'
  p_course_order_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_course RECORD;
  v_user RECORD;
  v_enrollment_id UUID;
  v_new_balance DECIMAL(10,2);
BEGIN
  -- Lock user
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'user_not_found'; END IF;

  -- Get course
  SELECT * INTO v_course FROM courses WHERE id = p_course_id AND status = 'published';
  IF NOT FOUND THEN RAISE EXCEPTION 'course_not_found_or_unpublished'; END IF;

  -- Idempotency — already enrolled?
  IF EXISTS (SELECT 1 FROM enrollments WHERE user_id = p_user_id AND course_id = p_course_id) THEN
    RAISE EXCEPTION 'already_enrolled';
  END IF;

  -- Payment handling
  IF p_payment_method = 'credit' THEN
    IF v_user.credit_balance < v_course.price THEN
      RAISE EXCEPTION 'insufficient_balance';
    END IF;
    v_new_balance := v_user.credit_balance - v_course.price;
    UPDATE users SET credit_balance = v_new_balance WHERE id = p_user_id;

    INSERT INTO transactions (user_id, type, amount, balance_after, ref_id, description)
    VALUES (
      p_user_id, 'purchase', -v_course.price, v_new_balance,
      COALESCE(p_course_order_id::text, ''),
      'ซื้อคอร์ส "' || v_course.title || '"'
    );

  ELSIF p_payment_method = 'slip_verified' OR p_payment_method = 'admin_grant' THEN
    -- payment was off-platform (slip verified) or admin-granted, no credit movement
    v_new_balance := v_user.credit_balance;
  ELSE
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;

  -- Create enrollment
  INSERT INTO enrollments (user_id, course_id, order_id)
  VALUES (p_user_id, p_course_id, p_course_order_id)
  RETURNING id INTO v_enrollment_id;

  -- Bump course stats
  UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = p_course_id;

  -- Notification
  INSERT INTO notifications (user_id, type, title, message, ref_id, ref_type)
  VALUES (
    p_user_id, 'system', 'เริ่มเรียนได้แล้ว',
    'คุณลงทะเบียนคอร์ส "' || v_course.title || '" สำเร็จ พร้อมเข้าเรียนได้เลย',
    v_enrollment_id::text, 'enrollment'
  );

  RETURN jsonb_build_object(
    'enrollment_id', v_enrollment_id,
    'course_id', v_course.id,
    'course_title', v_course.title,
    'amount', v_course.price,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. Storage bucket — course images (cover + lesson screenshots)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images', 'course-images', true,
  10485760,  -- 10MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
CREATE POLICY "course_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-images');

-- Admin upload (service_role bypasses RLS so this is for direct auth uploads if added later)
CREATE POLICY "course_images_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-images'
    AND auth.role() = 'service_role'
  );

CREATE POLICY "course_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-images'
    AND auth.role() = 'service_role'
  );

CREATE POLICY "course_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-images'
    AND auth.role() = 'service_role'
  );

-- =============================================
-- 11. SEED — 1 course + 12 modules (lessons added later)
-- =============================================
DO $$
DECLARE
  v_course_id UUID;
BEGIN
  INSERT INTO courses (
    slug, title, subtitle, description, price, level, language, estimated_hours,
    total_modules, status, tags, preview_lesson_count
  ) VALUES (
    'gas-mastery',
    'Google Apps Script & Web App — Mastery Course',
    'จาก zero สู่ deploy production — เขียน GAS เป็น Web App เต็มรูปแบบ',
    'คอร์สสอน Google Apps Script (GAS) ครบครอบจักรวาล — ตั้งแต่ basics, Sheets/Drive/Gmail integration, Web App + HtmlService, Alpine.js, authentication, PDF + QR, AI prompt engineering สำหรับ GAS, clasp + CI/CD, LINE/Telegram integration ไปจนถึง capstone project. อ่านได้ตลอดชีพ มีโค้ดให้ copy ใช้ได้ทันที',
    999, 'all-levels', 'th', 30,
    12, 'draft',
    '["google-apps-script","web-app","htmlservice","alpine.js","clasp","line-api","telegram-bot","pdf-generation","ai-prompt-engineering"]'::jsonb,
    2
  )
  RETURNING id INTO v_course_id;

  INSERT INTO course_modules (course_id, sort_order, title, description) VALUES
    (v_course_id, 1, 'Module 1 — เริ่มต้นกับ GAS',
     'GAS editor, debugging (Logger.log vs console.log), deployment workflow, Dev URL vs Production'),
    (v_course_id, 2, 'Module 2 — JavaScript essentials สำหรับ GAS',
     'variables, functions, arrays, string methods, Date + timezone, error handling'),
    (v_course_id, 3, 'Module 3 — Sheets operations',
     'CRUD patterns, batch read/write, Script Properties + Config sheet, ImgBB + CORS, caching, execution limits'),
    (v_course_id, 4, 'Module 4 — Web App foundations',
     'HtmlService, google.script.run, Tailwind/Bootstrap, SweetAlert2, Font Awesome'),
    (v_course_id, 5, 'Module 5 — Alpine.js สำหรับ GAS',
     'x-data, x-model, events, SPA patterns, loading states'),
    (v_course_id, 6, 'Module 6 — Authentication',
     'role-based access ด้วย Session.getActiveUser(), username/password + token-based สำหรับ public deploy'),
    (v_course_id, 7, 'Module 7 — Google services integration',
     'Gmail, Calendar, Drive, time-based triggers, UrlFetchApp'),
    (v_course_id, 8, 'Module 8 — PDF + QR Code',
     'template replacement, QR integration, email distribution'),
    (v_course_id, 9, 'Module 9 — AI prompt engineering สำหรับ GAS',
     'AI errors ที่พบบ่อย, fetch misuse, async issues, timezone problems, localStorage security, library performance'),
    (v_course_id, 10, 'Module 10 — clasp + CI/CD',
     'local dev ด้วย clasp, GitHub integration, automated deployment'),
    (v_course_id, 11, 'Module 11 — Messaging APIs',
     'LINE Messaging API + Flex Cards, Telegram Bot integration'),
    (v_course_id, 12, 'Module 12 — Capstone project',
     '3 ตัวเลือก: event registration / order management / appointment booking');
END $$;

COMMIT;
