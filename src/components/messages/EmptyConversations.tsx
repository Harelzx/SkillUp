import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { MessageCircle } from 'lucide-react-native';

interface EmptyConversationsProps {
  userRole: 'student' | 'teacher';
}

export function EmptyConversations({ userRole }: EmptyConversationsProps) {
  const message =
    userRole === 'student'
      ? 'עדיין אין לך שיחות עם מורים.\nהתחל שיחה עם מורה מדף החיפוש או השיעורים שלך.'
      : 'עדיין אין לך שיחות עם תלמידים.\nתלמידים יוכלו לשלוח לך הודעות לאחר קביעת שיעור.';

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing[6],
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.gray[100],
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing[4],
        }}
      >
        <MessageCircle size={40} color={colors.gray[400]} />
      </View>

      {/* Title */}
      <Typography
        size="lg"
        weight="bold"
        style={{
          color: colors.gray[900],
          textAlign: 'center',
          marginBottom: spacing[2],
        }}
      >
        אין הודעות
      </Typography>

      {/* Message */}
      <Typography
        size="base"
        style={{
          color: colors.gray[500],
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        {message}
      </Typography>
    </View>
  );
}
