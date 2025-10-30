-- ============================================
-- Migration 026: Allow teachers to view students with bookings
-- Teachers can view student profiles if they have bookings together
-- ============================================

-- Add policy for teachers to view students they have bookings with
DROP POLICY IF EXISTS "Teachers can view students with bookings" ON students;
CREATE POLICY "Teachers can view students with bookings"
  ON students FOR SELECT
  USING (
    -- Teacher can see student if there's at least one booking between them
    EXISTS (
      SELECT 1 
      FROM bookings 
      WHERE bookings.student_id = students.id 
        AND bookings.teacher_id = auth.uid()
    )
  );

-- Add index for performance on the bookings lookup
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_student ON bookings(teacher_id, student_id);

-- ============================================
-- Migration complete
-- ============================================

