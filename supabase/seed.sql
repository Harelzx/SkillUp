-- ============================================
-- SkillUp Database Seed Data
-- Sample data for development and testing
-- ============================================

-- ============================================
-- SUBJECTS
-- ============================================

INSERT INTO subjects (id, name, name_he, category, icon) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mathematics', 'מתמטיקה', 'STEM', '📐'),
  ('22222222-2222-2222-2222-222222222222', 'English', 'אנגלית', 'Languages', '🇬🇧'),
  ('33333333-3333-3333-3333-333333333333', 'Physics', 'פיזיקה', 'STEM', '⚛️'),
  ('44444444-4444-4444-4444-444444444444', 'Chemistry', 'כימיה', 'STEM', '🧪'),
  ('55555555-5555-5555-5555-555555555555', 'Biology', 'ביולוגיה', 'STEM', '🧬'),
  ('66666666-6666-6666-6666-666666666666', 'Computer Science', 'מדעי המחשב', 'STEM', '💻'),
  ('77777777-7777-7777-7777-777777777777', 'Hebrew', 'עברית', 'Languages', '🇮🇱'),
  ('88888888-8888-8888-8888-888888888888', 'History', 'היסטוריה', 'Humanities', '📚'),
  ('99999999-9999-9999-9999-999999999999', 'Geography', 'גיאוגרפיה', 'Humanities', '🌍'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Music', 'מוזיקה', 'Arts', '🎵'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Art', 'אמנות', 'Arts', '🎨'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Literature', 'ספרות', 'Humanities', '📖');

-- ============================================
-- SAMPLE TEACHER PROFILES
-- Note: In production, these would be created via auth.users
-- This is just for the profiles table assuming auth users exist
-- ============================================

-- Teacher 1: Sarah Cohen - Math Expert
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'teacher',
  'שרה כהן',
  'מורה למתמטיקה עם 15 שנות ניסיון. מתמחה בהכנה לבגרות ברמה של 5 יחידות. סבלנית ומקצועית, עם דרך הוראה ייחודית שהופכת את המתמטיקה למובנת ומהנה.',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  180.00,
  15,
  156,
  'תל אביב',
  true,
  true
);

-- Teacher 2: David Levy - English Teacher
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'teacher',
  'דוד לוי',
  'מורה לאנגלית עם הסמכה בינלאומית TEFL. מתמחה בהכנה לבחינות בגרות ופסיכומטרי. שיטת הוראה אינטראקטיבית המשלבת שיחה, קריאה וכתיבה.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  160.00,
  8,
  89,
  'ירושלים',
  true,
  true
);

-- Teacher 3: Rachel Ben-Ami - Physics
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'teacher',
  'רחל בן עמי',
  'פיזיקאית ומורה מנוסה. עובדת בהייטק וגם מלמדת פיזיקה ברמה גבוהה. מתמחה בהבנה עמוקה של החומר ופתרון בעיות מורכבות.',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
  200.00,
  12,
  124,
  'חיפה',
  true,
  true
);

-- Teacher 4: Michael Shalom - Computer Science
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  'teacher',
  'מיכאל שלום',
  'מהנדס תוכנה ומרצה במדעי המחשב. מלמד תכנות, אלגוריתמים ומבני נתונים. מתמחה בהכנה ללימודים אקדמיים ולעבודה בהייטק.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  220.00,
  10,
  78,
  'תל אביב',
  true,
  true
);

-- Teacher 5: Miriam Rosenberg - Chemistry
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000005',
  'teacher',
  'מרים רוזנברג',
  'דוקטורט בכימיה ומורה מוסמכת. מתמחה בהכנה לבגרות 5 יחידות. שיטת הוראה המשלבת ניסויים מעשיים והבנה תיאורטית.',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
  190.00,
  14,
  142,
  'רמת גן',
  true,
  true
);

-- Teacher 6: Yossi Mizrahi - Biology
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000006',
  'teacher',
  'יוסי מזרחי',
  'ביולוג ומורה מוסמך. מתמחה בביולוגיה תאית ומולקולרית. שיטת הוראה ויזואלית עם הרבה דוגמאות מהחיים.',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
  170.00,
  9,
  95,
  'פתח תקווה',
  true,
  true
);

-- Teacher 7: Tamar Goldstein - Literature
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000007',
  'teacher',
  'תמר גולדשטיין',
  'מורה לספרות עברית עם תואר שני. מתמחה בספרות ישראלית ועולמית. שיטת הוראה שמעודדת חשיבה ביקורתית ודיון.',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
  150.00,
  11,
  112,
  'רעננה',
  true,
  true
);

-- Teacher 8: Daniel Alon - Music
INSERT INTO profiles (id, role, display_name, bio, avatar_url, hourly_rate, experience_years, total_students, location, is_verified, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000008',
  'teacher',
  'דניאל אלון',
  'מוזיקאי מקצועי ומורה לגיטרה ופסנתר. בוגר בית ספר למוזיקה. מתמחה בלימוד תיאוריה מוזיקלית ונגינה.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  140.00,
  7,
  68,
  'הרצליה',
  true,
  true
);

-- Sample Student Profile
INSERT INTO profiles (id, role, display_name, bio, avatar_url, location, is_verified, is_active)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'student',
  'יעל ברק',
  'תלמידת תיכון בכיתה יא. מחפשת עזרה במתמטיקה ופיזיקה.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'תל אביב',
  true,
  true
);

-- ============================================
-- TEACHER-SUBJECT ASSOCIATIONS
-- ============================================

-- Sarah Cohen - Mathematics
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111');

-- David Levy - English
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222');

-- Rachel Ben-Ami - Physics & Math
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333'),
  ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111');

-- Michael Shalom - Computer Science & Math
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666'),
  ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111');

-- Miriam Rosenberg - Chemistry
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444');

-- Yossi Mizrahi - Biology & Chemistry
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555555'),
  ('10000000-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444');

-- Tamar Goldstein - Literature & Hebrew
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000007', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('10000000-0000-0000-0000-000000000007', '77777777-7777-7777-7777-777777777777');

-- Daniel Alon - Music
INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
  ('10000000-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ============================================
-- TEACHER AVAILABILITY SAMPLES
-- ============================================

-- Sarah Cohen - Available Sunday-Thursday 16:00-20:00
INSERT INTO teacher_availability (teacher_id, weekday, start_time, end_time, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 0, '16:00', '20:00', true), -- Sunday
  ('10000000-0000-0000-0000-000000000001', 1, '16:00', '20:00', true), -- Monday
  ('10000000-0000-0000-0000-000000000001', 2, '16:00', '20:00', true), -- Tuesday
  ('10000000-0000-0000-0000-000000000001', 3, '16:00', '20:00', true), -- Wednesday
  ('10000000-0000-0000-0000-000000000001', 4, '16:00', '20:00', true); -- Thursday

-- David Levy - Available Monday, Wednesday, Friday 14:00-18:00
INSERT INTO teacher_availability (teacher_id, weekday, start_time, end_time, is_active) VALUES
  ('10000000-0000-0000-0000-000000000002', 1, '14:00', '18:00', true),
  ('10000000-0000-0000-0000-000000000002', 3, '14:00', '18:00', true),
  ('10000000-0000-0000-0000-000000000002', 5, '10:00', '14:00', true);

-- Rachel Ben-Ami - Available Tuesday-Thursday 17:00-21:00
INSERT INTO teacher_availability (teacher_id, weekday, start_time, end_time, is_active) VALUES
  ('10000000-0000-0000-0000-000000000003', 2, '17:00', '21:00', true),
  ('10000000-0000-0000-0000-000000000003', 3, '17:00', '21:00', true),
  ('10000000-0000-0000-0000-000000000003', 4, '17:00', '21:00', true);

-- ============================================
-- SAMPLE BOOKINGS
-- ============================================

-- Future booking: Yael with Sarah Cohen
INSERT INTO bookings (teacher_id, student_id, subject_id, start_at, end_at, status, price, is_online, location)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  NOW() + INTERVAL '3 days' + INTERVAL '16 hours',
  NOW() + INTERVAL '3 days' + INTERVAL '17 hours',
  'confirmed',
  180.00,
  true,
  'Zoom'
);

-- Completed booking: Yael with David Levy
INSERT INTO bookings (teacher_id, student_id, subject_id, start_at, end_at, status, price, is_online, location)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  NOW() - INTERVAL '5 days' + INTERVAL '15 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '16 hours',
  'completed',
  160.00,
  true,
  'Google Meet'
);

-- Completed booking: Yael with Rachel
INSERT INTO bookings (teacher_id, student_id, subject_id, start_at, end_at, status, price, is_online, location)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  NOW() - INTERVAL '10 days' + INTERVAL '17 hours',
  NOW() - INTERVAL '10 days' + INTERVAL '18 hours',
  'completed',
  200.00,
  false,
  'בית הקפה "ארומה" דיזנגוף סנטר'
);

-- ============================================
-- SAMPLE REVIEWS
-- ============================================

-- Review for David Levy
INSERT INTO reviews (booking_id, teacher_id, student_id, rating, text)
VALUES (
  (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000002' AND status = 'completed' LIMIT 1),
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  5,
  'מורה מעולה! דוד הסביר בצורה ברורה ונעימה. הרגשתי שאני באמת משתפרת באנגלית.'
);

-- Review for Rachel Ben-Ami
INSERT INTO reviews (booking_id, teacher_id, student_id, rating, text)
VALUES (
  (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000003' AND status = 'completed' LIMIT 1),
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001',
  5,
  'רחל פשוט מדהימה! הפיזיקה נעשתה הרבה יותר מובנת אחרי השיעור איתה. ממליצה בחום!'
);

-- ============================================
-- STUDENT CREDITS
-- ============================================

-- Initialize credits for Yael
INSERT INTO student_credits (student_id, balance)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  500.00
);

-- ============================================
-- CREDIT TRANSACTIONS
-- ============================================

-- Initial purchase
INSERT INTO credit_transactions (student_id, amount, type, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  1000.00,
  'purchase',
  'רכישה ראשונית של קרדיטים'
);

-- Used for David Levy lesson
INSERT INTO credit_transactions (student_id, amount, type, booking_id, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  -160.00,
  'used',
  (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000002' AND status = 'completed' LIMIT 1),
  'תשלום עבור שיעור עם דוד לוי'
);

-- Used for Rachel lesson
INSERT INTO credit_transactions (student_id, amount, type, booking_id, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  -200.00,
  'used',
  (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000003' AND status = 'completed' LIMIT 1),
  'תשלום עבור שיעור עם רחל בן עמי'
);

-- Bonus credits
INSERT INTO credit_transactions (student_id, amount, type, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  50.00,
  'bonus',
  'בונוס קרדיטים למשתמשת חדשה'
);

-- Used for upcoming Sarah lesson (reserved)
INSERT INTO credit_transactions (student_id, amount, type, booking_id, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  -180.00,
  'used',
  (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000001' AND status = 'confirmed' LIMIT 1),
  'תשלום עבור שיעור עם שרה כהן'
);

-- Refund example (cancelled lesson)
INSERT INTO credit_transactions (student_id, amount, type, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  10.00,
  'refund',
  'החזר עבור שיעור שבוטל'
);

-- ============================================
-- SAMPLE NOTIFICATIONS
-- ============================================

-- Lesson reminder for student
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'LESSON_REMINDER_STUDENT',
  'תזכורת לשיעור',
  'השיעור שלך עם שרה כהן מתחיל בעוד 24 שעות',
  jsonb_build_object(
    'booking_id', (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000001' AND status = 'confirmed' LIMIT 1),
    'teacher_name', 'שרה כהן',
    'subject', 'מתמטיקה',
    'start_time', (SELECT start_at FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000001' AND status = 'confirmed' LIMIT 1)
  ),
  false
);

-- Booking confirmed
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'BOOKING_CONFIRMED',
  'השיעור אושר!',
  'המורה שרה כהן אישרה את השיעור שלך',
  jsonb_build_object(
    'booking_id', (SELECT id FROM bookings WHERE teacher_id = '10000000-0000-0000-0000-000000000001' AND status = 'confirmed' LIMIT 1),
    'teacher_name', 'שרה כהן'
  ),
  true
);

-- Review received (for teacher)
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'REVIEW_RECEIVED',
  'קיבלת ביקורת חדשה!',
  'יעל ברק נתנה לך 5 כוכבים',
  jsonb_build_object(
    'review_id', (SELECT id FROM reviews WHERE teacher_id = '10000000-0000-0000-0000-000000000002' LIMIT 1),
    'student_name', 'יעל ברק',
    'rating', 5
  ),
  false
);

-- ============================================
-- SUMMARY
-- ============================================

-- This seed file creates:
-- ✓ 12 subjects across different categories
-- ✓ 8 teacher profiles with realistic Hebrew names and bios
-- ✓ 1 student profile for testing
-- ✓ Teacher-subject associations
-- ✓ Sample availability schedules for teachers
-- ✓ 3 sample bookings (1 future, 2 completed)
-- ✓ 2 sample reviews
-- ✓ Student credits and transaction history
-- ✓ 3 sample notifications

-- To run this seed file:
-- 1. First run schema.sql to create all tables
-- 2. Then run this seed.sql to populate with sample data
-- 3. Note: You'll need to create corresponding auth.users entries
--    for the profile IDs to work in production
