-- ============================================
-- Migration 011: Final - Create Booking Functions
-- Run AFTER manually dropping all old versions
-- ============================================

-- Verify extensions first
DO $$
BEGIN
  PERFORM uuid_generate_v4();
  RAISE NOTICE 'UUID extension OK';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'UUID extension not enabled! Run: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";';
END $$;

-- ============================================
-- Helper: check_booking_overlap
-- ============================================

CREATE FUNCTION check_booking_overlap(
  p_teacher_id UUID,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE teacher_id = p_teacher_id
      AND status IN ('pending', 'confirmed', 'awaiting_payment')
      AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (start_at, end_at) OVERLAPS (p_start_at, p_end_at)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Main: create_booking
-- ============================================

CREATE FUNCTION create_booking(
  p_idempotency_key TEXT,
  p_teacher_id UUID,
  p_student_id UUID,
  p_subject TEXT,
  p_mode booking_mode,
  p_duration_minutes INTEGER,
  p_start_at TIMESTAMPTZ,
  p_timezone TEXT DEFAULT 'Asia/Jerusalem',
  p_notes TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_student_level TEXT DEFAULT NULL,
  p_credits_to_apply NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'mobile',
  p_selected_payment_method TEXT DEFAULT 'card'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_end_at TIMESTAMPTZ;
  v_teacher RECORD;
  v_student RECORD;
  v_price_per_hour NUMERIC;
  v_total_price NUMERIC;
  v_discount_amount NUMERIC := 0;
  v_student_balance NUMERIC := 0;
  v_amount_to_pay NUMERIC;
  v_existing_request RECORD;
  v_request_hash TEXT;
  v_subject_id UUID;
  v_booking_status booking_status;
  v_payment_status payment_status;
  v_hold_expires_at TIMESTAMPTZ;
BEGIN
  -- Security
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF auth.uid() != p_student_id THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501'; END IF;

  -- Idempotency
  v_request_hash := md5(p_teacher_id::TEXT || p_student_id::TEXT || p_start_at::TEXT || p_duration_minutes::TEXT);
  SELECT * INTO v_existing_request FROM idempotency_requests WHERE idempotency_key = p_idempotency_key AND expires_at > NOW();
  IF FOUND THEN RETURN v_existing_request.response_data; END IF;

  -- Validation
  IF p_duration_minutes NOT IN (45, 60, 90) THEN RAISE EXCEPTION 'Invalid duration' USING ERRCODE = '22000'; END IF;
  
  SELECT * INTO v_teacher FROM profiles WHERE id = p_teacher_id AND role = 'teacher' AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teacher not found' USING ERRCODE = '22000'; END IF;

  SELECT * INTO v_student FROM profiles WHERE id = p_student_id AND role = 'student' AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found' USING ERRCODE = '22000'; END IF;

  v_end_at := p_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
  
  IF check_booking_overlap(p_teacher_id, p_start_at, v_end_at) THEN 
    RAISE EXCEPTION 'Time slot already booked' USING ERRCODE = '23505'; 
  END IF;

  SELECT id INTO v_subject_id FROM subjects WHERE name_he = p_subject OR name = p_subject LIMIT 1;

  -- Calculate price
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

  -- Determine status
  IF v_amount_to_pay = 0 THEN
    v_booking_status := 'confirmed';
    v_payment_status := 'succeeded';
    v_hold_expires_at := NULL;
  ELSE
    v_booking_status := 'awaiting_payment';
    v_payment_status := 'pending';
    v_hold_expires_at := NOW() + INTERVAL '15 minutes';
  END IF;

  -- Insert booking
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

  -- Lock slot
  UPDATE availability_slots SET is_booked = TRUE, booking_id = v_booking_id
    WHERE teacher_id = p_teacher_id AND start_at = p_start_at AND end_at = v_end_at AND is_booked = FALSE;

  -- Deduct credits
  IF p_credits_to_apply > 0 THEN
    PERFORM add_student_credits(p_student_id, -p_credits_to_apply);
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, description, reason, balance_after)
    SELECT p_student_id, -p_credits_to_apply, 'used', v_booking_id, 'Applied to booking', 'apply_to_booking',
      (SELECT balance FROM student_credits WHERE student_id = p_student_id);
  END IF;

  -- Create payment
  INSERT INTO payments (booking_id, student_id, method, amount, currency, status, processed_at) VALUES
    (v_booking_id, p_student_id, p_selected_payment_method::payment_method, v_amount_to_pay, 'ILS', v_payment_status,
      CASE WHEN v_payment_status = 'succeeded' THEN NOW() ELSE NULL END);

  -- Notifications
  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_teacher_id, 
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END,
     'הזמנה חדשה', 'תלמיד הזמין שיעור',
     jsonb_build_object('booking_id', v_booking_id, 'student_name', v_student.display_name, 'status', v_booking_status));

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_student_id,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה נשמרה' ELSE 'הזמנה אושרה' END,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'ממתין לתשלום' ELSE 'אושר בהצלחה' END,
     jsonb_build_object('booking_id', v_booking_id, 'teacher_name', v_teacher.display_name, 'status', v_booking_status));

  -- Audit
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta) VALUES
    (p_student_id, 'booking_created', 'booking', v_booking_id,
     jsonb_build_object('total_price', v_total_price, 'credits_applied', p_credits_to_apply, 'status', v_booking_status));

  -- Idempotency cache
  INSERT INTO idempotency_requests (idempotency_key, request_hash, booking_id, response_data) VALUES
    (p_idempotency_key, v_request_hash, v_booking_id, 
     jsonb_build_object('booking_id', v_booking_id, 'status', v_booking_status, 'start_at', p_start_at, 'end_at', v_end_at,
       'total_price', v_total_price, 'credits_applied', p_credits_to_apply,
       'amount_charged', CASE WHEN v_booking_status = 'confirmed' THEN v_amount_to_pay ELSE 0 END,
       'amount_to_pay', v_amount_to_pay, 'currency', 'ILS', 'payment_method_selected', p_selected_payment_method));

  -- Realtime
  PERFORM pg_notify('teacher:' || p_teacher_id::TEXT, 
    jsonb_build_object('type', 'slot_booked', 'booking_id', v_booking_id, 'status', v_booking_status)::TEXT);
  PERFORM pg_notify('search:availability',
    jsonb_build_object('type', 'slot_unavailable', 'teacher_id', p_teacher_id)::TEXT);

  -- Return response
  RETURN jsonb_build_object(
    'booking_id', v_booking_id, 'status', v_booking_status, 'start_at', p_start_at, 'end_at', v_end_at,
    'teacher_id', p_teacher_id, 'total_price', v_total_price, 'credits_applied', p_credits_to_apply,
    'amount_charged', CASE WHEN v_booking_status = 'confirmed' THEN v_amount_to_pay ELSE 0 END,
    'amount_to_pay', v_amount_to_pay, 'currency', 'ILS'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- cancel_booking
-- ============================================

CREATE FUNCTION cancel_booking(
  p_booking_id UUID, p_actor_user_id UUID, p_reason TEXT, p_refund_method refund_method DEFAULT 'credits'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_hours NUMERIC;
  v_refund NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_actor_user_id THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found' USING ERRCODE = '22000'; END IF;
  IF v_booking.status IN ('cancelled', 'refunded') THEN RAISE EXCEPTION 'Already cancelled' USING ERRCODE = '22000'; END IF;

  v_hours := EXTRACT(EPOCH FROM (v_booking.start_at - NOW())) / 3600;
  
  IF v_hours >= 24 THEN v_refund := v_booking.total_price - COALESCE(v_booking.credits_applied, 0);
  ELSIF v_hours >= 12 THEN v_refund := (v_booking.total_price - COALESCE(v_booking.credits_applied, 0)) * 0.5;
  END IF;

  IF v_booking.credits_applied > 0 THEN
    PERFORM add_student_credits(v_booking.student_id, v_booking.credits_applied);
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, reason)
    VALUES (v_booking.student_id, v_booking.credits_applied, 'refund', p_booking_id, p_reason);
  END IF;

  IF v_refund > 0 OR v_booking.credits_applied > 0 THEN
    INSERT INTO refunds (booking_id, student_id, method, amount, reason, processed_at)
    VALUES (p_booking_id, v_booking.student_id, p_refund_method, v_refund + COALESCE(v_booking.credits_applied, 0), p_reason, NOW());
  END IF;

  UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = p_booking_id;
  UPDATE availability_slots SET is_booked = FALSE, booking_id = NULL WHERE booking_id = p_booking_id;

  RETURN jsonb_build_object('booking_id', p_booking_id, 'status', 'cancelled', 
    'refund', jsonb_build_object('amount', v_refund + COALESCE(v_booking.credits_applied, 0)));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- reschedule_booking
-- ============================================

CREATE FUNCTION reschedule_booking(p_booking_id UUID, p_actor_user_id UUID, p_new_start_at TIMESTAMPTZ)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_new_end TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_actor_user_id THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found' USING ERRCODE = '22000'; END IF;

  v_new_end := p_new_start_at + (v_booking.duration_minutes || ' minutes')::INTERVAL;
  
  IF check_booking_overlap(v_booking.teacher_id, p_new_start_at, v_new_end, p_booking_id) THEN 
    RAISE EXCEPTION 'New slot booked' USING ERRCODE = '23505'; 
  END IF;

  UPDATE availability_slots SET is_booked = FALSE, booking_id = NULL WHERE booking_id = p_booking_id;
  UPDATE bookings SET start_at = p_new_start_at, end_at = v_new_end WHERE id = p_booking_id;
  UPDATE availability_slots SET is_booked = TRUE, booking_id = p_booking_id
    WHERE teacher_id = v_booking.teacher_id AND start_at = p_new_start_at AND end_at = v_new_end AND is_booked = FALSE;

  RETURN jsonb_build_object('booking_id', p_booking_id, 'new_start_at', p_new_start_at);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION create_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_overlap TO authenticated;

-- ============================================
-- Verify
-- ============================================

DO $$
DECLARE
  v_count INT;
BEGIN
  -- Check only ONE version exists
  SELECT COUNT(*) INTO v_count FROM pg_proc WHERE proname = 'create_booking';
  
  IF v_count != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 create_booking function, found %', v_count;
  END IF;

  RAISE NOTICE 'Migration 011 completed!';
  RAISE NOTICE 'Functions created: create_booking, cancel_booking, reschedule_booking';
  RAISE NOTICE 'All functions have SECURITY DEFINER';
  RAISE NOTICE 'Ready to book lessons!';
END $$;

