/**
 * Student Onboarding Modal
 * Collects essential information from new students
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { updateStudentProfile, getSubjects } from '@/services/api';
import { getRegions, getCitiesByRegion } from '@/services/api/regionsAPI';
import type { Region, City } from '@/types/database';

interface StudentOnboardingModalProps {
  studentId: string;
  onComplete: () => void;
}

interface FormData {
  birthDate: Date | null;
  regionId: string;
  cityId: string;
  subjectsInterests: string[];
  levelCategory: string;
  levelProficiency: string;
  bio: string;
}

const LEVEL_CATEGORIES = [
  { value: 'elementary', label: 'בית ספר יסודי' },
  { value: 'middle', label: 'חטיבת ביניים' },
  { value: 'high', label: 'תיכון' },
  { value: 'academic', label: 'אקדמי' },
  { value: 'adult', label: 'מבוגר' },
];

const LEVEL_PROFICIENCIES = [
  { value: 'beginner', label: 'מתחיל' },
  { value: 'intermediate', label: 'בינוני' },
  { value: 'advanced', label: 'מתקדם' },
];

export default function StudentOnboardingModal({ studentId, onComplete }: StudentOnboardingModalProps) {
  const { isRTL } = useRTL();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Picker states
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState<number | null>(null);
  const [tempMonth, setTempMonth] = useState<number | null>(null);
  const [tempYear, setTempYear] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    birthDate: null,
    regionId: '',
    cityId: '',
    subjectsInterests: [],
    levelCategory: '',
    levelProficiency: '',
    bio: '',
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id: string; name_he: string }>>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate date options
  const dateOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 4; year >= currentYear - 100; year--) {
      years.push(year);
    }

    const months = [
      { value: 1, label: 'ינואר' },
      { value: 2, label: 'פברואר' },
      { value: 3, label: 'מרץ' },
      { value: 4, label: 'אפריל' },
      { value: 5, label: 'מאי' },
      { value: 6, label: 'יוני' },
      { value: 7, label: 'יולי' },
      { value: 8, label: 'אוגוסט' },
      { value: 9, label: 'ספטמבר' },
      { value: 10, label: 'אוקטובר' },
      { value: 11, label: 'נובמבר' },
      { value: 12, label: 'דצמבר' },
    ];

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month, 0).getDate();
    };

    return { years, months, getDaysInMonth };
  }, []);

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
      if (!formData.regionId) newErrors.regionId = 'יש לבחור אזור';
      if (!formData.cityId) newErrors.cityId = 'יש לבחור עיר';
      if (!formData.birthDate) newErrors.birthDate = 'תאריך לידה הוא שדה חובה';
      if (formData.subjectsInterests.length === 0) newErrors.subjectsInterests = 'יש לבחור לפחות נושא אחד';
    }

    if (step === 2) {
      if (!formData.levelCategory) newErrors.levelCategory = 'יש לבחור רמת לימוד';
      if (!formData.levelProficiency) newErrors.levelProficiency = 'יש לבחור רמת שליטה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setIsSubmitting(true);
    try {
      // Format birth date as YYYY-MM-DD for database
      const birthDateString = formData.birthDate
        ? formData.birthDate.toISOString().split('T')[0]
        : undefined;

      // Update only missing profile fields (name, phone already collected in signup)
      await updateStudentProfile(studentId, {
        birthDate: birthDateString,
        regionId: formData.regionId,
        cityId: formData.cityId,
        subjectsInterests: formData.subjectsInterests,
        levelCategory: formData.levelCategory,
        levelProficiency: formData.levelProficiency,
        bio: formData.bio || undefined,
        profileCompleted: true,
      });

      Alert.alert('ברוכים הבאים! 🎉', 'הפרופיל שלך הושלם בהצלחה!', [
        { text: 'מעולה!', onPress: onComplete },
      ]);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הנתונים. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectsInterests: prev.subjectsInterests.includes(subjectId)
        ? prev.subjectsInterests.filter((id) => id !== subjectId)
        : [...prev.subjectsInterests, subjectId],
    }));
  };

  const dynamicStyles = useMemo(
    () => ({
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
      },
    }),
    [insets.top]
  );

  const styles = createStyle({
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { padding: spacing[6] },
    progressContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginTop: spacing[2],
    },
    progressStep: {
      flex: 1,
      height: 4,
      backgroundColor: colors.gray[200],
      marginHorizontal: spacing[1],
      borderRadius: 2,
    },
    progressStepActive: { backgroundColor: colors.primary[600] },
    inputGroup: { marginBottom: spacing[5] },
    inputLabel: { marginBottom: spacing[2] },
    input: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.gray[300],
      borderRadius: 12,
      padding: spacing[4],
      fontSize: 16,
      textAlign: isRTL ? 'right' : 'left',
      color: colors.gray[900],
      minHeight: 56,
    },
    inputError: { borderColor: colors.red[500] },
    errorText: { marginTop: spacing[1] },
    textArea: { height: 100, textAlignVertical: 'top' },
    gridContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      marginTop: spacing[2],
    },
    chipButton: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.gray[300],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      marginBottom: spacing[2],
      backgroundColor: colors.white,
    },
    chipButtonSelected: {
      borderColor: colors.primary[600],
      backgroundColor: colors.primary[50],
    },
    buttonContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: spacing[3],
      marginTop: spacing[6],
    },
    button: {
      flex: 1,
      paddingVertical: spacing[4],
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    buttonPrimary: { backgroundColor: colors.primary[600] },
    buttonSecondary: {
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.primary[600],
    },
    buttonDisabled: { backgroundColor: colors.gray[300] },
    pickerContainer: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.gray[300],
      borderRadius: 12,
      marginTop: spacing[2],
      maxHeight: 250,
    },
    pickerItem: {
      padding: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
    },
  });

  const renderStep1 = () => (
    <View>
      {/* Region Selection */}
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
          באיזה אזור אתה נמצא? *
        </Typography>
        <Pressable
          style={[styles.input, errors.regionId && styles.inputError, { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => setShowRegionPicker(!showRegionPicker)}
        >
          <Typography
            variant="body2"
            style={{ color: formData.regionId ? colors.gray[900] : colors.gray[400], flex: 1, textAlign: 'right' }}
          >
            {formData.regionId ? regions.find(r => r.id === formData.regionId)?.name_he : 'בחר אזור...'}
          </Typography>
          <Typography variant="body1" style={{ color: colors.gray[400] }}>
            {showRegionPicker ? '▲' : '▼'}
          </Typography>
        </Pressable>
        {errors.regionId && (
          <Typography variant="caption" color="error" style={styles.errorText}>
            {errors.regionId}
          </Typography>
        )}

        {showRegionPicker && (
          <View style={styles.pickerContainer}>
            <ScrollView>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={styles.pickerItem}
                  onPress={() => handleRegionChange(region.id)}
                >
                  <Typography variant="body2" style={{ textAlign: 'right' }}>
                    {region.name_he}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* City Selection - only show if region selected */}
      {formData.regionId && (
        <View style={styles.inputGroup}>
          <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
            באיזו עיר אתה נמצא? *
          </Typography>
          {isLoadingCities ? (
            <View style={[styles.input, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : (
            <>
              <Pressable
                style={[styles.input, errors.cityId && styles.inputError, { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowCityPicker(!showCityPicker)}
              >
                <Typography
                  variant="body2"
                  style={{ color: formData.cityId ? colors.gray[900] : colors.gray[400], flex: 1, textAlign: 'right' }}
                >
                  {formData.cityId ? cities.find(c => c.id === formData.cityId)?.name_he : 'בחר עיר...'}
                </Typography>
                <Typography variant="body1" style={{ color: colors.gray[400] }}>
                  {showCityPicker ? '▲' : '▼'}
                </Typography>
              </Pressable>
              {errors.cityId && (
                <Typography variant="caption" color="error" style={styles.errorText}>
                  {errors.cityId}
                </Typography>
              )}

              {showCityPicker && (
                <View style={styles.pickerContainer}>
                  <ScrollView>
                    {cities.map((city) => (
                      <TouchableOpacity
                        key={city.id}
                        style={styles.pickerItem}
                        onPress={() => {
                          setFormData({ ...formData, cityId: city.id });
                          setShowCityPicker(false);
                        }}
                      >
                        <Typography variant="body2" style={{ textAlign: 'right' }}>
                          {city.name_he}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      )}

      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
          תאריך לידה *
        </Typography>
        <Pressable
          style={[styles.input, errors.birthDate && styles.inputError, { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Typography
            variant="body2"
            style={{ color: formData.birthDate ? colors.gray[900] : colors.gray[400], flex: 1, textAlign: 'right' }}
          >
            {formData.birthDate
              ? `${formData.birthDate.getDate()}/${formData.birthDate.getMonth() + 1}/${formData.birthDate.getFullYear()}`
              : 'בחר תאריך לידה...'}
          </Typography>
          <Typography variant="body1" style={{ color: colors.gray[400] }}>
            {showDatePicker ? '▲' : '▼'}
          </Typography>
        </Pressable>
        {errors.birthDate && (
          <Typography variant="caption" color="error" style={styles.errorText}>
            {errors.birthDate}
          </Typography>
        )}

        {showDatePicker && (
          <View style={[styles.pickerContainer, { maxHeight: 300 }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', padding: spacing[3], gap: spacing[2] }}>
              {/* Day Picker */}
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2], textAlign: 'center' }}>
                  יום
                </Typography>
                <ScrollView style={{ maxHeight: 150 }}>
                  {Array.from({ length: tempMonth && tempYear ? dateOptions.getDaysInMonth(tempMonth, tempYear) : 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        tempDay === day && { backgroundColor: colors.primary[50] }
                      ]}
                      onPress={() => setTempDay(day)}
                    >
                      <Typography variant="body2" style={{ textAlign: 'center' }}>
                        {day}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2], textAlign: 'center' }}>
                  חודש
                </Typography>
                <ScrollView style={{ maxHeight: 150 }}>
                  {dateOptions.months.map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.pickerItem,
                        tempMonth === month.value && { backgroundColor: colors.primary[50] }
                      ]}
                      onPress={() => setTempMonth(month.value)}
                    >
                      <Typography variant="body2" style={{ textAlign: 'center' }}>
                        {month.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2], textAlign: 'center' }}>
                  שנה
                </Typography>
                <ScrollView style={{ maxHeight: 150 }}>
                  {dateOptions.years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        tempYear === year && { backgroundColor: colors.primary[50] }
                      ]}
                      onPress={() => setTempYear(year)}
                    >
                      <Typography variant="body2" style={{ textAlign: 'center' }}>
                        {year}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Confirm Button */}
            <View style={{ padding: spacing[3], borderTopWidth: 1, borderTopColor: colors.gray[200] }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  (!tempDay || !tempMonth || !tempYear) && styles.buttonDisabled
                ]}
                onPress={() => {
                  if (tempDay && tempMonth && tempYear) {
                    const date = new Date(tempYear, tempMonth - 1, tempDay);
                    setFormData({ ...formData, birthDate: date });
                    setShowDatePicker(false);
                    setTempDay(null);
                    setTempMonth(null);
                    setTempYear(null);
                  }
                }}
                disabled={!tempDay || !tempMonth || !tempYear}
              >
                <Typography variant="body1" weight="semibold" style={{ color: colors.white }}>
                  אישור
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
          באילו נושאים אתה מעוניין ללמוד? *
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[3] }}>
          בחר לפחות נושא אחד
        </Typography>
        {isLoading ? (
          <ActivityIndicator color={colors.primary[600]} />
        ) : (
          <View style={styles.gridContainer}>
            {availableSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[styles.chipButton, formData.subjectsInterests.includes(subject.id) && styles.chipButtonSelected]}
                onPress={() => toggleSubject(subject.id)}
              >
                <Typography
                  variant="body2"
                  weight={formData.subjectsInterests.includes(subject.id) ? 'semibold' : 'normal'}
                  style={{
                    color: formData.subjectsInterests.includes(subject.id) ? colors.primary[700] : colors.gray[700],
                  }}
                >
                  {subject.name_he}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.subjectsInterests && (
          <Typography variant="caption" color="error" style={styles.errorText}>
            {errors.subjectsInterests}
          </Typography>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
          באיזו רמה אתה לומד? *
        </Typography>
        <View style={styles.gridContainer}>
          {LEVEL_CATEGORIES.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[styles.chipButton, formData.levelCategory === level.value && styles.chipButtonSelected]}
              onPress={() => setFormData({ ...formData, levelCategory: level.value })}
            >
              <Typography
                variant="body2"
                weight={formData.levelCategory === level.value ? 'semibold' : 'normal'}
                style={{
                  color: formData.levelCategory === level.value ? colors.primary[700] : colors.gray[700],
                }}
              >
                {level.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
        {errors.levelCategory && (
          <Typography variant="caption" color="error" style={styles.errorText}>
            {errors.levelCategory}
          </Typography>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
          מה רמת השליטה שלך? *
        </Typography>
        <View style={styles.gridContainer}>
          {LEVEL_PROFICIENCIES.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[styles.chipButton, formData.levelProficiency === level.value && styles.chipButtonSelected]}
              onPress={() => setFormData({ ...formData, levelProficiency: level.value })}
            >
              <Typography
                variant="body2"
                weight={formData.levelProficiency === level.value ? 'semibold' : 'normal'}
                style={{
                  color: formData.levelProficiency === level.value ? colors.primary[700] : colors.gray[700],
                }}
              >
                {level.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
        {errors.levelProficiency && (
          <Typography variant="caption" color="error" style={styles.errorText}>
            {errors.levelProficiency}
          </Typography>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>
          ספר קצת על עצמך (אופציונלי)
        </Typography>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.bio}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
          placeholder="מה המטרות שלך? למה אתה רוצה ללמוד?"
          placeholderTextColor={colors.gray[400]}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <LinearGradient colors={[colors.primary[50], colors.white, colors.white]} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={0}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                stickyHeaderIndices={[0]}
              >
                <View style={dynamicStyles.stickyHeaderWithInset}>
                  <Typography variant="h2" weight="bold" align="center" style={{ marginBottom: spacing[1] }}>
                    {currentStep === 1 ? 'איפה ומה? 🏙️📚' : 'באיזו רמה? 🎯'}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" align="center">
                    {currentStep === 1 ? 'עיר ונושאי עניין' : 'רמת לימוד ושליטה'}
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
                          {isRTL ? (
                            <ArrowRight size={20} color={colors.primary[600]} />
                          ) : (
                            <ArrowLeft size={20} color={colors.primary[600]} />
                          )}
                          <Typography variant="body1" weight="semibold" style={{ color: colors.primary[600] }}>
                            חזור
                          </Typography>
                        </View>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimary, isSubmitting && styles.buttonDisabled]}
                      onPress={currentStep === totalSteps ? handleSubmit : handleNext}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing[2] }}>
                          <Typography variant="body1" weight="semibold" style={{ color: colors.white }}>
                            {currentStep === totalSteps ? 'שמור והתחל' : 'המשך'}
                          </Typography>
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
