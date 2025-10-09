import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  User,
  Settings,
  Bell,
  CreditCard,
  HelpCircle,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing, shadows } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useAuth } from '@/features/auth/auth-context';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, showChevron = true }) => {
  const { isRTL } = useRTL();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.gray[100],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {icon}
        </View>
        <Typography variant="body1" weight="medium">
          {label}
        </Typography>
      </View>
      
      {showChevron && (
        isRTL ? (
          <ChevronRight size={20} color={colors.gray[400]} />
        ) : (
          <ChevronLeft size={20} color={colors.gray[400]} />
        )
      )}
    </TouchableOpacity>
  );
};

export default function TeacherProfileScreen() {
  const { t } = useTranslation();
  const { isRTL, direction } = useRTL();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };
  
  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[4],
    },
    profileCard: {
      backgroundColor: colors.white,
      margin: spacing[4],
      borderRadius: 16,
      padding: spacing[4],
      alignItems: 'center',
      ...shadows.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    menuSection: {
      backgroundColor: colors.white,
      borderRadius: 12,
      overflow: 'hidden',
      marginHorizontal: spacing[4],
      marginBottom: spacing[3],
      ...shadows.sm,
    },
  });
  
  return (
    <SafeAreaView style={[styles.container, { direction }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h3" weight="bold" align={isRTL ? 'right' : 'left'}>
          פרופיל
        </Typography>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Typography variant="h2" color="white">
              {profile?.displayName?.charAt(0) || 'M'}
            </Typography>
          </View>
          
          <Typography variant="h4" weight="bold">
            {profile?.displayName || 'מורה'}
          </Typography>
          
          {profile?.bio && (
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              style={{ marginTop: spacing[1] }}
            >
              {profile.bio}
            </Typography>
          )}
          
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              marginTop: spacing[2],
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              backgroundColor: colors.primary[50],
              borderRadius: 8,
            }}
          >
            <Typography variant="caption" color="primary" weight="semibold">
              חשבון מורה
            </Typography>
          </View>
        </View>
        
        {/* Account Settings */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<User size={20} color={colors.gray[700]} />}
            label="עריכת פרופיל"
            onPress={() => router.push('/(profile)/edit-profile')}
          />
          <MenuItem
            icon={<Settings size={20} color={colors.gray[700]} />}
            label="הגדרות"
            onPress={() => router.push('/(profile)/settings')}
          />
          <MenuItem
            icon={<Bell size={20} color={colors.gray[700]} />}
            label="התראות"
            onPress={() => router.push('/(profile)/notifications')}
          />
        </View>
        
        {/* Payment & Billing */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<CreditCard size={20} color={colors.gray[700]} />}
            label="אמצעי תשלום"
            onPress={() => router.push('/(profile)/payment-methods')}
          />
        </View>
        
        {/* Support */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<HelpCircle size={20} color={colors.gray[700]} />}
            label="עזרה ותמיכה"
            onPress={() => router.push('/(profile)/help')}
          />
          <MenuItem
            icon={<Shield size={20} color={colors.gray[700]} />}
            label="פרטיות ואבטחה"
            onPress={() => router.push('/(profile)/privacy')}
          />
        </View>
        
        {/* Sign Out */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<LogOut size={20} color={colors.error[600]} />}
            label="התנתק"
            onPress={handleSignOut}
            showChevron={false}
          />
        </View>
        
        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: spacing[4] }}>
          <Typography variant="caption" color="textSecondary">
            SkillUp Teacher v1.0.0
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

