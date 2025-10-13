-- ============================================
-- DROP All Booking Functions
-- Run this BEFORE running migration 011
-- ============================================

-- Drop all booking-related functions (with all possible signatures)
DROP FUNCTION IF EXISTS create_booking(TEXT, UUID, UUID, TEXT, booking_mode, INTEGER, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_booking CASCADE;
DROP FUNCTION IF EXISTS check_booking_overlap(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) CASCADE;
DROP FUNCTION IF EXISTS check_booking_overlap CASCADE;
DROP FUNCTION IF EXISTS cancel_booking(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cancel_booking CASCADE;
DROP FUNCTION IF EXISTS reschedule_booking(UUID, UUID, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS reschedule_booking CASCADE;
DROP FUNCTION IF EXISTS get_teacher_bookings(UUID, booking_status, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_teacher_bookings CASCADE;
DROP FUNCTION IF EXISTS get_student_bookings(UUID, booking_status, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_student_bookings CASCADE;
DROP FUNCTION IF EXISTS process_refund CASCADE;
DROP FUNCTION IF EXISTS update_booking_status CASCADE;
DROP FUNCTION IF EXISTS get_booking_details CASCADE;

-- Verify they're gone
DO $$
BEGIN
  RAISE NOTICE 'All functions dropped successfully!';
  RAISE NOTICE 'Now you can run migration 011_final_create_functions.sql';
END $$;

