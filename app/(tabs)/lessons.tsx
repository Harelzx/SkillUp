import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  CreditCard,
  Coins,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { Button, ButtonText } from '@gluestack-ui/themed';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useCredits } from '@/context/CreditsContext';

interface Lesson {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  isOnline: boolean;
  cancelledAt?: string;
}

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

type RefundMethod = 'card' | 'credits';

export default function LessonsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection, isRTL } = useRTL();
  const { addCredits } = useCredits();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  
  // Modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<RefundMethod | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock lessons data - using state so we can update it
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: '1',
      teacherId: '1',
      teacherName: 'ד"ר שרה כהן',
      subject: 'מתמטיקה',
      date: '2024-02-20',
      time: '17:00',
      status: 'upcoming',
      price: 120,
      isOnline: true,
    },
    {
      id: '2',
      teacherId: '2',
      teacherName: 'דוד לוי',
      subject: 'אנגלית',
      date: '2024-02-25',
      time: '19:00',
      status: 'upcoming',
      price: 100,
      isOnline: false,
    },
    {
      id: '3',
      teacherId: '3',
      teacherName: 'רחל מור',
      subject: 'פיזיקה',
      date: '2024-01-15',
      time: '16:00',
      status: 'completed',
      price: 150,
      isOnline: true,
    },
  ]);

  // Mock teacher availability
  const mockAvailability: TimeSlot[] = [
    { date: '2024-02-22', time: '10:00', available: true },
    { date: '2024-02-22', time: '14:00', available: true },
    { date: '2024-02-23', time: '11:00', available: true },
    { date: '2024-02-23', time: '15:00', available: true },
    { date: '2024-02-24', time: '09:00', available: true },
    { date: '2024-02-24', time: '16:00', available: true },
  ];

  const upcomingLessons = lessons.filter(lesson => lesson.status === 'upcoming');
  const pastLessons = lessons.filter(lesson => lesson.status !== 'upcoming');

  const getStatusColor = (status: Lesson['status']) => {
    switch (status) {
      case 'upcoming':
        return colors.blue[600];
      case 'completed':
        return colors.green[600];
      case 'cancelled':
        return colors.red[600];
      default:
        return colors.gray[600];
    }
  };

  const getStatusIcon = (status: Lesson['status']) => {
    switch (status) {
      case 'upcoming':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle cancel lesson
  const handleCancelLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedRefundMethod(null);
    setCancelModalVisible(true);
  };

  // Process cancellation
  const processCancellation = async () => {
    if (!selectedLesson || !selectedRefundMethod) return;

    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update lesson status
      setLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === selectedLesson.id
            ? { ...lesson, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
            : lesson
        )
      );

      // Add credits if refund method is credits
      if (selectedRefundMethod === 'credits') {
        addCredits(selectedLesson.price);
      }

      const refundText = selectedRefundMethod === 'card' ? 'לכרטיס' : 'בקרדיטים';
      showToast(`השיעור בוטל בהצלחה. ההחזר ${refundText} בוצע`);
      setCancelModalVisible(false);
      setSelectedLesson(null);
      setSelectedRefundMethod(null);
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בביטול השיעור. נסה שוב.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reschedule lesson
  const handleRescheduleLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedTimeSlot(null);
    setRescheduleModalVisible(true);
  };

  // Process reschedule
  const processReschedule = async () => {
    if (!selectedLesson || !selectedTimeSlot) return;

    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update lesson date and time
      setLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === selectedLesson.id
            ? { ...lesson, date: selectedTimeSlot.date, time: selectedTimeSlot.time }
            : lesson
        )
      );

      showToast('המועד עודכן בהצלחה');
      setRescheduleModalVisible(false);
      setSelectedLesson(null);
      setSelectedTimeSlot(null);
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון המועד. נסה שוב.');
    } finally {
      setIsProcessing(false);
    }
  };

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      padding: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    tabsContainer: {
      marginTop: spacing[4],
    },
    tab: {
      flex: 1,
      paddingVertical: spacing[3],
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary[600],
    },
    content: {
      flex: 1,
      padding: spacing[4],
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing[8],
    },
    lessonCard: {
      marginBottom: spacing[3],
    },
    lessonHeader: {
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing[3],
    },
    statusBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: 12,
      alignItems: 'center',
    },
    lessonInfo: {
      gap: spacing[2],
    },
    infoRow: {
      alignItems: 'center',
      gap: spacing[2],
    },
    actions: {
      marginTop: spacing[3],
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
    },
    addButton: {
      position: 'absolute',
      bottom: spacing[4],
      right: spacing[4],
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary[600],
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[4],
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: spacing[5],
      width: '100%',
      maxWidth: 400,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      marginBottom: spacing[4],
    },
    closeButton: {
      position: 'absolute',
      top: spacing[1],
      left: isRTL ? undefined : spacing[1],
      right: isRTL ? spacing[1] : undefined,
      padding: spacing[2],
      zIndex: 1,
    },
    refundOption: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      padding: spacing[4],
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.gray[200],
      marginBottom: spacing[3],
    },
    refundOptionSelected: {
      borderColor: colors.primary[600],
      backgroundColor: colors.primary[50],
    },
    refundOptionContent: {
      flex: 1,
      marginHorizontal: spacing[3],
    },
    timeSlot: {
      padding: spacing[3],
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.gray[200],
      marginBottom: spacing[2],
      alignItems: 'center',
    },
    timeSlotSelected: {
      borderColor: colors.primary[600],
      backgroundColor: colors.primary[50],
    },
    toast: {
      position: 'absolute',
      bottom: spacing[8],
      left: spacing[4],
      right: spacing[4],
      backgroundColor: colors.green[600],
      padding: spacing[4],
      borderRadius: 12,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  });

  const handleBookNewLesson = () => {
    router.push('/(tabs)/search');
  };

  const renderLesson = (lesson: Lesson) => {
    const StatusIcon = getStatusIcon(lesson.status);
    const statusColor = getStatusColor(lesson.status);

    return (
      <Card key={lesson.id} style={styles.lessonCard}>
        <CardContent>
          <View style={[styles.lessonHeader, { flexDirection: getFlexDirection() }]}>
            <View style={{ flex: 1 }}>
              <Typography variant="h5" weight="semibold">
                {lesson.teacherName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {lesson.subject}
              </Typography>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
                <StatusIcon size={14} color={statusColor} />
                <Typography variant="caption" style={{ color: statusColor }}>
                  {t(`lessons.status.${lesson.status}`)}
                </Typography>
              </View>
            </View>
          </View>

          <View style={styles.lessonInfo}>
            <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
              <Calendar size={16} color={colors.gray[600]} />
              <Typography variant="body2" color="textSecondary">
                {lesson.date} בשעה {lesson.time}
              </Typography>
            </View>
            <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
              <User size={16} color={colors.gray[600]} />
              <Typography variant="body2" color="textSecondary">
                {lesson.isOnline ? 'שיעור אונליין' : 'שיעור פרונטלי'}
              </Typography>
            </View>
            <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
              <Typography variant="body1" weight="semibold">
                {lesson.price} לשעה
              </Typography>
            </View>
          </View>

          {lesson.status === 'upcoming' && (
            <View style={[styles.actions, { flexDirection: getFlexDirection(), gap: spacing[3] }]}>
              <Button
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  backgroundColor: pressedButton === `reschedule-${lesson.id}` ? '#0056CC' : '#007AFF',
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: pressedButton === `reschedule-${lesson.id}` ? 1 : 2 },
                  shadowOpacity: pressedButton === `reschedule-${lesson.id}` ? 0.3 : 0.2,
                  shadowRadius: pressedButton === `reschedule-${lesson.id}` ? 2 : 4,
                  elevation: pressedButton === `reschedule-${lesson.id}` ? 1 : 3,
                  transform: [{ scale: pressedButton === `reschedule-${lesson.id}` ? 0.98 : 1 }],
                }}
                onPressIn={() => setPressedButton(`reschedule-${lesson.id}`)}
                onPressOut={() => setPressedButton(null)}
                onPress={() => handleRescheduleLesson(lesson)}
              >
                <View style={[{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[1] }]}>
                  <Calendar size={16} color="white" />
                  <ButtonText style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
                    שנה תאריך
                  </ButtonText>
                </View>
              </Button>
              <Button
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: pressedButton === `cancel-${lesson.id}` ? '#DC2626' : '#F87171',
                  backgroundColor: pressedButton === `cancel-${lesson.id}` ? '#FEE2E2' : '#FEF2F2',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ scale: pressedButton === `cancel-${lesson.id}` ? 0.98 : 1 }],
                }}
                onPressIn={() => setPressedButton(`cancel-${lesson.id}`)}
                onPressOut={() => setPressedButton(null)}
                onPress={() => handleCancelLesson(lesson)}
              >
                <ButtonText style={{
                  color: pressedButton === `cancel-${lesson.id}` ? '#B91C1C' : '#DC2626',
                  fontSize: 15,
                  fontWeight: '600'
                }}>
                  ביטול שיעור
                </ButtonText>
              </Button>
            </View>
          )}

          {lesson.status === 'completed' && (
            <View style={styles.actions}>
              <Button
                style={{
                  flex: 1,
                  minHeight: 40,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  backgroundColor: pressedButton === `book-again-${lesson.id}` ? '#0056CC' : '#007AFF',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: pressedButton === `book-again-${lesson.id}` ? 1 : 2 },
                  shadowOpacity: pressedButton === `book-again-${lesson.id}` ? 0.3 : 0.2,
                  shadowRadius: pressedButton === `book-again-${lesson.id}` ? 2 : 3,
                  elevation: pressedButton === `book-again-${lesson.id}` ? 1 : 2,
                  transform: [{ scale: pressedButton === `book-again-${lesson.id}` ? 0.98 : 1 }],
                }}
                onPressIn={() => setPressedButton(`book-again-${lesson.id}`)}
                onPressOut={() => setPressedButton(null)}
                onPress={() => {
                  // Handle book again action
                  console.log('Book again lesson with:', lesson.teacherName);
                }}
              >
                <View style={[{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[1] }]}>
                  <Calendar size={14} color="white" />
                  <ButtonText style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    הזמן שוב
                  </ButtonText>
                </View>
              </Button>
            </View>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={48} color={colors.gray[400]} />
      <Typography variant="h5" weight="semibold" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
        {activeTab === 'upcoming' ? t('lessons.noUpcoming') : t('lessons.noPast')}
      </Typography>
      <Typography variant="body1" color="textSecondary" align="center" style={{ marginBottom: spacing[6] }}>
        {activeTab === 'upcoming'
          ? t('lessons.noUpcomingDescription')
          : t('lessons.noPastDescription')
        }
      </Typography>
      {activeTab === 'upcoming' && (
        <Button onPress={handleBookNewLesson}>
          <ButtonText>{t('lessons.bookFirst')}</ButtonText>
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h3" weight="bold">
          {t('lessons.title')}
        </Typography>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { flexDirection: getFlexDirection() }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Typography
              variant="body1"
              weight={activeTab === 'upcoming' ? 'semibold' : 'normal'}
              color={activeTab === 'upcoming' ? 'primary' : 'textSecondary'}
            >
              שיעורים קרובים
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
          >
            <Typography
              variant="body1"
              weight={activeTab === 'past' ? 'semibold' : 'normal'}
              color={activeTab === 'past' ? 'primary' : 'textSecondary'}
            >
              שיעורים קודמים
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'upcoming' ? (
          upcomingLessons.length > 0 ? (
            upcomingLessons.map(renderLesson)
          ) : (
            renderEmptyState()
          )
        ) : (
          pastLessons.length > 0 ? (
            pastLessons.map(renderLesson)
          ) : (
            renderEmptyState()
          )
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleBookNewLesson}>
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Cancel Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setCancelModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <Typography variant="h4" weight="bold" align="center" style={{ marginBottom: spacing[2] }}>
                  איך תרצה לקבל החזר?
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  בחר את שיטת ההחזר המועדפת עליך
                </Typography>
              </View>

              {/* Refund Options */}
              <TouchableOpacity
                style={[
                  styles.refundOption,
                  selectedRefundMethod === 'card' && styles.refundOptionSelected
                ]}
                onPress={() => setSelectedRefundMethod('card')}
              >
                <CreditCard 
                  size={24} 
                  color={selectedRefundMethod === 'card' ? colors.primary[600] : colors.gray[600]} 
                />
                <View style={styles.refundOptionContent}>
                  <Typography variant="body1" weight="semibold">
                    החזר לכרטיס
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    הכסף יוחזר לכרטיס האשראי תוך 3-5 ימי עסקים
                  </Typography>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.refundOption,
                  selectedRefundMethod === 'credits' && styles.refundOptionSelected
                ]}
                onPress={() => setSelectedRefundMethod('credits')}
              >
                <Coins 
                  size={24} 
                  color={selectedRefundMethod === 'credits' ? colors.primary[600] : colors.gray[600]} 
                />
                <View style={styles.refundOptionContent}>
                  <Typography variant="body1" weight="semibold">
                    החזר בקרדיטים
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    הקרדיטים יתווספו מיד לחשבונך
                  </Typography>
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={{ flexDirection: getFlexDirection(), gap: spacing[2], marginTop: spacing[4] }}>
                <Button
                  style={{ 
                    flex: 1,
                    backgroundColor: colors.gray[200],
                    borderRadius: 8,
                    paddingVertical: spacing[3],
                  }}
                  onPress={() => setCancelModalVisible(false)}
                  disabled={isProcessing}
                >
                  <ButtonText style={{ color: colors.gray[700] }}>ביטול</ButtonText>
                </Button>
                <Button
                  style={{ 
                    flex: 1,
                    backgroundColor: selectedRefundMethod ? colors.red[600] : colors.gray[300]
                  }}
                  onPress={processCancellation}
                  disabled={!selectedRefundMethod || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <ButtonText style={{ color: colors.white }}>אשר ביטול</ButtonText>
                  )}
                </Button>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setRescheduleModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setRescheduleModalVisible(false)}
              >
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <Typography variant="h4" weight="bold" align="center" style={{ marginBottom: spacing[2] }}>
                  בחרו מועד חדש
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  זמינות של {selectedLesson?.teacherName}
                </Typography>
              </View>

              {/* Time Slots */}
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {mockAvailability.length > 0 ? (
                  mockAvailability.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot?.date === slot.date && 
                        selectedTimeSlot?.time === slot.time && 
                        styles.timeSlotSelected
                      ]}
                      onPress={() => setSelectedTimeSlot(slot)}
                    >
                      <View style={{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[2] }}>
                        <Calendar 
                          size={20} 
                          color={selectedTimeSlot?.date === slot.date && selectedTimeSlot?.time === slot.time 
                            ? colors.primary[600] 
                            : colors.gray[600]
                          } 
                        />
                        <Typography 
                          variant="body1" 
                          weight={selectedTimeSlot?.date === slot.date && selectedTimeSlot?.time === slot.time ? 'semibold' : 'normal'}
                        >
                          {slot.date} בשעה {slot.time}
                        </Typography>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: spacing[4], alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary" align="center">
                      אין מועדים פנויים כרגע
                    </Typography>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={{ flexDirection: getFlexDirection(), gap: spacing[2], marginTop: spacing[4] }}>
                <Button
                  style={{ 
                    flex: 1,
                    backgroundColor: colors.gray[200],
                    borderRadius: 8,
                    paddingVertical: spacing[3],
                  }}
                  onPress={() => setRescheduleModalVisible(false)}
                  disabled={isProcessing}
                >
                  <ButtonText style={{ color: colors.gray[700] }}>ביטול</ButtonText>
                </Button>
                <Button
                  style={{ 
                    flex: 1,
                    backgroundColor: selectedTimeSlot ? colors.primary[600] : colors.gray[300]
                  }}
                  onPress={processReschedule}
                  disabled={!selectedTimeSlot || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <ButtonText style={{ color: colors.white }}>שנה מועד</ButtonText>
                  )}
                </Button>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Typography variant="body1" color="white" align="center" weight="semibold">
            {toastMessage}
          </Typography>
        </View>
      )}
    </SafeAreaView>
  );
}