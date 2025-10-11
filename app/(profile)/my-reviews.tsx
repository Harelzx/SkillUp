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
  Star,
  Edit3,
  Trash2,
  Plus,
  X,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

interface Review {
  id: string;
  teacherName: string;
  teacherId: string;
  rating: number;
  text: string;
  date: string;
  canEdit: boolean;
}

interface PendingReview {
  lessonId: string;
  teacherName: string;
  teacherId: string;
  date: string;
}

export default function MyReviewsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      teacherName: 'ד"ר שרה כהן',
      teacherId: '1',
      rating: 5,
      text: 'מורה מעולה! עזרה לי מאוד להבין מתמטיקה.',
      date: '15/01/2024',
      canEdit: true,
    },
  ]);

  const [pendingReviews] = useState<PendingReview[]>([
    { lessonId: '3', teacherName: 'רחל מור', teacherId: '3', date: '10/01/2024' },
  ]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<PendingReview | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWriteReview = (pendingReview: PendingReview) => {
    setSelectedTeacher(pendingReview);
    setRating(0);
    setReviewText('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showToast('אנא בחר דירוג');
      return;
    }
    if (reviewText.trim().length < 10) {
      showToast('אנא כתוב ביקורת של לפחות 10 תווים');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReview: Review = {
        id: Date.now().toString(),
        teacherName: selectedTeacher!.teacherName,
        teacherId: selectedTeacher!.teacherId,
        rating,
        text: reviewText,
        date: new Date().toLocaleDateString('he-IL'),
        canEdit: true,
      };
      
      setReviews([newReview, ...reviews]);
      setShowReviewModal(false);
      showToast('הביקורת נשלחה בהצלחה');
    } catch (error) {
      showToast('אירעה שגיאה בשליחת הביקורת');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <View style={{ flexDirection: getFlexDirection(), gap: spacing[1] }}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setRating(star)}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 32 : 16}
              color={colors.warning[500]}
              fill={star <= currentRating ? colors.warning[500] : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
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
    reviewCard: {
      marginBottom: spacing[3],
    },
    reviewHeader: {
      flexDirection: getFlexDirection(),
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing[2],
    },
    pendingCard: {
      backgroundColor: colors.blue[50],
      borderColor: colors.blue[200],
      marginBottom: spacing[3],
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
      minHeight: 100,
      textAlignVertical: 'top',
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
            הביקורות שלי
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <>
            <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[3] }}>
              ביקורות ממתינות
            </Typography>
            {pendingReviews.map(pending => (
              <Card key={pending.lessonId} style={styles.pendingCard}>
                <CardContent>
                  <View style={{ flexDirection: getFlexDirection(), justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Typography variant="body1" weight="semibold">
                        {pending.teacherName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        שיעור מ-{pending.date}
                      </Typography>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleWriteReview(pending)}
                      style={{
                        backgroundColor: colors.primary[600],
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[2],
                        borderRadius: 8,
                      }}
                    >
                      <Typography variant="caption" weight="semibold" color="white">
                        כתוב ביקורת
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* My Reviews */}
        <Typography variant="h6" weight="semibold" style={{ marginTop: spacing[4], marginBottom: spacing[3] }}>
          הביקורות שכתבתי
        </Typography>
        {reviews.map(review => (
          <Card key={review.id} style={styles.reviewCard}>
            <CardContent>
              <View style={styles.reviewHeader}>
                <View style={{ flex: 1 }}>
                  <Typography variant="body1" weight="semibold">
                    {review.teacherName}
                  </Typography>
                  {renderStars(review.rating)}
                  <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1] }}>
                    {review.date}
                  </Typography>
                </View>
              </View>
              <Typography variant="body2" color="text" style={{ lineHeight: 22 }}>
                {review.text}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </ScrollView>

      {/* Write Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReviewModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
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

              <Typography variant="h5" weight="bold" align="center" style={{ marginBottom: spacing[2], marginTop: spacing[2] }}>
                כתוב ביקורת
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: spacing[4] }}>
                על {selectedTeacher?.teacherName}
              </Typography>

              {/* Rating */}
              <View style={{ alignItems: 'center', marginBottom: spacing[4] }}>
                <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2] }}>
                  דירוג
                </Typography>
                {renderStars(rating, true)}
              </View>

              {/* Review Text */}
              <TextInput
                style={styles.input}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="ספר על החוויה שלך עם המורה..."
                placeholderTextColor={colors.gray[400]}
                multiline
                maxLength={300}
              />
              <Typography variant="caption" color="textSecondary" style={{ textAlign: isRTL ? 'left' : 'right', marginTop: spacing[1] }}>
                {reviewText.length}/300
              </Typography>

              {/* Actions */}
              <View style={{ flexDirection: getFlexDirection(), gap: spacing[2], marginTop: spacing[4] }}>
                <TouchableOpacity
                  onPress={() => setShowReviewModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.gray[200],
                    padding: spacing[3],
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={isSubmitting}
                >
                  <Typography variant="body2" weight="semibold" style={{ color: colors.gray[700] }}>
                    ביטול
                  </Typography>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSubmitReview}
                  style={{
                    flex: 1,
                    backgroundColor: rating > 0 ? colors.primary[600] : colors.gray[300],
                    padding: spacing[3],
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={rating === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Typography variant="body2" weight="semibold" color="white">
                      שלח ביקורת
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

