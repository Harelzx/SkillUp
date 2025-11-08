/**
 * Hook to fetch total unread message count for badge display
 */

import { useQuery } from '@tanstack/react-query';
import { getUnreadMessageCount } from '@/services/api';
import { useAuth } from '@/features/auth/auth-context';

interface UseUnreadCountOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to get total unread message count
 * Used for displaying badge on Messages tab
 */
export function useUnreadCount(options: UseUnreadCountOptions = {}) {
  const { enabled = true, refetchInterval = 30000 } = options; // Default: refetch every 30 seconds
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadMessageCount,
    enabled: enabled && !!user,
    refetchInterval,
    staleTime: 10000, // 10 seconds
    retry: false, // Don't retry if migration not run yet
    onError: (error) => {
      // Silently handle error if tables don't exist yet
      console.log('Unread count fetch failed (migration may not be run yet):', error);
    },
  });
}
