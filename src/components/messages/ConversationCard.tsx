import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { MessageCircle, User } from 'lucide-react-native';
import type { ConversationWithDetails } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useRTL } from '@/context/RTLContext';

interface ConversationCardProps {
  conversation: ConversationWithDetails;
  userRole: 'student' | 'teacher';
  onPress: () => void;
}

export function ConversationCard({
  conversation,
  userRole,
  onPress,
}: ConversationCardProps) {
  const { isRTL, getFlexDirection, getMarginStart, getMarginEnd, getTextAlign } = useRTL();

  // Get the other participant's details
  const otherPerson = userRole === 'student' ? conversation.teacher : conversation.student;
  
  // Safely get display name with fallback
  const displayName = otherPerson
    ? userRole === 'student'
      ? otherPerson.display_name || 'מורה'
      : `${otherPerson.first_name || ''} ${otherPerson.last_name || ''}`.trim() || 'תלמיד'
    : userRole === 'student' ? 'מורה' : 'תלמיד';

  // Format relative time with better formatting
  const formatRelativeTime = (dateString: string | null | undefined) => {
    // Return empty string if no date
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }

      // Check if date is in the future (shouldn't happen, but handle it)
      if (date > now) {
        return 'עכשיו';
      }

      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      // If more than 2 years ago, don't show relative time
      if (diffInHours > 17520) { // 2 years in hours
        return '';
      }
      
      if (diffInHours < 1) {
        return 'עכשיו';
      } else if (diffInHours < 24) {
        return `לפני ${diffInHours} שעות`;
      } else if (diffInHours < 48) {
        return 'אתמול';
      } else {
        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: he,
        });
      }
    } catch {
      return '';
    }
  };

  const hasUnread = conversation.unread_count > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        marginBottom: spacing[2],
        marginHorizontal: spacing[4],
        [isRTL ? 'borderRightWidth' : 'borderLeftWidth']: hasUnread ? 4 : 0,
        [isRTL ? 'borderRightColor' : 'borderLeftColor']: hasUnread ? colors.primary[600] : 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: hasUnread ? 0.1 : 0.05,
        shadowRadius: 4,
        elevation: hasUnread ? 3 : 1,
      }}
    >
      <View
        style={{
          flexDirection: getFlexDirection('row-reverse'),
          alignItems: 'center',
        }}
      >
        {/* Content - appears first in RTL (right side) */}
        <View style={{
          flex: 1,
          minWidth: 0,
          ...getMarginEnd(spacing[3]),
        }}>
          {/* Name and Time Row */}
          <View
            style={{
              flexDirection: getFlexDirection('row-reverse'),
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: spacing[1],
            }}
          >
            {/* Name - appears first in code, will be on right in RTL with row-reverse */}
            <Typography
              size="base"
              weight={hasUnread ? 'bold' : 'semibold'}
              style={{
                color: hasUnread ? colors.gray[900] : colors.gray[800],
                flex: 1,
                ...getMarginEnd(spacing[3]),
                textAlign: getTextAlign('right'),
              }}
              numberOfLines={1}
              align={getTextAlign('right')}
            >
              {displayName}
            </Typography>

            {/* Time - appears second in code, will be on left in RTL with row-reverse */}
            <Typography
              size="xs"
              style={{
                color: colors.gray[500],
                marginTop: 2,
                textAlign: getTextAlign('right'),
              }}
              align={getTextAlign('right')}
            >
              {formatRelativeTime(conversation.last_message_at)}
            </Typography>
          </View>

          {/* Message Preview Row */}
          <View
            style={{
              flexDirection: getFlexDirection('row-reverse'),
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: spacing[1],
            }}
          >
            <Typography
              size="sm"
              numberOfLines={1}
              style={{
                color: hasUnread ? colors.gray[700] : colors.gray[500],
                flex: 1,
                fontWeight: hasUnread ? '600' : '400',
                ...getMarginStart(spacing[2]),
                textAlign: getTextAlign('right'),
              }}
              align={getTextAlign('right')}
            >
              {conversation.last_message_preview || 'התחילו שיחה'}
            </Typography>

            {/* Unread Badge */}
            {hasUnread && (
              <View
                style={{
                  backgroundColor: colors.primary[600],
                  borderRadius: 10,
                  minWidth: 22,
                  height: 22,
                  paddingHorizontal: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...getMarginEnd(spacing[2]),
                }}
              >
                <Typography
                  size="xs"
                  weight="bold"
                  style={{ color: colors.white, fontSize: 11 }}
                >
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* Avatar with better styling - appears second in RTL (left side) */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.gray[100],
            justifyContent: 'center',
            alignItems: 'center',
            ...getMarginStart(spacing[3]),
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: hasUnread ? colors.primary[100] : colors.gray[200],
          }}
        >
          {otherPerson?.avatar_url ? (
            <Image
              source={{ uri: otherPerson.avatar_url }}
              style={{ width: 56, height: 56 }}
              resizeMode="cover"
            />
          ) : (
            <User size={28} color={colors.gray[400]} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
