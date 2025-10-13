import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Flag, X } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';

interface ReviewCardProps {
  id: string;
  studentName: string;
  date: string;
  rating: number;
  review: string;
  tags?: string[];
  onReport: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  studentName, 
  date, 
  rating, 
  review, 
  tags = [],
  onReport 
}) => {
  const { isRTL } = useRTL();
  
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[2],
        }}
      >
        <View>
          <Typography variant="body1" weight="semibold">
            {studentName}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {date}
          </Typography>
        </View>
        
        {/* Stars */}
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            gap: 4,
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              color={star <= rating ? colors.warning[500] : colors.gray[300]}
              fill={star <= rating ? colors.warning[500] : 'transparent'}
            />
          ))}
        </View>
      </View>
      
      {/* Review Text */}
      <Typography
        variant="body2"
        color="textSecondary"
        style={{ marginBottom: spacing[3], lineHeight: 20 }}
        numberOfLines={4}
      >
        {review}
      </Typography>
      
      {/* Tags */}
      {tags.length > 0 && (
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          {tags.map((tag, index) => (
            <View
              key={index}
              style={{
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
                backgroundColor: colors.primary[50],
                borderRadius: 6,
              }}
            >
              <Typography variant="caption" style={{ color: colors.primary[700] }}>
                {tag}
              </Typography>
            </View>
          ))}
        </View>
      )}
      
      {/* Report Button */}
      <TouchableOpacity
        onPress={onReport}
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing[1],
          alignSelf: isRTL ? 'flex-end' : 'flex-start',
          paddingVertical: spacing[1],
          minHeight: 44,
          justifyContent: 'center',
        }}
        activeOpacity={0.7}
      >
        <Flag size={16} color={colors.error[600]} />
        <Typography variant="caption" style={{ color: colors.error[600] }}>
          דווח על ביקורת
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reviewId: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, reviewId }) => {
  const { isRTL } = useRTL();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  
  const reportReasons = [
    'תוכן פוגעני או בוטה',
    'ביקורת לא אמיתית',
    'ספאם או פרסומת',
    'מידע כוזב',
    'הטרדה',
    'אחר',
  ];
  
  const handleSubmit = () => {
    if (!selectedReason) {
      alert('נא לבחור סיבה לדיווח');
      return;
    }
    alert(`דיווח נשלח בהצלחה (דמה)\nביקורת: ${reviewId}\nסיבה: ${selectedReason}`);
    setSelectedReason(null);
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: spacing[4],
            width: '100%',
            maxWidth: 400,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[4],
            }}
          >
            <Typography variant="h4" weight="bold">
              דווח על ביקורת
            </Typography>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <X size={20} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          
          {/* Reasons */}
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3] }}>
            בחר סיבה לדיווח:
          </Typography>
          
          <View style={{ marginBottom: spacing[4] }}>
            {reportReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedReason(reason)}
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[3],
                  borderWidth: 1,
                  borderColor: selectedReason === reason ? colors.primary[600] : colors.gray[200],
                  borderRadius: 10,
                  marginBottom: spacing[2],
                  backgroundColor: selectedReason === reason ? colors.primary[50] : colors.white,
                  minHeight: 48,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedReason === reason ? colors.primary[600] : colors.gray[300],
                    marginRight: isRTL ? 0 : spacing[2],
                    marginLeft: isRTL ? spacing[2] : 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {selectedReason === reason && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.primary[600],
                      }}
                    />
                  )}
                </View>
                <Typography variant="body2">
                  {reason}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Actions */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: spacing[2],
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: spacing[3],
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.gray[300],
                backgroundColor: colors.white,
                minHeight: 48,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Typography variant="body1" weight="medium">
                ביטול
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                flex: 1,
                paddingVertical: spacing[3],
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: colors.error[600],
                minHeight: 48,
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Typography variant="body1" weight="bold" style={{ color: colors.white }}>
                שלח דיווח
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function TeacherReviewsScreen() {
  const { isRTL, direction } = useRTL();
  
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  
  const reviews = [
    {
      id: '1',
      studentName: 'דני כהן',
      date: 'לפני שבוע',
      rating: 5,
      review: 'מורה מצוין! הסביר בצורה ברורה וסבלנית. הצלחתי לשפר את הציונים שלי במתמטיקה בזכותו. ממליץ בחום!',
      tags: ['מקצועי', 'סבלני', 'ברור'],
    },
    {
      id: '2',
      studentName: 'שרה לוי',
      date: 'לפני שבועיים',
      rating: 4,
      review: 'שיעורים טובים ואפקטיביים. היה נחמד אם היו יותר דוגמאות מעשיות, אבל בסך הכל מרוצה מאוד.',
      tags: ['אפקטיבי', 'ידע רב'],
    },
    {
      id: '3',
      studentName: 'יוסי אברהם',
      date: 'לפני 3 שבועות',
      rating: 5,
      review: 'המורה הכי טוב שהיה לי! תמיד זמין לעזרה ומסביר עד שמבינים לגמרי. שווה כל שקל!',
      tags: ['זמין', 'מסור', 'מומלץ'],
    },
    {
      id: '4',
      studentName: 'מיכל זהבי',
      date: 'לפני חודש',
      rating: 5,
      review: 'שיעורים מעולים עם הרבה סבלנות והבנה. עזר לי מאוד להתכונן לבחינה הגדולה.',
      tags: ['סבלני', 'מקצועי'],
    },
  ];
  
  const handleReport = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setReportModalVisible(true);
  };
  
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
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
          ביקורות
        </Typography>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
      >
        {/* Rating Summary */}
        <View
          style={{
            backgroundColor: colors.white,
            marginHorizontal: spacing[4],
            marginTop: spacing[4],
            borderRadius: 14,
            padding: spacing[4],
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography variant="h1" weight="bold" style={{ color: colors.primary[600] }}>
            {averageRating.toFixed(1)}
          </Typography>
          
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 4,
              marginTop: spacing[2],
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                color={star <= Math.round(averageRating) ? colors.warning[500] : colors.gray[300]}
                fill={star <= Math.round(averageRating) ? colors.warning[500] : 'transparent'}
              />
            ))}
          </View>
          
          <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[1] }}>
            מבוסס על {reviews.length} ביקורות
          </Typography>
        </View>
        
        {/* Reviews List */}
        <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[4] }}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                studentName={review.studentName}
                date={review.date}
                rating={review.rating}
                review={review.review}
                tags={review.tags}
                onReport={() => handleReport(review.id)}
              />
            ))
          ) : (
            <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.gray[100],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing[3],
                }}
              >
                <Star size={32} color={colors.gray[400]} />
              </View>
              <Typography variant="h4" weight="semibold" align="center">
                אין ביקורות עדיין
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                align="center"
                style={{ marginTop: spacing[2], maxWidth: 280 }}
              >
                הביקורות של התלמידים שלך יופיעו כאן
              </Typography>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Report Modal */}
      {selectedReviewId && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => {
            setReportModalVisible(false);
            setSelectedReviewId(null);
          }}
          reviewId={selectedReviewId}
        />
      )}
    </SafeAreaView>
  );
}

