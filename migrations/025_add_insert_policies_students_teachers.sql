-- ============================================
-- Migration 025: Add INSERT policies for students and teachers tables
-- This fixes the RLS violation error during signup
-- ============================================

-- Add INSERT policy for students
DROP POLICY IF EXISTS "Students can insert own profile" ON students;
CREATE POLICY "Students can insert own profile"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for teachers
DROP POLICY IF EXISTS "Teachers can insert own profile" ON teachers;
CREATE POLICY "Teachers can insert own profile"
  ON teachers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Success notice
DO $$
BEGIN
  RAISE NOTICE '✅ Added INSERT policies for students and teachers tables';
END $$;

