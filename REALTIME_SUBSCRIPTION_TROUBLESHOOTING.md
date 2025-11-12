# מדריך פתרון בעיות Realtime Subscription

## תיאור הבעיה

הערוץ מצליח להתחבר (`SUBSCRIBED`) אבל אז נכשל עם `CHANNEL_ERROR` או `CLOSED`. השגיאה מופיעה בלוגים:
```
ERROR [subscribeToNotifications] ❌ Channel error
ERROR [subscribeToNotifications] ❗ Realtime subscription failed repeatedly, giving up
```

## סיבות אפשריות

1. **Realtime לא מופעל על טבלת `notifications`** (הסיבה הנפוצה ביותר)
2. **בעיית הרשאות RLS** - המשתמש לא יכול לראות את הטבלה
3. **בעיית תצורת Supabase** - URL או API Key שגויים
4. **בעיית רשת/חיבור** - החיבור נסגר מהשרת
5. **בעיית קוד** - טיפול לא נכון בשגיאות

---

## שלב 1: בדיקות אבחון

### בדיקה 1: האם Realtime מופעל על הטבלה?

הרץ את השאילתה הבאה ב-Supabase SQL Editor:

```sql
SELECT 
  schemaname, 
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';
```

**תוצאה צפויה:**
- אם יש שורה → Realtime מופעל ✅
- אם אין שורה → Realtime לא מופעל ❌ (זה הבעיה!)

### בדיקה 2: בדיקת תצורת Supabase

בקונסול של האפליקציה, בדוק שהלוגים מציגים:
```
🔧 Supabase Config: {
  url: "https://xxxxx.supabase.co...",
  hasAnonKey: true
}
```

**אם אתה רואה:**
- `url: "https://your-project.supabase.co"` → משתני סביבה לא נטענו ❌
- `hasAnonKey: false` → API Key חסר ❌

### בדיקה 3: בדיקת הרשאות RLS

הרץ את השאילתה הבאה (החלף `USER_ID` ב-ID של המשתמש הנוכחי):

```sql
-- בדוק אם המשתמש יכול לראות את הטבלה
SELECT * FROM notifications 
WHERE user_id = 'USER_ID' 
LIMIT 1;
```

**אם אתה מקבל שגיאה:**
- `permission denied` → בעיית RLS ❌
- תוצאות תקינות → RLS בסדר ✅

### בדיקה 4: בדיקת לוגי Supabase

1. לך ל-Supabase Dashboard → **Project Settings** → **Logs**
2. בחר **Realtime** מהתפריט
3. חפש שגיאות סביב הזמן של הסגירה

**שגיאות נפוצות:**
- `replication forbidden` → Realtime לא מופעל
- `Topic not found` → הטבלה לא בפרסום
- `permission denied` → בעיית RLS

---

## שלב 2: פתרונות לפי סוג הבעיה

### פתרון 1: הפעלת Realtime על טבלת `notifications`

**אם בדיקה 1 הראתה שהטבלה לא בפרסום:**

#### אופציה A: הרצת Migration (מומלץ)

אם יש לך את הקובץ `migrations/042_enable_realtime_notifications.sql`:

1. לך ל-Supabase Dashboard → **SQL Editor**
2. העתק את התוכן של הקובץ
3. הרץ את השאילתה:

```sql
-- Enable Realtime publication for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

4. ודא שהשאילתה הצליחה (אמור להציג "Success. No rows returned")

#### אופציה B: דרך Dashboard

1. לך ל-Supabase Dashboard → **Database** → **Replication**
2. חפש את הטבלה `notifications`
3. לחץ על הטוגל כדי להפעיל Realtime
4. ודא שהטבלה מופיעה ברשימה עם סטטוס "Active"

#### אופציה C: בדיקה ידנית

הרץ את השאילתה הבאה כדי לראות את כל הטבלאות בפרסום:

```sql
SELECT 
  schemaname, 
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

אם `notifications` לא מופיעה, הוסף אותה:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### פתרון 2: תיקון בעיית RLS

**אם בדיקה 3 הראתה בעיית הרשאות:**

1. לך ל-Supabase Dashboard → **Authentication** → **Policies**
2. בחר את הטבלה `notifications`
3. ודא שיש Policy שמאפשרת למשתמש לראות את ההתראות שלו:

```sql
-- Policy: Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
```

אם ה-Policy לא קיים, צור אותו:

1. לך ל-Supabase Dashboard → **Database** → **Tables** → `notifications`
2. לחץ על **Policies** → **New Policy**
3. בחר **For SELECT** → **Custom policy**
4. השתמש בשאילתה למעלה

### פתרון 3: תיקון תצורת Supabase

**אם בדיקה 2 הראתה בעיית תצורה:**

#### שלב 1: יצירת קובץ `.env`

צור קובץ `.env` בשורש הפרויקט:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**איפה למצוא את הערכים:**
1. לך ל-Supabase Dashboard → **Project Settings** → **API**
2. העתק את **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
3. העתק את **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### שלב 2: הפעלה מחדש של Metro Bundler

**חשוב:** אחרי יצירת/עדכון `.env`, חייב להפעיל מחדש את Metro:

1. עצור את Metro Bundler (Ctrl+C)
2. מחק את ה-cache:
   ```bash
   npx expo start --clear
   ```
3. או:
   ```bash
   npm start -- --reset-cache
   ```

#### שלב 3: וידוא שהערכים נטענו

בקונסול של האפליקציה, בדוק שהלוגים מציגים:
```
🔧 Supabase Config: {
  url: "https://xxxxx.supabase.co...",  // לא "your-project.supabase.co"
  hasAnonKey: true  // לא false
}
```

### פתרון 4: תיקון בעיית רשת/חיבור

**אם בדיקה 4 הראתה שגיאות רשת:**

1. **בדוק חיבור לאינטרנט** - ודא שהמכשיר/אמולטור מחובר
2. **בדוק Firewall/VPN** - ייתכן שהם חוסמים WebSocket connections
3. **נסה מכשיר אחר** - כדי לשלול בעיית רשת מקומית
4. **בדוק Supabase Status** - לך ל-https://status.supabase.com

### פתרון 5: שיפור קוד הטיפול בשגיאות

**אם כל הבדיקות עברו אבל הבעיה נמשכת:**

הקוד הנוכחי ב-`src/services/api/notificationsAPI.ts` כבר מטפל ב-retry, אבל אפשר לשפר:

1. **הוספת לוגים מפורטים יותר:**
   - לוג את `error.message` ו-`error.code` כשמופיעה שגיאה
   - זה יעזור לזהות את הסיבה המדויקת

2. **טיפול נפרד בשגיאות:**
   - שגיאות שניתן לתקן (network) → retry
   - שגיאות שלא ניתן לתקן (Realtime לא מופעל) → לא לנסות retry

---

## שלב 3: אימות שהתיקון עבד

### בדיקה מהירה:

1. **הפעל מחדש את האפליקציה**
2. **בדוק את הלוגים:**
   ```
   LOG [subscribeToNotifications] Channel status: SUBSCRIBED
   LOG [subscribeToNotifications] ✅ Successfully subscribed to notifications
   ```
3. **ודא שאין שגיאות:**
   - לא אמור להיות `CHANNEL_ERROR`
   - לא אמור להיות `CLOSED` מיד אחרי `SUBSCRIBED`

### בדיקה מלאה:

1. **צור התראה חדשה** (דרך API או Dashboard)
2. **ודא שההתראה מגיעה בזמן אמת** לאפליקציה
3. **בדוק שהערוץ נשאר פתוח** (לא נסגר אחרי כמה שניות)

---

## טבלת פתרון מהיר

| סימפטום | סיבה אפשרית | פתרון |
|---------|-------------|--------|
| `CHANNEL_ERROR` מיד אחרי `SUBSCRIBED` | Realtime לא מופעל | הרץ `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;` |
| `TIMED_OUT` | בעיית רשת/חיבור | בדוק אינטרנט, Firewall, VPN |
| `permission denied` | בעיית RLS | צור Policy שמאפשרת SELECT |
| `url: "your-project.supabase.co"` | משתני סביבה לא נטענו | צור `.env` והפעל מחדש Metro |
| ערוץ נסגר אחרי כמה שניות | Realtime לא מופעל או בעיית RLS | בדוק פתרונות 1 ו-2 |

---

## בדיקות נוספות (אם הבעיה נמשכת)

### בדיקה 5: בדיקת Realtime Client

הרץ את הקוד הבא ב-Supabase SQL Editor כדי לבדוק את סטטוס Realtime:

```sql
-- בדוק את כל הטבלאות בפרסום Realtime
SELECT 
  pt.schemaname,
  pt.tablename,
  CASE 
    WHEN pt.tablename = 'notifications' THEN '✅ Enabled'
    ELSE 'Other table'
  END as status
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
ORDER BY pt.tablename;
```

### בדיקה 6: בדיקת RLS Policies

הרץ את השאילתה הבאה כדי לראות את כל ה-Policies על `notifications`:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';
```

**ודא שיש Policy עם:**
- `cmd = 'SELECT'`
- `qual` מכיל `auth.uid() = user_id`

### בדיקה 7: בדיקת WebSocket Connection

1. פתח את **Developer Tools** בדפדפן (אם אתה מריץ על Web)
2. לך ל-**Network** → **WS** (WebSocket)
3. חפש חיבורים ל-`wss://xxxxx.supabase.co/realtime`
4. בדוק את הסטטוס:
   - `101 Switching Protocols` → חיבור תקין ✅
   - `403 Forbidden` → בעיית הרשאות ❌
   - `404 Not Found` → URL שגוי ❌

---

## סיכום

**הסיבה הנפוצה ביותר:** Realtime לא מופעל על טבלת `notifications`.

**הפתרון המהיר ביותר:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

**אחרי התיקון:**
1. הפעל מחדש את האפליקציה
2. בדוק שהלוגים מציגים `SUBSCRIBED` ללא שגיאות
3. נסה ליצור התראה חדשה וודא שהיא מגיעה בזמן אמת

---

## תמיכה נוספת

אם הבעיה נמשכת אחרי כל הבדיקות:

1. **בדוק את Supabase Documentation:**
   - https://supabase.com/docs/guides/realtime
   - https://supabase.com/docs/guides/realtime/postgres-changes

2. **בדוק את Supabase Community:**
   - https://github.com/supabase/supabase/discussions

3. **צור Issue ב-GitHub** עם:
   - הלוגים המלאים
   - תוצאות כל הבדיקות
   - גרסת Supabase Client (`@supabase/supabase-js`)

