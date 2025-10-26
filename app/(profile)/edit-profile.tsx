import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  Camera,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Coins,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useCredits } from '@/context/CreditsContext';
import { useAuth } from '@/features/auth/auth-context';
import { getStudentProfile, updateStudentProfile, uploadStudentAvatar, type StudentProfileUpdate } from '@/services/api';

const popularSubjects = [
  'מתמטיקה', 'אנגלית', 'פיזיקה', 'כימיה', 'היסטוריה',
  'מוזיקה', 'אמנות', 'תכנות', 'יוגה', 'פילאטיס',
  'חדו״א', 'סטטיסטיקה', 'כלכלה'
];

const cities = [
  'תל אביב', 'רמת גן', 'ירושלים', 'חיפה', 'באר שבע',
  'פתח תקווה', 'נתניה', 'רעננה', 'הרצליה', 'כפר סבא'
];

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  const { credits } = useCredits();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('תל אביב');
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch student profile
  const { data: studentData, isLoading: loadingProfile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => getStudentProfile(user!.id),
    enabled: !!user,
  });

  // Populate form from fetched data
  useEffect(() => {
    if (studentData) {
      setFirstName(studentData.firstName || '');
      setLastName(studentData.lastName || '');
      setEmail(studentData.email || '');
      setPhone(studentData.phone || '');
      setAge(studentData.birthYear?.toString() || '');
      setCity(studentData.city || 'תל אביב');
      setBio(studentData.bio || '');
      setSelectedSubjects(studentData.subjectsInterests || []);
      setAvatar(studentData.avatarUrl || null);
    }
  }, [studentData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: StudentProfileUpdate) => updateStudentProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile', user?.id] });
      showToast('הפרופיל עודכן בהצלחה');
      setTimeout(() => {
        router.back();
      }, 1500);
    },
    onError: (error: any) => {
      Alert.alert('שגיאה', error.message || 'אירעה שגיאה בעדכון הפרופיל');
    },
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^0[0-9]{1,2}-?[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!firstName.trim()) newErrors.firstName = 'שם פרטי הוא שדה חובה';
    if (!lastName.trim()) newErrors.lastName = 'שם משפחה הוא שדה חובה';
    if (!email.trim()) newErrors.email = 'דוא"ל הוא שדה חובה';
    else if (!validateEmail(email)) newErrors.email = 'כתובת דוא"ל לא תקינה';
    if (!phone.trim()) newErrors.phone = 'טלפון הוא שדה חובה';
    else if (!validatePhone(phone)) newErrors.phone = 'מספר טלפון לא תקין';
    if (bio.length > 200) newErrors.bio = 'התיאור ארוך מדי (מקסימום 200 תווים)';
    if (!city) newErrors.city = 'עיר היא שדה חובה';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user) return;

    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone,
      birthYear: age ? parseInt(age) : undefined,
      city: city.trim(),
      bio: bio.trim(),
      subjectsInterests: selectedSubjects,
      avatarUrl: avatar || undefined,
    });
  };

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
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
    } as ImageStyle,
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
    subjectsGrid: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    subjectChip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.gray[300],
      backgroundColor: colors.white,
    },
    subjectChipSelected: {
      backgroundColor: colors.primary[600],
      borderColor: colors.primary[600],
    },
    infoRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: colors.blue[50],
      padding: spacing[3],
      borderRadius: 12,
      marginBottom: spacing[4],
      gap: spacing[2],
    },
    actions: {
      flexDirection: getFlexDirection(),
      gap: spacing[3],
      marginTop: spacing[6],
      marginBottom: spacing[8],
    },
    toast: {
      position: 'absolute',
      bottom: spacing[8],
      left: spacing[4],
      right: spacing[4],
      backgroundColor: colors.green[600],
      padding: spacing[4],
      borderRadius: 12,
      alignItems: 'center',
    },
  });

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[3] }}>
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowRight
            size={20}
            color={colors.gray[700]}
            style={{ transform: [{ rotate: isRTL ? '0deg' : '180deg' }] }}
          />
          <Typography variant="h5" weight="semibold" style={{ marginHorizontal: spacing[2] }}>
            ערוך פרופיל
          </Typography>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage as any} resizeMode="cover" />
              ) : (
                <User size={40} color={colors.white} />
              )}
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Row - Read Only */}
        <View style={styles.infoRow}>
          <Coins size={18} color={colors.blue[600]} />
          <Typography variant="body2" color="text">
            קרדיטים: {credits.toFixed(0)} ₪ • סוג פרופיל: תלמיד
          </Typography>
        </View>

        {/* First Name */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            שם פרטי <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (errors.firstName) setErrors({...errors, firstName: ''});
            }}
            placeholder="הכנס שם פרטי"
            placeholderTextColor={colors.gray[400]}
          />
          {errors.firstName && (
            <Typography style={styles.errorText}>{errors.firstName}</Typography>
          )}
        </View>

        {/* Last Name */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            שם משפחה <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (errors.lastName) setErrors({...errors, lastName: ''});
            }}
            placeholder="הכנס שם משפחה"
            placeholderTextColor={colors.gray[400]}
          />
          {errors.lastName && (
            <Typography style={styles.errorText}>{errors.lastName}</Typography>
          )}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            דוא"ל <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({...errors, email: ''});
            }}
            placeholder="example@email.com"
            placeholderTextColor={colors.gray[400]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Typography style={styles.errorText}>{errors.email}</Typography>
          )}
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            טלפון <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors({...errors, phone: ''});
            }}
            placeholder="050-123-4567"
            placeholderTextColor={colors.gray[400]}
            keyboardType="phone-pad"
          />
          {errors.phone && (
            <Typography style={styles.errorText}>{errors.phone}</Typography>
          )}
        </View>

        {/* Age */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            גיל
          </Typography>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="הכנס גיל"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
          />
        </View>

        {/* City */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            עיר <Typography style={{ color: colors.red[500] }}>*</Typography>
          </Typography>
          <View style={[styles.input, { paddingVertical: 0 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: spacing[2], paddingVertical: spacing[2] }}>
                {cities.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCity(c)}
                    style={{
                      paddingHorizontal: spacing[3],
                      paddingVertical: spacing[1],
                      borderRadius: 16,
                      backgroundColor: city === c ? colors.primary[600] : colors.gray[100],
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{ color: city === c ? colors.white : colors.gray[700] }}
                    >
                      {c}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          {errors.city && (
            <Typography style={styles.errorText}>{errors.city}</Typography>
          )}
        </View>

        {/* Subjects */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            מה תרצה ללמוד?
          </Typography>
          <View style={styles.subjectsGrid}>
            {popularSubjects.map(subject => (
              <TouchableOpacity
                key={subject}
                onPress={() => toggleSubject(subject)}
                style={[
                  styles.subjectChip,
                  selectedSubjects.includes(subject) && styles.subjectChipSelected
                ]}
              >
                <Typography
                  variant="body2"
                  style={{
                    color: selectedSubjects.includes(subject) ? colors.white : colors.gray[700]
                  }}
                >
                  {subject}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <Typography variant="body2" weight="semibold" style={styles.label}>
            תיאור קצר
          </Typography>
          <TextInput
            style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              if (errors.bio && text.length <= 200) setErrors({...errors, bio: ''});
            }}
            placeholder="ספר קצת על עצמך..."
            placeholderTextColor={colors.gray[400]}
            multiline
            maxLength={200}
          />
          <Typography
            variant="caption"
            color={bio.length > 200 ? 'error' : 'textSecondary'}
            style={styles.charCount}
          >
            {bio.length}/200
          </Typography>
          {errors.bio && (
            <Typography style={styles.errorText}>{errors.bio}</Typography>
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
            disabled={updateMutation.isPending}
          >
            <Typography variant="body1" weight="semibold" style={{ color: colors.gray[700] }}>
              ביטול
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSave}
            style={{
              flex: 1,
              backgroundColor: updateMutation.isPending ? colors.primary[400] : colors.primary[600],
              paddingVertical: spacing[3],
              borderRadius: 12,
              alignItems: 'center',
              minHeight: 48,
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Typography variant="body1" weight="semibold" style={{ color: colors.white }}>
                שמור שינויים
              </Typography>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <Typography variant="body1" color="white" weight="semibold">
            {toastMessage}
          </Typography>
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

