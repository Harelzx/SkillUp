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
import { updateTeacherProfile, getSubjects, updateTeacherSubjects } from '@/services/api';
import { supabase } from '@/lib/supabase';

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
  location: string;
  lessonModes: ('online' | 'at_teacher' | 'at_student')[];
}

const CITIES = [
  'תל אביב-יפו','ירושלים','חיפה','ראשון לציון','פתח תקווה','אשדוד','נתניה','באר שבע','בני ברק','חולון','רמת גן','אשקלון','רחובות','בת ים','בית שמש','כפר סבא','הרצליה','חדרה','מודיעין-מכבים-רעות','נצרת','רעננה','לוד','רמלה','קריית אתא','קריית גת','קריית מוצקין','קריית ים','קריית שמונה','טבריה','אילת',
];

export default function TeacherOnboardingModal({ teacherId, onComplete }: TeacherOnboardingModalProps) {
  const { isRTL } = useRTL();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // City picker state
  const [showCityPicker, setShowCityPicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    phone: '',
    bio: '',
    subjects: [],
    hourlyRate: '150',
    location: '',
    lessonModes: ['online'],
  });

  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id: string; name_he: string }>>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    console.log('🟢 showCityPicker changed:', showCityPicker);
  }, [showCityPicker]);

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

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.bio.trim() || formData.bio.trim().length < 50) newErrors.bio = 'התיאור צריך להכיל לפחות 50 תווים';
      if (formData.subjects.length === 0) newErrors.subjects = 'יש לבחור לפחות נושא הוראה אחד';
      const rate = parseFloat(formData.hourlyRate);
      if (!formData.hourlyRate || isNaN(rate) || rate <= 0) newErrors.hourlyRate = 'מחיר לשעה חייב להיות מספר חיובי';
    }
    if (step === 2) {
      if (!formData.location) newErrors.location = 'יש לבחור עיר';
      if (formData.lessonModes.length === 0) newErrors.lessonModes = 'יש לבחור לפחות אופן הוראה אחד';
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
      await updateTeacherProfile(teacherId, { bio: formData.bio, hourlyRate: parseFloat(formData.hourlyRate), location: formData.location });
      await updateTeacherSubjects(teacherId, formData.subjects);
      const { error: updateError } = await supabase.from('profiles').update({ profile_completed: true } as any).eq('id', teacherId);
      if (updateError) throw updateError;
      Alert.alert('ברוכים הבאים! 🎉', 'הפרופיל שלך הושלם בהצלחה!', [{ text: 'מעולה!', onPress: onComplete }]);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הנתונים. נסה שוב.');
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
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View style={styles.inputGroup}>
        <Typography variant="body1" weight="semibold" style={styles.inputLabel}>באיזו עיר אתה נמצא? *</Typography>
        <Pressable
          style={[styles.input, errors.location && styles.inputError, { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4] }]}
          onPress={() => {
            console.log('🔵 City picker pressed!');
            setShowCityPicker(!showCityPicker);
          }}
        >
          <Typography variant="body2" style={{ color: formData.location ? colors.gray[900] : colors.gray[400], flex: 1, textAlign: 'right' }}>{formData.location || 'בחר עיר...'}</Typography>
          <Typography variant="body1" style={{ color: colors.gray[400] }}>{showCityPicker ? '▲' : '▼'}</Typography>
        </Pressable>
        {errors.location && <Typography variant="caption" color="error" style={styles.errorText}>{errors.location}</Typography>}

        {showCityPicker && (
          <View style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[300], borderRadius: 12, marginTop: spacing[2], maxHeight: 250 }}>
            <ScrollView>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={{ padding: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.gray[100] }}
                  onPress={() => {
                    setFormData({ ...formData, location: city });
                    setShowCityPicker(false);
                  }}
                >
                  <Typography variant="body2" style={{ textAlign: 'right' }}>{city}</Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

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