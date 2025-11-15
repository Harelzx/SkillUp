import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Globe, Moon, Mail, Bell as BellIcon, Calendar as CalendarIcon } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

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
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing[4],
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  settingRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 64,
  },
  settingRowContent: {
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  settingRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingRowText: {
    flex: 1,
  },
  settingRowValue: {
    marginTop: 2,
  },
  settingRowTrailing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
    marginRight: spacing[2],
  },
  calendarRow: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
  },
  calendarSummary: {
    alignItems: 'center',
    gap: spacing[3],
  },
  segmentedControl: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
    alignItems: 'center',
  },
  segmentedOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveButton: {
    width: '100%',
    backgroundColor: colors.primary[600],
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});

const SettingRow: React.FC<SettingRowProps> = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  showChevron = true,
  rightElement 
}) => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTL();

  const trailingContent = rightElement || (showChevron && (
    <ChevronRight 
      size={20} 
      color={colors.gray[400]} 
      style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
    />
  ));
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.settingRow,
        { flexDirection: getFlexDirection('row') },
      ]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {trailingContent && (
        <View style={styles.settingRowTrailing}>
          {trailingContent}
        </View>
      )}
      
      <View
        style={[
          styles.settingRowContent,
          { flexDirection: getFlexDirection('row-reverse') },
        ]}
      >
        <View style={styles.settingRowIcon}>
          {icon}
        </View>
        <View style={styles.settingRowText}>
          <Typography variant="body1" weight="medium" align={getTextAlign('right')} style={{ textAlign: getTextAlign('right') }}>
            {label}
          </Typography>
          {value && (
            <Typography
              variant="body2"
              color="textSecondary"
              style={[styles.settingRowValue, { textAlign: getTextAlign('right') }]}
              align={getTextAlign('right')}
            >
              {value}
            </Typography>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TeacherSettingsScreen() {
  const { getFlexDirection, getTextAlign } = useRTL();
  
  // Stub state for visual demonstration
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  
  const handleSave = () => {
    // Visual-only stub: Show a mock toast/alert
    alert('הגדרות נשמרו (דמה)');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h3" weight="bold" align="center" style={styles.headerTitle}>
          הגדרות
        </Typography>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Language & Region */}
        <View style={styles.section}>
          <Typography variant="caption" weight="semibold" color="textSecondary" align={getTextAlign('right')} style={[styles.sectionHeader, { textAlign: getTextAlign('right') }]}>
            שפה ואזור
          </Typography>
          
          <SettingRow
            icon={<Globe size={20} color={colors.primary[600]} />}
            label="שפה"
            value="עברית"
            onPress={() => alert('בחירת שפה (דמה)')}
          />
        </View>
        
        {/* Appearance */}
        <View style={styles.section}>
          <Typography variant="caption" weight="semibold" color="textSecondary" align={getTextAlign('right')} style={[styles.sectionHeader, { textAlign: getTextAlign('right') }]}>
            תצוגה
          </Typography>
          
          <SettingRow
            icon={<Moon size={20} color={colors.primary[600]} />}
            label="מצב כהה"
            showChevron={false}
            rightElement={
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                  thumbColor={darkModeEnabled ? colors.primary[600] : colors.white}
                />
              </View>
            }
          />
        </View>
        
        {/* Notifications */}
        <View style={styles.section}>
          <Typography variant="caption" weight="semibold" color="textSecondary" align={getTextAlign('right')} style={[styles.sectionHeader, { textAlign: getTextAlign('right') }]}>
            התראות
          </Typography>
          
          <SettingRow
            icon={<Mail size={20} color={colors.primary[600]} />}
            label="התראות אימייל"
            showChevron={false}
            rightElement={
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                  thumbColor={emailNotifications ? colors.primary[600] : colors.white}
                />
              </View>
            }
          />
          
          <SettingRow
            icon={<BellIcon size={20} color={colors.primary[600]} />}
            label="התראות פוש"
            showChevron={false}
            rightElement={
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                  thumbColor={pushNotifications ? colors.primary[600] : colors.white}
                />
              </View>
            }
          />
        </View>
        
        {/* Calendar Settings */}
        <View style={styles.section}>
          <Typography variant="caption" weight="semibold" color="textSecondary" align={getTextAlign('right')} style={[styles.sectionHeader, { textAlign: getTextAlign('right') }]}>
            לוח שנה
          </Typography>
          
          <View
            style={[
              styles.calendarRow,
              {
                flexDirection: getFlexDirection('row-reverse'),
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
          >
            <View
              style={[
                styles.calendarSummary,
                { flexDirection: getFlexDirection('row-reverse') },
              ]}
            >
              <View style={styles.settingRowIcon}>
                <CalendarIcon size={20} color={colors.primary[600]} />
              </View>
              <Typography variant="body1" weight="medium" align={getTextAlign('right')} style={{ textAlign: getTextAlign('right') }}>
                תצוגת לוח שנה
              </Typography>
            </View>
            
            {/* Segmented Control */}
            <View
              style={[
                styles.segmentedControl,
                { flexDirection: getFlexDirection('row-reverse') },
              ]}
            >
              <TouchableOpacity
                onPress={() => setCalendarView('week')}
                style={[
                  styles.segmentedOption,
                  {
                    backgroundColor: calendarView === 'week' ? colors.white : 'transparent',
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: calendarView === 'week' ? colors.primary[600] : colors.gray[600] }}
                  align="center"
                >
                  שבוע
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCalendarView('month')}
                style={[
                  styles.segmentedOption,
                  {
                    backgroundColor: calendarView === 'month' ? colors.white : 'transparent',
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: calendarView === 'month' ? colors.primary[600] : colors.gray[600] }}
                  align="center"
                >
                  חודש
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          activeOpacity={0.8}
        >
          <Typography variant="body1" weight="bold" style={{ color: colors.white }} align="center">
            שמור הגדרות
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

