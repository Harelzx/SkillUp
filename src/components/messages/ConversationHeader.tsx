import { View, TouchableOpacity, Image } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { ChevronRight, ChevronLeft, User } from 'lucide-react-native';
import type { ConversationWithDetails } from '@/types/api';
import { useRTL } from '@/context/RTLContext';

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
  const { isRTL, getFlexDirection, getMarginEnd, getTextAlign } = useRTL();

  // Get the other participant's details
  const otherPerson = userRole === 'student' ? conversation.teacher : conversation.student;
  
  // Safely get display name with fallback
  const displayName = (() => {
    if (!otherPerson) {
      return userRole === 'student' ? 'מורה' : 'תלמיד';
    }
    
    if (userRole === 'student') {
      // otherPerson is teacher, which has display_name
      return (otherPerson as typeof conversation.teacher).display_name || 'מורה';
    } else {
      // otherPerson is student, which has first_name and last_name
      const student = otherPerson as typeof conversation.student;
      return `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'תלמיד';
    }
  })();

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[3],
        position: 'relative',
      }}
    >
      {/* Back Button - positioned absolutely on the left */}
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        style={{
          position: 'absolute',
          left: spacing[4],
          top: spacing[2] + 2,
          padding: spacing[2],
          zIndex: 1,
        }}
      >
        {isRTL ? (
          <ChevronLeft size={24} color={colors.gray[700]} />
        ) : (
          <ChevronRight size={24} color={colors.gray[700]} />
        )}
      </TouchableOpacity>

      {/* Centered Content: Avatar and Name */}
      <View
        style={{
          flexDirection: getFlexDirection('row-reverse'),
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 44, // Space for back button
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.gray[100],
            justifyContent: 'center',
            alignItems: 'center',
            ...getMarginEnd(spacing[3]),
            overflow: 'hidden',
          }}
        >
          {otherPerson?.avatar_url ? (
            <Image
              source={{ uri: otherPerson.avatar_url }}
              style={{ width: 40, height: 40 }}
            />
          ) : (
            <User size={20} color={colors.gray[400]} />
          )}
        </View>

        {/* Name and Status */}
        <View style={{ alignItems: 'center' }}>
          <Typography
            variant="body1"
            weight="bold"
            style={{ color: colors.gray[900] }}
            numberOfLines={1}
            align={getTextAlign('center')}
          >
            {displayName}
          </Typography>

          {isTyping && (
            <Typography 
              variant="caption" 
              style={{ color: colors.primary[600], marginTop: 2 }} 
              align={getTextAlign('center')}
            >
              מקליד...
            </Typography>
          )}
        </View>
      </View>
    </View>
  );
}
