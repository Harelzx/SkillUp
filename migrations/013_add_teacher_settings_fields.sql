-- ============================================
-- Migration 013: Add Teacher Settings Fields
-- Adds fields for lesson modes, duration options, regions, and timezone
-- ============================================

-- Add lesson_modes array (defaults include all three)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='lesson_modes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lesson_modes TEXT[] DEFAULT ARRAY['online', 'at_teacher', 'at_student'];
  END IF;
END $$;

-- Add duration_options array (default 45, 60, 90 minutes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='duration_options'
  ) THEN
    ALTER TABLE profiles ADD COLUMN duration_options INTEGER[] DEFAULT ARRAY[45, 60, 90];
  END IF;
END $$;

-- Add regions array for teaching areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='regions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN regions TEXT[];
  END IF;
END $$;

-- Add timezone (default to Israel timezone)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'Asia/Jerusalem';
  END IF;
END $$;

-- Add teaching_style description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='teaching_style'
  ) THEN
    ALTER TABLE profiles ADD COLUMN teaching_style TEXT;
  END IF;
END $$;

-- Update existing teacher profiles with defaults if null
UPDATE profiles 
SET 
  lesson_modes = COALESCE(lesson_modes, ARRAY['online', 'at_teacher', 'at_student']),
  duration_options = COALESCE(duration_options, ARRAY[45, 60, 90]),
  timezone = COALESCE(timezone, 'Asia/Jerusalem')
WHERE role = 'teacher';

-- ============================================
-- Function: Update Teacher Profile
-- ============================================

CREATE OR REPLACE FUNCTION update_teacher_profile(
  p_teacher_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_hourly_rate NUMERIC DEFAULT NULL,
  p_lesson_modes TEXT[] DEFAULT NULL,
  p_duration_options INTEGER[] DEFAULT NULL,
  p_regions TEXT[] DEFAULT NULL,
  p_timezone TEXT DEFAULT NULL,
  p_teaching_style TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_profile RECORD;
BEGIN
  -- Security: ensure user is authenticated and is updating their own profile
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; 
  END IF;
  
  IF auth.uid() != p_teacher_id THEN 
    RAISE EXCEPTION 'Unauthorized: can only update own profile' USING ERRCODE = '42501'; 
  END IF;

  -- Verify user is a teacher
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_teacher_id AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Profile not found or not a teacher' USING ERRCODE = '22000';
  END IF;

  -- Validate lesson_modes if provided
  IF p_lesson_modes IS NOT NULL THEN
    IF array_length(p_lesson_modes, 1) = 0 THEN
      RAISE EXCEPTION 'At least one lesson mode must be selected' USING ERRCODE = '22000';
    END IF;
    
    -- Validate each mode
    IF EXISTS (
      SELECT 1 FROM unnest(p_lesson_modes) AS mode
      WHERE mode NOT IN ('online', 'at_teacher', 'at_student')
    ) THEN
      RAISE EXCEPTION 'Invalid lesson mode' USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Validate duration_options if provided
  IF p_duration_options IS NOT NULL THEN
    IF array_length(p_duration_options, 1) = 0 THEN
      RAISE EXCEPTION 'At least one duration option must be selected' USING ERRCODE = '22000';
    END IF;
    
    -- Validate each duration
    IF EXISTS (
      SELECT 1 FROM unnest(p_duration_options) AS dur
      WHERE dur NOT IN (30, 45, 60, 90, 120)
    ) THEN
      RAISE EXCEPTION 'Invalid duration option. Must be 30, 45, 60, 90, or 120 minutes' USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Validate hourly_rate if provided
  IF p_hourly_rate IS NOT NULL AND p_hourly_rate <= 0 THEN
    RAISE EXCEPTION 'Hourly rate must be greater than 0' USING ERRCODE = '22000';
  END IF;

  -- Update profile (only update non-null fields)
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    bio = COALESCE(p_bio, bio),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    hourly_rate = COALESCE(p_hourly_rate, hourly_rate),
    lesson_modes = COALESCE(p_lesson_modes, lesson_modes),
    duration_options = COALESCE(p_duration_options, duration_options),
    regions = COALESCE(p_regions, regions),
    timezone = COALESCE(p_timezone, timezone),
    teaching_style = COALESCE(p_teaching_style, teaching_style),
    location = COALESCE(p_location, location),
    updated_at = NOW()
  WHERE id = p_teacher_id
  RETURNING * INTO v_updated_profile;

  -- Create notification for profile update
  INSERT INTO notifications (user_id, type, title, subtitle, data)
  VALUES (
    p_teacher_id,
    'SYSTEM',
    'הפרופיל עודכן',
    'השינויים שלך נשמרו בהצלחה',
    jsonb_build_object('updated_at', NOW())
  );

  -- Audit log
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta)
  VALUES (
    p_teacher_id,
    'teacher_profile_updated',
    'profile',
    p_teacher_id,
    jsonb_build_object(
      'fields_updated', jsonb_build_object(
        'display_name', p_display_name IS NOT NULL,
        'bio', p_bio IS NOT NULL,
        'hourly_rate', p_hourly_rate IS NOT NULL,
        'lesson_modes', p_lesson_modes IS NOT NULL,
        'duration_options', p_duration_options IS NOT NULL
      )
    )
  );

  -- Realtime notifications
  PERFORM pg_notify(
    'teacher:' || p_teacher_id::TEXT,
    jsonb_build_object(
      'type', 'profile_updated',
      'teacher_id', p_teacher_id
    )::TEXT
  );

  PERFORM pg_notify(
    'search:availability',
    jsonb_build_object(
      'type', 'teacher_profile_updated',
      'teacher_id', p_teacher_id
    )::TEXT
  );

  -- Return updated profile
  RETURN jsonb_build_object(
    'success', true,
    'profile', row_to_json(v_updated_profile)
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_teacher_profile TO authenticated;

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 013 completed successfully!';
  RAISE NOTICE 'Added: lesson_modes, duration_options, regions, timezone, teaching_style';
  RAISE NOTICE 'Created: update_teacher_profile function';
END $$;

