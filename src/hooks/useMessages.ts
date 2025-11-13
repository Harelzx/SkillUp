/**
 * React Query hook for fetching and managing messages in a conversation
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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

  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const isActiveRef = useRef(true);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!enabled || !conversationId) return;

    console.log(`📡 [useMessages] Setting up realtime subscription for messages: ${conversationId}`);

    // Cleanup existing subscription first
    if (unsubscribeMessagesRef.current) {
      console.log('[useMessages] 🧹 Cleaning up existing subscription before creating new one');
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }

    // Only subscribe if app is active
    if (!isActiveRef.current) {
      console.log('[useMessages] ⏸️ App is in background, skipping subscription setup');
      return;
    }

    const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
      console.log('📡 [useMessages] Realtime: New message received', {
        messageId: newMessage.id,
        conversationId,
        senderId: newMessage.sender_id,
        contentPreview: newMessage.content?.substring(0, 50),
        fullMessage: newMessage,
      });

      // Add new message to cache
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: { messages: Message[]; total: number; hasMore: boolean } | undefined) => {
          if (!old) {
            console.warn('[useMessages] No cache found when adding new message, creating new cache');
            return {
              messages: [newMessage],
              total: 1,
              hasMore: false,
            };
          }

          // Check if message already exists (prevent duplicates)
          const exists = old.messages.some((msg) => msg.id === newMessage.id);
          if (exists) {
            console.log('[useMessages] Message already exists in cache, skipping duplicate:', newMessage.id);
            return old;
          }

          console.log('[useMessages] Adding new message to cache:', {
            messageId: newMessage.id,
            currentMessageCount: old.messages.length,
            newMessageCount: old.messages.length + 1,
          });

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

    unsubscribeMessagesRef.current = unsubscribe;

    return () => {
      console.log(`📡 [useMessages] Cleaning up messages realtime subscription: ${conversationId}`);
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    };
  }, [enabled, conversationId, queryClient]);

  // Handle AppState changes for messages subscription
  useEffect(() => {
    if (!enabled || !conversationId) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[useMessages] AppState changed to:', nextAppState);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        isActiveRef.current = false;
        if (unsubscribeMessagesRef.current) {
          console.log('[useMessages] 🔴 App going to background - cleaning up messages subscription');
          unsubscribeMessagesRef.current();
          unsubscribeMessagesRef.current = null;
        }
      } else if (nextAppState === 'active' && !isActiveRef.current) {
        isActiveRef.current = true;
        if (!unsubscribeMessagesRef.current) {
          console.log('[useMessages] 🟢 App returning to foreground - re-subscribing to messages');

          const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
            queryClient.setQueryData(
              ['messages', conversationId],
              (old: { messages: Message[]; total: number; hasMore: boolean } | undefined) => {
                if (!old) return { messages: [newMessage], total: 1, hasMore: false };
                const exists = old.messages.some((msg) => msg.id === newMessage.id);
                if (!exists) {
                  return {
                    messages: [...old.messages, newMessage],
                    total: old.total + 1,
                    hasMore: old.hasMore,
                  };
                }
                return old;
              }
            );
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          });

          unsubscribeMessagesRef.current = unsubscribe;
        }
      }
    });

    return () => {
      subscription.remove();
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
    onSuccess: (newMessage, variables) => {
      const conversationId = variables.conversationId;

      console.log('[useSendMessage] Adding message optimistically to cache:', {
        messageId: newMessage.id,
        conversationId,
      });

      // Optimistically add the message to cache for immediate UI update
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: { messages: Message[]; total: number; hasMore: boolean } | undefined) => {
          if (!old) {
            // If no cache exists, create a new one
            return {
              messages: [newMessage],
              total: 1,
              hasMore: false,
            };
          }

          // Check if message already exists (prevent duplicates)
          const exists = old.messages.some((msg) => msg.id === newMessage.id);
          if (exists) {
            console.log('[useSendMessage] Message already exists in cache, skipping');
            return old;
          }

          // Add new message to the end of the list
          const updatedMessages = [...old.messages, newMessage];
          
          console.log('[useSendMessage] Updated cache:', {
            oldCount: old.messages.length,
            newCount: updatedMessages.length,
            lastMessage: updatedMessages[updatedMessages.length - 1],
          });

          return {
            ...old,
            messages: updatedMessages,
            total: old.total + 1,
          };
        }
      );

      // Invalidate conversations to update preview and last message
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

      // Update conversation in cache to reset unread count
      queryClient.setQueryData(
        ['conversations'],
        (old: any[] | undefined) => {
          if (!old) return old;

          return old.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: 0,
              };
            }
            return conv;
          });
        }
      );

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
