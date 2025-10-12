# 📋 Migration Order - Safe Versions

## 🎯 הרץ את המיגרציות הבאות בסדר:

### Supabase Dashboard → SQL Editor → New Query

---

### 1️⃣ Migration 005 (Safe)
**קובץ**: `migrations/005_enhance_booking_schema_safe.sql`

**מה זה עושה:**
- יוצר enums: `booking_mode`, `payment_method`, `refund_method`
- מוסיף עמודות ל-`bookings`: mode, duration_minutes, credits_applied, etc.
- יוצר טבלאות: `refunds`, `audit_log`

**פעולה:**
1. פתח את הקובץ
2. העתק הכל (Ctrl+A, Ctrl+C)
3. הדבק ב-SQL Editor
4. RUN ✅

---

### 2️⃣ Migration 006 (Safe)
**קובץ**: `migrations/006_safe.sql`

**מה זה עושה:**
- יוצר טבלאות: `idempotency_requests`, `availability_slots`, `payments`
- יוצר RPC: `create_booking`, `cancel_booking`, `reschedule_booking`
- יוצר helper: `check_booking_overlap`

**פעולה:**
1. פתח את הקובץ
2. העתק הכל
3. הדבק ב-SQL Editor
4. RUN ✅

---

### 3️⃣ Migration 007 (Safe)
**קובץ**: `migrations/007_safe.sql`

**מה זה עושה:**
- יוצר RLS policies לכל הטבלאות
- יוצר trigger `prevent_booking_overlap`
- יוצר helper functions: `is_admin`, `can_access_booking`

**פעולה:**
1. פתח את הקובץ
2. העתק הכל
3. הדבק ב-SQL Editor
4. RUN ✅

---

### 4️⃣ Migration 008 (Safe) ✨ חדש!
**קובץ**: `migrations/008_safe.sql`

**מה זה עושה:**
- מוסיף `awaiting_payment` status
- מוסיף `hold_expires_at` + `payment_method_selected` columns
- מעדכן `create_booking` לתמיכה בתשלום UI
- יוצר `release_expired_holds()` function

**פעולה:**
1. פתח את הקובץ
2. העתק הכל
3. הדבק ב-SQL Editor
4. RUN ✅

---

## ✅ בדיקה אחרי הכל

הרץ את זה ב-SQL Editor כדי לוודא שהכל עבד:

```sql
-- בדיקה 1: Enums
SELECT typname FROM pg_type 
WHERE typname IN ('booking_mode', 'payment_method', 'refund_method', 'booking_status');
-- צריך להחזיר 4 שורות

-- בדיקה 2: Awaiting payment status קיים
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'booking_status' AND enumlabel = 'awaiting_payment';
-- צריך להחזיר 1 שורה

-- בדיקה 3: Tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('payments', 'refunds', 'idempotency_requests', 'availability_slots', 'audit_log');
-- צריך להחזיר 5 שורות

-- בדיקה 4: Functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('create_booking', 'cancel_booking', 'reschedule_booking', 'release_expired_holds');
-- צריך להחזיר 4 שורות

-- בדיקה 5: New columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name IN ('hold_expires_at', 'payment_method_selected');
-- צריך להחזיר 2 שורות
```

**אם כל הבדיקות עברו ✅ - המערכת מוכנה!**

---

## 🎉 מה עכשיו?

1. ✅ כל המיגרציות רצו בהצלחה
2. 📱 פתח את האפליקציה
3. 🎯 נסה ליצור הזמנה חדשה
4. 💳 תראה שלב 6 תשלום!
5. 🚀 הכל אמור לעבוד!

---

## 🐛 אם יש שגיאה

### "policy already exists"
זה OK - פשוט RUN שוב, הגרסאות ה-safe עם DROP IF EXISTS.

### "type already exists"  
זה OK - המיגרציות בודקות IF NOT EXISTS.

### "function does not exist"
ודא שהרצת את כל 4 המיגרציות בסדר!

---

**צריך עזרה?** קרא: `PAYMENT_STEP_6_COMPLETE.md`

