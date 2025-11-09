/**
 * Hook to get unread message count using real-time notifications
 * Now powered by NotificationContext for instant updates
 */

import { useNotifications } from '@/context/NotificationContext';

interface UseUnreadCountOptions {
  enabled?: boolean;
}

/**
 * Hook to get total unread message count
 * Used for displaying badge on Messages tab
 *
 * Now uses real-time notifications instead of polling!
 */
export function useUnreadCount(options: UseUnreadCountOptions = {}) {
  const { enabled = true } = options;
  const { unreadCount, isLoading } = useNotifications();

  return {
    data: enabled ? unreadCount : 0,
    isLoading,
    error: null,
  };
}
