-- ============================================
-- Migration 022: Update student_credits foreign key
-- Changes student_credits.student_id to reference auth.users directly
-- ============================================

-- Drop the old foreign key constraint
ALTER TABLE IF EXISTS student_credits
DROP CONSTRAINT IF EXISTS student_credits_student_id_fkey;

-- Add new foreign key to auth.users (which both students and teachers reference)
ALTER TABLE student_credits
ADD CONSTRAINT student_credits_student_id_fkey
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE '✅ Updated student_credits foreign key to reference auth.users';
END $$;

