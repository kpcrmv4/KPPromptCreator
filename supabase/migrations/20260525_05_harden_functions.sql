-- =============================================
-- Migration 5/6: Harden functions
-- =============================================
-- Applied via MCP — fixes advisor warnings from migration 1-4
-- =============================================

-- Drop leftover request_payout (signature ที่ถูกต้อง = 4 args)
DROP FUNCTION IF EXISTS public.request_payout(uuid, numeric, text, numeric);

-- Revoke EXECUTE on prevent_user_status_change from public/anon/authenticated
-- เป็น trigger function — ไม่ควร callable เป็น RPC
REVOKE EXECUTE ON FUNCTION public.prevent_user_status_change() FROM PUBLIC, anon, authenticated;
