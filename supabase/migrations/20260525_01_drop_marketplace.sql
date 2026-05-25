-- =============================================
-- Migration 1/4: Drop Marketplace
-- =============================================
-- เหตุผล: pivot ไป GAS Builder service
-- กระทบ: rows = 0 ในทุกตารางที่ลบ — ไม่มี data loss
-- Rollback: ไม่ได้ — เก็บ DB backup ก่อน apply
-- =============================================

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
