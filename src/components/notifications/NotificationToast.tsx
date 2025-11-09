import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Animated, Platform } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { X, MessageCircle } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useNotifications } from '@/context/NotificationContext';
import type { Notification } from '@/types/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRTL } from '@/context/RTLContext';

export function NotificationToast() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { notifications, clearNotification, markNotificationAsRead } = useNotifications();
  const { isRTL, getFlexDirection, getMarginEnd, getTextAlign } = useRTL();

  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));

  // Show the most recent unread NEW_MESSAGE notification
  useEffect(() => {
    // Don't show toast if user is in the messages tab or in a conversation
    const isInMessagesTab = pathname?.startsWith('/(tabs)/messages');
    if (isInMessagesTab) {
      console.log('[NotificationToast] User is in messages tab, skipping toast');
      return;
    }

    const unreadMessages = notifications.filter(
      (n) => !n.is_read && n.type === 'NEW_MESSAGE'
    );

    if (unreadMessages.length > 0 && !currentNotification) {
      const latest = unreadMessages[0];
      console.log('[NotificationToast] Showing toast for notification:', latest.id);
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
  }, [notifications, currentNotification]);

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
    if (!currentNotification?.data?.conversation_id) {
      dismissToast();
      return;
    }

    // Mark as read
    markNotificationAsRead(currentNotification.id);

    // Navigate to conversation
    router.push(`/(tabs)/messages/${currentNotification.data.conversation_id}`);

    // Dismiss toast
    dismissToast();
  };

  if (!currentNotification) {
    return null;
  }

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
          borderColor: colors.primary[200],
          borderRightWidth: isRTL ? 4 : 1,
          borderLeftWidth: isRTL ? 1 : 4,
          borderRightColor: isRTL ? colors.primary[600] : colors.primary[200],
          borderLeftColor: isRTL ? colors.primary[200] : colors.primary[600],
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary[100],
            justifyContent: 'center',
            alignItems: 'center',
            ...getMarginEnd(spacing[3]),
          }}
        >
          <MessageCircle size={20} color={colors.primary[600]} />
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
