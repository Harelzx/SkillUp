-- Migration: Enable Realtime for Messages Table
-- Description: Enable Supabase Realtime on messages table for real-time chat updates
-- Date: 2025-01-09

-- =====================================================
-- ENABLE REALTIME ON MESSAGES TABLE
-- =====================================================

-- Enable Realtime publication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE messages IS 'Chat messages with Realtime enabled for instant message delivery';
