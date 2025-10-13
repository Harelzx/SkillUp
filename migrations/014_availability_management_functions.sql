-- ============================================
-- Migration 014: Availability Management Functions
-- Functions for teachers to manage their availability slots
-- ============================================

-- ============================================
-- Function: Upsert Availability Slots (batch)
-- ============================================

CREATE OR REPLACE FUNCTION upsert_availability_slots(
  p_teacher_id UUID,
  p_date DATE,
  p_slots JSONB  -- Array of {start_time: "HH:MM", end_time: "HH:MM"}
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot JSONB;
  v_start_at TIMESTAMPTZ;
  v_end_at TIMESTAMPTZ;
  v_overlap_count INTEGER;
  v_inserted_count INTEGER := 0;
  v_teacher_tz TEXT;
BEGIN
  -- Security checks
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; 
  END IF;
  
  IF auth.uid() != p_teacher_id THEN 
    RAISE EXCEPTION 'Unauthorized: can only manage own availability' USING ERRCODE = '42501'; 
  END IF;

  -- Get teacher timezone
  SELECT timezone INTO v_teacher_tz FROM profiles WHERE id = p_teacher_id;
  v_teacher_tz := COALESCE(v_teacher_tz, 'Asia/Jerusalem');

  -- Don't allow editing past dates
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot modify availability for past dates' USING ERRCODE = '22000';
  END IF;

  -- Delete existing slots for this day that are not booked
  DELETE FROM availability_slots
  WHERE teacher_id = p_teacher_id
    AND DATE(start_at AT TIME ZONE v_teacher_tz) = p_date
    AND is_booked = FALSE;

  -- Insert new slots
  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots)
  LOOP
    -- Build timestamps
    v_start_at := (p_date || ' ' || (v_slot->>'start_time'))::TIMESTAMP AT TIME ZONE v_teacher_tz;
    v_end_at := (p_date || ' ' || (v_slot->>'end_time'))::TIMESTAMP AT TIME ZONE v_teacher_tz;

    -- Validate times
    IF v_end_at <= v_start_at THEN
      RAISE EXCEPTION 'End time must be after start time' USING ERRCODE = '22000';
    END IF;

    -- Check for overlap with existing slots
    SELECT COUNT(*) INTO v_overlap_count
    FROM availability_slots
    WHERE teacher_id = p_teacher_id
      AND (start_at, end_at) OVERLAPS (v_start_at, v_end_at);

    IF v_overlap_count > 0 THEN
      RAISE EXCEPTION 'Slot overlaps with existing slot: % - %', 
        (v_slot->>'start_time'), (v_slot->>'end_time') USING ERRCODE = '23505';
    END IF;

    -- Check for overlap with confirmed bookings
    IF check_booking_overlap(p_teacher_id, v_start_at, v_end_at) THEN
      RAISE EXCEPTION 'Slot conflicts with existing booking: % - %', 
        (v_slot->>'start_time'), (v_slot->>'end_time') USING ERRCODE = '23505';
    END IF;

    -- Insert slot
    INSERT INTO availability_slots (teacher_id, start_at, end_at, is_booked)
    VALUES (p_teacher_id, v_start_at, v_end_at, FALSE);
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  -- Audit log
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta)
  VALUES (
    p_teacher_id,
    'availability_updated',
    'availability_slots',
    NULL,
    jsonb_build_object('date', p_date, 'slots_count', v_inserted_count)
  );

  -- Realtime notification
  PERFORM pg_notify(
    'teacher:' || p_teacher_id::TEXT,
    jsonb_build_object(
      'type', 'availability_updated',
      'date', p_date,
      'slots_count', v_inserted_count
    )::TEXT
  );

  PERFORM pg_notify(
    'search:availability',
    jsonb_build_object(
      'type', 'slots_changed',
      'teacher_id', p_teacher_id,
      'date', p_date
    )::TEXT
  );

  RETURN jsonb_build_object(
    'success', true,
    'date', p_date,
    'slots_inserted', v_inserted_count
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Close Day
-- ============================================

CREATE OR REPLACE FUNCTION close_day(
  p_teacher_id UUID,
  p_date DATE
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_teacher_tz TEXT;
  v_booked_count INTEGER;
BEGIN
  -- Security checks
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; 
  END IF;
  
  IF auth.uid() != p_teacher_id THEN 
    RAISE EXCEPTION 'Unauthorized: can only manage own availability' USING ERRCODE = '42501'; 
  END IF;

  -- Get teacher timezone
  SELECT timezone INTO v_teacher_tz FROM profiles WHERE id = p_teacher_id;
  v_teacher_tz := COALESCE(v_teacher_tz, 'Asia/Jerusalem');

  -- Don't allow closing past dates
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot close past dates' USING ERRCODE = '22000';
  END IF;

  -- Check for booked slots
  SELECT COUNT(*) INTO v_booked_count
  FROM availability_slots
  WHERE teacher_id = p_teacher_id
    AND DATE(start_at AT TIME ZONE v_teacher_tz) = p_date
    AND is_booked = TRUE;

  IF v_booked_count > 0 THEN
    RAISE EXCEPTION 'Cannot close day with existing bookings. Please cancel bookings first.' USING ERRCODE = '23505';
  END IF;

  -- Delete all unbooked slots for this day
  DELETE FROM availability_slots
  WHERE teacher_id = p_teacher_id
    AND DATE(start_at AT TIME ZONE v_teacher_tz) = p_date
    AND is_booked = FALSE;
    
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Audit log
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta)
  VALUES (
    p_teacher_id,
    'day_closed',
    'availability_slots',
    NULL,
    jsonb_build_object('date', p_date, 'slots_deleted', v_deleted_count)
  );

  -- Realtime notification
  PERFORM pg_notify(
    'teacher:' || p_teacher_id::TEXT,
    jsonb_build_object(
      'type', 'day_closed',
      'date', p_date
    )::TEXT
  );

  PERFORM pg_notify(
    'search:availability',
    jsonb_build_object(
      'type', 'day_closed',
      'teacher_id', p_teacher_id,
      'date', p_date
    )::TEXT
  );

  RETURN jsonb_build_object(
    'success', true,
    'date', p_date,
    'slots_deleted', v_deleted_count
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Open Day (create default slots)
-- ============================================

CREATE OR REPLACE FUNCTION open_day(
  p_teacher_id UUID,
  p_date DATE,
  p_default_start_time TIME DEFAULT '09:00',
  p_default_end_time TIME DEFAULT '17:00',
  p_slot_duration INTEGER DEFAULT 60  -- minutes
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_time TIME;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_inserted_count INTEGER := 0;
  v_teacher_tz TEXT;
BEGIN
  -- Security checks
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; 
  END IF;
  
  IF auth.uid() != p_teacher_id THEN 
    RAISE EXCEPTION 'Unauthorized: can only manage own availability' USING ERRCODE = '42501'; 
  END IF;

  -- Get teacher timezone
  SELECT timezone INTO v_teacher_tz FROM profiles WHERE id = p_teacher_id;
  v_teacher_tz := COALESCE(v_teacher_tz, 'Asia/Jerusalem');

  -- Don't allow opening past dates
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot open past dates' USING ERRCODE = '22000';
  END IF;

  -- Validate slot duration
  IF p_slot_duration NOT IN (30, 45, 60, 90, 120) THEN
    RAISE EXCEPTION 'Invalid slot duration' USING ERRCODE = '22000';
  END IF;

  -- Delete existing unbooked slots for this day
  DELETE FROM availability_slots
  WHERE teacher_id = p_teacher_id
    AND DATE(start_at AT TIME ZONE v_teacher_tz) = p_date
    AND is_booked = FALSE;

  -- Create slots
  v_current_time := p_default_start_time;
  
  WHILE v_current_time < p_default_end_time LOOP
    v_slot_start := (p_date || ' ' || v_current_time::TEXT)::TIMESTAMP AT TIME ZONE v_teacher_tz;
    v_slot_end := v_slot_start + (p_slot_duration || ' minutes')::INTERVAL;

    -- Only add if slot end is within working hours
    IF v_slot_end::TIME <= p_default_end_time THEN
      -- Check no booking conflict
      IF NOT check_booking_overlap(p_teacher_id, v_slot_start, v_slot_end) THEN
        INSERT INTO availability_slots (teacher_id, start_at, end_at, is_booked)
        VALUES (p_teacher_id, v_slot_start, v_slot_end, FALSE);
        
        v_inserted_count := v_inserted_count + 1;
      END IF;
    END IF;

    v_current_time := v_current_time + (p_slot_duration || ' minutes')::INTERVAL;
  END LOOP;

  -- Audit log
  INSERT INTO audit_log (actor_user_id, action, entity, entity_id, meta)
  VALUES (
    p_teacher_id,
    'day_opened',
    'availability_slots',
    NULL,
    jsonb_build_object(
      'date', p_date, 
      'slots_created', v_inserted_count,
      'start_time', p_default_start_time,
      'end_time', p_default_end_time,
      'slot_duration', p_slot_duration
    )
  );

  -- Realtime notification
  PERFORM pg_notify(
    'teacher:' || p_teacher_id::TEXT,
    jsonb_build_object(
      'type', 'day_opened',
      'date', p_date,
      'slots_count', v_inserted_count
    )::TEXT
  );

  PERFORM pg_notify(
    'search:availability',
    jsonb_build_object(
      'type', 'day_opened',
      'teacher_id', p_teacher_id,
      'date', p_date
    )::TEXT
  );

  RETURN jsonb_build_object(
    'success', true,
    'date', p_date,
    'slots_created', v_inserted_count
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Get Teacher Slots for Date Range
-- ============================================

CREATE OR REPLACE FUNCTION get_teacher_availability_slots(
  p_teacher_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  is_booked BOOLEAN,
  booking_id UUID
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.start_at,
    s.end_at,
    s.is_booked,
    s.booking_id
  FROM availability_slots s
  WHERE s.teacher_id = p_teacher_id
    AND s.start_at::DATE >= p_start_date
    AND s.start_at::DATE <= p_end_date
  ORDER BY s.start_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_availability_slots TO authenticated;
GRANT EXECUTE ON FUNCTION close_day TO authenticated;
GRANT EXECUTE ON FUNCTION open_day TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_availability_slots TO authenticated;

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 014 completed successfully!';
  RAISE NOTICE 'Created functions: upsert_availability_slots, close_day, open_day, get_teacher_availability_slots';
END $$;

