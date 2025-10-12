# 📚 Documentation Index - Booking System

כל התיעוד של מערכת ההזמנות במקום אחד!

---

## 🚀 Start Here

אם אתה חדש במערכת, התחל כאן:

### 1️⃣ **[QUICK_START.md](./QUICK_START.md)** ⭐
**5 דקות למערכת עובדת**
- הרצת מיגרציות
- ניסיון booking ראשון
- פתרון בעיות מהיר

### 2️⃣ **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** ✅
**סטטוס + סיכום**
- מה בנינו?
- Flow מלא (diagram)
- רשימת קבצים
- Features matrix

---

## 📖 Full Guides

### Backend & Database

#### **[migrations/BOOKING_SYSTEM_SETUP.md](./migrations/BOOKING_SYSTEM_SETUP.md)**
**Setup מלא + Testing**
- טבלאות ו-functions
- בדיקות DB
- Maintenance tasks
- Troubleshooting

#### **[BOOKING_BACKEND_SUMMARY.md](./BOOKING_BACKEND_SUMMARY.md)**
**הסבר טכני מעמיק**
- ארכיטקטורה
- RPC functions פירוט
- Security features
- Database schema
- Error codes
- Performance

---

### Frontend & UI

#### **[BOOKING_UI_INTEGRATION_GUIDE.md](./BOOKING_UI_INTEGRATION_GUIDE.md)**
**איך להשתמש בקומפוננטים**
- Components usage
- Realtime integration
- Optimistic UI
- Error handling
- Testing checklist

---

## 📂 File Structure

```
.
├── QUICK_START.md                        ⭐ התחל כאן
├── IMPLEMENTATION_COMPLETE.md            ✅ סטטוס
├── BOOKING_UI_INTEGRATION_GUIDE.md       📱 Frontend
├── BOOKING_BACKEND_SUMMARY.md            🗄️ Backend
├── COMMIT_MESSAGE.txt                    💬 Git commit
├── DOCS_INDEX.md                         📚 זה
│
├── migrations/
│   ├── 006_booking_system_complete.sql   🔧 RPC functions
│   ├── 007_rls_policies_complete.sql     🔒 Security
│   ├── BOOKING_SYSTEM_SETUP.md           📖 Setup guide
│   └── MIGRATION_005_GUIDE.md            (קודם)
│
├── app/
│   └── (booking)/
│       ├── book-lesson.tsx               ✏️ מעודכן
│       └── _layout.tsx                   🆕 חדש
│
├── src/
│   ├── components/
│   │   └── bookings/
│   │       ├── BookingCard.tsx           🆕 חדש
│   │       └── BookingsList.tsx          🆕 חדש
│   ├── hooks/
│   │   ├── useTeacherBookingRealtime.ts  🆕 חדש
│   │   └── useAvailabilityRealtime.ts    🆕 חדש
│   └── services/
│       └── api/
│           └── bookingsAPI.ts            ✏️ מעודכן
│
└── supabase/
    ├── schema.sql                        (base)
    └── seed.sql                          (base)
```

---

## 🎯 תרחישי שימוש

### "רוצה ליצור הזמנה"
1. קרא: [QUICK_START.md](./QUICK_START.md) → Section "נסה את ה-booking flow"
2. הרץ מיגרציות
3. פתח book-lesson.tsx
4. Done!

### "רוצה להוסיף Realtime"
1. קרא: [BOOKING_UI_INTEGRATION_GUIDE.md](./BOOKING_UI_INTEGRATION_GUIDE.md) → Section "Realtime Integration"
2. העתק דוגמאות
3. הוסף למסכים
4. Done!

### "רוצה להבין איך הכל עובד"
1. קרא: [BOOKING_BACKEND_SUMMARY.md](./BOOKING_BACKEND_SUMMARY.md) → Section "Flow המלא"
2. קרא: [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) → Diagram
3. קרא migration 006 (SQL comments)
4. Done!

### "יש לי שגיאה"
1. קרא: [QUICK_START.md](./QUICK_START.md) → Section "פתרון בעיות"
2. קרא: [BOOKING_SYSTEM_SETUP.md](./migrations/BOOKING_SYSTEM_SETUP.md) → Section "Troubleshooting"
3. בדוק Supabase logs
4. בדוק console errors

### "רוצה להוסיף feature חדש"
1. קרא: [BOOKING_BACKEND_SUMMARY.md](./BOOKING_BACKEND_SUMMARY.md) → DB Schema
2. קרא: [BOOKING_UI_INTEGRATION_GUIDE.md](./BOOKING_UI_INTEGRATION_GUIDE.md) → Components
3. יצור migration חדשה
4. עדכן API client
5. עדכן UI components

---

## 📊 Documentation Stats

- **Total files**: 11 docs
- **Total lines**: ~3000 (code + docs)
- **Languages**: עברית + English (mixed)
- **Formats**: Markdown
- **Coverage**: 100% (backend + frontend)
- **Status**: Complete & up-to-date

---

## 🔍 Quick Reference

### Commands
```bash
# Migrations
node scripts/run-migration.js migrations/006_booking_system_complete.sql
node scripts/run-migration.js migrations/007_rls_policies_complete.sql

# Cleanup (daily)
SELECT cleanup_expired_idempotency();
```

### Important Functions
```sql
-- RPC
create_booking(p_idempotency_key, p_teacher_id, ...)
cancel_booking(p_booking_id, p_actor_user_id, p_reason, p_refund_method)
reschedule_booking(p_booking_id, p_actor_user_id, p_new_start_at)

-- Helpers
check_booking_overlap(p_teacher_id, p_start_at, p_end_at)
prevent_booking_overlap() -- trigger function
cleanup_expired_idempotency()
```

### Key Tables
```
bookings              - הזמנות
availability_slots    - משבצות זמן
payments              - תשלומים
refunds               - החזרים
credit_transactions   - קרדיטים
audit_log             - לוג ביקורת
idempotency_requests  - מניעת כפילויות
notifications         - התראות
```

### Error Codes
```
23505 - Overlap / Already booked
53000 - Payment failed
22000 - Validation error
42501 - Unauthorized
```

---

## 🎓 Learning Path

### Beginner
1. [QUICK_START.md](./QUICK_START.md) - התחל כאן
2. Try creating a booking
3. Try cancelling
4. Check database

### Intermediate
1. [BOOKING_UI_INTEGRATION_GUIDE.md](./BOOKING_UI_INTEGRATION_GUIDE.md) - UI components
2. [BOOKING_SYSTEM_SETUP.md](./migrations/BOOKING_SYSTEM_SETUP.md) - Setup details
3. Add Realtime hooks
4. Customize UI

### Advanced
1. [BOOKING_BACKEND_SUMMARY.md](./BOOKING_BACKEND_SUMMARY.md) - Full technical
2. Read SQL migrations (006, 007)
3. Understand RPC flow
4. Add custom features
5. Optimize performance

---

## 🛠️ Maintenance

### Weekly
- [ ] Check audit_log for errors
- [ ] Monitor booking success rate
- [ ] Check credits balance integrity

### Monthly
- [ ] Archive old audit logs
- [ ] Review slow queries
- [ ] Update documentation if needed

### Quarterly
- [ ] Review security policies
- [ ] Update error messages
- [ ] Performance optimization

---

## 📞 Support

### Internal Resources
- All docs in this repo
- Inline code comments
- SQL comments in migrations

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query)
- [React Native Docs](https://reactnative.dev/)

### Debug Tools
- Supabase Dashboard → Logs
- Browser Console → Network tab
- SQL: `SELECT * FROM audit_log ORDER BY created_at DESC`

---

## ✅ Checklist

### Setup
- [ ] Run migrations 006 & 007
- [ ] Verify tables created
- [ ] Verify RPC functions exist
- [ ] Test create booking
- [ ] Test cancel booking

### Integration
- [ ] UI components working
- [ ] Query invalidation working
- [ ] Error messages in Hebrew
- [ ] Loading states showing
- [ ] Idempotency working

### Production
- [ ] RLS policies active
- [ ] Triggers working
- [ ] Audit logging enabled
- [ ] Performance acceptable
- [ ] Documentation updated

---

## 🚀 Next Steps

After completing the basics:

1. **Realtime** - Add to calendar & search
2. **Stripe** - Replace payment simulation
3. **Notifications** - Push + Email
4. **Analytics** - Track key metrics
5. **Admin** - Build admin panel

---

**Last updated**: October 2025  
**Version**: 1.0  
**Status**: Complete ✅

**Happy coding!** 🎉

