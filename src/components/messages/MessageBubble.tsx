import React from 'react';
import { View, I18nManager } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { Check, CheckCheck } from 'lucide-react-native';
import type { Message } from '@/types/api';
import { format } from 'date-fns';

const isRTL = I18nManager.isRTL;

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
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <View
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        justifyContent: isOwnMessage ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
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
          borderBottomRightRadius: isOwnMessage && !isRTL ? 4 : 16,
          borderBottomLeftRadius: isOwnMessage && isRTL ? 4 : !isOwnMessage && !isRTL ? 4 : 16,
        }}
      >
        {/* Message Content */}
        <Typography
          size="base"
          style={{
            color: isOwnMessage ? colors.white : colors.gray[900],
            lineHeight: 20,
          }}
        >
          {message.content}
        </Typography>

        {/* Timestamp and Read Receipt */}
        {showTimestamp && (
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              marginTop: spacing[1],
              justifyContent: isRTL ? 'flex-start' : 'flex-end',
            }}
          >
            <Typography
              size="xs"
              style={{
                color: isOwnMessage ? colors.primary[100] : colors.gray[500],
                marginLeft: isRTL ? 0 : spacing[1],
                marginRight: isRTL ? spacing[1] : 0,
              }}
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
