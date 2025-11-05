import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
  Info,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing, shadows } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';
import { DayAvailabilityModal } from '@/components/teacher/DayAvailabilityModal';
import { DayLessonsList } from '@/components/teacher/DayLessonsList';
import { useAuth } from '@/features/auth/auth-context';
import { subscribeToTeacherAvailability } from '@/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTeacherBookings, cancelBooking } from '@/services/api/bookingsAPI';
import { getTeacherAvailabilitySlots } from '@/services/api/teacherAPI';
import { supabase } from '@/lib/supabase';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasLessons: boolean;
  hasSlots: boolean;
  isClosed: boolean; // Day is closed (all slots booked or explicitly closed)
  lessons: any[]; // Empty array, kept for DayModal compatibility
}

const WEEKDAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];
const WEEKDAYS_FULL_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Helper function to compare dates (day/month/year only, ignoring time)
const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

const getDaysInMonth = (year: number, month: number, bookings: any[], availabilitySlots: any[]): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Helper function to get bookings for a specific date
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter((booking: any) => {
      const bookingDate = new Date(booking.start_at);
      const bookingDateStr = bookingDate.toISOString().split('T')[0];
      return bookingDateStr === dateStr;
    });
  };
  
  // Helper function to check if a date has open availability slots (future only)
  const hasOpenSlotsForDate = (date: Date, dateStr: string): boolean => {
    // Only check future dates (including today)
    if (date < today) return false;
    
    // Get all slots for this date
    const slotsForDate = availabilitySlots.filter((slot: any) => {
      const slotDate = new Date(slot.startAt);
      const slotDateStr = slotDate.toISOString().split('T')[0];
      return slotDateStr === dateStr;
    });
    
    // If no slots at all for this date, it's closed
    if (slotsForDate.length === 0) return false;
    
    // Check if there's at least one slot that is not booked and in the future
    const now = new Date();
    return slotsForDate.some((slot: any) => {
      const slotDate = new Date(slot.startAt);
      // Slot is open if not booked and in the future
      return !slot.isBooked && slotDate > now;
    });
  };
  
  // Helper function to check if a date is closed (all slots booked or no slots)
  const isDayClosed = (date: Date, dateStr: string): boolean => {
    // Only check future dates (including today)
    if (date < today) return false;
    
    // Get all slots for this date
    const slotsForDate = availabilitySlots.filter((slot: any) => {
      const slotDate = new Date(slot.startAt);
      const slotDateStr = slotDate.toISOString().split('T')[0];
      return slotDateStr === dateStr;
    });
    
    // If no slots, day is closed
    if (slotsForDate.length === 0) return false; // Not explicitly closed, just no slots
    
    // Check if all slots are booked
    const now = new Date();
    const futureSlots = slotsForDate.filter((slot: any) => {
      const slotDate = new Date(slot.startAt);
      return slotDate > now;
    });
    
    // Day is closed if it had slots but all future slots are booked
    return futureSlots.length > 0 && futureSlots.every((slot: any) => slot.isBooked);
  };
  
  const days: CalendarDay[] = [];
  
  // Previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayBookings = getBookingsForDate(dateStr);
    
    days.push({
      date,
      dayNumber: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      hasLessons: dayBookings.length > 0,
      hasSlots: false, // We don't check slots for other months
      isClosed: false, // We don't check closed status for other months
      lessons: [], // Empty lessons array for non-current month days
    });
  }
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = date.toISOString().split('T')[0];
    const dayBookings = getBookingsForDate(dateStr);
    const isToday = date.getTime() === today.getTime();
    const dayClosed = isDayClosed(date, dateStr);
    
    days.push({
      date,
      dayNumber: i,
      isCurrentMonth: true,
      isToday,
      hasLessons: dayBookings.length > 0,
      hasSlots: hasOpenSlotsForDate(date, dateStr),
      isClosed: dayClosed,
      lessons: [], // Empty lessons array, we use dayBookings separately
    });
  }
  
  // Next month's days to fill the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    const dateStr = date.toISOString().split('T')[0];
    const dayBookings = getBookingsForDate(dateStr);
    const dayClosed = isDayClosed(date, dateStr);
    
    days.push({
      date,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false,
      hasLessons: dayBookings.length > 0,
      hasSlots: hasOpenSlotsForDate(date, dateStr), // Check slots for next month days in grid
      isClosed: dayClosed,
      lessons: [], // Empty lessons array for non-current month days
    });
  }
  
  return days;
};

interface DayModalProps {
  visible: boolean;
  day: CalendarDay | null;
  onClose: () => void;
}

const DayModal: React.FC<DayModalProps> = ({ visible, day, onClose }) => {
  const { isRTL } = useRTL();
  
  if (!day) return null;
  
  const dayName = WEEKDAYS_FULL_HE[day.date.getDay()];
  const dateStr = `${dayName}, ${day.date.getDate()} ב${MONTHS_HE[day.date.getMonth()]}`;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: spacing[4],
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
            ...shadows.xl,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[3],
              paddingBottom: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[200],
            }}
          >
            <View>
              <Typography variant="h5" weight="bold">
                {dateStr}
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                {day.lessons.length === 0
                  ? 'אין שיעורים'
                  : `${day.lessons.length} ${day.lessons.length === 1 ? 'שיעור' : 'שיעורים'}`}
              </Typography>
            </View>
            
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityLabel="סגור"
              accessibilityRole="button"
            >
              <X size={18} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          
          {/* Lessons List */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {day.lessons.length === 0 ? (
              <View
                style={{
                  paddingVertical: spacing[8],
                  alignItems: 'center',
                }}
              >
                <Typography variant="body1" color="textSecondary" align="center">
                  אין שיעורים מתוכננים
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  align="center"
                  style={{ marginTop: spacing[2] }}
                >
                  תאריך זה פנוי
                </Typography>
              </View>
            ) : (
              <View style={{ gap: spacing[3] }}>
                {day.lessons.map((lesson) => (
                  <Card
                    key={lesson.id}
                    variant="elevated"
                    style={{
                      backgroundColor: colors.gray[50],
                      borderWidth: 1,
                      borderColor: colors.gray[200],
                      borderRadius: 12,
                      padding: spacing[3],
                    }}
                  >
                    <View style={{ gap: spacing[2] }}>
                      <Typography variant="body1" weight="semibold">
                        {lesson.studentName}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary">
                        {lesson.subject}
                      </Typography>
                      
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: spacing[1],
                        }}
                      >
                        <Clock size={14} color={colors.gray[500]} />
                        <Typography variant="caption" color="textSecondary">
                          {lesson.startTime} - {lesson.endTime}
                        </Typography>
                      </View>
                      
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: spacing[1],
                        }}
                      >
                        <MapPin size={14} color={colors.gray[500]} />
                        <Typography variant="caption" color="textSecondary">
                          {lesson.location}
                        </Typography>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function TeacherCalendarScreen() {
  const { isRTL, direction } = useRTL();
  const { width: windowWidth } = useWindowDimensions();
  const { profile } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const queryClient = useQueryClient();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Fetch bookings for the entire visible month
  const { data: monthBookings = [] } = useQuery({
    queryKey: ['teacher-month-bookings', profile?.id, currentYear, currentMonth],
    queryFn: async () => {
      if (!profile?.id) return [];
      // Calculate start and end of visible month (including prev/next month days for calendar grid)
      // We fetch a bit more to cover the calendar grid which shows days from prev/next month
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(currentYear, currentMonth + 2, 0); // End of next month
      endDate.setHours(23, 59, 59, 999);
      
      // Fetch all bookings in this range
      // Since getTeacherBookings doesn't support date range, we'll fetch all and filter
      // For efficiency, we'll use direct Supabase query
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          student:students!bookings_student_id_fkey(id, first_name, last_name, avatar_url),
          subject:subjects(id, name, name_he, icon)
        `)
        .eq('teacher_id', profile.id)
        .gte('start_at', startDate.toISOString())
        .lte('start_at', endDate.toISOString())
        .in('status', ['confirmed', 'awaiting_payment', 'pending'])
        .order('start_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Fetch availability slots for the entire visible month
  const { data: availabilitySlots = [] } = useQuery({
    queryKey: ['teacher-availability-slots', profile?.id, currentYear, currentMonth],
    queryFn: async () => {
      if (!profile?.id) return [];
      // Calculate start and end of visible month
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(currentYear, currentMonth + 2, 0); // End of next month
      endDate.setHours(23, 59, 59, 999);
      
      try {
        const slots = await getTeacherAvailabilitySlots(
          profile.id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        return slots || [];
      } catch (error) {
        console.error('Error fetching availability slots:', error);
        return [];
      }
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Fetch bookings for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const { data: dayBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['teacher-day-lessons', profile?.id, selectedDateStr],
    queryFn: async () => {
      if (!profile?.id) return [];
      const bookings = await getTeacherBookings(profile.id, { 
        date: selectedDateStr 
      });
      // Only show confirmed and awaiting_payment bookings
      return bookings.filter((b: any) => 
        b.status === 'confirmed' || b.status === 'awaiting_payment'
      );
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Calculate dynamic cell width accounting for gaps and padding
  // Container padding: 12px on each side = 24px total
  // Gaps: 6 gaps of 8px = 48px
  const containerPadding = 12 * 2; // 24px
  const calendarMargin = spacing[4] * 2; // Margin on both sides
  const totalGaps = 6 * 8; // 6 gaps between 7 cells
  const availableWidth = windowWidth - calendarMargin - containerPadding - totalGaps;
  const cellWidth = availableWidth / 7;
  
  const days = useMemo(
    () => getDaysInMonth(currentYear, currentMonth, monthBookings, availabilitySlots),
    [currentYear, currentMonth, refreshKey, monthBookings, availabilitySlots] // Include availabilitySlots
  );
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleDayPress = (day: CalendarDay) => {
    // Only update selected date for lessons list
    setSelectedDate(day.date);
  };

  const handleSlotsUpdated = () => {
    // Invalidate both availability and bookings queries to ensure UI updates
    queryClient.invalidateQueries({ queryKey: ['teacher-availability-slots', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['teacher-month-bookings', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['teacher-day-lessons'] });
    // Also refresh the calendar data
    setRefreshKey(prev => prev + 1);
  };

  const handleManageAvailability = () => {
    const day = days.find(d => d.date.toDateString() === selectedDate.toDateString());
    if (day) {
      setSelectedDay(day);
      setAvailabilityModalVisible(true);
    }
  };

  const handleCancelLesson = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelModalVisible(true);
  };

  const confirmCancellation = async () => {
    if (!bookingToCancel) return;
    try {
      await cancelBooking(bookingToCancel, 'Cancelled by teacher', 'credits');
      // Invalidate all related queries to refresh calendar display
      queryClient.invalidateQueries({ queryKey: ['teacher-day-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-month-bookings', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-availability-slots', profile?.id] });
      // Invalidate teacher's upcoming lessons on home screen
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: ['teacher', profile.id, 'upcomingLessons'] });
      }
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
    } finally {
      setCancelModalVisible(false);
      setBookingToCancel(null);
    }
  };

  // Subscribe to realtime availability updates
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = subscribeToTeacherAvailability(profile.id, () => {
      setRefreshKey(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.id]);

  // Subscribe to realtime booking updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`teacher-bookings-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `teacher_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['teacher-day-lessons', profile.id],
          });
          queryClient.invalidateQueries({
            queryKey: ['teacher-month-bookings', profile.id],
          });
          setRefreshKey(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  // Subscribe to realtime availability slots updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`teacher-availability-slots-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_slots',
          filter: `teacher_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['teacher-availability-slots', profile.id],
          });
          queryClient.invalidateQueries({
            queryKey: ['teacher-month-bookings', profile.id],
          });
          setRefreshKey(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);
  
  // Dynamic cell size based on available space
  const finalCellSize = Math.max(cellWidth, 42);
  
  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[3],
    },
    calendarContainer: {
      backgroundColor: colors.white,
      margin: spacing[4],
      borderRadius: 16,
      padding: spacing[2],
      ...shadows.md,
    },
    weekdaysRow: {
      flexDirection: (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
      justifyContent: 'space-around' as 'space-around',
      paddingVertical: spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      marginBottom: spacing[2],
    },
    dayCellContent: {
      flex: 1,
      padding: 6,
      justifyContent: 'space-between' as 'space-between',
    },
    dayCellDate: {
      alignSelf: 'center' as 'center', // Right side in RTL
      zIndex: 2,
    },
    dayCellDots: {
      flexDirection: 'row' as 'row',
      justifyContent: 'center' as 'center',
      alignItems: 'center' as 'center',
      gap: 4,
      minHeight: 10,
      paddingTop: 2,
      zIndex: 1,
    },
  };
  
  return (
    <SafeAreaView style={[styles.container, { direction }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h3" weight="bold">
            {MONTHS_HE[currentMonth]} {currentYear}
          </Typography>
          
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: spacing[2],
            }}
          >
            <TouchableOpacity
              onPress={goToToday}
              style={{
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                borderRadius: 8,
                backgroundColor: colors.primary[50],
              }}
              accessibilityLabel="עבור להיום"
              accessibilityRole="button"
            >
              <Typography variant="caption" color="primary" weight="semibold">
                היום
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityLabel="חודש קודם"
              accessibilityRole="button"
            >
              <ChevronRight size={20} color={colors.gray[700]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={goToNextMonth}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityLabel="חודש הבא"
              accessibilityRole="button"
            >
              <ChevronLeft size={20} color={colors.gray[700]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[20] }}
      >
        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Weekdays Header */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS_HE.map((day, index) => (
              <View key={index} style={{ width: '14.28%', alignItems: 'center' }}>
                <Typography 
                  variant="caption" 
                  weight="semibold" 
                  color="textSecondary"
                  style={{
                    fontSize: 12,
                    letterSpacing: 0.2,
                    opacity: 0.8,
                  }}
                >
                  {day}
                </Typography>
              </View>
            ))}
          </View>
          
          {/* Days Grid */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              flexWrap: 'wrap',
              gap: 8, // Responsive gap between cells
            }}
          >
            {days.map((day, index) => {
              const isDisabled = !day.isCurrentMonth;
              const isSelected = !isDisabled && isSameDate(day.date, selectedDate);
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleDayPress(day)}
                  disabled={isDisabled}
                  style={[
                    {
                      width: finalCellSize,
                      height: finalCellSize,
                      borderRadius: 12,
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: 'rgba(0, 0, 0, 0.08)',
                    },
                    // Selected date styling (not today)
                    isSelected && !day.isToday && {
                      backgroundColor: colors.primary[50],
                      borderWidth: 2,
                      borderColor: colors.primary[500],
                    },
                    // Today styling
                    day.isToday && {
                      backgroundColor: colors.gray[100],
                      borderWidth: 2,
                      borderColor: colors.gray[400],
                      // If today is also selected, change border to primary to show selection
                      ...(isSelected ? {
                        borderColor: colors.primary[500],
                        shadowColor: colors.primary[600],
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3,
                      } : {}),
                    },
                    // Days with lessons (but not selected and not today) - priority: lessons > open > closed
                    !day.isToday && !isSelected && day.hasLessons && {
                      backgroundColor: colors.blue[50],
                    },
                    // Days with open slots (but not selected, not today, no lessons, and not closed)
                    !day.isToday && !isSelected && !day.hasLessons && !day.isClosed && day.hasSlots && {
                      borderColor: colors.green[300],
                      borderWidth: 1.5,
                    },
                    // Closed days (but not selected, not today, no lessons) - no special styling, just default white
                    isDisabled && {
                      backgroundColor: 'transparent',
                      borderColor: 'transparent',
                    },
                  ]}
                  accessibilityLabel={`${day.dayNumber} ${MONTHS_HE[day.date.getMonth()]}`}
                  accessibilityRole="button"
                  accessibilityHint={
                    day.lessons.length > 0
                      ? `יש ${day.lessons.length} שיעורים`
                      : 'אין שיעורים'
                  }
                  activeOpacity={isDisabled ? 1 : 0.7}
                >
                  {/* Separated layers: date at top, dots at bottom */}
                  <View style={styles.dayCellContent}>
                    {/* Date number - top right */}
                    <View style={styles.dayCellDate}>
                      <Typography
                        variant="body2"
                        weight={day.isToday ? 'bold' : 'normal'}
                        style={{
                          color: isDisabled
                            ? colors.gray[300]
                            : day.isToday
                            ? colors.primary[700]
                            : colors.gray[900],
                          fontSize: 14,
                          lineHeight: 16,
                        }}
                      >
                        {day.dayNumber}
                      </Typography>
                    </View>
                    
                    {/* Spacer - middle area (empty for future content) */}
                    <View style={{ flex: 1 }} />
                    
                    {/* Dots indicator - bottom center */}
                    <View style={styles.dayCellDots}>
                      {/* Blue dot for lessons */}
                      {day.hasLessons && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: day.isToday
                              ? colors.primary[700]
                              : colors.primary[500],
                          }}
                        />
                      )}
                      {/* Green dot for open slots (only if no lessons and not closed) */}
                      {!day.hasLessons && !day.isClosed && day.hasSlots && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: colors.green[500],
                          }}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Legend & Instructions */}
        <View
          style={{
            paddingHorizontal: spacing[4],
            marginTop: spacing[3],
          }}
        >
          <Card
            variant="elevated"
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.gray[200],
            }}
          >
            <Typography 
              variant="caption" 
              weight="semibold" 
              style={{ 
                marginBottom: spacing[2],
                fontSize: 14,
              }}
            >
              מקרא
            </Typography>
            <View 
              style={{ 
                flexDirection: 'row-reverse',
                flexWrap: 'wrap',
                gap: spacing[3],
                rowGap: spacing[2],
              }}
            >
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: spacing[2],
                  minHeight: 18,
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: colors.gray[100],
                    borderWidth: 2,
                    borderColor: colors.gray[400],
                  }}
                />
                <Typography 
                  variant="caption" 
                  style={{ 
                    fontSize: 12,
                    color: colors.gray[600],
                  }}
                >
                  היום
                </Typography>
              </View>
              
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: spacing[2],
                  minHeight: 18,
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: colors.blue[50],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.primary[500],
                    }}
                  />
                </View>
                <Typography 
                  variant="caption" 
                  style={{ 
                    fontSize: 12,
                    color: colors.gray[600],
                  }}
                >
                  יום עם שיעורים
                </Typography>
              </View>
              
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: spacing[2],
                  minHeight: 18,
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: colors.white,
                    borderWidth: 1.5,
                    borderColor: colors.green[300],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.green[500],
                    }}
                  />
                </View>
                <Typography 
                  variant="caption" 
                  style={{ 
                    fontSize: 12,
                    color: colors.gray[600],
                  }}
                >
                  יום פתוח להזמנות
                </Typography>
              </View>
            </View>
            
            <View
              style={{
                marginTop: spacing[2],
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: spacing[1],
              }}
            >
              <Info size={12} color={colors.gray[600]} strokeWidth={1.5} />
              <Typography 
                variant="caption" 
                style={{ 
                  fontSize: 12,
                  color: colors.gray[600],
                }}
              >
                לחץ על תאריך ולאחר מכן על "עריכת יום" כדי לנהל זמינות
              </Typography>
            </View>
          </Card>
        </View>

        {/* Day Lessons List */}
        {profile && (
          <DayLessonsList
            bookings={dayBookings}
            isLoading={isLoadingBookings}
            selectedDate={selectedDate}
            onManageAvailability={handleManageAvailability}
            onCancelLesson={handleCancelLesson}
          />
        )}
      </ScrollView>
      
      {/* Day Lessons Modal (for past dates) */}
      <DayModal
        visible={modalVisible}
        day={selectedDay}
        onClose={() => setModalVisible(false)}
      />

      {/* Day Availability Modal (for current/future dates) */}
      {profile && selectedDay && (
        <DayAvailabilityModal
          visible={availabilityModalVisible}
          date={selectedDay.date}
          teacherId={profile.id}
          onClose={() => setAvailabilityModalVisible(false)}
          onSlotsUpdated={handleSlotsUpdated}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing[4],
          }}
          onPress={() => setCancelModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: spacing[5],
              width: '100%',
              maxWidth: 400,
              ...shadows.xl,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Typography variant="h4" weight="bold" align="center" style={{ marginBottom: spacing[2] }}>
              לבטל את השיעור?
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: spacing[4] }}>
              האם אתה בטוח שברצונך לבטל את השיעור? הקרדיטים יוחזרו אוטומטית לתלמיד.
            </Typography>

            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: spacing[2] }}>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.gray[200],
                  borderRadius: 8,
                  paddingVertical: spacing[3],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" weight="semibold" style={{ color: colors.gray[700] }}>
                  ביטול
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancellation}
                style={{
                  flex: 1,
                  backgroundColor: colors.red[600],
                  borderRadius: 8,
                  paddingVertical: spacing[3],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" weight="semibold" style={{ color: colors.white }}>
                  אשר ביטול
                </Typography>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

