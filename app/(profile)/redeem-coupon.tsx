import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Ticket,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useCredits } from '@/context/CreditsContext';
import { redeemCoupon } from '@/services/api/creditsAPI';

export default function RedeemCouponScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  const { refetchCredits } = useCredits();

  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRedeem = async () => {
    if (!couponCode.trim()) {
      setErrorMessage('אנא הזן קוד קופון');
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await redeemCoupon(couponCode);

      if (result.success) {
        setSuccessMessage(`🎉 קופון מומש בהצלחה! קיבלת ${result.credits_awarded} ₪ קרדיטים`);
        setCouponCode('');

        // Refresh credits balance
        await refetchCredits();

        // Show success alert
        Alert.alert(
          'קופון מומש בהצלחה!',
          `נוספו ${result.credits_awarded} ₪ לחשבון שלך.\n${result.description}`,
          [
            {
              text: 'סגור',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        setErrorMessage('הקופון לא תקף או שכבר נוצל');
      }
    } catch (error: any) {
      console.error('Coupon redemption error:', error);

      let errorMsg = 'שגיאה במימוש הקופון';
      if (error.message?.includes('already redeemed')) {
        errorMsg = 'כבר מימשת את הקופון הזה בעבר';
      } else if (error.message?.includes('not found')) {
        errorMsg = 'קוד קופון לא תקף';
      } else if (error.message?.includes('expired')) {
        errorMsg = 'הקופון פג תוקף';
      } else if (error.message?.includes('max uses')) {
        errorMsg = 'הקופון הגיע למקסימום השימושים';
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
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
    inputCard: {
      backgroundColor: colors.white,
      marginBottom: spacing[3],
    },
    inputContainer: {
      backgroundColor: colors.gray[50],
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.gray[300],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      marginBottom: spacing[4],
    },
    input: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.gray[900],
      paddingVertical: spacing[2],
      textTransform: 'uppercase',
    },
    redeemButton: {
      backgroundColor: colors.primary[600],
      borderRadius: 12,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: getFlexDirection(),
      gap: spacing[2],
    },
    redeemButtonDisabled: {
      backgroundColor: colors.gray[300],
    },
    messageCard: {
      borderRadius: 12,
      padding: spacing[4],
      marginBottom: spacing[3],
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[3],
    },
    successCard: {
      backgroundColor: colors.green[50],
      borderWidth: 1,
      borderColor: colors.green[200],
    },
    errorCard: {
      backgroundColor: colors.red[50],
      borderWidth: 1,
      borderColor: colors.red[200],
    },
    examplesCard: {
      backgroundColor: colors.white,
      marginTop: spacing[2],
    },
    exampleItem: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
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
            מימוש קופון
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <CardContent>
            <View style={{ alignItems: 'center' }}>
              <Ticket size={48} color={colors.white} />
              <Typography variant="h4" weight="bold" color="white" style={{ marginTop: spacing[3], textAlign: 'center' }}>
                מימוש קוד קופון
              </Typography>
              <Typography variant="body2" color="white" style={{ marginTop: spacing[2], textAlign: 'center', opacity: 0.9 }}>
                הזן את קוד הקופון שקיבלת וקבל קרדיטים לחשבון שלך
              </Typography>
            </View>
          </CardContent>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <View style={[styles.messageCard, styles.successCard]}>
            <CheckCircle size={24} color={colors.green[600]} />
            <Typography
              variant="body1"
              weight="medium"
              style={{ color: colors.green[700], flex: 1, textAlign: isRTL ? 'right' : 'left' }}
            >
              {successMessage}
            </Typography>
          </View>
        )}

        {/* Error Message */}
        {errorMessage && (
          <View style={[styles.messageCard, styles.errorCard]}>
            <AlertCircle size={24} color={colors.red[600]} />
            <Typography
              variant="body1"
              weight="medium"
              style={{ color: colors.red[700], flex: 1, textAlign: isRTL ? 'right' : 'left' }}
            >
              {errorMessage}
            </Typography>
          </View>
        )}

        {/* Input Card */}
        <Card style={styles.inputCard}>
          <CardContent>
            <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[3], textAlign: 'center' }}>
              קוד הקופון
            </Typography>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text.toUpperCase());
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                placeholder="WELCOME100"
                placeholderTextColor={colors.gray[400]}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.redeemButton,
                (!couponCode.trim() || isLoading) && styles.redeemButtonDisabled,
              ]}
              onPress={handleRedeem}
              disabled={!couponCode.trim() || isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Sparkles size={20} color={colors.white} />
                  <Typography variant="body1" weight="semibold" color="white">
                    מימוש קופון
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Examples Card */}
        <Card style={styles.examplesCard}>
          <CardContent>
            <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
              קופונים זמינים
            </Typography>

            <View style={styles.exampleItem}>
              <View style={{ flex: 1 }}>
                <Typography variant="body1" weight="medium">
                  WELCOME100
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  קופון ברוכים הבאים - 100 ₪
                </Typography>
              </View>
              <Typography variant="body2" style={{ color: colors.green[600] }} weight="semibold">
                +100 ₪
              </Typography>
            </View>

            <View style={[styles.exampleItem, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Typography variant="body1" weight="medium">
                  MAXCREDITS2025
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  קופון מיוחד - מקסימום קרדיטים
                </Typography>
              </View>
              <Typography variant="body2" style={{ color: colors.green[600] }} weight="semibold">
                +99,999 ₪
              </Typography>
            </View>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card style={{ backgroundColor: colors.blue[50], borderWidth: 0, marginTop: spacing[3] }}>
          <CardContent>
            <Typography variant="body2" style={{ color: colors.blue[700], textAlign: 'center', lineHeight: 20 }}>
              💡 טיפ: כל קופון ניתן למימוש פעם אחת בלבד. הקרדיטים יתווספו מיד לחשבון שלך ותוכל להשתמש בהם לתשלום שיעורים.
            </Typography>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
