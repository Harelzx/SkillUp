-- Migration: Enable Realtime for Notifications Table
-- Description: Enable Supabase Realtime on notifications table for real-time push notifications
-- Date: 2025-01-08

-- =====================================================
-- ENABLE REALTIME ON NOTIFICATIONS TABLE
-- =====================================================

-- Enable Realtime publication for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE notifications IS 'User notifications with Realtime enabled for instant push notifications';
