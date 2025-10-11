import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Mail, MessageSquare, Clock } from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  
  const [lessonReminders, setLessonReminders] = useState(true);
  const [lessonChanges, setLessonChanges] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [promotions, setPromotions] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    showToast('הגדרות ההתראות נשמרו');
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
    settingRow: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
    },
    settingInfo: {
      flex: 1,
      marginRight: isRTL ? 0 : spacing[3],
      marginLeft: isRTL ? spacing[3] : 0,
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
    saveButton: {
      backgroundColor: colors.primary[600],
      padding: spacing[3],
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing[4],
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
            התראות
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Lesson Notifications */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            התראות שיעורים
          </Typography>
          <Card>
            <CardContent>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">תזכורות לשיעורים</Typography>
                  <Typography variant="caption" color="textSecondary">קבל תזכורת 1 שעה לפני השיעור</Typography>
                </View>
                <Switch
                  value={lessonReminders}
                  onValueChange={setLessonReminders}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">שינויים בשיעורים</Typography>
                  <Typography variant="caption" color="textSecondary">ביטולים ושינויי מועד</Typography>
                </View>
                <Switch
                  value={lessonChanges}
                  onValueChange={setLessonChanges}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* System Notifications */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            התראות מערכת
          </Typography>
          <Card>
            <CardContent>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">עדכוני אפליקציה</Typography>
                  <Typography variant="caption" color="textSecondary">תכונות חדשות ושיפורים</Typography>
                </View>
                <Switch
                  value={systemUpdates}
                  onValueChange={setSystemUpdates}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">מבצעים והטבות</Typography>
                  <Typography variant="caption" color="textSecondary">הנחות ומבצעים מיוחדים</Typography>
                </View>
                <Switch
                  value={promotions}
                  onValueChange={setPromotions}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Channels */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            ערוצי התראה
          </Typography>
          <Card>
            <CardContent>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">התראות Push</Typography>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">דוא"ל</Typography>
                </View>
                <Switch
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">SMS</Typography>
                </View>
                <Switch
                  value={smsEnabled}
                  onValueChange={setSmsEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            שעות שקטות
          </Typography>
          <Card>
            <CardContent>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">הפעל שעות שקטות</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {quietHoursEnabled ? `${quietStart} - ${quietEnd}` : 'לא פעיל'}
                  </Typography>
                </View>
                <Switch
                  value={quietHoursEnabled}
                  onValueChange={setQuietHoursEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Typography variant="body1" weight="semibold" color="white">
            שמור הגדרות
          </Typography>
        </TouchableOpacity>
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

