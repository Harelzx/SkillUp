import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { he } from 'date-fns/locale';

interface DateSeparatorProps {
  date: string | Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatDate = (dateToFormat: Date) => {
    if (isToday(dateToFormat)) {
      return 'היום';
    }
    if (isYesterday(dateToFormat)) {
      return 'אתמול';
    }
    if (isThisYear(dateToFormat)) {
      return format(dateToFormat, 'd MMMM', { locale: he });
    }
    return format(dateToFormat, 'd MMMM yyyy', { locale: he });
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing[4],
        paddingHorizontal: spacing[4],
      }}
    >
      {/* Left Line */}
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: colors.gray[300],
        }}
      />

      {/* Date Label */}
      <View
        style={{
          backgroundColor: colors.gray[100],
          borderRadius: 12,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1],
          marginHorizontal: spacing[3],
        }}
      >
        <Typography size="xs" weight="medium" style={{ color: colors.gray[600] }}>
          {formatDate(dateObj)}
        </Typography>
      </View>

      {/* Right Line */}
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: colors.gray[300],
        }}
      />
    </View>
  );
}
