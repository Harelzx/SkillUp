import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Globe,
  Moon,
  Sun,
  Monitor,
  DollarSign,
  Trash2,
  LogOut,
  Info,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { changeLanguage } from '@/lib/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'he');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    setCurrentLanguage(lang);
    showToast(lang === 'he' ? 'השפה שונתה לעברית' : 'Language changed to English');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    showToast(`ערכת נושא: ${newTheme === 'light' ? 'בהיר' : newTheme === 'dark' ? 'כהה' : 'מערכת'}`);
  };

  const handleClearCache = () => {
    Alert.alert(
      'נקה מטמון',
      'האם אתה בטוח שברצונך לנקות את המטמון?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'נקה',
          onPress: () => showToast('המטמון נוקה בהצלחה'),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: () => router.push('/(auth)/login'),
        },
      ]
    );
  };

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    backButton: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
    },
    content: {
      padding: spacing[4],
    },
    section: {
      marginBottom: spacing[4],
    },
    optionButton: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[2],
      padding: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
    },
    selectedOption: {
      backgroundColor: colors.primary[50],
    },
    themeOptions: {
      flexDirection: getFlexDirection(),
      gap: spacing[2],
      marginBottom: spacing[3],
    },
    themeButton: {
      flex: 1,
      alignItems: 'center',
      padding: spacing[3],
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.gray[200],
      backgroundColor: colors.white,
    },
    themeButtonActive: {
      borderColor: colors.primary[600],
      backgroundColor: colors.primary[50],
    },
    actionCard: {
      marginBottom: spacing[2],
    },
    actionButton: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[2],
      padding: spacing[4],
    },
    toast: {
      position: 'absolute',
      bottom: spacing[8],
      left: spacing[4],
      right: spacing[4],
      backgroundColor: colors.green[600],
      padding: spacing[4],
      borderRadius: 12,
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight
            size={20}
            color={colors.gray[700]}
            style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
          />
          <Typography variant="h5" weight="semibold" style={{ marginHorizontal: spacing[2] }}>
            הגדרות
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Language */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            שפה
          </Typography>
          <Card>
            <CardContent style={{ padding: 0 }}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  currentLanguage === 'he' && styles.selectedOption
                ]}
                onPress={() => handleLanguageChange('he')}
              >
                <Globe size={20} color={colors.gray[600]} />
                <Typography variant="body1" style={{ flex: 1 }}>עברית</Typography>
                {currentLanguage === 'he' && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[600] }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { borderBottomWidth: 0 },
                  currentLanguage === 'en' && styles.selectedOption
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Globe size={20} color={colors.gray[600]} />
                <Typography variant="body1" style={{ flex: 1 }}>English</Typography>
                {currentLanguage === 'en' && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[600] }} />
                )}
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            ערכת נושא
          </Typography>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeButton, theme === 'light' && styles.themeButtonActive]}
              onPress={() => handleThemeChange('light')}
            >
              <Sun size={24} color={theme === 'light' ? colors.primary[600] : colors.gray[600]} />
              <Typography
                variant="caption"
                weight={theme === 'light' ? 'semibold' : 'normal'}
                style={{ marginTop: spacing[1], color: theme === 'light' ? colors.primary[600] : colors.gray[700] }}
              >
                בהיר
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeButton, theme === 'dark' && styles.themeButtonActive]}
              onPress={() => handleThemeChange('dark')}
            >
              <Moon size={24} color={theme === 'dark' ? colors.primary[600] : colors.gray[600]} />
              <Typography
                variant="caption"
                weight={theme === 'dark' ? 'semibold' : 'normal'}
                style={{ marginTop: spacing[1], color: theme === 'dark' ? colors.primary[600] : colors.gray[700] }}
              >
                כהה
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeButton, theme === 'system' && styles.themeButtonActive]}
              onPress={() => handleThemeChange('system')}
            >
              <Monitor size={24} color={theme === 'system' ? colors.primary[600] : colors.gray[600]} />
              <Typography
                variant="caption"
                weight={theme === 'system' ? 'semibold' : 'normal'}
                style={{ marginTop: spacing[1], color: theme === 'system' ? colors.primary[600] : colors.gray[700] }}
              >
                מערכת
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            מטבע
          </Typography>
          <Card>
            <CardContent>
              <View style={[styles.optionButton, { borderBottomWidth: 0 }]}>
                <DollarSign size={20} color={colors.gray[600]} />
                <Typography variant="body1" style={{ flex: 1 }}>שקל חדש (₪)</Typography>
                <Typography variant="caption" color="textSecondary">ברירת מחדל</Typography>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Other Actions */}
        <Card style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearCache}
          >
            <Trash2 size={20} color={colors.gray[600]} />
            <Typography variant="body1" style={{ flex: 1 }}>
              נקה מטמון
            </Typography>
          </TouchableOpacity>
        </Card>

        {/* Logout */}
        <Card style={{ marginTop: spacing[4], backgroundColor: colors.red[50], borderColor: colors.red[200], borderWidth: 1 }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.red[600]} />
            <Typography variant="body1" weight="semibold" style={{ flex: 1, color: colors.red[600] }}>
              התנתק
            </Typography>
          </TouchableOpacity>
        </Card>

        {/* App Version */}
        <View style={{ alignItems: 'center', marginTop: spacing[6], marginBottom: spacing[4] }}>
          <Typography variant="caption" color="textSecondary">
            גרסה 1.0.0
          </Typography>
        </View>
      </ScrollView>

      {toastMessage && (
        <View style={styles.toast}>
          <Typography variant="body1" color="white" weight="semibold">
            {toastMessage}
          </Typography>
        </View>
      )}
    </SafeAreaView>
  );
}

