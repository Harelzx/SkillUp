import { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingData } from '@/types/booking';
import { Calendar, Clock, MapPin, BookOpen, User, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react-native';

interface BookingStep4Props {
  data: BookingData;
  teacherName: string;
  onChange: (data: Partial<BookingData>) => void;
  errors: Record<string, string>;
}

const LESSON_TYPE_LABELS = {
  online: 'אונליין',
  student_location: 'בבית התלמיד',
  teacher_location: 'בבית המורה',
};

export function BookingStep4({ data, teacherName, onChange, errors }: BookingStep4Props) {
  const [showImportantInfo, setShowImportantInfo] = useState(false);

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="h4" weight="bold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          סיכום הזמנה
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
          בדוק שכל הפרטים נכונים לפני המעבר לתשלום
        </Typography>
      </View>

      {/* Booking Summary Card */}
      <View style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.gray[200],
        padding: spacing[4],
        marginBottom: spacing[4],
      }}>
        {/* Teacher */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[3] }}>
          <User size={20} color={colors.gray[600]} style={{ marginLeft: spacing[2] }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Typography variant="caption" color="textSecondary">
              מורה
            </Typography>
            <Typography variant="body1" weight="semibold">
              {teacherName}
            </Typography>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.gray[200], marginBottom: spacing[3] }} />

        {/* Subject */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[3] }}>
          <BookOpen size={20} color={colors.gray[600]} style={{ marginLeft: spacing[2] }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Typography variant="caption" color="textSecondary">
              נושא
            </Typography>
            <Typography variant="body1" weight="semibold">
              {data.subject}
            </Typography>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.gray[200], marginBottom: spacing[3] }} />

        {/* Date & Time */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[3] }}>
          <Calendar size={20} color={colors.gray[600]} style={{ marginLeft: spacing[2] }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Typography variant="caption" color="textSecondary">
              מועד
            </Typography>
            <Typography variant="body1" weight="semibold">
              {data.date?.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
            {data.timeSlot && (
              <Typography variant="body2" color="textSecondary">
                {typeof data.timeSlot === 'string' ? data.timeSlot : 'זמן לא נבחר'}
              </Typography>
            )}
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.gray[200], marginBottom: spacing[3] }} />

        {/* Duration */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[3] }}>
          <Clock size={20} color={colors.gray[600]} style={{ marginLeft: spacing[2] }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Typography variant="caption" color="textSecondary">
              משך
            </Typography>
            <Typography variant="body1" weight="semibold">
              {data.duration} דקות
            </Typography>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.gray[200], marginBottom: spacing[3] }} />

        {/* Location/Type */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <MapPin size={20} color={colors.gray[600]} style={{ marginLeft: spacing[2] }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Typography variant="caption" color="textSecondary">
              מיקום
            </Typography>
            <Typography variant="body1" weight="semibold">
              {LESSON_TYPE_LABELS[data.lessonType]}
            </Typography>
            {data.address && (
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 2 }}>
                {data.address}
              </Typography>
            )}
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <>
            <View style={{ height: 1, backgroundColor: colors.gray[200], marginVertical: spacing[3] }} />
            <View>
              <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[1], textAlign: 'right' }}>
                הערות
              </Typography>
              <Typography variant="body2" style={{ textAlign: 'right', lineHeight: 22 }}>
                {data.notes}
              </Typography>
            </View>
          </>
        )}
      </View>

      {/* Important Info - Expandable */}
      <TouchableOpacity
        onPress={() => setShowImportantInfo(!showImportantInfo)}
        style={{
          width: '100%',
          backgroundColor: colors.blue[50],
          borderRadius: 12,
          padding: spacing[4],
          borderWidth: 1,
          borderColor: colors.blue[200],
          marginBottom: spacing[4],
        }}
      >
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" weight="semibold" style={{ color: colors.blue[900] }}>
            💡 חשוב לדעת
          </Typography>
          {showImportantInfo ? (
            <ChevronUp size={20} color={colors.blue[600]} />
          ) : (
            <ChevronDown size={20} color={colors.blue[600]} />
          )}
        </View>

        {showImportantInfo && (
          <View style={{ marginTop: spacing[3] }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: spacing[2] }}>
              <Typography variant="body2" style={{ marginLeft: spacing[2] }}>•</Typography>
              <Typography variant="body2" style={{ flex: 1, textAlign: 'right', lineHeight: 22, color: colors.blue[900] }}>
                תקבל אישור והודעת תזכורת ב-SMS ובמייל
              </Typography>
            </View>
            
            <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: spacing[2] }}>
              <Typography variant="body2" style={{ marginLeft: spacing[2] }}>•</Typography>
              <Typography variant="body2" style={{ flex: 1, textAlign: 'right', lineHeight: 22, color: colors.blue[900] }}>
                ביטול בחינם עד 24 שעות לפני השיעור
              </Typography>
            </View>
            
            <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
              <Typography variant="body2" style={{ marginLeft: spacing[2] }}>•</Typography>
              <Typography variant="body2" style={{ flex: 1, textAlign: 'right', lineHeight: 22, color: colors.blue[900] }}>
                פרטי התשלום מאובטחים ומוצפנים
              </Typography>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Terms Agreement */}
      <View style={{ width: '100%', marginBottom: spacing[2] }}>
        <TouchableOpacity
          onPress={() => onChange({ agreedToTerms: !data.agreedToTerms })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: data.agreedToTerms }}
          accessibilityLabel="קראתי ואישרתי את תנאי השימוש ומדיניות הפרטיות"
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'flex-start',
            padding: spacing[4],
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: errors.agreedToTerms ? colors.error[500] : (data.agreedToTerms ? colors.primary[600] : colors.gray[200]),
            minHeight: 72,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: data.agreedToTerms ? colors.primary[600] : colors.gray[300],
              backgroundColor: data.agreedToTerms ? colors.primary[600] : colors.white,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: spacing[3],
            }}
          >
            {data.agreedToTerms && (
              <CheckCircle2 size={18} color={colors.white} strokeWidth={3} />
            )}
          </View>
          
          <View style={{ flex: 1 }}>
            <Typography variant="body2" style={{ textAlign: 'right', lineHeight: 24 }}>
              קראתי ואישרתי את{' '}
              <Typography variant="body2" color="primary" weight="semibold">
                תנאי השימוש
              </Typography>
              {' '}ו
              <Typography variant="body2" color="primary" weight="semibold">
                מדיניות הפרטיות
              </Typography>
              {' '}של SkillUp
            </Typography>
          </View>
        </TouchableOpacity>

        {errors.agreedToTerms && (
          <View style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            marginTop: spacing[2],
            padding: spacing[2],
            backgroundColor: colors.error[50],
            borderRadius: 8,
          }}>
            <AlertCircle size={16} color={colors.error[600]} style={{ marginLeft: spacing[2] }} />
            <Typography variant="caption" style={{ color: colors.error[700] }}>
              {errors.agreedToTerms}
            </Typography>
          </View>
        )}
      </View>

      {/* Security Badge */}
      <View style={{
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[2],
        backgroundColor: colors.gray[50],
        borderRadius: 8,
        width: '100%',
      }}>
        <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
          🔒 תשלום מאובטח ומוצפן
        </Typography>
      </View>
    </ScrollView>
  );
}

