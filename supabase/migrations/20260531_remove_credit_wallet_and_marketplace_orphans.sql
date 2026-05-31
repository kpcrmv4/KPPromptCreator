-- =============================================
-- Remove credit/top-up wallet + marketplace orphans
-- Date: 2026-05-31
-- =============================================
-- Context: the prompt marketplace + purchase tables were already dropped by
--   20260525_01_drop_marketplace.sql. This migration finishes the cleanup per
--   product decision:
--     * retire the credit / top-up wallet  → courses are now PromptPay-SLIP-ONLY
--     * retire the old codegen-orders v1 flow (handled in code; table already gone)
--     * drop orphaned marketplace DB objects (settings knob, user columns, empty buckets)
--
-- ⚠️ IRREVERSIBLE. Drops tables (pending_topups had 4 stale rows, transactions 0)
--    and user columns. APPLY ONLY AFTER deploying the code branch
--    `chore/remove-marketplace`, because the previously-deployed code still SELECTs
--    users.credit_balance and would break the moment that column is dropped.
-- =============================================

BEGIN;

-- 1) enroll_course(): remove the 'credit' payment branch.
--    Courses now enroll only via 'slip_verified' (Slip2Go-verified PromptPay) or 'admin_grant'.
CREATE OR REPLACE FUNCTION public.enroll_course(
  p_user_id uuid,
  p_course_id uuid,
  p_payment_method text,
  p_course_order_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  v_course RECORD;
  v_user RECORD;
  v_enrollment_id UUID;
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

  -- Payment is off-platform (PromptPay slip verified) or admin-granted; no credit movement.
  IF p_payment_method NOT IN ('slip_verified', 'admin_grant') THEN
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
    'amount', v_course.price
  );
END;
$function$;

-- 2) Drop orphaned credit-wallet tables (only outgoing FKs to users; nothing references them).
DROP TABLE IF EXISTS pending_topups CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- 3) Drop orphaned marketplace settings knob (commission_rate already gone in 20260525_01).
DELETE FROM settings WHERE key = 'min_payout_amount';

-- 4) Drop orphaned user columns (credit wallet + seller-payout account fields).
ALTER TABLE users
  DROP COLUMN IF EXISTS credit_balance,
  DROP COLUMN IF EXISTS promptpay_number,
  DROP COLUMN IF EXISTS promptpay_name;

-- 5) Drop orphaned storage policies for the now-dead buckets.
--    Kept: 'codegen' (course slips + GAS zips) and 'course-images'.
DROP POLICY IF EXISTS "Authenticated users can upload topup slips" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete topup slips" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for topup slips" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_upload" ON storage.objects;
DROP POLICY IF EXISTS "payout_proofs_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "payout_proofs_public_read" ON storage.objects;

-- NOTE: the empty buckets prompt-files, prompt-images, payout-proofs, avatars, topup-slips
-- could NOT be dropped here — Postgres blocks `DELETE FROM storage.buckets/objects`
-- (storage.protect_delete()). They are now policy-less and inert (verified 0 objects on
-- 2026-05-31). Delete them via the Supabase Dashboard → Storage, or the Storage API
-- (DELETE /storage/v1/bucket/{id} with the service-role key).

COMMIT;
