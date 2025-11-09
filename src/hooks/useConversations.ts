/**
 * React Query hook for fetching and managing conversations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getConversations, subscribeToConversations, subscribeToMessages } from '@/services/api';
import { useAuth } from '@/features/auth/auth-context';
import type { ConversationWithDetails, Message } from '@/types/api';

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

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!enabled || !user) return;

    console.log('📡 [useConversations] Setting up realtime subscription for conversations');

    const unsubscribeConversations = subscribeToConversations(user.id, (conversation) => {
      console.log('📡 [useConversations] Realtime: Conversation updated', conversation);

      // Update conversation in cache optimistically
      queryClient.setQueryData(
        ['conversations'],
        (old: ConversationWithDetails[] | undefined) => {
          if (!old) return old;

          const index = old.findIndex((c) => c.id === conversation.id);
          if (index >= 0) {
            // Update existing conversation
            const updated = [...old];
            updated[index] = conversation as ConversationWithDetails;
            // Move to top (most recent first)
            updated.splice(index, 1);
            updated.unshift(conversation as ConversationWithDetails);
            return updated;
          } else {
            // Add new conversation at the top
            return [conversation as ConversationWithDetails, ...old];
          }
        }
      );
    });

    return () => {
      console.log('📡 [useConversations] Cleaning up conversations realtime subscription');
      unsubscribeConversations();
    };
  }, [enabled, user, queryClient]);

  // Track subscribed conversation IDs to avoid re-subscribing
  const subscribedConversationsRef = useRef<Set<string>>(new Set());
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());

  // Set up real-time subscription for new messages to update conversations list
  useEffect(() => {
    if (!enabled || !user || !query.data) return;

    const conversationIds = query.data.map((c) => c.id);
    const currentSubscribed = subscribedConversationsRef.current;
    const currentUnsubscribes = unsubscribesRef.current;

    // Subscribe to new conversations that aren't already subscribed
    conversationIds.forEach((conversationId) => {
      if (!currentSubscribed.has(conversationId)) {
        console.log(`📡 [useConversations] Subscribing to messages for conversation: ${conversationId}`);
        
        const unsubscribe = subscribeToMessages(conversationId, (newMessage: Message) => {
          console.log('📡 [useConversations] New message received for conversation:', {
            conversationId,
            messageId: newMessage.id,
            senderId: newMessage.sender_id,
            isOwnMessage: newMessage.sender_id === user.id,
          });

          // Only update if message is from other user (not our own)
          if (newMessage.sender_id !== user.id) {
            // Update conversation in cache with new message info
            queryClient.setQueryData(
              ['conversations'],
              (old: ConversationWithDetails[] | undefined) => {
                if (!old) return old;

                const updated = old.map((conv) => {
                  if (conv.id === conversationId) {
                    return {
                      ...conv,
                      last_message_at: newMessage.created_at,
                      last_message_preview: newMessage.content.substring(0, 100),
                      unread_count: (conv.unread_count || 0) + 1, // Increment unread count
                      updated_at: new Date().toISOString(),
                    };
                  }
                  return conv;
                });

                // Sort by last_message_at, most recent first
                return updated.sort((a, b) => {
                  const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                  const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                  return bTime - aTime;
                });
              }
            );
          }
        });

        currentSubscribed.add(conversationId);
        currentUnsubscribes.set(conversationId, unsubscribe);
      }
    });

    // Unsubscribe from conversations that no longer exist
    const conversationsToRemove: string[] = [];
    currentSubscribed.forEach((conversationId) => {
      if (!conversationIds.includes(conversationId)) {
        conversationsToRemove.push(conversationId);
      }
    });

    conversationsToRemove.forEach((conversationId) => {
      console.log(`📡 [useConversations] Unsubscribing from conversation: ${conversationId}`);
      const unsubscribe = currentUnsubscribes.get(conversationId);
      if (unsubscribe) {
        unsubscribe();
        currentSubscribed.delete(conversationId);
        currentUnsubscribes.delete(conversationId);
      }
    });
  }, [enabled, user, query.data, queryClient]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('📡 [useConversations] Component unmounting - cleaning up all messages subscriptions');
      const currentUnsubscribes = unsubscribesRef.current;
      const currentSubscribed = subscribedConversationsRef.current;
      
      currentUnsubscribes.forEach((unsubscribe) => unsubscribe());
      currentSubscribed.clear();
      currentUnsubscribes.clear();
    };
  }, []);

  return query;
}
