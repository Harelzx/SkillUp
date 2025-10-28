# 🔧 Run Migration 025 in Supabase

## Why?
This migration adds INSERT policies to the students and teachers tables, fixing the RLS violation error.

## How to Run:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL:

```sql
-- Add INSERT policy for students
DROP POLICY IF EXISTS "Students can insert own profile" ON students;
CREATE POLICY "Students can insert own profile"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for teachers
DROP POLICY IF EXISTS "Teachers can insert own profile" ON teachers;
CREATE POLICY "Teachers can insert own profile"
  ON teachers FOR INSERT
  WITH CHECK (auth.uid() = id);
```

3. Click **RUN** or press Ctrl+Enter
4. You should see: "✅ Added INSERT policies for students and teachers tables"

## After Running:
- Restart your app
- Try signing up/in again
- The RLS error should be gone!

