import { useState, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingData } from '@/types/booking';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface BookingStep2Props {
  data: BookingData;
  teacherId: string;
  availability?: {
    slots: any[];
    byDate: Map<string, any[]>;
    days: any[];
    totalSlots: number;
  };
  onChange: (data: Partial<BookingData>) => void;
  errors: Record<string, string>;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function BookingStep2({ data, teacherId, availability, onChange, errors }: BookingStep2Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(data.date || null);
  const timezone = 'Asia/Jerusalem';

  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);
  
  const availableSlots = useMemo(() => {
    if (!selectedDate || !availability) return [];
    const dateKey = getDateKey(selectedDate);
    const daySlots = availability.byDate.get(dateKey) || [];
    
    // Convert slots to time strings in user's timezone
    return daySlots.map(slot => {
      const slotTime = toZonedTime(parseISO(slot.start_at), timezone);
      return format(slotTime, 'HH:mm');
    });
  }, [selectedDate, availability]);

  const hasAvailability = (date: Date) => {
    if (!availability) return false;
    const dateKey = getDateKey(date);
    return availability.byDate.has(dateKey) && (availability.byDate.get(dateKey)?.length || 0) > 0;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange({ date, timeSlot: undefined }); // Reset time slot when changing date
  };

  const handleTimeSelect = (timeString: string) => {
    console.log('⏰ [BookingStep2] Time selected:', timeString);

    if (!selectedDate || !availability) {
      console.log('❌ [BookingStep2] Missing selectedDate or availability');
      return;
    }

    const dateKey = getDateKey(selectedDate);
    const daySlots = availability.byDate.get(dateKey) || [];

    console.log('📅 [BookingStep2] Looking for slot on', dateKey);
    console.log('📊 [BookingStep2] Available slots for this day:', daySlots.length);

    // Find the actual slot that matches this time
    const matchingSlot = daySlots.find(slot => {
      const slotTime = toZonedTime(parseISO(slot.start_at), timezone);
      const formattedTime = format(slotTime, 'HH:mm');
      console.log('   Checking slot:', formattedTime, '===', timeString, '?', formattedTime === timeString);
      return formattedTime === timeString;
    });

    if (matchingSlot) {
      console.log('✅ [BookingStep2] Found matching slot:', matchingSlot.start_at);
      // Save the full ISO start_at as timeSlot
      onChange({ timeSlot: matchingSlot.start_at });
    } else {
      console.log('❌ [BookingStep2] No matching slot found for time:', timeString);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  // Get first day of month for calendar grid
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  // Loading state
  if (!availability) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[4] }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[4], textAlign: 'center' }}>
          טוען זמינות...
        </Typography>
      </View>
    );
  }

  // No availability state
  if (availability.totalSlots === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[4] }}>
        <Calendar size={48} color={colors.gray[400]} />
        <Typography variant="h6" weight="bold" style={{ textAlign: 'center', marginTop: spacing[4] }}>
          אין זמינות
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing[2] }}>
          המורה לא הגדיר משבצות זמינות ב-30 הימים הקרובים
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="h4" weight="bold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          בחירת מועד
        </Typography>
        <View style={{ 
          flexDirection: 'row-reverse', 
          alignItems: 'center', 
          padding: spacing[2],
          backgroundColor: colors.blue[50],
          borderRadius: 8,
        }}>
          <Clock size={16} color={colors.blue[600]} style={{ marginRight: spacing[2] }} />
          <Typography variant="caption" color="textSecondary">
            השעות מוצגות לפי אזור הזמן שלך (GMT+3)
          </Typography>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={{
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
      }}>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={{
            padding: spacing[2],
            borderRadius: 8,
            backgroundColor: colors.gray[100],
          }}
        >
          <ChevronRight size={20} color={colors.gray[700]} />
        </TouchableOpacity>

        <Typography variant="h6" weight="semibold">
          {monthName}
        </Typography>

        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={{
            padding: spacing[2],
            borderRadius: 8,
            backgroundColor: colors.gray[100],
          }}
        >
          <ChevronLeft size={20} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View>
        {/* Day names */}
        <View style={{ 
          flexDirection: 'row-reverse', 
          marginBottom: spacing[2],
        }}>
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
            <View key={day} style={{ flex: 1, alignItems: 'center' }}>
              <Typography variant="caption" weight="semibold" color="textSecondary">
                {day}
              </Typography>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
          {emptyDays.map((_, index) => (
            <View key={`empty-${index}`} style={{ width: '14.28%', aspectRatio: 1 }} />
          ))}
          {daysInMonth.map((date) => {
            const isSelected = selectedDate && getDateKey(date) === getDateKey(selectedDate);
            const isAvailable = hasAvailability(date);
            const isPast = isPastDate(date);
            const isDisabled = isPast || !isAvailable;

            return (
              <TouchableOpacity
                key={date.toISOString()}
                disabled={isDisabled}
                onPress={() => handleDateSelect(date)}
                style={{
                  width: '14.28%',
                  aspectRatio: 1,
                  padding: 4,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: isSelected 
                      ? colors.primary[600] 
                      : isDisabled 
                      ? colors.gray[50]
                      : colors.white,
                    borderWidth: 1,
                    borderColor: isSelected 
                      ? colors.primary[600] 
                      : isAvailable 
                      ? colors.primary[200]
                      : colors.gray[200],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{
                      color: isSelected 
                        ? colors.white 
                        : isPast 
                        ? colors.gray[400]
                        : colors.gray[900],
                    }}
                  >
                    {date.getDate()}
                  </Typography>
                  {isAvailable && !isSelected && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.primary[600],
                        marginTop: 2,
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {errors.date && (
        <Typography variant="caption" color="error" style={{ textAlign: 'right' }}>
          {errors.date}
        </Typography>
      )}

      {/* Time Slots */}
      {selectedDate && (
        <View>
          <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
            שעות פנויות ב-{selectedDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
          </Typography>
          
          {availableSlots.length > 0 ? (
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
              {availableSlots.map((time) => {
                // Check if this time slot is selected by comparing with the ISO timeSlot
                // Convert data.timeSlot (ISO) back to time string for comparison
                let isSelected = false;
                if (data.timeSlot && selectedDate) {
                  const dateKey = getDateKey(selectedDate);
                  const daySlots = availability?.byDate.get(dateKey) || [];
                  const matchingSlot = daySlots.find(slot => {
                    const slotTime = toZonedTime(parseISO(slot.start_at), timezone);
                    return format(slotTime, 'HH:mm') === time;
                  });
                  isSelected = matchingSlot?.start_at === data.timeSlot;
                }

                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => handleTimeSelect(time)}
                    style={{
                      paddingHorizontal: spacing[4],
                      paddingVertical: spacing[3],
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary[600] : colors.gray[300],
                      backgroundColor: isSelected ? colors.primary[50] : colors.white,
                      minWidth: 80,
                      alignItems: 'center',
                      marginLeft: spacing[2],
                      marginBottom: spacing[2],
                    }}
                  >
                    <Typography
                      variant="body1"
                      weight={isSelected ? 'semibold' : 'normal'}
                      color={isSelected ? 'primary' : 'text'}
                    >
                      {time}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={{
              padding: spacing[4],
              backgroundColor: colors.gray[50],
              borderRadius: 12,
              alignItems: 'center',
            }}>
              <Calendar size={32} color={colors.gray[400]} />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[2], textAlign: 'center' }}>
                אין זמינות בתאריך זה
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1] }}>
                נסו תאריך אחר
              </Typography>
            </View>
          )}

          {errors.timeSlot && (
            <Typography variant="caption" color="error" style={{ marginTop: spacing[2], textAlign: 'right' }}>
              {errors.timeSlot}
            </Typography>
          )}
        </View>
      )}
    </ScrollView>
  );
}

