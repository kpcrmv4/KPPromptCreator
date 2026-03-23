-- =============================================
-- KP Prompt Creator Marketplace — Database Schema
-- =============================================

-- 1. Users
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  truemoney_phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prompts (สินค้า)
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tech_stack JSONB DEFAULT '[]',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  prompt_content TEXT NOT NULL,  -- เนื้อหา prompt จริง (เข้าถึงได้เฉพาะคนซื้อ)
  prompt_file_url TEXT,         -- URL ไฟล์ .md ใน Storage (สำหรับดาวน์โหลด)
  preview_image_url TEXT,       -- รูป preview สำหรับแสดงหน้า listing
  content_hash TEXT,            -- SHA256 hash ของเนื้อหา (ใช้เช็คซ้ำ)
  kp_signature TEXT,            -- KP Fingerprint signature (พิสูจน์ว่าสร้างจากระบบ)
  demo_url TEXT,
  preview_text TEXT,  -- ตัวอย่างสั้นๆ สำหรับแสดงหน้า listing
  tags JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  rejection_reason TEXT,
  view_count INT DEFAULT 0,
  purchase_count INT DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Prompt Images
CREATE TABLE prompt_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders (คำสั่งซื้อ)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES users(id),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  seller_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reviews
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  prompt_id UUID NOT NULL REFERENCES prompts(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Transactions (เครดิต — ทั้งเติมและใช้)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'sale', 'commission', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  ref_id TEXT,  -- voucher_hash หรือ order_id
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications (แจ้งเตือน)
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),  -- คนที่จะเห็น notification
  type TEXT NOT NULL CHECK (type IN ('prompt_approved', 'prompt_rejected', 'new_sale', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  ref_id TEXT,         -- อ้างอิง payout_id, prompt_id, order_id
  ref_type TEXT,       -- 'payout', 'prompt', 'order'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Settings (ค่าคอนฟิกระบบ)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('commission_rate', '10'),          -- ค่าคอมมิชชั่น 10%
  ('truemoney_phone', ''),            -- เบอร์รับอั่งเปา
  ('site_name', 'KP Prompt Creator');

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_prompts_seller ON prompts(seller_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX idx_prompts_content_hash ON prompts(content_hash);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_prompt ON orders(prompt_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_ref ON transactions(ref_id);
CREATE INDEX idx_reviews_prompt ON reviews(prompt_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users: อ่านได้ทุกคน (public profile), แก้ไขได้เฉพาะตัวเอง, สร้างได้ถ้า id ตรงกับ auth
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Prompts: อ่าน approved ได้ทุกคน, seller จัดการของตัวเอง
CREATE POLICY "prompts_select_approved" ON prompts FOR SELECT USING (status = 'approved' OR seller_id = auth.uid());
CREATE POLICY "prompts_insert_seller" ON prompts FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "prompts_update_own" ON prompts FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "prompts_delete_own" ON prompts FOR DELETE USING (seller_id = auth.uid());

-- Prompt Images: ตามสิทธิ์ prompt
CREATE POLICY "prompt_images_select" ON prompt_images FOR SELECT USING (true);
CREATE POLICY "prompt_images_insert" ON prompt_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND seller_id = auth.uid())
);

-- Orders: เห็นเฉพาะของตัวเอง
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Reviews: อ่านได้ทุกคน, สร้างได้เฉพาะผู้ซื้อ
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Transactions: เห็นเฉพาะของตัวเอง
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (user_id = auth.uid());

-- Notifications: เห็นเฉพาะของตัวเอง
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Settings: อ่านได้ทุกคน
CREATE POLICY "settings_select" ON settings FOR SELECT USING (true);

-- =============================================
-- Function: อัปเดต avg_rating อัตโนมัติ
-- =============================================
CREATE OR REPLACE FUNCTION update_prompt_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prompts SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE prompt_id = NEW.prompt_id)
  WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_prompt_rating();

-- =============================================
-- Function: Atomic Purchase (ป้องกัน race condition)
-- =============================================
CREATE OR REPLACE FUNCTION purchase_prompt(
  p_buyer_id UUID,
  p_prompt_id UUID,
  p_commission_rate DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_prompt RECORD;
  v_buyer RECORD;
  v_seller RECORD;
  v_commission DECIMAL;
  v_seller_amount DECIMAL;
  v_new_buyer_balance DECIMAL;
  v_new_seller_balance DECIMAL;
  v_order_id UUID;
BEGIN
  -- Lock buyer row for update
  SELECT * INTO v_buyer FROM users WHERE id = p_buyer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'buyer_not_found'; END IF;

  -- Get prompt
  SELECT * INTO v_prompt FROM prompts WHERE id = p_prompt_id AND status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'prompt_not_found'; END IF;
  IF v_prompt.seller_id = p_buyer_id THEN RAISE EXCEPTION 'cannot_buy_own'; END IF;

  -- Check duplicate purchase
  IF EXISTS (SELECT 1 FROM orders WHERE buyer_id = p_buyer_id AND prompt_id = p_prompt_id) THEN
    RAISE EXCEPTION 'already_purchased';
  END IF;

  -- Check balance
  IF v_buyer.credit_balance < v_prompt.price THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Lock seller row
  SELECT * INTO v_seller FROM users WHERE id = v_prompt.seller_id FOR UPDATE;

  -- Calculate
  v_commission := ROUND(v_prompt.price * p_commission_rate, 2);
  v_seller_amount := v_prompt.price - v_commission;
  v_new_buyer_balance := v_buyer.credit_balance - v_prompt.price;
  v_new_seller_balance := v_seller.credit_balance + v_seller_amount;

  -- Update balances
  UPDATE users SET credit_balance = v_new_buyer_balance WHERE id = p_buyer_id;
  UPDATE users SET credit_balance = v_new_seller_balance WHERE id = v_prompt.seller_id;

  -- Create order
  INSERT INTO orders (buyer_id, prompt_id, seller_id, amount, commission, seller_amount)
  VALUES (p_buyer_id, p_prompt_id, v_prompt.seller_id, v_prompt.price, v_commission, v_seller_amount)
  RETURNING id INTO v_order_id;

  -- Transactions
  INSERT INTO transactions (user_id, type, amount, balance_after, ref_id, description)
  VALUES
    (p_buyer_id, 'purchase', -v_prompt.price, v_new_buyer_balance, v_order_id::text, 'ซื้อ "' || v_prompt.title || '"'),
    (v_prompt.seller_id, 'sale', v_seller_amount, v_new_seller_balance, v_order_id::text, 'ขาย "' || v_prompt.title || '" (หักค่าคอม ฿' || v_commission || ')');

  -- Update purchase count
  UPDATE prompts SET purchase_count = purchase_count + 1 WHERE id = p_prompt_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'amount', v_prompt.price,
    'commission', v_commission,
    'seller_amount', v_seller_amount,
    'new_buyer_balance', v_new_buyer_balance,
    'prompt_title', v_prompt.title,
    'seller_id', v_prompt.seller_id
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Supabase Storage: Bucket + Policies
-- =============================================

-- สร้าง bucket สำหรับเก็บไฟล์ prompt (.md)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-files',
  'prompt-files',
  false,  -- private — เข้าถึงผ่าน API เท่านั้น
  10485760,  -- 10MB max
  ARRAY['text/markdown', 'text/plain', 'application/octet-stream']
);

-- สร้าง bucket สำหรับเก็บรูปตัวอย่าง prompt
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-images',
  'prompt-images',
  true,  -- public read
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- สร้าง bucket สำหรับ avatar ของ user
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Policy: seller upload ไฟล์ prompt ได้
CREATE POLICY "prompt_files_seller_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-files'
  AND auth.role() = 'authenticated'
);

-- Policy: seller ลบไฟล์ prompt ตัวเองได้
CREATE POLICY "prompt_files_seller_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: อ่านไฟล์ prompt ผ่าน service role เท่านั้น (ไม่ public)
CREATE POLICY "prompt_files_service_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prompt-files'
  AND auth.role() = 'service_role'
);

-- Policy: ทุกคนอ่านรูป prompt-images ได้
CREATE POLICY "prompt_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-images');

-- Policy: seller upload รูปได้ (ต้อง login)
CREATE POLICY "prompt_images_seller_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-images'
  AND auth.role() = 'authenticated'
);

-- Policy: seller ลบรูปตัวเองได้ (path เริ่มด้วย user_id)
CREATE POLICY "prompt_images_seller_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: ทุกคนอ่าน avatar ได้
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: user upload avatar ตัวเองได้
CREATE POLICY "avatars_user_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: user ลบ avatar ตัวเองได้
CREATE POLICY "avatars_user_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
