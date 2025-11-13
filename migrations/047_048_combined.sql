-- ============================================
-- Migration 047: Remove Duplicate Teacher Notification
-- ============================================
-- The create_booking RPC function creates a notification for teachers,
-- but the trigger (046) also creates a more detailed notification.
-- This migration removes the duplicate notification from the RPC function,
-- keeping only the trigger-based notification which is more informative.
-- ============================================

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
  v_teacher_name TEXT;
  v_student_name TEXT;
  v_students_table_exists BOOLEAN;
  v_teachers_table_exists BOOLEAN;
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

  -- Check if teachers table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) INTO v_teachers_table_exists;

  -- Check if students table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  ) INTO v_students_table_exists;

  -- Get teacher profile (try teachers table first, then profiles)
  IF v_teachers_table_exists THEN
    EXECUTE 'SELECT * FROM teachers WHERE id = $1 AND is_active = TRUE'
      INTO v_teacher USING p_teacher_id;

    IF FOUND THEN
      v_teacher_name := v_teacher.display_name;
    END IF;
  END IF;

  -- Fallback to profiles table if not found
  IF NOT FOUND OR NOT v_teachers_table_exists THEN
    SELECT * INTO v_teacher FROM profiles WHERE id = p_teacher_id AND is_active = TRUE AND role = 'teacher';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Teacher not found or inactive' USING ERRCODE = '22000';
    END IF;
    v_teacher_name := v_teacher.display_name;
  END IF;

  -- Validate duration_minutes against teacher's duration_options (if field exists)
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

  -- Validate mode against teacher's lesson_modes (if field exists)
  IF v_teacher.lesson_modes IS NOT NULL AND array_length(v_teacher.lesson_modes, 1) > 0 THEN
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

  -- Get student profile (try students table first, then profiles)
  IF v_students_table_exists THEN
    EXECUTE 'SELECT * FROM students WHERE id = $1 AND is_active = TRUE'
      INTO v_student USING p_student_id;

    IF FOUND THEN
      v_student_name := TRIM(v_student.first_name || ' ' || COALESCE(v_student.last_name, ''));
    END IF;
  END IF;

  -- Fallback to profiles table if not found
  IF NOT FOUND OR NOT v_students_table_exists THEN
    SELECT * INTO v_student FROM profiles WHERE id = p_student_id AND is_active = TRUE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Student not found or inactive' USING ERRCODE = '22000';
    END IF;
    v_student_name := v_student.display_name;
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
  v_booking_id := gen_random_uuid();

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

  -- Insert booking
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

  -- REMOVED: All notifications from RPC function
  -- Teacher notification is handled by trigger 046 (more detailed)
  -- Student notification is not needed - student sees success message on screen

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 047 completed - Removed duplicate teacher notification from create_booking RPC. Teacher notifications are now handled only by trigger 046.';
END $$;
-- ============================================
-- Migration 048: Remove Student Notification on Booking Insert
-- ============================================
-- Students don't need a toast notification when they create a booking
-- because they already see the success message on screen.
-- This migration removes the student notification for INSERT operations,
-- but keeps notifications for other events (cancellation, reschedule, etc.)
-- ============================================

CREATE OR REPLACE FUNCTION notify_both_parties_on_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_name TEXT;
  v_student_name TEXT;
  v_subject_name TEXT;
  v_teacher_notification_type TEXT;
  v_student_notification_type TEXT;
  v_teacher_title TEXT;
  v_student_title TEXT;
  v_teacher_subtitle TEXT;
  v_student_subtitle TEXT;
  v_start_time TEXT;
  v_actor_id UUID;
  v_is_teacher_actor BOOLEAN;
  v_is_student_actor BOOLEAN;
BEGIN
  -- Get teacher name
  SELECT display_name INTO v_teacher_name
  FROM teachers WHERE id = NEW.teacher_id;

  -- Get student name
  SELECT first_name || ' ' || last_name INTO v_student_name
  FROM students WHERE id = NEW.student_id;

  -- Get subject name (handle NULL subject_id)
  IF NEW.subject_id IS NOT NULL THEN
    SELECT COALESCE(name_he, name, 'שיעור') INTO v_subject_name
    FROM subjects WHERE id = NEW.subject_id;
  ELSE
    v_subject_name := 'שיעור';
  END IF;

  -- Format start time for display
  v_start_time := to_char(NEW.start_at AT TIME ZONE 'Asia/Jerusalem', 'DD/MM/YYYY בשעה HH24:MI');

  -- Get current authenticated user
  v_actor_id := auth.uid();

  -- Determine if actor is teacher or student
  v_is_teacher_actor := (v_actor_id = NEW.teacher_id);
  v_is_student_actor := (v_actor_id = NEW.student_id);

  -- If no authenticated user (system/admin action), default to student as actor
  IF v_actor_id IS NULL THEN
    v_is_student_actor := TRUE;
    v_is_teacher_actor := FALSE;
  END IF;

  -- ============================================
  -- Determine notification type and content
  -- ============================================

  IF TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'pending', 'awaiting_payment') THEN
    -- New booking created (usually by student)
    -- Teacher notification only - student sees success message on screen

    -- Teacher notification
    v_teacher_notification_type := 'BOOKING_CONFIRMED';
    v_teacher_title := 'שיעור חדש נקבע! 📚';
    v_teacher_subtitle := v_student_name || ' קבע איתך שיעור ב' || v_subject_name || ' ל-' || v_start_time;

    -- REMOVED: Student notification - student sees success message on screen
    -- No notification for student on INSERT

  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Booking confirmed by teacher

    v_teacher_notification_type := 'BOOKING_CONFIRMED';
    v_teacher_title := 'אישרת את השיעור ✅';
    v_teacher_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_student_name || ' ב-' || v_start_time;

    v_student_notification_type := 'BOOKING_CONFIRMED';
    v_student_title := 'המורה אישר את השיעור! 🎉';
    v_student_subtitle := v_teacher_name || ' אישר את השיעור ב' || v_subject_name || ' ב-' || v_start_time;

  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Booking cancelled

    IF v_is_teacher_actor THEN
      -- Teacher cancelled
      v_teacher_notification_type := 'BOOKING_CANCELLED';
      v_teacher_title := 'ביטלת את השיעור 🚫';
      v_teacher_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_student_name || ' שהיה אמור להיות ב-' || v_start_time;

      v_student_notification_type := 'BOOKING_CANCELLED';
      v_student_title := 'המורה ביטל את השיעור 🚫';
      v_student_subtitle := v_teacher_name || ' ביטל את השיעור ב' || v_subject_name || ' שהיה אמור להיות ב-' || v_start_time;

    ELSIF v_is_student_actor THEN
      -- Student cancelled
      v_teacher_notification_type := 'BOOKING_CANCELLED';
      v_teacher_title := 'התלמיד ביטל את השיעור 🚫';
      v_teacher_subtitle := v_student_name || ' ביטל את השיעור ב' || v_subject_name || ' שהיה אמור להיות ב-' || v_start_time;

      v_student_notification_type := 'BOOKING_CANCELLED';
      v_student_title := 'ביטלת את השיעור 🚫';
      v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' שהיה אמור להיות ב-' || v_start_time;

    ELSE
      -- System/admin cancelled
      v_teacher_notification_type := 'BOOKING_CANCELLED';
      v_teacher_title := 'השיעור בוטל 🚫';
      v_teacher_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_student_name || ' שהיה אמור להיות ב-' || v_start_time;

      v_student_notification_type := 'BOOKING_CANCELLED';
      v_student_title := 'השיעור בוטל 🚫';
      v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' שהיה אמור להיות ב-' || v_start_time;
    END IF;

  ELSIF TG_OP = 'UPDATE' AND NEW.start_at != OLD.start_at THEN
    -- Booking rescheduled

    IF v_is_teacher_actor THEN
      -- Teacher rescheduled
      v_teacher_notification_type := 'BOOKING_RESCHEDULED';
      v_teacher_title := 'דחית את השיעור 📅';
      v_teacher_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_student_name || ' נדחה ל-' || v_start_time;

      v_student_notification_type := 'BOOKING_RESCHEDULED';
      v_student_title := 'המורה דחה את השיעור 📅';
      v_student_subtitle := v_teacher_name || ' דחה את השיעור ב' || v_subject_name || ' ל-' || v_start_time;

    ELSIF v_is_student_actor THEN
      -- Student rescheduled
      v_teacher_notification_type := 'BOOKING_RESCHEDULED';
      v_teacher_title := 'התלמיד דחה את השיעור 📅';
      v_teacher_subtitle := v_student_name || ' דחה את השיעור ב' || v_subject_name || ' ל-' || v_start_time;

      v_student_notification_type := 'BOOKING_RESCHEDULED';
      v_student_title := 'דחית את השיעור 📅';
      v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' נדחה ל-' || v_start_time;

    ELSE
      -- System/admin rescheduled
      v_teacher_notification_type := 'BOOKING_RESCHEDULED';
      v_teacher_title := 'השיעור נדחה 📅';
      v_teacher_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_student_name || ' נדחה ל-' || v_start_time;

      v_student_notification_type := 'BOOKING_RESCHEDULED';
      v_student_title := 'השיעור נדחה 📅';
      v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' נדחה ל-' || v_start_time;
    END IF;

  ELSE
    -- No notification needed for other updates
    RETURN NEW;
  END IF;

  -- ============================================
  -- Create notification payload (shared data)
  -- ============================================

  DECLARE
    v_notification_data JSONB;
  BEGIN
    v_notification_data := jsonb_build_object(
      'booking_id', NEW.id,
      'teacher_id', NEW.teacher_id,
      'teacher_name', v_teacher_name,
      'student_id', NEW.student_id,
      'student_name', v_student_name,
      'subject', v_subject_name,
      'start_at', NEW.start_at,
      'end_at', NEW.end_at,
      'mode', NEW.mode,
      'duration_minutes', NEW.duration_minutes,
      'price', NEW.total_price,
      'status', NEW.status,
      'actor_id', v_actor_id,
      'is_teacher_actor', v_is_teacher_actor
    );

    -- ============================================
    -- Send notification to teacher
    -- ============================================

    BEGIN
      PERFORM create_notification(
        p_user_id => NEW.teacher_id,
        p_type => v_teacher_notification_type,
        p_title => v_teacher_title,
        p_subtitle => v_teacher_subtitle,
        p_data => v_notification_data
      );

      RAISE NOTICE 'Teacher notification created: % for teacher % (booking %)',
        v_teacher_notification_type, NEW.teacher_id, NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create teacher notification: %', SQLERRM;
    END;

    -- ============================================
    -- Send notification to student (ONLY if not INSERT)
    -- REMOVED: Student notification on INSERT - student sees success message on screen
    -- ============================================

    IF v_student_notification_type IS NOT NULL AND TG_OP != 'INSERT' THEN
      BEGIN
        PERFORM create_notification(
          p_user_id => NEW.student_id,
          p_type => v_student_notification_type,
          p_title => v_student_title,
          p_subtitle => v_student_subtitle,
          p_data => v_notification_data
        );

        RAISE NOTICE 'Student notification created: % for student % (booking %)',
          v_student_notification_type, NEW.student_id, NEW.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create student notification: %', SQLERRM;
      END;
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 048 completed - Removed student notification on booking INSERT. Students will not receive toast notifications when creating bookings (they see success message on screen).';
  RAISE NOTICE '📢 Students will still receive notifications for: cancellations, reschedules, and teacher confirmations.';
END $$;

