import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, User } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { useAuth } from '@/features/auth/auth-context';
import { Typography } from '@/ui/Typography';

export default function TeacherLayout() {
  const { t } = useTranslation();
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Guard: Redirect if not a teacher
  useEffect(() => {
    if (!isLoading && profile && profile.role !== 'teacher') {
      console.warn('Access denied: User is not a teacher. Redirecting to student interface.');
      router.replace('/(tabs)');
    }
  }, [profile, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Typography variant="body1" color="textSecondary" style={{ marginTop: 16 }}>
          {t('common.loading', 'טוען...')}
        </Typography>
      </View>
    );
  }

  // Show error if no profile or not a teacher
  if (!profile || profile.role !== 'teacher') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50], padding: 32 }}>
        <Typography variant="h4" weight="bold" align="center" style={{ marginBottom: 16 }}>
          {t('teacher.accessDenied', 'גישה מוגבלת')}
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center">
          {t('teacher.accessDeniedMessage', 'ממשק זה מיועד למורים בלבד')}
        </Typography>
      </View>
    );
  }

  // Calculate dynamic bottom padding for safe area
  // Minimum 12px, or use safe area inset if larger
  const dynamicBottomPadding = Math.max(12, insets.bottom);
  
  // Total height: base height (56) + top padding (10) + dynamic bottom padding
  const tabBarHeight = 35 + 10 + dynamicBottomPadding;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingTop: 10, // Top padding for vertical spacing
          paddingBottom: dynamicBottomPadding, // Dynamic bottom padding (safe area)
          height: tabBarHeight, // Dynamic total height
          minHeight: 64, // Ensure minimum tap target
          // Shadow for elevation (subtle)
          ...Platform.select({
            ios: {
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4, // Space between icon and label
        },
        tabBarIconStyle: {
          marginBottom: 0, // Remove default margin
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: t('teacher.tabs.profile', 'פרופיל'),
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('teacher.tabs.profile', 'פרופיל'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('teacher.tabs.calendar', 'יומן'),
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('teacher.tabs.calendar', 'יומן'),
        }}
      />
       <Tabs.Screen
        name="index"
        options={{
          title: t('teacher.tabs.home', 'בית'),
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('teacher.tabs.home', 'בית'),
        }}
      />
    </Tabs>
  );
}

