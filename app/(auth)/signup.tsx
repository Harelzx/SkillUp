import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react-native';
import { useRTL } from '@/context/RTLContext';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: 'student' | 'teacher' | '';
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export default function SignupScreen() {
  const router = useRouter();
  const { isRTL } = useRTL();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: '',
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateStep = (step: number) => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'שם פרטי נדרש';
      if (!formData.lastName) newErrors.lastName = 'שם משפחה נדרש';
      if (!formData.userType) newErrors.userType = 'יש לבחור סוג משתמש';
    }

    if (step === 2) {
      if (!formData.email) {
        newErrors.email = 'כתובת אימייל נדרשת';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'כתובת אימייל לא תקינה';
      }

      if (!formData.phone) {
        newErrors.phone = 'מספר טלפון נדרש';
      } else if (!/^05\d{8}$/.test(formData.phone.replace(/-/g, ''))) {
        newErrors.phone = 'מספר טלפון לא תקין';
      }
    }

    if (step === 3) {
      if (!formData.password) {
        newErrors.password = 'סיסמה נדרשת';
      } else if (formData.password.length < 8) {
        newErrors.password = 'סיסמה חייבת להכיל לפחות 8 תווים';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'סיסמה חייבת להכיל אות גדולה, קטנה ומספר';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'אישור סיסמה נדרש';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'סיסמאות לא תואמות';
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'יש להסכים לתנאי השימוש';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSignup();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push('/(tabs)');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה במהלך יצירת החשבון');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const renderInputField = (
    icon: any,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    secureTextEntry?: boolean,
    keyboardType?: any,
    rightIcon?: any,
    onRightIconPress?: () => void
  ) => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, error ? styles.inputError : null, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.inputIcon, { marginLeft: isRTL ? 12 : 0, marginRight: isRTL ? 0 : 12 }]}>
          {React.createElement(icon, { size: 20, color: '#94A3B8' })}
        </View>
        <TextInput
          style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor="#94A3B8"
        />
        {rightIcon && (
          <TouchableOpacity style={[styles.rightIcon, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]} onPress={onRightIconPress}>
            {React.createElement(rightIcon, { size: 20, color: '#94A3B8' })}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>}
    </View>
  );

  const renderUserTypeSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>אני...</Text>
      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            formData.userType === 'student' && styles.userTypeButtonSelected
          ]}
          onPress={() => updateFormData('userType', 'student')}
        >
          <Text style={[
            styles.userTypeText,
            formData.userType === 'student' && styles.userTypeTextSelected
          ]}>
            תלמיד - מחפש מורים
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            formData.userType === 'teacher' && styles.userTypeButtonSelected
          ]}
          onPress={() => updateFormData('userType', 'teacher')}
        >
          <Text style={[
            styles.userTypeText,
            formData.userType === 'teacher' && styles.userTypeTextSelected
          ]}>
            מורה - מציע שיעורים
          </Text>
        </TouchableOpacity>
      </View>
      {errors.userType && <Text style={styles.errorText}>{errors.userType}</Text>}
    </View>
  );

  const renderCheckbox = (
    label: string,
    value: boolean,
    onPress: () => void,
    error?: string
  ) => (
    <View style={styles.checkboxContainer}>
      <TouchableOpacity
        style={[styles.checkboxRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={onPress}
      >
        <View style={[styles.checkbox, value && styles.checkboxChecked, { marginLeft: isRTL ? 8 : 0, marginRight: isRTL ? 0 : 8 }]}>
          {value && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>
        <Text style={[styles.checkboxLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>בואו נכיר</Text>
        <Text style={styles.stepSubtitle}>ספרו לנו קצת על עצמכם</Text>
      </View>

      <View style={[styles.inputLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.labelText, { textAlign: isRTL ? 'right' : 'left' }]}>שם פרטי</Text>
      </View>
      {renderInputField(
        User,
        'יוסי',
        formData.firstName,
        (text) => updateFormData('firstName', text),
        errors.firstName
      )}

      <View style={[styles.inputLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.labelText, { textAlign: isRTL ? 'right' : 'left' }]}>שם משפחה</Text>
      </View>
      {renderInputField(
        User,
        'כהן',
        formData.lastName,
        (text) => updateFormData('lastName', text),
        errors.lastName
      )}

      {renderUserTypeSelector()}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>פרטי התקשרות</Text>
        <Text style={styles.stepSubtitle}>איך נוכל ליצור איתכם קשר?</Text>
      </View>

      <View style={[styles.inputLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.labelText, { textAlign: isRTL ? 'right' : 'left' }]}>כתובת אימייל</Text>
      </View>
      {renderInputField(
        Mail,
        'example@email.com',
        formData.email,
        (text) => updateFormData('email', text),
        errors.email,
        false,
        'email-address'
      )}

      <View style={[styles.inputLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.labelText, { textAlign: isRTL ? 'right' : 'left' }]}>מספר טלפון</Text>
      </View>
      {renderInputField(
        Phone,
        '050-123-4567',
        formData.phone,
        (text) => updateFormData('phone', text),
        errors.phone,
        false,
        'phone-pad'
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>צרו סיסמה</Text>
        <Text style={styles.stepSubtitle}>בחרו סיסמה חזקה לאבטחת החשבון</Text>
      </View>

      <View style={[styles.inputLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.labelText, { textAlign: isRTL ? 'right' : 'left' }]}>סיסמה</Text>
      </View>
      {renderInputField(
        Lock,
        '••••••••',
        formData.password,
        (text) => updateFormData('password', text),
        errors.password,
        !showPassword,
        'default',
        showPassword ? EyeOff : Eye,
        () => setShowPassword(!showPassword)
      )}

      <View style={[styles.inputLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.labelText, { textAlign: isRTL ? 'right' : 'left' }]}>אישור סיסמה</Text>
      </View>
      {renderInputField(
        Lock,
        '••••••••',
        formData.confirmPassword,
        (text) => updateFormData('confirmPassword', text),
        errors.confirmPassword,
        !showConfirmPassword,
        'default',
        showConfirmPassword ? EyeOff : Eye,
        () => setShowConfirmPassword(!showConfirmPassword)
      )}

      <View style={styles.termsContainer}>
        {renderCheckbox(
          'אני מסכים לתנאי השימוש ומדיניות הפרטיות',
          formData.agreeToTerms,
          () => updateFormData('agreeToTerms', !formData.agreeToTerms),
          errors.agreeToTerms
        )}

        {renderCheckbox(
          'אני מסכים לקבל עדכונים ופרסומות בדוא"ל',
          formData.agreeToMarketing,
          () => updateFormData('agreeToMarketing', !formData.agreeToMarketing)
        )}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#F8FAFC', '#E2E8F0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft
                size={24}
                color="#64748B"
                style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
              />
            </TouchableOpacity>
            <Text style={[styles.stepIndicator, { textAlign: isRTL ? 'right' : 'left' }]}>
              {currentStep} מתוך {totalSteps}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalSteps) * 100}%` }
                ]}
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Form Card */}
            <View style={styles.formCard}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </View>

            {/* Navigation */}
            <View style={[styles.navigationContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={[styles.backNavButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={handleBack}
                >
                  <ArrowLeft
                    size={16}
                    color="#64748B"
                    style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                  />
                  <Text style={styles.backNavText}>חזור</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
                onPress={handleNext}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={[styles.loadingContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.nextButtonText}>יוצר חשבון...</Text>
                  </View>
                ) : (
                  <View style={[styles.nextButtonContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.nextButtonText}>
                      {currentStep === totalSteps ? 'צור חשבון' : 'המשך'}
                    </Text>
                    {currentStep < totalSteps && (
                      <ArrowRight
                        size={16}
                        color="#FFFFFF"
                        style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={[styles.loginLinkContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.loginLinkText}>יש לכם כבר חשבון? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLinkButton}> התחברות</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  backButton: {
    padding: 8,
  },
  stepIndicator: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  stepContainer: {
    gap: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 2,
  },
  inputLabel: {
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    // RTL margins handled dynamically
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  rightIcon: {
    padding: 4,
    // RTL margins handled dynamically
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  userTypeContainer: {
    gap: 8,
  },
  userTypeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  userTypeButtonSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  userTypeText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  userTypeTextSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  termsContainer: {
    gap: 12,
    marginTop: 8,
  },
  checkboxContainer: {
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    // RTL margins handled dynamically
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  backNavText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 2,
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#64748B',
  },
  loginLinkButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
});