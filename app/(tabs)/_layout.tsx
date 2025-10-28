import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Search,
  BookOpen,
  User,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function TabLayout() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  // Debug tab navigation
  React.useEffect(() => {
    console.log('TabLayout: Component mounted, RTL:', isRTL);
  }, [isRTL]);

  return (
    <Tabs
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
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <User size={26} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.profile'),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: t('tabs.lessons'),
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={26} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.lessons'),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size }) => (
            <Search size={26} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.search'),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Home size={26} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="teacher/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}