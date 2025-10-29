import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { 
  Clock, 
  Globe, 
  MapPin,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';
import { BookingWithDetails } from '@/types/api';

interface DayLessonsListProps {
  bookings: BookingWithDetails[];
  isLoading: boolean;
  selectedDate: Date;
  onManageAvailability?: () => void;
  onCancelLesson?: (bookingId: string) => void;
}

interface LessonStatusConfig {
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
  label: string;
}

const STATUS_CONFIG: Record<string, LessonStatusConfig> = {
  confirmed: {
    color: colors.green[700],
    bgColor: colors.green[50],
    icon: CheckCircle,
    label: 'מאושר',
  },
  awaiting_payment: {
    color: colors.orange[700],
    bgColor: colors.orange[50],
    icon: AlertCircle,
    label: 'ממתין לתשלום',
  },
  pending: {
    color: colors.warning[700],
    bgColor: colors.warning[50],
    icon: Clock,
    label: 'ממתין',
  },
  cancelled: {
    color: colors.gray[600],
    bgColor: colors.gray[100],
    icon: AlertCircle,
    label: 'בוטל',
  },
};

const getModeIcon = (isOnline: boolean, _location?: string | null) => {
  if (isOnline) {
    return Globe;
  }
  return MapPin;
};

const getModeLabel = (isOnline: boolean) => {
  return isOnline ? 'אונליין' : 'פגישה פיזית';
};

const formatTime = (datetime: string): string => {
  const date = new Date(datetime);
  return date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const DayLessonsList: React.FC<DayLessonsListProps> = ({ 
  bookings, 
  isLoading, 
  selectedDate,
  onManageAvailability,
  onCancelLesson,
}) => {
  const { isRTL } = useRTL();
  
  // Check if selected date is today or future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateNormalized = new Date(selectedDate);
  selectedDateNormalized.setHours(0, 0, 0, 0);
  const isTodayOrFuture = selectedDateNormalized >= today;
  const shouldShowEditButton = onManageAvailability && isTodayOrFuture;

  if (isLoading) {
    return (
      <View style={{ padding: spacing[4] }}>
        <View style={{ 
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[3]
        }}>
          <View style={{ 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
          }}>
            <View style={{ 
              width: 12, 
              height: 12, 
              borderRadius: 6, 
              backgroundColor: colors.primary[500],
              marginLeft: isRTL ? 0 : spacing[2],
              marginRight: isRTL ? spacing[2] : 0
            }} />
            <Typography variant="body2" weight="semibold">
              השיעורים בתאריך {formatDate(selectedDate)}
            </Typography>
          </View>
          {shouldShowEditButton && (
            <TouchableOpacity
              onPress={onManageAvailability}
              style={{
                padding: spacing[1],
              }}
            >
              <Edit size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Skeleton Loaders */}
        {[1, 2, 3].map((i) => (
          <View 
            key={i}
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[4],
              backgroundColor: colors.white,
              borderRadius: 12,
              marginBottom: spacing[2],
              borderWidth: 1,
              borderColor: colors.gray[200],
            }}
          >
            <View style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: colors.gray[200] 
            }} />
            <View style={{ 
              flex: 1, 
              marginHorizontal: spacing[3],
              gap: spacing[1]
            }}>
              <View style={{ 
                height: 14, 
                borderRadius: 4, 
                backgroundColor: colors.gray[200],
                width: '60%'
              }} />
              <View style={{ 
                height: 12, 
                borderRadius: 4, 
                backgroundColor: colors.gray[200],
                width: '40%'
              }} />
            </View>
            <View style={{ 
              width: 60, 
              height: 16, 
              borderRadius: 4, 
              backgroundColor: colors.gray[200] 
            }} />
          </View>
        ))}
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={{ padding: spacing[4] }}>
        <View style={{ 
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[3]
        }}>
          <View style={{ 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
          }}>
            <View style={{ 
              width: 12, 
              height: 12, 
              borderRadius: 6, 
              backgroundColor: colors.primary[500],
              marginLeft: isRTL ? 0 : spacing[2],
              marginRight: isRTL ? spacing[2] : 0
            }} />
            <Typography variant="body2" weight="semibold">
              השיעורים בתאריך {formatDate(selectedDate)}
            </Typography>
          </View>
          {shouldShowEditButton && (
            <TouchableOpacity
              onPress={onManageAvailability}
              style={{
                padding: spacing[1],
              }}
            >
              <Edit size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={{
          paddingVertical: spacing[8],
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.gray[200],
        }}>
          <Typography variant="body2" color="textSecondary" align="center">
            אין שיעורים לתאריך זה
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: spacing[4] }}>
      {/* Header */}
      <View style={{ 
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[3]
      }}>
        <View style={{ 
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
        }}>
          <View style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 6, 
            backgroundColor: colors.primary[500],
            marginLeft: isRTL ? 0 : spacing[2],
            marginRight: isRTL ? spacing[2] : 0
          }} />
          <Typography variant="body2" weight="semibold">
            השיעורים בתאריך {formatDate(selectedDate)}
          </Typography>
        </View>
        {shouldShowEditButton && (
          <TouchableOpacity
            onPress={onManageAvailability}
            style={{
              padding: spacing[1],
            }}
          >
            <Edit size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lessons List */}
      <View style={{ gap: spacing[2] }}>
        {bookings.map((booking) => {
          const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusConfig.icon;
          const ModeIcon = getModeIcon(booking.is_online, booking.location);
          const studentName = booking.student 
            ? `${booking.student.first_name} ${booking.student.last_name}`.trim()
            : 'תלמיד לא זוהה';
          
          return (
            <TouchableOpacity
              key={booking.id}
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[4],
                backgroundColor: colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.gray[200],
                minHeight: 80,
                minWidth: '100%',
              }}
              activeOpacity={0.7}
            >
              {/* Time Range - Right side */}
              <View style={{ 
                alignItems: isRTL ? 'flex-end' : 'flex-start',
                minWidth: 80,
              }}>
                <Typography variant="body2" weight="bold">
                  {formatTime(booking.start_at)}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  style={{ marginTop: 2 }}
                >
                  {formatTime(booking.end_at)}
                </Typography>
              </View>

              {/* Vertical Separator */}
              <View style={{ 
                width: 1, 
                height: 40, 
                backgroundColor: colors.gray[200],
                marginHorizontal: spacing[3]
              }} />

              {/* Content - Center */}
              <View style={{ flex: 1, gap: spacing[1] }}>
                <View style={{ 
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: spacing[2]
                }}>
                  <Typography variant="body2" weight="semibold" numberOfLines={1}>
                    {studentName}
                  </Typography>
                  
                  {/* Status Chip */}
                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: statusConfig.bgColor,
                    paddingHorizontal: spacing[2],
                    paddingVertical: 2,
                    borderRadius: 12,
                    gap: 4,
                  }}>
                    <StatusIcon size={10} color={statusConfig.color} />
                    <Typography 
                      variant="caption" 
                      style={{ color: statusConfig.color }}
                      numberOfLines={1}
                    >
                      {statusConfig.label}
                    </Typography>
                  </View>
                </View>
                
                <View style={{ 
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: spacing[2],
                  flexWrap: 'wrap'
                }}>
                  <Typography variant="caption" color="textSecondary">
                    {booking.subject?.name_he || 'ללא נושא'}
                  </Typography>
                  
                  {/* Mode Chip */}
                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: colors.gray[100],
                    paddingHorizontal: spacing[2],
                    paddingVertical: 2,
                    borderRadius: 12,
                    gap: 4,
                  }}>
                    <ModeIcon size={10} color={colors.gray[600]} />
                    <Typography variant="caption" color="textSecondary">
                      {getModeLabel(booking.is_online)}
                    </Typography>
                  </View>
                </View>

                {/* Bottom actions - inside content to avoid overlap */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: isRTL ? 'flex-end' : 'flex-start',
                    marginTop: spacing[2],
                  }}
                >
                  {new Date(booking.start_at) > new Date(Date.now() + 60 * 60 * 1000) && 
                   ['confirmed', 'awaiting_payment'].includes(booking.status) && 
                   onCancelLesson && (
                    <TouchableOpacity
                      onPress={() => onCancelLesson(booking.id)}
                      style={{
                        padding: spacing[2],
                        backgroundColor: colors.red[50],
                        borderRadius: 8,
                      }}
                    >
                      <Trash2 size={16} color={colors.red[600]} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

