# 🚀 Migration 005: Booking Schema Enhancement

## מטרה
להכין את מסד הנתונים לתמיכה מלאה בזרימת הזמנת שיעורים, כולל:
- ✅ מצבי הזמנה (אונליין/פרונטלי)
- ✅ שימוש בקרדיטים
- ✅ קופונים והנחות
- ✅ החזרים אוטומטיים
- ✅ Audit log למעקב

---

## 📋 מה המיגרציה מוסיפה?

### 1. Enums חדשים
```sql
- booking_mode: 'online', 'student_location', 'teacher_location'
- booking_status: + 'refunded'
- payment_method: 'credits', 'card', 'card_sim'
- refund_method: 'credits', 'card', 'card_sim'
```

### 2. שדות חדשים ב-`bookings`
```sql
- mode (booking_mode) - סוג השיעור
- duration_minutes (int) - משך בדקות: 45/60/90
- price_per_hour (numeric) - מחיר שעתי
- total_price (numeric) - מחיר כולל
- credits_applied (numeric) - קרדיטים שהושקעו
- coupon_code (text) - קוד קופון
- discount_amount (numeric) - סכום הנחה
- timezone (text) - אזור זמן
- source (text) - מקור: mobile/web
- student_level (text) - רמת תלמיד
- currency (text) - מטבע (ILS)
```

### 3. טבלת `refunds` (חדשה)
```sql
- id, booking_id, student_id, method, amount, reason
- RLS: תלמיד רואה רק את ההחזרים שלו
```

### 4. טבלת `audit_log` (חדשה)
```sql
- id, actor_user_id, action, entity, entity_id, meta (jsonb)
- למעקב אחר פעולות חשובות
```

### 5. פונקציות חדשות
```sql
- create_booking_with_credits() - יוצר הזמנה ומנכה קרדיטים אוטומטית
- process_booking_refund() - מעבד החזר לפי מדיניות ביטול
```

### 6. אינדקסים חדשים
```sql
- bookings: (teacher_id, start_at), (student_id, start_at), (status, start_at)
- credit_transactions: (student_id, created_at DESC)
- refunds: (booking_id), (student_id)
- audit_log: (actor_user_id), (entity, entity_id), (created_at DESC)
```

---

## 🎯 איך להריץ?

### שיטה 1: דרך Supabase Dashboard (מומלץ)

1. **פתח Supabase Dashboard:**
   ```
   https://app.supabase.com
   ```

2. **עבור ל-SQL Editor:**
   - בתפריט צד → SQL Editor
   - לחץ "New Query"

3. **העתק והרץ:**
   - פתח את `migrations/005_enhance_booking_schema.sql`
   - העתק את כל התוכן
   - הדבק ב-SQL Editor
   - לחץ **Run** (Ctrl+Enter)

4. **וודא הצלחה:**
   - תראה הודעה: `Migration 005 completed successfully!`
   - אין שגיאות באדום

### שיטה 2: דרך Migration Script

```bash
node scripts/run-migration.js migrations/005_enhance_booking_schema.sql
```

**דורש:** 
- Service Role Key ב-`.env`
- Node.js מותקן

---

## ✅ בדיקה אחרי ההרצה

### 1. בדוק שהטבלאות נוצרו:

```sql
-- Table Editor → ודא שקיימים:
- refunds
- audit_log
```

### 2. בדוק שהשדות נוספו:

```sql
-- Table Editor → bookings → Columns → ודא שקיימים:
- mode
- duration_minutes
- credits_applied
- coupon_code
- timezone
- source
```

### 3. בדוק Enums:

```sql
SELECT enum_range(NULL::booking_mode);
-- Expected: {online,student_location,teacher_location}

SELECT enum_range(NULL::booking_status);
-- Expected: {..., refunded}
```

### 4. בדוק RLS Policies:

```sql
-- Table Editor → refunds → Policies
- ✅ "Students can view own refunds"

-- Table Editor → audit_log → Policies  
- ✅ "Users can view own audit logs"
```

### 5. נסה ליצור booking test:

```sql
SELECT create_booking_with_credits(
  NULL, -- booking_id (יצור חדש)
  (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
  (SELECT id FROM subjects LIMIT 1),
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '1 hour',
  'online',
  60,
  150,
  150,
  0, -- no credits
  NULL, -- no coupon
  0, -- no discount
  'Test booking',
  NULL,
  'high_school'
);

-- Should return a UUID
-- Check in bookings table
```

---

## 🔄 Rollback (במקרה הצורך)

אם יש בעיה, ניתן לבטל חלקית:

```sql
-- Remove new tables
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;

-- Remove new columns from bookings
ALTER TABLE bookings DROP COLUMN IF EXISTS mode;
ALTER TABLE bookings DROP COLUMN IF EXISTS duration_minutes;
ALTER TABLE bookings DROP COLUMN IF EXISTS credits_applied;
ALTER TABLE bookings DROP COLUMN IF EXISTS coupon_code;
ALTER TABLE bookings DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS timezone;
ALTER TABLE bookings DROP COLUMN IF EXISTS source;
ALTER TABLE bookings DROP COLUMN IF EXISTS student_level;
ALTER TABLE bookings DROP COLUMN IF EXISTS price_per_hour;
ALTER TABLE bookings DROP COLUMN IF EXISTS total_price;

-- Note: Cannot easily remove enum values once added
```

**⚠️ אזהרה:** Rollback ימחק את הנתונים בטבלאות החדשות!

---

## 📊 מדיניות ביטול והחזרים

הפונקציה `process_booking_refund()` מיישמת את המדיניות הבאה:

| זמן ביטול לפני השיעור | החזר כספי | החזר קרדיטים |
|------------------------|-----------|---------------|
| 24+ שעות               | 100%      | 100%          |
| 12-24 שעות             | 50%       | 100%          |
| פחות מ-12 שעות         | 0%        | 100%          |

**הערה:** קרדיטים תמיד מוחזרים במלואם, גם אם התשלום הכספי לא.

---

## 🔒 RLS Policies Summary

### bookings
- ✅ Student: רואה/יוצר רק הזמנות שלו
- ✅ Teacher: רואה/מעדכן רק הזמנות שלו
- ✅ Both: יכולים לעדכן סטטוס

### refunds
- ✅ Student: רואה רק החזרים שלו
- ❌ לא ניתן ליצור ידנית (רק דרך הפונקציה)

### audit_log
- ✅ User: רואה רק פעולות שלו
- 🔮 Admin: בעתיד - רואה הכל

### student_credits
- ✅ Student: רואה רק יתרה שלו
- ❌ לא ניתן לעדכן ידנית (רק דרך הפונקציה)

---

## 🎯 Integration with UI

הטבלאות והפונקציות תומכות במלוא ה-UI Flow שנוצר:

### Step 1: Lesson Details → `bookings.mode`, `duration_minutes`, `student_level`, `notes`
### Step 2: Date & Time → `bookings.start_at`, `end_at`, `timezone`
### Step 3: Location → `bookings.location` (if mode != online)
### Step 4: Pricing → `bookings.total_price`, `credits_applied`, `coupon_code`, `discount_amount`
### Step 5: Confirm → קריאה ל-`create_booking_with_credits()`

---

## 📞 תמיכה

אם יש בעיות:
1. בדוק ב-SQL Editor את הודעות השגיאה
2. ודא שהסכימה הראשית (`supabase/schema.sql`) רצה קודם
3. בדוק שיש לך הרשאות ליצור טבלאות/פונקציות

---

*Created: 2025-10-12*
*SkillUp Teachers Platform*

