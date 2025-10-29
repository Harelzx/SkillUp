-- ============================================
-- Migration 023: Change birth_year to birth_date
-- Changes students.birth_year (INTEGER) to birth_date (DATE)
-- ============================================

-- Step 1: Add new birth_date column
ALTER TABLE students
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Step 2: Migrate existing birth_year data to birth_date (as January 1st of that year)
UPDATE students
SET birth_date = make_date(birth_year, 1, 1)
WHERE birth_year IS NOT NULL;

-- Step 3: Drop old birth_year column
ALTER TABLE students
DROP COLUMN IF EXISTS birth_year;

-- Step 4: Add comment
COMMENT ON COLUMN students.birth_date IS
'Full date of birth (YYYY-MM-DD). Required for student onboarding.';

DO $$
BEGIN
  RAISE NOTICE 'Migration 023 completed - birth_year converted to birth_date';
END $$;
