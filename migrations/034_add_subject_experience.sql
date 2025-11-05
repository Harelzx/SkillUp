-- Migration 034: Add teacher_subject_experience table
--
-- Purpose:
-- - Create table to store per-subject experience for teachers
-- - Add RLS policies for teacher access
-- - Add indexes for performance
-- - Create helper functions for upserting subject experience

-- ============================================
-- Step 1: Create teacher_subject_experience table
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_subject_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one entry per teacher-subject pair
  UNIQUE(teacher_id, subject_id)
);

-- ============================================
-- Step 2: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_teacher_subject_experience_teacher_id
  ON teacher_subject_experience(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_subject_experience_subject_id
  ON teacher_subject_experience(subject_id);

-- ============================================
-- Step 3: Enable RLS
-- ============================================

ALTER TABLE teacher_subject_experience ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own subject experience
CREATE POLICY teacher_subject_experience_select_own
  ON teacher_subject_experience
  FOR SELECT
  USING (
    auth.uid() = teacher_id
  );

-- Policy: Teachers can insert their own subject experience
CREATE POLICY teacher_subject_experience_insert_own
  ON teacher_subject_experience
  FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
  );

-- Policy: Teachers can update their own subject experience
CREATE POLICY teacher_subject_experience_update_own
  ON teacher_subject_experience
  FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can delete their own subject experience
CREATE POLICY teacher_subject_experience_delete_own
  ON teacher_subject_experience
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Policy: Students and public can view all teachers' subject experience
CREATE POLICY teacher_subject_experience_select_all
  ON teacher_subject_experience
  FOR SELECT
  USING (true);

-- ============================================
-- Step 4: Create helper function to upsert subject experience
-- ============================================

CREATE OR REPLACE FUNCTION upsert_teacher_subject_experience(
  p_teacher_id UUID,
  p_subject_experience JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_subject_id UUID;
  v_experience_years INTEGER;
  v_inserted_count INTEGER := 0;
  v_updated_count INTEGER := 0;
BEGIN
  -- Loop through each subject in the input JSON object
  FOR v_subject_id, v_experience_years IN
    SELECT key::UUID, value::TEXT::INTEGER
    FROM jsonb_each_text(p_subject_experience)
  LOOP
    -- Upsert the subject experience
    INSERT INTO teacher_subject_experience (teacher_id, subject_id, experience_years)
    VALUES (p_teacher_id, v_subject_id, v_experience_years)
    ON CONFLICT (teacher_id, subject_id)
    DO UPDATE SET
      experience_years = EXCLUDED.experience_years,
      updated_at = NOW()
    WHERE teacher_subject_experience.experience_years != EXCLUDED.experience_years;

    -- Track if this was an insert or update
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    ELSE
      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  -- Delete any subject experience entries that are not in the input
  DELETE FROM teacher_subject_experience
  WHERE teacher_id = p_teacher_id
    AND subject_id NOT IN (
      SELECT key::UUID FROM jsonb_each_text(p_subject_experience)
    );

  -- Return success with counts
  RETURN jsonb_build_object(
    'success', true,
    'inserted', v_inserted_count,
    'updated', v_updated_count,
    'teacher_id', p_teacher_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 5: Create helper function to get subject experience
-- ============================================

CREATE OR REPLACE FUNCTION get_teacher_subject_experience(
  p_teacher_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Build a JSON object with subject_id as keys and experience_years as values
  SELECT jsonb_object_agg(subject_id::TEXT, experience_years)
  INTO v_result
  FROM teacher_subject_experience
  WHERE teacher_id = p_teacher_id;

  -- Return empty object if no data found
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 6: Migrate existing experience_years data
-- ============================================

-- For teachers with experience_years and subjects, create initial subject experience entries
INSERT INTO teacher_subject_experience (teacher_id, subject_id, experience_years)
SELECT DISTINCT
  ts.teacher_id,
  ts.subject_id,
  t.experience_years
FROM teacher_subjects ts
INNER JOIN teachers t ON ts.teacher_id = t.id
WHERE t.experience_years IS NOT NULL
  AND t.experience_years > 0
ON CONFLICT (teacher_id, subject_id) DO NOTHING;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_total_entries INTEGER := 0;
  v_teachers_with_experience INTEGER := 0;
BEGIN
  -- Count total subject experience entries
  SELECT COUNT(*) INTO v_total_entries
  FROM teacher_subject_experience;

  -- Count teachers with at least one subject experience entry
  SELECT COUNT(DISTINCT teacher_id) INTO v_teachers_with_experience
  FROM teacher_subject_experience;

  RAISE NOTICE '✅ Migration 034 completed successfully';
  RAISE NOTICE '   - Created teacher_subject_experience table';
  RAISE NOTICE '   - Added RLS policies for teacher and public access';
  RAISE NOTICE '   - Created indexes for performance';
  RAISE NOTICE '   - Created upsert and get helper functions';
  RAISE NOTICE '   - Migrated existing data: % entries for % teachers', v_total_entries, v_teachers_with_experience;
END $$;
