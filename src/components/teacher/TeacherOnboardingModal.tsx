/**
 * Teacher Onboarding Modal
 * Using simple Modal for city picker
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { updateTeacherProfile, getSubjects, updateTeacherSubjects, getLanguages, languagesToOptions } from '@/services/api';
import { getRegions, getCitiesByRegion } from '@/services/api/regionsAPI';
import type { Region, City } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface TeacherOnboardingModalProps {
  teacherId: string;
  onComplete: () => void;
}

interface FormData {
  displayName: string;
  phone: string;
  bio: string;
  subjects: string[]; // Subject IDs
  hourlyRate: string;
  regionId: string;
  cityId: string;
  lessonModes: ('online' | 'at_teacher' | 'at_student')[];
  education: string[];
  languages: string[];
  subjectExperience: { [subjectId: string]: string }; // Years of experience per subject
}

export default function TeacherOnboardingModal({ teacherId, onComplete }: TeacherOnboardingModalProps) {
  const { isRTL } = useRTL();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Picker states
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    phone: '',
    bio: '',
    subjects: [],
    hourlyRate: '150',
    regionId: '',
    cityId: '',
    lessonModes: ['online'],
    education: [],
    languages: [],
    subjectExperience: {},
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id: string; name_he: string }>>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEducation, setNewEducation] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch common languages from database
  const { data: languages = [], isLoading: loadingLanguages } = useQuery({
    queryKey: ['languages', true], // true = only common languages
    queryFn: () => getLanguages(true),
  });

  // Convert to array of language names for display
  const commonLanguages = languages.map(lang => lang.name_he);

  useEffect(() => {
    loadRegions();
    loadSubjects();
  }, []);

  const loadRegions = async () => {
    setIsLoading(true);
    try {
      const response = await getRegions();
      if (response.success) {
        setRegions(response.regions);
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו לטעון את רשימת האזורים');
      }
    } catch (error: any) {
      console.error('Error loading regions:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את רשימת האזורים');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const subjects = await getSubjects();
      setAvailableSubjects(subjects);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את רשימת המקצועות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionChange = async (regionId: string) => {
    setFormData({ ...formData, regionId, cityId: '' });
    setCities([]);
    setShowRegionPicker(false);

    setIsLoadingCities(true);
    try {
      const response = await getCitiesByRegion(regionId);
      if (response.success) {
        setCities(response.cities);
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו לטעון את רשימת הערים');
      }
    } catch (error: any) {
      console.error('Error loading cities:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את רשימת הערים');
    } finally {
      setIsLoadingCities(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.bio.trim() || formData.bio.trim().length < 50) newErrors.bio = 'התיאור צריך להכיל לפחות 50 תווים';
      if (formData.subjects.length === 0) newErrors.subjects = 'יש לבחור לפחות נושא הוראה אחד';
      const rate = parseFloat(formData.hourlyRate);
      if (!formData.hourlyRate || isNaN(rate) || rate <= 0) newErrors.hourlyRate = 'מחיר לשעה חייב להיות מספר חיובי';
    }
    if (step === 2) {
      if (!formData.regionId) newErrors.regionId = 'יש לבחור אזור';
      if (!formData.cityId) newErrors.cityId = 'יש לבחור עיר';
      if (formData.lessonModes.length === 0) newErrors.lessonModes = 'יש לבחור לפחות אופן הוראה אחד';

      // Validate per-subject experience years
      for (const subjectId of formData.subjects) {
        const years = formData.subjectExperience[subjectId];
        if (years) {
          const yearsNum = parseInt(years);
          if (isNaN(yearsNum) || yearsNum < 0 || yearsNum > 70) {
            newErrors[`subjectExperience_${subjectId}`] = 'שנות ניסיון חייבות להיות בין 0 ל-70';
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;
    setIsSubmitting(true);
    try {
      // Calculate average experience years from per-subject experience
      const experienceValues = Object.values(formData.subjectExperience)
        .map(val => parseInt(val))
        .filter(val => !isNaN(val) && val > 0);

      const averageExperience = experienceValues.length > 0
        ? Math.round(experienceValues.reduce((sum, val) => sum + val, 0) / experienceValues.length)
        : undefined;

      // Step 1: Update teacher profile
      const profileResult = await updateTeacherProfile(teacherId, {
        bio: formData.bio,
        hourlyRate: parseFloat(formData.hourlyRate),
        regionId: formData.regionId,
        cityId: formData.cityId,
        education: formData.education.length > 0 ? formData.education : undefined,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        experienceYears: averageExperience,
      });

      if (!profileResult.success) {
        throw new Error('Failed to update profile');
      }

      // Step 2: Update subjects
      await updateTeacherSubjects(teacherId, formData.subjects);

      // Step 3: Mark profile as completed ONLY if everything succeeded
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ profile_completed: true } as any)
        .eq('id', teacherId);

      if (updateError) throw updateError;

      Alert.alert('ברוכים הבאים! 🎉', 'הפרופיל שלך הושלם בהצלחה!', [{ text: 'מעולה!', onPress: onComplete }]);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הנתונים. נסה שוב.');
      // Don't mark as completed if there was an error
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData((prev) => ({ ...prev, subjects: prev.subjects.includes(subjectId) ? prev.subjects.filter((id) => id !== subjectId) : [...prev.subjects, subjectId] }));
  };

  const toggleLessonMode = (mode: 'online' | 'at_teacher' | 'at_student') => {
    setFormData((prev) => ({ ...prev, lessonModes: prev.lessonModes.includes(mode) ? prev.lessonModes.filter((m) => m !== mode) : [...prev.lessonModes, mode] }));
  };

  const addEducation = (item: string) => {
    if (item.trim()) {
      setFormData((prev) => ({ ...prev, education: [...prev.education, item.trim()] }));
    }
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const toggleLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const dynamicStyles = useMemo(() => ({
    stickyHeaderWithInset: {
      backgroundColor: colors.white,
      paddingTop: insets.top + spacing[2],
      paddingBottom: spacing[4],
      paddingHorizontal: spacing[6],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    }
  }), [insets.top]);

  const styles = createStyle({
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { padding: spacing[6] },
    progressContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: spacing[2] },
    progressStep: { flex: 1, height: 4, backgroundColor: colors.gray[200], marginHorizontal: spacing[1], borderRadius: 2 },
    progressStepActive: { backgroundColor: colors.primary[600] },
    inputGroup: { marginBottom: spacing[5] },
    inputLabel: { marginBottom: spacing[2] },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[300], borderRadius: 12, padding: spacing[4], fontSize: 16, textAlign: isRTL ? 'right' : 'left', color: colors.gray[900], minHeight: 56 },
    inputError: { borderColor: colors.red[500] },
    errorText: { marginTop: spacing[1] },
    textArea: { height: 120, textAlignVertical: 'top' },
    gridContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', marginTop: spacing[2] },
    chipButton: { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: 20, borderWidth: 2, borderColor: colors.gray[300], marginRight: isRTL ? 0 : spacing[2], marginLeft: isRTL ? spacing[2] : 0, marginBottom: spacing[2], backgroundColor: colors.white },
    chipButtonSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
    modeButton: { padding: spacing[4], borderRadius: 12, borderWidth: 2, borderColor: colors.gray[300], marginBottom: spacing[3], backgroundColor: colors.white },
    modeButtonSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
    buttonContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: spacing[3], marginTop: spacing[6] },
    button: { flex: 1, paddingVertical: spacing[4], borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
    buttonPrimary: { backgroundColor: colors.primary[600] },
    buttonSecondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary[600] },
    buttonDisabled: { backgroundColor: colors.gray[300] },
  });

  const renderStep1 = () => (
    <View>
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>ספר לתלמידים עלייך *</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3], textAlign: isRTL ? 'right' : 'left' }}>תאר את הניסיון, שיטת ההוראה, והתמחויות</Typography>
        <TextInput style={[styles.input, styles.textArea, errors.bio && styles.inputError]} value={formData.bio} onChangeText={(text) => setFormData({ ...formData, bio: text })} placeholder="לדוגמה: מורה למתמטיקה עם 10 שנות ניסיון..." placeholderTextColor={colors.gray[400]} multiline numberOfLines={6} />
        <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1], textAlign: isRTL ? 'right' : 'left' }}>{formData.bio.length} / 50 תווים מינימום</Typography>
        {errors.bio && <Typography variant="caption" color="error" style={styles.errorText}>{errors.bio}</Typography>}
      </View>
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>באילו נושאים אתה מלמד? *</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3] }}>בחר לפחות נושא אחד</Typography>
        {isLoading ? <ActivityIndicator color={colors.primary[600]} /> : (
          <View style={styles.gridContainer}>
            {availableSubjects.map((subject) => (
              <TouchableOpacity key={subject.id} style={[styles.chipButton, formData.subjects.includes(subject.id) && styles.chipButtonSelected]} onPress={() => toggleSubject(subject.id)}>
                <Typography variant="body2" weight={formData.subjects.includes(subject.id) ? 'semibold' : 'normal'} style={{ color: formData.subjects.includes(subject.id) ? colors.primary[700] : colors.gray[700] }}>{subject.name_he}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.subjects && <Typography variant="caption" color="error" style={styles.errorText}>{errors.subjects}</Typography>}
      </View>
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>מחיר לשעה *</Typography>
        <View style={{ position: 'relative', width: 140, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
          <TextInput style={[styles.input, errors.hourlyRate && styles.inputError, { paddingLeft: isRTL ? 50 : spacing[4], paddingRight: isRTL ? spacing[4] : 50 }]} value={formData.hourlyRate} onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })} placeholder="150" placeholderTextColor={colors.gray[400]} keyboardType="numeric" />
          <View style={{ position: 'absolute', [isRTL ? 'left' : 'right']: 16, top: 0, bottom: 0, justifyContent: 'center' }}><Typography variant="body1" weight="semibold" style={{ color: colors.gray[500] }}>₪</Typography></View>
        </View>
        {errors.hourlyRate && <Typography variant="caption" color="error" style={styles.errorText}>{errors.hourlyRate}</Typography>}
      </View>

      {/* Education */}
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>השכלה והכשרות</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3], textAlign: isRTL ? 'right' : 'left' }}>תואר, קורסים, הסמכות</Typography>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: spacing[2], marginBottom: spacing[2] }}>
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
        {formData.education.map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              backgroundColor: colors.primary[50],
              padding: spacing[3],
              borderRadius: 8,
              marginBottom: spacing[2],
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>✓ {item}</Typography>
            <TouchableOpacity onPress={() => removeEducation(index)}>
              <Typography variant="body1" style={{ color: colors.red[500], paddingHorizontal: spacing[2] }}>×</Typography>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Languages */}
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>שפות</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3], textAlign: isRTL ? 'right' : 'left' }}>באילו שפות אתה יכול ללמד?</Typography>
        {loadingLanguages ? (
          <View style={{ padding: spacing[4], alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {commonLanguages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[styles.chipButton, formData.languages.includes(language) && styles.chipButtonSelected]}
                onPress={() => toggleLanguage(language)}
              >
                <Typography
                  variant="body2"
                  weight={formData.languages.includes(language) ? 'semibold' : 'normal'}
                  style={{ color: formData.languages.includes(language) ? colors.primary[700] : colors.gray[700] }}
                >
                  {language}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      {/* Region Selection */}
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>באיזה אזור אתה נמצא? *</Typography>
        <Pressable
          style={[styles.input, errors.regionId && styles.inputError, { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4] }]}
          onPress={() => setShowRegionPicker(!showRegionPicker)}
        >
          <Typography variant="body2" style={{ color: formData.regionId ? colors.gray[900] : colors.gray[400], flex: 1, textAlign: 'right' }}>
            {formData.regionId ? regions.find(r => r.id === formData.regionId)?.name_he : 'בחר אזור...'}
          </Typography>
          <Typography variant="body1" style={{ color: colors.gray[400] }}>{showRegionPicker ? '▲' : '▼'}</Typography>
        </Pressable>
        {errors.regionId && <Typography variant="caption" color="error" style={styles.errorText}>{errors.regionId}</Typography>}

        {showRegionPicker && (
          <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[300], borderRadius: 12, marginTop: spacing[2], maxHeight: 250 }}>
            <ScrollView>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={{ padding: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.gray[100] }}
                  onPress={() => handleRegionChange(region.id)}
                >
                  <Typography variant="body2" style={{ textAlign: 'right' }}>{region.name_he}</Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* City Selection - only show if region selected */}
      {formData.regionId && (
        <View style={styles.inputGroup}>
          <Typography variant="body1" weight="semibold" style={styles.inputLabel}>באיזו עיר אתה נמצא? *</Typography>
          {isLoadingCities ? (
            <View style={[styles.input, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : (
            <>
              <Pressable
                style={[styles.input, errors.cityId && styles.inputError, { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4] }]}
                onPress={() => setShowCityPicker(!showCityPicker)}
              >
                <Typography variant="body2" style={{ color: formData.cityId ? colors.gray[900] : colors.gray[400], flex: 1, textAlign: 'right' }}>
                  {formData.cityId ? cities.find(c => c.id === formData.cityId)?.name_he : 'בחר עיר...'}
                </Typography>
                <Typography variant="body1" style={{ color: colors.gray[400] }}>{showCityPicker ? '▲' : '▼'}</Typography>
              </Pressable>
              {errors.cityId && <Typography variant="caption" color="error" style={styles.errorText}>{errors.cityId}</Typography>}

              {showCityPicker && (
                <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[300], borderRadius: 12, marginTop: spacing[2], maxHeight: 250 }}>
                  <ScrollView>
                    {cities.map((city) => (
                      <TouchableOpacity
                        key={city.id}
                        style={{ padding: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.gray[100] }}
                        onPress={() => {
                          setFormData({ ...formData, cityId: city.id });
                          setShowCityPicker(false);
                        }}
                      >
                        <Typography variant="body2" style={{ textAlign: 'right' }}>{city.name_he}</Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Per-Subject Experience Years */}
      {formData.subjects.length > 0 && (
        <View style={styles.inputGroup}>
          <Typography variant="body1" weight="semibold" style={styles.inputLabel}>שנות ניסיון בהוראה</Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3], textAlign: isRTL ? 'right' : 'left' }}>כמה שנים אתה מלמד כל נושא?</Typography>
          {formData.subjects.map((subjectId) => {
            const subject = availableSubjects.find(s => s.id === subjectId);
            if (!subject) return null;
            return (
              <View key={subjectId} style={{ marginBottom: spacing[3] }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[3] }}>
                  <Typography variant="body2" style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    {subject.name_he}:
                  </Typography>
                  <View style={{ width: 100 }}>
                    <TextInput
                      style={[
                        styles.input,
                        errors[`subjectExperience_${subjectId}`] && styles.inputError
                      ]}
                      value={formData.subjectExperience[subjectId] || ''}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        subjectExperience: { ...prev.subjectExperience, [subjectId]: text }
                      }))}
                      placeholder="0"
                      placeholderTextColor={colors.gray[400]}
                      keyboardType="numeric"
                    />
                  </View>
                  <Typography variant="body2" color="textSecondary">שנים</Typography>
                </View>
                {errors[`subjectExperience_${subjectId}`] && (
                  <Typography variant="caption" color="error" style={styles.errorText}>
                    {errors[`subjectExperience_${subjectId}`]}
                  </Typography>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>איך אתה מעדיף ללמד? *</Typography>
        <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[3] }}>ניתן לבחור יותר מאופציה אחת</Typography>
        <TouchableOpacity style={[styles.modeButton, formData.lessonModes.includes('online') && styles.modeButtonSelected]} onPress={() => toggleLessonMode('online')}>
          <Typography variant="body1" weight="semibold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: spacing[1] }}>💻 שיעורים אונליין</Typography>
          <Typography variant="caption" color="textSecondary" style={{ textAlign: isRTL ? 'right' : 'left' }}>שיעורים דרך Zoom או אפליקציות וידאו אחרות</Typography>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, formData.lessonModes.includes('at_teacher') && styles.modeButtonSelected]} onPress={() => toggleLessonMode('at_teacher')}>
          <Typography variant="body1" weight="semibold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: spacing[1] }}>🏠 אצלי בבית</Typography>
          <Typography variant="caption" color="textSecondary" style={{ textAlign: isRTL ? 'right' : 'left' }}>תלמידים מגיעים אלייך לשיעור</Typography>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, formData.lessonModes.includes('at_student') && styles.modeButtonSelected]} onPress={() => toggleLessonMode('at_student')}>
          <Typography variant="body1" weight="semibold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: spacing[1] }}>🚗 אצל התלמיד</Typography>
          <Typography variant="caption" color="textSecondary" style={{ textAlign: isRTL ? 'right' : 'left' }}>אתה מגיע לבית התלמיד</Typography>
        </TouchableOpacity>
        {errors.lessonModes && <Typography variant="caption" color="error" style={styles.errorText}>{errors.lessonModes}</Typography>}
      </View>
    </View>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <LinearGradient colors={[colors.primary[50], colors.white, colors.white]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
              <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[0]}>
                <View style={dynamicStyles.stickyHeaderWithInset}>
                  <Typography variant="h2" weight="bold" align="center" style={{ marginBottom: spacing[1] }}>
                    {currentStep === 1 ? 'בוא נכיר 👋' : 'איפה ואיך תלמד? 📍'}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" align="center">
                    {currentStep === 1 ? 'ספר קצת עליך ובחר את התחומים שלך' : 'עיר ואופן הוראה'}
                  </Typography>
                  <View style={styles.progressContainer}>
                    {Array.from({ length: totalSteps }).map((_, index) => (
                      <View key={index} style={[styles.progressStep, index < currentStep && styles.progressStepActive]} />
                    ))}
                  </View>
                </View>
                <View style={styles.content}>
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  <View style={styles.buttonContainer}>
                    {currentStep > 1 && (
                      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleBack}>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[2] }}>
                          {isRTL ? <ArrowRight size={20} color={colors.primary[600]} /> : <ArrowLeft size={20} color={colors.primary[600]} />}
                          <Typography variant="body1" weight="semibold" style={{ color: colors.primary[600] }}>חזור</Typography>
                        </View>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.button, styles.buttonPrimary, isSubmitting && styles.buttonDisabled]} onPress={currentStep === totalSteps ? handleSubmit : handleNext} disabled={isSubmitting}>
                      {isSubmitting ? <ActivityIndicator color={colors.white} /> : (
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[2] }}>
                          <Typography variant="body1" weight="semibold" style={{ color: colors.white }}>{currentStep === totalSteps ? 'שמור והתחל' : 'המשך'}</Typography>
                          {isRTL ? <ArrowLeft size={20} color={colors.white} /> : <ArrowRight size={20} color={colors.white} />}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </LinearGradient>
      </SafeAreaProvider>
    </Modal>
  );
}