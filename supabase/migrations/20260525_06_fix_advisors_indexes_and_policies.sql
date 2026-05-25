-- =============================================
-- Migration 6/6: Fix advisor warnings
-- =============================================
-- Add missing FK indexes + consolidate RLS policies (1 policy per role+cmd)
-- =============================================

-- Add missing FK indexes
CREATE INDEX IF NOT EXISTS idx_gas_orders_paid_by_admin ON gas_orders(paid_by_admin)
  WHERE paid_by_admin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gas_orders_source_prompt ON gas_orders(source_prompt_id)
  WHERE source_prompt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_order ON customer_oauth_tokens(order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_project ON customer_oauth_tokens(project_id)
  WHERE project_id IS NOT NULL;

-- ===== Consolidate RLS policies =====
-- Strategy: 1 policy per (table, role, cmd) — รวม admin OR owner

-- gas_orders
DROP POLICY IF EXISTS "gas_orders_select" ON gas_orders;
DROP POLICY IF EXISTS "gas_orders_user_insert" ON gas_orders;
DROP POLICY IF EXISTS "gas_orders_user_update_draft" ON gas_orders;
DROP POLICY IF EXISTS "gas_orders_admin_update" ON gas_orders;

CREATE POLICY "gas_orders_select_owner_or_admin"
  ON gas_orders FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "gas_orders_insert_owner"
  ON gas_orders FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "gas_orders_update_owner_draft_or_admin"
  ON gas_orders FOR UPDATE
  USING (
    ((select auth.uid()) = user_id AND status = 'draft')
    OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "gas_orders_delete_admin"
  ON gas_orders FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- gas_specs
DROP POLICY IF EXISTS "gas_specs_owner_or_admin_read" ON gas_specs;
DROP POLICY IF EXISTS "gas_specs_admin_write" ON gas_specs;

CREATE POLICY "gas_specs_select_owner_or_admin"
  ON gas_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gas_orders
      WHERE gas_orders.id = gas_specs.order_id
      AND (gas_orders.user_id = (select auth.uid())
           OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'))
    )
  );

CREATE POLICY "gas_specs_insert_admin"
  ON gas_specs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "gas_specs_update_admin"
  ON gas_specs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "gas_specs_delete_admin"
  ON gas_specs FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- gas_templates
DROP POLICY IF EXISTS "gas_templates_public_read" ON gas_templates;
DROP POLICY IF EXISTS "gas_templates_admin_all" ON gas_templates;

CREATE POLICY "gas_templates_select_public_or_admin"
  ON gas_templates FOR SELECT
  USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "gas_templates_insert_admin"
  ON gas_templates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "gas_templates_update_admin"
  ON gas_templates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "gas_templates_delete_admin"
  ON gas_templates FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

-- customer_projects
DROP POLICY IF EXISTS "customer_projects_owner_or_admin_read" ON customer_projects;
DROP POLICY IF EXISTS "customer_projects_admin_write" ON customer_projects;

CREATE POLICY "customer_projects_select_owner_or_admin"
  ON customer_projects FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "customer_projects_insert_admin"
  ON customer_projects FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "customer_projects_update_admin"
  ON customer_projects FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "customer_projects_delete_admin"
  ON customer_projects FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND role = 'admin'));
