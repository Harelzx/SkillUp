# תיקון הצגת שיעורים מבוטלים

## 🐛 הבעיה

כאשר תלמיד מבטל שיעור עתידי:
1. ❌ השיעור **נעלם** מ"שיעורים קרובים"
2. ❌ השיעור **לא מופיע** ב"שיעורים קודמים"
3. ❌ התלמיד לא יכול לראות היסטוריה של שיעורים מבוטלים
4. ❌ חווית משתמש גרועה - נראה כאילו השיעור נמחק

## 🔍 הסיבה השורשית

### בעיה 1: לוגיקת סינון ב-API
**קובץ**: `src/services/api/bookingsAPI.ts` (שורות 34-44)

```typescript
// קוד ישן - ❌ בעייתי
if (params.upcoming) {
  query = query.gte('start_at', new Date().toISOString());
  query = query.in('status', ['pending', 'confirmed', 'awaiting_payment']);
} else {
  query = query.lt('start_at', new Date().toISOString()); // ❌ רק תאריך עבר!
}
```

**הבעיה:**
- שיעור שמבוטל **היום** אבל התאריך שלו **מחר**
- לא יופיע ב-`upcoming` (כי הסטטוס cancelled)
- לא יופיע ב-`past` (כי התאריך עתידי)
- **תוצאה: השיעור נעלם!**

### בעיה 2: Cache לא מתרענן
**קובץ**: `app/(tabs)/lessons.tsx` (שורה 187)

```typescript
// קוד ישן - ❌ לא מרענן את past
queryClient.invalidateQueries({ queryKey: ['myBookings'] });
```

**הבעיה:**
- מרענן רק את כל ה-queries ביחד
- לא מבטיח שה-`past` tab יתרענן
- המשתמש צריך לרענן ידנית

## ✅ הפתרון

### 1. תיקון לוגיקת ה-API
**קובץ**: [src/services/api/bookingsAPI.ts](src/services/api/bookingsAPI.ts:41-43)

```typescript
// קוד חדש - ✅ נכון
else {
  // For past: include completed/cancelled lessons OR lessons in the past
  // This ensures cancelled lessons show up immediately in past, regardless of their original date
  query = query.or(`status.eq.completed,status.eq.cancelled,start_at.lt.${new Date().toISOString()}`);
}
```

**הסבר:**
- ✅ שיעור מבוטל מופיע ב-past **תמיד**, גם אם התאריך עתידי
- ✅ שיעור completed מופיע ב-past **תמיד**
- ✅ שיעורים עם תאריך עבר מופיעים ב-past
- ✅ שימוש ב-`OR` במקום `AND` - כל אחד מהתנאים מספיק

### 2. שיפור רענון ה-Cache + מעבר אוטומטי לטאב
**קובץ**: [app/(tabs)/lessons.tsx](app/(tabs)/lessons.tsx:186-191)

```typescript
// קוד חדש - ✅ משופר
// Refresh both upcoming and past bookings to show cancelled lesson in past
await queryClient.invalidateQueries({ queryKey: ['myBookings', 'upcoming'] });
await queryClient.invalidateQueries({ queryKey: ['myBookings', 'past'] });

// Switch to past tab to show the cancelled lesson
setActiveTab('past');
```

**שיפורים:**
- ✅ מרענן **שני** ה-queries במפורש (upcoming + past)
- ✅ משתמש ב-`await` כדי להבטיח שה-refresh הושלם
- ✅ **עובר אוטומטית** לטאב "שיעורים קודמים"
- ✅ הודעת toast מתאימה: "השיעור בוטל והועבר לשיעורים קודמים"

## 🎯 זרימה מלאה אחרי התיקון

### לפני הביטול:
```
שיעורים קרובים: [שיעור A - מחר, 10:00]
שיעורים קודמים: []
```

### לוחץ "ביטול שיעור" → מאשר ביטול:
```
1. קריאה ל-API: cancelBooking(lessonId, 'credits')
2. הסטטוס משתנה ל-'cancelled' ב-DB
3. Invalidate cache של upcoming + past
4. מעבר אוטומטי לטאב "שיעורים קודמים"
5. Query מתבצע מחדש עם הלוגיקה החדשה
```

### אחרי הביטול:
```
שיעורים קרובים: []
שיעורים קודמים: [שיעור A - מחר, 10:00 - סטטוס: מבוטל ❌]
                  ↑
         המשתמש רואה אותו כאן מיד!
```

## 📋 קבצים ששונו

### שינויים (2 קבצים):
1. **`src/services/api/bookingsAPI.ts`** - שורות 41-43
   - שינוי לוגיקת הסינון ל-`OR` במקום תאריך בלבד
   - תמיכה בשיעורים מבוטלים עם תאריך עתידי

2. **`app/(tabs)/lessons.tsx`** - שורות 186-193
   - רענון מפורש של שני ה-queries
   - מעבר אוטומטי לטאב past
   - הודעת toast מתאימה

### נוצר:
- **`CANCELLED_LESSONS_FIX.md`** - מסמך זה

## 🧪 בדיקה

### תרחיש 1: ביטול שיעור עתידי
1. ✅ כנס ל"שיעורים קרובים"
2. ✅ בטל שיעור שמתוכנן למחר
3. ✅ אשר את הביטול
4. ✅ האפליקציה עוברת אוטומטית ל"שיעורים קודמים"
5. ✅ השיעור מופיע עם סטטוס "מבוטל" (אדום, AlertCircle)
6. ✅ הודעת Toast: "השיעור בוטל והועבר לשיעורים קודמים"

### תרחיש 2: ביטול שיעור היום
1. ✅ בטל שיעור שמתוכנן להיום
2. ✅ השיעור מופיע ב"שיעורים קודמים" מיד
3. ✅ הסטטוס נכון (cancelled)

### תרחיש 3: רענון ידני
1. ✅ משוך למטה ב"שיעורים קודמים"
2. ✅ השיעורים המבוטלים נשארים
3. ✅ אין כפילויות

## 🔍 אימות SQL

```sql
-- בדוק שיעורים מבוטלים עם תאריך עתידי
SELECT
  b.id,
  b.start_at,
  b.status,
  b.cancelled_at,
  p.display_name as student_name
FROM bookings b
JOIN profiles p ON p.id = b.student_id
WHERE b.status = 'cancelled'
  AND b.start_at > NOW()
ORDER BY b.cancelled_at DESC;

-- צריך להחזיר שיעורים שבוטלו היום אבל מתוכננים למחר
```

## 📊 השוואה: לפני vs אחרי

| תכונה | ❌ לפני | ✅ אחרי |
|-------|---------|---------|
| **שיעור מבוטל מופיע ב-past** | לא (נעלם) | כן |
| **מעבר אוטומטי לטאב past** | לא | כן |
| **הודעת הצלחה ברורה** | כן | משופרת |
| **תמיכה בתאריך עתידי** | לא | כן |
| **רענון cache** | חלקי | מלא |
| **UX** | מבלבל | ברור |

## 💡 טיפים

### למשתמש:
- אחרי ביטול, השיעור יופיע **תמיד** ב"שיעורים קודמים"
- אפשר ללחוץ "הזמן שוב" מהשיעור המבוטל
- הקרדיטים מוחזרים אוטומטית (אם היו)

### למפתח:
- השתמש ב-`OR` ב-Supabase queries כשיש מספר תנאים אלטרנטיביים
- תמיד invalidate **כל** ה-queries הרלוונטיים, לא רק את הראשון
- שקול מעבר אוטומטי לטאב המתאים ל-UX טוב יותר

---

**תאריך יצירה**: 30 אוקטובר 2025
**גרסה**: 1.0
**סטטוס**: ✅ תוקן ומוכן לשימוש
