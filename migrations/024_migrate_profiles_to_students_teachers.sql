-- ============================================
-- Migration 024: Migrate existing profiles to students/teachers tables
-- This will copy all existing users from profiles to the new structure
-- ============================================

-- Migrate students from profiles to students table
INSERT INTO students (id, first_name, last_name, email, phone, bio, avatar_url, is_active, created_at, updated_at)
SELECT 
  id,
  COALESCE(SPLIT_PART(display_name, ' ', 1), 'Student') as first_name,
  COALESCE(SUBSTRING(display_name FROM LENGTH(SPLIT_PART(display_name, ' ', 1)) + 2), '') as last_name,
  email,
  phone_number as phone,
  bio,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM profiles
WHERE role = 'student'
ON CONFLICT (id) DO NOTHING;

-- Migrate teachers from profiles to teachers table
INSERT INTO teachers (
  id, display_name, email, phone, bio, avatar_url, video_url, location,
  hourly_rate, experience_years, total_students, is_verified, is_active,
  is_subscribed, subscription_tier, lesson_modes, duration_options, regions, timezone, teaching_style, profile_completed,
  created_at, updated_at
)
SELECT 
  id, 
  display_name, 
  email, 
  phone_number as phone, 
  bio, 
  avatar_url, 
  video_url, 
  location,
  hourly_rate, 
  experience_years, 
  total_students, 
  is_verified, 
  is_active,
  false as is_subscribed,
  null as subscription_tier,
  COALESCE(lesson_modes, ARRAY['online', 'at_teacher', 'at_student']) as lesson_modes,
  COALESCE(duration_options, ARRAY[45, 60, 90]) as duration_options,
  regions, 
  timezone, 
  teaching_style, 
  COALESCE(profile_completed, true) as profile_completed,
  created_at, 
  updated_at
FROM profiles
WHERE role = 'teacher'
ON CONFLICT (id) DO NOTHING;

-- Verify migration
DO $$
DECLARE
  students_count INTEGER;
  teachers_count INTEGER;
  profiles_students INTEGER;
  profiles_teachers INTEGER;
BEGIN
  SELECT COUNT(*) INTO students_count FROM students;
  SELECT COUNT(*) INTO teachers_count FROM teachers;
  SELECT COUNT(*) INTO profiles_students FROM profiles WHERE role = 'student';
  SELECT COUNT(*) INTO profiles_teachers FROM profiles WHERE role = 'teacher';
  
  RAISE NOTICE '📊 Migration Results:';
  RAISE NOTICE '   Profiles with role=student: %', profiles_students;
  RAISE NOTICE '   Students after migration: %', students_count;
  RAISE NOTICE '   Profiles with role=teacher: %', profiles_teachers;
  RAISE NOTICE '   Teachers after migration: %', teachers_count;
  
  IF students_count >= profiles_students AND teachers_count >= profiles_teachers THEN
    RAISE NOTICE '✅ Migration successful!';
  ELSE
    RAISE WARNING '⚠️ Some records may not have migrated';
  END IF;
END $$;

