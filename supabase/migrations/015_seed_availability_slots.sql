-- ============================================
-- Migration 015: Seed Availability Slots
-- Create availability slots for test teachers (30 days ahead)
-- ============================================

-- First, add UNIQUE constraint if it doesn't exist (for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'availability_slots_teacher_start_unique'
  ) THEN
    ALTER TABLE availability_slots
    ADD CONSTRAINT availability_slots_teacher_start_unique
    UNIQUE (teacher_id, start_at);

    RAISE NOTICE 'Added UNIQUE constraint on (teacher_id, start_at)';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists';
  END IF;
END $$;

-- Helper function to check if teacher exists
DO $$
DECLARE
  teacher_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO teacher_count
  FROM profiles
  WHERE role = 'teacher'
  AND id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004'
  );

  IF teacher_count = 0 THEN
    RAISE NOTICE 'Warning: No test teachers found. Run seed.sql first.';
  ELSE
    RAISE NOTICE 'Found % test teachers. Creating availability slots...', teacher_count;
  END IF;
END $$;

-- ============================================
-- Generate Slots for Teacher 1: Sarah Cohen
-- Mathematics, English (morning person: 08:00-16:00)
-- ============================================

INSERT INTO availability_slots (teacher_id, start_at, end_at, is_booked, booking_id)
SELECT
  '10000000-0000-0000-0000-000000000001'::UUID AS teacher_id,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + (hour.h || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS start_at,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + ((hour.h + 1) || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS end_at,
  FALSE AS is_booked,
  NULL AS booking_id
FROM
  generate_series(0, 29) AS day(n),
  generate_series(8, 15) AS hour(h)  -- 08:00-16:00 (8 slots/day)
WHERE
  -- Only Monday to Friday (DOW: 1=Monday, 5=Friday)
  EXTRACT(DOW FROM (CURRENT_DATE + (day.n || ' days')::INTERVAL)) BETWEEN 1 AND 5
ON CONFLICT (teacher_id, start_at) DO NOTHING;

-- ============================================
-- Generate Slots for Teacher 2: David Levy
-- Physics, Chemistry (standard hours: 09:00-17:00)
-- ============================================

INSERT INTO availability_slots (teacher_id, start_at, end_at, is_booked, booking_id)
SELECT
  '10000000-0000-0000-0000-000000000002'::UUID AS teacher_id,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + (hour.h || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS start_at,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + ((hour.h + 1) || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS end_at,
  FALSE AS is_booked,
  NULL AS booking_id
FROM
  generate_series(0, 29) AS day(n),
  generate_series(9, 16) AS hour(h)  -- 09:00-17:00 (8 slots/day)
WHERE
  EXTRACT(DOW FROM (CURRENT_DATE + (day.n || ' days')::INTERVAL)) BETWEEN 1 AND 5
ON CONFLICT (teacher_id, start_at) DO NOTHING;

-- ============================================
-- Generate Slots for Teacher 3: Rachel Ben-Ami
-- Biology, Computer Science (late hours: 10:00-18:00)
-- ============================================

INSERT INTO availability_slots (teacher_id, start_at, end_at, is_booked, booking_id)
SELECT
  '10000000-0000-0000-0000-000000000003'::UUID AS teacher_id,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + (hour.h || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS start_at,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + ((hour.h + 1) || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS end_at,
  FALSE AS is_booked,
  NULL AS booking_id
FROM
  generate_series(0, 29) AS day(n),
  generate_series(10, 17) AS hour(h)  -- 10:00-18:00 (8 slots/day)
WHERE
  EXTRACT(DOW FROM (CURRENT_DATE + (day.n || ' days')::INTERVAL)) BETWEEN 1 AND 5
ON CONFLICT (teacher_id, start_at) DO NOTHING;

-- ============================================
-- Generate Slots for Teacher 4: Michael Shalom
-- Hebrew, History (includes Sunday: 09:00-17:00)
-- ============================================

INSERT INTO availability_slots (teacher_id, start_at, end_at, is_booked, booking_id)
SELECT
  '10000000-0000-0000-0000-000000000004'::UUID AS teacher_id,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + (hour.h || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS start_at,
  (CURRENT_DATE + (day.n || ' days')::INTERVAL + ((hour.h + 1) || ' hours')::INTERVAL) AT TIME ZONE 'Asia/Jerusalem' AS end_at,
  FALSE AS is_booked,
  NULL AS booking_id
FROM
  generate_series(0, 29) AS day(n),
  generate_series(9, 16) AS hour(h)  -- 09:00-17:00 (8 slots/day)
WHERE
  -- Sunday to Thursday (DOW: 0=Sunday, 4=Thursday)
  EXTRACT(DOW FROM (CURRENT_DATE + (day.n || ' days')::INTERVAL)) BETWEEN 0 AND 4
ON CONFLICT (teacher_id, start_at) DO NOTHING;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  total_slots INTEGER;
  teacher1_slots INTEGER;
  teacher2_slots INTEGER;
  teacher3_slots INTEGER;
  teacher4_slots INTEGER;
  date_range TEXT;
BEGIN
  -- Count total slots
  SELECT COUNT(*) INTO total_slots FROM availability_slots;

  -- Count per teacher
  SELECT COUNT(*) INTO teacher1_slots
  FROM availability_slots
  WHERE teacher_id = '10000000-0000-0000-0000-000000000001';

  SELECT COUNT(*) INTO teacher2_slots
  FROM availability_slots
  WHERE teacher_id = '10000000-0000-0000-0000-000000000002';

  SELECT COUNT(*) INTO teacher3_slots
  FROM availability_slots
  WHERE teacher_id = '10000000-0000-0000-0000-000000000003';

  SELECT COUNT(*) INTO teacher4_slots
  FROM availability_slots
  WHERE teacher_id = '10000000-0000-0000-0000-000000000004';

  -- Get date range
  SELECT
    MIN(start_at)::DATE || ' to ' || MAX(start_at)::DATE
  INTO date_range
  FROM availability_slots;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 015 completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  Total slots created: %', total_slots;
  RAISE NOTICE '  Date range: %', date_range;
  RAISE NOTICE '';
  RAISE NOTICE '👤 Per teacher:';
  RAISE NOTICE '  Sarah Cohen: % slots', teacher1_slots;
  RAISE NOTICE '  David Levy: % slots', teacher2_slots;
  RAISE NOTICE '  Rachel Ben-Ami: % slots', teacher3_slots;
  RAISE NOTICE '  Michael Shalom: % slots', teacher4_slots;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '  1. Refresh your app';
  RAISE NOTICE '  2. Try booking a lesson as a student';
  RAISE NOTICE '  3. You should now see availability for 4 teachers';
  RAISE NOTICE '';
END $$;
