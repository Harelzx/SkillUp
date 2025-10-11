-- ============================================
-- SkillUp Database Schema
-- Supabase PostgreSQL Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('teacher', 'student');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'cancelled');
CREATE TYPE notification_type AS ENUM (
  'LESSON_REMINDER_STUDENT',
  'LESSON_REMINDER_TEACHER',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'PAYMENT_RECEIVED',
  'REVIEW_RECEIVED',
  'SYSTEM'
);
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'refund', 'bonus', 'used');

-- ============================================
-- TABLES
-- ============================================

-- -------------------------------------------
-- Table: profiles
-- Extended user information
-- -------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  video_url TEXT,
  phone_number TEXT,
  hourly_rate NUMERIC(10, 2), -- For teachers only
  experience_years INTEGER, -- For teachers only
  total_students INTEGER DEFAULT 0, -- For teachers only
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (for discovery)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------
-- Table: subjects
-- Available subjects for teaching
-- -------------------------------------------
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  name_he TEXT NOT NULL, -- Hebrew name
  category TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Public read
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are viewable by everyone"
  ON subjects FOR SELECT
  USING (true);

-- -------------------------------------------
-- Table: teacher_subjects
-- Many-to-many relationship between teachers and subjects
-- -------------------------------------------
CREATE TABLE teacher_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id)
);

-- RLS: Public read
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher subjects are viewable by everyone"
  ON teacher_subjects FOR SELECT
  USING (true);

-- Teachers can manage their own subjects
CREATE POLICY "Teachers can manage own subjects"
  ON teacher_subjects FOR ALL
  USING (auth.uid() = teacher_id);

-- -------------------------------------------
-- Table: bookings
-- Lesson bookings
-- -------------------------------------------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  price NUMERIC(10, 2) NOT NULL,
  is_online BOOLEAN DEFAULT TRUE,
  location TEXT,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_at > start_at)
);

-- RLS: Users can see their own bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = teacher_id OR auth.uid() = student_id);

-- Students can create bookings
CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Both parties can update (for status changes, etc.)
CREATE POLICY "Booking parties can update"
  ON bookings FOR UPDATE
  USING (auth.uid() = teacher_id OR auth.uid() = student_id);

-- -------------------------------------------
-- Table: reviews
-- Reviews for completed lessons
-- -------------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Public read, students can create/update
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Students can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = student_id);

-- -------------------------------------------
-- Table: teacher_availability
-- Teacher availability schedule
-- -------------------------------------------
CREATE TABLE teacher_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  repeat_rule TEXT, -- RRULE format for recurring availability
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start_time CHECK (end_time > start_time)
);

-- RLS
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable by everyone"
  ON teacher_availability FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage own availability"
  ON teacher_availability FOR ALL
  USING (auth.uid() = teacher_id);

-- -------------------------------------------
-- Table: payment_intents
-- Stripe payment tracking
-- -------------------------------------------
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'ILS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment intents"
  ON payment_intents FOR SELECT
  USING (auth.uid() = student_id);

-- -------------------------------------------
-- Table: payout_accounts
-- Stripe Connect accounts for teachers
-- -------------------------------------------
CREATE TABLE payout_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own payout account"
  ON payout_accounts FOR SELECT
  USING (auth.uid() = teacher_id);

-- -------------------------------------------
-- Table: student_credits
-- Student credit balance
-- -------------------------------------------
CREATE TABLE student_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE student_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own credits"
  ON student_credits FOR SELECT
  USING (auth.uid() = student_id);

-- -------------------------------------------
-- Table: credit_transactions
-- Credit transaction history
-- -------------------------------------------
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL, -- Positive = add, Negative = deduct
  type credit_transaction_type NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = student_id);

-- -------------------------------------------
-- Table: notifications
-- User notifications
-- -------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  data JSONB, -- Additional structured data
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_hourly_rate ON profiles(hourly_rate) WHERE role = 'teacher';
CREATE INDEX idx_profiles_display_name_trgm ON profiles USING gin(display_name gin_trgm_ops);

-- Teacher Subjects
CREATE INDEX idx_teacher_subjects_teacher ON teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_subject ON teacher_subjects(subject_id);

-- Bookings
CREATE INDEX idx_bookings_teacher ON bookings(teacher_id);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_at ON bookings(start_at);
CREATE INDEX idx_bookings_date_range ON bookings(start_at, end_at);

-- Reviews
CREATE INDEX idx_reviews_teacher ON reviews(teacher_id);
CREATE INDEX idx_reviews_student ON reviews(student_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_accounts_updated_at BEFORE UPDATE ON payout_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_credits_updated_at BEFORE UPDATE ON student_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate teacher average rating
CREATE OR REPLACE FUNCTION get_teacher_avg_rating(teacher_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM reviews
  WHERE teacher_id = teacher_uuid;
$$ LANGUAGE SQL STABLE;

-- Function: Get teacher total reviews
CREATE OR REPLACE FUNCTION get_teacher_review_count(teacher_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM reviews
  WHERE teacher_id = teacher_uuid;
$$ LANGUAGE SQL STABLE;

-- Function: Add or deduct student credits
CREATE OR REPLACE FUNCTION add_student_credits(
  p_student_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update student credits balance
  INSERT INTO student_credits (student_id, balance)
  VALUES (p_student_id, p_amount)
  ON CONFLICT (student_id)
  DO UPDATE SET
    balance = student_credits.balance + p_amount,
    updated_at = NOW();

  -- Ensure balance doesn't go negative
  IF (SELECT balance FROM student_credits WHERE student_id = p_student_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- View: Teacher profiles with stats
CREATE OR REPLACE VIEW teacher_profiles_with_stats AS
SELECT
  p.*,
  get_teacher_avg_rating(p.id) as avg_rating,
  get_teacher_review_count(p.id) as review_count,
  (
    SELECT COALESCE(array_agg(ts.subject_id), ARRAY[]::uuid[])
    FROM teacher_subjects ts
    WHERE ts.teacher_id = p.id
  ) as subject_ids,
  (
    SELECT COALESCE(array_agg(s.name_he), ARRAY[]::text[])
    FROM teacher_subjects ts
    JOIN subjects s ON s.id = ts.subject_id
    WHERE ts.teacher_id = p.id
  ) as subject_names
FROM profiles p
WHERE p.role = 'teacher' AND p.is_active = true;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'Extended user profiles for both teachers and students';
COMMENT ON TABLE subjects IS 'Available subjects for teaching/learning';
COMMENT ON TABLE teacher_subjects IS 'Many-to-many relationship between teachers and subjects';
COMMENT ON TABLE bookings IS 'Lesson bookings between students and teachers';
COMMENT ON TABLE reviews IS 'Student reviews for completed lessons';
COMMENT ON TABLE teacher_availability IS 'Teacher availability schedule';
COMMENT ON TABLE payment_intents IS 'Stripe payment tracking';
COMMENT ON TABLE payout_accounts IS 'Stripe Connect accounts for teacher payouts';
COMMENT ON TABLE student_credits IS 'Student credit balance';
COMMENT ON TABLE credit_transactions IS 'History of credit additions and deductions';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
