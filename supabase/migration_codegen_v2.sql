-- =============================================
-- Migration: Codegen v2 — Storage policies + review status
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- 1. Add 'review' status to codegen_orders
-- =============================================
ALTER TABLE codegen_orders
  DROP CONSTRAINT IF EXISTS codegen_orders_status_check;

ALTER TABLE codegen_orders
  ADD CONSTRAINT codegen_orders_status_check
  CHECK (status IN ('pending_payment', 'generating', 'review', 'completed', 'rejected'));

-- 2. Storage bucket config (ensure exists)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'codegen',
  'codegen',
  false,
  52428800,  -- 50MB max
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage policies for codegen bucket
-- =============================================

-- Admin (service_role) can upload ZIPs (slips + generated code)
CREATE POLICY "codegen_service_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'codegen'
  AND auth.role() = 'service_role'
);

-- Admin (service_role) can overwrite/update ZIPs
CREATE POLICY "codegen_service_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'codegen'
  AND auth.role() = 'service_role'
);

-- Users can read their own files (path: zips/{user_id}/...)
CREATE POLICY "codegen_user_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'codegen'
  AND (storage.foldername(name))[1] = 'zips'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Service role can read all files (for admin download preview)
CREATE POLICY "codegen_service_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'codegen'
  AND auth.role() = 'service_role'
);

-- Service role can delete files (cleanup)
CREATE POLICY "codegen_service_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'codegen'
  AND auth.role() = 'service_role'
);

-- 4. Fix overly permissive RLS on codegen_orders table
-- =============================================

-- Drop existing overly-permissive policies
DROP POLICY IF EXISTS "codegen_orders_insert" ON codegen_orders;
DROP POLICY IF EXISTS "codegen_orders_user_select" ON codegen_orders;
DROP POLICY IF EXISTS "codegen_orders_admin_update" ON codegen_orders;

-- Authenticated users can create their own orders
CREATE POLICY "codegen_orders_user_insert"
ON codegen_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own orders, admins can view all
CREATE POLICY "codegen_orders_select"
ON codegen_orders FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update orders (approve/reject/upload)
CREATE POLICY "codegen_orders_admin_update"
ON codegen_orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- Done! Verify by running:
-- SELECT * FROM storage.buckets WHERE id = 'codegen';
-- SELECT * FROM pg_policies WHERE tablename = 'codegen_orders';
-- =============================================
