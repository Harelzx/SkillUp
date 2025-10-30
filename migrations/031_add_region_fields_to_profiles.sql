-- ============================================
-- Migration 031: Add Region/City Fields to Teachers & Students
-- ============================================
-- Purpose: Update teachers and students tables to use new regions/cities structure
-- Maintains backward compatibility with existing 'location' field

-- ============================================
-- Update teachers table
-- ============================================

-- Add region_id and city_id to teachers (if table exists)
DO $$
BEGIN
  -- Check if teachers table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) THEN
    -- Add region_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'teachers' AND column_name = 'region_id'
    ) THEN
      ALTER TABLE teachers ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_teachers_region_id ON teachers(region_id);
      RAISE NOTICE '✅ Added region_id to teachers table';
    END IF;

    -- Add city_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'teachers' AND column_name = 'city_id'
    ) THEN
      ALTER TABLE teachers ADD COLUMN city_id UUID REFERENCES cities(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_teachers_city_id ON teachers(city_id);
      RAISE NOTICE '✅ Added city_id to teachers table';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  teachers table does not exist yet, skipping';
  END IF;
END $$;

-- ============================================
-- Update students table
-- ============================================

-- Add region_id and city_id to students (if table exists)
DO $$
BEGIN
  -- Check if students table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  ) THEN
    -- Add region_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'students' AND column_name = 'region_id'
    ) THEN
      ALTER TABLE students ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_students_region_id ON students(region_id);
      RAISE NOTICE '✅ Added region_id to students table';
    END IF;

    -- Add city_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'students' AND column_name = 'city_id'
    ) THEN
      ALTER TABLE students ADD COLUMN city_id UUID REFERENCES cities(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_students_city_id ON students(city_id);
      RAISE NOTICE '✅ Added city_id to students table';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  students table does not exist yet, skipping';
  END IF;
END $$;

-- ============================================
-- Add region_id and city_id to profiles table (fallback)
-- ============================================

-- Add to profiles for backward compatibility
DO $$
BEGIN
  -- Add region_id column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'region_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_region_id ON profiles(region_id);
    RAISE NOTICE '✅ Added region_id to profiles table';
  END IF;

  -- Add city_id column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city_id UUID REFERENCES cities(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);
    RAISE NOTICE '✅ Added city_id to profiles table';
  END IF;
END $$;

-- ============================================
-- Migrate existing location data
-- ============================================

-- Attempt to map existing location strings to cities/regions
DO $$
DECLARE
  v_profile RECORD;
  v_city RECORD;
BEGIN
  -- Check if teachers table exists and has location field
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teachers'
  ) AND EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'teachers' AND column_name = 'location'
  ) THEN
    -- Migrate teachers.location to city_id and region_id
    FOR v_profile IN
      SELECT id, location
      FROM teachers
      WHERE location IS NOT NULL AND location != ''
        AND city_id IS NULL
    LOOP
      -- Try to find matching city (case-insensitive, partial match)
      SELECT c.*, r.id as region_id
      INTO v_city
      FROM cities c
      JOIN regions r ON r.id = c.region_id
      WHERE v_profile.location ILIKE '%' || c.name_he || '%'
         OR v_profile.location ILIKE '%' || c.name_en || '%'
      LIMIT 1;

      IF FOUND THEN
        UPDATE teachers
        SET city_id = v_city.id, region_id = v_city.region_id
        WHERE id = v_profile.id;

        RAISE NOTICE 'Mapped teacher location "%" to city "%"', v_profile.location, v_city.name_he;
      END IF;
    END LOOP;
    RAISE NOTICE '✅ Migrated existing teachers.location data';
  END IF;

  -- Check if students table exists and has city field
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  ) AND EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'city'
  ) THEN
    -- Migrate students.city to city_id and region_id
    FOR v_profile IN
      SELECT id, city
      FROM students
      WHERE city IS NOT NULL AND city != ''
        AND city_id IS NULL
    LOOP
      -- Try to find matching city
      SELECT c.*, r.id as region_id
      INTO v_city
      FROM cities c
      JOIN regions r ON r.id = c.region_id
      WHERE v_profile.city ILIKE '%' || c.name_he || '%'
         OR v_profile.city ILIKE '%' || c.name_en || '%'
      LIMIT 1;

      IF FOUND THEN
        UPDATE students
        SET city_id = v_city.id, region_id = v_city.region_id
        WHERE id = v_profile.id;

        RAISE NOTICE 'Mapped student city "%" to city "%"', v_profile.city, v_city.name_he;
      END IF;
    END LOOP;
    RAISE NOTICE '✅ Migrated existing students.city data';
  END IF;

  -- Migrate profiles.location to city_id and region_id
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    FOR v_profile IN
      SELECT id, location, role
      FROM profiles
      WHERE location IS NOT NULL AND location != ''
        AND city_id IS NULL
    LOOP
      -- Try to find matching city
      SELECT c.*, r.id as region_id
      INTO v_city
      FROM cities c
      JOIN regions r ON r.id = c.region_id
      WHERE v_profile.location ILIKE '%' || c.name_he || '%'
         OR v_profile.location ILIKE '%' || c.name_en || '%'
      LIMIT 1;

      IF FOUND THEN
        UPDATE profiles
        SET city_id = v_city.id, region_id = v_city.region_id
        WHERE id = v_profile.id;

        RAISE NOTICE 'Mapped profile (%) location "%" to city "%"',
          v_profile.role, v_profile.location, v_city.name_he;
      END IF;
    END LOOP;
    RAISE NOTICE '✅ Migrated existing profiles.location data';
  END IF;
END $$;

-- ============================================
-- Update RPC functions to support region filtering
-- ============================================

-- Update update_teacher_profile RPC to accept region_id and city_id
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
  p_avatar_url TEXT DEFAULT NULL
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
-- Success message with migration statistics
-- ============================================
DO $$
DECLARE
  v_teachers_migrated INTEGER := 0;
  v_students_migrated INTEGER := 0;
  v_profiles_migrated INTEGER := 0;
  v_teachers_unmapped INTEGER := 0;
  v_students_unmapped INTEGER := 0;
BEGIN
  -- Count migrated teachers
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teachers') THEN
    SELECT COUNT(*) INTO v_teachers_migrated FROM teachers WHERE region_id IS NOT NULL;
    SELECT COUNT(*) INTO v_teachers_unmapped FROM teachers
    WHERE (location IS NOT NULL AND location != '') AND region_id IS NULL;
  END IF;

  -- Count migrated students
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'students') THEN
    SELECT COUNT(*) INTO v_students_migrated FROM students WHERE city_id IS NOT NULL;
    SELECT COUNT(*) INTO v_students_unmapped FROM students
    WHERE (city IS NOT NULL AND city != '') AND city_id IS NULL;
  END IF;

  -- Count migrated profiles
  SELECT COUNT(*) INTO v_profiles_migrated FROM profiles WHERE region_id IS NOT NULL OR city_id IS NOT NULL;

  RAISE NOTICE '✅ Migration 031 completed successfully!';
  RAISE NOTICE '   ';
  RAISE NOTICE '   📊 Migration Statistics:';
  RAISE NOTICE '   - Teachers migrated: % (unmapped: %)', v_teachers_migrated, v_teachers_unmapped;
  RAISE NOTICE '   - Students migrated: % (unmapped: %)', v_students_migrated, v_students_unmapped;
  RAISE NOTICE '   - Total profiles with regions: %', v_profiles_migrated;
  RAISE NOTICE '   ';
  RAISE NOTICE '   ✅ Changes applied:';
  RAISE NOTICE '   - Added region_id and city_id to teachers, students, and profiles';
  RAISE NOTICE '   - Migrated existing location data to new structure';
  RAISE NOTICE '   - Updated update_teacher_profile RPC function';
  RAISE NOTICE '   - Maintained backward compatibility with location field';
  RAISE NOTICE '   ';
  IF v_teachers_unmapped > 0 OR v_students_unmapped > 0 THEN
    RAISE NOTICE '   ⚠️  Note: Some users have unmapped cities (not in database)';
    RAISE NOTICE '   - They will continue using text-based location field';
    RAISE NOTICE '   - Add missing cities to database if needed';
  END IF;
END $$;
