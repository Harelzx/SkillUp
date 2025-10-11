import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
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
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Info,
  Coins,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useCredits } from '@/context/CreditsContext';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  const { credits } = useCredits();
  
  const [cards, setCards] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '25',
      isDefault: true,
    },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreditsInfo, setShowCreditsInfo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSetDefault = (cardId: string) => {
    setCards(cards.map(card => ({
      ...card,
      isDefault: card.id === cardId
    })));
    showToast('כרטיס ברירת המחדל עודכן');
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'מחיקת כרטיס',
      'האם אתה בטוח שברצונך למחוק כרטיס זה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => {
            setCards(cards.filter(card => card.id !== cardId));
            showToast('הכרטיס נמחק בהצלחה');
          },
        },
      ]
    );
  };

  const getCardIcon = (type: string) => {
    return type.toUpperCase();
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
    creditsCard: {
      backgroundColor: colors.green[50],
      borderColor: colors.green[200],
      marginBottom: spacing[4],
    },
    cardItem: {
      marginBottom: spacing[3],
    },
    cardContent: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[3],
    },
    cardInfo: {
      flex: 1,
    },
    cardActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: spacing[2],
    },
    defaultBadge: {
      backgroundColor: colors.green[50],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: 12,
      marginTop: spacing[1],
    },
    addButton: {
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.primary[600],
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: spacing[4],
      alignItems: 'center',
      gap: spacing[2],
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
            אמצעי תשלום
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Credits Info */}
        <Card style={styles.creditsCard}>
          <CardContent>
            <TouchableOpacity
              onPress={() => setShowCreditsInfo(true)}
              style={{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[2] }}
            >
              <Coins size={24} color={colors.green[600]} />
              <View style={{ flex: 1 }}>
                <Typography variant="body1" weight="semibold" style={{ color: colors.green[700] }}>
                  יתרת קרדיטים
                </Typography>
                <Typography variant="h4" weight="bold" style={{ color: colors.green[600], marginTop: spacing[1] }}>
                  {credits.toFixed(0)} ₪
                </Typography>
              </View>
              <Info size={20} color={colors.green[500]} />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Payment Cards */}
        <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
          כרטיסי אשראי
        </Typography>

        {cards.map(card => (
          <Card key={card.id} style={styles.cardItem}>
            <CardContent>
              <View style={styles.cardContent}>
                <CreditCard size={24} color={colors.gray[600]} />
                <View style={styles.cardInfo}>
                  <Typography variant="body1" weight="semibold">
                    {getCardIcon(card.type)} •••• {card.last4}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    תוקף: {card.expiryMonth}/{card.expiryYear}
                  </Typography>
                  {card.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Typography variant="caption" style={{ color: colors.green[700], fontSize: 11 }}>
                        ברירת מחדל
                      </Typography>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  {!card.isDefault && (
                    <TouchableOpacity onPress={() => handleSetDefault(card.id)}>
                      <CheckCircle size={20} color={colors.gray[400]} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteCard(card.id)}>
                    <Trash2 size={20} color={colors.red[500]} />
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        {/* Add Card Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color={colors.primary[600]} />
          <Typography variant="body1" weight="semibold" color="primary">
            הוסף כרטיס אשראי
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Card Modal - Stub */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h5" weight="bold" align="center" style={{ marginBottom: spacing[4] }}>
              הוסף כרטיס אשראי
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: spacing[4] }}>
              פיצ'ר זה יחובר לספק תשלומים בהמשך
            </Typography>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={{
                backgroundColor: colors.primary[600],
                padding: spacing[3],
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Typography variant="body1" weight="semibold" color="white">
                סגור
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Credits Info Modal */}
      <Modal visible={showCreditsInfo} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreditsInfo(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Typography variant="h5" weight="bold" align="center" style={{ marginBottom: spacing[3] }}>
                מה זה קרדיטים?
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: spacing[4] }}>
                קרדיטים הם זיכוי משיעורים שבוטלו. ניתן להשתמש בהם לתשלום שיעורים עתידיים.
              </Typography>
              <TouchableOpacity
                onPress={() => setShowCreditsInfo(false)}
                style={{
                  backgroundColor: colors.primary[600],
                  padding: spacing[3],
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Typography variant="body1" weight="semibold" color="white">
                  הבנתי
                </Typography>
              </TouchableOpacity>
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

