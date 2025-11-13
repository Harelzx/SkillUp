-- ============================================
-- Migration 046: Add Student Booking Notifications
-- Enhance booking notifications to notify BOTH students and teachers
-- ============================================

-- ============================================
-- Enhanced Trigger Function
-- Sends notifications to both parties based on who initiated the change
-- ============================================

CREATE OR REPLACE FUNCTION notify_both_parties_on_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_name TEXT;
  v_student_name TEXT;
  v_subject_name TEXT;
  v_start_time TEXT;
  v_actor_id UUID;
  v_is_teacher_actor BOOLEAN;
  v_is_student_actor BOOLEAN;

  -- Teacher notification variables
  v_teacher_notification_type TEXT;
  v_teacher_title TEXT;
  v_teacher_subtitle TEXT;

  -- Student notification variables
  v_student_notification_type TEXT;
  v_student_title TEXT;
  v_student_subtitle TEXT;
BEGIN
  -- ============================================
  -- Gather basic information
  -- ============================================

  -- Get teacher name
  SELECT display_name INTO v_teacher_name
  FROM teachers WHERE id = NEW.teacher_id;

  -- Get student name
  SELECT first_name || ' ' || last_name INTO v_student_name
  FROM students WHERE id = NEW.student_id;

  -- Get subject name (handle NULL subject_id)
  IF NEW.subject_id IS NOT NULL THEN
    SELECT COALESCE(name_he, name) INTO v_subject_name
    FROM subjects WHERE id = NEW.subject_id;
  ELSE
    v_subject_name := 'שיעור';
  END IF;

  -- Format start time for display
  v_start_time := to_char(NEW.start_at AT TIME ZONE 'Asia/Jerusalem', 'DD/MM/YYYY בשעה HH24:MI');

  -- ============================================
  -- Determine who made the change
  -- ============================================

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

    -- Teacher notification
    v_teacher_notification_type := 'BOOKING_CONFIRMED';
    v_teacher_title := 'שיעור חדש נקבע! 📚';
    v_teacher_subtitle := v_student_name || ' קבע איתך שיעור ב' || v_subject_name || ' ל-' || v_start_time;

    -- Student notification (confirmation)
    v_student_notification_type := 'BOOKING_CONFIRMED';
    v_student_title := 'השיעור נקבע בהצלחה! ✅';
    v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' ב-' || v_start_time;

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
      v_student_title := 'המורה ביטל את השיעור 😔';
      v_student_subtitle := v_teacher_name || ' ביטל את השיעור ב' || v_subject_name || ' שהיה אמור להיות ב-' || v_start_time;
    ELSE
      -- Student cancelled
      v_teacher_notification_type := 'BOOKING_CANCELLED';
      v_teacher_title := 'שיעור בוטל 🚫';
      v_teacher_subtitle := v_student_name || ' ביטל שיעור ב' || v_subject_name || ' שהיה אמור להיות ב-' || v_start_time;

      v_student_notification_type := 'BOOKING_CANCELLED';
      v_student_title := 'ביטלת את השיעור ✅';
      v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' שהיה אמור להיות ב-' || v_start_time;
    END IF;

  ELSIF TG_OP = 'UPDATE' AND NEW.start_at != OLD.start_at THEN
    -- Booking rescheduled

    IF v_is_teacher_actor THEN
      -- Teacher rescheduled
      v_teacher_notification_type := 'BOOKING_RESCHEDULED';
      v_teacher_title := 'שינית את מועד השיעור 🔄';
      v_teacher_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_student_name || ' שונה ל-' || v_start_time;

      v_student_notification_type := 'BOOKING_RESCHEDULED';
      v_student_title := 'המורה שינה את מועד השיעור 📅';
      v_student_subtitle := v_teacher_name || ' שינה את השיעור ב' || v_subject_name || ' ל-' || v_start_time;
    ELSE
      -- Student rescheduled
      v_teacher_notification_type := 'BOOKING_RESCHEDULED';
      v_teacher_title := 'שיעור שונה 🔄';
      v_teacher_subtitle := v_student_name || ' שינה את מועד השיעור ב' || v_subject_name || ' ל-' || v_start_time;

      v_student_notification_type := 'BOOKING_RESCHEDULED';
      v_student_title := 'שינית את מועד השיעור ✅';
      v_student_subtitle := 'שיעור ב' || v_subject_name || ' עם ' || v_teacher_name || ' שונה ל-' || v_start_time;
    END IF;

  ELSE
    -- No notification needed for this change
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
    -- Send notification to student
    -- ============================================

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
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update Trigger
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS booking_notifications_trigger ON bookings;

-- Create new trigger with enhanced function
CREATE TRIGGER booking_notifications_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_both_parties_on_booking_changes();

-- ============================================
-- Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION notify_both_parties_on_booking_changes() TO authenticated;

-- Drop old function (no longer needed)
DROP FUNCTION IF EXISTS notify_teacher_on_booking_changes();

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 046 completed successfully!';
  RAISE NOTICE '📢 Enhanced booking notifications trigger is now active';
  RAISE NOTICE '🔔 Both teachers AND students will receive notifications for:';
  RAISE NOTICE '   - New bookings (BOOKING_CONFIRMED)';
  RAISE NOTICE '   - Booking confirmations (teacher confirms pending booking)';
  RAISE NOTICE '   - Cancelled bookings (BOOKING_CANCELLED)';
  RAISE NOTICE '   - Rescheduled bookings (BOOKING_RESCHEDULED)';
  RAISE NOTICE '👥 Notifications are personalized based on who initiated the change';
  RAISE NOTICE '🔐 Uses auth.uid() to determine actor (teacher vs student)';
END $$;
