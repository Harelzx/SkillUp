-- ============================================
-- Migration 036: Create lesson_tracking table
-- Purpose: Track teacher notes for completed lessons
-- ============================================

-- ============================================
-- Step 1: Create lesson_tracking table
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  note TEXT,
  note_summary VARCHAR(160),
  next_lesson_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  alert_minutes_before INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one tracking entry per booking
  UNIQUE(booking_id)
);

-- ============================================
-- Step 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lesson_tracking_teacher_id
  ON lesson_tracking(teacher_id);

CREATE INDEX IF NOT EXISTS idx_lesson_tracking_student_id
  ON lesson_tracking(student_id);

CREATE INDEX IF NOT EXISTS idx_lesson_tracking_booking_id
  ON lesson_tracking(booking_id);

CREATE INDEX IF NOT EXISTS idx_lesson_tracking_updated_at
  ON lesson_tracking(updated_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_teacher_updated
  ON lesson_tracking(teacher_id, updated_at DESC);

-- ============================================
-- Step 3: Enable RLS
-- ============================================

ALTER TABLE lesson_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own lesson tracking
CREATE POLICY lesson_tracking_select_own
  ON lesson_tracking
  FOR SELECT
  USING (
    auth.uid() = teacher_id
  );

-- Policy: Teachers can insert their own lesson tracking
CREATE POLICY lesson_tracking_insert_own
  ON lesson_tracking
  FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
  );

-- Policy: Teachers can update their own lesson tracking
CREATE POLICY lesson_tracking_update_own
  ON lesson_tracking
  FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can delete their own lesson tracking
CREATE POLICY lesson_tracking_delete_own
  ON lesson_tracking
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- ============================================
-- Step 4: Create trigger to update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_lesson_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_tracking_updated_at_trigger
  BEFORE UPDATE ON lesson_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_tracking_updated_at();

-- ============================================
-- Step 5: Create function to generate note summary
-- ============================================

CREATE OR REPLACE FUNCTION generate_note_summary(p_note TEXT)
RETURNS VARCHAR(160) AS $$
BEGIN
  IF p_note IS NULL OR LENGTH(TRIM(p_note)) = 0 THEN
    RETURN NULL;
  END IF;

  -- Remove extra whitespace and newlines
  DECLARE
    v_cleaned TEXT := REGEXP_REPLACE(TRIM(p_note), '\s+', ' ', 'g');
  BEGIN
    -- Truncate to 160 characters, add ellipsis if truncated
    IF LENGTH(v_cleaned) > 160 THEN
      RETURN LEFT(v_cleaned, 157) || '...';
    ELSE
      RETURN v_cleaned;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Step 6: Create trigger to auto-generate note_summary
-- ============================================

CREATE OR REPLACE FUNCTION update_lesson_tracking_note_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate summary when note is updated
  IF NEW.note IS DISTINCT FROM OLD.note THEN
    NEW.note_summary := generate_note_summary(NEW.note);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_tracking_note_summary_trigger
  BEFORE INSERT OR UPDATE ON lesson_tracking
  FOR EACH ROW
  WHEN (NEW.note IS NOT NULL)
  EXECUTE FUNCTION update_lesson_tracking_note_summary();

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_index_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'lesson_tracking'
  ) INTO v_table_exists;

  -- Count indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'lesson_tracking';

  -- Count policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'lesson_tracking';

  IF v_table_exists THEN
    RAISE NOTICE '✅ Migration 036 completed successfully';
    RAISE NOTICE '   - Created lesson_tracking table';
    RAISE NOTICE '   - Added % indexes for performance', v_index_count;
    RAISE NOTICE '   - Added % RLS policies for security', v_policy_count;
    RAISE NOTICE '   - Created triggers for updated_at and note_summary';
  ELSE
    RAISE EXCEPTION '❌ Migration 036 failed: lesson_tracking table not created';
  END IF;
END $$;

