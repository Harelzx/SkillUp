# תיעוד טבלאות משבצות זמינות (Availability Slots)

## טבלאות רלוונטיות במסד הנתונים

### 1. `availability_slots` - הטבלה הראשית של משבצות זמינות

**תיאור**: מאחסנת את כל משבצות הזמינות של המורים.

**שדות**:
- `id` (UUID) - מזהה ייחודי של המשבצת
- `teacher_id` (UUID) - מזהה המורה (Foreign Key → `teachers(id)`)
- `start_at` (TIMESTAMPTZ) - זמן התחלה של המשבצת
- `end_at` (TIMESTAMPTZ) - זמן סיום של המשבצת
- `is_booked` (BOOLEAN) - האם המשבצת תפוסה (יש הזמנה)
- `booking_id` (UUID, nullable) - מזהה ההזמנה אם יש (Foreign Key → `bookings(id)`)
- `created_at` (TIMESTAMPTZ) - זמן יצירה
- `updated_at` (TIMESTAMPTZ) - זמן עדכון אחרון

**אינדקסים**:
- `idx_availability_teacher` - על `teacher_id`
- `idx_availability_start` - על `start_at`
- `idx_availability_booked` - על `is_booked`
- `idx_availability_teacher_range` - על `(teacher_id, start_at, end_at)`

**Row Level Security (RLS)**:
- כל המשתמשים יכולים לקרוא (SELECT)
- מורים יכולים לנהל את המשבצות שלהם בלבד (INSERT/UPDATE/DELETE) כאשר `auth.uid() = teacher_id`

**דוגמת שאילתה**:
```sql
-- קבלת כל המשבצות של מורה בתאריך מסוים
SELECT * FROM availability_slots
WHERE teacher_id = '...'
  AND DATE(start_at AT TIME ZONE 'Asia/Jerusalem') = '2024-01-15'
ORDER BY start_at;
```

---

### 2. `audit_log` - יומן פעולות (לבדיקה)

**תיאור**: מאחסנת את כל הפעולות שבוצעו במערכת, כולל פעולות על משבצות זמינות.

**שדות רלוונטיים**:
- `actor_user_id` (UUID) - מזהה המשתמש שביצע את הפעולה (Foreign Key → `auth.users(id)`)
- `action` (TEXT) - סוג הפעולה
- `entity` (TEXT) - שם הישות (לדוגמה: 'availability_slots')
- `entity_id` (UUID, nullable) - מזהה הישות
- `meta` (JSONB) - נתונים נוספים על הפעולה
- `created_at` (TIMESTAMPTZ) - זמן הפעולה

**פעולות רלוונטיות**:
- `'day_opened'` - יום נפתח (נוצרו משבצות ברירת מחדל)
  - `meta` מכיל: `date`, `slots_created`, `start_time`, `end_time`, `slot_duration`
- `'day_closed'` - יום נסגר (נמחקו כל המשבצות הלא תפוסות)
  - `meta` מכיל: `date`, `slots_deleted`
- `'availability_updated'` - משבצות עודכנו
  - `meta` מכיל: `date`, `slots_count`

**דוגמת שאילתה**:
```sql
-- בדיקת פעולות אחרונות על משבצות זמינות
SELECT * FROM audit_log
WHERE entity = 'availability_slots'
  AND actor_user_id = '...'
ORDER BY created_at DESC
LIMIT 10;
```

---

### 3. `teachers` - פרטי מורים

**תיאור**: מאחסנת את פרטי המורים, כולל timezone שמשפיע על חישוב הזמנים.

**שדות רלוונטיים**:
- `id` (UUID) - מזהה המורה (Primary Key)
- `timezone` (TEXT) - אזור זמן של המורה (ברירת מחדל: 'Asia/Jerusalem')
- `display_name` (TEXT) - שם המורה
- ... (שדות נוספים)

**הערה**: ה-timezone משמש לחישוב הזמנים במשבצות. כל הזמנים במסד נשמרים ב-TIMESTAMPTZ, אבל מוצגים לפי ה-timezone של המורה.

**דוגמת שאילתה**:
```sql
-- קבלת timezone של מורה
SELECT timezone FROM teachers WHERE id = '...';
```

---

## פונקציות RPC (Remote Procedure Calls)

### 1. `get_teacher_availability_slots`
**תיאור**: מקבלת את כל המשבצות הזמינות של מורה בטווח תאריכים.

**פרמטרים**:
- `p_teacher_id` (UUID) - מזהה המורה
- `p_start_date` (DATE) - תאריך התחלה (YYYY-MM-DD)
- `p_end_date` (DATE) - תאריך סיום (YYYY-MM-DD)

**החזרה**: מערך של משבצות עם הזמנים לפי timezone של המורה.

---

### 2. `open_day`
**תיאור**: פותח יום עם משבצות ברירת מחדל.

**פרמטרים**:
- `p_teacher_id` (UUID) - מזהה המורה
- `p_date` (DATE) - התאריך לפתיחה (YYYY-MM-DD)
- `p_default_start_time` (TIME) - שעת התחלה (ברירת מחדל: '09:00')
- `p_default_end_time` (TIME) - שעת סיום (ברירת מחדל: '17:00')
- `p_slot_duration` (INTEGER) - אורך משבצת בדקות (ברירת מחדל: 60)

**החזרה**: `{ success: boolean, slots_created: number }`

**הערה**: מוחקת כל המשבצות הלא תפוסות של היום ויוצרת חדשות.

---

### 3. `close_day`
**תיאור**: סוגר יום - מוחקת את כל המשבצות הלא תפוסות.

**פרמטרים**:
- `p_teacher_id` (UUID) - מזהה המורה
- `p_date` (DATE) - התאריך לסגירה (YYYY-MM-DD)

**החזרה**: `{ success: boolean, slots_deleted: number }`

**הערה**: לא מוחקת משבצות תפוסות (is_booked = TRUE).

---

### 4. `upsert_availability_slots`
**תיאור**: מעדכנת/יוצרת משבצות זמינות ליום מסוים.

**פרמטרים**:
- `p_teacher_id` (UUID) - מזהה המורה
- `p_date` (DATE) - התאריך (YYYY-MM-DD)
- `p_slots` (JSONB) - מערך של משבצות: `[{start_time: "HH:MM", end_time: "HH:MM"}, ...]`

**החזרה**: `{ success: boolean, slots_inserted: number }`

**הערה**: מוחקת כל המשבצות הלא תפוסות של היום ויוצרת חדשות לפי הנתונים שנשלחו.

---

### 5. `delete_availability_slot` (function in API)
**תיאור**: מוחקת משבצת ספציפית.

**פרמטרים**:
- `slotId` (UUID) - מזהה המשבצת

**הערה**: לא מוחקת משבצות תפוסות.

---

## איך לבדוק שהנתונים נשמרים?

### 1. בדיקת משבצות בתאריך מסוים
```sql
SELECT 
  id,
  teacher_id,
  start_at,
  end_at,
  is_booked,
  booking_id,
  created_at,
  updated_at
FROM availability_slots
WHERE teacher_id = 'YOUR_TEACHER_ID'
  AND DATE(start_at AT TIME ZONE 'Asia/Jerusalem') = '2024-01-15'
ORDER BY start_at;
```

### 2. בדיקת פעולות אחרונות ב-audit_log
```sql
SELECT 
  action,
  entity,
  meta,
  created_at
FROM audit_log
WHERE entity = 'availability_slots'
  AND actor_user_id = 'YOUR_TEACHER_ID'
ORDER BY created_at DESC
LIMIT 20;
```

### 3. בדיקת timezone של מורה
```sql
SELECT id, display_name, timezone
FROM teachers
WHERE id = 'YOUR_TEACHER_ID';
```

---

## הערות חשובות

1. **כל הזמנים נשמרים ב-TIMESTAMPTZ** - הם נשמרים ב-UTC ומתאימים ל-timezone של המורה בעת הצגה.

2. **משבצות תפוסות לא נמחקות** - כאשר יש הזמנה (is_booked = TRUE), המשבצת לא תימחק על ידי `close_day` או `upsert_availability_slots`.

3. **Row Level Security (RLS)** - כל הפעולות חייבות להיות מאושרות על ידי RLS. מורים יכולים לנהל רק את המשבצות שלהם.

4. **Audit Log** - כל פעולה מתועדת ב-`audit_log` עם פרטים מלאים.

5. **Timezones** - חשוב לוודא שה-timezone של המורה נכון ב-`teachers.timezone`, אחרת הזמנים יוצגו לא נכון.

---

## קישורים

- Migration 006: יצירת הטבלה `availability_slots`
- Migration 014: יצירת הפונקציות RPC
- Migration 023: עדכון Foreign Keys לטבלת `teachers`
- Migration 035: תיקון הפונקציות לשימוש ב-`teachers` במקום `profiles`

