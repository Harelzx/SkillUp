# Booking Flow - Real Data Integration - QA Guide

## סיכום השינויים

השלמת אינטגרציה מלאה של זרימת ההזמנה עם נתונים אמיתיים מהמורה ומה-database.

---

## 🎯 מה שונה?

### לפני:
- ❌ נתונים mock קשיחים (MOCK_TEACHER, MOCK_AVAILABLE_SLOTS)
- ❌ אין חיבור לנתוני מורה אמיתיים
- ❌ אין זמינות אמיתית
- ❌ אין validation עם יכולות המורה
- ❌ מחיר קבוע ללא קשר למורה

### אחרי:
- ✅ נתונים אמיתיים מ-Supabase
- ✅ שליפת פרופיל מלא של מורה (subjects, modes, rate, location)
- ✅ זמינות אמיתית מ-availability_slots עם סינון bookings
- ✅ Validation מלא - רק subjects/modes/durations נתמכים
- ✅ מחיר דינמי לפי teacher.hourly_rate
- ✅ Reset מלא בהחלפת מורה

---

## 🔧 קבצים שנוצרו/עודכנו

### Hooks חדשים:
1. **`src/hooks/useTeacherBookingData.ts`**
   - שליפת נתוני מורה מרוכזת
   - Profile + Subjects + Lesson modes + Duration options
   - Cache 5 דקות

2. **`src/hooks/useTeacherAvailability.ts`**
   - זמינות אמיתית מ-availability_slots
   - סינון bookings confirmed/awaiting_payment
   - קיבוץ לפי ימים + timezone conversion
   - Cache 2 דקות + refetch on focus

### קומפוננטות מעודכנות:
3. **`app/(booking)/book-lesson.tsx`**
   - אינטגרציה עם hooks
   - Loading/Error states
   - Reset logic בהחלפת מורה
   - Validation עם נתוני מורה אמיתיים

4. **`src/components/booking/BookingStep1.tsx`**
   - סינון subjects לפי teacher.subjects
   - סינון modes לפי teacher.lesson_modes
   - סינון durations לפי teacher.duration_options

5. **`src/components/booking/BookingStep2.tsx`**
   - תאריכון עם זמינות אמיתית
   - המרת timezone
   - הצגת slots פנויות בלבד

6. **`src/components/booking/BookingStep3.tsx`**
   - הצגת מיקום המורה (at_teacher mode)
   - אזורים שהמורה מכסה (at_student mode)
   - אונליין - הודעה מתאימה

7. **`src/components/booking/BookingStep4.tsx`**
   - avatar + rating של מורה
   - כל הנתונים האמיתיים

8. **`src/components/booking/BookingStep5.tsx`**
   - חישוב מחיר מ-teacher.hourly_rate
   - פירוט מדויק

### תלויות:
- ✅ הותקנו: `date-fns`, `date-fns-tz`

---

## 📋 QA Checklist - איך לבדוק?

### בדיקה 1: טעינת נתוני מורה ✅

**צעדים:**
1. פתח אפליקציה
2. בחר מורה מהרשימה
3. לחץ "הזמן עכשיו"

**תוצאה צפויה:**
- ✅ Loading spinner מופיע
- ✅ "טוען נתוני מורה..." נראה
- ✅ אחרי טעינה - Step 1 מופיע עם subjects של המורה

**Edge Cases:**
- מורה לא פעיל (`is_active=false`) → הודעת שגיאה "המורה אינו פעיל כעת"
- מורה ללא subjects → הודעה "המורה לא הגדיר נושאי הוראה"
- שגיאת רשת → הודעת שגיאה + כפתור "חזור"

---

### בדיקה 2: Step 1 - פרטי שיעור ✅

**צעדים:**
1. בדוק את רשימת הנושאים
2. בדוק את סוגי השיעור
3. בדוק את משכי השיעור

**תוצאה צפויה:**
- ✅ רק subjects שהמורה מלמד מופיעים
- ✅ רק lesson modes נתמכים (online/at_teacher/at_student)
- ✅ רק durations מותרים (45/60/90 או לפי teacher_settings)

**Validation:**
- בחירת subject שאינו של המורה → שגיאת validation
- בחירת mode לא נתמך → שגיאת validation
- בחירת duration לא מותר → שגיאת validation

---

### בדיקה 3: Step 2 - בחירת מועד ✅

**צעדים:**
1. עבור ל-Step 2
2. בדוק ימים בתאריכון
3. בחר יום עם זמינות
4. בדוק שעות זמינות

**תוצאה צפויה:**
- ✅ ימים עם זמינות מסומנים (נקודה כחולה)
- ✅ ימים ללא זמינות אפורים + disabled
- ✅ בחירת יום → הצגת שעות זמינות בלבד
- ✅ שעות חסומות (is_booked או bookings) לא מופיעות

**Edge Cases:**
- אין זמינות בכלל → "אין זמינות - המורה לא הגדיר משבצות"
- יום עבר → disabled
- slot שנתפס בזמן אמת → לא מופיע (אם יש realtime)

---

### בדיקה 4: Step 3 - מיקום ✅

**תרחישים:**

#### Online:
- ✅ הודעה: "קישור לשיעור יישלח במייל"
- ✅ טיפ: "הקפד להיות זמין 5 דקות לפני"

#### At Teacher:
- ✅ הצגת teacher.location
- ✅ אם יש areas → הצג כתת-כתובת
- ✅ הודעה: "הכתובת המדויקת תישלח לאחר אישור"

#### At Student:
- ✅ שדה כתובת לתלמיד
- ✅ "המורה יגיע לכתובת זו"

---

### בדיקה 5: Step 4 - סיכום ✅

**תוצאה צפויה:**
- ✅ תמונת מורה (avatar או placeholder)
- ✅ שם מלא: teacher.display_name
- ✅ דירוג: avg_rating (אם > 0)
- ✅ נושא: בדיוק מה שנבחר
- ✅ משך: duration שנבחר
- ✅ תאריך ושעה: המרה נכונה לזמן מקומי
- ✅ מיקום: לפי mode
- ✅ תיבת סימון תקנון

---

### בדיקה 6: Step 5 - תשלום ✅

**חישוב מחיר:**
```
hourlyRate = teacher.hourly_rate (או 150 default)
subtotal = hourlyRate × (duration / 60)
creditsUsed = min(availableCredits, subtotal) if useCredits
discount = coupon logic
total = subtotal - creditsUsed - discount
```

**תוצאה צפויה:**
- ✅ פירוט: "₪150 × 60 דקות" (לדוגמה)
- ✅ ביניים: ₪150.00
- ✅ קרדיטים: -₪50 (אם בשימוש)
- ✅ סה"כ: ₪100.00 (מחושב נכון)

---

### בדיקה 7: החלפת מורה ✅

**צעדים:**
1. התחל booking עם מורה A
2. מלא 2-3 שלבים
3. חזור אחורה ובחר מורה B
4. התחל booking מחדש

**תוצאה צפויה:**
- ✅ כל הנתונים מתאפסים (subject, date, timeSlot, וכו')
- ✅ Step חוזר ל-1
- ✅ Errors מתנקים
- ✅ Payment method מתאפס
- ✅ Idempotency key מתאפס

---

### בדיקה 8: סיום הזמנה ✅

**צעדים:**
1. מלא את כל 5 השלבים
2. לחץ "אשר ושלם"

**תוצאה צפויה:**
- ✅ createBooking נקרא עם:
  - `teacherId` נכון
  - `subject` מה-step1
  - `mode` מה-step1 (online/student_location/teacher_location)
  - `durationMinutes` מה-step1
  - `startAt` ISO מה-step2 (slot.start_at)
  - `hourlyRate` snapshot מ-teacher.hourly_rate
- ✅ Alert הצלחה עם booking_id
- ✅ Invalidate queries (bookings, availability, credits)
- ✅ Navigate למסך ראשי

---

## 🔍 בדיקות Edge Cases

### 1. מורה ללא hourly_rate
- ✅ Default: 150 ש"ח/שעה

### 2. מורה ללא duration_options
- ✅ Default: [45, 60, 90]

### 3. מורה ללא lesson_modes
- ✅ Default: ['online', 'student_location', 'teacher_location']

### 4. מורה ללא location
- ✅ at_teacher mode: "הכתובת תישלח לאחר אישור" (ללא פירוט)

### 5. מורה ללא availability
- ✅ "אין זמינות - המורה לא הגדיר משבצות"

### 6. Timezone conversion
- ✅ Slots מוצגים בזמן מקומי (Asia/Jerusalem)
- ✅ startAt נשלח ב-UTC ISO format

---

## 🧪 סניפורים לבדיקה

### סניפור 1: Booking מלא עם מורה דוד לוי
```
1. בחר מורה: דוד לוי
2. Subject: מתמטיקה (אמור להיות ברשימה)
3. Mode: אונליין
4. Duration: 60 דקות
5. Date: 15/10/2025 (אם יש זמינות)
6. Time: 10:00
7. Location: skip (online)
8. Summary: וודא שכל הפרטים נכונים
9. Payment: בחר כרטיס, לחץ אשר
10. ✅ Booking נוצר בהצלחה
```

### סניפור 2: החלפת מורה באמצע
```
1. התחל booking עם שרה כהן
2. מלא Subject: אנגלית
3. מלא Date + Time
4. חזור למסך ראשי (X)
5. בחר מורה אחר: רחל בן-עמי
6. התחל booking
7. ✅ ודא: subjects של רחל, לא של שרה
8. ✅ ודא: date/time ריקים
```

### סניפור 3: מורה לא פעיל
```
1. עדכן DB: UPDATE profiles SET is_active=false WHERE id='...'
2. נסה להתחיל booking
3. ✅ הודעה: "המורה אינו פעיל כעת"
4. ✅ כפתור "חזור" עובד
```

---

## 🐛 בעיות ידועות / Limitations

1. **Realtime updates:** 
   - אין עדיין realtime subscription לעדכון slots בזמן אמת
   - Refetch on window focus פועל

2. **Teacher settings:**
   - אין טבלת teacher_settings במסד הנתונים עדיין
   - משתמשים ב-defaults

3. **Areas validation:**
   - אין validation שכתובת התלמיד בטווח areas של המורה
   - מוצג רק UI hint

---

## ✅ הצלחה = כל הבדיקות עוברות

בצע את כל הבדיקות לעיל. אם:
- ✅ כל ה-subjects/modes/durations מסוננים לפי מורה
- ✅ Availability מציגה רק slots פנויות
- ✅ Price מחושב נכון מ-teacher.hourly_rate
- ✅ Teacher change עושה reset מלא
- ✅ Booking נוצר עם כל הנתונים הנכונים

**→ האינטגרציה הצליחה! 🎉**

---

## 📝 הערות למפתחים

### Cache Strategy:
- Teacher data: 5 min staleTime
- Availability: 2 min staleTime + refetch on focus
- Keys: `['teacher-booking-data', teacherId]`, `['teacher-availability', teacherId]`

### Cleanup:
- useEffect מאזין ל-teacherId changes
- מנקה state בהחלפת מורה
- previousTeacherIdRef עוקב אחרי שינויים

### TypeScript:
- יצרנו `BookingMode` type במקום hardcoded strings
- `TeacherBookingProfile` extends TeacherProfile
- כל ה-props typed נכון

### Performance:
- Memoization ב-useMemo לחישובי pricing
- React Query cache מונע fetches מיותרים
- Parallel reads אפשריים עם useQuery

---

## 🚀 צעדים הבאים (אופציונלי)

1. **Realtime Subscriptions:**
   - Subscribe to `availability_slots` changes
   - Subscribe to `bookings` inserts
   - Auto-refresh slots on changes

2. **Teacher Settings Table:**
   - Create `teacher_settings` table
   - duration_options, max_students, notice_hours, areas

3. **Areas Validation:**
   - Geocoding API
   - Distance calculation
   - Warning if student address out of range

4. **Optimistic Updates:**
   - Mark slot as "pending" immediately on click
   - Rollback if booking fails

5. **Analytics:**
   - Track booking completion rate
   - Track step drop-offs
   - A/B test different flows

