import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/auth-context';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { profile, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        // Not authenticated - redirect to onboarding
        router.replace('/(auth)/onboarding');
      } else if (profile) {
        // Authenticated - redirect based on role
        if (profile.role === 'teacher') {
          router.replace('/(teacher)');
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  }, [profile, isLoading, session, router]);

  // Show loading while checking auth
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
    </View>
  );
}