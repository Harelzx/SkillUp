-- ============================================
-- Migration 039: Allow teachers to view students with conversations
-- Teachers can view student profiles if they have conversations together
-- This fixes the issue where teachers can't start conversations with students
-- ============================================

-- Add policy for teachers to view students they have conversations with
DROP POLICY IF EXISTS "Teachers can view students with conversations" ON students;
CREATE POLICY "Teachers can view students with conversations"
  ON students FOR SELECT
  USING (
    -- Teacher can see student if there's at least one conversation between them
    EXISTS (
      SELECT 1 
      FROM conversations 
      WHERE conversations.student_id = students.id 
        AND conversations.teacher_id = auth.uid()
    )
  );

-- Add index for performance on the conversations lookup
CREATE INDEX IF NOT EXISTS idx_conversations_teacher_student ON conversations(teacher_id, student_id);

-- ============================================
-- Migration complete
-- ============================================

