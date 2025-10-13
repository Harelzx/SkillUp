# CLAUDE.md - SkillUp Teachers App

A modern React Native/Expo application for connecting students with teachers in Israel, featuring Hebrew language support and RTL layout.

---

## 📋 תוכן עניינים

1. [Project Overview](#project-overview)
2. [Quick Start Commands](#quick-start-commands)
3. [Project Structure](#project-structure)
4. [Core Technologies](#core-technologies)
5. [Teacher Interface](#teacher-interface)
6. [Student Interface](#student-interface)
7. [RTL Support](#rtl-support)
8. [Authentication Flow](#authentication-flow)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Development Guidelines](#development-guidelines)
11. [Testing Guide](#testing-guide)
12. [Deployment](#deployment)

---

## Project Overview

**SkillUp Teachers** is a mobile application built with Expo SDK 54 that connects students with private tutors. The app supports Hebrew language with full RTL (Right-to-Left) layout and includes features for finding teachers, booking lessons, managing profiles, and handling payments.

### Core Technologies
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: Expo Router (file-based routing)
- **UI Library**: Gluestack UI + NativeWind (Tailwind CSS)
- **Backend**: Supabase (authentication, database, storage)
- **State Management**: TanStack Query + Zustand
- **Payments**: Stripe Connect
- **Internationalization**: i18next with Hebrew/English support
- **Icons**: Lucide React Native

## Quick Start Commands

### Development
```bash
# Start development server
npm start
# or
npx expo start

# Start with cache cleared
npx expo start --clear

# Run on specific platforms
npx expo run:ios
npx expo run:android
```

### Building
```bash
# Prepare for native build (generates iOS/Android folders)
npx expo prebuild

# Clean prebuild
npx expo prebuild --clean

# Production builds with EAS
eas build --platform ios
eas build --platform android
```

### Type Checking & Linting
```bash
npm run type-check
npm run lint
```

## Project Structure

```
/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── src/                   # Source code
│   ├── context/           # React contexts (RTL, etc.)
│   ├── services/          # API services
│   ├── theme/             # Design system
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── ui/                    # UI component library
├── assets/                # Static assets
└── locales/               # Translation files
```

## Key Features & Implementation Notes

### RTL (Right-to-Left) Support
- **Context**: `src/context/RTLContext.tsx` provides RTL state management
- **Usage**: Components use `useRTL()` hook for layout direction
- **Implementation**: FlexDirection and text alignment automatically adjust

### Navigation Structure
- **Tab Navigation**: Home, Search, Lessons, Profile
- **File-based routing**: Each file in `app/` becomes a route
- **Hebrew labels**: All navigation uses i18next translations

### Profile Screen (`app/(tabs)/profile.tsx`)
- **Design**: Clean, modern vertical layout
- **User Data**: Name, phone, bio, avatar from Unsplash
- **Menu Structure**: Single unified card with all settings
- **RTL Support**: Icons and layout adapt to Hebrew reading direction

### Authentication Flow
- **Supabase Auth**: Email/password and social login
- **Route Protection**: Redirects unauthenticated users to login
- **User Types**: Students and Teachers with different app experiences

## Common Issues & Solutions

### TypeScript Image Styling
```tsx
// Issue: Image style type conflicts
<Image style={styles.avatarImage as any} />
// Solution: Use type assertion for ImageStyle compatibility
```

### Missing Assets for Build
```bash
# If prebuild fails due to missing notification-icon.png:
cp assets/icon.png assets/notification-icon.png
```

### RTL Layout Debugging
```tsx
// Use RTL context for conditional layout
const { getFlexDirection, isRTL } = useRTL();
<View style={{ flexDirection: getFlexDirection() }}>
```

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Gluestack UI components + custom styles
- **Translations**: All user-facing text through i18next

### RTL Best Practices
- Always use `getFlexDirection()` for layout containers
- Test both Hebrew and English layouts
- Icons may need horizontal flip: `scaleX: isRTL ? -1 : 1`
- Text alignment should respect reading direction

### File Naming
- **Pages**: kebab-case (e.g., `teacher-profile.tsx`)
- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

### State Management
- **Server State**: TanStack Query for API data
- **Client State**: Zustand stores for app state
- **Component State**: useState/useReducer for local state

## App Configuration

### Bundle Identifiers
- **iOS**: `com.skillup.teachers`
- **Android**: `com.skillup.teachers`

### Required Permissions
- **Calendar**: Read/write for lesson scheduling
- **Camera**: Profile photo capture
- **Photo Library**: Image selection
- **Face ID**: Biometric authentication

### Environment Variables
Create `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## Debugging & Testing

### Common Debug Commands
```bash
# View Metro bundler logs
npx expo start --dev-client

# Clear all caches
npx expo start --clear
rm -rf node_modules && npm install

# Reset Expo cache
npx expo install --fix
```

### Testing on Device
- **iOS**: Use Expo Go app or development build
- **Android**: Use Expo Go app or development build
- **Physical Device**: Recommended for testing RTL layouts

## Deployment Checklist

1. **Assets**: Ensure all required icons and splash screens exist
2. **Translations**: Complete Hebrew and English translations
3. **RTL Testing**: Verify layout in both directions
4. **Build**: Run `npx expo prebuild` successfully
5. **Environment**: Set production environment variables
6. **Store Listings**: Prepare Hebrew and English app store descriptions

---

## Additional Features & Updates

### Teacher Interface - Detailed Features

#### Dashboard Home
- **Notifications Banner**: Auto-rotating teacher alerts (10s interval)
- **Activity Stats Cards**:
  - Clean, minimal design
  - Right-aligned text (RTL)
  - No icons (professional look)
  - Consistent height (96px)
  - Subtle borders and shadows
- **Growth Chart**: 12-month revenue/lessons visualization with toggle

#### Calendar Features
- **Responsive Grid**: Dynamic cell sizing (minimum 44px)
- **Separated Layers**: Date numbers (top-right), lesson dots (bottom-center)
- **No Overlap**: Proper spacing between elements
- **Safe Area**: Proper padding on all devices
- **Accessibility**: Full labels and hints for screen readers

#### Navigation Enhancements
- **Dynamic Padding**: 12-34px based on device safe area
- **RTL Order**: Home | Calendar | Profile (right-to-left)
- **Shadow/Elevation**: Platform-specific depth effects
- **Min Height**: 64px for AA accessibility

### Authentication

The app uses Supabase Auth for user authentication:

**Login/Signup Flow**:
- Email/password authentication via Supabase
- Social logins: Apple (iOS), Google (cross-platform)
- Biometric authentication (Face ID / Touch ID) support
- Profile creation on signup with role selection (teacher/student)

**Role-based Access**:
- `role='teacher'` → Teacher interface (dashboard, calendar, profile)
- `role='student'` → Student interface (home, search, lessons, profile)
- Automatic routing based on user role after login

### RTL Implementation Details

**Key Patterns**:
```typescript
// Container with RTL flow
<View style={{ flexDirection: 'row-reverse', justifyContent: 'flex-start' }}>
  {/* flex-start = right side in row-reverse */}
</View>

// Text alignment (always use style, not prop)
<Typography style={{ textAlign: 'right' }}>Hebrew Text</Typography>

// Horizontal scrolling
<FlatList horizontal inverted={isRTL} data={items} />
```

**Common Mistakes to Avoid**:
- ❌ Using `align` prop on Typography components
- ❌ Using `justifyContent: 'flex-end'` with `row-reverse` (use `flex-start`)
- ❌ Forgetting `width: '100%'` on section titles
- ❌ Not using `inverted` on horizontal FlatLists

### Authentication Flow - Technical Details

**Login Process**:
1. User submits credentials
2. Double-tap prevention: `if (isLoading) return`
4. Mock auth or Supabase auth
5. Profile fetch with role
6. `redirectPostLogin(profile)` function
7. Role-based navigation:
   - Teacher: `router.replace('/(teacher)')`
   - Student/Default: `router.replace('/(tabs)')`
8. Fallback on error: Always redirect to student interface

**Security Features**:
- Role verification in teacher layout guard
- Session validation on app resume
- Auto-logout on role mismatch
- Secure session storage (Supabase JWT or mock)

### Testing Checklist

#### Pre-Deployment Tests
- [ ] Login as teacher → correct interface
- [ ] Login as student → correct interface
- [ ] Wrong password → error alert
- [ ] Double-tap login → prevented
- [ ] Logout → returns to login
- [ ] Calendar responsive on all devices
- [ ] Nav bar safe area on iPhone X+
- [ ] RTL layout on all screens
- [ ] All tap targets ≥44px
- [ ] Dark mode (if enabled)

#### Device-Specific Tests
- **iPhone SE**: Min cells 44px, readable text
- **iPhone 14 Pro**: Proper safe area, ~48px cells
- **iPad**: Scales properly, maintains aspect ratio
- **Android**: Gesture bar spacing, elevation visible

### File Changes Summary

**New Files (16)**:
- Teacher app: 5 files (~1,100 lines)
- Data layer: 2 files (~340 lines)
- Components: 1 file (~200 lines)
- Documentation: 8+ files (~2,700 lines)

**Modified Files (6)**:
- `app/_layout.tsx`: +4 lines (teacher route)
- `app/index.tsx`: +30 lines (role routing)
- `src/lib/i18n.ts`: +8 lines (translations)
- `app/(auth)/login.tsx`: +70 lines (redirect + DEV UI)
- `src/features/auth/auth-context.tsx`: +50 lines (DEV support)
- `app/(teacher)/_layout.tsx`: Updated (safe area)

**Total Code**: ~2,800 lines
**Total Docs**: ~2,700 lines
**Linter Errors**: 0 ✅

---

## Troubleshooting Reference

### Issue: "DEV users not accessible"
**Solution**: Ensure `npm start` (not production build). Check `console.log('DEV:', __DEV__)`.

### Issue: "Calendar cells overlapping"
**Solution**: Verify `justifyContent: 'space-between'` in cell content and `alignSelf: 'flex-end'` for date.

### Issue: "Text not right-aligned in RTL"
**Solution**: Use `textAlign: 'right'` in style object, not `align` prop.

### Issue: "Nav bar stuck to bottom edge"
**Solution**: Check `useSafeAreaInsets()` returns correct values. Should be 0-34px.

### Issue: "Role redirect not working"
**Solution**: Verify `signIn()` returns profile object. Check console logs.

---

## 🔧 Environment Setup

### Required Environment Variables
Create `.env` file in project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Stripe Configuration (future)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

**How to get Supabase keys:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy **Project URL** and **anon public key**
5. For migrations, copy **service_role key** (keep secret!)

**Security:**
- ⚠️ Never commit `.env` to git
- ✅ `.env` is already in `.gitignore`
- ✅ Only use `anon` key in mobile app
- ✅ Use `service_role` key only for backend/migrations

---

## 📁 API Structure

### Two Similar Files - Different Purposes

#### `teachersAPI.ts` (plural) - For Students
**Purpose:** Read-only API for students searching/viewing teachers

**Functions:**
- `getTeacherById(teacherId)` - View teacher profile
- `getTeachers({ filters })` - Search with filters
- `getFeaturedTeachers(limit)` - Homepage recommendations
- `getTeacherSubjects(teacherId)` - Teacher's subjects
- `getTeacherReviews(teacherId)` - Teacher reviews
- `getTeacherRatingStats(teacherId)` - Rating statistics

**Used by:**
- `app/(tabs)/search.tsx` - Teacher search
- `app/(tabs)/index.tsx` - Featured teachers
- `app/(tabs)/teacher/[id].tsx` - Teacher profile page

#### `teacherAPI.ts` (singular) - For Teachers
**Purpose:** Read-write API for teachers managing their profiles

**Functions:**
- `updateTeacherProfile(teacherId, updates)` - Update profile (via RPC)
- `getTeacherProfile(teacherId)` - Get profile for editing
- `getTeacherAvailabilitySlots(...)` - Manage availability
- `upsertAvailabilitySlots(...)` - Add/update slots
- `closeDay(teacherId, date)` - Close specific day
- `openDay(teacherId, date, options)` - Open day with schedule
- `deleteAvailabilitySlot(slotId)` - Remove slot
- `subscribeToTeacherAvailability(...)` - Realtime updates
- `subscribeToTeacherProfile(...)` - Profile updates

**Used by:**
- `app/(teacher)/edit-teacher-profile.tsx` - Profile editing
- `app/(teacher)/calendar.tsx` - Schedule management
- `app/(teacher)/profile.tsx` - Teacher profile

**Key Differences:**

| Aspect | teachersAPI.ts | teacherAPI.ts |
|--------|----------------|---------------|
| **User** | Students | Teachers |
| **Access** | READ-ONLY | READ-WRITE |
| **Main Table** | `teacher_profiles_with_stats` (VIEW) | `profiles` (TABLE) |
| **Updates** | ❌ No | ✅ Yes (via RPC) |
| **Availability** | Read only | Full management |
| **Security** | View-only RLS | Teacher can only update own profile |

---

## 🎯 Booking System

### Complete End-to-End Booking Flow

#### UI Flow (5 Steps)

**Files:**
- `app/(booking)/book-lesson.tsx` - Main booking screen
- `src/components/booking/BookingStepper.tsx` - Progress indicator
- `src/components/booking/BookingStep1.tsx` - Lesson details
- `src/components/booking/BookingStep2.tsx` - Date/time selection
- `src/components/booking/BookingStep3.tsx` - Location (dynamic)
- `src/components/booking/BookingStep4.tsx` - Pricing + credits
- `src/components/booking/BookingStep5.tsx` - Confirmation

**Step 1: Lesson Details**
- Subject selection
- Lesson type (online/at teacher/at student)
- Duration (45/60/90 minutes)
- Student level
- Notes

**Step 2: Date & Time**
- Calendar view
- Available time slots from teacher's schedule
- Realtime availability updates

**Step 3: Location**
- Shown only for in-person lessons
- Address input with validation
- Google Maps integration (future)

**Step 4: Pricing**
- Price calculation based on hourly rate
- Apply credits (partial or full)
- Coupon codes
- Final price display

**Step 5: Confirmation**
- Review all details
- Accept terms
- Confirm and pay

#### Backend Flow (Atomic Transaction)

**Database Changes:**

```
bookings table:
+ mode (online|student_location|teacher_location)
+ duration_minutes (45|60|90)
+ price_per_hour, total_price
+ credits_applied, coupon_code, discount_amount
+ timezone, source, student_level
+ currency

New tables:
- availability_slots (teacher schedule)
- payments (payment records)
- refunds (refund tracking)
- idempotency_requests (prevent duplicates)
- audit_log (action tracking)
```

**RPC Functions:**

1. **`create_booking()`** - Atomic booking creation
   - Validates duration (45/60/90)
   - Checks teacher/student active
   - Prevents double-booking
   - Verifies credit balance
   - Locks availability slot
   - Deducts credits
   - Simulates payment (80% success)
   - Creates notifications
   - Logs to audit trail
   - Broadcasts realtime updates

2. **`cancel_booking(reason, refund_method)`** - Cancel with refunds
   - **24+ hours**: 100% refund + credits back
   - **12-24 hours**: 50% refund + credits back
   - **<12 hours**: No refund + credits back
   - Releases availability slot
   - Creates refund record

3. **`reschedule_booking(booking_id, new_start_at)`** - Change date/time
   - Releases old slot
   - Locks new slot
   - Updates booking
   - Notifies teacher

**Realtime Updates:**

```typescript
// Teacher calendar updates
useTeacherBookingRealtime(teacherId, (event) => {
  // event.type: 'slot_booked' | 'slot_released' | 'booking_rescheduled'
  refetchCalendar();
});

// Student search updates
useAvailabilityRealtime((event) => {
  // event.type: 'slot_unavailable' | 'slot_available'
  refetchAvailableSlots();
});
```

#### Security Features

**RLS Policies:**
- Students see only their bookings
- Teachers see only their bookings
- No direct access to payments/refunds
- All critical operations via RPC only

**Overlap Prevention:**
```sql
-- Trigger prevents double-booking at DB level
CREATE TRIGGER prevent_booking_overlap_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_booking_overlap();
```

**Idempotency:**
```typescript
// Same request twice = same result
const key = `booking_${userId}_${teacherId}_${startAt}`;
// Second request returns original result without creating duplicate
```

### Migration Order

Run these in Supabase SQL Editor (Dashboard → SQL Editor → New Query):

1. **`migrations/005_enhance_booking_schema_safe.sql`**
   - Creates enums (booking_mode, payment_method, refund_method)
   - Adds booking table columns
   - Creates refunds + audit_log tables

2. **`migrations/006_safe.sql`**
   - Creates idempotency_requests table
   - Creates availability_slots table
   - Creates payments table
   - Creates RPC functions (create_booking, cancel_booking, reschedule_booking)

3. **`migrations/007_safe.sql`**
   - Creates RLS policies for all tables
   - Creates overlap prevention trigger
   - Creates helper functions (is_admin, can_access_booking)

4. **`migrations/008_safe.sql`**
   - Adds awaiting_payment status
   - Adds hold_expires_at + payment_method_selected
   - Updates create_booking for payment UI
   - Creates release_expired_holds() function

**Verify migrations:**
```sql
-- Check all components exist
SELECT typname FROM pg_type WHERE typname IN ('booking_mode', 'payment_method');
SELECT table_name FROM information_schema.tables WHERE table_name IN ('payments', 'refunds', 'availability_slots');
SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('create_booking', 'cancel_booking');
```

---

## 🗄️ Database Schema

### Core Tables

**profiles** - User information
```
id, role (teacher|student), display_name, phone_number,
email, bio, avatar_url, location, hourly_rate (teachers),
is_verified, is_active, total_students, created_at
```

**subjects** - Teaching subjects
```
id, name (Hebrew), name_en, category, icon, is_active
```

**teacher_subjects** - Teacher ↔ Subject mapping
```
id, teacher_id, subject_id
```

**bookings** - Lesson appointments
```
id, teacher_id, student_id, subject_id,
start_at, end_at, status, is_online, notes,
mode, duration_minutes, total_price, credits_applied,
coupon_code, location, student_level, timezone
```

**reviews** - Student feedback
```
id, booking_id, teacher_id, student_id,
rating (1-5), text, created_at
```

**availability_slots** - Teacher schedule
```
id, teacher_id, start_at, end_at, is_booked, booking_id
```

**student_credits** - Credit balances
```
id, student_id, balance, last_updated
```

**credit_transactions** - Credit history
```
id, student_id, booking_id, amount, type,
balance_after, reason, created_at
```

**payments** - Payment records
```
id, booking_id, student_id, method, amount,
currency, status, stripe_payment_intent_id
```

**refunds** - Refund records
```
id, booking_id, student_id, method, amount,
reason, processed_at
```

**notifications** - In-app notifications
```
id, user_id, type, title, message, is_read, created_at
```

**audit_log** - Action tracking
```
id, actor_user_id, action, entity, entity_id,
meta (JSONB), created_at
```

**idempotency_requests** - Duplicate prevention
```
id, idempotency_key, request_hash, booking_id,
response_data, expires_at
```

### Key Views

**teacher_profiles_with_stats** - Pre-joined teacher data
```sql
SELECT
  p.*,
  COUNT(DISTINCT ts.subject_id) as subject_count,
  AVG(r.rating) as avg_rating,
  COUNT(DISTINCT r.id) as review_count
FROM profiles p
LEFT JOIN teacher_subjects ts ON p.id = ts.teacher_id
LEFT JOIN reviews r ON p.id = r.teacher_id
WHERE p.role = 'teacher'
GROUP BY p.id;
```

---

## 📊 Supabase Setup

### Initial Setup Steps

1. **Create Project**
   - Go to https://supabase.com/dashboard
   - New Project → Choose name, password, region (eu-central-1 for Israel)
   - Wait 2-3 minutes for initialization

2. **Enable Extensions**
   - Database → Extensions
   - Enable: `uuid-ossp`, `pg_trgm`

3. **Run Schema**
   - SQL Editor → New Query
   - Copy/paste `supabase/schema.sql`
   - Run (creates all tables, RLS policies, functions)

4. **Run Migrations**
   - Run migrations 005-008 in order (see Migration Order above)

5. **Seed Data (Optional)**
   - SQL Editor → New Query
   - Copy/paste `supabase/seed.sql`
   - Creates 8 test teachers + 1 student
   - Login: `sarah.cohen@skillup.co.il` / `teacher123`

6. **Configure Auth**
   - Authentication → Settings
   - Site URL: `skillup://`
   - Redirect URLs: `skillup://`, `skillup://auth/callback`, `exp://localhost:8081`
   - Email confirmation: Disabled (for dev)

7. **Create Storage Buckets**
   - Storage → New Bucket
   - `avatars` (public, 2MB limit, images only)
   - `documents` (private, 10MB limit, PDFs + images)

### Testing Connection

```typescript
import { supabase } from './src/lib/supabase';

const { data, error } = await supabase.from('subjects').select('*').limit(5);
console.log('✅ Connected:', data);
```

---

## 🔄 Realtime Features

### Teacher Calendar Updates

```typescript
import { useTeacherBookingRealtime } from '@/hooks/useTeacherBookingRealtime';

useTeacherBookingRealtime(teacherId, (event) => {
  if (event.type === 'slot_booked') {
    // Refresh calendar when new booking arrives
    queryClient.invalidateQueries(['teacher-bookings']);
  }
});
```

### Availability Updates for Search

```typescript
import { useAvailabilityRealtime } from '@/hooks/useAvailabilityRealtime';

useAvailabilityRealtime((event) => {
  if (event.type === 'slot_unavailable') {
    // Hide slot that was just booked
    refetchAvailableSlots();
  }
});
```

### Profile Updates

```typescript
import { subscribeToTeacherProfile } from '@/services/api/teacherAPI';

subscribeToTeacherProfile(teacherId, (updatedProfile) => {
  // Update UI when teacher changes profile
  setProfile(updatedProfile);
});
```

---

## 🧪 Testing Scenarios

### Booking Tests

- [ ] Create booking without credits → full payment
- [ ] Create booking with partial credits → reduced payment
- [ ] Create booking fully covered by credits → no payment
- [ ] Payment failure (20% simulated) → rollback all changes
- [ ] Try to book already-taken slot → error "השעה כבר תפוסה"
- [ ] Cancel booking 24+ hours ahead → 100% refund
- [ ] Cancel booking <12 hours → no refund, credits returned
- [ ] Reschedule booking → old slot released, new slot locked
- [ ] Duplicate request (same idempotency key) → same response, no duplicate
- [ ] Realtime: Teacher sees new booking instantly in calendar

### RLS Tests

- [ ] Student can't view other student's bookings → returns empty
- [ ] Teacher can't view other teacher's bookings → returns empty
- [ ] Student can't directly insert payment record → blocked
- [ ] Only RPC functions can create bookings → direct INSERT blocked

---

*This comprehensive documentation consolidates all implementation details, testing procedures, and troubleshooting guides for the SkillUp Teachers application. Keep this file updated as the project evolves.*