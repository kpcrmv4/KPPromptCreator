-- =============================================
-- Migration 3/4: Add GAS Builder Tables
-- =============================================
-- gas_templates, gas_specs, customer_projects, customer_oauth_tokens
-- =============================================

BEGIN;

-- ============================================
-- gas_templates — catalog ที่ลูกค้าเลือก
-- ============================================
CREATE TABLE IF NOT EXISTS gas_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  category TEXT,

  -- Pricing per mode (floor ฿499)
  base_price_mode_a INTEGER,
  base_price_mode_b INTEGER NOT NULL,

  -- Forced mode (ถ้า template บังคับ Mode B เช่น camera-required)
  forced_mode TEXT CHECK (forced_mode IN ('A', 'B') OR forced_mode IS NULL),

  preview_image_url TEXT,
  preview_html_url_mode_a TEXT,
  preview_html_url_mode_b TEXT,
  spec_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  github_template_repo TEXT,

  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 100,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT gas_templates_price_floor CHECK (
    (base_price_mode_a IS NULL OR base_price_mode_a >= 499)
    AND base_price_mode_b >= 499
  )
);

CREATE INDEX IF NOT EXISTS idx_gas_templates_active ON gas_templates(is_active, sort_order);

ALTER TABLE gas_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gas_templates_public_read"
  ON gas_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "gas_templates_admin_all"
  ON gas_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- ============================================
-- gas_specs — prompt.md ที่ generate จาก order
-- ============================================
CREATE TABLE IF NOT EXISTS gas_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES gas_orders(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  content_md TEXT NOT NULL,
  spec_json JSONB NOT NULL,
  generated_by TEXT CHECK (generated_by IN ('shop_wizard', 'ai_chat', 'admin_edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, version)
);

CREATE INDEX IF NOT EXISTS idx_gas_specs_order ON gas_specs(order_id, version DESC);

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
-- customer_projects — record ของ deploy ที่ส่งมอบแล้ว
-- ============================================
CREATE TABLE IF NOT EXISTS customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES gas_orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  slug TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('A', 'B')),

  vercel_url TEXT,
  custom_domain TEXT,
  gas_web_app_url TEXT NOT NULL,
  gas_script_id TEXT,
  github_repo TEXT,

  sheet_id TEXT,
  sheet_url TEXT,

  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN (
    'provisioning', 'live', 'expired', 'archived', 'taken_down'
  )),
  delivered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_renewed_at TIMESTAMPTZ,

  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_projects_user ON customer_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_status ON customer_projects(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_projects_expires ON customer_projects(expires_at)
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
-- customer_oauth_tokens — token ชั่วคราว 24 ชม. สำหรับ deploy
-- ============================================
CREATE TABLE IF NOT EXISTS customer_oauth_tokens (
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
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON customer_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON customer_oauth_tokens(expires_at);

ALTER TABLE customer_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oauth_tokens_owner_read"
  ON customer_oauth_tokens FOR SELECT
  USING (user_id = (select auth.uid()));

-- INSERT/UPDATE/DELETE → service_role only (no policy = blocked for users)

COMMIT;
