/**
 * Teacher Profile Editing Screen
 * Allows teachers to edit all profile fields visible to students
 */

import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Camera,
  User,
  DollarSign,
  Globe,
  Home,
  Users,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useAuth } from '@/features/auth/auth-context';
import { getTeacherProfile, updateTeacherProfile, getSubjects, getTeacherSubjects, updateTeacherSubjects } from '@/services/api';

const CITIES = [
  'תל אביב',
  'רמת גן',
  'ירושלים',
  'חיפה',
  'באר שבע',
  'פתח תקווה',
  'נתניה',
  'רעננה',
  'הרצליה',
  'כפר סבא',
  'ראשון לציון',
  'חולון',
  'בת ים',
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

type LessonMode = 'online' | 'at_teacher' | 'at_student';

export default function EditTeacherProfileScreen() {
  const router = useRouter();
  const { isRTL, getFlexDirection } = useRTL();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('150');
  const [location, setLocation] = useState('');
  const [teachingStyle, setTeachingStyle] = useState('');

  // Lesson modes
  const [lessonModes, setLessonModes] = useState<LessonMode[]>(['online']);

  // Duration options
  const [durationOptions, setDurationOptions] = useState<number[]>([45, 60, 90]);

  // Regions
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Subjects
  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id: string; name_he: string }>>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (profile) {
      loadProfile();
    }
  }, [profile]);

  const loadProfile = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Load all subjects
      const allSubjects = await getSubjects();
      setAvailableSubjects(allSubjects);

      // Load teacher profile
      const teacherProfile = await getTeacherProfile(profile.id);
      if (teacherProfile) {
        setDisplayName(teacherProfile.displayName || '');
        setBio(teacherProfile.bio || '');
        setAvatarUrl(teacherProfile.avatarUrl || '');
        setHourlyRate(teacherProfile.hourlyRate?.toString() || '150');
        setLocation(teacherProfile.location || '');
        setTeachingStyle(teacherProfile.teachingStyle || '');
        setLessonModes(teacherProfile.lessonModes || ['online']);
        setDurationOptions(teacherProfile.durationOptions || [45, 60, 90]);
        setSelectedRegions(teacherProfile.regions || []);
      }

      // Load teacher subjects
      const teacherSubjects = await getTeacherSubjects(profile.id);
      setSelectedSubjects(teacherSubjects.map(s => s.id));
    } catch (error: any) {
      console.error('Error loading profile:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'שם מלא הוא שדה חובה';
    }

    const rate = parseFloat(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate <= 0) {
      newErrors.hourlyRate = 'מחיר לשעה חייב להיות מספר חיובי';
    }

    if (lessonModes.length === 0) {
      newErrors.lessonModes = 'יש לבחור לפחות אופן הוראה אחד';
    }

    if (durationOptions.length === 0) {
      newErrors.durationOptions = 'יש לבחור לפחות משך שיעור אחד';
    }

    if (selectedSubjects.length === 0) {
      newErrors.subjects = 'יש לבחור לפחות נושא הוראה אחד';
    }

    if (bio && bio.length > 500) {
      newErrors.bio = 'התיאור ארוך מדי (מקסימום 500 תווים)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e?: any) => {
    // Prevent any form submission or event bubbling
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    if (!validate() || !profile) return;

    console.log('🔵 [edit-teacher-profile] handleSave called');
    console.log('🔵 [edit-teacher-profile] Profile ID:', profile.id);
    console.log('🔵 [edit-teacher-profile] Updates:', {
      displayName,
      bio: bio || undefined,
      avatarUrl: avatarUrl || undefined,
      hourlyRate: parseFloat(hourlyRate),
      lessonModes,
      durationOptions,
      regions: selectedRegions.length > 0 ? selectedRegions : undefined,
      location: location || undefined,
      teachingStyle: teachingStyle || undefined,
    });

    setSaving(true);
    try {
      console.log('🔵 [edit-teacher-profile] Calling updateTeacherProfile...');
      await updateTeacherProfile(profile.id, {
        displayName,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        hourlyRate: parseFloat(hourlyRate),
        lessonModes,
        durationOptions,
        regions: selectedRegions.length > 0 ? selectedRegions : undefined,
        location: location || undefined,
        teachingStyle: teachingStyle || undefined,
      });

      console.log('🔵 [edit-teacher-profile] Calling updateTeacherSubjects...');
      await updateTeacherSubjects(profile.id, selectedSubjects);

      console.log('✅ [edit-teacher-profile] Save completed successfully');
      Alert.alert('הצלחה', 'הפרופיל עודכן בהצלחה', [
        {
          text: 'אישור',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('❌ [edit-teacher-profile] Error saving profile:', error);
      console.error('❌ [edit-teacher-profile] Error message:', error.message);
      console.error('❌ [edit-teacher-profile] Error stack:', error.stack);
      Alert.alert('שגיאה', error.message || 'לא הצלחנו לשמור את השינויים');
    } finally {
      setSaving(false);
    }
  };

  const toggleLessonMode = (mode: LessonMode) => {
    if (lessonModes.includes(mode)) {
      // Don't allow removing the last mode
      if (lessonModes.length === 1) {
        Alert.alert('שגיאה', 'חייב להישאר לפחות אופן הוראה אחד');
        return;
      }
      setLessonModes(lessonModes.filter((m) => m !== mode));
    } else {
      setLessonModes([...lessonModes, mode]);
    }
  };

  const toggleDuration = (duration: number) => {
    if (durationOptions.includes(duration)) {
      // Don't allow removing the last duration
      if (durationOptions.length === 1) {
        Alert.alert('שגיאה', 'חייב להישאר לפחות משך שיעור אחד');
        return;
      }
      setDurationOptions(durationOptions.filter((d) => d !== duration));
    } else {
      setDurationOptions([...durationOptions, duration].sort((a, b) => a - b));
    }
  };

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const toggleSubject = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      // Don't allow removing the last subject
      if (selectedSubjects.length === 1) {
        Alert.alert('שגיאה', 'חייב להישאר לפחות נושא הוראה אחד');
        return;
      }
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
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
      marginBottom: spacing[6],
    },
    sectionTitle: {
      marginBottom: spacing[3],
      paddingHorizontal: spacing[1],
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: spacing[6],
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary[600],
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary[600],
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.white,
    },
    field: {
      marginBottom: spacing[4],
    },
    label: {
      marginBottom: spacing[2],
      paddingHorizontal: spacing[1],
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.gray[300],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      fontSize: 16,
      textAlign: isRTL ? 'right' : 'left',
      minHeight: 48,
    },
    inputError: {
      borderColor: colors.red[500],
    },
    errorText: {
      color: colors.red[600],
      fontSize: 13,
      marginTop: spacing[1],
      paddingHorizontal: spacing[1],
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      textAlign: isRTL ? 'left' : 'right',
      marginTop: spacing[1],
      paddingHorizontal: spacing[1],
    },
    chipGrid: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    chip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.gray[300],
      backgroundColor: colors.white,
    },
    chipSelected: {
      backgroundColor: colors.primary[600],
      borderColor: colors.primary[600],
    },
    lessonModeCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.gray[300],
      padding: spacing[3],
      marginBottom: spacing[2],
    },
    lessonModeCardActive: {
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[300],
    },
    actions: {
      flexDirection: getFlexDirection(),
      gap: spacing[3],
      marginTop: spacing[6],
      marginBottom: spacing[8],
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[2] }}>
            טוען פרופיל...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight
            size={20}
            color={colors.gray[700]}
            style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
          />
          <Typography variant="h5" weight="semibold" style={{ marginHorizontal: spacing[2] }}>
            ערוך פרופיל מורה
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatarImage as any} 
                />
              ) : (
                <User size={40} color={colors.white} />
              )}
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle}>
            מידע בסיסי
          </Typography>

          {/* Display Name */}
          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label}>
              שם מלא <Typography style={{ color: colors.red[500] }}>*</Typography>
            </Typography>
            <TextInput
              style={[styles.input, errors.displayName && styles.inputError]}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) setErrors({ ...errors, displayName: '' });
              }}
              placeholder="שם פרטי ושם משפחה"
              placeholderTextColor={colors.gray[400]}
            />
            {errors.displayName && <Typography style={styles.errorText}>{errors.displayName}</Typography>}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label}>
              תיאור קצר על סגנון ההוראה שלך
            </Typography>
            <TextInput
              style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
              value={bio}
              onChangeText={(text) => {
                setBio(text);
                if (errors.bio && text.length <= 500) setErrors({ ...errors, bio: '' });
              }}
              placeholder="ספר על הניסיון, הגישה שלך, הישגים..."
              placeholderTextColor={colors.gray[400]}
              multiline
              maxLength={500}
            />
            <Typography
              variant="caption"
              color={bio.length > 500 ? 'error' : 'textSecondary'}
              style={styles.charCount}
            >
              {bio.length}/500
            </Typography>
            {errors.bio && <Typography style={styles.errorText}>{errors.bio}</Typography>}
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label}>
              מיקום עיקרי
            </Typography>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="לדוגמה: תל אביב"
              placeholderTextColor={colors.gray[400]}
            />
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle}>
            תמחור
          </Typography>

          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label}>
              מחיר לשעה (₪) <Typography style={{ color: colors.red[500] }}>*</Typography>
            </Typography>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
              <View style={{ position: 'absolute', [isRTL ? 'right' : 'left']: spacing[3], zIndex: 1 }}>
                <DollarSign size={20} color={colors.gray[500]} />
              </View>
              <TextInput
                style={[
                  styles.input,
                  { [isRTL ? 'paddingRight' : 'paddingLeft']: spacing[8] },
                  errors.hourlyRate && styles.inputError,
                ]}
                value={hourlyRate}
                onChangeText={(text) => {
                  setHourlyRate(text);
                  if (errors.hourlyRate) setErrors({ ...errors, hourlyRate: '' });
                }}
                placeholder="150"
                placeholderTextColor={colors.gray[400]}
                keyboardType="numeric"
              />
            </View>
            {errors.hourlyRate && <Typography style={styles.errorText}>{errors.hourlyRate}</Typography>}
          </View>
        </View>

        {/* Subjects Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle}>
            נושאי הוראה <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ textAlign: 'right', marginBottom: spacing[3] }}>
            בחר את הנושאים שאתה מלמד. תלמידים יוכלו לבחור מבין הנושאים שתבחר.
          </Typography>

          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing[2] }}>
            {availableSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                onPress={() => {
                  toggleSubject(subject.id);
                  if (errors.subjects) setErrors({ ...errors, subjects: '' });
                }}
                style={{
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: selectedSubjects.includes(subject.id) ? colors.primary[600] : colors.gray[300],
                  backgroundColor: selectedSubjects.includes(subject.id) ? colors.primary[50] : colors.white,
                }}
              >
                <Typography
                  variant="body2"
                  weight={selectedSubjects.includes(subject.id) ? 'semibold' : 'normal'}
                  color={selectedSubjects.includes(subject.id) ? 'primary' : 'textPrimary'}
                >
                  {subject.name_he}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {errors.subjects && (
            <Typography style={styles.errorText}>{errors.subjects}</Typography>
          )}
        </View>

        {/* Lesson Modes Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle}>
            אופני הוראה <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>

          <View style={styles.lessonModeCard}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[2] }}>
              <Globe size={20} color={colors.primary[600]} />
              <View>
                <Typography variant="body2" weight="semibold">
                  שיעור מקוון
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  באמצעות Zoom / Skype
                </Typography>
              </View>
            </View>
            <Switch
              value={lessonModes.includes('online')}
              onValueChange={() => toggleLessonMode('online')}
              trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
              thumbColor={lessonModes.includes('online') ? colors.primary[600] : colors.gray[50]}
            />
          </View>

          <View style={styles.lessonModeCard}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[2] }}>
              <Home size={20} color={colors.primary[600]} />
              <View>
                <Typography variant="body2" weight="semibold">
                  בבית המורה
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  התלמיד מגיע אליך
                </Typography>
              </View>
            </View>
            <Switch
              value={lessonModes.includes('at_teacher')}
              onValueChange={() => toggleLessonMode('at_teacher')}
              trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
              thumbColor={lessonModes.includes('at_teacher') ? colors.primary[600] : colors.gray[50]}
            />
          </View>

          <View style={styles.lessonModeCard}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[2] }}>
              <Users size={20} color={colors.primary[600]} />
              <View>
                <Typography variant="body2" weight="semibold">
                  בבית התלמיד
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  אתה מגיע לבית התלמיד
                </Typography>
              </View>
            </View>
            <Switch
              value={lessonModes.includes('at_student')}
              onValueChange={() => toggleLessonMode('at_student')}
              trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
              thumbColor={lessonModes.includes('at_student') ? colors.primary[600] : colors.gray[50]}
            />
          </View>

          {errors.lessonModes && <Typography style={styles.errorText}>{errors.lessonModes}</Typography>}
        </View>

        {/* Duration Options Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle}>
            משכי שיעור מותרים <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[2], paddingHorizontal: spacing[1] }}>
            בחר את משכי השיעורים שאתה מציע
          </Typography>

          <View style={styles.chipGrid}>
            {DURATION_OPTIONS.map((duration) => (
              <TouchableOpacity
                key={duration}
                onPress={() => toggleDuration(duration)}
                style={[styles.chip, durationOptions.includes(duration) && styles.chipSelected]}
              >
                <Typography
                  variant="body2"
                  style={{
                    color: durationOptions.includes(duration) ? colors.white : colors.gray[700],
                  }}
                >
                  {duration} דקות
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {errors.durationOptions && <Typography style={styles.errorText}>{errors.durationOptions}</Typography>}
        </View>

        {/* Regions Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle}>
            אזורי הוראה
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[2], paddingHorizontal: spacing[1] }}>
            רלוונטי לשיעורים פרונטליים
          </Typography>

          <View style={styles.chipGrid}>
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => toggleRegion(city)}
                style={[styles.chip, selectedRegions.includes(city) && styles.chipSelected]}
              >
                <Typography
                  variant="body2"
                  style={{
                    color: selectedRegions.includes(city) ? colors.white : colors.gray[700],
                  }}
                >
                  {city}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flex: 1,
              backgroundColor: colors.gray[200],
              paddingVertical: spacing[3],
              borderRadius: 12,
              alignItems: 'center',
              minHeight: 48,
            }}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Typography variant="body1" weight="semibold" style={{ color: colors.gray[700] }}>
              ביטול
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              console.log('🔵 [edit-teacher-profile] Save button pressed');
              handleSave(e);
            }}
            style={{
              flex: 1,
              backgroundColor: saving ? colors.primary[400] : colors.primary[600],
              paddingVertical: spacing[3],
              borderRadius: 12,
              alignItems: 'center',
              minHeight: 48,
            }}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Typography variant="body1" weight="semibold" style={{ color: colors.white }}>
                שמור שינויים
              </Typography>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

