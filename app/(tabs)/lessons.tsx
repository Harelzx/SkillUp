import { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { Button, ButtonText } from '@gluestack-ui/themed';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { getMyBookings, cancelBooking } from '@/services/api';

interface Lesson {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  date: string;
  time: string;
  startAt?: string; // For sorting
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  isOnline: boolean;
  cancelledAt?: string;
  awaitingPayment?: boolean;
}

// Removed unused interfaces - reschedule and refund functionality removed

export default function LessonsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getFlexDirection, isRTL } = useRTL();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch upcoming lessons from API with optimized caching
  const { data: upcomingBookings = [] } = useQuery({
    queryKey: ['myBookings', 'upcoming'],
    queryFn: async () => {
      console.log('🔄 [Lessons] Fetching upcoming bookings...');
      const bookings = await getMyBookings({ upcoming: true });
      console.log('✅ [Lessons] Fetched', bookings.length, 'upcoming bookings');
      // Filter out completed/cancelled bookings from upcoming
      const filteredBookings = bookings.filter((b: any) => 
        b.status !== 'completed' && b.status !== 'cancelled'
      );
      // Map and sort by start_at (most recent first)
      const mappedBookings = filteredBookings.map((b: any) => ({
        id: b.id,
        teacherId: b.teacher_id,
        teacherName: b.teacher?.display_name || '',
        subject: b.subject?.name_he || '',
        date: new Date(b.start_at).toLocaleDateString('he-IL'),
        time: new Date(b.start_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        startAt: b.start_at, // Keep original for sorting
        status: b.status === 'awaiting_payment' ? 'upcoming' : 'upcoming',
        price: b.price || 0,
        isOnline: b.location_type === 'online',
        awaitingPayment: b.status === 'awaiting_payment',
      }));
      // Sort by start_at ascending (nearest first)
      return mappedBookings.sort((a: any, b: any) => 
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - lessons can change more frequently
    gcTime: 1000 * 60 * 30, // 30 minutes cache time
    refetchOnMount: false, // Use cache if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  // Fetch past lessons from API with optimized caching
  const { data: pastBookings = [] } = useQuery({
    queryKey: ['myBookings', 'past'],
    queryFn: async () => {
      console.log('🔄 [Lessons] Fetching past bookings...');
      const bookings = await getMyBookings({ upcoming: false });
      console.log('✅ [Lessons] Fetched', bookings.length, 'past bookings');
      // Map and sort by start_at (most recent first)
      const mappedBookings = bookings.map((b: any) => ({
        id: b.id,
        teacherId: b.teacher_id,
        teacherName: b.teacher?.display_name || '',
        subject: b.subject?.name_he || '',
        date: new Date(b.start_at).toLocaleDateString('he-IL'),
        time: new Date(b.start_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        startAt: b.start_at, // Keep original for sorting
        status: b.status === 'completed' ? 'completed' : b.status === 'cancelled' ? 'cancelled' : 'completed',
        price: b.price || 0,
        isOnline: b.location_type === 'online',
        awaitingPayment: b.status === 'awaiting_payment',
      }));
      // Sort by start_at descending (most recent first)
      return mappedBookings.sort((a: any, b: any) => 
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - past lessons change less frequently
    gcTime: 1000 * 60 * 60, // 1 hour cache time
    refetchOnMount: false, // Use cache if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  // Removed useFocusEffect refetch - now relies on React Query cache
  // Data will be automatically refetched when stale, reducing unnecessary API calls
  // Removed reschedule functionality - user can cancel and book again

  // Memoize lesson lists to avoid recalculation
  const upcomingLessons = useMemo(() => upcomingBookings as Lesson[], [upcomingBookings]);
  const pastLessons = useMemo(() => pastBookings as Lesson[], [pastBookings]);

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

  // Handle cancel lesson with useCallback for performance
  const handleCancelLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCancelModalVisible(true);
  }, []);

  // Process cancellation
  const processCancellation = async () => {
    if (!selectedLesson) return;

    setIsProcessing(true);

    try {
      // Cancel booking without refund
      await cancelBooking(selectedLesson.id, 'credits'); // Pass credits as default

      // Refresh bookings
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      // Also invalidate teacher's upcoming lessons so they see the cancellation
      if (selectedLesson.teacherId) {
        queryClient.invalidateQueries({ queryKey: ['teacher', selectedLesson.teacherId, 'upcomingLessons'] });
      }

      showToast('השיעור בוטל בהצלחה. ניתן לקבוע שיעור חדש');
      setCancelModalVisible(false);
      setSelectedLesson(null);
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בביטול השיעור. נסה שוב.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed reschedule functionality - user can book again from past lessons

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
          <View style={[styles.lessonHeader, { flexDirection: 'row-reverse' }]}>
            <View style={{ flex: 1 }}>
              <Typography variant="h5" weight="semibold" style={{ textAlign: 'right' }}>
                {lesson.teacherName}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
                {lesson.subject}
              </Typography>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.infoRow, { flexDirection: 'row', gap: spacing[1] }]}>
                <Typography variant="caption" style={{ color: statusColor }}>
                  {t(`lessons.status.${lesson.status}`)}
                </Typography>
                <StatusIcon size={14} color={statusColor} />
              </View>
            </View>
          </View>

          {/* Awaiting Payment Badge */}
          {lesson.status === 'upcoming' && lesson.awaitingPayment && (
            <View style={{
              marginTop: spacing[2],
              marginBottom: spacing[2],
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1],
              backgroundColor: colors.orange[50],
              borderRadius: 8,
              alignSelf: 'flex-end',
              borderWidth: 1,
              borderColor: colors.orange[200],
            }}>
              <Typography variant="caption" style={{ color: colors.orange[700], fontWeight: '600' }}>
                ⏳ ממתין לתשלום
              </Typography>
            </View>
          )}

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
            <View style={[styles.actions, { flexDirection: getFlexDirection() }]}>
              <Button
                style={{
                  width: '100%',
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
                  // Navigate to teacher profile for booking
                  router.push(`/(tabs)/teacher/${lesson.teacherId}`);
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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
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
                  לבטל את השיעור?
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  האם אתה בטוח שברצונך לבטל את השיעור? לאחר הביטול תצטרך לקבוע שיעור חדש
                </Typography>
              </View>

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
                    backgroundColor: colors.red[600]
                  }}
                  onPress={processCancellation}
                  disabled={isProcessing}
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