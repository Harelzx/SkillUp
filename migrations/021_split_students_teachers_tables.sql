-- ============================================
-- Migration 021: Split students/teachers tables
-- Creates separate tables for students and teachers
-- Migrates data from profiles table
-- ============================================

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_year INTEGER,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  subjects_interests TEXT[],
  level_category TEXT,
  level_proficiency TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  video_url TEXT,
  location TEXT,
  hourly_rate NUMERIC(10, 2),
  experience_years INTEGER,
  total_students INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_subscribed BOOLEAN DEFAULT false,
  subscription_tier TEXT,
  lesson_modes TEXT[],
  duration_options INTEGER[],
  regions TEXT[],
  timezone TEXT,
  teaching_style TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate data from profiles to students
INSERT INTO students (id, first_name, last_name, email, phone, bio, avatar_url, is_active, created_at, updated_at)
SELECT 
  id,
  COALESCE(SPLIT_PART(display_name, ' ', 1), 'Student') as first_name,
  COALESCE(SPLIT_PART(display_name, ' ', 2), '') as last_name,
  email,
  phone_number,
  bio,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM profiles
WHERE role = 'student';

-- Migrate data from profiles to teachers
INSERT INTO teachers (
  id, display_name, email, phone, bio, avatar_url, video_url, location,
  hourly_rate, experience_years, total_students, is_verified, is_active,
  lesson_modes, duration_options, regions, timezone, teaching_style, profile_completed,
  created_at, updated_at
)
SELECT 
  id, display_name, email, phone_number, bio, avatar_url, video_url, location,
  hourly_rate, experience_years, total_students, is_verified, is_active,
  lesson_modes, duration_options, regions, timezone, teaching_style, profile_completed,
  created_at, updated_at
FROM profiles
WHERE role = 'teacher';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
-- Students can only SELECT and UPDATE their own row
DROP POLICY IF EXISTS "Students can view own profile" ON students;
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Students can update own profile" ON students;
CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for teachers
-- Anyone can SELECT teachers (for browsing)
DROP POLICY IF EXISTS "Anyone can view teachers" ON teachers;
CREATE POLICY "Anyone can view teachers"
  ON teachers FOR SELECT
  USING (true);

-- Teachers can only UPDATE their own row
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
CREATE POLICY "Teachers can update own profile"
  ON teachers FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_id ON students(id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

CREATE INDEX IF NOT EXISTS idx_teachers_id ON teachers(id);
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON teachers(is_active);
CREATE INDEX IF NOT EXISTS idx_teachers_is_verified ON teachers(is_verified);
CREATE INDEX IF NOT EXISTS idx_teachers_location ON teachers(location);

-- ============================================
-- Migration complete
-- Note: profiles table is kept for backward compatibility
-- ============================================

