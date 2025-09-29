import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // For demo purposes, redirect to onboarding
  // In a real app, you'd check if user is authenticated
  return <Redirect href="/(auth)/onboarding" />;
}