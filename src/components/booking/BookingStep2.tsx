import { useState, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingData } from '@/types/booking';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface BookingStep2Props {
  data: BookingData;
  onChange: (data: Partial<BookingData>) => void;
  errors: Record<string, string>;
}

// Mock data - בשלב הבא יגיע מהשרת
const MOCK_AVAILABLE_SLOTS: { [key: string]: string[] } = {
  '2025-10-15': ['09:00', '10:30', '14:00', '16:00'],
  '2025-10-16': ['10:00', '11:30', '15:00', '17:00'],
  '2025-10-17': ['09:30', '13:00', '16:30'],
  '2025-10-20': ['09:00', '10:00', '14:00', '15:30', '18:00'],
  '2025-10-21': ['10:30', '14:30', '16:00'],
};

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

export function BookingStep2({ data, onChange, errors }: BookingStep2Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(data.date || null);

  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);
  
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = getDateKey(selectedDate);
    return MOCK_AVAILABLE_SLOTS[dateKey] || [];
  }, [selectedDate]);

  const hasAvailability = (date: Date) => {
    const dateKey = getDateKey(date);
    return MOCK_AVAILABLE_SLOTS[dateKey]?.length > 0;
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

  const handleTimeSelect = (timeSlot: string) => {
    onChange({ timeSlot });
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
                const isSelected = data.timeSlot === time;
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

