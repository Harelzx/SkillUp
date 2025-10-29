-- ============================================
-- Migration 022: Add Profile Completed Flag to Students
-- Adds a flag to track if student has completed onboarding
-- ============================================

-- Add profile_completed column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Set profile_completed = TRUE for existing students who have:
-- 1. first_name and last_name filled
-- 2. phone set
-- 3. city set
UPDATE students
SET profile_completed = TRUE
WHERE first_name IS NOT NULL
  AND first_name != ''
  AND last_name IS NOT NULL
  AND last_name != ''
  AND phone IS NOT NULL
  AND phone != ''
  AND city IS NOT NULL
  AND city != '';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_completed ON students(profile_completed)
WHERE profile_completed = FALSE;

-- Add comment
COMMENT ON COLUMN students.profile_completed IS
'Indicates if student has completed onboarding. TRUE for existing users (grandfathered).';

DO $$
BEGIN
  RAISE NOTICE 'Migration 022 completed - profile_completed flag added to students table';
END $$;
