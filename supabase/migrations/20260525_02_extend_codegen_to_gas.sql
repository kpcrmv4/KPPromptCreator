-- =============================================
-- Migration 2/4: Extend codegen_orders → gas_orders
-- =============================================
-- เหตุผล: re-use codegen_orders + เพิ่ม Mode A/B + delivery_method + LINE-first
-- หมายเหตุ: slip_image_url เปลี่ยนเป็น optional เพราะ slip ส่งทาง LINE
-- =============================================

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
  ADD COLUMN IF NOT EXISTS line_basic_id TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact TEXT CHECK (
    preferred_contact IN ('line', 'email', 'both')
  ) DEFAULT 'line',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_by_admin UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS payment_note TEXT,
  ADD COLUMN IF NOT EXISTS generated_code JSONB,
  ADD COLUMN IF NOT EXISTS awaiting_oauth_until TIMESTAMPTZ;

-- slip_image_url → nullable
ALTER TABLE gas_orders ALTER COLUMN slip_image_url DROP NOT NULL;

-- Update status enum (LINE-first lifecycle)
ALTER TABLE gas_orders DROP CONSTRAINT IF EXISTS codegen_orders_status_check;
ALTER TABLE gas_orders ADD CONSTRAINT gas_orders_status_check CHECK (
  status IN (
    'draft',
    'submitted',
    'in_discussion',
    'awaiting_oauth',
    'paid',
    'in_queue',
    'in_production',
    'review',
    'delivered',
    'expired',
    'archived',
    'rejected',
    'refunded'
  )
);

-- Auto-generate order_number ถ้ายังว่าง
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

-- Trigger guard: ป้องกัน user เปลี่ยน status เอง (เฉพาะ admin หรือ draft→submitted)
CREATE OR REPLACE FUNCTION prevent_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    IF NOT (OLD.status = 'draft' AND NEW.status = 'submitted') THEN
      RAISE EXCEPTION 'forbidden_status_change';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tg_gas_orders_status_guard ON gas_orders;
CREATE TRIGGER tg_gas_orders_status_guard
  BEFORE UPDATE OF status ON gas_orders
  FOR EACH ROW EXECUTE FUNCTION prevent_user_status_change();

COMMIT;
