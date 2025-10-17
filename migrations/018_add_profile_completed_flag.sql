-- ============================================
-- Migration 018: Add Profile Completed Flag
-- Adds a flag to track if teacher has completed onboarding
-- ============================================

-- Add profile_completed column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Set profile_completed = TRUE for existing teachers who have:
-- 1. display_name filled
-- 2. hourly_rate set
-- 3. at least one subject assigned
UPDATE profiles
SET profile_completed = TRUE
WHERE role = 'teacher'
  AND display_name IS NOT NULL
  AND display_name != ''
  AND hourly_rate IS NOT NULL
  AND hourly_rate > 0
  AND EXISTS (
    SELECT 1
    FROM teacher_subjects
    WHERE teacher_subjects.teacher_id = profiles.id
  );

-- Set profile_completed = TRUE for all students (they don't need onboarding)
UPDATE profiles
SET profile_completed = TRUE
WHERE role = 'student';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_completed ON profiles(profile_completed)
WHERE profile_completed = FALSE;

-- Add comment
COMMENT ON COLUMN profiles.profile_completed IS
'Indicates if teacher has completed onboarding. Always TRUE for students.';

DO $$
BEGIN
  RAISE NOTICE 'Migration 018 completed - profile_completed flag added';
END $$;
