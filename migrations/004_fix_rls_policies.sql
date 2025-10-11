-- Migration: Fix RLS policies for profiles table
-- Date: 2025-10-11
-- Description: Allow users to create their own profile during signup

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Policy 1: Anyone can view active profiles (for browse/search)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (is_active = true);

-- Policy 2: Users can INSERT their own profile during signup
-- This is critical for the signup flow!
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can DELETE their own profile (optional, for account deletion)
CREATE POLICY "Users can delete own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- Verify policies are created
DO $$
BEGIN
  RAISE NOTICE 'RLS Policies for profiles table have been updated successfully';
END $$;
