import { supabase } from '@/lib/supabase';
import type { Message, TypingIndicator } from '@/types/api';
import { createNotification } from './notificationsAPI';

// ============================================
// GET MESSAGES
// ============================================

/**
 * Get messages for a conversation with pagination
 */
export async function getMessages(params: {
  conversationId: string;
  limit?: number;
  offset?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is participant in conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('teacher_id, student_id')
    .eq('id', params.conversationId)
    .single();

  if (!conversation) {
    throw new Error('לא נמצאה שיחה');
  }

  if (conversation.teacher_id !== user.id && conversation.student_id !== user.id) {
    throw new Error('אין לך הרשאה לצפות בשיחה זו');
  }

  // Fetch messages
  let query = supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: false });

  const limit = params.limit || 50;
  const offset = params.offset || 0;

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Return in chronological order (oldest first)
  return {
    messages: (data || []).reverse() as Message[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * Get single message by ID
 */
export async function getMessage(messageId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      conversation:conversations!messages_conversation_id_fkey(
        teacher_id,
        student_id
      )
    `)
    .eq('id', messageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('לא נמצאה הודעה');
    }
    throw error;
  }

  // Verify user is participant
  const conversation = data.conversation as any;
  if (conversation.teacher_id !== user.id && conversation.student_id !== user.id) {
    throw new Error('אין לך הרשאה לצפות בהודעה זו');
  }

  return data as Message;
}

// ============================================
// SEND MESSAGE
// ============================================

/**
 * Send a message in a conversation
 */
export async function sendMessage(params: {
  conversationId: string;
  content: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Trim content
  const content = params.content.trim();
  if (!content) {
    throw new Error('לא ניתן לשלוח הודעה ריקה');
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('teacher_id, student_id')
    .eq('id', params.conversationId)
    .single();

  if (convError || !conversation) {
    throw new Error('לא נמצאה שיחה');
  }

  // Verify user is participant
  if (conversation.teacher_id !== user.id && conversation.student_id !== user.id) {
    throw new Error('אין לך הרשאה לשלוח הודעה בשיחה זו');
  }

  // Determine sender type
  const senderType = conversation.teacher_id === user.id ? 'teacher' : 'student';

  // Insert message
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      sender_id: user.id,
      sender_type: senderType,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  // Get recipient ID
  const recipientId =
    senderType === 'teacher' ? conversation.student_id : conversation.teacher_id;

  // Get sender name for notification
  console.log('[sendMessage] Getting sender name for notification:', {
    senderType,
    userId: user.id,
    conversationId: params.conversationId,
  });

  let senderName = '';
  if (senderType === 'teacher') {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('display_name')
      .eq('id', user.id)
      .single();
    senderName = teacher?.display_name || 'מורה';
    console.log('[sendMessage] Teacher sender name:', { senderName, teacherId: user.id });
  } else {
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
    senderName = student ? `${student.first_name} ${student.last_name}` : 'תלמיד';
    console.log('[sendMessage] Student sender name:', { senderName, studentId: user.id });
  }

  // Create notification for recipient
  console.log('[sendMessage] Creating notification for recipient:', {
    recipientId,
    senderName,
    conversationId: params.conversationId,
    messageId: data.id,
    contentPreview: content.substring(0, 50),
  });

  try {
    await createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: `הודעה חדשה מ${senderName}`,
      subtitle: content.length > 50 ? `${content.substring(0, 50)}...` : content,
      data: {
        conversation_id: params.conversationId,
        message_id: data.id,
      },
    });
    console.log('[sendMessage] Notification created successfully for recipient:', recipientId);
  } catch (notifError: any) {
    // Don't fail message send if notification fails
    console.error('[sendMessage] Failed to create notification (non-fatal):', {
      error: notifError,
      code: notifError?.code,
      message: notifError?.message,
      details: notifError?.details,
      hint: notifError?.hint,
      recipientId,
      conversationId: params.conversationId,
      messageId: data.id,
    });
  }

  return data as Message;
}

// ============================================
// MARK AS READ
// ============================================

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
    p_user_id: user.id,
  });

  if (error) throw error;
}

/**
 * Mark a single message as read
 */
export async function markMessageAsRead(messageId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .neq('sender_id', user.id) // Don't mark own messages as read
    .eq('is_read', false);

  if (error) throw error;
}

// ============================================
// TYPING INDICATORS
// ============================================

/**
 * Set typing indicator for a conversation
 */
export async function setTypingIndicator(params: {
  conversationId: string;
  isTyping: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (params.isTyping) {
    // Upsert typing indicator with new expiry
    const { error } = await supabase
      .from('typing_indicators')
      .upsert(
        {
          conversation_id: params.conversationId,
          user_id: user.id,
          expires_at: new Date(Date.now() + 5000).toISOString(), // 5 seconds
        },
        {
          onConflict: 'conversation_id,user_id',
        }
      );

    if (error) throw error;
  } else {
    // Remove typing indicator
    const { error } = await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

/**
 * Get typing indicators for a conversation
 */
export async function getTypingIndicators(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('typing_indicators')
    .select('*')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id) // Exclude current user
    .gt('expires_at', new Date().toISOString()); // Only non-expired

  if (error) throw error;
  return (data || []) as TypingIndicator[];
}

/**
 * Clean up expired typing indicators
 */
export async function cleanupExpiredTypingIndicators() {
  const { error } = await supabase.rpc('cleanup_expired_typing_indicators');
  if (error) throw error;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
) {
  // Use timestamp to ensure unique channel name and prevent collisions
  const channelId = `messages:${conversationId}:${Date.now()}`;
  console.log(`[subscribeToMessages] Setting up subscription with channel: ${channelId}`);

  // Track if we're intentionally closing the channel
  let isIntentionalClose = false;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('[subscribeToMessages] Received INSERT event:', {
          conversationId,
          messageId: payload.new?.id,
          senderId: payload.new?.sender_id,
          payload: payload,
        });
        callback(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.log(`[subscribeToMessages] Subscription status for ${channelId}:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`[subscribeToMessages] Successfully subscribed to messages for conversation: ${conversationId}`);
      } else if (status === 'CHANNEL_ERROR') {
        // Only log error if this is NOT an intentional closure
        if (!isIntentionalClose) {
          console.error(`[subscribeToMessages] Unexpected channel error for conversation: ${conversationId}`);
        }
      } else if (status === 'TIMED_OUT') {
        console.error(`[subscribeToMessages] Subscription timed out for conversation: ${conversationId}`);
      } else if (status === 'CLOSED') {
        console.log(`[subscribeToMessages] Subscription closed for conversation: ${conversationId}`);
      }
    });

  return () => {
    console.log(`[subscribeToMessages] Cleaning up subscription for channel: ${channelId}`);
    isIntentionalClose = true;
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to message updates (for read receipts)
 */
export function subscribeToMessageUpdates(
  conversationId: string,
  callback: (message: Message) => void
) {
  // Use timestamp to ensure unique channel name and prevent collisions
  const channelId = `message-updates:${conversationId}:${Date.now()}`;
  let isIntentionalClose = false;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && !isIntentionalClose) {
        console.error(`[subscribeToMessageUpdates] Unexpected channel error for conversation: ${conversationId}`);
      }
    });

  return () => {
    isIntentionalClose = true;
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to typing indicators in a conversation
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  callback: (indicators: TypingIndicator[]) => void
) {
  const fetchIndicators = async () => {
    try {
      const indicators = await getTypingIndicators(conversationId);
      callback(indicators);
    } catch (error) {
      console.error('Failed to fetch typing indicators:', error);
    }
  };

  // Use timestamp to ensure unique channel name and prevent collisions
  const channelId = `typing:${conversationId}:${Date.now()}`;
  let isIntentionalClose = false;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => {
        fetchIndicators();
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && !isIntentionalClose) {
        console.error(`[subscribeToTypingIndicators] Unexpected channel error for conversation: ${conversationId}`);
      }
    });

  // Initial fetch
  fetchIndicators();

  return () => {
    isIntentionalClose = true;
    supabase.removeChannel(channel);
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get total unread message count for current user
 */
export async function getUnreadMessageCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_unread_count', {
    p_user_id: user.id,
  });

  if (error) throw error;
  return data || 0;
}
