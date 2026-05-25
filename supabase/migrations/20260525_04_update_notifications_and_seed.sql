-- =============================================
-- Migration 4/4: Update notifications enum + seed templates + settings
-- =============================================

BEGIN;

-- ============================================
-- Notifications enum update
-- ============================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'system',

    -- Course (เดิม)
    'course_enrolled',
    'lesson_completed',

    -- GAS Builder
    'gas_order_received',
    'gas_payment_pending',
    'gas_payment_verified',
    'gas_oauth_needed',
    'gas_in_production',
    'gas_delivered',
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
  ADD COLUMN IF NOT EXISTS line_pushed BOOLEAN DEFAULT false;

-- ============================================
-- Settings ใหม่
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('line_oa_basic_id',        '@kpgas'),
  ('line_oa_qr_url',          ''),
  ('order_number_prefix',     'ORDER-'),
  ('mode_b_yearly_fee',       '300'),
  ('custom_domain_yearly_fee','300'),
  ('grace_period_days',       '90'),
  ('oauth_token_ttl_hours',   '24'),
  ('build_eta_days_starter',  '2'),
  ('build_eta_days_standard', '3'),
  ('build_eta_days_pro',      '5'),
  ('admin_response_eta_min',  '30'),
  ('working_hours',           '09:00-21:00 ICT'),
  ('floor_price',             '499')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Seed templates (floor ฿499)
-- ============================================
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
  ('custom',          'Custom (AI ออกแบบ)',  'Custom',             'ตามที่ลูกค้าเล่า',          'custom',   1500, 1500, NULL, 999)
ON CONFLICT (code) DO NOTHING;

COMMIT;
