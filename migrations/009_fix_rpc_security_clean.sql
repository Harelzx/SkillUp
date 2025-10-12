-- ============================================
-- Migration 009: Fix RPC Security (Clean)
-- Drop old functions and recreate with SECURITY DEFINER
-- ============================================

-- ============================================
-- Drop old function versions
-- ============================================

-- Drop all versions of create_booking to avoid "not unique" errors
DROP FUNCTION IF EXISTS create_booking(TEXT, UUID, UUID, TEXT, booking_mode, INTEGER, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_booking(TEXT, UUID, UUID, TEXT, booking_mode, INTEGER, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT);

-- Drop old versions of other functions
DROP FUNCTION IF EXISTS cancel_booking(UUID, UUID, TEXT, refund_method);
DROP FUNCTION IF EXISTS reschedule_booking(UUID, UUID, TIMESTAMPTZ);

-- ============================================
-- Recreate create_booking with SECURITY DEFINER
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
  v_booking_id UUID; v_end_at TIMESTAMPTZ; v_teacher RECORD; v_student RECORD; 
  v_price_per_hour NUMERIC; v_total_price NUMERIC; v_discount_amount NUMERIC := 0; 
  v_student_balance NUMERIC := 0; v_amount_to_pay NUMERIC; v_payment_id UUID; 
  v_has_overlap BOOLEAN; v_existing_request RECORD; v_request_hash TEXT; v_subject_id UUID;
  v_booking_status booking_status; v_payment_status payment_status; v_hold_expires_at TIMESTAMPTZ;
BEGIN
  -- Security: Verify authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Security: Verify user creating booking for themselves
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: can only create bookings for yourself' USING ERRCODE = '42501';
  END IF;

  v_request_hash := md5(p_teacher_id::TEXT || p_student_id::TEXT || p_start_at::TEXT || p_duration_minutes::TEXT);

  SELECT * INTO v_existing_request FROM idempotency_requests 
  WHERE idempotency_key = p_idempotency_key AND expires_at > NOW();
  
  IF FOUND THEN RETURN v_existing_request.response_data; END IF;

  IF p_duration_minutes NOT IN (45, 60, 90) THEN 
    RAISE EXCEPTION 'Invalid duration' USING ERRCODE = '22000'; 
  END IF;
  
  IF p_credits_to_apply < 0 THEN 
    RAISE EXCEPTION 'Credits cannot be negative' USING ERRCODE = '22000'; 
  END IF;

  SELECT * INTO v_teacher FROM profiles WHERE id = p_teacher_id AND role = 'teacher' AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teacher not found or inactive' USING ERRCODE = '22000'; END IF;

  SELECT * INTO v_student FROM profiles WHERE id = p_student_id AND role = 'student' AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student not found or inactive' USING ERRCODE = '22000'; END IF;

  v_end_at := p_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
  v_has_overlap := check_booking_overlap(p_teacher_id, p_start_at, v_end_at);
  
  IF v_has_overlap THEN 
    RAISE EXCEPTION 'Time slot is already booked' USING ERRCODE = '23505'; 
  END IF;

  SELECT id INTO v_subject_id FROM subjects WHERE name_he = p_subject OR name = p_subject LIMIT 1;

  v_price_per_hour := COALESCE(v_teacher.hourly_rate, 150);
  v_total_price := v_price_per_hour * (p_duration_minutes::NUMERIC / 60);

  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    v_discount_amount := v_total_price * 0.1;
    v_total_price := v_total_price - v_discount_amount;
  END IF;

  IF p_credits_to_apply > 0 THEN
    SELECT COALESCE(balance, 0) INTO v_student_balance FROM student_credits WHERE student_id = p_student_id;
    IF v_student_balance < p_credits_to_apply THEN 
      RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = '22000'; 
    END IF;
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
      CASE WHEN v_payment_status = 'succeeded' THEN NOW() ELSE NULL END) 
  RETURNING id INTO v_payment_id;

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_teacher_id, 
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה חדשה (ממתין לתשלום)' ELSE 'הזמנה חדשה' END,
     'תלמיד חדש הזמין שיעור',
     jsonb_build_object('booking_id', v_booking_id, 'student_name', v_student.display_name, 'subject', p_subject, 
       'start_at', p_start_at, 'duration', p_duration_minutes, 'status', v_booking_status));

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_student_id,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה נשמרה' ELSE 'הזמנה אושרה' END,
     CASE WHEN v_booking_status = 'awaiting_payment' THEN 'ממתין לאישור תשלום' ELSE 'השיעור שלך אושר בהצלחה' END,
     jsonb_build_object('booking_id', v_booking_id, 'teacher_name', v_teacher.display_name, 'subject', p_subject,
       'start_at', p_start_at, 'duration', p_duration_minutes, 'status', v_booking_status));

  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta) VALUES
    (p_student_id, 'booking_created', 'booking', v_booking_id,
     jsonb_build_object('teacher_id', p_teacher_id, 'start_at', p_start_at, 'duration_minutes', p_duration_minutes,
       'total_price', v_total_price, 'credits_applied', p_credits_to_apply, 'amount_to_pay', v_amount_to_pay,
       'status', v_booking_status, 'payment_method', p_selected_payment_method));

  DECLARE v_response JSONB;
  BEGIN
    v_response := jsonb_build_object(
      'booking_id', v_booking_id, 'status', v_booking_status, 'start_at', p_start_at, 'end_at', v_end_at,
      'teacher_id', p_teacher_id, 'total_price', v_total_price, 'credits_applied', p_credits_to_apply,
      'amount_charged', CASE WHEN v_booking_status = 'confirmed' THEN v_amount_to_pay ELSE 0 END,
      'amount_to_pay', v_amount_to_pay, 'currency', 'ILS', 
      'payment_method_selected', p_selected_payment_method, 'hold_expires_at', v_hold_expires_at
    );

    INSERT INTO idempotency_requests (idempotency_key, request_hash, booking_id, response_data)
    VALUES (p_idempotency_key, v_request_hash, v_booking_id, v_response);

    PERFORM pg_notify('teacher:' || p_teacher_id::TEXT, 
      jsonb_build_object('type', 'slot_booked', 'booking_id', v_booking_id, 'start_at', p_start_at, 
        'end_at', v_end_at, 'status', v_booking_status)::TEXT);
    
    PERFORM pg_notify('search:availability',
      jsonb_build_object('type', 'slot_unavailable', 'teacher_id', p_teacher_id, 'start_at', p_start_at,
        'end_at', v_end_at, 'status', v_booking_status)::TEXT);

    RETURN v_response;
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Recreate cancel_booking with SECURITY DEFINER
-- ============================================

CREATE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_actor_user_id UUID,
  p_reason TEXT,
  p_refund_method refund_method DEFAULT 'credits'
)
RETURNS JSONB 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD; v_hours_until_lesson NUMERIC; v_refund_amount NUMERIC := 0; 
  v_refund_id UUID; v_can_cancel BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF auth.uid() != p_actor_user_id THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found' USING ERRCODE = '22000'; END IF;

  v_can_cancel := (p_actor_user_id = v_booking.student_id OR p_actor_user_id = v_booking.teacher_id);
  IF NOT v_can_cancel THEN RAISE EXCEPTION 'Unauthorized to cancel this booking' USING ERRCODE = '42501'; END IF;

  IF v_booking.status IN ('cancelled', 'refunded') THEN 
    RAISE EXCEPTION 'Booking already cancelled' USING ERRCODE = '22000'; 
  END IF;

  v_hours_until_lesson := EXTRACT(EPOCH FROM (v_booking.start_at - NOW())) / 3600;

  IF v_hours_until_lesson >= 24 THEN
    v_refund_amount := v_booking.total_price - COALESCE(v_booking.credits_applied, 0);
  ELSIF v_hours_until_lesson >= 12 THEN
    v_refund_amount := (v_booking.total_price - COALESCE(v_booking.credits_applied, 0)) * 0.5;
  ELSE
    v_refund_amount := 0;
  END IF;

  IF v_booking.credits_applied > 0 THEN
    PERFORM add_student_credits(v_booking.student_id, v_booking.credits_applied);
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, description, reason, balance_after)
    SELECT v_booking.student_id, v_booking.credits_applied, 'refund', p_booking_id, 
      'Booking cancelled - credits refunded', p_reason,
      (SELECT balance FROM student_credits WHERE student_id = v_booking.student_id);
  END IF;

  IF v_refund_amount > 0 OR v_booking.credits_applied > 0 THEN
    INSERT INTO refunds (booking_id, student_id, method, amount, reason, processed_at) VALUES
      (p_booking_id, v_booking.student_id, p_refund_method, 
       v_refund_amount + COALESCE(v_booking.credits_applied, 0), p_reason, NOW())
    RETURNING id INTO v_refund_id;
  END IF;

  UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = p_reason 
  WHERE id = p_booking_id;
  
  UPDATE availability_slots SET is_booked = FALSE, booking_id = NULL WHERE booking_id = p_booking_id;

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (v_booking.teacher_id, 'BOOKING_CANCELLED', 'שיעור בוטל', 'תלמיד ביטל שיעור',
     jsonb_build_object('booking_id', p_booking_id, 'start_at', v_booking.start_at, 'reason', p_reason));

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (v_booking.student_id, 'BOOKING_CANCELLED', 'שיעור בוטל', 'השיעור בוטל בהצלחה',
     jsonb_build_object('booking_id', p_booking_id, 'start_at', v_booking.start_at, 
       'refund_amount', v_refund_amount + COALESCE(v_booking.credits_applied, 0)));

  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta) VALUES
    (p_actor_user_id, 'booking_canceled', 'booking', p_booking_id,
     jsonb_build_object('reason', p_reason, 'refund_amount', v_refund_amount, 
       'credits_refunded', v_booking.credits_applied, 'hours_until_lesson', v_hours_until_lesson));

  PERFORM pg_notify('teacher:' || v_booking.teacher_id::TEXT, 
    jsonb_build_object('type', 'slot_released', 'booking_id', p_booking_id, 
      'start_at', v_booking.start_at, 'end_at', v_booking.end_at)::TEXT);
  
  PERFORM pg_notify('search:availability', 
    jsonb_build_object('type', 'slot_available', 'teacher_id', v_booking.teacher_id,
      'start_at', v_booking.start_at, 'end_at', v_booking.end_at)::TEXT);

  RETURN jsonb_build_object('booking_id', p_booking_id, 'status', 'cancelled', 
    'refund', jsonb_build_object('method', p_refund_method, 
      'amount', v_refund_amount + COALESCE(v_booking.credits_applied, 0)));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Recreate reschedule_booking with SECURITY DEFINER
-- ============================================

CREATE FUNCTION reschedule_booking(
  p_booking_id UUID,
  p_actor_user_id UUID,
  p_new_start_at TIMESTAMPTZ
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD; v_new_end_at TIMESTAMPTZ; v_has_overlap BOOLEAN; 
  v_hours_until_lesson NUMERIC; v_can_reschedule BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF auth.uid() != p_actor_user_id THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found' USING ERRCODE = '22000'; END IF;

  v_can_reschedule := (p_actor_user_id = v_booking.student_id OR p_actor_user_id = v_booking.teacher_id);
  IF NOT v_can_reschedule THEN 
    RAISE EXCEPTION 'Unauthorized to reschedule this booking' USING ERRCODE = '42501'; 
  END IF;

  IF v_booking.status NOT IN ('pending', 'confirmed', 'awaiting_payment') THEN
    RAISE EXCEPTION 'Booking cannot be rescheduled' USING ERRCODE = '22000';
  END IF;

  v_hours_until_lesson := EXTRACT(EPOCH FROM (v_booking.start_at - NOW())) / 3600;
  IF v_hours_until_lesson < 12 THEN 
    RAISE EXCEPTION 'Cannot reschedule within 12 hours' USING ERRCODE = '22000'; 
  END IF;

  v_new_end_at := p_new_start_at + (v_booking.duration_minutes || ' minutes')::INTERVAL;
  v_has_overlap := check_booking_overlap(v_booking.teacher_id, p_new_start_at, v_new_end_at, p_booking_id);
  
  IF v_has_overlap THEN 
    RAISE EXCEPTION 'New time slot is already booked' USING ERRCODE = '23505'; 
  END IF;

  UPDATE availability_slots SET is_booked = FALSE, booking_id = NULL WHERE booking_id = p_booking_id;
  UPDATE bookings SET start_at = p_new_start_at, end_at = v_new_end_at WHERE id = p_booking_id;
  UPDATE availability_slots SET is_booked = TRUE, booking_id = p_booking_id
    WHERE teacher_id = v_booking.teacher_id AND start_at = p_new_start_at 
      AND end_at = v_new_end_at AND is_booked = FALSE;

  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta) VALUES
    (p_actor_user_id, 'booking_rescheduled', 'booking', p_booking_id,
     jsonb_build_object('old_start_at', v_booking.start_at, 'new_start_at', p_new_start_at));

  PERFORM pg_notify('teacher:' || v_booking.teacher_id::TEXT,
    jsonb_build_object('type', 'booking_rescheduled', 'booking_id', p_booking_id, 
      'old_start_at', v_booking.start_at, 'old_end_at', v_booking.end_at,
      'new_start_at', p_new_start_at, 'new_end_at', v_new_end_at)::TEXT);

  RETURN jsonb_build_object('booking_id', p_booking_id, 'old_start_at', v_booking.start_at, 
    'new_start_at', p_new_start_at, 'status', 'rescheduled');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION create_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking TO authenticated;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION create_booking IS 'Create booking with SECURITY DEFINER - bypasses RLS on system tables';
COMMENT ON FUNCTION cancel_booking IS 'Cancel booking with SECURITY DEFINER - bypasses RLS on system tables';
COMMENT ON FUNCTION reschedule_booking IS 'Reschedule booking with SECURITY DEFINER - bypasses RLS on system tables';

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 009 (Clean) completed successfully!';
  RAISE NOTICE 'RPC functions now have SECURITY DEFINER and can write to system tables';
  RAISE NOTICE 'Security checks ensure users can only act on their own behalf';
  RAISE NOTICE 'Ready to create bookings!';
END $$;

