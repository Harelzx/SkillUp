import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Cookie,
  MapPin,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ 
  icon, 
  label, 
  description,
  rightElement 
}) => {
  const { getFlexDirection, getTextAlign } = useRTL();
  
  return (
    <View
      style={{
        flexDirection: getFlexDirection('row-reverse'),
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
      }}
    >
      <View
        style={{
          flexDirection: getFlexDirection('row-reverse'),
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
          <Typography variant="body1" weight="medium" align={getTextAlign('right')} style={{ textAlign: getTextAlign('right') }}>
            {label}
          </Typography>
          {description && (
            <Typography variant="caption" color="textSecondary" style={{ marginTop: 2, textAlign: getTextAlign('right') }} align={getTextAlign('right')}>
              {description}
            </Typography>
          )}
        </View>
      </View>
      
      {rightElement}
    </View>
  );
};

export default function TeacherPrivacyScreen() {
  const { getFlexDirection, getTextAlign } = useRTL();
  
  // Stub state for visual demonstration
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [publicProfileVisible, setPublicProfileVisible] = useState(true);
  const [hideExactLocation, setHideExactLocation] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const connectedDevices = [
    { id: '1', name: 'iPhone 13', lastActive: 'פעיל כעת', location: 'תל אביב' },
    { id: '2', name: 'iPad Pro', lastActive: 'לפני 2 ימים', location: 'חיפה' },
    { id: '3', name: 'MacBook Air', lastActive: 'לפני שבוע', location: 'ירושלים' },
  ];
  
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('נא למלא את כל השדות');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }
    alert('הסיסמה שונתה בהצלחה (דמה)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const handleDisconnectDevice = (deviceId: string) => {
    alert(`התנתק ממכשיר ${deviceId} (דמה)`);
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
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
        <Typography variant="h3" weight="bold" align="center" style={{ textAlign: 'center' }}>
          פרטיות ואבטחה
        </Typography>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: spacing[5], 
          paddingTop: spacing[5], 
          paddingBottom: spacing[6] 
        }}
      >
        {/* Account Security */}
        <View style={{ paddingTop: spacing[4] }}>
          <Typography 
            variant="caption" 
            weight="semibold" 
            color="textSecondary"
            style={{ marginBottom: spacing[2], textAlign: getTextAlign('right') }}
            align={getTextAlign('right')}
          >
            אבטחת חשבון
          </Typography>
          
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Change Password Section */}
            <View style={{ padding: spacing[4], borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.06)' }}>
              <View
                style={{
                  flexDirection: getFlexDirection('row-reverse'),
                  alignItems: 'center',
                  gap: spacing[3],
                  marginBottom: spacing[3],
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
                  <Lock size={20} color={colors.primary[600]} />
                </View>
                <Typography variant="body1" weight="semibold" align={getTextAlign('right')} style={{ textAlign: getTextAlign('right') }}>
                  שינוי סיסמה
                </Typography>
              </View>
              
              <View style={{ gap: spacing[3] }}>
                <View>
                  <View
                    style={{
                      flexDirection: getFlexDirection('row-reverse'),
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.gray[300],
                      borderRadius: 10,
                      backgroundColor: colors.white,
                    }}
                  >
                    <TextInput
                      placeholder="סיסמה נוכחית"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      style={{
                        flex: 1,
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[3],
                        fontSize: 15,
                        textAlign: 'right',
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ paddingHorizontal: spacing[3] }}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={20} color={colors.gray[400]} />
                      ) : (
                        <Eye size={20} color={colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View>
                  <View
                    style={{
                      flexDirection: getFlexDirection('row-reverse'),
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.gray[300],
                      borderRadius: 10,
                      backgroundColor: colors.white,
                    }}
                  >
                    <TextInput
                      placeholder="סיסמה חדשה"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      style={{
                        flex: 1,
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[3],
                        fontSize: 15,
                        textAlign: 'right',
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={{ paddingHorizontal: spacing[3] }}
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} color={colors.gray[400]} />
                      ) : (
                        <Eye size={20} color={colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View>
                  <View
                    style={{
                      flexDirection: getFlexDirection('row-reverse'),
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.gray[300],
                      borderRadius: 10,
                      backgroundColor: colors.white,
                    }}
                  >
                    <TextInput
                      placeholder="אימות סיסמה חדשה"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      style={{
                        flex: 1,
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[3],
                        fontSize: 15,
                        textAlign: 'right',
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ paddingHorizontal: spacing[3] }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={colors.gray[400]} />
                      ) : (
                        <Eye size={20} color={colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={handleChangePassword}
                  style={{
                    backgroundColor: colors.primary[600],
                    paddingVertical: spacing[2],
                    borderRadius: 10,
                    alignItems: 'center',
                    marginTop: spacing[1],
                    minHeight: 44,
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Typography variant="body2" weight="bold" style={{ color: colors.white }}>
                    שנה סיסמה
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Two-Factor Authentication */}
            <SettingRow
              icon={<Shield size={20} color={colors.primary[600]} />}
              label="אימות דו-שלבי"
              description="הגן על החשבון שלך עם שכבת אבטחה נוספת"
              rightElement={
                <View style={{ transform: [{ scaleX: -1 }] }}>
                  <Switch
                    value={twoFactorEnabled}
                    onValueChange={setTwoFactorEnabled}
                    trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                    thumbColor={twoFactorEnabled ? colors.primary[600] : colors.white}
                  />
                </View>
              }
            />
          </View>
        </View>
        
        {/* Connected Devices */}
        <View style={{ paddingTop: spacing[5] }}>
          <Typography 
            variant="caption" 
            weight="semibold" 
            color="textSecondary"
            style={{ marginBottom: spacing[2], textAlign: getTextAlign('right') }}
            align={getTextAlign('right')}
          >
            מכשירים מחוברים
          </Typography>
          
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {connectedDevices.map((device, index) => (
              <View
                key={device.id}
                style={{
                  flexDirection: getFlexDirection('row-reverse'),
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[4],
                  borderBottomWidth: index < connectedDevices.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(0, 0, 0, 0.06)',
                }}
              >
                <View
                  style={{
                    flexDirection: getFlexDirection('row-reverse'),
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
                      backgroundColor: colors.gray[100],
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Smartphone size={20} color={colors.gray[600]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body1" weight="medium" align="center" style={{ textAlign: 'center' }}>
                      {device.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" align="center" style={{ textAlign: 'center' }}>
                      {device.lastActive} • {device.location}
                    </Typography>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => handleDisconnectDevice(device.id)}
                  style={{
                    paddingVertical: spacing[1],
                    paddingHorizontal: spacing[2],
                  }}
                >
                  <Typography variant="caption" style={{ color: colors.error[600] }}>
                    נתק
                  </Typography>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        
        {/* Privacy Settings */}
        <View style={{ paddingTop: spacing[5] }}>
          <Typography 
            variant="caption" 
            weight="semibold" 
            color="textSecondary"
            style={{ marginBottom: spacing[2], textAlign: getTextAlign('right') }}
            align={getTextAlign('right')}
          >
            הגדרות פרטיות
          </Typography>
          
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <SettingRow
              icon={<Eye size={20} color={colors.primary[600]} />}
              label="פרופיל ציבורי"
              description="הפרופיל שלך מוצג בתוצאות חיפוש"
              rightElement={
                <View style={{ transform: [{ scaleX: -1 }] }}>
                  <Switch
                    value={publicProfileVisible}
                    onValueChange={setPublicProfileVisible}
                    trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                    thumbColor={publicProfileVisible ? colors.primary[600] : colors.white}
                  />
                </View>
              }
            />
            
            <SettingRow
              icon={<MapPin size={20} color={colors.primary[600]} />}
              label="הסתר מיקום מדויק"
              description="הצג רק עיר ולא כתובת מלאה"
              rightElement={
                <View style={{ transform: [{ scaleX: -1 }] }}>
                  <Switch
                    value={hideExactLocation}
                    onValueChange={setHideExactLocation}
                    trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                    thumbColor={hideExactLocation ? colors.primary[600] : colors.white}
                  />
                </View>
              }
            />
            
            <TouchableOpacity
              onPress={() => alert('ניהול Cookies (דמה)')}
              style={{
                flexDirection: getFlexDirection('row-reverse'),
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[4],
                backgroundColor: colors.white,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  flexDirection: getFlexDirection('row-reverse'),
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
                  <Cookie size={20} color={colors.primary[600]} />
                </View>
                <Typography variant="body1" weight="medium" align={getTextAlign('right')} style={{ textAlign: getTextAlign('right') }}>
                  ניהול Cookies
                </Typography>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

