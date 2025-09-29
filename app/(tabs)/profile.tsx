import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  User,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  Edit3,
  Gift,
  Star,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { Button, ButtonText } from '@gluestack-ui/themed';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
  showChevron?: boolean;
  textColor?: string;
  rightText?: string;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  // Mock user data
  const user = {
    name: 'יוסי כהן',
    email: 'yossi@example.com',
    phone: '050-123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    bio: 'תלמיד כיתה יב מחפש שיפור בציונים באנגלית ומתמטיקה',
    totalLessons: 15,
    memberSince: '2023',
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => {
            // Handle logout logic and navigate to login
            console.log('Logging out...');
            router.push('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuSections: MenuSection[] = [
    {
      id: 'allSettings',
      title: '',
      items: [
        {
          id: 'editProfile',
          title: t('profile.editProfile'),
          icon: Edit3,
          onPress: () => console.log('Edit profile'),
          showChevron: true,
        },
        {
          id: 'paymentMethods',
          title: t('profile.paymentMethods'),
          icon: CreditCard,
          onPress: () => console.log('Payment methods'),
          showChevron: true,
        },
        {
          id: 'notifications',
          title: t('profile.notifications'),
          icon: Bell,
          onPress: () => console.log('Notifications'),
          showChevron: true,
        },
        {
          id: 'referrals',
          title: t('profile.referrals'),
          icon: Gift,
          onPress: () => console.log('Referrals'),
          showChevron: true,
        },
        {
          id: 'reviews',
          title: t('profile.myReviews'),
          icon: Star,
          onPress: () => console.log('My reviews'),
          showChevron: true,
        },
        {
          id: 'help',
          title: t('profile.help'),
          icon: HelpCircle,
          onPress: () => console.log('Help'),
          showChevron: true,
        },
        {
          id: 'privacy',
          title: t('profile.privacy'),
          icon: Shield,
          onPress: () => console.log('Privacy'),
          showChevron: true,
        },
        {
          id: 'settings',
          title: t('profile.settings'),
          icon: Settings,
          onPress: () => console.log('Settings'),
          showChevron: true,
        },
      ],
    },
  ];

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    header: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    profileCard: {
      marginBottom: spacing[4],
      borderRadius: 16,
      borderWidth: 0,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    userSection: {
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[4],
    },
    profileContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#667eea',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    memberBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: 20,
      marginTop: spacing[2],
    },
    bioSection: {
      marginTop: spacing[3],
      paddingHorizontal: spacing[2],
      maxWidth: 280,
    },
    content: {
      flex: 1,
      padding: spacing[4],
      paddingTop: spacing[2],
    },
    section: {
      marginBottom: spacing[4],
    },
    sectionTitle: {
      marginBottom: spacing[2],
      paddingHorizontal: spacing[1],
    },
    menuCard: {
      marginBottom: spacing[3],
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
      borderWidth: 0,
      backgroundColor: '#FFFFFF',
    },
    menuItem: {
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
    },
    menuItemLeft: {
      alignItems: 'center',
      flex: 1,
      gap: spacing[3],
    },
    menuItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuItemText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
  });

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        { flexDirection: getFlexDirection() },
        pressedItem === item.id && {
          backgroundColor: item.textColor ? '#FEF2F2' : '#F8FAFC',
          transform: [{ scale: 0.98 }]
        }
      ]}
      onPress={item.onPress}
      onPressIn={() => setPressedItem(item.id)}
      onPressOut={() => setPressedItem(null)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuItemLeft, { flexDirection: getFlexDirection() }]}>
        <item.icon size={20} color={item.textColor || '#374151'} />
        <Typography
          variant="body1"
          style={[styles.menuItemText, { color: item.textColor || '#374151' }]}
        >
          {item.title}
        </Typography>
      </View>
      <View style={styles.menuItemRight}>
        {item.rightText && (
          <Typography variant="body2" style={{ color: '#6B7280', marginRight: spacing[2] }}>
            {item.rightText}
          </Typography>
        )}
        {item.showChevron && (
          <ChevronRight
            size={16}
            color="#9CA3AF"
            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: getFlexDirection() }]}>
        <Typography variant="h3" weight="bold">
          {t('profile.title')}
        </Typography>
        <TouchableOpacity onPress={handleLogout}>
          <Typography variant="body1" style={{ color: '#FF4444', fontWeight: '500' }}>
            {t('profile.logout')}
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.profileContent}>
            <View style={styles.avatar}>
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage as any}
                  resizeMode="cover"
                />
              ) : (
                <Typography variant="h2" color="white" weight="bold">
                  {user.name.charAt(0)}
                </Typography>
              )}
            </View>

            <Typography variant="h3" weight="bold" style={{ marginTop: spacing[3], textAlign: 'center' }}>
              {user.name}
            </Typography>

            <Typography variant="body2" style={{ color: '#6B7280', textAlign: 'center', marginTop: spacing[1] }}>
              מספר פלאפון: {user.phone}
            </Typography>

            <View style={styles.memberBadge}>
              <Typography variant="caption" style={{ color: '#F59E0B', fontWeight: '600' }}>
                📚 תלמיד
              </Typography>
            </View>

            {user.bio && (
              <View style={styles.bioSection}>
                <Typography variant="body2" style={{ color: '#4B5563', textAlign: 'center', lineHeight: 20 }}>
                  {user.bio}
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.id} style={styles.section}>
            {section.title && (
              <Typography
                variant="h6"
                weight="semibold"
                style={[
                  styles.sectionTitle,
                  { color: '#4B5563', fontSize: 14, fontWeight: '600' }
                ]}
              >
                {section.title}
              </Typography>
            )}
            <Card style={styles.menuCard}>
              <CardContent style={{ padding: spacing[1] }}>
                {section.items.map((item, index) => (
                  <View key={item.id}>
                    {renderMenuItem(item)}
                    {index < section.items.length - 1 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: '#F1F5F9',
                          marginHorizontal: spacing[4],
                        }}
                      />
                    )}
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}