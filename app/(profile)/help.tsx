import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mail,
  FileQuestion,
  X,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'איך אני משלם עבור שיעור?',
    answer: 'ניתן לשלם באמצעות כרטיס אשראי או באמצעות קרדיטים שצברת מביטול שיעורים קודמים. התשלום מתבצע אוטומטית לפני השיעור.',
  },
  {
    id: '2',
    question: 'מה זה קרדיטים?',
    answer: 'קרדיטים הם זיכוי שמתקבל כאשר מבטלים שיעור ובוחרים "החזר בקרדיטים". ניתן להשתמש בהם לתשלום שיעורים עתידיים.',
  },
  {
    id: '3',
    question: 'איך אני מבטל שיעור?',
    answer: 'בדף "השיעורים שלי", לחץ על "ביטול שיעור" ובחר את שיטת ההחזר המועדפת עליך - לכרטיס אשראי או בקרדיטים.',
  },
  {
    id: '4',
    question: 'איך אני בוחר מורה?',
    answer: 'חפש מורים לפי נושא, קטגוריה או שם. לחץ על המורה לצפייה בפרופיל המלא שלו, דירוגים וזמינות. לחץ "הזמן עכשיו" לקביעת שיעור.',
  },
];

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reportCategories = ['בעיה טכנית', 'תשלומים', 'מורה', 'שיעור', 'אחר'];

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitReport = async () => {
    if (!reportCategory || !reportDescription.trim()) {
      showToast('אנא מלא את כל השדות');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowReportModal(false);
      setReportCategory('');
      setReportDescription('');
      showToast('הפנייה נשלחה בהצלחה. נחזור אליך בקרוב');
    } catch (error) {
      showToast('אירעה שגיאה בשליחת הפנייה');
    } finally {
      setIsSubmitting(false);
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
    faqItem: {
      marginBottom: spacing[2],
    },
    faqQuestion: {
      flexDirection: getFlexDirection(),
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing[4],
    },
    actionCard: {
      marginTop: spacing[4],
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[200],
    },
    actionButton: {
      flexDirection: getFlexDirection(),
      alignItems: 'center',
      gap: spacing[2],
      padding: spacing[4],
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
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: spacing[3],
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    categoryChip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.gray[300],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      marginBottom: spacing[2],
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
            עזרה
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* FAQ */}
        <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
          שאלות נפוצות
        </Typography>

        {faqs.map(faq => (
          <Card key={faq.id} style={styles.faqItem}>
            <TouchableOpacity onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}>
              <View style={styles.faqQuestion}>
                <Typography variant="body1" weight="medium" style={{ flex: 1 }}>
                  {faq.question}
                </Typography>
                {expandedFaq === faq.id ? (
                  <ChevronUp size={20} color={colors.gray[600]} />
                ) : (
                  <ChevronDown size={20} color={colors.gray[600]} />
                )}
              </View>
              {expandedFaq === faq.id && (
                <CardContent style={{ paddingTop: 0 }}>
                  <Typography variant="body2" color="textSecondary" style={{ lineHeight: 22 }}>
                    {faq.answer}
                  </Typography>
                </CardContent>
              )}
            </TouchableOpacity>
          </Card>
        ))}

        {/* Contact Support */}
        <Card style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowReportModal(true)}
          >
            <MessageSquare size={24} color={colors.primary[600]} />
            <View style={{ flex: 1 }}>
              <Typography variant="body1" weight="semibold" color="primary">
                דווח על בעיה
              </Typography>
              <Typography variant="caption" color="textSecondary">
                צריך עזרה? שלח לנו הודעה
              </Typography>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Report Issue Modal */}
      <Modal visible={showReportModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReportModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
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

              <Typography variant="h5" weight="bold" align="center" style={{ marginBottom: spacing[4], marginTop: spacing[2] }}>
                דווח על בעיה
              </Typography>

              {/* Category Selection */}
              <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2] }}>
                קטגוריה
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[3] }}>
                <View style={{ flexDirection: getFlexDirection() }}>
                  {reportCategories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setReportCategory(cat)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: reportCategory === cat ? colors.primary[600] : colors.white,
                          borderColor: reportCategory === cat ? colors.primary[600] : colors.gray[300],
                        }
                      ]}
                    >
                      <Typography
                        variant="caption"
                        style={{ color: reportCategory === cat ? colors.white : colors.gray[700] }}
                      >
                        {cat}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Description */}
              <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2] }}>
                תיאור הבעיה
              </Typography>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reportDescription}
                onChangeText={setReportDescription}
                placeholder="תאר את הבעיה בפירוט..."
                placeholderTextColor={colors.gray[400]}
                multiline
                maxLength={500}
              />

              {/* Actions */}
              <View style={{ flexDirection: getFlexDirection(), gap: spacing[2], marginTop: spacing[3] }}>
                <TouchableOpacity
                  onPress={() => setShowReportModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.gray[200],
                    padding: spacing[3],
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" weight="semibold" style={{ color: colors.gray[700] }}>
                    ביטול
                  </Typography>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSubmitReport}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary[600],
                    padding: spacing[3],
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Typography variant="body2" weight="semibold" color="white">
                      שלח
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

