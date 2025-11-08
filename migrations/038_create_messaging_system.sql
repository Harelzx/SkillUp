-- Migration: Create Messaging System
-- Description: Tables and functions for teacher-student messaging
-- Date: 2025-01-08

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: conversations
-- =====================================================
-- Stores conversation metadata between teacher and student
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One conversation per teacher-student pair
  CONSTRAINT unique_teacher_student UNIQUE(teacher_id, student_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_teacher ON conversations(teacher_id);
CREATE INDEX idx_conversations_student ON conversations(student_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_booking ON conversations(booking_id) WHERE booking_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: messages
-- =====================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('teacher', 'student')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure content is not empty
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Updated_at trigger
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: typing_indicators
-- =====================================================
-- Tracks who is currently typing in a conversation
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 seconds'),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One typing indicator per user per conversation
  CONSTRAINT unique_user_conversation UNIQUE(conversation_id, user_id)
);

-- Index for cleanup and queries
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_expires ON typing_indicators(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONVERSATIONS POLICIES
-- =====================================================

-- Participants can view their conversations
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = teacher_id OR auth.uid() = student_id
  );

-- Any authenticated user can create a conversation
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.uid() = teacher_id OR auth.uid() = student_id)
  );

-- Participants can update their conversations
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = teacher_id OR auth.uid() = student_id
  )
  WITH CHECK (
    auth.uid() = teacher_id OR auth.uid() = student_id
  );

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.teacher_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.teacher_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

-- Participants can update messages (for read receipts)
CREATE POLICY "Participants can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.teacher_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.teacher_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

-- =====================================================
-- TYPING INDICATORS POLICIES
-- =====================================================

-- Participants can view typing indicators in their conversations
CREATE POLICY "Participants can view typing indicators"
  ON typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = typing_indicators.conversation_id
      AND (conversations.teacher_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

-- Users can insert their own typing indicators
CREATE POLICY "Users can set typing indicators"
  ON typing_indicators FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = typing_indicators.conversation_id
      AND (conversations.teacher_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

-- Users can update their own typing indicators
CREATE POLICY "Users can update their typing indicators"
  ON typing_indicators FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own typing indicators
CREATE POLICY "Users can delete their typing indicators"
  ON typing_indicators FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE (c.teacher_id = p_user_id OR c.student_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = false;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function: Mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is participant
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
    AND (teacher_id = p_user_id OR student_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Mark messages as read
  UPDATE messages
  SET
    is_read = true,
    read_at = NOW(),
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
END;
$$;

-- Function: Get unread count per conversation for a user
CREATE OR REPLACE FUNCTION get_conversation_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function: Clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE expires_at < NOW();
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update conversation when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_unread_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_typing_indicators() TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE conversations IS 'Stores conversation metadata between teachers and students';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE typing_indicators IS 'Tracks who is currently typing in a conversation (auto-expires after 5 seconds)';
COMMENT ON FUNCTION get_unread_count(UUID) IS 'Returns total unread message count for a user across all conversations';
COMMENT ON FUNCTION mark_conversation_read(UUID, UUID) IS 'Marks all messages in a conversation as read for the given user';
COMMENT ON FUNCTION get_conversation_unread_count(UUID, UUID) IS 'Returns unread message count for a specific conversation';
COMMENT ON FUNCTION cleanup_expired_typing_indicators() IS 'Removes typing indicators that have expired';
