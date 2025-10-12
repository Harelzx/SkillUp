# 🔧 Environment Variables Setup

## הבעיה
המיגרציה דורשת משתני סביבה שחסרים בקובץ `.env`

## הפתרון (3 שלבים)

### שלב 1: צור קובץ `.env` (אם לא קיים)

צור קובץ חדש בשורש הפרויקט בשם `.env` (ללא שום סיומת!)

```
SkillUp/
├── .env          ← צור קובץ זה!
├── package.json
├── migrations/
└── ...
```

### שלב 2: השג את הפרטים מ-Supabase

1. **פתח את Supabase Dashboard**
   - לך ל: https://supabase.com/dashboard
   - בחר את הפרויקט שלך

2. **עבור להגדרות API**
   - Settings → API
   - או ישירות: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/settings/api

3. **העתק את הפרטים**
   - **Project URL**: משהו כמו `https://abcdefghijklm.supabase.co`
   - **service_role key**: מפתח ארוך שמתחיל ב-`eyJhbGc...`
   
   ⚠️ **חשוב**: קח את ה-**service_role** key ולא את ה-anon key!

### שלב 3: מלא את קובץ ה-.env

פתח את הקובץ `.env` והדבק את הפרטים:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-actual-service-role-key-here
```

**החלף את הערכים עם הפרטים האמיתיים שלך!**

---

## דוגמה מלאה (עם ערכים מזויפים)

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xkrzgtjwbqxlpymqtvph.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrcnpndmp3YnF4bHB5bXF0dnBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNTk3ODk3OSwiZXhwIjoxOTMxNTU0OTc5fQ.cXBwNxLI8_example_key_do_not_use
```

**זה רק דוגמה! השתמש בערכים האמיתיים שלך!**

---

## לאחר מכן

אחרי שיצרת את הקובץ `.env`, הרץ שוב את המיגרציה:

```bash
node scripts/run-migration.js migrations/006_booking_system_complete.sql
```

---

## אופציה 2: הרצה ישירה דרך Supabase Dashboard

אם אין לך גישה ל-service role key, תוכל להריץ את המיגרציה ישירות:

1. פתח Supabase Dashboard
2. SQL Editor → New Query
3. העתק את תוכן הקובץ `migrations/006_booking_system_complete.sql`
4. הדבק ב-SQL Editor
5. לחץ "Run"
6. חזור על התהליך עם `migrations/007_rls_policies_complete.sql`

---

## אבטחה ⚠️

- **אל תעלה את קובץ `.env` ל-git!**
- קובץ `.env` כבר ב-`.gitignore` - זה בסדר
- ה-service_role key נותן גישה מלאה למסד הנתונים
- שמור אותו בסוד!

---

## בדיקה

אחרי שיצרת את `.env`, בדוק שהוא קיים:

### Windows PowerShell:
```powershell
Get-Content .env
```

### Windows CMD:
```cmd
type .env
```

### Mac/Linux:
```bash
cat .env
```

אם אתה רואה את הפרטים - מעולה! הרץ את המיגרציה שוב.

---

## עוד עזרה?

אם עדיין יש בעיה:
1. ודא שהקובץ נקרא בדיוק `.env` (ללא רווחים, ללא .txt)
2. ודא שהוא בתיקיית השורש של הפרויקט (לצד package.json)
3. ודא שהעתקת את ה-service_role key (לא anon key)
4. נסה לסגור ולפתוח מחדש את הטרמינל

