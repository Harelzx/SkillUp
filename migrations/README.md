# Database Migrations

This directory contains SQL migration files for the Supabase database.

## Setup

1. **Get your Service Role Key:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
   - Navigate to Settings → API
   - Copy the **service_role** key (NOT the anon key!)

2. **Add to `.env` file:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

   ⚠️ **Important:** Never commit the `.env` file to git!

## Running Migrations

### Option 1: Using the migration script (Requires Service Role Key)

```bash
node scripts/run-migration.js migrations/001_add_education_column.sql
```

### Option 2: Manual (Recommended for now)

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of the migration file
3. Paste and execute

## Migration Files

- `000_enable_extensions.sql` - **MUST RUN FIRST!** Enables required PostgreSQL extensions:
  - `uuid-ossp` - UUID generation (required for all tables)
  - `pg_trgm` - Text search capabilities
  - ⚠️ **If you see "uuid_generate_v4() does not exist" error, run this migration!**
  - See [SUPABASE_UUID_FIX.md](../SUPABASE_UUID_FIX.md) for detailed instructions
- `001_add_education_column.sql` - Adds education field to teacher profiles
- `002_add_bookings_for_harel.sql` - Additional booking enhancements
- `003_add_email_to_profiles.sql` - Adds email column to profiles
- `004_fix_rls_policies.sql` - Fixes RLS policies
- `005_enhance_booking_schema.sql` - **NEW!** Complete booking flow support:
  - Adds `booking_mode` enum (online/student_location/teacher_location)
  - Enhances `bookings` table: mode, duration_minutes, credits_applied, coupon_code, timezone, source
  - Creates `refunds` table with RLS
  - Creates `audit_log` table for tracking
  - Adds refund processing function
  - Performance indexes for booking queries

## Creating New Migrations

1. Create a new file: `migrations/XXX_description.sql`
2. Write your SQL statements
3. Run using one of the methods above

## Notes

- Migrations are numbered sequentially (001, 002, etc.)
- Always test migrations in development first
- Include rollback instructions in migration comments if possible
