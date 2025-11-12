import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { Check, CheckCheck } from 'lucide-react-native';
import type { Message } from '@/types/api';
import { format } from 'date-fns';
import { useRTL } from '@/context/RTLContext';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showTimestamp = true,
}: MessageBubbleProps) {
  const { isRTL, getFlexDirection, getMarginEnd, getTextAlign } = useRTL();

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <View
      style={{
        flexDirection: getFlexDirection('row-reverse'),
        justifyContent: isOwnMessage ? (isRTL ? 'flex-end' : 'flex-start') : (isRTL ? 'flex-start' : 'flex-end'),
        marginBottom: spacing[2],
        paddingHorizontal: spacing[4],
      }}
    >
      <View
        style={{
          maxWidth: '75%',
          backgroundColor: isOwnMessage ? colors.primary[600] : colors.gray[100],
          borderRadius: 16,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          [isRTL ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: isOwnMessage ? 4 : 16,
          [isRTL ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: isOwnMessage ? 16 : 4,
        }}
      >
        {/* Message Content */}
        <Typography
          size="base"
          style={{
            color: isOwnMessage ? colors.white : colors.gray[900],
            lineHeight: 20,
            textAlign: getTextAlign('right'),
          }}
          align={getTextAlign('right')}
        >
          {message.content}
        </Typography>

        {/* Timestamp and Read Receipt */}
        {showTimestamp && (
          <View
            style={{
              flexDirection: getFlexDirection('row-reverse'),
              alignItems: 'center',
              marginTop: spacing[1],
              justifyContent: isRTL ? 'flex-end' : 'flex-start',
            }}
          >
            <Typography
              size="xs"
              style={{
                color: isOwnMessage ? colors.primary[100] : colors.gray[500],
                ...getMarginEnd(spacing[1]),
                textAlign: getTextAlign('right'),
              }}
              align={getTextAlign('right')}
            >
              {formatTime(message.created_at)}
            </Typography>

            {/* Read Receipt (only for own messages) */}
            {isOwnMessage && (
              <View>
                {message.is_read ? (
                  <CheckCheck size={14} color={colors.primary[100]} />
                ) : (
                  <Check size={14} color={colors.primary[200]} />
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
