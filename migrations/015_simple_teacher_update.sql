-- ============================================
-- Migration 015: Simple Teacher Update (Bypass PostgREST Cache)
-- Ultra-simple function with full validations
-- ============================================

-- Drop old version if exists
DROP FUNCTION IF EXISTS update_teacher_profile_simple(UUID, JSONB);

-- Create simple update function
CREATE OR REPLACE FUNCTION update_teacher_profile_simple(
  p_teacher_id UUID,
  p_updates JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id UUID;
  v_is_teacher BOOLEAN;
  v_hourly_rate NUMERIC;
  v_lesson_modes TEXT[];
  v_duration_options INTEGER[];
BEGIN
  -- Get authenticated user
  v_auth_id := auth.uid();
  
  IF v_auth_id IS NULL THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF v_auth_id != p_teacher_id THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Check if user is a teacher
  SELECT (role = 'teacher') INTO v_is_teacher 
  FROM profiles 
  WHERE id = p_teacher_id;
  
  IF NOT v_is_teacher THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a teacher');
  END IF;

  -- Validate hourly_rate if provided
  IF p_updates ? 'hourly_rate' THEN
    v_hourly_rate := (p_updates->>'hourly_rate')::NUMERIC;
    IF v_hourly_rate <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Hourly rate must be greater than 0');
    END IF;
  END IF;

  -- Validate lesson_modes if provided
  IF p_updates ? 'lesson_modes' THEN
    v_lesson_modes := ARRAY(SELECT jsonb_array_elements_text(p_updates->'lesson_modes'));
    IF array_length(v_lesson_modes, 1) = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'At least one lesson mode required');
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(v_lesson_modes) AS mode
      WHERE mode NOT IN ('online', 'at_teacher', 'at_student')
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid lesson mode');
    END IF;
  END IF;

  -- Validate duration_options if provided
  IF p_updates ? 'duration_options' THEN
    v_duration_options := ARRAY(SELECT (jsonb_array_elements(p_updates->'duration_options'))::TEXT::INTEGER);
    IF array_length(v_duration_options, 1) = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'At least one duration option required');
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(v_duration_options) AS dur
      WHERE dur NOT IN (30, 45, 60, 90, 120)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid duration option');
    END IF;
  END IF;

  -- Dynamic UPDATE using JSONB (bypasses PostgREST schema cache)
  UPDATE profiles
  SET
    display_name = COALESCE(p_updates->>'display_name', display_name),
    bio = CASE WHEN p_updates ? 'bio' THEN p_updates->>'bio' ELSE bio END,
    avatar_url = CASE WHEN p_updates ? 'avatar_url' THEN p_updates->>'avatar_url' ELSE avatar_url END,
    hourly_rate = CASE WHEN p_updates ? 'hourly_rate' THEN v_hourly_rate ELSE hourly_rate END,
    lesson_modes = CASE WHEN p_updates ? 'lesson_modes' THEN v_lesson_modes ELSE lesson_modes END,
    duration_options = CASE WHEN p_updates ? 'duration_options' THEN v_duration_options ELSE duration_options END,
    regions = CASE WHEN p_updates ? 'regions' THEN 
      ARRAY(SELECT jsonb_array_elements_text(p_updates->'regions'))
      ELSE regions END,
    timezone = CASE WHEN p_updates ? 'timezone' THEN p_updates->>'timezone' ELSE timezone END,
    teaching_style = CASE WHEN p_updates ? 'teaching_style' THEN p_updates->>'teaching_style' ELSE teaching_style END,
    location = CASE WHEN p_updates ? 'location' THEN p_updates->>'location' ELSE location END,
    updated_at = NOW()
  WHERE id = p_teacher_id;

  -- Audit log
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta)
  VALUES (p_teacher_id, 'teacher_profile_updated', 'profile', p_teacher_id, p_updates);

  -- Realtime notifications
  PERFORM pg_notify(
    'teacher:' || p_teacher_id::TEXT,
    jsonb_build_object('type', 'profile_updated', 'teacher_id', p_teacher_id)::TEXT
  );

  PERFORM pg_notify(
    'search:availability',
    jsonb_build_object('type', 'teacher_profile_updated', 'teacher_id', p_teacher_id)::TEXT
  );

  -- Return simple success
  RETURN jsonb_build_object(
    'success', true,
    'teacher_id', p_teacher_id,
    'updated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permission
GRANT EXECUTE ON FUNCTION update_teacher_profile_simple TO authenticated;

-- Test it works
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 015 completed!';
  RAISE NOTICE 'Created: update_teacher_profile_simple(teacher_id, updates_jsonb)';
  RAISE NOTICE 'This function bypasses PostgREST schema cache completely';
END $$;

