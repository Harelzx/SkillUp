/**
 * React Query hook for fetching and managing conversations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getConversations, subscribeToConversations } from '@/services/api';
import { useAuth } from '@/features/auth/auth-context';

interface UseConversationsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch user's conversations with real-time updates
 */
export function useConversations(options: UseConversationsOptions = {}) {
  const { enabled = true, refetchInterval } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: enabled && !!user,
    refetchInterval,
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry if migration not run yet
    onError: (error) => {
      // Silently handle error if tables don't exist yet
      console.log('Conversations fetch failed (migration may not be run yet):', error);
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !user) return;

    console.log('📡 Setting up realtime subscription for conversations');

    const unsubscribe = subscribeToConversations(user.id, (conversation) => {
      console.log('📡 Realtime: Conversation updated', conversation);

      // Invalidate conversations query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    });

    return () => {
      console.log('📡 Cleaning up conversations realtime subscription');
      unsubscribe();
    };
  }, [enabled, user, queryClient]);

  return query;
}
