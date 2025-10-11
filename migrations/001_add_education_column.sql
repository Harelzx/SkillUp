-- Migration: Add education and languages columns to profiles table
-- Date: 2025-10-11
-- Description: Add education and languages fields as text arrays

-- 1. Add education column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS education TEXT[] DEFAULT '{}';

-- 2. Add languages column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['עברית'];

-- 3. Add comments to document the columns
COMMENT ON COLUMN profiles.education IS 'Array of education entries for teachers (e.g., degrees, certifications)';
COMMENT ON COLUMN profiles.languages IS 'Array of languages the teacher speaks';

-- 4. Add sample education and languages data for existing teachers
UPDATE profiles
SET
  education = ARRAY['תואר ראשון במתמטיקה - אוניברסיטת תל אביב', 'תואר שני בחינוך - האוניברסיטה העברית'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000001' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['תואר שני באנגלית - אוניברסיטת הרווארד', 'תואר ראשון בספרות - האוניברסיטה העברית'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000002' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['דוקטורט בפיזיקה - הטכניון', 'תואר שני במתמטיקה - אוניברסיטת תל אביב'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000003' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['תואר ראשון במדעי המחשב - אוניברסיטת תל אביב', 'קורסים מתקדמים ב-Full Stack Development - Google'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000004' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['דוקטורט בכימיה - הטכניון', 'תואר שני בכימיה אורגנית - אוניברסיטת בן גוריון'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000005' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['תואר במדעי החיים - אוניברסיטת תל אביב', 'הסמכה בהוראת ביולוגיה - משרד החינוך'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000006' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['תואר שני בספרות עברית - האוניברסיטה העברית', 'תואר ראשון בחינוך - סמינר הקיבוצים'],
  languages = ARRAY['עברית', 'אנגלית', 'ערבית']
WHERE id = '10000000-0000-0000-0000-000000000007' AND role = 'teacher';

UPDATE profiles
SET
  education = ARRAY['תואר במוזיקה - האקדמיה למוזיקה ירושלים', 'הסמכה בהוראת כלי נגינה - המכללה למוזיקה'],
  languages = ARRAY['עברית', 'אנגלית']
WHERE id = '10000000-0000-0000-0000-000000000008' AND role = 'teacher';

-- 5. Recreate the teacher_profiles_with_stats view to include education and languages
DROP VIEW IF EXISTS teacher_profiles_with_stats;

CREATE VIEW teacher_profiles_with_stats AS
SELECT
  p.id,
  p.role,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.video_url,
  p.phone_number,
  p.hourly_rate,
  p.experience_years,
  p.total_students,
  p.location,
  p.is_verified,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.languages,
  p.education,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.id)::integer as review_count,
  ARRAY_AGG(DISTINCT ts.subject_id) FILTER (WHERE ts.subject_id IS NOT NULL) as subject_ids,
  ARRAY_AGG(DISTINCT s.name_he) FILTER (WHERE s.name_he IS NOT NULL) as subject_names
FROM profiles p
LEFT JOIN teacher_subjects ts ON p.id = ts.teacher_id
LEFT JOIN subjects s ON ts.subject_id = s.id
LEFT JOIN reviews r ON p.id = r.teacher_id
WHERE p.role = 'teacher'
GROUP BY p.id, p.role, p.display_name, p.bio, p.avatar_url, p.video_url,
         p.phone_number, p.hourly_rate, p.experience_years, p.total_students,
         p.location, p.is_verified, p.is_active, p.created_at, p.updated_at,
         p.languages, p.education;

-- Grant permissions
GRANT SELECT ON teacher_profiles_with_stats TO anon, authenticated;
