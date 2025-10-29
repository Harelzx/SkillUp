import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/auth-context';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';
import { useEffect, useState } from 'react';

export default function Index() {
  const { profile, isLoading, session, signOut } = useAuth();
  const [hasTimeout, setHasTimeout] = useState(false);
  const [profileCheckCompleted, setProfileCheckCompleted] = useState(false);

  // Timeout logic: if loading takes more than 10 seconds, redirect to onboarding
  useEffect(() => {
    if (isLoading && session && !profile) {
      const timer = setTimeout(() => {
        console.warn('⚠️ Loading timeout - redirecting to onboarding');
        setHasTimeout(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
    setHasTimeout(false);
  }, [isLoading, session, profile]);

  // Check if profile exists when loading completes
  useEffect(() => {
    if (!isLoading && session && !profile && !profileCheckCompleted) {
      // Session exists but profile is missing - user doesn't exist in student/teachers tables
      console.warn('⚠️ User has session but no profile in database - signing out and redirecting to login');
      setProfileCheckCompleted(true);
      
      // Sign out the user
      signOut();
    }
  }, [isLoading, session, profile, profileCheckCompleted, signOut]);

  // בזמן שהמידע על המשתמש נטען, נציג מסך טעינה
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // אם אין session או timeout, המשתמש לא מחובר
  if (!session || hasTimeout) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // אם יש session ופרופיל, ננתב לפי התפקיד
  if (profile) {
    if (profile.role === 'teacher') {
      return <Redirect href="/(teacher)" />;
    } else {
      return <Redirect href="/(tabs)" />;
    }
  }

  // מצב ביניים (יש session אבל עדיין אין פרופיל), נמשיך להציג טעינה
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
    </View>
  );
}