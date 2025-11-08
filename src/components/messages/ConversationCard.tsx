import React from 'react';
import { View, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { MessageCircle, User } from 'lucide-react-native';
import type { ConversationWithDetails } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const isRTL = I18nManager.isRTL;

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
  // Get the other participant's details
  const otherPerson = userRole === 'student' ? conversation.teacher : conversation.student;
  const displayName =
    userRole === 'student'
      ? otherPerson.display_name
      : `${otherPerson.first_name} ${otherPerson.last_name}`;

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: he,
      });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: conversation.unread_count > 0 ? colors.primary[200] : colors.gray[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.gray[100],
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: isRTL ? 0 : spacing[3],
            marginRight: isRTL ? spacing[3] : 0,
            overflow: 'hidden',
          }}
        >
          {otherPerson.avatar_url ? (
            <Image
              source={{ uri: otherPerson.avatar_url }}
              style={{ width: 50, height: 50 }}
            />
          ) : (
            <User size={24} color={colors.gray[400]} />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Name and Time */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[1],
            }}
          >
            <Typography
              size="base"
              weight={conversation.unread_count > 0 ? 'bold' : 'medium'}
              style={{ color: colors.gray[900], flex: 1 }}
            >
              {displayName}
            </Typography>

            <Typography size="xs" style={{ color: colors.gray[500] }}>
              {formatRelativeTime(conversation.last_message_at)}
            </Typography>
          </View>

          {/* Message Preview */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              size="sm"
              numberOfLines={1}
              style={{
                color: conversation.unread_count > 0 ? colors.gray[700] : colors.gray[500],
                flex: 1,
                fontWeight: conversation.unread_count > 0 ? '600' : 'normal',
              }}
            >
              {conversation.last_message_preview || 'התחילו שיחה'}
            </Typography>

            {/* Unread Badge */}
            {conversation.unread_count > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary[600],
                  borderRadius: 12,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: spacing[2],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: isRTL ? spacing[2] : 0,
                  marginRight: isRTL ? 0 : spacing[2],
                }}
              >
                <Typography
                  size="xs"
                  weight="bold"
                  style={{ color: colors.white }}
                >
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </Typography>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
