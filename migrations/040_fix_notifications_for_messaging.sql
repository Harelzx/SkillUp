-- Migration: Fix Notifications for Messaging System
-- Description: Add NEW_MESSAGE type to notification_type enum and add INSERT policy for notifications
-- Date: 2025-01-08

-- =====================================================
-- ADD NEW_MESSAGE TO notification_type ENUM
-- =====================================================

-- Add NEW_MESSAGE to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEW_MESSAGE';

-- =====================================================
-- ADD INSERT POLICY FOR NOTIFICATIONS
-- =====================================================

-- Drop existing policy if it exists (in case we need to recreate)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Allow authenticated users to create notifications for any user
-- This is needed for the messaging system where users create notifications for each other
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Alternative: More restrictive policy that only allows creating notifications for specific scenarios
-- Uncomment this if you want to be more restrictive:
-- CREATE POLICY "Users can create message notifications"
--   ON notifications FOR INSERT
--   WITH CHECK (
--     auth.uid() IS NOT NULL AND
--     (
--       -- Allow creating NEW_MESSAGE notifications
--       type = 'NEW_MESSAGE'
--       OR
--       -- Allow system operations (functions with SECURITY DEFINER will bypass this)
--       auth.uid() = user_id
--     )
--   );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Authenticated users can create notifications" ON notifications IS
  'Allows authenticated users to create notifications for other users (needed for messaging system)';
