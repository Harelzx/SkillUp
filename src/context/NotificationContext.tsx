import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/features/auth/auth-context';
import { subscribeToNotifications, markAsRead } from '@/services/api/notificationsAPI';
import type { Notification } from '@/types/api';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearNotification: (notificationId: string) => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isActiveRef = useRef(true);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    console.log('[NotificationContext] Setting up real-time subscription for user:', user.id);
    setIsLoading(true);

    // Cleanup any existing subscription first to prevent channel collision
    if (unsubscribeRef.current) {
      console.log('[NotificationContext] 🧹 Cleaning up existing subscription before creating new one');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Only subscribe if app is active
    if (!isActiveRef.current) {
      console.log('[NotificationContext] ⏸️ App is in background, skipping subscription setup');
      setIsLoading(false);
      return;
    }

    // Subscribe to new notifications
    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      console.log('[NotificationContext] ✅ New notification received in real-time:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        subtitle: notification.subtitle?.substring(0, 50),
        data: notification.data,
        timestamp: new Date().toISOString(),
      });

      // Add notification to the list if not already there
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) {
          console.log('[NotificationContext] ⚠️ Notification already exists, skipping:', notification.id);
          return prev;
        }
        console.log('[NotificationContext] ➕ Adding notification to list. Total count:', prev.length + 1);
        return [notification, ...prev];
      });
    });

    unsubscribeRef.current = unsubscribe;
    setIsLoading(false);
    console.log('[NotificationContext] ✓ Subscription setup complete');

    // Cleanup subscription on unmount or user change
    return () => {
      console.log('[NotificationContext] Cleaning up notification subscription');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id]);

  // Handle AppState changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[NotificationContext] AppState changed to:', nextAppState);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - cleanup subscription
        isActiveRef.current = false;
        if (unsubscribeRef.current) {
          console.log('[NotificationContext] 🔴 App going to background - cleaning up subscription');
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      } else if (nextAppState === 'active' && !isActiveRef.current) {
        // App returning to foreground - re-subscribe
        isActiveRef.current = true;
        if (user?.id && !unsubscribeRef.current) {
          console.log('[NotificationContext] 🟢 App returning to foreground - re-subscribing');

          const unsubscribe = subscribeToNotifications(user.id, (notification) => {
            console.log('[NotificationContext] ✅ New notification received (after re-subscribe):', {
              id: notification.id,
              type: notification.type,
            });

            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === notification.id);
              if (!exists) {
                return [notification, ...prev];
              }
              return prev;
            });
          });

          unsubscribeRef.current = unsubscribe;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('[NotificationContext] Failed to mark notification as read:', error);
    }
  }, []);

  // Clear notification from local state
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotification,
    isLoading,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
