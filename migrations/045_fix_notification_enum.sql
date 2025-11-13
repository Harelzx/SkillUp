-- ============================================
-- Migration 045: Fix Notification Enum - Add BOOKING_RESCHEDULED
-- Adds missing BOOKING_RESCHEDULED value to notification_type enum
-- This enum value is referenced by migration 044 but was never added
-- ============================================

-- ============================================
-- Add Missing Enum Value
-- ============================================

-- Check if enum value already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
    AND e.enumlabel = 'BOOKING_RESCHEDULED'
  ) THEN
    -- Add the missing enum value
    ALTER TYPE notification_type ADD VALUE 'BOOKING_RESCHEDULED';
    RAISE NOTICE '✅ Added BOOKING_RESCHEDULED to notification_type enum';
  ELSE
    RAISE NOTICE 'ℹ️  BOOKING_RESCHEDULED already exists in notification_type enum';
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_enum_exists BOOLEAN;
  v_enum_count INTEGER;
BEGIN
  -- Verify the enum value was added
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
    AND e.enumlabel = 'BOOKING_RESCHEDULED'
  ) INTO v_enum_exists;

  -- Count total enum values
  SELECT COUNT(*)
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  WHERE t.typname = 'notification_type'
  INTO v_enum_count;

  IF v_enum_exists THEN
    RAISE NOTICE '✅ Migration 045 completed successfully!';
    RAISE NOTICE '🔔 BOOKING_RESCHEDULED enum value is now available';
    RAISE NOTICE '📊 Total notification_type enum values: %', v_enum_count;
    RAISE NOTICE '🔗 Migration 044 trigger can now function correctly';
  ELSE
    RAISE EXCEPTION '❌ Failed to add BOOKING_RESCHEDULED enum value';
  END IF;
END $$;
