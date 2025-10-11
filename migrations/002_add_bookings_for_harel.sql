-- Migration: Add bookings for Harel Aronovich
-- Date: 2025-10-11
-- Description: Add upcoming and past lessons for testing

-- Harel's ID: b1a05c3d-f63b-4e14-bb92-85a77a040bd3
-- Teachers: Daniel Alon, Tamar Goldstein, David Levi
-- Subjects: Mathematics, English, Physics

-- ============================================
-- PAST BOOKINGS (Completed lessons)
-- ============================================

-- Lesson 1: Mathematics with Daniel Alon - 2 weeks ago
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb01-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000008', -- דניאל אלון
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '11111111-1111-1111-1111-111111111111', -- מתמטיקה
  NOW() - INTERVAL '14 days' + INTERVAL '16 hours',
  NOW() - INTERVAL '14 days' + INTERVAL '17 hours',
  'completed',
  150,
  true,
  NULL,
  'שיעור חזרה לפני הבחינה',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
);

-- Lesson 2: English with Tamar Goldstein - 1 week ago
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb02-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000007', -- תמר גולדשטיין
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '22222222-2222-2222-2222-222222222222', -- אנגלית
  NOW() - INTERVAL '7 days' + INTERVAL '14 hours',
  NOW() - INTERVAL '7 days' + INTERVAL '15 hours 30 minutes',
  'completed',
  180,
  false,
  'תל אביב, רחוב הרצל 45',
  'שיפור דיבור ושיחה',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
);

-- Lesson 3: Physics with David Levi - 5 days ago
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb03-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002', -- דוד לוי
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '33333333-3333-3333-3333-333333333333', -- פיזיקה
  NOW() - INTERVAL '5 days' + INTERVAL '18 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '19 hours 30 minutes',
  'completed',
  160,
  true,
  NULL,
  'מכניקה קלאסית - חוקי ניוטון',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
);

-- Lesson 4: Mathematics with Daniel Alon - 3 days ago
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb04-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000008', -- דניאל אלון
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '11111111-1111-1111-1111-111111111111', -- מתמטיקה
  NOW() - INTERVAL '3 days' + INTERVAL '15 hours',
  NOW() - INTERVAL '3 days' + INTERVAL '16 hours',
  'completed',
  150,
  true,
  NULL,
  'אלגברה לינארית - מטריצות',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- ============================================
-- UPCOMING BOOKINGS (Future lessons)
-- ============================================

-- Lesson 5: English with Tamar Goldstein - Tomorrow
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb05-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000007', -- תמר גולדשטיין
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '22222222-2222-2222-2222-222222222222', -- אנגלית
  NOW() + INTERVAL '1 day' + INTERVAL '16 hours',
  NOW() + INTERVAL '1 day' + INTERVAL '17 hours 30 minutes',
  'confirmed',
  180,
  true,
  NULL,
  'הכנה למבחן בעל פה',
  NOW(),
  NOW()
);

-- Lesson 6: Physics with David Levi - In 3 days
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb06-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000002', -- דוד לוי
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '33333333-3333-3333-3333-333333333333', -- פיזיקה
  NOW() + INTERVAL '3 days' + INTERVAL '14 hours',
  NOW() + INTERVAL '3 days' + INTERVAL '15 hours 30 minutes',
  'confirmed',
  160,
  false,
  'רמת גן, שדרות בן גוריון 12',
  'אלקטרומגנטיות - שדות חשמליים',
  NOW(),
  NOW()
);

-- Lesson 7: Mathematics with Daniel Alon - In 5 days
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb07-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000008', -- דניאל אלון
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '11111111-1111-1111-1111-111111111111', -- מתמטיקה
  NOW() + INTERVAL '5 days' + INTERVAL '17 hours',
  NOW() + INTERVAL '5 days' + INTERVAL '18 hours',
  'confirmed',
  150,
  true,
  NULL,
  'חשבון אינפיניטסימלי - אינטגרלים',
  NOW(),
  NOW()
);

-- Lesson 8: English with Tamar Goldstein - In 1 week
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb08-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000007', -- תמר גולדשטיין
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '22222222-2222-2222-2222-222222222222', -- אנגלית
  NOW() + INTERVAL '7 days' + INTERVAL '15 hours',
  NOW() + INTERVAL '7 days' + INTERVAL '16 hours 30 minutes',
  'confirmed',
  180,
  true,
  NULL,
  'כתיבה אקדמית באנגלית',
  NOW(),
  NOW()
);

-- Lesson 9: Physics with David Levi - In 10 days
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb09-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000002', -- דוד לוי
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '33333333-3333-3333-3333-333333333333', -- פיזיקה
  NOW() + INTERVAL '10 days' + INTERVAL '16 hours',
  NOW() + INTERVAL '10 days' + INTERVAL '17 hours 30 minutes',
  'confirmed',
  160,
  false,
  'תל אביב, רחוב דיזנגוף 100',
  'מכניקת קוונטים - הקדמה',
  NOW(),
  NOW()
);

-- Add one pending booking (waiting for confirmation)
INSERT INTO bookings (
  id,
  teacher_id,
  student_id,
  subject_id,
  start_at,
  end_at,
  status,
  price,
  is_online,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  'bbbbbb10-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000008', -- דניאל אלון
  'b1a05c3d-f63b-4e14-bb92-85a77a040bd3', -- הראל ארונוביץ
  '11111111-1111-1111-1111-111111111111', -- מתמטיקה
  NOW() + INTERVAL '12 days' + INTERVAL '18 hours',
  NOW() + INTERVAL '12 days' + INTERVAL '19 hours',
  'pending',
  150,
  true,
  NULL,
  'חזרה כללית לקראת הבחינה הסופית',
  NOW(),
  NOW()
);

-- ============================================
-- Summary
-- ============================================
-- Total bookings added: 10
-- Past/Completed: 4
-- Upcoming/Confirmed: 5
-- Pending: 1
-- Teachers: דניאל אלון, תמר גולדשטיין, דוד לוי
-- Subjects: מתמטיקה, אנגלית, פיזיקה
