# Credits Timeout Fix

## Issue

The app was experiencing a timeout error when trying to fetch student credits:

```
❌ [CreditsContext] Error fetching credits: Credits fetch timeout
```

## Root Cause

The `getCreditBalance()` function in `src/services/api/creditsAPI.ts` was checking for the existence of a `students` table (introduced in migration 021), which may not exist yet in your Supabase database. This caused the query to hang and eventually timeout after 15 seconds.

## Immediate Fix (Applied)

The `getCreditBalance()` function has been updated to:
1. Use `maybeSingle()` instead of `single()` to avoid throwing errors on missing results
2. Gracefully handle the case where the `students` table doesn't exist yet
3. Fall back to checking the `profiles` table if needed
4. Return 0 for non-student users instead of throwing errors

This allows the app to work both before and after running migration 021.

## Proper Long-term Fix (Recommended)

To fully support the new database schema, you should run the following migrations on your Supabase database:

### Step 1: Run Migration 021 - Split Students/Teachers Tables

This creates separate `students` and `teachers` tables and migrates data from the `profiles` table.

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create a new query
# 3. Copy/paste the contents of migrations/021_split_students_teachers_tables.sql
# 4. Run the query
```

### Step 2: Run Migration 024 - Complete Data Migration

This ensures all profile data is properly migrated to the new tables.

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create a new query
# 3. Copy/paste the contents of migrations/024_migrate_profiles_to_students_teachers.sql
# 4. Run the query
```

### Step 3: Run Migration 025 - Add Insert Policies

This adds the necessary RLS policies for inserting new students and teachers.

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create a new query
# 3. Copy/paste the contents of migrations/025_add_insert_policies_students_teachers.sql
# 4. Run the query
```

## Verification

After running the migrations, verify everything is working:

```sql
-- Check that students table exists and has data
SELECT COUNT(*) FROM students;

-- Check that teachers table exists and has data
SELECT COUNT(*) FROM teachers;

-- Check that your test user exists in the appropriate table
SELECT * FROM students WHERE email = 'your-test-email@example.com';
-- OR
SELECT * FROM teachers WHERE email = 'your-test-email@example.com';
```

## Testing

After the fix, you should:
1. Restart the Expo dev server: `npm start`
2. Reload the app
3. The credits should now load without timeout errors
4. Check the console logs - you should see:
   - `🔵 [CreditsContext] Fetching credits balance from DB...`
   - `✅ [CreditsContext] Fetched credits balance: 0` (or whatever balance exists)

## Additional Notes

- The immediate fix ensures backward compatibility with databases that haven't run migration 021 yet
- For new installations, you should run all migrations in order (001-025) before using the app
- The `profiles` table is kept for backward compatibility even after running the migrations
