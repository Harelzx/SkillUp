# Booking System - Complete Setup Guide

## Overview
מערכת הזמנות מלאה עם תמיכה ב:
- טרנזקציות אטומיות
- חסימת משבצות זמן בזמן אמת
- ניהול קרדיטים ותשלומים
- Realtime updates
- Idempotency
- Audit logging
- RLS security

## Setup Steps

### 1. Run Migrations

הרץ את המיגרציות בסדר הבא:

```bash
# Migration 006 - Core booking system
node scripts/run-migration.js migrations/006_booking_system_complete.sql

# Migration 007 - RLS policies
node scripts/run-migration.js migrations/007_rls_policies_complete.sql
```

אם אתה רוצה להריץ גם את המיגרציות הקודמות:

```bash
# Run all previous migrations first
node scripts/run-migration.js migrations/001_add_education_column.sql
node scripts/run-migration.js migrations/002_add_bookings_for_harel.sql
node scripts/run-migration.js migrations/003_add_email_to_profiles.sql
node scripts/run-migration.js migrations/004_fix_rls_policies.sql
node scripts/run-migration.js migrations/005_enhance_booking_schema.sql

# Then run the new ones
node scripts/run-migration.js migrations/006_booking_system_complete.sql
node scripts/run-migration.js migrations/007_rls_policies_complete.sql
```

### 2. Verify Tables

ודא שהטבלאות הבאות נוצרו:
- ✅ `idempotency_requests` - מעקב אחר בקשות כפולות
- ✅ `availability_slots` - משבצות זמינות מורים
- ✅ `payments` - רשומות תשלומים
- ✅ `refunds` - רשומות החזרים
- ✅ `audit_log` - לוג ביקורת
- ✅ `bookings` (מורחבת) - הזמנות עם שדות נוספים
- ✅ `credit_transactions` (מורחבת) - טרנזקציות קרדיטים

### 3. Verify Functions

ודא שה-RPC functions הבאות קיימות:

```sql
-- Check functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_booking',
    'cancel_booking',
    'reschedule_booking',
    'check_booking_overlap',
    'prevent_booking_overlap',
    'can_access_booking'
  );
```

### 4. Test the System

#### Test 1: Create Booking

```typescript
import { createBooking } from '@/services/api/bookingsAPI';

const result = await createBooking({
  teacherId: 'teacher-uuid',
  subject: 'מתמטיקה',
  mode: 'online',
  durationMinutes: 60,
  startAt: '2025-10-15T10:00:00Z',
  timezone: 'Asia/Jerusalem',
  notes: 'שיעור ראשון',
  creditsToApply: 0,
  source: 'mobile',
});

console.log('Booking created:', result.booking_id);
```

#### Test 2: Cancel Booking

```typescript
import { cancelBooking } from '@/services/api/bookingsAPI';

const result = await cancelBooking(
  'booking-uuid',
  'לא יכול להגיע',
  'credits'
);

console.log('Refund amount:', result.refund.amount);
```

#### Test 3: Reschedule Booking

```typescript
import { rescheduleBooking } from '@/services/api/bookingsAPI';

const result = await rescheduleBooking(
  'booking-uuid',
  '2025-10-16T14:00:00Z'
);

console.log('Rescheduled to:', result.new_start_at);
```

### 5. Setup Realtime Subscriptions

בקומפוננטות שצריכות עדכוני זמן-אמת:

#### For Teacher Calendar:

```typescript
import { useTeacherBookingRealtime } from '@/hooks/useTeacherBookingRealtime';

function TeacherCalendar({ teacherId }) {
  const handleBookingUpdate = (event) => {
    console.log('Booking update:', event);
    // Refresh calendar data
    refetchBookings();
  };

  useTeacherBookingRealtime(teacherId, handleBookingUpdate);

  // ... rest of component
}
```

#### For Student Search/Availability:

```typescript
import { useAvailabilityRealtime } from '@/hooks/useAvailabilityRealtime';

function SearchScreen() {
  const handleAvailabilityChange = (event) => {
    console.log('Availability changed:', event);
    // Refresh available slots
    refetchSlots();
  };

  useAvailabilityRealtime(handleAvailabilityChange);

  // ... rest of component
}
```

## Database Schema

### Core Tables

#### bookings
```sql
- id (uuid, pk)
- teacher_id (uuid, fk → profiles)
- student_id (uuid, fk → profiles)
- subject_id (uuid, fk → subjects)
- start_at (timestamptz)
- end_at (timestamptz)
- mode (booking_mode: online | student_location | teacher_location)
- duration_minutes (integer: 45, 60, 90)
- price_per_hour (numeric)
- total_price (numeric)
- credits_applied (numeric)
- coupon_code (text)
- discount_amount (numeric)
- status (booking_status)
- timezone (text)
- source (text)
- student_level (text)
- notes (text)
- location (text)
```

#### availability_slots
```sql
- id (uuid, pk)
- teacher_id (uuid, fk → profiles)
- start_at (timestamptz)
- end_at (timestamptz)
- is_booked (boolean)
- booking_id (uuid, fk → bookings)
```

#### payments
```sql
- id (uuid, pk)
- booking_id (uuid, fk → bookings)
- student_id (uuid, fk → profiles)
- method (payment_method)
- amount (numeric)
- currency (text)
- status (payment_status)
- stripe_payment_intent_id (text)
```

#### refunds
```sql
- id (uuid, pk)
- booking_id (uuid, fk → bookings)
- student_id (uuid, fk → profiles)
- method (refund_method)
- amount (numeric)
- reason (text)
- processed_at (timestamptz)
```

## API Reference

### create_booking(...)
יוצר הזמנה חדשה עם:
- בדיקת זמינות
- חישוב מחיר
- קיזוז קרדיטים
- סימולציית תשלום
- נעילת משבצת
- יצירת התראות
- Realtime broadcast

**Returns**: `{ booking_id, status, total_price, credits_applied, amount_charged }`

### cancel_booking(...)
מבטל הזמנה עם:
- בדיקת מדיניות ביטול
- החזר קרדיטים/כסף
- שחרור משבצת
- יצירת התראות
- Realtime broadcast

**Returns**: `{ booking_id, status, refund: { method, amount } }`

### reschedule_booking(...)
משנה זמן הזמנה עם:
- בדיקת זמינות חדשה
- שחרור משבצת ישנה
- נעילת משבצת חדשה
- יצירת התראות
- Realtime broadcast

**Returns**: `{ booking_id, old_start_at, new_start_at, status }`

## Security Features

### RLS Policies
- ✅ Students can only view/create their own bookings
- ✅ Teachers can only view their own bookings
- ✅ No direct access to payments/refunds/audit tables
- ✅ All critical operations through RPC functions only
- ✅ Overlap prevention at trigger level

### Idempotency
- כל בקשת `create_booking` דורשת `idempotency_key`
- בקשות כפולות עם אותו key מחזירות את התוצאה המקורית
- Keys מתפוגגות אחרי 24 שעות

### Audit Trail
- כל פעולה נרשמת ב-`audit_log`
- מכיל: actor, action, entity, metadata
- לא ניתן למחיקה ישירה

## Realtime Events

### Teacher Channel: `teacher:{teacher_id}`
```json
{
  "type": "slot_booked",
  "booking_id": "uuid",
  "start_at": "2025-10-15T10:00:00Z",
  "end_at": "2025-10-15T11:00:00Z"
}
```

```json
{
  "type": "slot_released",
  "booking_id": "uuid",
  "start_at": "2025-10-15T10:00:00Z",
  "end_at": "2025-10-15T11:00:00Z"
}
```

### Search Channel: `search:availability`
```json
{
  "type": "slot_unavailable",
  "teacher_id": "uuid",
  "start_at": "2025-10-15T10:00:00Z",
  "end_at": "2025-10-15T11:00:00Z"
}
```

```json
{
  "type": "slot_available",
  "teacher_id": "uuid",
  "start_at": "2025-10-15T10:00:00Z",
  "end_at": "2025-10-15T11:00:00Z"
}
```

## Error Handling

### Common Error Codes
- `23505` - Booking overlap (השעה תפוסה)
- `53000` - Payment failed (תשלום נכשל)
- `22000` - Validation error (שגיאת ולידציה)
- `42501` - Unauthorized (אין הרשאה)

### Example Error Handling
```typescript
try {
  const result = await createBooking(params);
} catch (error) {
  if (error.code === '23505') {
    // Show "slot already booked" message
  } else if (error.code === '53000') {
    // Show "payment failed" message
  } else {
    // Generic error message
  }
}
```

## Performance Considerations

### Indexes
כל הטבלאות כוללות indexes מותאמים:
- `teacher_id`, `student_id` על bookings
- `start_at`, `end_at` על slots
- Compound indexes לשאילתות מורכבות

### Caching
- שקול להשתמש ב-React Query לקאשינג
- Realtime invalidates cache אוטומטית
- `staleTime: 5 minutes` מומלץ לזמינות

## Maintenance

### Cleanup Tasks

#### Remove Expired Idempotency Records
```sql
SELECT cleanup_expired_idempotency();
```

הרץ פעם ביום (cron job או scheduled function).

#### Archive Old Audit Logs
```sql
-- Archive logs older than 90 days
INSERT INTO audit_log_archive
SELECT * FROM audit_log
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Issue: Bookings Not Showing in Calendar
- בדוק RLS policies: `SELECT * FROM bookings WHERE teacher_id = auth.uid()`
- ודא שהמשתמש מחובר: `SELECT auth.uid()`
- בדוק indexes: `EXPLAIN ANALYZE SELECT ...`

### Issue: Realtime Not Working
- ודא Realtime מופעל בפרויקט Supabase
- בדוק subscription status בקונסול
- ודא שהערוץ נכון: `teacher:{uuid}` ולא `teacher:uuid`

### Issue: Payment Always Fails
- בדוק סימולציה ב-RPC function (random() > 0.2)
- לבדיקות, שנה ל-100% הצלחה: `v_payment_simulated_success := true;`

## Next Steps

1. ✅ הרץ מיגרציות
2. ✅ בדוק טבלאות ו-functions
3. ✅ שלב עם UI (BookingStep5)
4. ✅ הוסף Realtime hooks
5. 🔄 בדוק תרחישים edge case
6. 🔄 הוסף monitoring/logging
7. 🔄 אופטימיזציית ביצועים

## Support

לשאלות או בעיות, בדוק:
- Supabase logs: Dashboard → Logs
- Browser console: Network tab
- Database logs: `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100`

