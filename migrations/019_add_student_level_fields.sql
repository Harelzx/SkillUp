-- ============================================
-- Migration 019: Add Student Level Fields
-- ============================================
-- Add student_level_category and student_level_proficiency columns to bookings table
-- These fields replace the old single student_level field with a two-tier taxonomy

-- Add new columns to bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS student_level_category TEXT,
  ADD COLUMN IF NOT EXISTS student_level_proficiency TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN bookings.student_level_category IS 'Category of student: elementary, middle_school, high_school, student, adult, other';
COMMENT ON COLUMN bookings.student_level_proficiency IS 'Proficiency level: beginner, basic, intermediate, advanced, competitive';

-- Note: Both fields are nullable for backwards compatibility with existing bookings
