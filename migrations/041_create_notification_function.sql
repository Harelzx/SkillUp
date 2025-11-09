-- Migration: Create Notification Function with SECURITY DEFINER
-- Description: Create a function to insert notifications that bypasses RLS
-- Date: 2025-01-08

-- =====================================================
-- CREATE NOTIFICATION FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, JSONB);

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_subtitle TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  type notification_type,
  title TEXT,
  subtitle TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate user exists (explicitly qualify column name to avoid ambiguity)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist: %', p_user_id;
  END IF;

  -- Insert notification and return the full record using CTE to avoid ambiguity
  RETURN QUERY
  WITH inserted_notification AS (
    INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
    VALUES (p_user_id, p_type::notification_type, p_title, p_subtitle, p_data, false)
    RETURNING *
  )
  SELECT 
    inserted_notification.id,
    inserted_notification.user_id,
    inserted_notification.type,
    inserted_notification.title,
    inserted_notification.subtitle,
    inserted_notification.data,
    inserted_notification.is_read,
    inserted_notification.created_at
  FROM inserted_notification;
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) IS
  'Creates a notification for a user. Uses SECURITY DEFINER to bypass RLS policies.';
