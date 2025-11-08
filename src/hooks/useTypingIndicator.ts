/**
 * Hook for managing typing indicators in a conversation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  setTypingIndicator,
  subscribeToTypingIndicators,
  getTypingIndicators,
} from '@/services/api';
import type { TypingIndicator } from '@/types/api';

interface UseTypingIndicatorOptions {
  conversationId: string | null | undefined;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook to manage typing indicators with debouncing
 * Shows when other participants are typing
 */
export function useTypingIndicator(options: UseTypingIndicatorOptions) {
  const { conversationId, enabled = true, debounceMs = 300 } = options;
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing indicators from other users
  useEffect(() => {
    if (!enabled || !conversationId) return;

    console.log(`📡 Setting up typing indicator subscription: ${conversationId}`);

    const unsubscribe = subscribeToTypingIndicators(conversationId, (indicators) => {
      setTypingUsers(indicators);
      setIsOtherUserTyping(indicators.length > 0);
    });

    // Initial fetch
    getTypingIndicators(conversationId)
      .then((indicators) => {
        setTypingUsers(indicators);
        setIsOtherUserTyping(indicators.length > 0);
      })
      .catch((error) => {
        console.error('Failed to fetch typing indicators:', error);
      });

    return () => {
      console.log(`📡 Cleaning up typing indicator subscription: ${conversationId}`);
      unsubscribe();
    };
  }, [enabled, conversationId]);

  /**
   * Call this function when user starts/stops typing
   * Automatically debounced to avoid excessive updates
   */
  const setIsTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        // Set typing indicator
        setTypingIndicator({
          conversationId,
          isTyping: true,
        }).catch((error) => {
          console.error('Failed to set typing indicator:', error);
        });

        // Auto-clear after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTypingIndicator({
            conversationId,
            isTyping: false,
          }).catch((error) => {
            console.error('Failed to clear typing indicator:', error);
          });
        }, 3000);
      } else {
        // Immediately clear typing indicator
        setTypingIndicator({
          conversationId,
          isTyping: false,
        }).catch((error) => {
          console.error('Failed to clear typing indicator:', error);
        });
      }
    },
    [conversationId]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOtherUserTyping,
    typingUsers,
    setIsTyping,
  };
}
