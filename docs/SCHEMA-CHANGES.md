# Schema Changes — Pivot to GAS Builder

> SQL migration plan: drop marketplace + create gas_* tables
> ใช้กับ Supabase project `hgjrxixbdmklwzcfyrxm` (KPPromp)
> Apply ผ่าน `mcp__claude_ai_Supabase__apply_migration`
> Last updated: 2026-05-25 (v2 — Mode A/B + delivery_method + LINE-first)

---

## 1. Current State

จาก `list_tables` ของ live DB (`hgjrxixbdmklwzcfyrxm`):

| Table | Rows | Action |
|---|---:|---|
| `users` | 1 | KEEP |
| `prompts` | 0 | **DROP** |
| `prompt_images` | 0 | **DROP** |
| `orders` | 0 | **DROP** |
| `reviews` | 0 | **DROP** |
| `transactions` | 0 | KEEP |
| `payouts` | 0 | **DROP** |
| `notifications` | 0 | KEEP (ปรับ enum) |
| `settings` | 5 | KEEP |
| `collections` | 2 | KEEP |
| `saved_prompts` | 2 | KEEP (drop FK `marketplace_prompt_id`) |
| `pending_topups` | 4 | KEEP |
| `prompt_stats` | 331 | KEEP |
| `feature_votes` | 28 | KEEP |
| `codegen_orders` | 0 | **EXTEND** → `gas_orders` |
| `courses` | 1 | KEEP |
| `course_modules` | 12 | KEEP |
| `lessons` | 57 | KEEP |
| `enrollments` | 0 | KEEP |
| `lesson_progress` | 0 | KEEP |
| `course_orders` | 0 | KEEP |

**สรุป:** marketplace ทุกตาราง rows = 0 → drop ปลอดภัย

---

## 2. Migration Order

apply 4 migrations เรียงตามนี้:

1. **`20260525_drop_marketplace.sql`** — drop marketplace tables + RLS + storage
2. **`20260525_extend_codegen_to_gas.sql`** — rename `codegen_orders` → `gas_orders` + add columns (Mode A/B + delivery_method + LINE)
3. **`20260525_add_gas_builder_tables.sql`** — สร้าง `gas_templates`, `gas_specs`, `customer_projects`, `customer_oauth_tokens`
4. **`20260525_update_notifications_enum.sql`** — เพิ่ม notification types

---

## 3. Migration 1: Drop Marketplace

```sql
-- file: 20260525_drop_marketplace.sql
-- เหตุผล: pivot ไป GAS Builder service
-- กระทบ: rows = 0 ในทุกตารางที่ลบ — ไม่มี data loss

BEGIN;

-- Drop RLS policies first
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "prompt_images_select" ON prompt_images;
DROP POLICY IF EXISTS "prompt_images_insert" ON prompt_images;
DROP POLICY IF EXISTS "prompts_select_approved" ON prompts;
DROP POLICY IF EXISTS "prompts_insert_seller" ON prompts;
DROP POLICY IF EXISTS "prompts_update_own" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_own" ON prompts;

-- Drop FK from saved_prompts ก่อน drop prompts
ALTER TABLE saved_prompts
  DROP CONSTRAINT IF EXISTS saved_prompts_marketplace_prompt_id_fkey;
ALTER TABLE saved_prompts DROP COLUMN IF EXISTS marketplace_prompt_id;

-- Drop trigger + functions
DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;
DROP FUNCTION IF EXISTS update_prompt_rating();
DROP FUNCTION IF EXISTS purchase_prompt(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS request_payout(UUID, DECIMAL, TEXT);

-- Drop tables (cascade)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS prompt_images CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;

-- Drop storage policies + buckets
DROP POLICY IF EXISTS "prompt_files_seller_upload" ON storage.objects;
DROP POLICY IF EXISTS "prompt_files_seller_delete" ON storage.objects;
DROP POLICY IF EXISTS "prompt_files_service_read" ON storage.objects;
DROP POLICY IF EXISTS "prompt_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "prompt_images_seller_upload" ON storage.objects;
DROP POLICY IF EXISTS "prompt_images_seller_delete" ON storage.objects;

DELETE FROM storage.buckets WHERE id IN ('prompt-files', 'prompt-images');

-- Cleanup marketplace settings
DELETE FROM settings WHERE key IN ('commission_rate');

COMMIT;
```

---

## 4. Migration 2: Extend codegen_orders → gas_orders

```sql
-- file: 20260525_extend_codegen_to_gas.sql
-- เหตุผล: re-use codegen_orders + เพิ่ม Mode A/B + delivery_method + LINE-first
-- หมายเหตุ: slip_image_url เปลี่ยนเป็น optional เพราะ slip จะส่งทาง LINE แทน

BEGIN;

-- Rename
ALTER TABLE codegen_orders RENAME TO gas_orders;

-- Add columns
ALTER TABLE gas_orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS template_code TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('A', 'B')),
  ADD COLUMN IF NOT EXISTS delivery_method TEXT CHECK (delivery_method IN (
    'mode-a-diy',
    'mode-a-done-for-you',
    'mode-b-self-setup',
    'mode-b-setup-service'
  )),
  ADD COLUMN IF NOT EXISTS training_addon BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS style JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chat_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spec_json JSONB,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS auto_quote_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS source_prompt_id UUID REFERENCES saved_prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS line_user_id TEXT,
  ADD COLUMN IF NOT EXISTS line_basic_id TEXT,          -- @username ของลูกค้า
  ADD COLUMN IF NOT EXISTS preferred_contact TEXT CHECK (
    preferred_contact IN ('line', 'email', 'both')
  ) DEFAULT 'line',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_by_admin UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS payment_note TEXT,            -- admin note ตอน verify slip
  ADD COLUMN IF NOT EXISTS generated_code JSONB,         -- files ที่ build ก่อน OAuth deploy
  ADD COLUMN IF NOT EXISTS awaiting_oauth_until TIMESTAMPTZ;

-- slip_image_url → nullable (เดิม required ใน UI)
ALTER TABLE gas_orders ALTER COLUMN slip_image_url DROP NOT NULL;

-- Update status enum (LINE-first lifecycle)
ALTER TABLE gas_orders DROP CONSTRAINT IF EXISTS codegen_orders_status_check;
ALTER TABLE gas_orders ADD CONSTRAINT gas_orders_status_check CHECK (
  status IN (
    'draft',              -- กำลังทำ wizard (autosave)
    'submitted',          -- submit แล้ว แสดง LINE OA QR
    'in_discussion',      -- (option) admin tag เมื่อคุย LINE
    'awaiting_oauth',     -- Mode A · Done-For-You — รอลูกค้าคลิก OAuth link
    'paid',               -- admin verify ใน LINE → mark paid
    'in_queue',           -- รอ admin start build
    'in_production',      -- admin คลิก start build
    'review',             -- internal QA
    'delivered',          -- ส่งมอบแล้ว
    'expired',            -- Mode B หมดอายุ
    'archived',           -- เกิน grace period
    'rejected',           -- admin reject
    'refunded'
  )
);

-- Auto-generate order_number (ORDER-{6hex}) ถ้ายังว่าง
UPDATE gas_orders
SET order_number = 'ORDER-' || substr(md5(random()::text || id::text), 1, 6)
WHERE order_number IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gas_orders_template ON gas_orders(template_code);
CREATE INDEX IF NOT EXISTS idx_gas_orders_status_created ON gas_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gas_orders_order_number ON gas_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_gas_orders_line_user ON gas_orders(line_user_id);
CREATE INDEX IF NOT EXISTS idx_gas_orders_mode ON gas_orders(mode, delivery_method);

-- Update RLS policies
DROP POLICY IF EXISTS "codegen_orders_user_insert" ON gas_orders;
DROP POLICY IF EXISTS "codegen_orders_select" ON gas_orders;
DROP POLICY IF EXISTS "codegen_orders_admin_update" ON gas_orders;

CREATE POLICY "gas_orders_user_insert"
  ON gas_orders FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "gas_orders_select"
  ON gas_orders FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "gas_orders_user_update_draft"
  ON gas_orders FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    AND status = 'draft'
  );

CREATE POLICY "gas_orders_admin_update"
  ON gas_orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- Trigger: ป้องกัน user เปลี่ยน status เอง (เฉพาะ admin)
-- (RLS update_draft แล้วยังตรวจอีกชั้น)
CREATE OR REPLACE FUNCTION prevent_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- อนุญาตเฉพาะ draft → submitted (ผ่าน server API)
    IF NOT (OLD.status = 'draft' AND NEW.status = 'submitted') THEN
      RAISE EXCEPTION 'forbidden_status_change';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_gas_orders_status_guard ON gas_orders;
CREATE TRIGGER tg_gas_orders_status_guard
  BEFORE UPDATE OF status ON gas_orders
  FOR EACH ROW EXECUTE FUNCTION prevent_user_status_change();

COMMIT;
```

---

## 5. Migration 3: Add GAS Builder Tables

```sql
-- file: 20260525_add_gas_builder_tables.sql

BEGIN;

-- ============================================
-- gas_templates
-- ============================================
CREATE TABLE gas_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  category TEXT,

  -- Pricing per mode
  base_price_mode_a INTEGER,             -- null ถ้า template นี้ Mode A ทำไม่ได้
  base_price_mode_b INTEGER NOT NULL,

  -- Forced mode (ถ้า template บังคับ Mode B เช่น camera-required)
  forced_mode TEXT CHECK (forced_mode IN ('A', 'B') OR forced_mode IS NULL),

  preview_image_url TEXT,
  preview_html_url_mode_a TEXT,
  preview_html_url_mode_b TEXT,
  spec_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  github_template_repo TEXT,             -- 'kpgas/templates' subfolder

  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 100,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gas_templates_active ON gas_templates(is_active, sort_order);

ALTER TABLE gas_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gas_templates_public_read"
  ON gas_templates FOR SELECT USING (is_active = true);

CREATE POLICY "gas_templates_admin_all"
  ON gas_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- ============================================
-- gas_specs
-- ============================================
CREATE TABLE gas_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES gas_orders(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  content_md TEXT NOT NULL,
  spec_json JSONB NOT NULL,
  generated_by TEXT CHECK (generated_by IN ('shop_wizard', 'ai_chat', 'admin_edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, version)
);

CREATE INDEX idx_gas_specs_order ON gas_specs(order_id, version DESC);

ALTER TABLE gas_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gas_specs_owner_or_admin_read"
  ON gas_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gas_orders
      WHERE gas_orders.id = gas_specs.order_id
      AND (gas_orders.user_id = (select auth.uid())
           OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'))
    )
  );

CREATE POLICY "gas_specs_admin_write"
  ON gas_specs FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- ============================================
-- customer_projects
-- ============================================
CREATE TABLE customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES gas_orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  slug TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('A', 'B')),

  -- Deployment URLs
  vercel_url TEXT,                       -- null ถ้า Mode A
  custom_domain TEXT,
  gas_web_app_url TEXT NOT NULL,         -- มีทั้ง 2 mode (Mode A standalone, Mode B backend)
  gas_script_id TEXT,
  github_repo TEXT,                      -- null ถ้า Mode A · DIY (ลูกค้าไม่ต้องมี repo)

  -- Customer's Google Sheet
  sheet_id TEXT,
  sheet_url TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN (
    'provisioning', 'live', 'expired', 'archived', 'taken_down'
  )),
  delivered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                -- null สำหรับ Mode A (ไม่หมดอายุ)
  last_renewed_at TIMESTAMPTZ,

  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_projects_user ON customer_projects(user_id);
CREATE INDEX idx_customer_projects_status ON customer_projects(status, expires_at);
CREATE INDEX idx_customer_projects_expires ON customer_projects(expires_at)
  WHERE status = 'live' AND expires_at IS NOT NULL;

ALTER TABLE customer_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_projects_owner_or_admin_read"
  ON customer_projects FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "customer_projects_admin_write"
  ON customer_projects FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- ============================================
-- customer_oauth_tokens
-- ============================================
-- เก็บชั่วคราว 24 ชม. เพื่อใช้ deploy ผ่าน Apps Script API
-- หลัง deploy เสร็จ → DELETE row
CREATE TABLE customer_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES gas_orders(id) ON DELETE CASCADE,
  project_id UUID REFERENCES customer_projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'line')),
  scope TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  purpose TEXT CHECK (purpose IN ('initial_deploy', 'update_deploy', 'sheet_access')),
  used_at TIMESTAMPTZ,                   -- เมื่อ deploy เสร็จ
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_tokens_user ON customer_oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_expires ON customer_oauth_tokens(expires_at);

ALTER TABLE customer_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- ลูกค้าเห็นแค่ของตัวเอง (แต่ access_token ไม่ควรเปิดเผย — ต้องผ่าน server)
-- ที่จริงควรไม่ให้ user select column access_token เลย — ใช้ view แทน
CREATE POLICY "oauth_tokens_owner_read"
  ON customer_oauth_tokens FOR SELECT
  USING (user_id = (select auth.uid()));

-- INSERT/UPDATE/DELETE → service_role only (ไม่ create policy = block)

-- Auto-cleanup job (run ทุกชั่วโมง)
-- → DELETE FROM customer_oauth_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL;
-- (จะทำผ่าน pg_cron หรือ Vercel cron)

COMMIT;
```

---

## 6. Migration 4: Update Notifications Enum

```sql
-- file: 20260525_update_notifications_enum.sql

BEGIN;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'system',

    -- Course (เดิม)
    'course_enrolled',
    'lesson_completed',

    -- GAS Builder
    'gas_order_received',         -- admin: order ใหม่
    'gas_payment_pending',        -- customer: เตือนยังไม่จ่าย (manual)
    'gas_payment_verified',       -- customer: paid แล้ว
    'gas_oauth_needed',           -- customer (Mode A Done-For-You): คลิก link install
    'gas_in_production',          -- customer: เริ่มสร้าง
    'gas_delivered',              -- customer: ส่งมอบ
    'gas_renewal_30d',
    'gas_renewal_7d',
    'gas_renewal_1d',
    'gas_expired',
    'gas_renewed'
  )
);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS target_role TEXT CHECK (target_role IN ('admin', 'user')),
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS line_pushed BOOLEAN DEFAULT false;  -- track ว่า push LINE แล้วหรือยัง

COMMIT;
```

---

## 7. Settings ใหม่ (insert หลัง migration)

```sql
INSERT INTO settings (key, value) VALUES
  ('line_oa_basic_id',        '@kpgas'),
  ('line_oa_qr_url',          'https://qr-official.line.me/sid/L/{...}.png'),
  ('order_number_prefix',     'ORDER-'),
  ('mode_b_yearly_fee',       '300'),
  ('custom_domain_yearly_fee','300'),
  ('grace_period_days',       '90'),
  ('oauth_token_ttl_hours',   '24'),
  ('build_eta_hours',         '72'),
  ('admin_response_eta_min',  '30'),
  ('working_hours',           '09:00-21:00 ICT')
ON CONFLICT (key) DO NOTHING;
```

---

## 8. Verification (run after migration)

```sql
-- 8.1 marketplace dropped
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('prompts', 'orders', 'reviews', 'prompt_images', 'payouts');
-- ต้องคืน 0 rows

-- 8.2 codegen_orders renamed
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('codegen_orders', 'gas_orders');
-- ต้องเจอแค่ 'gas_orders'

-- 8.3 new tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
  'gas_templates', 'gas_specs', 'customer_projects', 'customer_oauth_tokens'
);
-- ต้องคืน 4 rows

-- 8.4 RLS เปิดทุกตารางใหม่
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('gas_templates', 'gas_specs', 'customer_projects', 'customer_oauth_tokens');
-- ทุกตัวต้อง rowsecurity = true

-- 8.5 gas_orders มี columns ใหม่
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gas_orders'
AND column_name IN ('order_number', 'mode', 'delivery_method', 'line_user_id', 'spec_json');
-- ต้องคืน 5 rows

-- 8.6 RLS advisor
-- ผ่าน MCP: mcp__claude_ai_Supabase__get_advisors type=security
--          mcp__claude_ai_Supabase__get_advisors type=performance
-- ต้องไม่มี new WARN
```

---

## 9. Seed Data — Templates

> **Floor price ฿499** สำหรับทุก template
> Mode A และ Mode B ราคา build เท่ากัน — ต่างที่ค่ารายปีหลัง year 1

```sql
INSERT INTO gas_templates
  (code, name, name_en, description, category, base_price_mode_a, base_price_mode_b, forced_mode, sort_order) VALUES
  ('crm-basic',       'CRM พื้นฐาน',          'Basic CRM',          'จัดการลูกค้า ดีล ติดตาม', 'sales',     499,  499,  NULL, 10),
  ('inventory',       'สต็อกสินค้า',          'Inventory',          'รับเข้า-เบิกออก',          'inventory', 499,  499,  NULL, 20),
  ('booking',         'จองคิว/นัดหมาย',       'Booking',            'คลินิก ร้านเสริมสวย',      'service',   499,  499,  NULL, 30),
  ('pos-simple',      'POS บันทึกขาย',        'Simple POS',         'ร้านค้าเล็ก',              'sales',     499,  499,  NULL, 40),
  ('form-dashboard',  'Form + Dashboard',    'Form + Dashboard',   'สำรวจ + สรุปผล',          'data',      499,  499,  NULL, 50),
  ('employee-checkin','เช็คอินพนักงาน',       'Employee Check-in',  'GPS + รูป',                'hr',        NULL, 900,  'B',  60),
  ('hr-leave',        'HR ลา/OT',            'HR Leave',           'พนักงาน <50 คน',           'hr',        800,  800,  NULL, 70),
  ('order-online',    'Order online',        'Online Order',       'รับออเดอร์ + ติดตาม',      'sales',     800,  800,  NULL, 80),
  ('custom',          'Custom (AI ออกแบบ)',  'Custom',             'ตามที่ลูกค้าเล่า',          'custom',   1500, 1500, NULL, 999);
```

**Add CHECK constraint** ป้องกัน admin set base price ต่ำกว่า floor ภายหลัง:

```sql
ALTER TABLE gas_templates ADD CONSTRAINT gas_templates_price_floor
  CHECK (
    (base_price_mode_a IS NULL OR base_price_mode_a >= 499)
    AND base_price_mode_b >= 499
  );
```

---

## 10. Rollback Plan

ก่อน mark live → backup เก็บไว้:

```sql
-- rollback migration 3 + 4
BEGIN;
DROP TABLE IF EXISTS customer_oauth_tokens CASCADE;
DROP TABLE IF EXISTS customer_projects CASCADE;
DROP TABLE IF EXISTS gas_specs CASCADE;
DROP TABLE IF EXISTS gas_templates CASCADE;
COMMIT;

-- rollback migration 2
BEGIN;
DROP TRIGGER IF EXISTS tg_gas_orders_status_guard ON gas_orders;
DROP FUNCTION IF EXISTS prevent_user_status_change();
ALTER TABLE gas_orders RENAME TO codegen_orders;
ALTER TABLE codegen_orders
  DROP COLUMN IF EXISTS order_number,
  DROP COLUMN IF EXISTS template_code,
  DROP COLUMN IF EXISTS mode,
  DROP COLUMN IF EXISTS delivery_method,
  DROP COLUMN IF EXISTS training_addon,
  DROP COLUMN IF EXISTS addons,
  DROP COLUMN IF EXISTS style,
  DROP COLUMN IF EXISTS chat_log,
  DROP COLUMN IF EXISTS spec_json,
  DROP COLUMN IF EXISTS estimated_hours,
  DROP COLUMN IF EXISTS auto_quote_breakdown,
  DROP COLUMN IF EXISTS source_prompt_id,
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS customer_email,
  DROP COLUMN IF EXISTS line_user_id,
  DROP COLUMN IF EXISTS line_basic_id,
  DROP COLUMN IF EXISTS preferred_contact,
  DROP COLUMN IF EXISTS paid_at,
  DROP COLUMN IF EXISTS paid_by_admin,
  DROP COLUMN IF EXISTS payment_note,
  DROP COLUMN IF EXISTS generated_code,
  DROP COLUMN IF EXISTS awaiting_oauth_until;
COMMIT;

-- migration 1 (drop marketplace) RESTORE ไม่ได้
-- ป้องกัน: เก็บ DB dump ก่อน apply migration 1
```

---

## 11. Risk Notes

1. **slip_image_url เปลี่ยนเป็น optional** — โค้ดเดิม `api/codegen-orders/index.js` บังคับ slip
   → ต้องแก้ให้ optional (ดู MIGRATION-PLAN.md § C8)

2. **status enum เปลี่ยน** — `pending_payment` ถูกลบ
   → grep code หา `'pending_payment'` แล้วเปลี่ยนเป็น `'submitted'`
   → หรือเก็บ alias ใน enum: `'pending_payment'` เพื่อ backward compat (ไม่แนะนำ)

3. **customer_oauth_tokens TTL** — ต้องมี cleanup job
   → เพิ่ม pg_cron หรือ Vercel cron แยก

4. **gas_orders.tier** — ค่าเดิม `'simple'`, `'moderate'`, `'complex'`
   → ไม่แตะ ใช้ map ฝั่ง code (`simple → 'starter'`, etc.)

5. **OAuth verification** — ต้องทำกับ Google ก่อนเปิด Mode A · Done-For-You
   → ดู MIGRATION-PLAN.md Phase A0
