-- ============================================
-- Migration 024: Create Coupons System
-- Creates a simple coupon system for awarding credits
-- ============================================

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- Create coupon_redemptions table (track who used which coupon)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_awarded INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, student_id) -- Each student can use a coupon only once
);

-- Create function to redeem coupon
CREATE OR REPLACE FUNCTION redeem_coupon(
  p_student_id UUID,
  p_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_transaction RECORD;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

  -- Check if coupon exists and is valid
  IF v_coupon IS NULL THEN
    RAISE EXCEPTION 'קופון לא תקין או שפג תוקפו';
  END IF;

  -- Check if student already used this coupon
  IF EXISTS (
    SELECT 1 FROM coupon_redemptions
    WHERE coupon_id = v_coupon.id AND student_id = p_student_id
  ) THEN
    RAISE EXCEPTION 'כבר השתמשת בקופון הזה בעבר';
  END IF;

  -- Create credit transaction
  INSERT INTO credit_transactions (
    student_id,
    amount,
    type,
    description
  ) VALUES (
    p_student_id,
    v_coupon.credits_amount,
    'bonus',
    'קופון: ' || v_coupon.code || ' - ' || COALESCE(v_coupon.description, 'בונוס קרדיטים')
  ) RETURNING * INTO v_transaction;

  -- Add credits to student balance
  PERFORM add_student_credits(p_student_id, v_coupon.credits_amount);

  -- Record redemption
  INSERT INTO coupon_redemptions (
    coupon_id,
    student_id,
    credits_awarded
  ) VALUES (
    v_coupon.id,
    p_student_id,
    v_coupon.credits_amount
  );

  -- Increment coupon usage counter
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE id = v_coupon.id;

  -- Return success with details
  RETURN json_build_object(
    'success', TRUE,
    'credits_awarded', v_coupon.credits_amount,
    'description', v_coupon.description,
    'transaction_id', v_transaction.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_student ON coupon_redemptions(student_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Coupons: Students can only view active coupons (read-only)
CREATE POLICY "Students can view active coupons"
ON coupons FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Coupon redemptions: Students can view their own redemptions
CREATE POLICY "Students can view own redemptions"
ON coupon_redemptions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Insert a special "MAX_CREDITS" coupon (99999 credits, unlimited uses)
INSERT INTO coupons (code, credits_amount, max_uses, description)
VALUES ('MAXCREDITS2025', 99999, NULL, 'קופון מיוחד - מקסימום קרדיטים!')
ON CONFLICT (code) DO NOTHING;

-- Insert a test coupon (100 credits, 10 uses)
INSERT INTO coupons (code, credits_amount, max_uses, description)
VALUES ('WELCOME100', 100, 10, 'ברוכים הבאים! 100 קרדיטים במתנה')
ON CONFLICT (code) DO NOTHING;

-- Add comments
COMMENT ON TABLE coupons IS 'Coupon codes for awarding credits to students';
COMMENT ON TABLE coupon_redemptions IS 'Tracks which students redeemed which coupons';
COMMENT ON FUNCTION redeem_coupon IS 'Validates and redeems a coupon code for a student';

DO $$
BEGIN
  RAISE NOTICE 'Migration 024 completed - Coupons system created';
  RAISE NOTICE '🎟️  Special coupon created: MAXCREDITS2025 (99999 credits, unlimited uses)';
  RAISE NOTICE '🎁  Test coupon created: WELCOME100 (100 credits, 10 uses)';
END $$;
