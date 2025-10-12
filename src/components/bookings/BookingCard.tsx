import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { Calendar, Clock, MapPin, User, XCircle } from 'lucide-react-native';
import { cancelBooking } from '@/services/api/bookingsAPI';
import { useQueryClient } from '@tanstack/react-query';

interface BookingCardProps {
  booking: {
    id: string;
    start_at: string;
    end_at: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    mode?: string;
    location?: string;
    notes?: string;
    subject?: { name_he: string };
    teacher?: { display_name: string; avatar_url?: string };
    student?: { display_name: string; avatar_url?: string };
  };
  userRole: 'student' | 'teacher';
  onCancelled?: () => void;
}

export function BookingCard({ booking, userRole, onCancelled }: BookingCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const queryClient = useQueryClient();

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const isPast = new Date(booking.start_at) < new Date();

  const handleCancel = () => {
    if (isPast) {
      Alert.alert('לא ניתן לביטול', 'לא ניתן לבטל שיעור שכבר התקיים');
      return;
    }

    Alert.alert(
      'ביטול שיעור',
      'האם אתה בטוח שברצונך לבטל את השיעור?\n\nמדיניות ביטול:\n• 24+ שעות מראש: החזר מלא\n• 12-24 שעות: החזר 50%\n• פחות מ-12 שעות: ללא החזר',
      [
        {
          text: 'חזור',
          style: 'cancel',
        },
        {
          text: 'בטל שיעור',
          style: 'destructive',
          onPress: () => confirmCancel(),
        },
      ]
    );
  };

  const confirmCancel = async () => {
    setIsCancelling(true);

    try {
      console.debug('[BookingCard] Cancelling booking:', booking.id);

      const result = await cancelBooking(
        booking.id,
        `${userRole === 'student' ? 'התלמיד' : 'המורה'} ביטל את השיעור`,
        'credits' // Default to credits refund
      );

      console.debug('[BookingCard] Cancelled successfully:', result);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['student-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-slots'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });

      // Show success message
      Alert.alert(
        'השיעור בוטל',
        result.refund.amount > 0
          ? `השיעור בוטל בהצלחה.\n\nהחזר: ₪${result.refund.amount.toFixed(2)} (${
              result.refund.method === 'credits' ? 'קרדיטים' : 'כרטיס אשראי'
            })`
          : 'השיעור בוטל בהצלחה.',
        [{ text: 'הבנתי' }]
      );

      onCancelled?.();
    } catch (error: any) {
      console.error('[BookingCard] Cancel error:', error);

      let errorMessage = 'אירעה שגיאה בביטול השיעור. אנא נסה שוב.';

      if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.green[600];
      case 'pending':
        return colors.yellow[600];
      case 'cancelled':
        return colors.red[600];
      case 'completed':
        return colors.blue[600];
      default:
        return colors.gray[600];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'אושר';
      case 'pending':
        return 'ממתין';
      case 'cancelled':
        return 'בוטל';
      case 'completed':
        return 'הושלם';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('he-IL', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Jerusalem',
    });
  };

  const otherPerson = userRole === 'student' ? booking.teacher : booking.student;

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: colors.gray[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing[3],
        }}
      >
        <View style={{ flex: 1 }}>
          <Typography variant="h6" weight="semibold">
            {booking.subject?.name_he || 'שיעור'}
          </Typography>
          {otherPerson && (
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                marginTop: spacing[1],
              }}
            >
              <User size={14} color={colors.gray[500]} />
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ marginRight: spacing[1] }}
              >
                {userRole === 'student' ? 'מורה: ' : 'תלמיד: '}
                {otherPerson.display_name}
              </Typography>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View
          style={{
            backgroundColor: getStatusColor(booking.status) + '20',
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
            borderRadius: 6,
          }}
        >
          <Typography
            variant="caption"
            weight="semibold"
            style={{ color: getStatusColor(booking.status) }}
          >
            {getStatusText(booking.status)}
          </Typography>
        </View>
      </View>

      {/* Details */}
      <View style={{ gap: spacing[2] }}>
        {/* Date & Time */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <Calendar size={16} color={colors.gray[600]} />
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginRight: spacing[2] }}
          >
            {formatDate(booking.start_at)}
          </Typography>
        </View>

        {/* Duration */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <Clock size={16} color={colors.gray[600]} />
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginRight: spacing[2] }}
          >
            {Math.round(
              (new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) /
                (1000 * 60)
            )}{' '}
            דקות
          </Typography>
        </View>

        {/* Location */}
        {booking.location && (
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
            <MapPin size={16} color={colors.gray[600]} />
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginRight: spacing[2] }}
            >
              {booking.mode === 'online' ? 'אונליין' : booking.location}
            </Typography>
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View
            style={{
              backgroundColor: colors.gray[50],
              padding: spacing[2],
              borderRadius: 6,
              marginTop: spacing[1],
            }}
          >
            <Typography variant="caption" color="textSecondary">
              {booking.notes}
            </Typography>
          </View>
        )}
      </View>

      {/* Actions */}
      {canCancel && !isPast && (
        <TouchableOpacity
          onPress={handleCancel}
          disabled={isCancelling}
          style={{
            marginTop: spacing[3],
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[3],
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.red[600],
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isCancelling ? 0.5 : 1,
          }}
        >
          {isCancelling ? (
            <ActivityIndicator color={colors.red[600]} size="small" />
          ) : (
            <>
              <XCircle size={16} color={colors.red[600]} />
              <Typography
                variant="body2"
                weight="semibold"
                style={{ color: colors.red[600], marginRight: spacing[2] }}
              >
                בטל שיעור
              </Typography>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

