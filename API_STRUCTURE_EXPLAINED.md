# מבנה ה-API - הסבר על הקבצים

## 📁 שני קבצים דומים - מטרות שונות

### 1️⃣ `teachersAPI.ts` (עם S - רבים) 
**🎯 מטרה:** פונקציות לצד **תלמיד** - חיפוש וצפייה במורים

**שימוש:**
- מסך חיפוש מורים
- רשימת מורים מומלצים
- דף פרטי מורה (לתצוגה)
- ביקורות על מורה

**פונקציות עיקריות:**
```typescript
// קבלת מורה לפי ID (לתצוגה)
getTeacherById(teacherId: string)

// חיפוש מורים עם פילטרים
getTeachers({ 
  subjectId, 
  location, 
  minRate, 
  maxRate, 
  searchQuery 
})

// מורים מומלצים לדף הבית
getFeaturedTeachers(limit: number)

// נושאי המורה
getTeacherSubjects(teacherId: string)

// ביקורות על המורה
getTeacherReviews(teacherId: string, limit?: number)

// סטטיסטיקות דירוג
getTeacherRatingStats(teacherId: string)
```

**קבצים שמשתמשים:**
- `app/(tabs)/search.tsx` - חיפוש מורים
- `app/(tabs)/index.tsx` - מורים מומלצים
- `app/(tabs)/teacher/[id].tsx` - דף מורה ספציפי

---

### 2️⃣ `teacherAPI.ts` (בלי S - יחיד)
**🎯 מטרה:** פונקציות לצד **מורה** - ניהול פרופיל וזמינות

**שימוש:**
- עריכת פרופיל המורה
- ניהול לוח זמנים
- קביעת זמינות
- הגדרות אישיות

**פונקציות עיקריות:**
```typescript
// עדכון פרופיל המורה (RPC)
updateTeacherProfile(teacherId: string, updates: {...})

// קבלת פרופיל לעריכה
getTeacherProfile(teacherId: string)

// ניהול זמינות
getTeacherAvailabilitySlots(teacherId, startDate, endDate)
upsertAvailabilitySlots(teacherId, date, slots)
closeDay(teacherId, date)
openDay(teacherId, date, options)
deleteAvailabilitySlot(slotId)

// Realtime subscriptions
subscribeToTeacherAvailability(teacherId, callback)
subscribeToTeacherProfile(teacherId, callback)
```

**קבצים שמשתמשים:**
- `app/(teacher)/edit-teacher-profile.tsx` - עריכת פרופיל
- `app/(teacher)/calendar.tsx` - לוח זמנים
- `app/(teacher)/profile.tsx` - דף פרופיל המורה

---

## 🔑 ההבדלים המרכזיים

| היבט | teachersAPI.ts (רבים) | teacherAPI.ts (יחיד) |
|------|---------------------|-------------------|
| **משתמש** | תלמידים | מורים |
| **גישה** | READ-ONLY (קריאה) | READ-WRITE (כתיבה) |
| **טבלה ראשית** | `teacher_profiles_with_stats` (VIEW) | `profiles` (TABLE) |
| **עדכונים** | ❌ לא | ✅ כן (RPC) |
| **זמינות** | קריאה בלבד | ניהול מלא |
| **Types** | `@/types/api` | טיפוסים פנימיים |

---

## 🛠️ למה שני קבצים נפרדים?

### 1. **הפרדת אחריות (Separation of Concerns)**
```
תלמידים ← teachersAPI ← teacher_profiles_with_stats (VIEW)
מורים   ← teacherAPI  ← profiles + RPC functions
```

### 2. **אבטחה (Security)**
- `teachersAPI`: קריאה בלבד - תלמידים לא יכולים לשנות
- `teacherAPI`: כתיבה - רק המורה המחובר יכול לעדכן את עצמו

### 3. **ביצועים (Performance)**
- `teachersAPI`: משתמש ב-VIEW אופטימלי עם סטטיסטיקות
- `teacherAPI`: עדכונים ישירים דרך RPC (עוקף cache)

---

## 📝 דוגמאות שימוש

### תלמיד מחפש מורה:
```typescript
import { getTeachers, getTeacherById } from '@/services/api/teachersAPI';

// חיפוש מורים במתמטיקה
const { teachers } = await getTeachers({ 
  subjectId: 'math-uuid',
  location: 'תל אביב',
  maxRate: 200 
});

// לחיצה על מורה → צפייה בפרטים
const teacher = await getTeacherById(teacherId);
```

### מורה מעדכן פרופיל:
```typescript
import { updateTeacherProfile } from '@/services/api/teacherAPI';

// עדכון פרופיל (דרך RPC)
await updateTeacherProfile(teacherId, {
  displayName: 'יוסי כהן',
  hourlyRate: 180,
  lessonModes: ['online', 'at_teacher'],
  durationOptions: [45, 60, 90]
});
```

### מורה מנהל לוח זמנים:
```typescript
import { 
  upsertAvailabilitySlots, 
  closeDay 
} from '@/services/api/teacherAPI';

// הוספת זמינות
await upsertAvailabilitySlots(teacherId, '2024-01-15', [
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' }
]);

// סגירת יום
await closeDay(teacherId, '2024-01-20');
```

---

## ✅ סיכום

**כן, צריך את שני הקבצים!**

- `teachersAPI.ts` = לתלמידים (חיפוש וצפייה)
- `teacherAPI.ts` = למורים (ניהול ועדכון)

כל אחד משרת מטרה שונה ועובד עם טבלאות/views שונות.

---

## 🐛 שגיאות שתוקנו

### בעיה:
```
Property 'role' does not exist on type 'never'
```

### פתרון:
הוספנו `as any` type assertions:
```typescript
// לפני
return profile?.role === 'teacher';

// אחרי
return (profile as any)?.role === 'teacher';
```

זה פתרון זמני עד לסנכרון מלא של `types/database.ts` עם הסכימה.

