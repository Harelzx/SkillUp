-- ============================================
-- Migration 044: Add Booking Notifications Trigger
-- Automatically notify teachers when students book/cancel/reschedule lessons
-- ============================================

-- ============================================
-- Create Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION notify_teacher_on_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_name TEXT;
  v_student_name TEXT;
  v_subject_name TEXT;
  v_notification_type TEXT;
  v_notification_title TEXT;
  v_notification_subtitle TEXT;
  v_start_time TEXT;
BEGIN
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
  -- Determine notification type and content
  -- ============================================

  IF TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'pending', 'awaiting_payment') THEN
    -- New booking created
    v_notification_type := 'BOOKING_CONFIRMED';
    v_notification_title := 'שיעור חדש נקבע! 📚';
    v_notification_subtitle := v_student_name || ' קבע איתך שיעור ב' || v_subject_name || ' ל-' || v_start_time;

  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Booking cancelled
    v_notification_type := 'BOOKING_CANCELLED';
    v_notification_title := 'שיעור בוטל 🚫';
    v_notification_subtitle := v_student_name || ' ביטל שיעור ב' || v_subject_name || ' שהיה אמור להיות ב-' || v_start_time;

  ELSIF TG_OP = 'UPDATE' AND NEW.start_at != OLD.start_at THEN
    -- Booking rescheduled
    v_notification_type := 'BOOKING_RESCHEDULED';
    v_notification_title := 'שיעור שונה 🔄';
    v_notification_subtitle := v_student_name || ' שינה את מועד השיעור ב' || v_subject_name || ' ל-' || v_start_time;

  ELSE
    -- No notification needed for this change
    RETURN NEW;
  END IF;

  -- ============================================
  -- Create notification for teacher
  -- ============================================

  PERFORM create_notification(
    p_user_id => NEW.teacher_id,
    p_type => v_notification_type,
    p_title => v_notification_title,
    p_subtitle => v_notification_subtitle,
    p_data => jsonb_build_object(
      'booking_id', NEW.id,
      'student_id', NEW.student_id,
      'student_name', v_student_name,
      'subject', v_subject_name,
      'start_at', NEW.start_at,
      'end_at', NEW.end_at,
      'mode', NEW.mode,
      'duration_minutes', NEW.duration_minutes,
      'price', NEW.total_price,
      'status', NEW.status
    )
  );

  RAISE NOTICE 'Notification created: % for teacher % (booking %)',
    v_notification_type, NEW.teacher_id, NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create Trigger
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS booking_notifications_trigger ON bookings;

-- Create new trigger
CREATE TRIGGER booking_notifications_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_on_booking_changes();

-- ============================================
-- Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION notify_teacher_on_booking_changes() TO authenticated;

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 044 completed successfully!';
  RAISE NOTICE '📢 Booking notifications trigger is now active';
  RAISE NOTICE '🔔 Teachers will receive automatic notifications for:';
  RAISE NOTICE '   - New bookings (BOOKING_CONFIRMED)';
  RAISE NOTICE '   - Cancelled bookings (BOOKING_CANCELLED)';
  RAISE NOTICE '   - Rescheduled bookings (BOOKING_RESCHEDULED)';
END $$;
