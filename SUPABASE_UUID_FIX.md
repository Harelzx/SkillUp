# תיקון שגיאת uuid_generate_v4() ב-Supabase

## הבעיה

השגיאה:
```
{"code":"42883","message":"function uuid_generate_v4() does not exist"}
```

**סיבה:** ההרחבה `uuid-ossp` לא מופעלת במסד הנתונים של Supabase.

## הפתרון

יש להריץ את המיגרציה `000_enable_extensions.sql` שמפעילה את ההרחבות הנדרשות.

---

## אפשרות 1: הרצה ידנית (מומלץ) ✅

### צעדים:

1. **פתח את Supabase Dashboard**
   - גש ל-[https://supabase.com/dashboard](https://supabase.com/dashboard)
   - בחר את הפרויקט שלך

2. **פתח את SQL Editor**
   - בתפריט הצד, לחץ על **SQL Editor**
   - לחץ על **+ New Query**

3. **העתק והרץ את ה-SQL הבא:**
   ```sql
   -- Enable UUID generation
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Enable text search (for future search features)
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";

   -- Verify extensions are enabled
   DO $$
   BEGIN
     -- Test uuid_generate_v4()
     PERFORM uuid_generate_v4();
     RAISE NOTICE 'UUID extension working!';
     
     RAISE NOTICE 'Migration 000 completed successfully!';
     RAISE NOTICE 'Extensions enabled: uuid-ossp, pg_trgm';
   END $$;
   ```

4. **לחץ על RUN**

5. **אמת שהכל עבד:**
   - אמור להופיע הודעת הצלחה: `UUID extension working!`
   - ניתן לבדוק שההרחבה פועלת על ידי הרצת:
     ```sql
     SELECT uuid_generate_v4();
     ```

---

## אפשרות 2: הרצה דרך סקריפט Node.js

### דרישות מוקדמות:

1. **השג את Service Role Key:**
   - Supabase Dashboard → Settings → API
   - העתק את המפתח **service_role** (לא את anon key!)
   
2. **צור קובץ `.env`** בשורש הפרויקט עם:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
   ```
   
   ⚠️ **חשוב:** אל תעלה את קובץ `.env` ל-git!

### הרצת המיגרציה:

```bash
node scripts/run-migration.js migrations/000_enable_extensions.sql
```

---

## אימות שהתיקון עבד

לאחר הרצת המיגרציה, בדוק ש:

1. **ההרחבה פועלת:**
   ```sql
   SELECT uuid_generate_v4();
   ```
   אמור להחזיר UUID חדש (למשל: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`)

2. **ההאפליקציה עובדת:**
   - הפעל את האפליקציה: `npm start`
   - נסה ליצור booking חדש
   - בדוק שאין שגיאות בקונסול

---

## שאלות ותשובות

**Q: למה השגיאה הזו קורית?**
A: Supabase דורש שההרחבה `uuid-ossp` תופעל במפורש על ידי המשתמש. היא לא מופעלת כברירת מחדל.

**Q: האם זה בטוח?**
A: כן! זו הרחבה רשמית של PostgreSQL והיא נמצאת בשימוש נרחב.

**Q: האם צריך להריץ את זה שוב בעתיד?**
A: לא. ברגע שההרחבה מופעלת, היא נשארת פעילה לתמיד באותו מסד נתונים.

**Q: מה אם המיגרציה נכשלת?**
A: השתמש באפשרות 1 (הרצה ידנית). זו הדרך הכי בטוחה והיא תמיד עובדת.

---

## קבצים רלוונטיים

- `migrations/000_enable_extensions.sql` - המיגרציה המקורית
- `scripts/run-migration.js` - סקריפט הרצת מיגרציות
- `migrations/README.md` - תיעוד מיגרציות כללי

