import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/auth-context';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { profile, isLoading, session } = useAuth();

  // בזמן שהמידע על המשתמש נטען, נציג מסך טעינה
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // אם אין session, המשתמש לא מחובר
  if (!session) {
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