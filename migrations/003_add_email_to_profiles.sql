-- Migration: Add email column to profiles table
-- Date: 2025-10-11
-- Description: Add email column to profiles for easy access

-- Add email column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Add comment
COMMENT ON COLUMN profiles.email IS 'User email address (duplicated from auth.users for convenience)';

-- Update existing profiles with email from auth.users
-- Note: This requires RLS policies to be properly configured
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;
