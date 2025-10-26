-- ============================================
-- Migration 020: Update create_booking RPC
-- ============================================
-- Update the create_booking function to:
-- 1. Accept new student_level_category and student_level_proficiency parameters
-- 2. Remove old student_level parameter
-- 3. Add server-side validation for duration_minutes against teacher.duration_options
-- 4. Add validation for mode against teacher.lesson_modes

CREATE OR REPLACE FUNCTION create_booking(
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
  p_student_level_category TEXT DEFAULT NULL,
  p_student_level_proficiency TEXT DEFAULT NULL,
  p_credits_to_apply NUMERIC DEFAULT 0, 
  p_coupon_code TEXT DEFAULT NULL, 
  p_source TEXT DEFAULT 'mobile',
  p_selected_payment_method TEXT DEFAULT 'card'
)
RETURNS JSONB AS $$
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
  v_payment_id UUID; 
  v_has_overlap BOOLEAN; 
  v_existing_request RECORD; 
  v_request_hash TEXT; 
  v_subject_id UUID;
  v_booking_status booking_status; 
  v_payment_status payment_status; 
  v_hold_expires_at TIMESTAMPTZ;
  v_duration_supported BOOLEAN;
  v_mode_supported BOOLEAN;
BEGIN
  v_request_hash := md5(p_teacher_id::TEXT || p_student_id::TEXT || p_start_at::TEXT || p_duration_minutes::TEXT);

  -- Check idempotency
  SELECT * INTO v_existing_request FROM idempotency_requests 
    WHERE idempotency_key = p_idempotency_key AND expires_at > NOW();
  IF FOUND THEN RETURN v_existing_request.response_data; END IF;

  -- Basic validations
  IF p_credits_to_apply < 0 THEN 
    RAISE EXCEPTION 'Credits cannot be negative' USING ERRCODE = '22000'; 
  END IF;

  -- Get teacher profile
  SELECT * INTO v_teacher FROM profiles WHERE id = p_teacher_id AND role = 'teacher' AND is_active = TRUE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Teacher not found or inactive' USING ERRCODE = '22000'; 
  END IF;

  -- Validate duration_minutes against teacher's duration_options
  IF v_teacher.duration_options IS NOT NULL AND array_length(v_teacher.duration_options, 1) > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM unnest(v_teacher.duration_options) AS option 
      WHERE option = p_duration_minutes
    ) INTO v_duration_supported;
    
    IF NOT v_duration_supported THEN
      RAISE EXCEPTION 'Duration % minutes not supported by teacher. Available durations: %', 
        p_duration_minutes, array_to_string(v_teacher.duration_options, ', ') 
        USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Validate mode against teacher's lesson_modes
  IF v_teacher.lesson_modes IS NOT NULL AND array_length(v_teacher.lesson_modes, 1) > 0 THEN
    -- Map our booking_mode enum to teacher's lesson_modes format
    SELECT EXISTS (
      SELECT 1 FROM unnest(v_teacher.lesson_modes) AS mode 
      WHERE (mode = 'online' AND p_mode = 'online') OR
            (mode = 'at_teacher' AND p_mode = 'teacher_location') OR
            (mode = 'at_student' AND p_mode = 'student_location')
    ) INTO v_mode_supported;
    
    IF NOT v_mode_supported THEN
      RAISE EXCEPTION 'Mode % not supported by teacher. Available modes: %', 
        p_mode::TEXT, array_to_string(v_teacher.lesson_modes, ', ') 
        USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Get student profile
  SELECT * INTO v_student FROM profiles WHERE id = p_student_id AND role = 'student' AND is_active = TRUE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Student not found or inactive' USING ERRCODE = '22000'; 
  END IF;

  -- Check for overlapping bookings
  v_end_at := p_start_at + (p_duration_minutes || ' minutes')::INTERVAL;
  v_has_overlap := check_booking_overlap(p_teacher_id, p_start_at, v_end_at);
  IF v_has_overlap THEN 
    RAISE EXCEPTION 'Time slot is already booked' USING ERRCODE = '23505'; 
  END IF;

  -- Get subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name_he = p_subject OR name = p_subject LIMIT 1;

  -- Calculate pricing
  v_price_per_hour := COALESCE(v_teacher.hourly_rate, 150);
  v_total_price := v_price_per_hour * (p_duration_minutes::NUMERIC / 60);

  -- Apply coupon discount if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    v_discount_amount := v_total_price * 0.1;
    v_total_price := v_total_price - v_discount_amount;
  END IF;

  -- Check and apply credits
  IF p_credits_to_apply > 0 THEN
    SELECT COALESCE(balance, 0) INTO v_student_balance FROM student_credits WHERE student_id = p_student_id;
    IF v_student_balance < p_credits_to_apply THEN 
      RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = '22000'; 
    END IF;
  END IF;

  v_amount_to_pay := GREATEST(v_total_price - p_credits_to_apply, 0);
  v_booking_id := uuid_generate_v4();

  -- Determine booking and payment status
  IF v_amount_to_pay = 0 THEN
    v_booking_status := 'confirmed';
    v_payment_status := 'succeeded';
    v_hold_expires_at := NULL;
  ELSE
    v_booking_status := 'awaiting_payment';
    v_payment_status := 'pending';
    v_hold_expires_at := NOW() + INTERVAL '15 minutes';
  END IF;

  -- Insert booking with new student level fields
  INSERT INTO bookings (
    id, teacher_id, student_id, subject_id, start_at, end_at, mode, duration_minutes,
    price_per_hour, total_price, price, credits_applied, coupon_code, discount_amount,
    notes, location, student_level_category, student_level_proficiency, timezone, source, status, is_online,
    payment_method_selected, hold_expires_at
  ) VALUES (
    v_booking_id, p_teacher_id, p_student_id, v_subject_id, p_start_at, v_end_at, p_mode, p_duration_minutes,
    v_price_per_hour, v_total_price, v_total_price, p_credits_to_apply, p_coupon_code, v_discount_amount,
    p_notes, p_location, p_student_level_category, p_student_level_proficiency, p_timezone, p_source, v_booking_status, (p_mode = 'online'),
    p_selected_payment_method, v_hold_expires_at
  );

  -- Lock the availability slot
  UPDATE availability_slots SET is_booked = TRUE, booking_id = v_booking_id
    WHERE teacher_id = p_teacher_id AND start_at = p_start_at AND end_at = v_end_at AND is_booked = FALSE;

  -- Apply credits if used
  IF p_credits_to_apply > 0 THEN
    PERFORM add_student_credits(p_student_id, -p_credits_to_apply);
    INSERT INTO credit_transactions (student_id, amount, type, booking_id, description, reason, balance_after)
    SELECT p_student_id, -p_credits_to_apply, 'used', v_booking_id, 'Applied to booking', 'apply_to_booking',
      (SELECT balance FROM student_credits WHERE student_id = p_student_id);
  END IF;

  -- Create payment record
  INSERT INTO payments (booking_id, student_id, method, amount, currency, status, processed_at) VALUES
    (v_booking_id, p_student_id, p_selected_payment_method::payment_method, v_amount_to_pay, 'ILS', v_payment_status,
      CASE WHEN v_payment_status = 'succeeded' THEN NOW() ELSE NULL END) RETURNING id INTO v_payment_id;

  -- Send notifications
  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_teacher_id, (CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END)::notification_type,
      CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה חדשה (ממתין לתשלום)' ELSE 'הזמנה חדשה' END, 'תלמיד חדש הזמין שיעור',
      jsonb_build_object('booking_id', v_booking_id, 'student_name', v_student.display_name, 'subject', p_subject, 
        'start_at', p_start_at, 'duration', p_duration_minutes, 'status', v_booking_status));

  INSERT INTO notifications (user_id, type, title, subtitle, data) VALUES
    (p_student_id, (CASE WHEN v_booking_status = 'awaiting_payment' THEN 'BOOKING_PENDING' ELSE 'BOOKING_CONFIRMED' END)::notification_type,
      CASE WHEN v_booking_status = 'awaiting_payment' THEN 'הזמנה נשמרה' ELSE 'הזמנה אושרה' END,
      CASE WHEN v_booking_status = 'awaiting_payment' THEN 'ממתין לאישור תשלום' ELSE 'השיעור שלך אושר בהצלחה' END,
      jsonb_build_object('booking_id', v_booking_id, 'teacher_name', v_teacher.display_name, 'subject', p_subject, 
        'start_at', p_start_at, 'duration', p_duration_minutes, 'status', v_booking_status));

  -- Audit log
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta) VALUES
    (p_student_id, 'booking_created', 'booking', v_booking_id,
      jsonb_build_object('teacher_id', p_teacher_id, 'start_at', p_start_at, 'duration_minutes', p_duration_minutes,
        'total_price', v_total_price, 'credits_applied', p_credits_to_apply, 'amount_to_pay', v_amount_to_pay, 
        'status', v_booking_status, 'payment_method', p_selected_payment_method));

  -- Build and store response
  DECLARE v_response JSONB;
  BEGIN
    v_response := jsonb_build_object(
      'booking_id', v_booking_id, 
      'status', v_booking_status, 
      'start_at', p_start_at, 
      'end_at', v_end_at,
      'teacher_id', p_teacher_id, 
      'total_price', v_total_price, 
      'credits_applied', p_credits_to_apply,
      'amount_charged', CASE WHEN v_booking_status = 'confirmed' THEN v_amount_to_pay ELSE 0 END,
      'amount_to_pay', v_amount_to_pay, 
      'currency', 'ILS', 
      'payment_method_selected', p_selected_payment_method, 
      'hold_expires_at', v_hold_expires_at
    );

    -- Store idempotency record
    INSERT INTO idempotency_requests (idempotency_key, request_hash, booking_id, response_data)
    VALUES (p_idempotency_key, v_request_hash, v_booking_id, v_response);

    -- Send realtime notifications
    PERFORM pg_notify('teacher:' || p_teacher_id::TEXT, 
      jsonb_build_object('type', 'slot_booked', 'booking_id', v_booking_id, 'start_at', p_start_at, 'end_at', v_end_at, 'status', v_booking_status)::TEXT);
    PERFORM pg_notify('search:availability',
      jsonb_build_object('type', 'slot_unavailable', 'teacher_id', p_teacher_id, 'start_at', p_start_at, 'end_at', v_end_at, 'status', v_booking_status)::TEXT);

    RETURN v_response;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE 'Migration 020 completed! create_booking function updated with new student level fields and server-side validation.';
END $$;
