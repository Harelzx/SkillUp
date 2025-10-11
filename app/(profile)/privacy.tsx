import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Eye,
  Download,
  Trash2,
  FileText,
  X,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  
  const [showFullName, setShowFullName] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showRatings, setShowRatings] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportData = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('הנתונים שלך נשלחו אליך במייל');
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בייצוא הנתונים');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'מחק') {
      showToast('יש להקליד "מחק" בדיוק');
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowDeleteModal(false);
      Alert.alert(
        'החשבון נמחק',
        'החשבון שלך נמחק בהצלחה',
        [{ text: 'אישור', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה במחיקת החשבון');
    } finally {
      setIsProcessing(false);
    }
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
    dangerZone: {
      marginTop: spacing[6],
    },
    dangerButton: {
      backgroundColor: colors.red[50],
      borderColor: colors.red[200],
      borderWidth: 1,
      marginBottom: spacing[2],
    },
    actionButton: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[2],
      padding: spacing[4],
    },
    linkButton: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[2],
      padding: spacing[3],
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[4],
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: spacing[5],
      width: '100%',
      maxWidth: 400,
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.gray[300],
      padding: spacing[3],
      fontSize: 16,
      textAlign: 'center',
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
            פרטיות
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Visibility */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            נראות פרופיל
          </Typography>
          <Card>
            <CardContent>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">שם מלא</Typography>
                  <Typography variant="caption" color="textSecondary">הצג שם מלא בפרופיל הציבורי</Typography>
                </View>
                <Switch
                  value={showFullName}
                  onValueChange={setShowFullName}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">תמונת פרופיל</Typography>
                  <Typography variant="caption" color="textSecondary">הצג תמונה בפרופיל</Typography>
                </View>
                <Switch
                  value={showPhoto}
                  onValueChange={setShowPhoto}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">דירוגים</Typography>
                  <Typography variant="caption" color="textSecondary">הצג דירוגים שקיבלת</Typography>
                </View>
                <Switch
                  value={showRatings}
                  onValueChange={setShowRatings}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
              
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">סטטוס מחובר</Typography>
                  <Typography variant="caption" color="textSecondary">הצג אותי כמחובר</Typography>
                </View>
                <Switch
                  value={showOnlineStatus}
                  onValueChange={setShowOnlineStatus}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Data & Analytics */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            נתונים וניתוח
          </Typography>
          <Card>
            <CardContent>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Typography variant="body1" weight="medium">ניתוח שימוש</Typography>
                  <Typography variant="caption" color="textSecondary">עזור לנו לשפר את האפליקציה</Typography>
                </View>
                <Switch
                  value={analyticsEnabled}
                  onValueChange={setAnalyticsEnabled}
                  trackColor={{ false: colors.gray[300], true: colors.primary[600] }}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
            מסמכים משפטיים
          </Typography>
          <Card>
            <CardContent style={{ padding: 0 }}>
              <TouchableOpacity style={styles.linkButton}>
                <FileText size={20} color={colors.gray[600]} />
                <Typography variant="body1" style={{ flex: 1 }}>
                  מדיניות פרטיות
                </Typography>
                <ArrowRight
                  size={16}
                  color={colors.gray[400]}
                  style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
                />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: colors.gray[100] }} />
              <TouchableOpacity style={styles.linkButton}>
                <FileText size={20} color={colors.gray[600]} />
                <Typography variant="body1" style={{ flex: 1 }}>
                  תנאי שימוש
                </Typography>
                <ArrowRight
                  size={16}
                  color={colors.gray[400]}
                  style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
                />
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>

        {/* Data Actions */}
        <Card>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
            disabled={isProcessing}
          >
            <Download size={24} color={colors.primary[600]} />
            <View style={{ flex: 1 }}>
              <Typography variant="body1" weight="semibold" color="primary">
                ייצוא הנתונים שלי
              </Typography>
              <Typography variant="caption" color="textSecondary">
                קבל העתק של כל הנתונים שלך
              </Typography>
            </View>
            {isProcessing && <ActivityIndicator color={colors.primary[600]} />}
          </TouchableOpacity>
        </Card>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3], color: colors.red[600] }}>
            אזור מסוכן
          </Typography>
          <Card style={styles.dangerButton}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <Trash2 size={24} color={colors.red[600]} />
              <View style={{ flex: 1 }}>
                <Typography variant="body1" weight="semibold" style={{ color: colors.red[600] }}>
                  מחק חשבון
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  פעולה זו לא ניתנת לביטול
                </Typography>
              </View>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{
                  position: 'absolute',
                  top: spacing[2],
                  left: isRTL ? undefined : spacing[2],
                  right: isRTL ? spacing[2] : undefined,
                  zIndex: 1,
                  padding: spacing[2],
                }}
              >
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center', marginTop: spacing[2] }}>
                <Trash2 size={48} color={colors.red[600]} />
                <Typography variant="h5" weight="bold" align="center" style={{ marginTop: spacing[3], marginBottom: spacing[2] }}>
                  מחק חשבון לצמיתות
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: spacing[4] }}>
                  פעולה זו תמחק את כל הנתונים שלך ולא ניתן לשחזר אותם
                </Typography>
              </View>

              <View style={{
                backgroundColor: colors.red[50],
                padding: spacing[3],
                borderRadius: 12,
                marginBottom: spacing[4],
              }}>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginBottom: spacing[2] }}>
                  הקלד "מחק" לאישור
                </Typography>
                <TextInput
                  style={styles.input}
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="מחק"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={{ flexDirection: getFlexDirection(), gap: spacing[2] }}>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.gray[200],
                    padding: spacing[3],
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={isProcessing}
                >
                  <Typography variant="body2" weight="semibold" style={{ color: colors.gray[700] }}>
                    ביטול
                  </Typography>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  style={{
                    flex: 1,
                    backgroundColor: deleteConfirmText === 'מחק' ? colors.red[600] : colors.gray[300],
                    padding: spacing[3],
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={deleteConfirmText !== 'מחק' || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Typography variant="body2" weight="semibold" color="white">
                      מחק חשבון
                    </Typography>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

