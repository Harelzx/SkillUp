# מדריך משתמשי DEV - Test Users Guide

## 🔧 סקירה

מערכת SkillUp כוללת משתמשי דמה מובנים לצורך **בדיקות מקומיות בלבד**.  
המשתמשים האלה מאפשרים בדיקת הממשק למורים ולתלמידים **ללא צורך בחיבור לשרת**.

⚠️ **אזהרה**: משתמשים אלה פעילים **רק במצב DEV** ולא יופיעו בפרודקשן.

---

## 👥 משתמשי דמה זמינים

### 1️⃣ משתמש מורה (Teacher)

```
📧 Email:    teacher.demo@skillup.dev
🔑 Password: 123456
👤 Role:     Teacher
📝 Name:     ד״ר אביב כהן
```

**פרטי פרופיל:**
- מורה מומחה למתמטיקה ופיזיקה
- 15 שנות ניסיון בהוראה אקדמית
- דוקטורט מהטכניון
- תעריף: ₪180/שעה
- נושאים: mathematics, physics, calculus

**מה תראו:**
- ממשק מורים מלא (Teacher App)
- דשבורד כלכלי עם נתונים
- יומן עם שיעורים
- התראות למורים

---

### 2️⃣ משתמש תלמיד (Student)

```
📧 Email:    student.demo@skillup.dev
🔑 Password: 123456
👤 Role:     Student
📝 Name:     יעל כהן
```

**פרטי פרופיל:**
- סטודנטית למדעי המחשב

**מה תראו:**
- ממשק תלמידים רגיל (Student App)
- חיפוש מורים
- השיעורים שלי
- פרופיל תלמיד

---

## 🚀 שימוש במשתמשי DEV

### דרך 1: התחברות רגילה

1. פתח את האפליקציה
2. לחץ על "התחברות"
3. הזן:
   - Email: `teacher.demo@skillup.dev` (או `student.demo@skillup.dev`)
   - Password: `123456`
4. לחץ "התחבר"

✅ תנותב אוטומטית לממשק המתאים (מורה/תלמיד)

---

### דרך 2: מילוי מהיר (Quick Fill)

במסך Login, במצב DEV, תופיע כרטיסיה כתומה:

```
🔧 DEV Mode
משתמשי דמה לבדיקות
```

**לחץ על הכרטיסיה** ← תראה רשימה של משתמשי דמה

**לחץ על משתמש** ← השדות ימולאו אוטומטית

---

## 🔐 אבטחה

### מנגנון הגנה
1. **ENV Check**: המשתמשים פעילים רק ב-`__DEV__` mode
2. **No Production**: בפרודקשן, הקוד לא יטען את משתמשי DEV
3. **Console Warnings**: התרעות במידה וה-module נטען בפרודקשן
4. **Weak Password**: סיסמה 123456 מיועדת ל-DEV בלבד!

### קובץ קוד
```typescript
// src/data/dev-users.ts
export const IS_DEV_MODE = process.env.NODE_ENV === 'development' || __DEV__;

if (!IS_DEV_MODE) {
  console.warn('⚠️ DEV users module imported in non-development environment!');
}
```

---

## 🧪 בדיקות

### תרחיש 1: התחברות כמורה
```bash
1. Email: teacher.demo@skillup.dev
2. Password: 123456
3. התחבר
✅ Expected: ניתוב ל-/(teacher) - Teacher Home
✅ Expected: Bottom nav: בית | יומן | פרופיל
✅ Expected: דשבורד כלכלי מוצג
✅ Expected: יומן עם לוח שנה
```

### תרחיש 2: התחברות כתלמיד
```bash
1. Email: student.demo@skillup.dev
2. Password: 123456
3. התחבר
✅ Expected: ניתוב ל-/(tabs) - Student Home
✅ Expected: Bottom nav: בית | חיפוש | השיעורים שלי | פרופיל
✅ Expected: רשימת מורים מוצגת
```

### תרחיש 3: סיסמה שגויה
```bash
1. Email: teacher.demo@skillup.dev
2. Password: wrong-password
3. התחבר
✅ Expected: הודעת שגיאה
✅ Expected: "כתובת אימייל או סיסמה שגויים"
```

### תרחיש 4: החלפת משתמש
```bash
1. התחבר כמורה
2. התנתק
3. התחבר כתלמיד
✅ Expected: מעבר בין ממשקים עובד
✅ Expected: נתונים מתנקים בין משתמשים
```

---

## 🛠️ הוספת משתמש DEV חדש

### שלב 1: הוסף ל-dev-users.ts
```typescript
// src/data/dev-users.ts

export const DEV_NEW_USER: DevUser = {
  id: 'dev-newuser-001',
  email: 'newuser@skillup.dev',
  password: '123456',
  profile: {
    id: 'dev-newuser-001',
    role: 'teacher', // או 'student'
    displayName: 'שם חדש',
    bio: 'תיאור',
    // ... שאר השדות
  },
};

// הוסף למערך DEV_USERS
export const DEV_USERS: DevUser[] = [
  DEV_TEACHER_USER,
  DEV_STUDENT_USER,
  DEV_NEW_USER, // ✅ הוסף כאן
];
```

### שלב 2: בדוק
```bash
npm start
# התחבר עם newuser@skillup.dev / 123456
```

---

## 📊 נתונים זמניים (Stub Data)

משתמשי DEV מחוברים לנתוני דמה מ:

### עבור מורים
```typescript
// src/data/teacher-data.ts

getTeacherStats()          // סטטיסטיקות
getMonthlyGrowthData()     // גרף 12 חודשים
getLessonsForDate(date)    // שיעורים ליום
getTeacherNotifications()  // התראות
```

### נתונים דמה קיימים:
- **45 תלמידים** (סה״כ)
- **32 תלמידים פעילים**
- **487 שיעורים** שבוצעו
- **₪18,500 הכנסה** חודשית
- **שיעורים ביומן** (זמניים לפי seed)

---

## 🔍 Debug

### Console Logs
במצב DEV, תראה לוגים:

```
🔧 DEV Mode: Attempting login with dev user: teacher.demo@skillup.dev
✅ DEV Login successful! Role: teacher
📝 Using DEV profile: ד״ר אביב כהן (teacher)
```

### בדיקת מצב DEV
```typescript
import { IS_DEV_MODE } from '@/data/dev-users';

console.log('DEV Mode:', IS_DEV_MODE); // true in dev
```

### בדיקת משתמש נוכחי
```typescript
const { profile } = useAuth();
console.log('Current user:', profile?.displayName, profile?.role);
```

---

## ⚠️ בעיות נפוצות

### ❓ "משתמש לא נמצא"
**A**: ודא שאתה במצב DEV (`npm start`, לא production build)

### ❓ "סיסמה שגויה"
**A**: הסיסמה היא `123456` (6 תווים, ללא רווחים)

### ❓ "לא רואה כרטיסיית DEV במסך Login"
**A**: ודא ש-`IS_DEV_MODE === true`. בדוק console logs.

### ❓ "מנותב לממשק לא נכון"
**A**: בדוק את ה-`profile.role` בקונסול. צריך להיות 'teacher' או 'student'.

### ❓ "נתונים לא מוצגים בדשבורד"
**A**: stub data ב-`teacher-data.ts` מוחזר תמיד. בדוק console errors.

---

## 🚨 חשוב לזכור

### ✅ מה מותר
- שימוש במשתמשי DEV למטרות בדיקה
- הוספת משתמשי DEV נוספים
- שינוי נתוני stub לבדיקות

### ❌ מה אסור
- שימוש בסיסמאות חלשות בפרודקשן
- העלאת משתמשי DEV לפרודקשן
- שינוי `IS_DEV_MODE` ל-true בפרודקשן
- שמירת סיסמאות גלויות בקוד פרודקשן

---

## 📝 Commits

כאשר מוסיפים משתמש DEV חדש:

```bash
git add src/data/dev-users.ts
git commit -m "feat(dev): add new DEV test user for [purpose]"
```

---

## 📞 תמיכה

### לוגים שימושיים
```typescript
// src/features/auth/auth-context.tsx
console.log('🔧 DEV Mode: Attempting login...');
console.log('✅ DEV Login successful!');
console.log('📝 Using DEV profile:...');
```

### קבצים רלוונטיים
- `src/data/dev-users.ts` - הגדרות משתמשים
- `src/features/auth/auth-context.tsx` - לוגיקת התחברות
- `src/components/dev/DevUsersHelper.tsx` - רכיב UI
- `app/(auth)/login.tsx` - מסך login

---

## 🎯 סיכום

| משתמש | Email | Password | Role | ממשק |
|-------|-------|----------|------|------|
| מורה | `teacher.demo@skillup.dev` | `123456` | Teacher | Teacher App |
| תלמיד | `student.demo@skillup.dev` | `123456` | Student | Student App |

**מצב**: DEV בלבד ✅  
**אבטחה**: Protected ✅  
**נתונים**: Stub data ✅

---

*עודכן: 09/10/2024*  
*גרסה: 1.0*

