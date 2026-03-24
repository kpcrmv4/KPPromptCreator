-- Migration: TrueMoney → PromptPay
-- 1. Rename users.truemoney_phone → promptpay_number + add promptpay_name
ALTER TABLE users ADD COLUMN IF NOT EXISTS promptpay_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promptpay_name TEXT;

-- Copy existing truemoney_phone data to promptpay_number
UPDATE users SET promptpay_number = truemoney_phone WHERE truemoney_phone IS NOT NULL AND truemoney_phone != '';

-- Drop old column
ALTER TABLE users DROP COLUMN IF EXISTS truemoney_phone;

-- 2. Update pending_topups for slip-based flow
ALTER TABLE pending_topups ADD COLUMN IF NOT EXISTS slip_image_url TEXT;
ALTER TABLE pending_topups ADD COLUMN IF NOT EXISTS requested_amount DECIMAL(10,2);
ALTER TABLE pending_topups ADD COLUMN IF NOT EXISTS unique_amount DECIMAL(10,2);

-- Make voucher_hash and angpao_link nullable (no longer required)
ALTER TABLE pending_topups ALTER COLUMN voucher_hash DROP NOT NULL;
ALTER TABLE pending_topups ALTER COLUMN angpao_link DROP NOT NULL;

-- 3. Update settings: rename truemoney_phone → promptpay_number + add promptpay_name
UPDATE settings SET key = 'promptpay_number' WHERE key = 'truemoney_phone';
INSERT INTO settings (key, value) VALUES ('promptpay_name', '') ON CONFLICT DO NOTHING;

-- 4. Add storage bucket for topup slips (run in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('topup-slips', 'topup-slips', true) ON CONFLICT DO NOTHING;
