-- Migration: Support free prompts (price = 0) with zero fee / zero credit deduction
-- Run in Supabase SQL Editor if this migration has not been applied yet.

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
  SELECT * INTO v_buyer
  FROM users
  WHERE id = p_buyer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'buyer_not_found';
  END IF;

  SELECT * INTO v_prompt
  FROM prompts
  WHERE id = p_prompt_id
    AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'prompt_not_found';
  END IF;

  IF v_prompt.seller_id = p_buyer_id THEN
    RAISE EXCEPTION 'cannot_buy_own';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM orders
    WHERE buyer_id = p_buyer_id
      AND prompt_id = p_prompt_id
  ) THEN
    RAISE EXCEPTION 'already_purchased';
  END IF;

  IF v_buyer.credit_balance < v_prompt.price THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  SELECT * INTO v_seller
  FROM users
  WHERE id = v_prompt.seller_id
  FOR UPDATE;

  v_commission := ROUND(v_prompt.price * p_commission_rate, 2);
  v_seller_amount := v_prompt.price - v_commission;
  v_new_buyer_balance := v_buyer.credit_balance - v_prompt.price;
  v_new_seller_balance := v_seller.credit_balance + v_seller_amount;

  IF v_prompt.price = 0 THEN
    v_commission := 0;
    v_seller_amount := 0;
    v_new_buyer_balance := v_buyer.credit_balance;
    v_new_seller_balance := v_seller.credit_balance;
  END IF;

  IF v_prompt.price > 0 THEN
    UPDATE users
    SET credit_balance = v_new_buyer_balance
    WHERE id = p_buyer_id;

    UPDATE users
    SET credit_balance = v_new_seller_balance
    WHERE id = v_prompt.seller_id;
  END IF;

  INSERT INTO orders (buyer_id, prompt_id, seller_id, amount, commission, seller_amount)
  VALUES (p_buyer_id, p_prompt_id, v_prompt.seller_id, v_prompt.price, v_commission, v_seller_amount)
  RETURNING id INTO v_order_id;

  IF v_prompt.price > 0 THEN
    INSERT INTO transactions (user_id, type, amount, balance_after, ref_id, description)
    VALUES
      (p_buyer_id, 'purchase', -v_prompt.price, v_new_buyer_balance, v_order_id::text, 'ซื้อ "' || v_prompt.title || '"'),
      (v_prompt.seller_id, 'sale', v_seller_amount, v_new_seller_balance, v_order_id::text, 'ขาย "' || v_prompt.title || '" (หักค่าคอม ฿' || v_commission || ')');
  END IF;

  UPDATE prompts
  SET purchase_count = purchase_count + 1
  WHERE id = p_prompt_id;

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

-- Recommended hardening:
-- Prevent duplicate purchases of the same prompt by the same buyer.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT buyer_id, prompt_id, COUNT(*) AS duplicate_count
      FROM orders
      GROUP BY buyer_id, prompt_id
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE NOTICE 'Skipped unique index idx_orders_buyer_prompt_unique because duplicate orders already exist.';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_orders_buyer_prompt_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_orders_buyer_prompt_unique ON public.orders (buyer_id, prompt_id)';
  END IF;
END $$;
