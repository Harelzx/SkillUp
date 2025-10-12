import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingData, LessonType, StudentLevel } from '@/types/booking';
import { Wifi, Home, School } from 'lucide-react-native';

interface BookingStep1Props {
  data: BookingData;
  availableSubjects: string[];
  onChange: (data: Partial<BookingData>) => void;
  errors: Record<string, string>;
}

const LESSON_TYPES: { value: LessonType; label: string; icon: any; description: string }[] = [
  { value: 'online', label: 'אונליין', icon: Wifi, description: 'באמצעות Zoom/Teams' },
  { value: 'student_location', label: 'אצל התלמיד', icon: Home, description: 'המורה יגיע אליך' },
  { value: 'teacher_location', label: 'אצל המורה', icon: School, description: 'תגיע למורה' },
];

const DURATIONS = [45, 60, 90] as const;

const STUDENT_LEVELS: { value: StudentLevel; label: string }[] = [
  { value: 'elementary', label: 'יסודי' },
  { value: 'middle_school', label: 'חטיבה' },
  { value: 'high_school', label: 'תיכון' },
  { value: 'academic', label: 'אקדמיה' },
  { value: 'other', label: 'אחר' },
];

export function BookingStep1({ data, availableSubjects, onChange, errors }: BookingStep1Props) {
  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="h4" weight="bold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          פרטי השיעור
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
          בחירה נכונה של נושא ומשך עוזרת לקבוע מועד מיטבי
        </Typography>
      </View>

      {/* Subject Selection */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          נושא הלימוד <Typography color="error">*</Typography>
        </Typography>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
          {availableSubjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              onPress={() => onChange({ subject })}
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
                borderRadius: 20,
                borderWidth: 1,
                borderColor: data.subject === subject ? colors.primary[600] : colors.gray[300],
                backgroundColor: data.subject === subject ? colors.primary[50] : colors.white,
                marginLeft: spacing[2],
                marginBottom: spacing[2],
              }}
            >
              <Typography
                variant="body2"
                weight={data.subject === subject ? 'semibold' : 'normal'}
                color={data.subject === subject ? 'primary' : 'text'}
              >
                {subject}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
        {errors.subject && (
          <Typography variant="caption" color="error" style={{ marginTop: spacing[1], textAlign: 'right' }}>
            {errors.subject}
          </Typography>
        )}
      </View>

      {/* Lesson Type */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          סוג שיעור <Typography color="error">*</Typography>
        </Typography>
        <View>
          {LESSON_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = data.lessonType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                onPress={() => onChange({ lessonType: type.value })}
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  padding: spacing[3],
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary[600] : colors.gray[300],
                  backgroundColor: isSelected ? colors.primary[50] : colors.white,
                  marginBottom: spacing[2],
                }}
              >
                <Icon size={24} color={isSelected ? colors.primary[600] : colors.gray[600]} style={{ marginRight: spacing[3] }} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Typography variant="body1" weight="semibold">
                    {type.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {type.description}
                  </Typography>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.lessonType && (
          <Typography variant="caption" color="error" style={{ marginTop: spacing[1], textAlign: 'right' }}>
            {errors.lessonType}
          </Typography>
        )}
      </View>

      {/* Duration */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          משך השיעור <Typography color="error">*</Typography>
        </Typography>
        <View style={{ flexDirection: 'row-reverse' }}>
          {DURATIONS.map((duration) => (
            <TouchableOpacity
              key={duration}
              onPress={() => onChange({ duration })}
              style={{
                flex: 1,
                paddingVertical: spacing[3],
                borderRadius: 12,
                borderWidth: 1,
                borderColor: data.duration === duration ? colors.primary[600] : colors.gray[300],
                backgroundColor: data.duration === duration ? colors.primary[50] : colors.white,
                alignItems: 'center',
                marginLeft: spacing[2],
              }}
            >
              <Typography
                variant="h6"
                weight="bold"
                color={data.duration === duration ? 'primary' : 'text'}
              >
                {String(duration)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                דקות
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
        {errors.duration && (
          <Typography variant="caption" color="error" style={{ marginTop: spacing[1], textAlign: 'right' }}>
            {errors.duration}
          </Typography>
        )}
      </View>

      {/* Student Level (Optional) */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          רמת התלמיד (אופציונלי)
        </Typography>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
          {STUDENT_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              onPress={() => onChange({ studentLevel: level.value })}
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[2],
                borderRadius: 20,
                borderWidth: 1,
                borderColor: data.studentLevel === level.value ? colors.primary[600] : colors.gray[300],
                backgroundColor: data.studentLevel === level.value ? colors.primary[50] : colors.white,
                marginLeft: spacing[2],
                marginBottom: spacing[2],
              }}
            >
              <Typography
                variant="body2"
                color={data.studentLevel === level.value ? 'primary' : 'text'}
              >
                {level.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View>
        <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          הערות לתיאום (עד 200 תווים)
        </Typography>
        <TextInput
          value={data.notes || ''}
          onChangeText={(notes) => onChange({ notes })}
          placeholder="למשל: מתקשה בנושא X, צריך דגש על Y..."
          placeholderTextColor={colors.gray[400]}
          multiline
          maxLength={200}
          style={{
            borderWidth: 1,
            borderColor: colors.gray[300],
            borderRadius: 12,
            padding: spacing[3],
            minHeight: 100,
            textAlign: 'right',
            textAlignVertical: 'top',
            fontFamily: 'System',
            fontSize: 16,
            color: colors.gray[900],
          }}
        />
        <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1], textAlign: 'left' }}>
          {(data.notes || '').length}/200
        </Typography>
      </View>
    </ScrollView>
  );
}

