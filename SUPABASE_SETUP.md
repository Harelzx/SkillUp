# Supabase Setup Guide - SkillUp Teachers

Complete guide for setting up and configuring Supabase backend for the SkillUp Teachers application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#create-supabase-project)
3. [Database Setup](#database-setup)
4. [Authentication Setup](#authentication-setup)
5. [Storage Setup](#storage-setup)
6. [Environment Configuration](#environment-configuration)
7. [Testing the Setup](#testing-the-setup)
8. [API Usage Examples](#api-usage-examples)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js 18+ installed
- SkillUp project cloned locally
- Expo CLI installed (`npm install -g expo-cli`)

---

## Create Supabase Project

### Step 1: Create New Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `skillup-teachers-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to Israel (e.g., Frankfurt, eu-central-1)
   - **Plan**: Free tier is sufficient for development
4. Click "Create new project"
5. Wait 2-3 minutes for project initialization

### Step 2: Get Project Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
3. Keep these safe - you'll need them for the `.env` file

---

## Database Setup

### Step 1: Enable Required Extensions

1. Go to **Database** → **Extensions** in Supabase dashboard
2. Enable the following extensions:
   - `uuid-ossp` (for UUID generation)
   - `pg_trgm` (for text search)

### Step 2: Run Schema SQL

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste into the SQL editor
5. Click "Run" (bottom right)
6. Wait for completion (should take 5-10 seconds)
7. You should see "Success. No rows returned" message

### Step 3: Verify Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see 11 tables:
   - `profiles`
   - `subjects`
   - `teacher_subjects`
   - `bookings`
   - `reviews`
   - `teacher_availability`
   - `payment_intents`
   - `payout_accounts`
   - `student_credits`
   - `credit_transactions`
   - `notifications`

### Step 4: Seed Sample Data (Optional)

1. Go back to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/seed.sql` from this project
4. Paste into the SQL editor
5. Click "Run"
6. This will create:
   - **9 auth.users** (8 teachers + 1 student) with email/password
   - **12 subjects** (Math, English, Physics, etc.)
   - **8 sample teacher profiles** with Hebrew names and bios
   - **1 sample student profile**
   - **Sample bookings, reviews, and transactions**

**Important Notes**:
- The seed data creates users directly in `auth.users` table for testing
- All test users have password: `teacher123` or `student123`
- Test user emails: `sarah.cohen@skillup.co.il`, `david.levy@skillup.co.il`, etc.
- Uses `ON CONFLICT DO NOTHING` so safe to run multiple times
- In production, use Supabase Auth API instead of direct SQL inserts

**Login Credentials for Testing**:
```
Teachers:
- sarah.cohen@skillup.co.il / teacher123
- david.levy@skillup.co.il / teacher123
(+ 6 more teachers)

Students:
- yael.barak@student.co.il / student123
```

---

## Authentication Setup

### Step 1: Configure Auth Settings

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. **Site URL**: Set to `skillup://` (for deep linking)
3. **Redirect URLs**: Add the following:
   ```
   skillup://
   skillup://auth/callback
   exp://localhost:8081
   ```

### Step 2: Enable Email Authentication

1. In **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. Configure email templates (optional):
   - Confirmation email
   - Reset password email
   - Magic link email

### Step 3: Configure Social Auth (Optional)

For future implementation:
- **Google**: Enable and configure OAuth credentials
- **Apple**: Enable and configure Sign in with Apple
- **Facebook**: Enable and configure Facebook Login

### Step 4: Set Up Row Level Security (RLS)

RLS policies are already included in `schema.sql`. To verify:

1. Go to **Authentication** → **Policies**
2. Select each table and verify policies exist
3. Key policies:
   - Users can only see their own profiles
   - Students can see teacher profiles
   - Users can only see their own bookings
   - Only students who completed lessons can create reviews

---

## Storage Setup

### Step 1: Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Click "New bucket"
3. Create the following buckets:

#### Avatars Bucket
- **Name**: `avatars`
- **Public**: ✅ Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Documents Bucket (for future use)
- **Name**: `documents`
- **Public**: ❌ No
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, image/jpeg, image/png`

### Step 2: Configure Storage Policies

For the `avatars` bucket:

1. Go to bucket → **Policies**
2. Add policy "Users can upload their own avatar":
   ```sql
   CREATE POLICY "Users can upload avatars"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'avatars' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

3. Add policy "Anyone can view avatars":
   ```sql
   CREATE POLICY "Public can view avatars"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'avatars');
   ```

---

## Environment Configuration

### Step 1: Create `.env` File

In your project root, create a `.env` file:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe Configuration (for future)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### Step 2: Update Values

Replace the placeholder values:
- `your-project-id.supabase.co` → Your actual Supabase URL
- `your-anon-key-here` → Your actual anon public key

### Step 3: Verify `.env` is in `.gitignore`

Check that `.env` is listed in `.gitignore`:
```
.env
.env.local
```

**NEVER commit the `.env` file to git!**

---

## Testing the Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm start
```

### Step 3: Test Database Connection

Create a test file `test-supabase.ts`:

```typescript
import { supabase } from './src/lib/supabase';

async function testConnection() {
  try {
    // Test subjects query
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .limit(5);

    if (error) throw error;

    console.log('✅ Supabase connection successful!');
    console.log('Subjects:', subjects);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

Run with:
```bash
npx ts-node test-supabase.ts
```

### Step 4: Test Authentication

Try creating a test user through the app's signup screen, or use Supabase dashboard:

1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Fill in email and password
4. Click "Create user"

---

## API Usage Examples

### Get Featured Teachers

```typescript
import { getFeaturedTeachers } from '@/src/services/api';

const teachers = await getFeaturedTeachers(10);
console.log('Featured teachers:', teachers);
```

### Create a Booking

```typescript
import { createBooking } from '@/src/services/api';

const booking = await createBooking({
  teacherId: 'teacher-uuid-here',
  subjectId: 'subject-uuid-here',
  startAt: '2025-10-15T16:00:00Z',
  endAt: '2025-10-15T17:00:00Z',
  isOnline: true,
  notes: 'First lesson - introduction to algebra',
});
```

### Get My Bookings

```typescript
import { getMyBookings } from '@/src/services/api';

const { upcoming } = await getMyBookings({ upcoming: true });
console.log('Upcoming lessons:', upcoming);
```

### Purchase Credits

```typescript
import { purchaseCredits } from '@/src/services/api';

const transaction = await purchaseCredits(500); // ₪500
console.log('Credits purchased:', transaction);
```

### Create Review

```typescript
import { createReview } from '@/src/services/api';

const review = await createReview({
  bookingId: 'booking-uuid-here',
  teacherId: 'teacher-uuid-here',
  rating: 5,
  text: 'מורה מעולה! הסבירה בצורה ברורה ונעימה.',
});
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Cause**: Database schema not created

**Solution**:
1. Go to SQL Editor in Supabase
2. Run `supabase/schema.sql` again
3. Check for any error messages

### Issue: "JWTExpired" or "Invalid JWT"

**Cause**: Auth token expired

**Solution**:
1. Log out and log back in
2. Check that `autoRefreshToken: true` is set in Supabase client config

### Issue: "Row Level Security policy violation"

**Cause**: User doesn't have permission for the operation

**Solution**:
1. Go to **Authentication** → **Policies** in Supabase
2. Check that policies exist for the table
3. Verify the policy conditions match your use case

### Issue: "Cannot connect to Supabase"

**Cause**: Wrong URL or key in `.env`

**Solution**:
1. Verify `.env` file exists in project root
2. Check URL and anon key are correct
3. Restart development server (`npm start`)
4. Check network connection

### Issue: "Schema validation error"

**Cause**: API response doesn't match TypeScript types

**Solution**:
1. Regenerate database types:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
   ```
2. Update API types in `src/types/api.ts` if needed

---

## Next Steps

1. **Update Screens**: Integrate API calls into existing screens (see `CLAUDE.md` for screen list)
2. **Real-time Subscriptions**: Implement real-time updates for bookings and notifications
3. **Stripe Integration**: Set up Stripe for payments
4. **Push Notifications**: Configure Expo notifications
5. **Error Handling**: Add proper error handling and user feedback
6. **Testing**: Write tests for API functions

---

## Database Schema Overview

### Core Tables

- **profiles**: Extended user information (teachers + students)
- **subjects**: Available teaching subjects (Math, English, etc.)
- **teacher_subjects**: Links teachers to subjects they teach
- **bookings**: Lesson appointments between students and teachers
- **reviews**: Student feedback on completed lessons
- **teacher_availability**: Weekly schedule for each teacher

### Payment Tables

- **student_credits**: Current credit balance for each student
- **credit_transactions**: History of all credit purchases/usage
- **payment_intents**: Stripe payment tracking
- **payout_accounts**: Stripe Connect accounts for teachers

### System Tables

- **notifications**: In-app notifications for users

### Key Views

- **teacher_profiles_with_stats**: Pre-joined view with ratings and review counts

### Helper Functions

- `get_teacher_avg_rating(teacher_uuid)`: Calculate average rating
- `get_teacher_review_count(teacher_uuid)`: Count total reviews
- `add_student_credits(student_id, amount)`: Add/deduct credits safely

---

## Security Considerations

1. **Never expose service_role key**: Only use anon key in mobile app
2. **RLS is mandatory**: All tables have Row Level Security enabled
3. **Validate on backend**: Don't trust client-side validation alone
4. **Use HTTPS only**: Supabase enforces SSL by default
5. **Rotate keys regularly**: Change API keys every 90 days in production
6. **Monitor usage**: Check Supabase dashboard for suspicious activity

---

## Support & Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Project CLAUDE.md**: See main documentation for app-specific details
- **API Reference**: See `src/services/api/` for function documentation

---

*Last updated: 2025-10-11*
*SkillUp Teachers v1.0*
