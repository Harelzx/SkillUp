import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    console.log('[NotificationContext] Setting up real-time subscription for user:', user.id);
    setIsLoading(true);

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
