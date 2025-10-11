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

- `001_add_education_column.sql` - Adds education field to teacher profiles

## Creating New Migrations

1. Create a new file: `migrations/XXX_description.sql`
2. Write your SQL statements
3. Run using one of the methods above

## Notes

- Migrations are numbered sequentially (001, 002, etc.)
- Always test migrations in development first
- Include rollback instructions in migration comments if possible
