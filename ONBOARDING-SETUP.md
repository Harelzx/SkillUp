# Teacher Onboarding System - Setup Instructions

## ✅ Implementation Complete!

The teacher onboarding system has been implemented. New teachers will be required to complete their profile before accessing the app.

## 📋 Setup Steps

### 1. Run Migration 018

**Option A: Via Supabase SQL Editor**
1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New Query
4. Copy/paste content from `migrations/018_add_profile_completed_flag.sql`
5. Click **Run**

**Option B: Via Command Line (if you have Supabase CLI)**
```bash
supabase db push migrations/018_add_profile_completed_flag.sql
```

### 2. Verify Migration

Run this query in Supabase SQL Editor to verify:
```sql
-- Check that column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'profile_completed';

-- Check existing teachers
SELECT
  id,
  display_name,
  role,
  profile_completed,
  hourly_rate IS NOT NULL as has_rate,
  EXISTS(SELECT 1 FROM teacher_subjects WHERE teacher_id = profiles.id) as has_subjects
FROM profiles
WHERE role = 'teacher'
ORDER BY created_at DESC
LIMIT 10;

-- Should show all existing teachers with profile_completed = TRUE
-- and new teachers with profile_completed = FALSE
```

### 3. Test the Flow

#### Test with Existing Teacher (should work normally)
1. Login as existing teacher (e.g., `sarah.cohen@skillup.co.il`)
2. Should go directly to teacher dashboard
3. No onboarding modal should appear

#### Test with New Teacher
1. **Create New Teacher Account**:
   - Use signup screen
   - Select "מורה" (Teacher)
   - Fill in: email, password, name
   - Complete signup

2. **Expected Behavior**:
   - After signup, user is logged in
   - Redirected to teacher interface
   - **Onboarding modal appears immediately** ✅
   - Modal cannot be dismissed (no X button)
   - Must complete all 4 steps:
     - **Step 1**: Name, Phone, Bio
     - **Step 2**: Subjects, Hourly Rate
     - **Step 3**: City, Lesson Modes
     - **Step 4**: Review & Confirm
   - Click "שמור והתחל" (Save & Start)
   - Modal closes, redirected to teacher home
   - Can now use the app normally

3. **Test Persistence**:
   - Logout
   - Login again with same teacher
   - Should go directly to dashboard (no modal)

#### Test Edge Cases
1. **Incomplete Submission**:
   - Start onboarding but don't complete
   - Force close app
   - Login again → Modal should appear again ✅

2. **Navigation Blocking**:
   - While modal is open, try pressing back button
   - Modal should stay open (cannot escape)

## 🎨 What Was Changed

### New Files (3)
1. **`migrations/018_add_profile_completed_flag.sql`**
   - Adds `profile_completed` column to profiles table
   - Sets existing teachers to TRUE (grandfathered)
   - Sets students to TRUE (don't need onboarding)

2. **`src/components/teacher/TeacherOnboardingModal.tsx`**
   - Full-screen modal (984 lines)
   - 4-step wizard with validation
   - Matches signup design (LinearGradient, step indicators)
   - Cannot be dismissed until completed

3. **`ONBOARDING-SETUP.md`** (this file)
   - Setup and testing instructions

### Modified Files (3)
1. **`src/lib/supabase.ts`**
   - Added `profileCompleted?: boolean` to Profile interface

2. **`src/features/auth/auth-context.tsx`**
   - Fetch `profile_completed` from database (3 locations)
   - Transform `profile_completed` to `profileCompleted`

3. **`app/(teacher)/_layout.tsx`**
   - Added onboarding check: `if (!profile.profileCompleted)`
   - Shows `<TeacherOnboardingModal>` if needed
   - Blocks access to tabs until completed

## 🔍 Troubleshooting

### Modal doesn't appear for new teacher
**Check**:
```sql
SELECT id, display_name, role, profile_completed
FROM profiles
WHERE email = 'your-test-teacher@email.com';
```
- Should show `profile_completed: false` for new teacher
- If TRUE, manually set to FALSE: `UPDATE profiles SET profile_completed = FALSE WHERE id = '...'`

### Existing teachers see modal
**Check**:
```sql
-- Find teachers with incomplete profiles
SELECT
  id,
  display_name,
  hourly_rate,
  (SELECT COUNT(*) FROM teacher_subjects WHERE teacher_id = profiles.id) as subject_count,
  profile_completed
FROM profiles
WHERE role = 'teacher' AND profile_completed = FALSE;
```
- Migration should have set them to TRUE
- If FALSE, re-run migration or manually update:
```sql
UPDATE profiles
SET profile_completed = TRUE
WHERE role = 'teacher'
  AND display_name IS NOT NULL
  AND hourly_rate IS NOT NULL
  AND EXISTS (SELECT 1 FROM teacher_subjects WHERE teacher_id = profiles.id);
```

### Modal crashes or doesn't submit
**Check console logs**:
- Look for errors in Expo/Metro bundler
- Check network tab for failed API calls
- Verify `updateTeacherProfile` and `updateTeacherSubjects` functions exist

### After completing onboarding, modal still appears
**Possible causes**:
1. Database update failed - check Supabase logs
2. Profile not refetched - try logout/login
3. Browser cache - clear app data

**Manual fix**:
```sql
UPDATE profiles SET profile_completed = TRUE WHERE id = 'teacher-user-id';
```

## 📊 Database Schema Changes

### Before
```sql
profiles (
  id UUID,
  role user_role,
  display_name TEXT,
  -- ... other columns
)
```

### After
```sql
profiles (
  id UUID,
  role user_role,
  display_name TEXT,
  -- ... other columns
  profile_completed BOOLEAN DEFAULT FALSE  -- ✅ NEW
)
```

### Index Created
```sql
CREATE INDEX idx_profiles_completed ON profiles(profile_completed)
WHERE profile_completed = FALSE;
```
- Optimizes queries for incomplete profiles
- Only indexes rows where `profile_completed = FALSE`

## 🚀 Rollback (if needed)

If you need to remove this feature:

```sql
-- Remove the column
ALTER TABLE profiles DROP COLUMN IF EXISTS profile_completed;

-- Remove the index
DROP INDEX IF EXISTS idx_profiles_completed;
```

Then revert code changes:
- Delete `src/components/teacher/TeacherOnboardingModal.tsx`
- Revert `app/(teacher)/_layout.tsx`
- Revert `src/lib/supabase.ts`
- Revert `src/features/auth/auth-context.tsx`

## 📝 Next Steps (Optional Enhancements)

1. **Add photo upload** in Step 1
2. **Add video introduction** in Step 1
3. **Add education/experience fields** in Step 2
4. **Add languages** in Step 3
5. **Add teaching approach/style** in Step 4
6. **Save draft progress** to allow resuming later
7. **Add skip button** (with warning) for testing
8. **Send welcome email** after completion

---

**Implementation Date**: 2025-10-17
**Status**: ✅ Ready for Testing
