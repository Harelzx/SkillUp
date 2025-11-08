import React from 'react';
import { View, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { ChevronRight, ChevronLeft, User } from 'lucide-react-native';
import type { ConversationWithDetails } from '@/types/api';

const isRTL = I18nManager.isRTL;

interface ConversationHeaderProps {
  conversation: ConversationWithDetails;
  userRole: 'student' | 'teacher';
  isTyping?: boolean;
  onBack: () => void;
}

export function ConversationHeader({
  conversation,
  userRole,
  isTyping = false,
  onBack,
}: ConversationHeaderProps) {
  // Get the other participant's details
  const otherPerson = userRole === 'student' ? conversation.teacher : conversation.student;
  const displayName =
    userRole === 'student'
      ? otherPerson.display_name
      : `${otherPerson.first_name} ${otherPerson.last_name}`;

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={{
            marginLeft: isRTL ? 0 : -8,
            marginRight: isRTL ? -8 : spacing[3],
            padding: spacing[2],
          }}
        >
          {isRTL ? (
            <ChevronLeft size={24} color={colors.gray[700]} />
          ) : (
            <ChevronRight size={24} color={colors.gray[700]} />
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
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
              style={{ width: 40, height: 40 }}
            />
          ) : (
            <User size={20} color={colors.gray[400]} />
          )}
        </View>

        {/* Name and Status */}
        <View style={{ flex: 1 }}>
          <Typography
            size="base"
            weight="bold"
            style={{ color: colors.gray[900] }}
            numberOfLines={1}
          >
            {displayName}
          </Typography>

          {isTyping && (
            <Typography size="xs" style={{ color: colors.primary[600], marginTop: 2 }}>
              מקליד...
            </Typography>
          )}
        </View>
      </View>
    </View>
  );
}
