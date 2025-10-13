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
import { useRTL } from '@/context/RTLContext';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  showChevron = true,
  rightElement 
}) => {
  const { isRTL } = useRTL();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        minHeight: 64,
      }}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing[3],
          flex: 1,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.primary[50],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="body1" weight="medium">
            {label}
          </Typography>
          {value && (
            <Typography variant="body2" color="textSecondary" style={{ marginTop: 2 }}>
              {value}
            </Typography>
          )}
        </View>
      </View>
      
      {rightElement || (showChevron && (
        <ChevronRight 
          size={20} 
          color={colors.gray[400]} 
          style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
        />
      ))}
    </TouchableOpacity>
  );
};

export default function TeacherSettingsScreen() {
  const { isRTL, direction } = useRTL();
  
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50], direction }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
        }}
      >
        <Typography variant="h3" weight="bold" align={isRTL ? 'right' : 'left'}>
          הגדרות
        </Typography>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Language & Region */}
        <View
          style={{
            backgroundColor: colors.white,
            marginTop: spacing[4],
            borderRadius: 14,
            marginHorizontal: spacing[4],
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[2],
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <Typography variant="caption" weight="semibold" color="textSecondary">
              שפה ואזור
            </Typography>
          </View>
          
          <SettingRow
            icon={<Globe size={20} color={colors.primary[600]} />}
            label="שפה"
            value="עברית"
            onPress={() => alert('בחירת שפה (דמה)')}
          />
        </View>
        
        {/* Appearance */}
        <View
          style={{
            backgroundColor: colors.white,
            marginTop: spacing[4],
            borderRadius: 14,
            marginHorizontal: spacing[4],
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[2],
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <Typography variant="caption" weight="semibold" color="textSecondary">
              תצוגה
            </Typography>
          </View>
          
          <SettingRow
            icon={<Moon size={20} color={colors.primary[600]} />}
            label="מצב כהה"
            showChevron={false}
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                thumbColor={darkModeEnabled ? colors.primary[600] : colors.white}
              />
            }
          />
        </View>
        
        {/* Notifications */}
        <View
          style={{
            backgroundColor: colors.white,
            marginTop: spacing[4],
            borderRadius: 14,
            marginHorizontal: spacing[4],
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[2],
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <Typography variant="caption" weight="semibold" color="textSecondary">
              התראות
            </Typography>
          </View>
          
          <SettingRow
            icon={<Mail size={20} color={colors.primary[600]} />}
            label="התראות אימייל"
            showChevron={false}
            rightElement={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                thumbColor={emailNotifications ? colors.primary[600] : colors.white}
              />
            }
          />
          
          <SettingRow
            icon={<BellIcon size={20} color={colors.primary[600]} />}
            label="התראות פוש"
            showChevron={false}
            rightElement={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                thumbColor={pushNotifications ? colors.primary[600] : colors.white}
              />
            }
          />
        </View>
        
        {/* Calendar Settings */}
        <View
          style={{
            backgroundColor: colors.white,
            marginTop: spacing[4],
            borderRadius: 14,
            marginHorizontal: spacing[4],
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[2],
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <Typography variant="caption" weight="semibold" color="textSecondary">
              לוח שנה
            </Typography>
          </View>
          
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing[4],
              paddingHorizontal: spacing[4],
              backgroundColor: colors.white,
            }}
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.primary[50],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CalendarIcon size={20} color={colors.primary[600]} />
              </View>
              <Typography variant="body1" weight="medium">
                תצוגת לוח שנה
              </Typography>
            </View>
            
            {/* Segmented Control */}
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                backgroundColor: colors.gray[100],
                borderRadius: 8,
                padding: 2,
              }}
            >
              <TouchableOpacity
                onPress={() => setCalendarView('month')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: calendarView === 'month' ? colors.white : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: calendarView === 'month' ? colors.primary[600] : colors.gray[600] }}
                >
                  חודש
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCalendarView('week')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: calendarView === 'week' ? colors.white : 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: calendarView === 'week' ? colors.primary[600] : colors.gray[600] }}
                >
                  שבוע
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: colors.primary[600],
            marginHorizontal: spacing[4],
            marginTop: spacing[6],
            paddingVertical: spacing[3],
            borderRadius: 12,
            alignItems: 'center',
            minHeight: 48,
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Typography variant="body1" weight="bold" style={{ color: colors.white }}>
            שמור הגדרות
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

