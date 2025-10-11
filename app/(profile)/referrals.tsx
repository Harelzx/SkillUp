import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Copy,
  Share2,
  Gift,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

interface Referral {
  id: string;
  friendName: string;
  date: string;
  status: 'pending' | 'completed';
  creditsEarned: number;
}

export default function ReferralsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  
  const referralCode = 'YOSSI2024';
  const referralLink = `https://skillup.app/join/${referralCode}`;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const referrals: Referral[] = [
    { id: '1', friendName: 'דני כהן', date: '15/01/2024', status: 'completed', creditsEarned: 50 },
    { id: '2', friendName: 'מיכל לוי', date: '20/01/2024', status: 'pending', creditsEarned: 0 },
  ];

  const totalEarned = referrals.reduce((sum, r) => sum + r.creditsEarned, 0);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = async () => {
    Clipboard.setString(referralLink);
    showToast('הקישור הועתק ללוח');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `הצטרף ל-SkillUp והשיעור הראשון שלך חינם! השתמש בקוד שלי: ${referralCode}\n${referralLink}`,
      });
    } catch (error) {
      console.log('Share error:', error);
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
    heroCard: {
      backgroundColor: colors.primary[600],
      marginBottom: spacing[4],
    },
    codeCard: {
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.gray[300],
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: spacing[4],
      alignItems: 'center',
      marginTop: spacing[4],
    },
    actionButtons: {
      flexDirection: getFlexDirection(),
      gap: spacing[2],
      marginTop: spacing[4],
    },
    statsGrid: {
      flexDirection: getFlexDirection(),
      gap: spacing[3],
      marginBottom: spacing[4],
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: spacing[3],
      backgroundColor: colors.white,
      borderRadius: 12,
    },
    referralItem: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
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
            הפניות
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <CardContent>
            <View style={{ alignItems: 'center' }}>
              <Gift size={48} color={colors.white} />
              <Typography variant="h4" weight="bold" color="white" style={{ marginTop: spacing[3], textAlign: 'center' }}>
                הזמן חברים וקבל קרדיטים!
              </Typography>
              <Typography variant="body2" color="white" style={{ marginTop: spacing[2], textAlign: 'center', opacity: 0.9 }}>
                עבור כל חבר שמצטרף דרך הקישור שלך, שניכם תקבלו 50 ₪ קרדיטים
              </Typography>
            </View>

            {/* Referral Code */}
            <View style={styles.codeCard}>
              <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[1] }}>
                הקוד שלך
              </Typography>
              <Typography variant="h4" weight="bold" color="primary">
                {referralCode}
              </Typography>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleCopy}
                style={{
                  flex: 1,
                  backgroundColor: colors.white,
                  padding: spacing[3],
                  borderRadius: 12,
                  flexDirection: getFlexDirection(),
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                }}
              >
                <Copy size={18} color={colors.primary[600]} />
                <Typography variant="body2" weight="semibold" color="primary">
                  העתק
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  flex: 1,
                  backgroundColor: colors.white,
                  padding: spacing[3],
                  borderRadius: 12,
                  flexDirection: getFlexDirection(),
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                }}
              >
                <Share2 size={18} color={colors.primary[600]} />
                <Typography variant="body2" weight="semibold" color="primary">
                  שתף
                </Typography>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Users size={24} color={colors.primary[600]} />
            <Typography variant="h5" weight="bold" style={{ marginTop: spacing[2] }}>
              {referrals.length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              הפניות
            </Typography>
          </Card>
          
          <Card style={styles.statCard}>
            <Gift size={24} color={colors.green[600]} />
            <Typography variant="h5" weight="bold" style={{ marginTop: spacing[2] }}>
              {totalEarned} ₪
            </Typography>
            <Typography variant="caption" color="textSecondary">
              הרווחת
            </Typography>
          </Card>
        </View>

        {/* Referrals List */}
        <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
          ההפניות שלך
        </Typography>
        <Card>
          <CardContent>
            {referrals.map((referral, index) => (
              <View
                key={referral.id}
                style={[
                  styles.referralItem,
                  index === referrals.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="body1" weight="medium">
                    {referral.friendName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {referral.date}
                  </Typography>
                </View>
                <View style={{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[2] }}>
                  {referral.status === 'completed' ? (
                    <>
                      <CheckCircle size={18} color={colors.green[600]} />
                      <Typography variant="body2" style={{ color: colors.green[600] }} weight="semibold">
                        +{referral.creditsEarned} ₪
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Clock size={18} color={colors.gray[400]} />
                      <Typography variant="body2" color="textSecondary">
                        ממתין
                      </Typography>
                    </>
                  )}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
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

