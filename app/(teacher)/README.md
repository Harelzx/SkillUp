# Teacher Interface - ממשק מורים

## סקירה כללית

ממשק ייעודי למורים בפלטפורמת SkillUp, נגיש רק למשתמשים עם `role='teacher'`.

## מבנה

```
app/(teacher)/
├── _layout.tsx       # Layout מוגן עם bottom navigation
├── index.tsx         # דף בית: התראות + דשבורד כלכלי
├── calendar.tsx      # יומן עם לוח שנה ויזואלי
├── profile.tsx       # פרופיל מורה
└── README.md         # מסמך זה
```

## תכונות

### 1. Layout מוגן (_layout.tsx)
- **Guard**: בדיקה אוטומטית של role - רק מורים יכולים לגשת
- **Redirect**: משתמשים שאינם מורים מופנים לממשק תלמידים
- **Navigation**: Tab bar תחתון עם 3 כפתורים:
  - 🏠 בית (Home)
  - 📅 יומן (Calendar)
  - 👤 פרופיל (Profile)
- **RTL Support**: תמיכה מלאה בעברית ו-RTL
- **Accessibility**: תוויות נגישות, keyboard navigation

### 2. דף בית (index.tsx)

#### חלונית התראות
- שימוש ב-`InfoBanner` קיים עם מסרים למורה
- מסרים זמניים מ-`src/data/teacher-data.ts`
- דפדוף אוטומטי כל 10 שניות
- סוגי הודעות:
  - `LESSON_REMINDER_TEACHER`: תזכורת לשיעור עם תלמיד
  - `SYSTEM`: הודעות מערכת (תשלומים, ביקורות וכו')

#### דשבורד כלכלי
- **כרטיסיות נתונים** (Scroll אופקי):
  - תלמידים (סה״כ)
  - תלמידים פעילים
  - שיעורים שבוצעו
  - הכנסה חודשית (₪)
- **גרף צמיחה חודשי**:
  - 12 חודשים אחרונים
  - מיתוג בין "הכנסות" ו"שיעורים"
  - עמודות צבעוניות עם values
  - Scroll אופקי

#### עיצוב
- Colors: Primary/Blue/Green/Purple/Orange palettes
- Shadows: elevation קלה
- Border Radius: 14-16px
- Spacing: consistent 12-16px
- Typography: ערכים גדולים בולדים, תיאורים משניים

### 3. יומן (calendar.tsx)

#### תכונות עיקריות
- **Grid חודשי**: 7×6 ימים
- **ניווט**:
  - חיצים: חודש קודם/הבא
  - כפתור "היום": חזרה לחודש נוכחי
- **סימונים**:
  - יום נוכחי: מסגרת כחולה + רקע
  - ימים עם שיעורים: dot כחול מתחת ליום
- **לחיצה על יום**: פותחת Modal עם:
  - תאריך מלא (יום בשבוע + תאריך)
  - רשימת שיעורים: תלמיד, נושא, שעה, מיקום
  - ריק: "אין שיעורים בתאריך זה"
- **Legend**: הסבר על הסימונים

#### נגישות
- `accessibilityLabel` לכל יום
- `accessibilityHint` עם מספר שיעורים
- `accessibilityRole="button"` ליומן
- ESC לסגירת Modal

### 4. פרופיל (profile.tsx)

#### תכונות
- **כרטיס פרופיל**: Avatar, שם, bio, תג "חשבון מורה"
- **תפריטים**:
  - חשבון: עריכת פרופיל, הגדרות, התראות
  - תשלום: אמצעי תשלום
  - תמיכה: עזרה, פרטיות
  - התנתקות
- **ניווט**: routing לדפי profile קיימים (שיתוף עם תלמידים)

## נתונים זמניים (Stub Data)

כל הנתונים נמצאים ב-`src/data/teacher-data.ts`:

### פונקציות זמינות
```typescript
getTeacherStats()              // סטטיסטיקות מורה
getMonthlyGrowthData()         // נתוני צמיחה 12 חודשים
getUpcomingTeacherLessons()    // שיעורים קרובים
getLessonsForDate(date)        // שיעורים לתאריך ספציפי
getTeacherNotifications()      // התראות למורה
```

### החלפה ב-API אמיתי
להחליף את הקריאות ל-stub functions בקריאות Supabase:
```typescript
// Old:
const stats = getTeacherStats();

// New:
const { data: stats } = useQuery({
  queryKey: ['teacherStats', teacherId],
  queryFn: () => supabase.from('teacher_stats').select('*').single()
});
```

## תרגומים

כל התרגומים ב-`src/lib/i18n.ts` תחת:
```typescript
teacher: {
  accessDenied: 'גישה מוגבלת',
  accessDeniedMessage: 'ממשק זה מיועד למורים בלבד',
  tabs: { home: 'בית', calendar: 'יומן', profile: 'פרופיל' }
}
```

## Routing

### ניתוב אוטומטי (app/index.tsx)
```typescript
if (profile.role === 'teacher') {
  router.replace('/(teacher)');  // → Teacher interface
} else {
  router.replace('/(tabs)');     // → Student interface
}
```

### גישה ידנית
```typescript
router.push('/(teacher)');           // → Home
router.push('/(teacher)/calendar');  // → Calendar
router.push('/(teacher)/profile');   // → Profile
```

## Accessibility

### נגישות מובנית
- ✅ Screen reader support (accessibilityLabel/Hint/Role)
- ✅ Keyboard navigation (Tab, Arrow keys, Enter, Esc)
- ✅ Touch targets ≥44px
- ✅ Color contrast AA+
- ✅ Reduce motion support (InfoBanner)

### בדיקות נגישות
1. VoiceOver (iOS) / TalkBack (Android)
2. Keyboard only navigation
3. High contrast mode
4. Large text sizes

## Dark Mode

המערכת תומכת ב-Dark Mode דרך `GluestackUIProvider`.
כרגע מוגדר ל-`mode='light'` בברירת מחדל.

### להפעלת Dark Mode:
```typescript
// app/_layout.tsx
<GluestackUIProvider mode="dark">  // או "system"
```

כל הרכיבים משתמשים ב-`colors` מ-`@/theme/tokens` ויתאימו אוטומטית.

## Performance

### אופטימיזציות
- ✅ `useMemo` לחישובי יומן
- ✅ `useCallback` לפונקציות כבדות
- ✅ Lazy loading של Modal
- ✅ Virtualization (FlatList) לרשימות ארוכות
- ✅ Cache של נתונים (React Query)

### בדיקות ביצועים
```bash
# Profile with React DevTools Profiler
npm run start
# Open app → Profile → Record interactions
```

## Testing

### בדיקות ידניות
1. **Login as Teacher**: profile.role = 'teacher'
2. **Home Screen**:
   - [ ] חלונית התראות מתחלפת כל 10 שניות
   - [ ] כרטיסיות נתונים נגללות אופקית
   - [ ] גרף מוצג עם נתונים תקינים
   - [ ] מיתוג הכנסות/שיעורים עובד
3. **Calendar**:
   - [ ] ניווט חודשים פועל
   - [ ] יום נוכחי מסומן
   - [ ] ימים עם שיעורים מוצגים עם dot
   - [ ] לחיצה על יום פותחת Modal
   - [ ] Modal מציג שיעורים נכון
   - [ ] ריק מוצג עבור ימים ללא שיעורים
4. **Profile**:
   - [ ] פרופיל מוצג נכון
   - [ ] תפריטים ניתנים ללחיצה
   - [ ] התנתקות עובדת
5. **Navigation**:
   - [ ] Tab bar מחליף מסכים
   - [ ] Active tab מסומן
   - [ ] RTL תקין

### בדיקות אוטומטיות
```typescript
// __tests__/teacher/calendar.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import CalendarScreen from '@/app/(teacher)/calendar';

test('should show modal on day press', () => {
  const { getByText, getByTestId } = render(<CalendarScreen />);
  const day = getByText('15');
  fireEvent.press(day);
  expect(getByTestId('day-modal')).toBeTruthy();
});
```

## הרחבות עתידיות

### תכונות מוצעות (לא מיושמות)
1. **Calendar**:
   - [ ] כפתור "צור שיעור" מהיומן
   - [ ] יצוא לו"ז (ICS format)
   - [ ] תצוגת שבוע/יום
   - [ ] Drag & Drop לשיעורים
2. **Dashboard**:
   - [ ] פילטרים לגרף (שנה/חודש/שבוע)
   - [ ] Compare periods
   - [ ] Export data (CSV/PDF)
3. **Home**:
   - [ ] פניה מהירה לתלמיד (Quick message)
   - [ ] Pending requests badge
   - [ ] Notifications center

## תמיכה טכנית

### בעיות נפוצות

**Q: משתמש לא רואה ממשק מורה**
A: ודא ש-`profile.role === 'teacher'` ב-Supabase

**Q: שגיאת "Cannot read property 'role'"**
A: וודא ש-AuthContext מספק profile (לא null)

**Q: נתונים לא מוצגים**
A: בדוק ש-stub functions מחזירים נתונים ב-`teacher-data.ts`

**Q: Tab bar לא מוצג**
A: ודא ש-SafeAreaView עוטף את המסך

### Logs
```typescript
console.log('Teacher profile:', profile);
console.log('Current route:', router);
console.log('Stats:', getTeacherStats());
```

## עדכונים

### Changelog
- **v1.0.0** (2024-10-09): הקמה ראשונית של ממשק מורים
  - Layout מוגן עם Guard
  - דף בית עם דשבורד + התראות
  - יומן עם Grid חודשי ו-Modal
  - פרופיל משותף עם אזורים ייעודיים

## מפתחים

עבור שאלות נוספות או תמיכה, פנה לצוות הפיתוח.

