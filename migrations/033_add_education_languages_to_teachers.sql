-- Migration 033: Add education and languages fields to teachers table
--
-- Purpose:
-- - Add education TEXT[] column to teachers table
-- - Add languages TEXT[] column to teachers table
-- - Migrate existing data from profiles table
-- - Update update_teacher_profile RPC function to support these fields

-- ============================================
-- Step 1: Add columns to teachers table
-- ============================================

ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS education TEXT[],
ADD COLUMN IF NOT EXISTS languages TEXT[];

-- ============================================
-- Step 2: Migrate existing data from profiles
-- ============================================

-- Update teachers with education and languages from profiles
UPDATE teachers t
SET
  education = p.education,
  languages = p.languages
FROM profiles p
WHERE t.id = p.id
  AND p.role = 'teacher'
  AND (p.education IS NOT NULL OR p.languages IS NOT NULL);

-- ============================================
-- Step 3: Update update_teacher_profile RPC function
-- ============================================

CREATE OR REPLACE FUNCTION update_teacher_profile(
  p_teacher_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL,
  p_hourly_rate NUMERIC DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_region_id UUID DEFAULT NULL,
  p_city_id UUID DEFAULT NULL,
  p_lesson_modes TEXT[] DEFAULT NULL,
  p_duration_options INTEGER[] DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_education TEXT[] DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_experience_years INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_teachers_table_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if teachers table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) INTO v_teachers_table_exists;

  IF v_teachers_table_exists THEN
    -- Update teachers table
    UPDATE teachers SET
      display_name = COALESCE(p_display_name, display_name),
      bio = COALESCE(p_bio, bio),
      phone_number = COALESCE(p_phone_number, phone_number),
      hourly_rate = COALESCE(p_hourly_rate, hourly_rate),
      location = COALESCE(p_location, location),
      region_id = COALESCE(p_region_id, region_id),
      city_id = COALESCE(p_city_id, city_id),
      lesson_modes = COALESCE(p_lesson_modes, lesson_modes),
      duration_options = COALESCE(p_duration_options, duration_options),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      education = COALESCE(p_education, education),
      languages = COALESCE(p_languages, languages),
      experience_years = COALESCE(p_experience_years, experience_years),
      updated_at = NOW()
    WHERE id = p_teacher_id;

    -- Also update profiles table for consistency
    UPDATE profiles SET
      display_name = COALESCE(p_display_name, display_name),
      bio = COALESCE(p_bio, bio),
      phone_number = COALESCE(p_phone_number, phone_number),
      hourly_rate = COALESCE(p_hourly_rate, hourly_rate),
      location = COALESCE(p_location, location),
      region_id = COALESCE(p_region_id, region_id),
      city_id = COALESCE(p_city_id, city_id),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      education = COALESCE(p_education, education),
      languages = COALESCE(p_languages, languages),
      experience_years = COALESCE(p_experience_years, experience_years),
      updated_at = NOW()
    WHERE id = p_teacher_id;
  ELSE
    -- Fallback: update profiles table only
    UPDATE profiles SET
      display_name = COALESCE(p_display_name, display_name),
      bio = COALESCE(p_bio, bio),
      phone_number = COALESCE(p_phone_number, phone_number),
      hourly_rate = COALESCE(p_hourly_rate, hourly_rate),
      location = COALESCE(p_location, location),
      region_id = COALESCE(p_region_id, region_id),
      city_id = COALESCE(p_city_id, city_id),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      education = COALESCE(p_education, education),
      languages = COALESCE(p_languages, languages),
      experience_years = COALESCE(p_experience_years, experience_years),
      updated_at = NOW()
    WHERE id = p_teacher_id AND role = 'teacher';
  END IF;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'teacher_id', p_teacher_id,
    'updated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_teachers_with_education INTEGER := 0;
  v_teachers_with_languages INTEGER := 0;
BEGIN
  -- Count teachers with education
  SELECT COUNT(*) INTO v_teachers_with_education
  FROM teachers
  WHERE education IS NOT NULL AND array_length(education, 1) > 0;

  -- Count teachers with languages
  SELECT COUNT(*) INTO v_teachers_with_languages
  FROM teachers
  WHERE languages IS NOT NULL AND array_length(languages, 1) > 0;

  RAISE NOTICE '✅ Migration 033 completed successfully';
  RAISE NOTICE '   - Added education and languages columns to teachers table';
  RAISE NOTICE '   - Teachers with education data: %', v_teachers_with_education;
  RAISE NOTICE '   - Teachers with languages data: %', v_teachers_with_languages;
  RAISE NOTICE '   - Updated update_teacher_profile RPC function';
END $$;
