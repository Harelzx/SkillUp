-- ============================================
-- Migration 005: Enhance Booking Schema (SAFE VERSION)
-- Support full booking flow with credits, refunds, and location
-- ============================================

-- Add new enums
DO $$ BEGIN
  CREATE TYPE booking_mode AS ENUM ('online', 'student_location', 'teacher_location');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend booking_status to include 'refunded'
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'refunded';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('credits', 'card', 'card_sim');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_method AS ENUM ('credits', 'card', 'card_sim');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Enhance bookings table
-- ============================================

-- Add new columns to bookings (only if they don't exist)
DO $$ 
BEGIN
  -- Mode of lesson
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='mode') THEN
    ALTER TABLE bookings ADD COLUMN mode booking_mode DEFAULT 'online';
  END IF;

  -- Duration in minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='duration_minutes') THEN
    ALTER TABLE bookings ADD COLUMN duration_minutes INTEGER CHECK (duration_minutes IN (45, 60, 90));
  END IF;

  -- Price per hour (for calculation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='price_per_hour') THEN
    ALTER TABLE bookings ADD COLUMN price_per_hour NUMERIC(10, 2);
  END IF;

  -- Total price (calculated from duration and rate)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_price') THEN
    ALTER TABLE bookings ADD COLUMN total_price NUMERIC(10, 2) CHECK (total_price >= 0);
  END IF;

  -- Credits applied to this booking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='credits_applied') THEN
    ALTER TABLE bookings ADD COLUMN credits_applied NUMERIC(10, 2) DEFAULT 0 CHECK (credits_applied >= 0);
  END IF;

  -- Coupon code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='coupon_code') THEN
    ALTER TABLE bookings ADD COLUMN coupon_code TEXT;
  END IF;

  -- Discount amount from coupon
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='discount_amount') THEN
    ALTER TABLE bookings ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Timezone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='timezone') THEN
    ALTER TABLE bookings ADD COLUMN timezone TEXT DEFAULT 'Asia/Jerusalem';
  END IF;

  -- Source (mobile, web)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='source') THEN
    ALTER TABLE bookings ADD COLUMN source TEXT DEFAULT 'mobile';
  END IF;

  -- Student level
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='student_level') THEN
    ALTER TABLE bookings ADD COLUMN student_level TEXT;
  END IF;

  -- Currency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='currency') THEN
    ALTER TABLE bookings ADD COLUMN currency TEXT DEFAULT 'ILS';
  END IF;
END $$;

-- ============================================
-- Create refunds table
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method refund_method NOT NULL DEFAULT 'credits',
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for refunds (DROP IF EXISTS first to avoid conflicts)
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own refunds" ON refunds;
CREATE POLICY "Students can view own refunds"
  ON refunds FOR SELECT
  USING (auth.uid() = student_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_refunds_booking ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_student ON refunds(student_id);

-- ============================================
-- Create audit_log table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (auth.uid() = actor_user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- Additional indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_teacher_start ON bookings(teacher_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_student_start ON bookings(student_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_start ON bookings(status, start_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_student_created ON credit_transactions(student_id, created_at DESC);

-- ============================================
-- Update credit_transactions to support balance_after
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_transactions' AND column_name='balance_after') THEN
    ALTER TABLE credit_transactions ADD COLUMN balance_after NUMERIC(10, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_transactions' AND column_name='reason') THEN
    ALTER TABLE credit_transactions ADD COLUMN reason TEXT;
  END IF;
END $$;

-- ============================================
-- Function: Create booking with credit deduction (if not exists)
-- ============================================

CREATE OR REPLACE FUNCTION create_booking_with_credits(
  p_booking_id UUID,
  p_teacher_id UUID,
  p_student_id UUID,
  p_subject_id UUID,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_mode booking_mode,
  p_duration_minutes INTEGER,
  p_price_per_hour NUMERIC,
  p_total_price NUMERIC,
  p_credits_to_apply NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_student_level TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_current_balance NUMERIC;
BEGIN
  -- Check student has enough credits if applying
  IF p_credits_to_apply > 0 THEN
    SELECT balance INTO v_current_balance
    FROM student_credits
    WHERE student_id = p_student_id;

    IF v_current_balance IS NULL OR v_current_balance < p_credits_to_apply THEN
      RAISE EXCEPTION 'Insufficient credits';
    END IF;
  END IF;

  -- Create booking
  INSERT INTO bookings (
    id, teacher_id, student_id, subject_id,
    start_at, end_at, mode, duration_minutes,
    price_per_hour, total_price, credits_applied,
    coupon_code, discount_amount, notes, location,
    student_level, status, price, is_online
  ) VALUES (
    COALESCE(p_booking_id, uuid_generate_v4()),
    p_teacher_id, p_student_id, p_subject_id,
    p_start_at, p_end_at, p_mode, p_duration_minutes,
    p_price_per_hour, p_total_price, p_credits_to_apply,
    p_coupon_code, p_discount_amount, p_notes, p_location,
    p_student_level, 'pending', p_total_price, (p_mode = 'online')
  ) RETURNING id INTO v_booking_id;

  -- Deduct credits if applicable
  IF p_credits_to_apply > 0 THEN
    PERFORM add_student_credits(p_student_id, -p_credits_to_apply);

    -- Record transaction
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, description)
    VALUES (p_student_id, -p_credits_to_apply, 'used', v_booking_id, 'Applied to booking');
  END IF;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Process refund
-- ============================================

CREATE OR REPLACE FUNCTION process_booking_refund(
  p_booking_id UUID,
  p_refund_method refund_method,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_booking RECORD;
  v_refund_amount NUMERIC;
  v_refund_id UUID;
  v_hours_until_lesson NUMERIC;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status IN ('cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Booking already cancelled or refunded';
  END IF;

  -- Calculate hours until lesson
  v_hours_until_lesson := EXTRACT(EPOCH FROM (v_booking.start_at - NOW())) / 3600;

  -- Determine refund amount based on cancellation policy
  IF v_hours_until_lesson >= 24 THEN
    v_refund_amount := v_booking.total_price - COALESCE(v_booking.credits_applied, 0);
  ELSIF v_hours_until_lesson >= 12 THEN
    v_refund_amount := (v_booking.total_price - COALESCE(v_booking.credits_applied, 0)) * 0.5;
  ELSE
    v_refund_amount := 0;
  END IF;

  -- Refund credits that were applied (always full refund for credits)
  IF v_booking.credits_applied > 0 THEN
    PERFORM add_student_credits(v_booking.student_id, v_booking.credits_applied);
    
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, description, reason)
    VALUES (v_booking.student_id, v_booking.credits_applied, 'refund', p_booking_id, 'Booking cancelled - credits refunded', p_reason);
  END IF;

  -- Create refund record
  INSERT INTO refunds (booking_id, student_id, method, amount, reason, processed_at)
  VALUES (p_booking_id, v_booking.student_id, p_refund_method, v_refund_amount, p_reason, NOW())
  RETURNING id INTO v_refund_id;

  -- Update booking status
  UPDATE bookings
  SET status = 'refunded',
      cancelled_at = NOW(),
      cancellation_reason = p_reason
  WHERE id = p_booking_id;

  RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Update notification types
-- ============================================

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BOOKING_PENDING';
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BOOKING_REFUNDED';
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'CREDITS_ADDED';
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'CREDITS_USED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 005 completed successfully!';
  RAISE NOTICE 'Added: booking_mode enum, refunds table, audit_log table';
  RAISE NOTICE 'Enhanced: bookings table with mode, duration, credits, coupons';
END $$;

