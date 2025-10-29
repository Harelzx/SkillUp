import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Fingerprint,
  Smartphone,
  Mail,
  Lock,
} from 'lucide-react-native';
import { useRTL } from '@/context/RTLContext';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/features/auth/auth-context';
import { Profile } from '@/lib/supabase';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginScreen() {
  const router = useRouter();
  const { isRTL, getTextAlign, getFlexDirection } = useRTL();
  const { signIn, profile } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  // Google Auth Configuration
  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  // Apple Icon SVG Component
  const AppleIcon = ({ size = 24, color = '#000000' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </Svg>
  );

  // Google Icon SVG Component
  const GoogleIcon = ({ size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </Svg>
  );

  useEffect(() => {
    checkBiometricAvailability();
    loadRememberedCredentials();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignInSuccess(response.authentication);
    }
  }, [response]);

  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      setHasBiometric(true);

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    }
  };

  const loadRememberedCredentials = async () => {
    try {
      const rememberedEmail = await AsyncStorage.getItem('@remembered_email');
      const rememberMe = await AsyncStorage.getItem('@remember_me');

      if (rememberedEmail && rememberMe === 'true') {
        setFormData(prev => ({
          ...prev,
          email: rememberedEmail,
          rememberMe: true,
        }));
      }
    } catch (error) {
      console.error('Error loading remembered credentials:', error);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email) {
      newErrors.email = 'כתובת אימייל נדרשת';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    if (!formData.password) {
      newErrors.password = 'סיסמה נדרשת';
    } else if (formData.password.length < 6) {
      newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRememberCredentials = async () => {
    try {
      if (formData.rememberMe) {
        await AsyncStorage.setItem('@remembered_email', formData.email);
        await AsyncStorage.setItem('@remember_me', 'true');
      } else {
        await AsyncStorage.removeItem('@remembered_email');
        await AsyncStorage.removeItem('@remember_me');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    // Prevent double-tap during loading
    if (isLoading) return;

    setIsLoading(true);
    try {
      await handleRememberCredentials();

      // Use auth context to sign in (supports DEV users)
      const { error, profile: userProfile } = await signIn(formData.email, formData.password);
      
      if (error) {
        // Check if this is a profile not found error
        if (error.message === 'User profile not found in database') {
          Alert.alert(
            'שגיאה',
            'פרופיל המשתמש לא נמצא במערכת. אנא צור קשר עם התמיכה.'
          );
        } else {
          Alert.alert('שגיאה', 'כתובת אימייל או סיסמה שגויים');
        }
        setIsLoading(false);
        return;
      }

      // Check if profile exists
      if (!userProfile) {
        console.warn('⚠️ User signed in but no profile found - cannot redirect');
        Alert.alert(
          'שגיאה',
          'פרופיל המשתמש לא נמצא במערכת. אנא צור קשר עם התמיכה.'
        );
        setIsLoading(false);
        return;
      }

      // Redirect based on role (post-login navigation)
      redirectPostLogin(userProfile);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('שגיאה', 'כתובת אימייל או סיסמה שגויים');
      setIsLoading(false); // Only set loading false on error
    }
    // Note: setIsLoading(false) is NOT called here on success
    // Loading will be cleared after navigation by the new screen
  };

  /**
   * Post-login redirect based on user role
   * Teacher → /(teacher) (Teacher Home)
   * Student/Default → /(tabs) (Student Home)
   * 
   * @param userProfile - Profile returned from signIn (preferred) or from context
   */
  const redirectPostLogin = (userProfile?: Profile | null) => {
    try {
      // Use profile from signIn result (preferred) or fall back to context
      const userRole = userProfile?.role || profile?.role;

      console.log('🔄 Post-login redirect - Role:', userRole);

      if (userRole === 'teacher') {
        console.log('✅ Redirecting to Teacher Home');
        router.replace('/(teacher)');
      } else {
        console.log('✅ Redirecting to Student Home (default)');
        router.replace('/(tabs)');
      }
      
      // Note: setIsLoading(false) is handled by navigation
    } catch (error) {
      console.warn('⚠️ Error in post-login redirect, defaulting to Student Home:', error);
      // Fallback to student home on any error
      router.replace('/(tabs)');
    } finally {
      // Ensure loading is cleared after redirect
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  // DEV mode removed

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `התחבר באמצעות ${biometricType}`,
        cancelLabel: 'ביטול',
        disableDeviceFallback: true, // This prevents passcode fallback
        requireConfirmation: false,
      });

      if (result.success) {
        // TODO: Implement biometric auth with backend
        // For now, redirect to student home (most common case)
        // In production, this should fetch the user's profile and redirect accordingly
        redirectPostLogin();
      } else if (result.error === 'user_cancel') {
        // User cancelled, don't show error
        return;
      } else {
        Alert.alert('שגיאה', 'האימות הביומטרי נכשל');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה באימות הביומטרי');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential) {
        console.log('Apple sign in successful:', credential);
        // TODO: Implement Apple auth with backend
        // For now, redirect to student home (most common case)
        // In production, this should fetch the user's profile and redirect accordingly
        redirectPostLogin();
      }
    } catch (error: any) {
      if (error.code === 'ERR_CANCELLED') {
        return;
      }
      console.error('Apple sign in error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהתחברות עם Apple');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהתחברות עם Google');
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async (authentication: any) => {
    try {
      console.log('Google sign in successful:', authentication);
      // TODO: Implement Google auth with backend
      // For now, redirect to student home (most common case)
      // In production, this should fetch the user's profile and redirect accordingly
      redirectPostLogin();
    } catch (error) {
      console.error('Google sign in processing error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעיבוד התחברות Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'שכחת סיסמה?',
      'נשלח לך קישור לאיפוס סיסמה למייל שלך',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'שלח', onPress: () => console.log('Reset password email sent') },
      ]
    );
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft
                size={24}
                color="#374151"
                style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
              />
            </TouchableOpacity>
          </View>

          {/* App Logo/Name */}
          <View style={styles.logoSection}>
            <Text style={styles.appName}>SkillUp</Text>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>ברוכים השבים</Text>
            <Text style={styles.welcomeSubtitle}>הזינו את הפרטים שלכם כדי להתחבר</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <View style={[
                styles.inputContainer,
                errors.email && styles.inputError,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  style={[styles.input, styles.inputWithIcon, { textAlign: getTextAlign() }]}
                  placeholder="כתובת אימייל"
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.email && (
                <Text style={[styles.errorText, { textAlign: getTextAlign() }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
            <View
              style={[
                 styles.passwordContainer,errors.password && styles.inputError,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput, { textAlign: getTextAlign() }]}
                  placeholder="סיסמה"
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={{
                    padding: 0,
                    marginStart: 0,
                  }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, { textAlign: getTextAlign() }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>התחברות</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password & Remember Me Row */}
            <View style={[styles.optionsRow, { flexDirection: getFlexDirection() }]}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>שכחתי סיסמה?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rememberMeContainer, { flexDirection: getFlexDirection() }]}
                onPress={() => updateFormData('rememberMe', !formData.rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  formData.rememberMe && styles.checkboxChecked,
                  { marginLeft: isRTL ? 8 : 0, marginRight: isRTL ? 0 : 8 }
                ]}>
                  {formData.rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.rememberMeText}>זכור אותי</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Login Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>או התחבר עם</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            {/* Biometric Button */}
            {hasBiometric && (
              <TouchableOpacity
                style={[styles.socialButton, styles.biometricButton]}
                onPress={handleBiometricAuth}
                disabled={biometricLoading}
                activeOpacity={0.7}
              >
                {biometricLoading ? (
                  <ActivityIndicator color="#4F46E5" size="small" />
                ) : (
                  <>
                    {biometricType.includes('Face') ? (
                      <Smartphone size={20} color="#4F46E5" />
                    ) : (
                      <Fingerprint size={20} color="#4F46E5" />
                    )}
                    <Text style={styles.biometricButtonText}>{biometricType}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Apple Button */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={appleLoading}
                activeOpacity={0.7}
              >
                {appleLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <AppleIcon size={20} color="#FFFFFF" />
                    <Text style={styles.appleButtonText}>התחבר עם Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.7}
            >
              {googleLoading ? (
                <ActivityIndicator color="#1F2937" size="small" />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <Text style={styles.googleButtonText}>התחבר עם Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={[styles.signupContainer, { flexDirection: getFlexDirection() }]}>
            <Text style={styles.signupText}>אין לכם חשבון?{' '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
              <Text style={styles.signupLink}> הרשמה</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingStart: 16,
    paddingEnd: 16,
    height: 52,
    backgroundColor: '#F9FAFB',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  inputWithIcon: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginStart: 16,
    marginEnd: 0,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingStart: 16,
    paddingEnd: 16,
    height: 52,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  rememberMeContainer: {
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,    // Keep same space below
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  socialContainer: {
    marginBottom: 15,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  biometricButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  socialIconButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  signupContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});