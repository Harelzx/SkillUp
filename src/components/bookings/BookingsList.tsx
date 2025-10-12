import React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingCard } from './BookingCard';
import { useQuery } from '@tanstack/react-query';
import { getMyBookings } from '@/services/api/bookingsAPI';

interface BookingsListProps {
  filter?: 'upcoming' | 'past' | 'all';
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export function BookingsList({ filter = 'all', status }: BookingsListProps) {
  const {
    data: bookings,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['bookings', filter, status],
    queryFn: async () => {
      const params: any = { status };

      if (filter === 'upcoming') {
        params.upcoming = true;
      } else if (filter === 'past') {
        params.upcoming = false;
      }

      return getMyBookings(params);
    },
    staleTime: 1000 * 60, // 1 minute
  });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        }}
      >
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginTop: spacing[2] }}
        >
          טוען הזמנות...
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        }}
      >
        <Typography variant="body1" color="error">
          שגיאה בטעינת ההזמנות
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          style={{ marginTop: spacing[1] }}
        >
          {error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה'}
        </Typography>
      </View>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <Typography variant="body1" color="textSecondary">
          אין הזמנות להצגה
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          style={{ marginTop: spacing[1], textAlign: 'center' }}
        >
          {filter === 'upcoming'
            ? 'אין לך שיעורים מתוכננים'
            : filter === 'past'
            ? 'אין לך שיעורים קודמים'
            : 'טרם ביצעת הזמנות'}
        </Typography>
      </ScrollView>
    );
  }

  // Determine user role from first booking
  const userRole: 'student' | 'teacher' =
    bookings[0]?.student_id ? 'student' : 'teacher';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing[4] }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary[600]}
        />
      }
    >
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          userRole={userRole}
          onCancelled={refetch}
        />
      ))}
    </ScrollView>
  );
}

