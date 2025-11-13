# Migration 046: Hebrew Notification Messages Reference

## Complete Message Matrix

This document shows all possible notification messages in Hebrew for both teachers and students.

---

## 1. New Booking Created (INSERT)

### When: Student creates a new booking
### Status: pending, confirmed, or awaiting_payment

#### Teacher Receives:
```
Type: BOOKING_CONFIRMED
Title: שיעור חדש נקבע! 📚
Subtitle: [שם התלמיד] קבע איתך שיעור ב[נושא] ל-[תאריך ושעה]

Example:
יוסי כהן קבע איתך שיעור במתמטיקה ל-15/11/2025 בשעה 16:00
```

#### Student Receives:
```
Type: BOOKING_CONFIRMED
Title: השיעור נקבע בהצלחה! ✅
Subtitle: שיעור ב[נושא] עם [שם המורה] ב-[תאריך ושעה]

Example:
שיעור במתמטיקה עם דן לוי ב-15/11/2025 בשעה 16:00
```

---

## 2. Teacher Confirms Pending Booking (UPDATE)

### When: Booking status changes from 'pending' to 'confirmed'
### Actor: Usually the teacher

#### Teacher Receives:
```
Type: BOOKING_CONFIRMED
Title: אישרת את השיעור ✅
Subtitle: שיעור ב[נושא] עם [שם התלמיד] ב-[תאריך ושעה]

Example:
שיעור במתמטיקה עם יוסי כהן ב-15/11/2025 בשעה 16:00
```

#### Student Receives:
```
Type: BOOKING_CONFIRMED
Title: המורה אישר את השיעור! 🎉
Subtitle: [שם המורה] אישר את השיעור ב[נושא] ב-[תאריך ושעה]

Example:
דן לוי אישר את השיעור במתמטיקה ב-15/11/2025 בשעה 16:00
```

---

## 3. Teacher Cancels Booking (UPDATE)

### When: Booking status changes to 'cancelled'
### Actor: Teacher (auth.uid() matches teacher_id)

#### Teacher Receives:
```
Type: BOOKING_CANCELLED
Title: ביטלת את השיעור 🚫
Subtitle: שיעור ב[נושא] עם [שם התלמיד] שהיה אמור להיות ב-[תאריך ושעה]

Example:
שיעור במתמטיקה עם יוסי כהן שהיה אמור להיות ב-15/11/2025 בשעה 16:00
```

#### Student Receives:
```
Type: BOOKING_CANCELLED
Title: המורה ביטל את השיעור 😔
Subtitle: [שם המורה] ביטל את השיעור ב[נושא] שהיה אמור להיות ב-[תאריך ושעה]

Example:
דן לוי ביטל את השיעור במתמטיקה שהיה אמור להיות ב-15/11/2025 בשעה 16:00
```

---

## 4. Student Cancels Booking (UPDATE)

### When: Booking status changes to 'cancelled'
### Actor: Student (auth.uid() matches student_id OR no auth context)

#### Teacher Receives:
```
Type: BOOKING_CANCELLED
Title: שיעור בוטל 🚫
Subtitle: [שם התלמיד] ביטל שיעור ב[נושא] שהיה אמור להיות ב-[תאריך ושעה]

Example:
יוסי כהן ביטל שיעור במתמטיקה שהיה אמור להיות ב-15/11/2025 בשעה 16:00
```

#### Student Receives:
```
Type: BOOKING_CANCELLED
Title: ביטלת את השיעור ✅
Subtitle: שיעור ב[נושא] עם [שם המורה] שהיה אמור להיות ב-[תאריך ושעה]

Example:
שיעור במתמטיקה עם דן לוי שהיה אמור להיות ב-15/11/2025 בשעה 16:00
```

---

## 5. Teacher Reschedules Booking (UPDATE)

### When: Booking start_at time changes
### Actor: Teacher (auth.uid() matches teacher_id)

#### Teacher Receives:
```
Type: BOOKING_RESCHEDULED
Title: שינית את מועד השיעור 🔄
Subtitle: שיעור ב[נושא] עם [שם התלמיד] שונה ל-[תאריך ושעה חדשים]

Example:
שיעור במתמטיקה עם יוסי כהן שונה ל-16/11/2025 בשעה 18:00
```

#### Student Receives:
```
Type: BOOKING_RESCHEDULED
Title: המורה שינה את מועד השיעור 📅
Subtitle: [שם המורה] שינה את השיעור ב[נושא] ל-[תאריך ושעה חדשים]

Example:
דן לוי שינה את השיעור במתמטיקה ל-16/11/2025 בשעה 18:00
```

---

## 6. Student Reschedules Booking (UPDATE)

### When: Booking start_at time changes
### Actor: Student (auth.uid() matches student_id OR no auth context)

#### Teacher Receives:
```
Type: BOOKING_RESCHEDULED
Title: שיעור שונה 🔄
Subtitle: [שם התלמיד] שינה את מועד השיעור ב[נושא] ל-[תאריך ושעה חדשים]

Example:
יוסי כהן שינה את מועד השיעור במתמטיקה ל-16/11/2025 בשעה 18:00
```

#### Student Receives:
```
Type: BOOKING_RESCHEDULED
Title: שינית את מועד השיעור ✅
Subtitle: שיעור ב[נושא] עם [שם המורה] שונה ל-[תאריך ושעה חדשים]

Example:
שיעור במתמטיקה עם דן לוי שונה ל-16/11/2025 בשעה 18:00
```

---

## Message Components

### Dynamic Variables

All messages use the following dynamic components:

1. **[שם התלמיד]** - Student's full name
   - Retrieved from: `students.first_name || ' ' || students.last_name`
   - Example: `יוסי כהן`

2. **[שם המורה]** - Teacher's display name
   - Retrieved from: `teachers.display_name`
   - Example: `דן לוי`

3. **[נושא]** - Subject name in Hebrew
   - Retrieved from: `COALESCE(subjects.name_he, subjects.name)`
   - Default if NULL: `שיעור`
   - Example: `מתמטיקה`, `אנגלית`, `פיזיקה`

4. **[תאריך ושעה]** - Formatted date and time
   - Format: `DD/MM/YYYY בשעה HH24:MI`
   - Timezone: `Asia/Jerusalem`
   - Retrieved from: `to_char(NEW.start_at AT TIME ZONE 'Asia/Jerusalem', 'DD/MM/YYYY בשעה HH24:MI')`
   - Example: `15/11/2025 בשעה 16:00`

### Emoji Usage

| Emoji | Meaning | Used In |
|-------|---------|---------|
| 📚 | New lesson/booking | New booking (teacher notification) |
| ✅ | Success/confirmation | Confirmations, successful actions by user |
| 🎉 | Celebration | Teacher confirms student's booking |
| 🚫 | Cancellation | Cancellations |
| 😔 | Disappointment | When other party cancels |
| 🔄 | Change/reschedule | Rescheduling (neutral) |
| 📅 | Calendar/date change | When other party reschedules |

---

## Notification Data Structure

Every notification includes this data payload:

```json
{
  "booking_id": "uuid",
  "teacher_id": "uuid",
  "teacher_name": "string (display_name)",
  "student_id": "uuid",
  "student_name": "string (first_name + last_name)",
  "subject": "string (Hebrew subject name)",
  "start_at": "timestamptz (ISO format)",
  "end_at": "timestamptz (ISO format)",
  "mode": "online|student_location|teacher_location",
  "duration_minutes": 45|60|90,
  "price": "numeric",
  "status": "pending|confirmed|cancelled|completed|refunded|awaiting_payment",
  "actor_id": "uuid (who initiated the change)",
  "is_teacher_actor": true|false
}
```

### Example Data:
```json
{
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "teacher_id": "223e4567-e89b-12d3-a456-426614174001",
  "teacher_name": "דן לוי",
  "student_id": "323e4567-e89b-12d3-a456-426614174002",
  "student_name": "יוסי כהן",
  "subject": "מתמטיקה",
  "start_at": "2025-11-15T16:00:00+02:00",
  "end_at": "2025-11-15T17:00:00+02:00",
  "mode": "online",
  "duration_minutes": 60,
  "price": "150.00",
  "status": "confirmed",
  "actor_id": "323e4567-e89b-12d3-a456-426614174002",
  "is_teacher_actor": false
}
```

---

## Frontend Integration Examples

### React/React Native Example

```typescript
interface BookingNotificationData {
  booking_id: string;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  subject: string;
  start_at: string;
  end_at: string;
  mode: 'online' | 'student_location' | 'teacher_location';
  duration_minutes: 45 | 60 | 90;
  price: string;
  status: string;
  actor_id: string;
  is_teacher_actor: boolean;
}

function NotificationCard({ notification }: { notification: Notification }) {
  const data = notification.data as BookingNotificationData;

  // Determine if current user initiated the action
  const wasInitiatedByMe = data.actor_id === currentUser.id;

  // Get appropriate icon and color based on type
  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'BOOKING_CONFIRMED':
        return { icon: '✅', color: '#4CAF50' };
      case 'BOOKING_CANCELLED':
        return { icon: '🚫', color: '#F44336' };
      case 'BOOKING_RESCHEDULED':
        return { icon: '🔄', color: '#2196F3' };
      default:
        return { icon: '📚', color: '#757575' };
    }
  };

  const style = getNotificationStyle();

  return (
    <View style={{ padding: 16, backgroundColor: wasInitiatedByMe ? '#f5f5f5' : '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>{style.icon}</Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: style.color }}>
          {notification.title}
        </Text>
      </View>
      <Text style={{ fontSize: 14, marginTop: 4, textAlign: 'right' }}>
        {notification.subtitle}
      </Text>
      {wasInitiatedByMe && (
        <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          (פעולה שביצעת)
        </Text>
      )}
    </View>
  );
}
```

### Display in List View

```typescript
function NotificationsList() {
  const { data: notifications } = useQuery('notifications', fetchNotifications);

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <NotificationCard notification={item} />}
      ListEmptyComponent={
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>אין התראות חדשות</Text>
        </View>
      }
    />
  );
}
```

---

## Testing Hebrew Text

### Verify Hebrew Rendering

Run this query to see actual Hebrew text in notifications:

```sql
SELECT
  id,
  type,
  title,
  subtitle,
  created_at
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND type IN ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED')
ORDER BY created_at DESC
LIMIT 10;
```

### Expected Output Example:
```
┌──────────────────────────────────┬────────────────────┬──────────────────────┬────────────────────────────────────────────────┬─────────────────────┐
│ id                               │ type               │ title                │ subtitle                                       │ created_at          │
├──────────────────────────────────┼────────────────────┼──────────────────────┼────────────────────────────────────────────────┼─────────────────────┤
│ 123e4567...                      │ BOOKING_CONFIRMED  │ שיעור חדש נקבע! 📚   │ יוסי כהן קבע איתך שיעור במתמטיקה ל-15/11...  │ 2025-11-12 10:30:00 │
│ 223e4567...                      │ BOOKING_CONFIRMED  │ השיעור נקבע בהצלחה! ✅│ שיעור במתמטיקה עם דן לוי ב-15/11...           │ 2025-11-12 10:30:00 │
│ 323e4567...                      │ BOOKING_CANCELLED  │ המורה ביטל את השיעור 😔│ דן לוי ביטל את השיעור במתמטיקה...             │ 2025-11-12 09:15:00 │
└──────────────────────────────────┴────────────────────┴──────────────────────┴────────────────────────────────────────────────┴─────────────────────┘
```

---

## Common Issues and Solutions

### Issue 1: Hebrew Text Appears as Gibberish
**Solution**: Ensure database and client use UTF-8 encoding
```sql
SHOW SERVER_ENCODING;  -- Should be UTF8
SHOW CLIENT_ENCODING;  -- Should be UTF8
```

### Issue 2: Emoji Not Displaying
**Solution**: Ensure frontend supports Unicode emoji
- React Native: Use `Text` component (not `TextInput`)
- Web: Ensure font supports emoji
- Database: PostgreSQL stores emoji correctly by default

### Issue 3: Date Format Not in Hebrew
**Solution**: Check timezone is set correctly
```sql
SELECT to_char(NOW() AT TIME ZONE 'Asia/Jerusalem', 'DD/MM/YYYY בשעה HH24:MI');
-- Should output: "12/11/2025 בשעה 10:30"
```

### Issue 4: Wrong Name Displayed
**Solution**: Check data in tables
```sql
-- Check teacher name
SELECT id, display_name FROM teachers WHERE id = 'TEACHER_ID';

-- Check student name
SELECT id, first_name, last_name FROM students WHERE id = 'STUDENT_ID';
```

---

## Localization Considerations

### Future English Support
If you need English messages in the future, modify the function to:

1. Add a user language preference check:
```sql
SELECT language INTO v_user_language FROM users WHERE id = p_user_id;
```

2. Branch notification text based on language:
```sql
IF v_user_language = 'he' THEN
  v_title := 'שיעור חדש נקבע! 📚';
ELSIF v_user_language = 'en' THEN
  v_title := 'New Lesson Booked! 📚';
END IF;
```

3. Store both Hebrew and English subject names:
```sql
SELECT
  CASE WHEN v_user_language = 'he' THEN name_he ELSE name END
INTO v_subject_name
FROM subjects WHERE id = NEW.subject_id;
```

---

## Summary

Migration 046 provides comprehensive Hebrew notifications with:
- ✅ 6 different scenarios covered
- ✅ 12 unique message variations (2 per scenario)
- ✅ Smart personalization based on actor
- ✅ Professional Hebrew text
- ✅ Appropriate emoji usage
- ✅ Complete data payload for frontend
- ✅ Full Unicode/UTF-8 support

All messages are production-ready and follow Hebrew RTL conventions.
