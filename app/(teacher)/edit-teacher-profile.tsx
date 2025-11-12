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
import {
  getTeacherProfile,
  updateTeacherProfile,
  getSubjects,
  getTeacherSubjects,
  updateTeacherSubjects,
  getTeacherSubjectExperience,
  updateTeacherSubjectExperience,
  getLanguages,
  getLessonDurations,
} from '@/services/api';
import { getRegions, getCitiesByRegion } from '@/services/api/regionsAPI';
import type { Region, City } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

type LessonMode = 'online' | 'at_teacher' | 'at_student';

export default function EditTeacherProfileScreen() {
  const router = useRouter();
  const { isRTL, getFlexDirection, getTextAlign } = useRTL();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('150');
  const [teachingStyle, setTeachingStyle] = useState('');

  // Education, languages, experience
  const [education, setEducation] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [subjectExperience, setSubjectExperience] = useState<{ [subjectId: string]: string }>({});
  const [newEducation, setNewEducation] = useState('');

  // Lesson modes
  const [lessonModes, setLessonModes] = useState<LessonMode[]>(['online']);

  // Duration options
  const [durationOptions, setDurationOptions] = useState<number[]>([45, 60, 90]);

  // Regions and Cities
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

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
      // Load regions
      const regionsResponse = await getRegions();
      if (regionsResponse.success) {
        setRegions(regionsResponse.regions);
      }

      // Load all subjects
      const allSubjects = await getSubjects();
      setAvailableSubjects(allSubjects);

      // Load teacher profile
      const teacherProfile = await getTeacherProfile(profile.id);
      console.log('📥 [edit-teacher-profile] Loaded teacher profile:', JSON.stringify(teacherProfile, null, 2));

      if (teacherProfile) {
        const profileData = teacherProfile as any;

        setDisplayName(teacherProfile.displayName || '');
        setBio(teacherProfile.bio || '');
        setAvatarUrl(teacherProfile.avatarUrl || '');
        setHourlyRate(teacherProfile.hourlyRate?.toString() || '150');
        setTeachingStyle(teacherProfile.teachingStyle || '');
        setLessonModes(teacherProfile.lessonModes || ['online']);
        setDurationOptions(teacherProfile.durationOptions || [45, 60, 90]);

        // Load education, languages, experience
        console.log('📥 [edit-teacher-profile] Setting education to:', profileData.education);
        console.log('📥 [edit-teacher-profile] Setting languages to:', profileData.languages);
        setEducation(profileData.education || []);
        setLanguages(profileData.languages || []);

        // Set region_id and city_id from profile (new structure)
        // Note: teacherProfile might have region_id and city_id if migrations ran
        if (profileData.region_id) {
          setSelectedRegionId(profileData.region_id);
          // Load cities for this region BEFORE setting the selected city
          const citiesResponse = await getCitiesByRegion(profileData.region_id);
          if (citiesResponse.success) {
            setCities(citiesResponse.cities);
            // Now set the selected city after cities are loaded
            if (profileData.city_id) {
              setSelectedCityId(profileData.city_id);
            }
          }
        }
      }

      // Load teacher subjects
      const teacherSubjects = await getTeacherSubjects(profile.id);
      const subjectIds = teacherSubjects.map(s => s.id);
      setSelectedSubjects(subjectIds);

      // Load per-subject experience from the new API
      try {
        const subjectExperienceData = await getTeacherSubjectExperience(profile.id);

        // Convert numeric values to strings for the form
        const experienceStrings: { [key: string]: string } = {};
        Object.entries(subjectExperienceData).forEach(([subjectId, years]) => {
          experienceStrings[subjectId] = years.toString();
        });

        setSubjectExperience(experienceStrings);

        // If no per-subject data exists yet, initialize with general experience_years
        if (Object.keys(experienceStrings).length === 0 && teacherProfile && (teacherProfile as any).experience_years && subjectIds.length > 0) {
          const initialExperience: { [key: string]: string } = {};
          const experienceYears = (teacherProfile as any).experience_years.toString();
          subjectIds.forEach(id => {
            initialExperience[id] = experienceYears;
          });
          setSubjectExperience(initialExperience);
        }
      } catch (error) {
        console.error('Error loading subject experience:', error);
        // Fallback to general experience_years if the new API fails
        if (teacherProfile && (teacherProfile as any).experience_years && subjectIds.length > 0) {
          const initialExperience: { [key: string]: string } = {};
          const experienceYears = (teacherProfile as any).experience_years.toString();
          subjectIds.forEach(id => {
            initialExperience[id] = experienceYears;
          });
          setSubjectExperience(initialExperience);
        }
      }
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

    // Calculate average experience years from per-subject experience
    const experienceValues = Object.values(subjectExperience)
      .map(val => parseInt(val))
      .filter(val => !isNaN(val) && val > 0);

    const averageExperience = experienceValues.length > 0
      ? Math.round(experienceValues.reduce((sum, val) => sum + val, 0) / experienceValues.length)
      : undefined;

    console.log('🔵 [edit-teacher-profile] handleSave called');
    console.log('🔵 [edit-teacher-profile] Profile ID:', profile.id);
    console.log('🔵 [edit-teacher-profile] Education state:', education);
    console.log('🔵 [edit-teacher-profile] Languages state:', languages);
    console.log('🔵 [edit-teacher-profile] Updates:', {
      displayName,
      bio: bio || undefined,
      avatarUrl: avatarUrl || undefined,
      hourlyRate: parseFloat(hourlyRate),
      lessonModes,
      durationOptions,
      regionId: selectedRegionId || undefined,
      cityId: selectedCityId || undefined,
      teachingStyle: teachingStyle || undefined,
      education: education.length > 0 ? education : undefined,
      languages: languages.length > 0 ? languages : undefined,
      experienceYears: averageExperience,
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
        regionId: selectedRegionId || undefined,
        cityId: selectedCityId || undefined,
        teachingStyle: teachingStyle || undefined,
        education: education.length > 0 ? education : undefined,
        languages: languages.length > 0 ? languages : undefined,
        experienceYears: averageExperience,
      });

      console.log('🔵 [edit-teacher-profile] Calling updateTeacherSubjects...');
      await updateTeacherSubjects(profile.id, selectedSubjects);

      // Save per-subject experience
      console.log('🔵 [edit-teacher-profile] Calling updateTeacherSubjectExperience...');
      const subjectExperienceNumbers: { [key: string]: number } = {};
      Object.entries(subjectExperience).forEach(([subjectId, yearsStr]) => {
        const years = parseInt(yearsStr);
        if (!isNaN(years) && years > 0) {
          subjectExperienceNumbers[subjectId] = years;
        }
      });
      await updateTeacherSubjectExperience(profile.id, subjectExperienceNumbers);

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

  const addEducation = (item: string) => {
    if (item.trim()) {
      setEducation([...education, item.trim()]);
    }
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Fetch static data from database
  const { data: languagesData = [], isLoading: loadingLanguages } = useQuery({
    queryKey: ['languages', true], // true = only common languages
    queryFn: () => getLanguages(true),
  });

  const { data: durationsData = [], isLoading: loadingDurations } = useQuery({
    queryKey: ['lesson-durations'],
    queryFn: () => getLessonDurations(false), // false = all durations
  });

  // Convert to arrays for display
  const commonLanguages = languagesData.map(lang => lang.name_he);
  const DURATION_OPTIONS = durationsData.map(d => d.duration_minutes);

  const toggleLanguage = (language: string) => {
    if (languages.includes(language)) {
      setLanguages(languages.filter((l) => l !== language));
    } else {
      setLanguages([...languages, language]);
    }
  };

  const handleRegionChange = async (regionId: string) => {
    setSelectedRegionId(regionId);
    setSelectedCityId(null); // Reset city when region changes
    setCities([]); // Clear previous cities

    // Load cities for the selected region
    try {
      const citiesResponse = await getCitiesByRegion(regionId);
      if (citiesResponse.success) {
        setCities(citiesResponse.cities);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
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
      // Remove experience for this subject
      setSubjectExperience(prev => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
      // Initialize experience for new subject (empty or use average of existing)
      const existingValues = Object.values(subjectExperience).filter(v => v);
      const defaultValue = existingValues.length > 0
        ? existingValues[0] // Use first existing value as default
        : ''; // Or empty
      setSubjectExperience(prev => ({
        ...prev,
        [subjectId]: defaultValue
      }));
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
      flexDirection: getFlexDirection('row-reverse'),
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
      [isRTL ? 'right' : 'left']: 0,
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
      textAlign: getTextAlign('right'),
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
      textAlign: isRTL ? 'right' : 'left',
      marginTop: spacing[1],
      paddingHorizontal: spacing[1],
    },
    chipGrid: {
      flexDirection: getFlexDirection('row-reverse'),
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
      flexDirection: getFlexDirection('row-reverse'),
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
      flexDirection: getFlexDirection('row-reverse'),
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
          <Typography variant="h5" weight="semibold" style={{ marginHorizontal: spacing[2] }} align={getTextAlign('right')}>
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
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            מידע בסיסי
          </Typography>

          {/* Display Name */}
          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label} align={getTextAlign('right')}>
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
            {errors.displayName && <Typography style={styles.errorText} align={getTextAlign('right')}>{errors.displayName}</Typography>}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label} align={getTextAlign('right')}>
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
            {errors.bio && <Typography style={styles.errorText} align={getTextAlign('right')}>{errors.bio}</Typography>}
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            תמחור
          </Typography>

          <View style={styles.field}>
            <Typography variant="body2" weight="semibold" style={styles.label} align={getTextAlign('right')}>
              מחיר לשעה (₪) <Typography style={{ color: colors.red[500] }}>*</Typography>
            </Typography>
            <View style={{ flexDirection: getFlexDirection('row-reverse'), alignItems: 'center' }}>
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
            {errors.hourlyRate && <Typography style={styles.errorText} align={getTextAlign('right')}>{errors.hourlyRate}</Typography>}
          </View>
        </View>

        {/* Subjects Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            נושאי הוראה <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[3] }} align={getTextAlign('right')}>
            בחר את הנושאים שאתה מלמד. תלמידים יוכלו לבחור מבין הנושאים שתבחר.
          </Typography>

          <View style={{ flexDirection: getFlexDirection('row-reverse'), flexWrap: 'wrap', gap: spacing[2] }}>
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
                  align={getTextAlign('right')}
                >
                  {subject.name_he}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {errors.subjects && (
            <Typography style={styles.errorText} align={getTextAlign('right')}>{errors.subjects}</Typography>
          )}
        </View>

        {/* Lesson Modes Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            אופני הוראה <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>

          <View style={styles.lessonModeCard}>
            <View style={{ flexDirection: getFlexDirection('row-reverse'), alignItems: 'center', gap: spacing[2] }}>
              <Globe size={20} color={colors.primary[600]} />
              <View>
                <Typography variant="body2" weight="semibold" align={getTextAlign('right')}>
                  שיעור מקוון
                </Typography>
                <Typography variant="caption" color="textSecondary" align={getTextAlign('right')}>
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
            <View style={{ flexDirection: getFlexDirection('row-reverse'), alignItems: 'center', gap: spacing[2] }}>
              <Home size={20} color={colors.primary[600]} />
              <View>
                <Typography variant="body2" weight="semibold" align={getTextAlign('right')}>
                  בבית המורה
                </Typography>
                <Typography variant="caption" color="textSecondary" align={getTextAlign('right')}>
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
            <View style={{ flexDirection: getFlexDirection('row-reverse'), alignItems: 'center', gap: spacing[2] }}>
              <Users size={20} color={colors.primary[600]} />
              <View>
                <Typography variant="body2" weight="semibold" align={getTextAlign('right')}>
                  בבית התלמיד
                </Typography>
                <Typography variant="caption" color="textSecondary" align={getTextAlign('right')}>
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

          {errors.lessonModes && <Typography style={styles.errorText} align={getTextAlign('right')}>{errors.lessonModes}</Typography>}
        </View>

        {/* Duration Options Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            משכי שיעור מותרים <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[2], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
            בחר את משכי השיעורים שאתה מציע
          </Typography>

          {loadingDurations ? (
            <View style={{ padding: spacing[4], alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : (
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
                    align={getTextAlign('right')}
                  >
                    {duration} דקות
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {errors.durationOptions && <Typography style={styles.errorText} align={getTextAlign('right')}>{errors.durationOptions}</Typography>}
        </View>

        {/* Per-Subject Experience Years Section */}
        {selectedSubjects.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
              שנות ניסיון בהוראה
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[3], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
              כמה שנים אתה מלמד כל נושא?
            </Typography>
            {selectedSubjects.map((subjectId) => {
              const subject = availableSubjects.find(s => s.id === subjectId);
              if (!subject) return null;
              return (
                <View key={subjectId} style={{ marginBottom: spacing[3] }}>
                  <View style={{ flexDirection: getFlexDirection('row-reverse'), alignItems: 'center', gap: spacing[3] }}>
                    <Typography variant="body2" style={{ flex: 1 }} align={getTextAlign('right')}>
                      {subject.name_he}:
                    </Typography>
                    <View style={{ width: 100 }}>
                      <TextInput
                        style={styles.input}
                        value={subjectExperience[subjectId] || ''}
                        onChangeText={(text) => setSubjectExperience(prev => ({
                          ...prev,
                          [subjectId]: text
                        }))}
                        placeholder="0"
                        placeholderTextColor={colors.gray[400]}
                        keyboardType="numeric"
                      />
                    </View>
                    <Typography variant="body2" color="textSecondary">שנים</Typography>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Education Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            השכלה והכשרות
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[2], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
            תואר, קורסים, הסמכות
          </Typography>
          <View style={{ flexDirection: getFlexDirection('row-reverse'), gap: spacing[2], marginBottom: spacing[2] }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newEducation}
              onChangeText={setNewEducation}
              placeholder='לדוגמה: "B.Sc במדעי המחשב"'
              placeholderTextColor={colors.gray[400]}
              onSubmitEditing={() => {
                addEducation(newEducation);
                setNewEducation('');
              }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary[600],
                paddingHorizontal: spacing[4],
                borderRadius: 12,
                justifyContent: 'center',
                minHeight: 56,
              }}
              onPress={() => {
                addEducation(newEducation);
                setNewEducation('');
              }}
            >
              <Typography variant="body1" weight="semibold" style={{ color: colors.white }}>הוסף</Typography>
            </TouchableOpacity>
          </View>
          {education.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: getFlexDirection('row-reverse'),
                alignItems: 'center',
                backgroundColor: colors.primary[50],
                padding: spacing[3],
                borderRadius: 8,
                marginBottom: spacing[2],
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2" style={{ flex: 1 }} align={getTextAlign('right')}>✓ {item}</Typography>
              <TouchableOpacity onPress={() => removeEducation(index)}>
                <Typography variant="body1" style={{ color: colors.red[500], paddingHorizontal: spacing[2] }}>×</Typography>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Languages Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            שפות
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[2], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
            באילו שפות אתה יכול ללמד?
          </Typography>
          {loadingLanguages ? (
            <View style={{ padding: spacing[4], alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {commonLanguages.map((language) => (
                <TouchableOpacity
                  key={language}
                  onPress={() => toggleLanguage(language)}
                  style={[styles.chip, languages.includes(language) && styles.chipSelected]}
                >
                  <Typography
                    variant="body2"
              style={{
                color: languages.includes(language) ? colors.white : colors.gray[700],
              }}
              align={getTextAlign('right')}
            >
              {language}
            </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Region & City Section */}
        <View style={styles.section}>
          <Typography variant="h6" weight="bold" style={styles.sectionTitle} align={getTextAlign('right')}>
            אזור ועיר
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[2], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
            רלוונטי לשיעורים פרונטליים - בחר אזור ולאחר מכן עיר
          </Typography>

          {/* Regions */}
          <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[1], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
            אזור:
          </Typography>
          <View style={styles.chipGrid}>
            {regions.map((region) => (
              <TouchableOpacity
                key={region.id}
                onPress={() => handleRegionChange(region.id)}
                style={[styles.chip, selectedRegionId === region.id && styles.chipSelected]}
              >
                <Typography
                  variant="body2"
                  style={{
                    color: selectedRegionId === region.id ? colors.white : colors.gray[700],
                  }}
                  align={getTextAlign('right')}
                >
                  {region.name_he}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cities - only show if region is selected */}
          {selectedRegionId && cities.length > 0 && (
            <>
              <Typography variant="body2" weight="semibold" style={{ marginTop: spacing[3], marginBottom: spacing[1], paddingHorizontal: spacing[1] }} align={getTextAlign('right')}>
                עיר:
              </Typography>
              <View style={styles.chipGrid}>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    onPress={() => setSelectedCityId(city.id)}
                    style={[styles.chip, selectedCityId === city.id && styles.chipSelected]}
                  >
                    <Typography
                      variant="body2"
                      style={{
                        color: selectedCityId === city.id ? colors.white : colors.gray[700],
                      }}
                      align={getTextAlign('right')}
                    >
                      {city.name_he}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
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
            <Typography variant="body1" weight="semibold" style={{ color: colors.gray[700] }} align={getTextAlign('right')}>
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
              <Typography variant="body1" weight="semibold" style={{ color: colors.white }} align={getTextAlign('right')}>
                שמור שינויים
              </Typography>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

