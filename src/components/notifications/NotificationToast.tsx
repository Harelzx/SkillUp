import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Animated, Platform } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { X, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useNotifications } from '@/context/NotificationContext';
import type { Notification, NotificationType } from '@/types/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRTL } from '@/context/RTLContext';

// Helper function to get icon and color for notification type
interface NotificationStyle {
  icon: typeof MessageCircle;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
}

function getNotificationStyle(type: NotificationType): NotificationStyle {
  switch (type) {
    case 'BOOKING_CONFIRMED':
      return {
        icon: CheckCircle,
        iconColor: colors.success[600],
        backgroundColor: colors.success[50],
        borderColor: colors.success[600],
      };
    case 'BOOKING_CANCELLED':
      return {
        icon: XCircle,
        iconColor: colors.error[600],
        backgroundColor: colors.error[50],
        borderColor: colors.error[600],
      };
    case 'BOOKING_RESCHEDULED':
      return {
        icon: Clock,
        iconColor: colors.warning[600],
        backgroundColor: colors.warning[50],
        borderColor: colors.warning[600],
      };
    case 'NEW_MESSAGE':
    default:
      return {
        icon: MessageCircle,
        iconColor: colors.primary[600],
        backgroundColor: colors.primary[100],
        borderColor: colors.primary[600],
      };
  }
}

export function NotificationToast() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { notifications, clearNotification, markNotificationAsRead } = useNotifications();
  const { isRTL, getFlexDirection, getMarginEnd, getTextAlign } = useRTL();

  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));

  // Show the most recent unread notification (messages and bookings)
  useEffect(() => {
    // Don't show toast if user is in the messages tab for NEW_MESSAGE notifications
    const isInMessagesTab = pathname?.startsWith('/(tabs)/messages');

    // Filter for unread notifications of relevant types
    const relevantNotifications = notifications.filter((n) => {
      if (n.is_read) return false;

      // Skip NEW_MESSAGE if user is in messages tab
      if (n.type === 'NEW_MESSAGE' && isInMessagesTab) {
        console.log('[NotificationToast] User is in messages tab, skipping message notification');
        return false;
      }

      // Show NEW_MESSAGE and all BOOKING_* notifications
      return (
        n.type === 'NEW_MESSAGE' ||
        n.type === 'BOOKING_CONFIRMED' ||
        n.type === 'BOOKING_CANCELLED' ||
        n.type === 'BOOKING_RESCHEDULED'
      );
    });

    if (relevantNotifications.length > 0 && !currentNotification) {
      const latest = relevantNotifications[0];
      console.log('[NotificationToast] Showing toast for notification:', {
        id: latest.id,
        type: latest.type,
      });
      setCurrentNotification(latest);

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        dismissToast();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [notifications, currentNotification, pathname]);

  const dismissToast = () => {
    if (!currentNotification) return;

    // Animate out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearNotification(currentNotification.id);
      setCurrentNotification(null);
    });
  };

  const handlePress = () => {
    if (!currentNotification) {
      dismissToast();
      return;
    }

    // Mark as read
    markNotificationAsRead(currentNotification.id);

    // Navigate based on notification type
    switch (currentNotification.type) {
      case 'NEW_MESSAGE':
        if (currentNotification.data?.conversation_id) {
          router.push(`/(tabs)/messages/${currentNotification.data.conversation_id}`);
        }
        break;

      case 'BOOKING_CONFIRMED':
      case 'BOOKING_CANCELLED':
      case 'BOOKING_RESCHEDULED':
        // Navigate to lessons/bookings tab
        // Note: Individual booking details navigation can be added when that feature is implemented
        router.push('/(tabs)/lessons');
        break;

      default:
        // For other notification types, just dismiss
        break;
    }

    // Dismiss toast
    dismissToast();
  };

  if (!currentNotification) {
    return null;
  }

  // Get styling for current notification type
  const style = getNotificationStyle(currentNotification.type);
  const Icon = style.icon;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + (Platform.OS === 'ios' ? 10 : 20),
        left: spacing[4],
        right: spacing[4],
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
        opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing[3],
          flexDirection: getFlexDirection(),
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: 1,
          borderColor: `${style.borderColor}33`, // 20% opacity for light border
          borderRightWidth: isRTL ? 4 : 1,
          borderLeftWidth: isRTL ? 1 : 4,
          borderRightColor: isRTL ? style.borderColor : `${style.borderColor}33`,
          borderLeftColor: isRTL ? `${style.borderColor}33` : style.borderColor,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: style.backgroundColor,
            justifyContent: 'center',
            alignItems: 'center',
            ...getMarginEnd(spacing[3]),
          }}
        >
          <Icon size={20} color={style.iconColor} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography
            size="sm"
            weight="bold"
            style={{
              color: colors.gray[900],
              marginBottom: 2,
              textAlign: getTextAlign(),
            }}
            numberOfLines={1}
          >
            {currentNotification.title}
          </Typography>
          {currentNotification.subtitle && (
            <Typography
              size="xs"
              style={{
                color: colors.gray[600],
                textAlign: getTextAlign(),
              }}
              numberOfLines={2}
            >
              {currentNotification.subtitle}
            </Typography>
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          style={{
            padding: spacing[1],
            marginStart: spacing[2],
          }}
        >
          <X size={18} color={colors.gray[500]} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
