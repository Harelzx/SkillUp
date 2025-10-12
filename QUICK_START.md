# 🚀 Quick Start - Booking System

## מה נבנה?
מערכת הזמנות **מלאה ומקצועית** שמחברת בין פרונטאנד (React Native) לבקאנד (Supabase) עם:
- ✅ טרנזקציות אטומיות
- ✅ Realtime updates
- ✅ Idempotency (מניעת כפילויות)
- ✅ Optimistic UI
- ✅ אבטחה מלאה (RLS)

---

## 📋 צעדים מהירים

### 1. הרץ מיגרציות (חובה!)

```bash
# Supabase Dashboard → SQL Editor → New Query
# העתק והדבק כל migration בנפרד:

# 1. migrations/005_enhance_booking_schema.sql
# 2. migrations/006_booking_system_complete.sql  
# 3. migrations/007_rls_policies_complete.sql
# 4. migrations/008_add_payment_ui_support.sql ✨ חדש!
```

**מה זה יוצר?**
- טבלאות: `idempotency_requests`, `availability_slots`, `payments`
- RPC functions: `create_booking`, `cancel_booking`, `reschedule_booking`
- RLS policies + triggers
- ✨ **שלב 6 תשלום**: `awaiting_payment` status, hold mechanism, payment method selection

### 2. נסה את ה-booking flow!

1. פתח את האפליקציה
2. נווט למסך מורה
3. לחץ "הזמן שיעור"
4. **שלבים 1-3**: מלא פרטי שיעור, מועד, מיקום
5. **שלב 4 - סיכום**: 
   - בדוק את כל הפרטים
   - סמן ✓ "קראתי ואישרתי את תנאי השימוש"
   - לחץ "המשך לתשלום"
6. **שלב 5 - תשלום**: ✨
   - הפעל קרדיטים (אם רוצה)
   - הזן קוד קופון (אופציונלי)
   - ראה פירוט מחיר דינמי
   - אם מכוסה בקרדיטים: מסך ירוק "מכוסה בקרדיטים! 🎉"
   - אחרת: בחר אמצעי תשלום (Apple Pay, Google Pay, כרטיס, Bit)
7. **לחץ "סיים הזמנה"** או "אשר ושלם" ← זה הרגע הקסום! 🎉
8. תראה הודעת הצלחה:
   - אם confirmed: "מעולה! השיעור הוזמן" + פרטים
   - אם awaiting_payment: "הזמנה נשמרה וממתינה לתשלום"

### 3. נסה ביטול

1. עבור ל"השיעורים שלי" (`/lessons`)
2. מצא שיעור עתידי
3. לחץ "ביטול שיעור"
4. בחר שיטת החזר (קרדיטים/כרטיס)
5. אשר
6. תקבל החזר לפי מדיניות (24h/12h)

---

## 🎯 מה עובד?

### ✅ Create Booking
- Double-click protection (idempotency)
- Timezone handling (UTC ↔ Asia/Jerusalem)
- Query invalidation אוטומטי
- הודעות שגיאה בעברית

### ✅ Cancel Booking
- מדיניות החזר (24h: 100%, 12h: 50%, <12h: 0%)
- Refund options (credits/card simulation)
- Query invalidation על ביטול
- Realtime releases slot

### ✅ Database
- Atomic transactions (all or nothing)
- Overlap prevention (trigger-level)
- RLS security (user can only see own bookings)
- Audit logging (כל פעולה נרשמת)

### ✅ Realtime (מוכן לשימוש)
- Hooks נוצרו: `useTeacherBookingRealtime`, `useAvailabilityRealtime`
- צריך רק להוסיף למסכים הרלוונטיים
- ראה `BOOKING_UI_INTEGRATION_GUIDE.md` לדוגמאות

---

## 📁 קבצים חשובים

| קובץ | תפקיד |
|------|-------|
| `app/(booking)/book-lesson.tsx` | תהליך הזמנה 5 שלבים |
| `src/components/bookings/BookingCard.tsx` | כרטיס הזמנה יחיד |
| `src/components/bookings/BookingsList.tsx` | רשימת הזמנות |
| `src/services/api/bookingsAPI.ts` | קריאות API |
| `src/hooks/useTeacherBookingRealtime.ts` | Realtime hook |
| `migrations/006_*.sql` | RPC functions |
| `migrations/007_*.sql` | RLS policies |

---

## 📚 מסמכים נוספים

- **`BOOKING_UI_INTEGRATION_GUIDE.md`** ← איך להשתמש בקומפוננטים
- **`BOOKING_BACKEND_SUMMARY.md`** ← הסבר טכני מעמיק
- **`migrations/BOOKING_SYSTEM_SETUP.md`** ← setup + testing

---

## 🐛 פתרון בעיות

### "Not authenticated"
```tsx
// ודא שהמשתמש מחובר לפני booking
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  Alert.alert('אנא התחבר');
  router.push('/(auth)/login');
}
```

### "השעה כבר תפוסה" (error 23505)
זה תקין! המערכת מונעת חפיפות. בחר שעה אחרת.

### התשלום תמיד נכשל (error 53000)
זו סימולציה (80% הצלחה). לבדיקות, שנה ל-100%:
```sql
-- In migration 006, line ~136
v_payment_simulated_success := true;
```

### Query לא מתעדכן
ודא queryKey תואם:
```tsx
// When invalidating
queryClient.invalidateQueries({ queryKey: ['bookings'] });

// When fetching
useQuery({ queryKey: ['bookings'], ... });
```

---

## ✨ Optional Enhancements

רוצה לקחת את זה לשלב הבא?

1. **הוסף Realtime לכל המסכים**
   ```tsx
   // TeacherCalendar.tsx
   useTeacherBookingRealtime(teacherId, (event) => {
     queryClient.invalidateQueries({ queryKey: ['calendar'] });
   });
   ```

2. **החלף Payment Simulation ב-Stripe אמיתי**
   - עדכן RPC function
   - שלב Stripe SDK
   - טפל ב-webhooks

3. **הוסף Push Notifications**
   - Firebase Cloud Messaging
   - שלח על booking_confirmed
   - שלח על booking_cancelled

4. **הוסף Email Confirmations**
   - Resend/SendGrid
   - Template בעברית
   - Attach calendar invite (ICS)

---

## 🎉 סיכום

**הכל מוכן לעבודה!**

1. ✅ מיגרציות רצות
2. ✅ UI מחובר לבקאנד
3. ✅ Idempotency + Optimistic UI
4. ✅ Error handling בעברית
5. ✅ אבטחה (RLS + triggers)
6. ✅ Realtime hooks (מוכנים)
7. ✅ תיעוד מלא

**פשוט הרץ את המיגרציות ותתחיל להזמין שיעורים!** 🚀

---

**זקוק לעזרה?** בדוק את המדריכים המפורטים:
- Integration: `BOOKING_UI_INTEGRATION_GUIDE.md`
- Backend: `BOOKING_BACKEND_SUMMARY.md`
- Setup: `migrations/BOOKING_SYSTEM_SETUP.md`

