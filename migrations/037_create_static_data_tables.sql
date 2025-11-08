-- ============================================
-- Migration 037: Create Static Data Tables
-- Purpose: Move hardcoded data from code to database
-- ============================================

-- ============================================
-- Table 1: Languages (שפות הוראה)
-- ============================================

CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_he TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- ISO 639-1 code
  is_common BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for languages
INSERT INTO languages (name_he, name_en, code, is_common, sort_order) VALUES
  ('עברית', 'Hebrew', 'he', true, 1),
  ('אנגלית', 'English', 'en', true, 2),
  ('ערבית', 'Arabic', 'ar', true, 3),
  ('רוסית', 'Russian', 'ru', true, 4),
  ('צרפתית', 'French', 'fr', true, 5),
  ('ספרדית', 'Spanish', 'es', true, 6)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Table 2: Student Level Categories (רמות גיל/חינוך)
-- ============================================

CREATE TABLE IF NOT EXISTS student_level_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label_he TEXT NOT NULL,
  label_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data - unified from both StudentOnboardingModal and BookingStep1
INSERT INTO student_level_categories (value, label_he, label_en, sort_order) VALUES
  ('elementary', 'יסודי', 'Elementary School', 1),
  ('middle_school', 'חטיבת ביניים', 'Middle School', 2),
  ('high_school', 'תיכון', 'High School', 3),
  ('academic', 'אקדמי/סטודנט', 'Academic/Student', 4),
  ('adult', 'מבוגר', 'Adult', 5),
  ('other', 'אחר', 'Other', 6)
ON CONFLICT (value) DO NOTHING;

-- ============================================
-- Table 3: Student Level Proficiencies (רמות שליטה)
-- ============================================

CREATE TABLE IF NOT EXISTS student_level_proficiencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label_he TEXT NOT NULL,
  label_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data - unified from both files
INSERT INTO student_level_proficiencies (value, label_he, label_en, sort_order) VALUES
  ('beginner', 'מתחיל', 'Beginner', 1),
  ('basic', 'בסיסי', 'Basic', 2),
  ('intermediate', 'בינוני', 'Intermediate', 3),
  ('advanced', 'מתקדם', 'Advanced', 4),
  ('competitive', 'תחרותי/מקצועי', 'Competitive/Professional', 5)
ON CONFLICT (value) DO NOTHING;

-- ============================================
-- Table 4: Lesson Modes (אופני הוראה)
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label_he TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description_he TEXT,
  description_en TEXT,
  icon_name TEXT, -- Icon component name
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO lesson_modes (value, label_he, label_en, description_he, description_en, icon_name, sort_order) VALUES
  ('online', 'אונליין', 'Online', 'באמצעות Zoom/Teams', 'Via Zoom/Teams', 'Wifi', 1),
  ('at_teacher', 'בבית המורה', 'At Teacher''s Location', 'תגיע למורה', 'You go to teacher', 'School', 2),
  ('at_student', 'בבית התלמיד', 'At Student''s Location', 'המורה יגיע אליך', 'Teacher comes to you', 'Home', 3)
ON CONFLICT (value) DO NOTHING;

-- Note: The database uses 'at_teacher' and 'at_student', but BookingStep1 uses 'teacher_location' and 'student_location'
-- We'll need to handle this mapping in the API layer

-- ============================================
-- Table 5: Lesson Durations (משכי שיעורים)
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_durations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_minutes INTEGER NOT NULL UNIQUE,
  label_he TEXT NOT NULL,
  label_en TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO lesson_durations (duration_minutes, label_he, label_en, is_default, sort_order) VALUES
  (30, '30 דקות', '30 minutes', false, 1),
  (45, '45 דקות', '45 minutes', true, 2),
  (60, 'שעה', '1 hour', true, 3),
  (90, 'שעה וחצי', '1.5 hours', true, 4),
  (120, 'שעתיים', '2 hours', false, 5)
ON CONFLICT (duration_minutes) DO NOTHING;

-- ============================================
-- Table 6: Booking Statuses (סטטוסים של הזמנות)
-- ============================================

CREATE TABLE IF NOT EXISTS booking_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label_he TEXT NOT NULL,
  label_en TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  bg_color_hex TEXT NOT NULL,
  icon_name TEXT, -- Icon component name
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO booking_statuses (value, label_he, label_en, color_hex, bg_color_hex, icon_name, sort_order) VALUES
  ('pending', 'ממתין', 'Pending', '#F59E0B', '#FEF3C7', 'Clock', 1),
  ('awaiting_payment', 'ממתין לתשלום', 'Awaiting Payment', '#F97316', '#FFEDD5', 'AlertCircle', 2),
  ('confirmed', 'מאושר', 'Confirmed', '#10B981', '#D1FAE5', 'CheckCircle', 3),
  ('completed', 'הושלם', 'Completed', '#3B82F6', '#DBEAFE', 'CheckCircle2', 4),
  ('cancelled', 'בוטל', 'Cancelled', '#6B7280', '#F3F4F6', 'XCircle', 5),
  ('refunded', 'הוחזר', 'Refunded', '#8B5CF6', '#EDE9FE', 'RefreshCw', 6)
ON CONFLICT (value) DO NOTHING;

-- ============================================
-- Add RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_level_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_level_proficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_statuses ENABLE ROW LEVEL SECURITY;

-- Public read access for all static data tables
CREATE POLICY "Public read access for languages" ON languages FOR SELECT USING (true);
CREATE POLICY "Public read access for student_level_categories" ON student_level_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for student_level_proficiencies" ON student_level_proficiencies FOR SELECT USING (true);
CREATE POLICY "Public read access for lesson_modes" ON lesson_modes FOR SELECT USING (true);
CREATE POLICY "Public read access for lesson_durations" ON lesson_durations FOR SELECT USING (true);
CREATE POLICY "Public read access for booking_statuses" ON booking_statuses FOR SELECT USING (true);

-- ============================================
-- Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_languages_common ON languages(is_common, sort_order) WHERE is_common = true;
CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_student_level_categories_value ON student_level_categories(value);
CREATE INDEX IF NOT EXISTS idx_student_level_proficiencies_value ON student_level_proficiencies(value);
CREATE INDEX IF NOT EXISTS idx_lesson_modes_value ON lesson_modes(value);
CREATE INDEX IF NOT EXISTS idx_lesson_durations_minutes ON lesson_durations(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_lesson_durations_default ON lesson_durations(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_booking_statuses_value ON booking_statuses(value);

-- ============================================
-- Update existing booking_status enum
-- ============================================

-- Add missing status values to the existing enum
DO $$
BEGIN
  -- Check if awaiting_payment exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'awaiting_payment'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'awaiting_payment';
  END IF;

  -- Check if refunded exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'refunded'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'refunded';
  END IF;
END $$;

-- ============================================
-- Verification and Summary
-- ============================================

DO $$
DECLARE
  v_languages_count INTEGER;
  v_categories_count INTEGER;
  v_proficiencies_count INTEGER;
  v_modes_count INTEGER;
  v_durations_count INTEGER;
  v_statuses_count INTEGER;
BEGIN
  -- Count records in each table
  SELECT COUNT(*) INTO v_languages_count FROM languages;
  SELECT COUNT(*) INTO v_categories_count FROM student_level_categories;
  SELECT COUNT(*) INTO v_proficiencies_count FROM student_level_proficiencies;
  SELECT COUNT(*) INTO v_modes_count FROM lesson_modes;
  SELECT COUNT(*) INTO v_durations_count FROM lesson_durations;
  SELECT COUNT(*) INTO v_statuses_count FROM booking_statuses;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 037 completed successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created 6 static data tables:';
  RAISE NOTICE '  - languages: % records', v_languages_count;
  RAISE NOTICE '  - student_level_categories: % records', v_categories_count;
  RAISE NOTICE '  - student_level_proficiencies: % records', v_proficiencies_count;
  RAISE NOTICE '  - lesson_modes: % records', v_modes_count;
  RAISE NOTICE '  - lesson_durations: % records', v_durations_count;
  RAISE NOTICE '  - booking_statuses: % records', v_statuses_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added RLS policies for public read access';
  RAISE NOTICE 'Created indexes for performance';
  RAISE NOTICE 'Updated booking_status enum with missing values';
  RAISE NOTICE '========================================';
END $$;
