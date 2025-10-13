# QA Checklist - תיקוני Bug

## סיכום התיקונים

שני תיקונים בוצעו בהצלחה:

### ✅ 1. תיקון Metro ENOENT על InternalBytecode.js
**קובץ:** `metro.config.js`
**שינוי:** הוספת `symbolicator.customizeFrame` לסינון פריימים בעייתיים
**Commit:** `fix(metro): Add symbolicator to prevent ENOENT crashes on InternalBytecode.js`

### ✅ 2. תיקון Supabase uuid_generate_v4()
**קבצים:** `SUPABASE_UUID_FIX.md`, `migrations/README.md`
**שינוי:** הוראות להרצת מיגרציה 000
**Commit:** `docs(supabase): Add uuid_generate_v4() fix guide and update migrations README`

---

## 📋 צ'קליסט QA

### שלב 1: אימות תיקון Metro

- [ ] **נקה Metro cache:**
  ```bash
  npx expo start -c
  ```

- [ ] **בדוק שהאפליקציה מתחילה בלי שגיאות:**
  - המתן לסיום הטעינה
  - בדוק את הקונסול - לא אמורות להופיע שגיאות ENOENT
  - אם יש שגיאה, בדוק שהיא לא קשורה ל-InternalBytecode.js

- [ ] **גרום לשגיאה (אופציונלי):**
  - נסה לבצע פעולה שגורמת לשגיאה באפליקציה
  - בדוק ש-stack trace מוצג בצורה תקינה
  - ודא שאין קריסת Metro עם ENOENT

### שלב 2: תיקון Supabase

- [ ] **הרץ את מיגרציה 000 (בחר אחת):**
  
  **אפשרות A: דרך Supabase Dashboard (מומלץ):**
  1. פתח [Supabase Dashboard](https://supabase.com/dashboard)
  2. לחץ על SQL Editor
  3. העתק והדבק את התוכן של `migrations/000_enable_extensions.sql`
  4. הרץ את ה-SQL
  5. ודא הודעת הצלחה
  
  **אפשרות B: דרך Node.js script:**
  ```bash
  # 1. צור .env עם:
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  
  # 2. הרץ:
  node scripts/run-migration.js migrations/000_enable_extensions.sql
  ```

- [ ] **אמת שההרחבה פועלת:**
  
  ב-Supabase SQL Editor, הרץ:
  ```sql
  SELECT uuid_generate_v4();
  ```
  
  אמור להחזיר UUID (למשל: `550e8400-e29b-41d4-a716-446655440000`)

### שלב 3: בדיקת חיבור Supabase (אופציונלי)

- [ ] **הרץ את test-supabase-connection.ts:**
  ```bash
  npx ts-node test-supabase-connection.ts
  ```
  
  בדוק שכל הבדיקות עוברות ללא שגיאות uuid_generate_v4()

### שלב 4: בדיקת מסכי Booking

- [ ] **פתח את האפליקציה:**
  ```bash
  npm start
  # או
  npx expo start
  ```

- [ ] **נווט למסך Booking:**
  - בחר מורה
  - לחץ על "Book Lesson" / "הזמן שיעור"

- [ ] **בדוק את תהליך ה-Booking:**
  - [ ] Step 1: בחירת שיעור - צריך לעבוד ללא שגיאות
  - [ ] Step 2: בחירת תאריך ושעה - צריך לעבוד
  - [ ] Step 3: פרטי תשלום - צריך לעבוד
  - [ ] Step 4: אישור - צריך לעבוד
  - [ ] Step 5: הצלחה - צריך להציג הודעת הצלחה

- [ ] **בדוק בקונסול:**
  - אין שגיאות uuid_generate_v4()
  - אין שגיאות ENOENT על InternalBytecode.js
  - כל הקריאות ל-API עוברות בהצלחה

### שלב 5: בדיקת נתוני Database

- [ ] **ב-Supabase Dashboard → Table Editor:**
  - לחץ על טבלת `bookings`
  - בדוק ש-booking חדש נוצר עם ID תקין (UUID)
  - ודא שכל השדות מאוכלסים כמו שצריך

---

## ❌ שגיאות אפשריות ופתרונות

### אם עדיין מופיעה שגיאת uuid_generate_v4():

1. **ודא שהמיגרציה רצה:**
   ```sql
   -- ב-Supabase SQL Editor:
   SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
   ```
   אמור להחזיר שורה אחת.

2. **אם ההרחבה לא מופיעה, הרץ ידנית:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **בדוק שאתה ב-Database הנכון:**
   - לפעמים יש כמה Projects/Databases
   - ודא שאתה מריץ ב-Database שהאפליקציה מחוברת אליו

### אם עדיין מופיעה שגיאת ENOENT:

1. **נקה Metro cache:**
   ```bash
   npx expo start -c
   # או
   rm -rf node_modules/.cache
   ```

2. **בדוק את metro.config.js:**
   - ודא שהשינויים שמרו
   - בדוק שאין syntax errors
   - הרץ: `node -e "require('./metro.config.js')"` - אמור לעבוד בלי שגיאות

3. **Restart Metro bundler:**
   - סגור את Terminal
   - הרץ שוב: `npm start`

---

## ✅ סיום

אם כל הבדיקות עברו בהצלחה:

- [ ] שתי השגיאות תוקנו
- [ ] האפליקציה רצה בלי קריסות
- [ ] Booking flow עובד תקין
- [ ] Database מאוכלס כמו שצריך

---

## 📝 הערות

- **Metro fix** הוא client-side ולא דורש שינויים נוספים
- **Supabase fix** דורש הרצת מיגרציה פעם אחת בלבד
- אחרי הרצת המיגרציה, ההרחבה תישאר פעילה לצמיתות
- אין צורך בשינויים נוספים בקוד

---

## 🔗 קבצים רלוונטיים

- `metro.config.js` - תיקון Metro
- `SUPABASE_UUID_FIX.md` - הוראות מפורטות לתיקון Supabase
- `migrations/000_enable_extensions.sql` - המיגרציה להרצה
- `migrations/README.md` - תיעוד מיגרציות

