# Fix: Teacher not found or inactive error

## Problem
When trying to book a lesson with a teacher, the system returns "Teacher not found or inactive" error. This is because the `create_booking` RPC function is still querying the old `profiles` table instead of the new `teachers` table.

## Solution
Migration 020 has been updated to query from the `teachers` table instead of `profiles`. Run this migration to fix the issue.

## How to run the migration

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option 2: Manual SQL execution
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `migrations/020_update_create_booking_rpc.sql`
4. Execute the SQL

### Option 3: Using the migration file directly
Run the migration file against your Supabase database using your preferred method.

## What changed
- Line 63: Changed from `profiles` table to `teachers` table for teacher lookup
- Line 100: Changed from `profiles` table to `students` table for student lookup
- Line 181: Fixed student name display to use `first_name` and `last_name` from `students` table

## After running the migration
Try booking a lesson again with a teacher. The error should be resolved.
