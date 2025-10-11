import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="edit-profile"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="notifications"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="referrals"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="my-reviews"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="help"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

