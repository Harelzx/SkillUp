import { useState, useMemo } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView, Switch, Platform } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingData, BookingPricing } from '@/types/booking';
import { Tag, Info, ChevronDown, ChevronUp, CreditCard, Smartphone, Wallet, CheckCircle2 } from 'lucide-react-native';

export type PaymentMethod = 'apple_pay' | 'google_pay' | 'card' | 'credits' | 'bit';

interface BookingStep5Props {
  data: BookingData;
  teacherName: string;
  hourlyRate: number;
  availableCredits: number;
  onChange: (data: Partial<BookingData>) => void;
  selectedPaymentMethod: PaymentMethod | null;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  errors: Record<string, string>;
}

export function BookingStep5({ 
  data, 
  teacherName, 
  hourlyRate, 
  availableCredits, 
  onChange,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  errors,
}: BookingStep5Props) {
  const [couponCode, setCouponCode] = useState(data.couponCode || '');
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);

  // Calculate pricing
  const pricing: BookingPricing = useMemo(() => {
    const durationHours = data.duration / 60;
    const subtotal = hourlyRate * durationHours;
    
    let creditsUsed = 0;
    if (data.useCredits && availableCredits > 0) {
      creditsUsed = Math.min(availableCredits, subtotal);
    }

    // Mock discount from coupon
    const discount = couponCode === 'FIRST10' ? subtotal * 0.1 : 0;

    const total = Math.max(0, subtotal - creditsUsed - discount);

    return {
      hourlyRate,
      duration: data.duration,
      subtotal,
      creditsUsed,
      discount,
      total,
    };
  }, [data.duration, data.useCredits, hourlyRate, availableCredits, couponCode]);

  const paymentMethods = [
    {
      id: 'apple_pay' as PaymentMethod,
      name: 'Apple Pay',
      description: 'תשלום מהיר ומאובטח',
      icon: Smartphone,
      available: Platform.OS === 'ios',
    },
    {
      id: 'google_pay' as PaymentMethod,
      name: 'Google Pay',
      description: 'תשלום מהיר ומאובטח',
      icon: Smartphone,
      available: Platform.OS === 'android',
    },
    {
      id: 'card' as PaymentMethod,
      name: 'כרטיס אשראי',
      description: 'ויזה, מאסטרקארד, אמריקן אקספרס',
      icon: CreditCard,
      available: true,
    },
    {
      id: 'bit' as PaymentMethod,
      name: 'Bit',
      description: 'העברה מיידית',
      icon: Wallet,
      available: true,
    },
  ];

  const availableMethods = paymentMethods.filter(m => m.available);
  const amountToPay = pricing.total;
  const isCoveredByCredits = amountToPay === 0;

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="h4" weight="bold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          תשלום
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
          בחר אמצעי תשלום והשלם את ההזמנה
        </Typography>
      </View>

      {/* Quick Summary */}
      <View style={{
        backgroundColor: colors.gray[50],
        borderRadius: 12,
        padding: spacing[3],
        marginBottom: spacing[4],
      }}>
        <Typography variant="caption" color="textSecondary" style={{ textAlign: 'right', marginBottom: spacing[1] }}>
          שיעור עם {teacherName}
        </Typography>
        <Typography variant="body2" style={{ textAlign: 'right' }}>
          {data.subject} • {data.duration} דקות
        </Typography>
      </View>

      {/* Credits Toggle */}
      {availableCredits > 0 && (
        <View style={{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: spacing[4],
          backgroundColor: colors.green[50],
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.green[200],
          marginBottom: spacing[4],
        }}>
          <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: spacing[2] }}>
            <Typography variant="body1" weight="semibold">
              השתמש בקרדיטים
            </Typography>
            <Typography variant="caption" color="textSecondary">
              יתרה זמינה: ₪{availableCredits.toFixed(2)}
            </Typography>
          </View>
          <Switch
            value={data.useCredits}
            onValueChange={(useCredits) => onChange({ useCredits })}
            trackColor={{ false: colors.gray[300], true: colors.green[600] }}
            thumbColor={colors.white}
            accessibilityLabel="השתמש בקרדיטים"
          />
        </View>
      )}

      {/* Coupon Code */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          קוד קופון (אופציונלי)
        </Typography>
        <View style={{ flexDirection: 'row-reverse' }}>
          <TextInput
            value={couponCode}
            onChangeText={setCouponCode}
            placeholder="הזן קוד קופון"
            placeholderTextColor={colors.gray[400]}
            accessibilityLabel="קוד קופון"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.gray[300],
              borderRadius: 12,
              padding: spacing[3],
              textAlign: 'right',
              fontFamily: 'System',
              fontSize: 16,
              color: colors.gray[900],
              marginRight: spacing[2],
              minHeight: 48,
            }}
          />
          <TouchableOpacity
            onPress={() => onChange({ couponCode })}
            accessibilityRole="button"
            accessibilityLabel="החל קוד קופון"
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              backgroundColor: colors.primary[600],
              borderRadius: 12,
              justifyContent: 'center',
              minHeight: 48,
              minWidth: 80,
            }}
          >
            <Typography variant="body2" color="white" weight="semibold">
              החל
            </Typography>
          </TouchableOpacity>
        </View>
        {couponCode === 'FIRST10' && (
          <View style={{
            marginTop: spacing[2],
            padding: spacing[2],
            backgroundColor: colors.green[50],
            borderRadius: 8,
            flexDirection: 'row-reverse',
            alignItems: 'center',
          }}>
            <Tag size={16} color={colors.green[600]} style={{ marginLeft: spacing[2] }} />
            <Typography variant="caption" style={{ color: colors.green[700] }}>
              קוד קופון הוחל בהצלחה! הנחה של 10%
            </Typography>
          </View>
        )}
      </View>

      {/* Price Breakdown */}
      <View style={{
        backgroundColor: colors.gray[50],
        borderRadius: 16,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}>
        <Typography variant="h6" weight="bold" style={{ textAlign: 'right', marginBottom: spacing[3] }}>
          פירוט מחיר
        </Typography>

        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: spacing[2] }}>
          <Typography variant="body2" color="textSecondary">
            ₪{hourlyRate} × {data.duration} דקות
          </Typography>
          <Typography variant="body2">
            ₪{pricing.subtotal.toFixed(2)}
          </Typography>
        </View>

        {pricing.creditsUsed > 0 && (
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: spacing[2] }}>
            <Typography variant="body2" style={{ color: colors.green[700] }}>
              שימוש בקרדיטים
            </Typography>
            <Typography variant="body2" style={{ color: colors.green[700] }}>
              -₪{pricing.creditsUsed.toFixed(2)}
            </Typography>
          </View>
        )}

        {pricing.discount > 0 && (
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: spacing[2] }}>
            <Typography variant="body2" style={{ color: colors.green[700] }}>
              הנחה (קופון)
            </Typography>
            <Typography variant="body2" style={{ color: colors.green[700] }}>
              -₪{pricing.discount.toFixed(2)}
            </Typography>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: colors.gray[300], marginVertical: spacing[3] }} />

        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" weight="bold">
            סה"כ לתשלום
          </Typography>
          <Typography variant="h4" weight="bold" color="primary">
            ₪{pricing.total.toFixed(2)}
          </Typography>
        </View>
      </View>

      {/* Cancellation Policy */}
      <TouchableOpacity
        onPress={() => setShowCancellationPolicy(!showCancellationPolicy)}
        accessibilityRole="button"
        accessibilityLabel="מידע על ביטולים והחזרים"
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          padding: spacing[3],
          backgroundColor: colors.blue[50],
          borderRadius: 12,
          marginBottom: showCancellationPolicy ? spacing[2] : spacing[4],
          minHeight: 52,
        }}
      >
        <Info size={20} color={colors.blue[600]} style={{ marginLeft: spacing[2] }} />
        <Typography variant="body2" color="primary" style={{ flex: 1, textAlign: 'right' }}>
          מידע על ביטולים והחזרים
        </Typography>
        {showCancellationPolicy ? (
          <ChevronUp size={20} color={colors.blue[600]} />
        ) : (
          <ChevronDown size={20} color={colors.blue[600]} />
        )}
      </TouchableOpacity>

      {showCancellationPolicy && (
        <View style={{
          padding: spacing[4],
          backgroundColor: colors.white,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.gray[200],
          marginBottom: spacing[4],
        }}>
          <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right', lineHeight: 22 }}>
            • ביטול עד 24 שעות לפני השיעור - החזר מלא{'\n'}
            • ביטול 12-24 שעות לפני - החזר של 50%{'\n'}
            • ביטול פחות מ-12 שעות לפני - ללא החזר{'\n'}
            • במקרה של אי התייצבות המורה - החזר מלא
          </Typography>
        </View>
      )}

      {/* Payment Method Selection or Covered by Credits */}
      {isCoveredByCredits ? (
        <View style={{
          alignItems: 'center',
          padding: spacing[6],
          backgroundColor: colors.green[50],
          borderRadius: 16,
          borderWidth: 2,
          borderColor: colors.green[200],
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.green[100],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[3],
          }}>
            <Wallet size={32} color={colors.green[600]} />
          </View>

          <Typography variant="h5" weight="bold" style={{ color: colors.green[900], marginBottom: spacing[2], textAlign: 'center' }}>
            מכוסה בקרדיטים! 🎉
          </Typography>

          <Typography variant="body1" style={{ color: colors.green[800], textAlign: 'center', marginBottom: spacing[3] }}>
            השיעור מכוסה במלואו מיתרת הקרדיטים שלך
          </Typography>

          <View style={{
            backgroundColor: colors.white,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            borderRadius: 20,
          }}>
            <Typography variant="h6" weight="bold" style={{ color: colors.green[700] }}>
              ₪{pricing.subtotal.toFixed(2)}
            </Typography>
          </View>
        </View>
      ) : (
        <View>
          <Typography variant="h6" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[3] }}>
            בחר אמצעי תשלום
          </Typography>

          {availableMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedPaymentMethod === method.id;

            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => onPaymentMethodSelect(method.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${method.name} - ${method.description}`}
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  padding: spacing[4],
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary[600] : colors.gray[200],
                  backgroundColor: isSelected ? colors.primary[50] : colors.white,
                  marginBottom: spacing[3],
                  minHeight: 72,
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isSelected ? colors.primary[100] : colors.gray[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={24} color={isSelected ? colors.primary[600] : colors.gray[600]} />
                </View>

                <View style={{ flex: 1, marginRight: spacing[3] }}>
                  <Typography variant="body1" weight="semibold" style={{ color: isSelected ? colors.primary[700] : colors.gray[900] }}>
                    {method.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1] }}>
                    {method.description}
                  </Typography>
                </View>

                {isSelected && (
                  <CheckCircle2 size={24} color={colors.primary[600]} />
                )}
              </TouchableOpacity>
            );
          })}

          {errors.paymentMethod && (
            <View style={{
              padding: spacing[2],
              backgroundColor: colors.error[50],
              borderRadius: 8,
              marginBottom: spacing[3],
            }}>
              <Typography variant="caption" style={{ color: colors.error[700], textAlign: 'right' }}>
                {errors.paymentMethod}
              </Typography>
            </View>
          )}
        </View>
      )}

      {/* Security Info */}
      <View style={{
        backgroundColor: colors.blue[50],
        padding: spacing[3],
        borderRadius: 8,
        marginTop: spacing[3],
      }}>
        <Typography variant="caption" style={{ color: colors.blue[900], textAlign: 'center' }}>
          🔒 התשלום מאובטח ומוצפן. פרטי התשלום שלך לא נשמרים במערכת.
        </Typography>
      </View>
    </ScrollView>
  );
}

