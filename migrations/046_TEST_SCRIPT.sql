-- ============================================
-- Migration 046: Test Script
-- Quick verification and testing queries
-- ============================================

-- ============================================
-- PART 1: Verify Migration Was Applied
-- ============================================

-- Check if new function exists
SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'notify_both_parties_on_booking_changes';

-- Expected: 1 row with function_name = 'notify_both_parties_on_booking_changes'

-- Check if old function was dropped
SELECT
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'notify_teacher_on_booking_changes';

-- Expected: 0 rows (function should be dropped)

-- Check trigger configuration
SELECT
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'bookings'
  AND t.tgname = 'booking_notifications_trigger';

-- Expected: 1 row showing trigger is ENABLED and uses notify_both_parties_on_booking_changes

-- ============================================
-- PART 2: Prepare Test Data
-- ============================================

-- Get a test teacher and student
DO $$
DECLARE
  v_teacher_id UUID;
  v_student_id UUID;
  v_subject_id UUID;
BEGIN
  -- Get first available teacher
  SELECT id INTO v_teacher_id FROM teachers WHERE is_active = true LIMIT 1;

  -- Get first available student
  SELECT id INTO v_student_id FROM students WHERE is_active = true LIMIT 1;

  -- Get a subject (math)
  SELECT id INTO v_subject_id FROM subjects WHERE name_he LIKE '%מתמטיקה%' OR name LIKE '%Math%' LIMIT 1;

  -- If no subject found, get any subject
  IF v_subject_id IS NULL THEN
    SELECT id INTO v_subject_id FROM subjects LIMIT 1;
  END IF;

  RAISE NOTICE 'Test Data IDs:';
  RAISE NOTICE '  Teacher ID: %', v_teacher_id;
  RAISE NOTICE '  Student ID: %', v_student_id;
  RAISE NOTICE '  Subject ID: %', v_subject_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Use these IDs in the tests below!';
END $$;

-- ============================================
-- PART 3: Test Scenario 1 - New Booking
-- ============================================

-- IMPORTANT: Replace these UUIDs with actual IDs from your database
-- Run the query above to get valid IDs!

-- Create a test booking
INSERT INTO bookings (
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  duration_minutes,
  total_price,
  mode,
  timezone
) VALUES (
  'REPLACE_WITH_TEACHER_ID'::UUID,  -- Replace with actual teacher ID
  'REPLACE_WITH_STUDENT_ID'::UUID,  -- Replace with actual student ID
  'REPLACE_WITH_SUBJECT_ID'::UUID,  -- Replace with actual subject ID
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days' + INTERVAL '60 minutes',
  'pending',
  60,
  150.00,
  'online',
  'Asia/Jerusalem'
) RETURNING id, teacher_id, student_id, start_at;

-- View the notifications created
-- Run this immediately after the INSERT above
SELECT
  n.id,
  n.user_id,
  CASE
    WHEN EXISTS(SELECT 1 FROM teachers WHERE id = n.user_id) THEN 'TEACHER'
    WHEN EXISTS(SELECT 1 FROM students WHERE id = n.user_id) THEN 'STUDENT'
    ELSE 'UNKNOWN'
  END as recipient_type,
  n.type,
  n.title,
  n.subtitle,
  n.is_read,
  n.created_at,
  (n.data->>'actor_id')::UUID as actor_id,
  (n.data->>'is_teacher_actor')::BOOLEAN as is_teacher_actor
FROM notifications n
WHERE n.created_at > NOW() - INTERVAL '1 minute'
ORDER BY n.created_at DESC;

-- Expected: 2 notifications
-- 1. For teacher: "שיעור חדש נקבע! 📚"
-- 2. For student: "השיעור נקבע בהצלחה! ✅"

-- ============================================
-- PART 4: Test Scenario 2 - Cancellation
-- ============================================

-- Cancel the test booking
UPDATE bookings
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  cancellation_reason = 'Test cancellation - Migration 046'
WHERE id = 'REPLACE_WITH_BOOKING_ID'::UUID  -- Use the ID from the INSERT above
  AND status != 'cancelled'
RETURNING id, status, cancelled_at;

-- View cancellation notifications
SELECT
  n.id,
  n.user_id,
  CASE
    WHEN EXISTS(SELECT 1 FROM teachers WHERE id = n.user_id) THEN 'TEACHER'
    WHEN EXISTS(SELECT 1 FROM students WHERE id = n.user_id) THEN 'STUDENT'
    ELSE 'UNKNOWN'
  END as recipient_type,
  n.type,
  n.title,
  n.subtitle,
  (n.data->>'actor_id')::UUID as actor_id,
  n.created_at
FROM notifications n
WHERE n.created_at > NOW() - INTERVAL '1 minute'
  AND n.type = 'BOOKING_CANCELLED'
ORDER BY n.created_at DESC;

-- Expected: 2 notifications about cancellation

-- ============================================
-- PART 5: Comprehensive Verification
-- ============================================

-- Count all notifications in last 24 hours
SELECT
  n.type,
  COUNT(*) as total_notifications,
  COUNT(DISTINCT n.user_id) as unique_recipients,
  COUNT(CASE WHEN n.is_read THEN 1 END) as read_count,
  COUNT(CASE WHEN NOT n.is_read THEN 1 END) as unread_count
FROM notifications n
WHERE n.created_at > NOW() - INTERVAL '24 hours'
GROUP BY n.type
ORDER BY total_notifications DESC;

-- View recent booking-related notifications with details
SELECT
  n.id,
  n.user_id,
  u.email,
  CASE
    WHEN EXISTS(SELECT 1 FROM teachers WHERE id = n.user_id) THEN 'TEACHER'
    WHEN EXISTS(SELECT 1 FROM students WHERE id = n.user_id) THEN 'STUDENT'
    ELSE 'UNKNOWN'
  END as user_type,
  n.type,
  n.title,
  LEFT(n.subtitle, 50) || '...' as subtitle_preview,
  n.is_read,
  n.data->>'booking_id' as booking_id,
  n.data->>'subject' as subject,
  n.data->>'actor_id' as actor_id,
  n.created_at
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE n.type IN ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED')
  AND n.created_at > NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC
LIMIT 20;

-- Check for any errors in recent bookings
SELECT
  b.id,
  b.status,
  b.created_at,
  b.updated_at,
  COUNT(n.id) as notification_count
FROM bookings b
LEFT JOIN notifications n ON n.data->>'booking_id' = b.id::TEXT
WHERE b.created_at > NOW() - INTERVAL '24 hours'
GROUP BY b.id, b.status, b.created_at, b.updated_at
ORDER BY b.created_at DESC
LIMIT 10;

-- Expected: Each recent booking should have 2+ notifications (one for teacher, one for student)

-- ============================================
-- PART 6: Performance Check
-- ============================================

-- Check function execution time (requires pg_stat_statements extension)
SELECT
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%notify_both_parties_on_booking_changes%'
ORDER BY calls DESC
LIMIT 5;

-- ============================================
-- PART 7: Cleanup (OPTIONAL)
-- ============================================

-- If you want to clean up test notifications:
/*
DELETE FROM notifications
WHERE created_at > NOW() - INTERVAL '10 minutes'
  AND (
    title LIKE '%Test%'
    OR subtitle LIKE '%Test%'
    OR data->>'cancellation_reason' LIKE '%Test%'
  );
*/

-- If you want to delete the test booking:
/*
DELETE FROM bookings
WHERE id = 'REPLACE_WITH_BOOKING_ID'::UUID;
*/

-- ============================================
-- END OF TEST SCRIPT
-- ============================================

-- Summary of what to look for:
-- ✅ Function 'notify_both_parties_on_booking_changes' exists
-- ✅ Old function 'notify_teacher_on_booking_changes' is dropped
-- ✅ Trigger 'booking_notifications_trigger' uses new function
-- ✅ New bookings create 2 notifications (teacher + student)
-- ✅ Cancellations create 2 notifications (teacher + student)
-- ✅ Each notification has correct Hebrew text and emoji
-- ✅ Notification data includes actor_id and is_teacher_actor
-- ✅ No errors in database logs
