import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { ConversationHeader } from '@/components/messages/ConversationHeader';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { DateSeparator } from '@/components/messages/DateSeparator';
import { useMessages, useSendMessage, useMarkAsRead } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useQuery } from '@tanstack/react-query';
import { getConversationById } from '@/services/api';
import { useAuth } from '@/features/auth/auth-context';
import { isSameDay } from 'date-fns';
import type { Message } from '@/types/api';

export default function TeacherConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Listen to keyboard show/hide events
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Fetch conversation details
  const { data: conversation, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversationById(id!),
    enabled: !!id,
    retry: false,
    onError: (error) => {
      console.error('[ConversationScreen] Failed to load conversation:', error);
    },
  });

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useMessages({
    conversationId: id,
  });

  // Typing indicator
  const { isOtherUserTyping, setIsTyping } = useTypingIndicator({
    conversationId: id,
  });

  // Mutations
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Determine user role
  const userRole = conversation?.teacher_id === user?.id ? 'teacher' : 'student';

  // Mark as read when entering conversation
  useEffect(() => {
    if (id && conversation) {
      markAsReadMutation.mutate(id);
    }
  }, [id, conversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesData?.messages && messagesData.messages.length > 0) {
      // Small delay to ensure FlatList is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messagesData?.messages.length]);

  const handleSend = async (message: string) => {
    if (!id) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: id,
        content: message,
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Group messages by date and add separators
  const messagesWithSeparators = useMemo(() => {
    if (!messagesData?.messages) return [];

    const result: Array<Message | { type: 'separator'; date: string; id: string }> = [];
    let lastDate: Date | null = null;

    messagesData.messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at);

      // Add date separator if day changed
      if (!lastDate || !isSameDay(lastDate, messageDate)) {
        result.push({
          type: 'separator',
          date: message.created_at,
          id: `separator-${index}`,
        });
      }

      result.push(message);
      lastDate = messageDate;
    });

    return result;
  }, [messagesData?.messages]);

  if (conversationLoading || messagesLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing[6],
          }}
        >
          <Typography
            size="lg"
            weight="bold"
            style={{ color: colors.error[600], marginBottom: spacing[2] }}
          >
            שיחה לא נמצאה
          </Typography>
          {conversationError && (
            <Typography
              size="sm"
              style={{ color: colors.gray[600], textAlign: 'center', marginTop: spacing[2] }}
            >
              {conversationError instanceof Error
                ? conversationError.message
                : 'ייתכן שמערכת ההודעות עדיין לא הופעלה'}
            </Typography>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <ConversationHeader
          conversation={conversation}
          userRole={userRole}
          isTyping={isOtherUserTyping}
          onBack={handleBack}
        />

        {/* Messages List */}
        <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
          {messagesWithSeparators.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={messagesWithSeparators}
              keyExtractor={(item) =>
                'type' in item && item.type === 'separator' ? item.id : item.id
              }
              renderItem={({ item }) => {
                if ('type' in item && item.type === 'separator') {
                  return <DateSeparator date={item.date} />;
                }

                const message = item as Message;
                const isOwnMessage = message.sender_id === user?.id;

                return (
                  <MessageBubble
                    message={message}
                    isOwnMessage={isOwnMessage}
                    showTimestamp={true}
                  />
                );
              }}
              contentContainerStyle={{
                paddingTop: spacing[4],
                paddingBottom: spacing[2],
              }}
              onContentSizeChange={() => {
                // Auto-scroll to bottom on content size change
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: spacing[6],
              }}
            >
              <Typography
                size="base"
                style={{ color: colors.gray[500], textAlign: 'center' }}
              >
                עדיין אין הודעות בשיחה.{'\n'}שלח הודעה כדי להתחיל!
              </Typography>
            </View>
          )}
        </View>

        {/* Message Input */}
        <View style={{ 
          paddingBottom: isKeyboardVisible 
            ? insets.bottom 
            : Math.max(insets.bottom, 7) + 56 
        }}>
          <MessageInput
            onSend={handleSend}
            onTyping={setIsTyping}
            disabled={sendMessageMutation.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
