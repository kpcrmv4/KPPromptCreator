-- Migration: Create pending_topups table for manual TrueMoney verification flow
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hgjrxixbdmklwzcfyrxm/sql

CREATE TABLE IF NOT EXISTS pending_topups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  voucher_hash TEXT NOT NULL,
  angpao_link TEXT NOT NULL,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_topups_status ON pending_topups(status);
CREATE INDEX IF NOT EXISTS idx_pending_topups_user ON pending_topups(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_topups_hash_pending ON pending_topups(voucher_hash) WHERE status = 'pending';

ALTER TABLE pending_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pending_topups" ON pending_topups
  FOR ALL USING (true) WITH CHECK (true);
