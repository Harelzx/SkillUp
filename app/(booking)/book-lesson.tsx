import { useState, useMemo, useRef, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { X, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { BookingData, BookingStep } from '@/types/booking';
import { BookingStepper } from '@/components/booking/BookingStepper';
import { BookingStep1 } from '@/components/booking/BookingStep1';
import { BookingStep2 } from '@/components/booking/BookingStep2';
import { BookingStep3 } from '@/components/booking/BookingStep3';
import { BookingStep4 } from '@/components/booking/BookingStep4';
import { BookingStep5, type PaymentMethod } from '@/components/booking/BookingStep5';
import { useQueryClient } from '@tanstack/react-query';
import { useTeacherBookingData } from '@/hooks/useTeacherBookingData';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useTeacherBookingRealtime } from '@/hooks/useTeacherBookingRealtime';
import { useCredits } from '@/context/CreditsContext';

export default function BookLessonScreen() {
  const router = useRouter();
  const { teacherId: rawTeacherId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { credits: availableCredits, refetchCredits } = useCredits();

  // Convert teacherId from array to string if needed
  const teacherId = Array.isArray(rawTeacherId) ? rawTeacherId[0] : rawTeacherId;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Idempotency: prevent double-booking on multiple clicks
  const idempotencyKeyRef = useRef<string | null>(null);
  const bookingAttemptedRef = useRef(false);
  
  // Track previous teacherId to detect changes
  const previousTeacherIdRef = useRef<string | undefined>(undefined);

  const [bookingData, setBookingData] = useState<BookingData>({
    subject: '',
    lessonType: 'online',
    duration: 60,
    studentLevelCategory: undefined,
    studentLevelProficiency: undefined,
    notes: '',
    date: undefined,
    timeSlot: undefined,
    address: undefined,
    savedAddressId: undefined,
    useCredits: false,
    couponCode: '',
    agreedToTerms: false,
  });

  // Payment method selection (Step 5)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // Fetch teacher data
  const {
    data: teacher,
    isLoading: isLoadingTeacher,
    error: teacherError,
  } = useTeacherBookingData(teacherId);

  // Fetch availability data
  const {
    data: availability,
    isLoading: isLoadingAvailability,
  } = useTeacherAvailability(teacherId);

  // Set up realtime subscriptions for availability and profile updates
  useTeacherBookingRealtime({
    teacherId,
    enabled: !!teacherId,
  });

  // Reset booking state when teacher changes
  useEffect(() => {
    if (teacherId && teacherId !== previousTeacherIdRef.current) {
      // Teacher changed - reset all booking data
      setBookingData({
        subject: '',
        lessonType: 'online',
        duration: 60,
        studentLevelCategory: undefined,
        studentLevelProficiency: undefined,
        notes: '',
        date: undefined,
        timeSlot: undefined,
        address: undefined,
        savedAddressId: undefined,
        useCredits: false,
        couponCode: '',
        agreedToTerms: false,
      });
      setCurrentStep(1);
      setErrors({});
      setSelectedPaymentMethod(null);
      idempotencyKeyRef.current = null;
      bookingAttemptedRef.current = false;
      previousTeacherIdRef.current = teacherId;
    }
  }, [teacherId]);

  // Define steps (5 steps total)
  const steps: BookingStep[] = [
    { number: 1, title: 'פרטים', isComplete: currentStep > 1, isActive: currentStep === 1 },
    { number: 2, title: 'מועד', isComplete: currentStep > 2, isActive: currentStep === 2 },
    { number: 3, title: 'מיקום', isComplete: currentStep > 3, isActive: currentStep === 3 },
    { number: 4, title: 'סיכום', isComplete: currentStep > 4, isActive: currentStep === 4 },
    { number: 5, title: 'תשלום', isComplete: currentStep > 5, isActive: currentStep === 5 },
  ];

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData({ ...bookingData, ...updates });
    // Clear related errors
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => delete newErrors[key]);
    setErrors(newErrors);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!bookingData.subject) {
          newErrors.subject = 'נא לבחור נושא';
        } else if (teacher) {
          // Validate subject is in teacher's subjects
          const teacherSubjects = teacher.subjects.map(s => s.name_he);
          if (!teacherSubjects.includes(bookingData.subject)) {
            newErrors.subject = 'הנושא שנבחר אינו מוגדר למורה זה';
          }
        }
        
        if (!bookingData.lessonType) {
          newErrors.lessonType = 'נא לבחור סוג שיעור';
        } else if (teacher) {
          // Validate lesson type is supported
          if (!teacher.lesson_modes.includes(bookingData.lessonType as any)) {
            newErrors.lessonType = 'סוג השיעור שנבחר אינו נתמך על ידי המורה';
          }
        }
        
        if (!bookingData.duration) {
          newErrors.duration = 'נא לבחור משך שיעור';
        } else if (teacher?.duration_options) {
          // Validate duration is allowed
          if (!teacher.duration_options.includes(bookingData.duration)) {
            newErrors.duration = 'משך השיעור שנבחר אינו זמין';
          }
        }

        if (!bookingData.studentLevelCategory) {
          newErrors.studentLevelCategory = 'נא לבחור קטגוריית גיל';
        }
        if (!bookingData.studentLevelProficiency) {
          newErrors.studentLevelProficiency = 'נא לבחור רמת מיומנות';
        }
        break;

      case 2:
        if (!bookingData.date) newErrors.date = 'נא לבחור תאריך';
        if (!bookingData.timeSlot) newErrors.timeSlot = 'נא לבחור שעה';
        break;

      case 3:
        if (bookingData.lessonType === 'student_location') {
          if (!bookingData.savedAddressId && !bookingData.address) {
            newErrors.address = 'נא למלא כתובת';
          }
        }
        break;

      case 4:
        // Summary - must agree to terms
        if (!bookingData.agreedToTerms) {
          newErrors.agreedToTerms = 'יש להסכים לתנאי השימוש';
        }
        break;

      case 5:
        // Payment - validate payment method if needed
        const hourlyRate = teacher?.hourly_rate || 150;
        const totalPrice = hourlyRate * (bookingData.duration / 60);
        const creditsToApply = bookingData.useCredits ? Math.min(availableCredits, totalPrice) : 0;
        const amountToPay = totalPrice - creditsToApply;
        
        // If payment needed and no method selected
        if (amountToPay > 0 && !selectedPaymentMethod) {
          newErrors.paymentMethod = 'נא לבחור אמצעי תשלום';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.debug('[Booking] Step', currentStep, '-> attempting next');
    
    if (!validateStep(currentStep)) {
      console.debug('[Booking] Step', currentStep, '-> validation failed');
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      console.debug('[Booking] Step', currentStep, '-> success, moving to', currentStep + 1);
    } else {
      // Step 5 = final step, create booking
      handleConfirm();
    }
  };

  const handleBack = () => {
    console.debug('[Booking] Step', currentStep, '-> back');
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    console.debug('[Booking] Cancelled at step', currentStep);
    
    Alert.alert(
      'ביטול הזמנה',
      'האם אתה בטוח שברצונך לבטל את ההזמנה?',
      [
        { text: 'המשך בהזמנה', style: 'cancel' },
        { 
          text: 'בטל הזמנה', 
          style: 'destructive',
          onPress: () => router.back()
        },
      ]
    );
  };

  const handleConfirm = async () => {
    console.debug('[Booking] Confirming booking:', bookingData);
    
    // Prevent double-booking
    if (bookingAttemptedRef.current && idempotencyKeyRef.current) {
      console.warn('[Booking] Attempt already in progress, ignoring duplicate click');
      return;
    }

    setIsLoading(true);
    bookingAttemptedRef.current = true;

    // Generate idempotency key if not exists
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `booking_${String(teacherId)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      // Import the API function
      const { createBooking } = await import('@/services/api/bookingsAPI');

      if (!bookingData.date || !bookingData.timeSlot) {
        throw new Error('נתונים חסרים. אנא מלא את כל השלבים.');
      }

      // Convert timeSlot to ISO format with timezone
      // Assume bookingData.timeSlot is already ISO or convert it
      let startAtISO = bookingData.timeSlot;
      
      // If timeSlot is not ISO, construct it from date + time
      if (!bookingData.timeSlot.includes('T')) {
        const dateObj = new Date(bookingData.date);
        // Assume timeSlot is something like "10:00"
        const [hours, minutes] = bookingData.timeSlot.split(':').map(Number);
        dateObj.setHours(hours, minutes, 0, 0);
        startAtISO = dateObj.toISOString();
      }

      console.debug('[Booking] Sending request with idempotency key:', idempotencyKeyRef.current);

      // Calculate amounts
      const hourlyRate = teacher?.hourly_rate || 150;
      const totalPrice = hourlyRate * (bookingData.duration / 60);
      const creditsToApply = bookingData.useCredits ? Math.min(availableCredits, totalPrice) : 0;
      const amountToPay = totalPrice - creditsToApply;

      // Determine payment method
      const paymentMethod = amountToPay === 0 ? 'credits' : (selectedPaymentMethod || 'card');

      // Prepare booking parameters
      const result = await createBooking({
        teacherId: String(teacherId),
        subject: bookingData.subject,
        mode: bookingData.lessonType,
        durationMinutes: bookingData.duration,
        startAt: startAtISO,
        timezone: 'Asia/Jerusalem',
        notes: bookingData.notes || undefined,
        location: bookingData.address || undefined,
        studentLevelCategory: bookingData.studentLevelCategory!,
        studentLevelProficiency: bookingData.studentLevelProficiency!,
        creditsToApply,
        couponCode: bookingData.couponCode || undefined,
        source: 'mobile',
        paymentMethod,
      });

      console.debug('[Booking] Success!', result);

      // Optimistic UI: Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-slots', teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-availability', teacherId] });
      queryClient.invalidateQueries({ queryKey: ['student-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      // Invalidate teacher's upcoming lessons so they appear immediately
      queryClient.invalidateQueries({ queryKey: ['teacher', teacherId, 'upcomingLessons'] });

      // Refetch credits from DB to update the balance
      console.log('🔄 [Booking] Refetching credits after booking...');
      await refetchCredits();
      
      // Navigate back to home - the notification toast will show the success message
      // The notification from the database (BOOKING_CONFIRMED) will be displayed automatically
      router.push('/(tabs)/' as any);

      // Reset refs for potential future bookings
      idempotencyKeyRef.current = null;
      bookingAttemptedRef.current = false;

    } catch (error: any) {
      console.error('[Booking] Error:', error);
      
      // Reset attempt flag to allow retry
      bookingAttemptedRef.current = false;
      
      // User-friendly error messages
      let errorMessage = 'אירעה שגיאה לא צפויה. אנא נסה שוב.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === '23505') {
        errorMessage = 'השעה הזו כבר תפוסה. אנא בחר שעה אחרת.';
      } else if (error?.code === '53000') {
        errorMessage = 'התשלום נכשל. אנא נסה שוב או בחר באמצעי תשלום אחר.';
      } else if (error?.code === '22000') {
        errorMessage = 'נתונים לא תקינים. אנא בדוק את הפרטים ונסה שוב.';
      } else if (error?.code === '42501') {
        errorMessage = 'אין הרשאה לבצע פעולה זו.';
      }
      
      Alert.alert(
        'שגיאה בהזמנה',
        errorMessage,
        [
          { 
            text: 'נסה שוב',
            onPress: () => {
              // Keep the same idempotency key for retry
              // This allows the user to retry with the same request
            }
          },
          {
            text: 'ביטול',
            style: 'cancel',
            onPress: () => {
              // Reset idempotency key on cancel
              idempotencyKeyRef.current = null;
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (!teacher) return null;

    switch (currentStep) {
      case 1:
        return (
          <BookingStep1
            data={bookingData}
            availableSubjects={teacher.subjects.map(s => s.name_he)}
            availableModes={teacher.lesson_modes}
            availableDurations={teacher.duration_options || [45, 60, 90]}
            onChange={updateBookingData}
            errors={errors}
          />
        );
      case 2:
        return (
          <BookingStep2
            data={bookingData}
            teacherId={teacherId!}
            availability={availability}
            onChange={updateBookingData}
            errors={errors}
          />
        );
      case 3:
        return (
          <BookingStep3
            data={bookingData}
            teacherLocation={teacher.location}
            teacherAreas={teacher.areas}
            onChange={updateBookingData}
            errors={errors}
          />
        );
      case 4:
        return (
          <BookingStep4
            data={bookingData}
            teacher={teacher}
            onChange={updateBookingData}
            errors={errors}
          />
        );
      case 5:
        return (
          <BookingStep5
            data={bookingData}
            teacher={teacher}
            availableCredits={availableCredits}
            onChange={updateBookingData}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodSelect={setSelectedPaymentMethod}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const buttonText = useMemo(() => {
    if (currentStep === 4) return 'המשך לתשלום';
    if (currentStep === 5) {
      // Calculate if fully covered by credits
      const hourlyRate = teacher?.hourly_rate || 150;
      const totalPrice = hourlyRate * (bookingData.duration / 60);
      const creditsToApply = bookingData.useCredits ? Math.min(availableCredits, totalPrice) : 0;
      const amountToPay = totalPrice - creditsToApply;
      
      return amountToPay === 0 ? 'סיים הזמנה' : 'אשר ושלם';
    }
    return 'המשך';
  }, [currentStep, bookingData.duration, bookingData.useCredits, teacher]);

  // Loading state
  if (isLoadingTeacher || isLoadingAvailability) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50], justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[4] }}>
          טוען נתוני מורה...
        </Typography>
      </SafeAreaView>
    );
  }

  // Error state
  if (teacherError || !teacher) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50], justifyContent: 'center', alignItems: 'center', padding: spacing[4] }}>
        <Typography variant="h5" weight="bold" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
          שגיאה בטעינת נתונים
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          {teacherError?.message || 'לא ניתן לטעון את נתוני המורה'}
        </Typography>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary[600],
            paddingHorizontal: spacing[6],
            paddingVertical: spacing[3],
            borderRadius: 12,
          }}
        >
          <Typography variant="body1" weight="bold" color="white">
            חזור
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Check if teacher is active
  if (!teacher.is_active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50], justifyContent: 'center', alignItems: 'center', padding: spacing[4] }}>
        <Typography variant="h5" weight="bold" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
          המורה אינו פעיל כעת
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          לא ניתן להזמין שיעור עם מורה זה כרגע
        </Typography>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary[600],
            paddingHorizontal: spacing[6],
            paddingVertical: spacing[3],
            borderRadius: 12,
          }}
        >
          <Typography variant="body1" weight="bold" color="white">
            חזור
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Check if teacher has subjects
  if (!teacher.subjects || teacher.subjects.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50], justifyContent: 'center', alignItems: 'center', padding: spacing[4] }}>
        <Typography variant="h5" weight="bold" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
          המורה לא הגדיר נושאי הוראה
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          לא ניתן להזמין שיעור כרגע
        </Typography>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary[600],
            paddingHorizontal: spacing[6],
            paddingVertical: spacing[3],
            borderRadius: 12,
          }}
        >
          <Typography variant="body1" weight="bold" color="white">
            חזור
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
      }}>
        <TouchableOpacity onPress={handleClose} style={{ padding: spacing[2] }}>
          <X size={24} color={colors.gray[700]} />
        </TouchableOpacity>

        <Typography variant="h6" weight="semibold">
          הזמנת שיעור
        </Typography>

        <TouchableOpacity 
          onPress={handleBack}
          disabled={currentStep === 1}
          style={{ 
            padding: spacing[2],
            opacity: currentStep === 1 ? 0.3 : 1,
          }}
        >
          <ArrowRight size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <BookingStepper
        steps={steps}
        currentStep={currentStep}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderStep()}
      </View>

      {/* Bottom Action */}
      <View style={{
        backgroundColor: colors.white,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
      }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? colors.gray[300] : colors.primary[600],
            paddingVertical: spacing[4],
            borderRadius: 12,
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Typography variant="body1" weight="bold" color="white">
                {buttonText}
              </Typography>
              <ArrowLeft size={20} color={colors.white} style={{ marginLeft: spacing[2] }} />
            </>
          )}
        </TouchableOpacity>

        {/* Step indicator */}
        <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing[2] }}>
          שלב {String(currentStep)} מתוך 5
        </Typography>
      </View>
    </SafeAreaView>
  );
}

