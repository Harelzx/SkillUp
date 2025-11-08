/**
 * React Query hook for fetching and managing messages in a conversation
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  subscribeToMessageUpdates,
} from '@/services/api';
import type { Message } from '@/types/api';

interface UseMessagesOptions {
  conversationId: string | null | undefined;
  enabled?: boolean;
  limit?: number;
}

/**
 * Hook to fetch messages for a conversation with real-time updates
 */
export function useMessages(options: UseMessagesOptions) {
  const { conversationId, enabled = true, limit = 50 } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      getMessages({
        conversationId: conversationId!,
        limit,
      }),
    enabled: enabled && !!conversationId,
    staleTime: 10000, // 10 seconds
  });

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!enabled || !conversationId) return;

    console.log(`📡 Setting up realtime subscription for messages: ${conversationId}`);

    const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
      console.log('📡 Realtime: New message received', newMessage);

      // Add new message to cache
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: { messages: Message[]; total: number; hasMore: boolean } | undefined) => {
          if (!old) return old;

          // Check if message already exists (prevent duplicates)
          const exists = old.messages.some((msg) => msg.id === newMessage.id);
          if (exists) return old;

          return {
            messages: [...old.messages, newMessage],
            total: old.total + 1,
            hasMore: old.hasMore,
          };
        }
      );

      // Invalidate conversations to update preview
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    });

    return () => {
      console.log(`📡 Cleaning up messages realtime subscription: ${conversationId}`);
      unsubscribe();
    };
  }, [enabled, conversationId, queryClient]);

  // Set up real-time subscription for message updates (read receipts)
  useEffect(() => {
    if (!enabled || !conversationId) return;

    console.log(`📡 Setting up realtime subscription for message updates: ${conversationId}`);

    const unsubscribe = subscribeToMessageUpdates(conversationId, (updatedMessage) => {
      console.log('📡 Realtime: Message updated', updatedMessage);

      // Update message in cache
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: { messages: Message[]; total: number; hasMore: boolean } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
          };
        }
      );
    });

    return () => {
      console.log(`📡 Cleaning up message updates realtime subscription: ${conversationId}`);
      unsubscribe();
    };
  }, [enabled, conversationId, queryClient]);

  return query;
}

/**
 * Mutation hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Message will be added via real-time subscription
      // But we can optimistically update for faster UI
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });
}

/**
 * Mutation hook to mark conversation as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: (_, conversationId) => {
      // Update messages in cache to mark as read
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: { messages: Message[]; total: number; hasMore: boolean } | undefined) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.map((msg) => ({
              ...msg,
              is_read: true,
              read_at: msg.read_at || new Date().toISOString(),
            })),
          };
        }
      );

      // Invalidate conversations to update unread count
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });

      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: ['unread-count'],
      });
    },
  });
}

/**
 * Hook for infinite scroll messages (for future pagination)
 */
export function useInfiniteMessages(options: UseMessagesOptions) {
  const { conversationId, enabled = true, limit = 50 } = options;

  return useInfiniteQuery({
    queryKey: ['messages-infinite', conversationId],
    queryFn: ({ pageParam = 0 }) =>
      getMessages({
        conversationId: conversationId!,
        limit,
        offset: pageParam,
      }),
    enabled: enabled && !!conversationId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * limit;
    },
  });
}
