-- ============================================
-- Migration 008: Payment UI Support (SAFE)
-- Can be run multiple times safely
-- ============================================

-- Add awaiting_payment to enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'awaiting_payment' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')) THEN
    ALTER TYPE booking_status ADD VALUE 'awaiting_payment';
  END IF;
END $$;

-- Add columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='hold_expires_at') THEN
    ALTER TABLE bookings ADD COLUMN hold_expires_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_method_selected') THEN
    ALTER TABLE bookings ADD COLUMN payment_method_selected TEXT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_hold_expires ON bookings(hold_expires_at) WHERE hold_expires_at IS NOT NULL;

-- Updated create_booking with payment method support
CREATE OR REPLACE FUNCTION create_booking(
  p_idempotency_key TEXT, p_teacher_id UUID, p_student_id UUID, p_subject TEXT, p_mode booking_mode,
  p_duration_minutes INTEGER, p_start_at TIMESTAMPTZ, p_timezone TEXT DEFAULT 'Asia/Jerusalem',
  p_notes TEXT DEFAULT NULL, p_location TEXT DEFAULT NULL, p_student_level TEXT DEFAULT NULL,
  p_credits_to_apply NUMERIC DEFAULT 0, p_coupon_code TEXT DEFAULT NULL, p_source TEXT DEFAULT 'mobile',
  p_selected_payment_method TEXT DEFAULT 'card'
)
RETURNS JSONB AS $$
DECLARE
  v_booking_id UUID; v_end_at TIMESTAMPTZ; v_teacher RECORD; v_student RECORD; v_price_per_hour NUMERIC;
  v_total_price NUMERIC; v_discount_amount NUMERIC := 0; v_student_balance NUMERIC := 0; v_amount_to_pay NUMERIC;
  v_payment_id UUID; v_has_overlap BOOLEAN; v_existing_request RECORD; v_request_hash TEXT; v_subject_id UUID;
  v_booking_status booking_status; v_payment_status payment_status; v_hold_expires_at TIMESTAMPTZ;
BEGIN
  v_request_hash := md5(p_teacher_id::TEXT || p_student_id::TEXT || p_start_at::TEXT || p_duration_minutes::TEXT);

  SELECT * INTO v_existing_request FROM idempotency_requests WHERE idempotency_key = p_idempotency_key AND expires_at > NOW();
  IF FOUND THEN RETURN v_existing_request.response_data; END IF;

  IF p_duration_minutes NOT IN (45, 60, 90) THEN RAISE EXCEPTION 'Invalid duration' USING ERRCODE = '22000'; END IF;
  IF p_credits_to_apply < 0 THEN RAISE EXCEPTION 'Credits cannot be negative' USING ERRCODE = '22000'; END IF;

  SELECT * INTO v_teacher FROM profiles WHERE id = p_teacher_id AND role = 'teacher' AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teacher not found or inactive' USING ERRCODE = '22000'; END IF;

  SELECT * INTO v_student FROM profiles WHERE id = p_student_id AND role = 'student' AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found or inactive' USING ERRCODE = '22000'; END IF;

  v_end_at := p_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
  v_has_overlap := check_booking_overlap(p_teacher_id, p_start_at, v_end_at);
  IF v_has_overlap THEN RAISE EXCEPTION 'Time slot is already booked' USING ERRCODE = '23505'; END IF;

  SELECT id INTO v_subject_id FROM subjects WHERE name_he = p_subject OR name = p_subject LIMIT 1;

  v_price_per_hour := COALESCE(v_teacher.hourly_rate, 150);
  v_total_price := v_price_per_hour * (p_duration_minutes::NUMERIC / 60);

  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    v_discount_amount := v_total_price * 0.1;
    v_total_price := v_total_price - v_discount_amount;
  END IF;

  IF p_credits_to_apply > 0 THEN
    SELECT COALESCE(balance, 0) INTO v_student_balance FROM student_credits WHERE student_id = p_student_id;
    IF v_student_balance < p_credits_to_apply THEN RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = '22000'; END IF;
  END IF;

  v_amount_to_pay := GREATEST(v_total_price - p_credits_to_apply, 0);
  v_booking_id := uuid_generate_v4();

  IF v_amount_to_pay = 0 THEN
    v_booking_status := 'confirmed';
    v_payment_status := 'succeeded';
    v_hold_expires_at := NULL;
  ELSE
    v_booking_status := 'awaiting_payment';
    v_payment_status := 'pending';
    v_hold_expires_at := NOW() + INTERVAL '15 minutes';
  END IF;

  INSERT INTO bookings (
    id, teacher_id, student_id, subject_id, start_at, end_at, mode, duration_minutes,
    price_per_hour, total_price, price, credits_applied, coupon_code, discount_amount,
    notes, location, student_level, timezone, source, status, is_online,
    payment_method_selected, hold_expires_at
  ) VALUES (
    v_booking_id, p_teacher_id, p_student_id, v_subject_id, p_start_at, v_end_at, p_mode, p_duration_minutes,
    v_price_per_hour, v_total_price, v_total_price, p_credits_to_apply, p_coupon_code, v_discount_amount,
    p_notes, p_location, p_student_level, p_timezone, p_source, v_booking_status, (p_mode = 'online'),
    p_selected_payment_method, v_hold_expires_at
  );

  UPDATE availability_slots SET is_booked = TRUE, booking_id = v_booking_id
    WHERE teacher_id = p_teacher_id AND start_at = p_start_at AND end_at = v_end_at AND is_booked = FALSE;

  IF p_credits_to_apply > 0 THEN
    PERFORM add_student_credits(p_student_id, -p_credits_to_apply);
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, description, reason, balance_after)
    SELECT p_student_id, -p_credits_to_apply, 'used', v_booking_id, 'Applied to booking', 'apply_to_booking',
      (SELECT balance FROM student_credits WHERE student_id = p_student_id);
  END IF;

  INSERT INTO payments (booking_id, student_id, method, amount, currency, status, processed_at) VALUES
    (v_booking_id, p_student_id, p_selected_payment_method::payment_method, v_amount_to_pay, 'ILS', v_payment_status,
      CASE WHEN v_payment_status = 'succeeded' THEN NOW() ELSE NULL END) RETURNING id INTO v_payment_id;

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_teacher_id, CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END,
      CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה חדשה (ממתין לתשלום)' ELSE 'הזמנה חדשה' END, 'תלמיד חדש הזמין שיעור',
      jsonb_build_object('booking_id', v_booking_id, 'student_name', v_student.display_name, 'subject', p_subject, 'start_at', p_start_at, 'duration', p_duration_minutes, 'status', v_booking_status));

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_student_id, CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END,
      CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה נשמרה' ELSE 'הזמנה אושרה' END,
      CASE WHEN v_booking_status = 'awaiting_payment' THEN 'ממתין לאישור תשלום' ELSE 'השיעור שלך אושר בהצלחה' END,
      jsonb_build_object('booking_id', v_booking_id, 'teacher_name', v_teacher.display_name, 'subject', p_subject, 'start_at', p_start_at, 'duration', p_duration_minutes, 'status', v_booking_status));

  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta) VALUES
    (p_student_id, 'booking_created', 'booking', v_booking_id,
      jsonb_build_object('teacher_id', p_teacher_id, 'start_at', p_start_at, 'duration_minutes', p_duration_minutes,
        'total_price', v_total_price, 'credits_applied', p_credits_to_apply, 'amount_to_pay', v_amount_to_pay, 'status', v_booking_status, 'payment_method', p_selected_payment_method));

  DECLARE v_response JSONB;
  BEGIN
    v_response := jsonb_build_object('booking_id', v_booking_id, 'status', v_booking_status, 'start_at', p_start_at, 'end_at', v_end_at,
      'teacher_id', p_teacher_id, 'total_price', v_total_price, 'credits_applied', p_credits_to_apply,
      'amount_charged', CASE WHEN v_booking_status = 'confirmed' THEN v_amount_to_pay ELSE 0 END,
      'amount_to_pay', v_amount_to_pay, 'currency', 'ILS', 'payment_method_selected', p_selected_payment_method, 'hold_expires_at', v_hold_expires_at);

    INSERT INTO idempotency_requests (idempotency_key, request_hash, booking_id, response_data)
    VALUES (p_idempotency_key, v_request_hash, v_booking_id, v_response);

    PERFORM pg_notify('teacher:' || p_teacher_id::TEXT, 
      jsonb_build_object('type', 'slot_booked', 'booking_id', v_booking_id, 'start_at', p_start_at, 'end_at', v_end_at, 'status', v_booking_status)::TEXT);
    PERFORM pg_notify('search:availability',
      jsonb_build_object('type', 'slot_unavailable', 'teacher_id', p_teacher_id, 'start_at', p_start_at, 'end_at', v_end_at, 'status', v_booking_status)::TEXT);

    RETURN v_response;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS TABLE(released_booking_id UUID, teacher_id UUID, start_at TIMESTAMPTZ, end_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  WITH expired_bookings AS (
    SELECT b.id, b.teacher_id, b.start_at, b.end_at FROM bookings b
    WHERE b.status = 'awaiting_payment' AND b.hold_expires_at IS NOT NULL AND b.hold_expires_at < NOW()
  ),
  updated AS (
    UPDATE bookings b SET status = 'cancelled', cancelled_at = NOW(),
      cancellation_reason = 'Payment hold expired - no payment received within 15 minutes'
    FROM expired_bookings e WHERE b.id = e.id
    RETURNING b.id, b.teacher_id, b.start_at, b.end_at
  ),
  released_slots AS (
    UPDATE availability_slots s SET is_booked = FALSE, booking_id = NULL
    FROM updated u WHERE s.booking_id = u.id
    RETURNING u.id, u.teacher_id, u.start_at, u.end_at
  )
  SELECT * FROM released_slots;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE 'Migration 008 (SAFE) completed!';
END $$;

