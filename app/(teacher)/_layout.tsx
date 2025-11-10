import { useEffect, useState, useCallback } from 'react';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ActivityIndicator } from 'react-native';
import { Home, Calendar, User, FileText, MessageCircle, Users } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { useAuth } from '@/features/auth/auth-context';
import { Typography } from '@/ui/Typography';
import TeacherOnboardingModal from '@/components/teacher/TeacherOnboardingModal';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useRTL } from '@/context/RTLContext';

export default function TeacherLayout() {
  const { t } = useTranslation();
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { direction } = useRTL();

  // Guard: Redirect if not a teacher
  useEffect(() => {
    if (!isLoading && profile && profile.role !== 'teacher') {
      console.warn('Access denied: User is not a teacher. Redirecting to student interface.');
      router.replace('/(tabs)');
    }
  }, [profile, isLoading, router]);

  // Check if teacher needs to complete onboarding
  useEffect(() => {
    if (!isLoading && profile && profile.role === 'teacher') {
      const needsOnboarding = !profile.profileCompleted;
      console.log('🔍 [TeacherLayout] Checking onboarding status:', {
        profileCompleted: profile.profileCompleted,
        needsOnboarding,
      });
      setShowOnboarding(needsOnboarding);
    }
  }, [profile, isLoading]);

  // Refetch profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [TeacherLayout] Screen focused');
    }, [])
  );

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

  // Show onboarding modal if profile not completed
  if (showOnboarding) {
    return (
      <TeacherOnboardingModal
        teacherId={profile.id}
        onComplete={() => {
          console.log('✅ [TeacherLayout] Onboarding completed');
          setShowOnboarding(false);
        }}
      />
    );
  }

  // Use CustomTabBar which handles safe area internally

  return (
    <View style={{ flex: 1, direction }}>
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.gray[500],
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="profile"
          options={{
            title: t('teacher.tabs.profile', 'פרופיל'),
            tabBarIcon: ({ color }) => (
              <User size={26} color={color} />
            ),
            tabBarAccessibilityLabel: t('teacher.tabs.profile', 'פרופיל'),
          }}
        />
        <Tabs.Screen
          name="students"
          options={{
            title: t('teacher.tabs.students', 'תלמידים'),
            tabBarIcon: ({ color }) => (
              <Users size={26} color={color} />
            ),
            tabBarAccessibilityLabel: t('teacher.tabs.students', 'תלמידים'),
          }}
        />
        <Tabs.Screen
          name="tracking"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('teacher.tabs.messages', 'הודעות'),
            tabBarIcon: ({ color }) => (
              <MessageCircle size={26} color={color} />
            ),
            tabBarAccessibilityLabel: t('teacher.tabs.messages', 'הודעות'),
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: t('teacher.tabs.calendar', 'יומן'),
            tabBarIcon: ({ color }) => (
              <Calendar size={26} color={color} />
            ),
            tabBarAccessibilityLabel: t('teacher.tabs.calendar', 'יומן'),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: t('teacher.tabs.home', 'בית'),
            tabBarIcon: ({ color }) => (
              <Home size={26} color={color} />
            ),
            tabBarAccessibilityLabel: t('teacher.tabs.home', 'בית'),
          }}
        />
        <Tabs.Screen
          name="edit-teacher-profile"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="privacy"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </View>
  );
}

