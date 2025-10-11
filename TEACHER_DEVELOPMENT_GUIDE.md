# מדריך פיתוח - ממשק מורים

## 🏗️ ארכיטקטורה

### מבנה תיקיות
```
app/(teacher)/              # Teacher-only routes (guarded)
├── _layout.tsx            # Tabs layout with guard
├── index.tsx              # Home: notifications + dashboard
├── calendar.tsx           # Calendar with day modal
└── profile.tsx            # Teacher profile

src/data/
└── teacher-data.ts        # Mock/stub data (replace with API)

app/
├── _layout.tsx            # Root: added (teacher) stack screen
└── index.tsx              # Router: redirect by role

src/lib/
└── i18n.ts                # Translations: added teacher.* keys
```

---

## 🔧 הוספת תכונות חדשות

### הוספת טאב חדש לממשק מורים

**1. יצור קובץ חדש:**
```typescript
// app/(teacher)/analytics.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRTL } from '@/context/RTLContext';

export default function TeacherAnalyticsScreen() {
  const { isRTL, direction } = useRTL();
  
  return (
    <SafeAreaView style={{ flex: 1, direction }}>
      <ScrollView>
        {/* Your content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**2. עדכן Layout:**
```typescript
// app/(teacher)/_layout.tsx
import { BarChart } from 'lucide-react-native';

<Tabs.Screen
  name="analytics"
  options={{
    title: t('teacher.tabs.analytics', 'אנליטיקה'),
    tabBarIcon: ({ color, size }) => (
      <BarChart size={size} color={color} />
    ),
  }}
/>
```

**3. הוסף תרגום:**
```typescript
// src/lib/i18n.ts → he.translation.teacher.tabs
analytics: 'אנליטיקה',
```

---

### הוספת נתונים חדשים לדשבורד

**1. הוסף ל-stub data:**
```typescript
// src/data/teacher-data.ts
export interface TeacherStats {
  // ... existing
  avgRating: number;  // ✅ New field
}

export const getTeacherStats = (): TeacherStats => {
  return {
    // ... existing
    avgRating: 4.8,  // ✅ New field
  };
};
```

**2. הוסף כרטיס נתונים:**
```typescript
// app/(teacher)/index.tsx → render section
<StatCard
  icon={<Star size={20} color={colors.yellow[600]} />}
  label="דירוג ממוצע"
  value={stats.avgRating.toFixed(1)}
  color={colors.yellow[700]}
  bgColor={colors.yellow[50]}
  trend={2}
/>
```

---

### הוספת API במקום Stub

**דוגמה: החלפת getTeacherStats**

**Before (Stub):**
```typescript
// app/(teacher)/index.tsx
import { getTeacherStats } from '@/data/teacher-data';

const stats = getTeacherStats();
```

**After (API):**
```typescript
// app/(teacher)/index.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/auth-context';

const { profile } = useAuth();

const { data: stats, isLoading } = useQuery({
  queryKey: ['teacherStats', profile?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('teacher_stats')
      .select('*')
      .eq('teacher_id', profile?.id)
      .single();
    
    if (error) throw error;
    return data;
  },
  enabled: !!profile?.id,
});

if (isLoading) return <ActivityIndicator />;
```

**ודא שיש טבלה ב-Supabase:**
```sql
-- Create teacher_stats table
CREATE TABLE teacher_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_students INT DEFAULT 0,
  active_students INT DEFAULT 0,
  lessons_completed INT DEFAULT 0,
  monthly_revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Row Level Security (RLS)
ALTER TABLE teacher_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own stats"
  ON teacher_stats FOR SELECT
  USING (auth.uid() = teacher_id);
```

---

## 🎨 עיצוב ונגישות

### שימוש ב-Design Tokens
```typescript
// ✅ Good
import { colors, spacing, shadows } from '@/theme/tokens';

<View style={{
  padding: spacing[4],         // 16px
  backgroundColor: colors.primary[50],
  borderRadius: 12,
  ...shadows.md,
}}>
```

```typescript
// ❌ Bad
<View style={{
  padding: 16,                 // Hard-coded
  backgroundColor: '#f0f9ff',  // Hard-coded
  borderRadius: 12,
  shadowColor: '#000',         // Hard-coded
  shadowOpacity: 0.1,
}}>
```

### RTL Support
```typescript
import { useRTL } from '@/context/RTLContext';

const { isRTL, direction, getFlexDirection } = useRTL();

// Container
<View style={{ direction }}>

// Flex direction
<View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>

// Margins
<View style={{
  marginRight: isRTL ? 0 : spacing[3],
  marginLeft: isRTL ? spacing[3] : 0,
}}>

// Text alignment
<Typography align={isRTL ? 'right' : 'left'}>
```

### Accessibility
```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel="שם הפעולה"
  accessibilityHint="מה יקרה כשלוחצים"
  accessibilityRole="button"
  accessible={true}
>
  {/* content */}
</TouchableOpacity>
```

---

## 🧪 בדיקות

### Unit Tests (Jest + React Native Testing Library)

**התקנה:**
```bash
npm install --save-dev @testing-library/react-native jest
```

**דוגמה:**
```typescript
// __tests__/teacher/calendar.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CalendarScreen from '@/app/(teacher)/calendar';

describe('Teacher Calendar', () => {
  it('should render calendar grid', () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText('ינואר')).toBeTruthy();
  });

  it('should open modal on day press', async () => {
    const { getByText, queryByText } = render(<CalendarScreen />);
    
    const day15 = getByText('15');
    fireEvent.press(day15);
    
    await waitFor(() => {
      expect(queryByText('אין שיעורים')).toBeTruthy();
    });
  });

  it('should close modal on X press', async () => {
    const { getByText, getByLabelText, queryByText } = render(<CalendarScreen />);
    
    fireEvent.press(getByText('15'));
    await waitFor(() => expect(queryByText('סגור')).toBeTruthy());
    
    fireEvent.press(getByLabelText('סגור'));
    await waitFor(() => expect(queryByText('סגור')).toBeFalsy());
  });
});
```

### E2E Tests (Detox)

**התקנה:**
```bash
npm install --save-dev detox
```

**דוגמה:**
```typescript
// e2e/teacher.e2e.js
describe('Teacher Interface', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Login as teacher
    await element(by.id('login-email')).typeText('teacher@test.com');
    await element(by.id('login-password')).typeText('password');
    await element(by.id('login-submit')).tap();
  });

  it('should show teacher home screen', async () => {
    await expect(element(by.text('שלום, מורה!'))).toBeVisible();
  });

  it('should navigate to calendar', async () => {
    await element(by.id('teacher-calendar-tab')).tap();
    await expect(element(by.text('ינואר'))).toBeVisible();
  });

  it('should open day modal', async () => {
    await element(by.text('15')).tap();
    await expect(element(by.text('אין שיעורים'))).toBeVisible();
  });
});
```

---

## 🚀 Performance

### Optimization Tips

**1. useMemo for expensive calculations:**
```typescript
const days = useMemo(
  () => getDaysInMonth(year, month),
  [year, month]
);
```

**2. useCallback for event handlers:**
```typescript
const handleDayPress = useCallback((day: CalendarDay) => {
  setSelectedDay(day);
  setModalVisible(true);
}, []);
```

**3. React.memo for heavy components:**
```typescript
const StatCard = React.memo<StatCardProps>(({ icon, label, value }) => {
  // ...
});
```

**4. FlatList instead of map:**
```typescript
// ❌ Bad (re-renders all)
{data.map(item => <Item key={item.id} {...item} />)}

// ✅ Good (virtualizes)
<FlatList
  data={data}
  renderItem={({ item }) => <Item {...item} />}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
/>
```

---

## 🐛 Debugging

### React DevTools
```bash
# Install
npm install -g react-devtools

# Run
react-devtools
```

### Flipper (React Native Debugger)
```bash
# Install
brew install --cask flipper

# Open app and connect
# Network inspector, Redux, etc.
```

### Console Logs
```typescript
// Development only
if (__DEV__) {
  console.log('[Teacher Home] Stats:', stats);
  console.log('[Calendar] Selected day:', selectedDay);
}
```

### React Query Devtools
```typescript
// app/_layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  {__DEV__ && <ReactQueryDevtools />}
</QueryClientProvider>
```

---

## 📚 משאבים נוספים

### תיעוד רלוונטי
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)

### סגנונות קוד
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [React Native Performance](https://reactnative.dev/docs/performance)

---

## 🤝 תרומה

### Code Review Checklist
- [ ] קוד עובר בלינטר (0 errors)
- [ ] יש תרגומים לכל הטקסטים
- [ ] RTL support מלא
- [ ] Accessibility labels
- [ ] Touch targets ≥44px
- [ ] Performance: useMemo/useCallback במקומות הנכונים
- [ ] Error handling
- [ ] TypeScript types מלאים
- [ ] תיעוד (comments) בקוד מורכב
- [ ] Tests (לפחות unit tests)

---

## 🔐 אבטחה

### Best Practices
1. **אל תשמור מידע רגיש בקוד:**
   ```typescript
   // ❌ Bad
   const API_KEY = 'sk_live_123456789';
   
   // ✅ Good
   const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
   ```

2. **השתמש ב-RLS (Row Level Security) ב-Supabase:**
   ```sql
   CREATE POLICY "Users can only see their own data"
     ON table_name FOR SELECT
     USING (auth.uid() = user_id);
   ```

3. **Validate user role בצד שרת:**
   ```typescript
   // Edge Function (Supabase)
   const { data: { user } } = await supabaseClient.auth.getUser();
   const { data: profile } = await supabaseClient
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .single();
   
   if (profile.role !== 'teacher') {
     return new Response('Forbidden', { status: 403 });
   }
   ```

---

## 📞 תמיכה

לשאלות או בעיות טכניות:
1. בדוק את [TEACHER_INTERFACE_SUMMARY.md](./TEACHER_INTERFACE_SUMMARY.md)
2. בדוק את [README.md](./app/(teacher)/README.md)
3. פתח Issue ב-GitHub
4. פנה לצוות הפיתוח

---

*עודכן לאחרונה: 09/10/2024*

