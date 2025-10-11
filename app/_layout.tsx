import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/features/auth/auth-context';
import { initI18n } from '@/lib/i18n';
import { Text, View } from 'react-native';
import { RTLProvider } from '@/context/RTLContext';
import { CreditsProvider } from '@/context/CreditsContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from '../components/ui/gluestack-ui-provider';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    initI18n().then(() => {
      console.log('I18n initialized');
      setIsI18nInitialized(true);
    });
  }, []);

  if (!isI18nInitialized) {
    return (
      
    <GluestackUIProvider mode="light">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    </GluestackUIProvider>
  
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="light">
        <SafeAreaProvider>
          <RTLProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <CreditsProvider>
                  <Stack>
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(teacher)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(profile)"
                      options={{ headerShown: false }}
                    />
                  </Stack>
                </CreditsProvider>
              </AuthProvider>
            </QueryClientProvider>
          </RTLProvider>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}