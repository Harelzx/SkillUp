import { supabase } from '@/lib/supabase';
import type { Conversation, ConversationWithDetails } from '@/types/api';

// ============================================
// GET CONVERSATIONS
// ============================================

/**
 * Get all conversations for current user (teacher or student)
 */
export async function getConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      teacher:teachers!conversations_teacher_id_fkey(
        id,
        display_name,
        avatar_url
      ),
      student:students!conversations_student_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  // Calculate unread count for each conversation
  const conversationsWithUnread = await Promise.all(
    (data || []).map(async (conversation) => {
      const { data: unreadData } = await supabase.rpc(
        'get_conversation_unread_count',
        {
          p_conversation_id: conversation.id,
          p_user_id: user.id,
        }
      );

      return {
        ...conversation,
        unread_count: unreadData || 0,
      };
    })
  );

  return conversationsWithUnread as ConversationWithDetails[];
}

/**
 * Get single conversation by ID
 */
export async function getConversationById(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      teacher:teachers!conversations_teacher_id_fkey(
        id,
        display_name,
        avatar_url,
        phone
      ),
      student:students!conversations_student_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        phone
      )
    `)
    .eq('id', conversationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('לא נמצאה שיחה');
    }
    throw error;
  }

  // Verify user is participant
  if (data.teacher_id !== user.id && data.student_id !== user.id) {
    throw new Error('אין לך הרשאה לצפות בשיחה זו');
  }

  // Get unread count
  const { data: unreadData } = await supabase.rpc(
    'get_conversation_unread_count',
    {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    }
  );

  return {
    ...data,
    unread_count: unreadData || 0,
  } as ConversationWithDetails;
}

/**
 * Get or create conversation between teacher and student
 */
export async function getOrCreateConversation(params: {
  teacherId: string;
  studentId: string;
  bookingId?: string;
}): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is one of the participants
  if (user.id !== params.teacherId && user.id !== params.studentId) {
    throw new Error('אין לך הרשאה ליצור שיחה זו');
  }

  // Check if conversation already exists
  const { data: existing, error: searchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('teacher_id', params.teacherId)
    .eq('student_id', params.studentId)
    .maybeSingle();

  if (searchError) throw searchError;

  if (existing) {
    return existing as Conversation;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      teacher_id: params.teacherId,
      student_id: params.studentId,
      booking_id: params.bookingId || null,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (race condition)
    if (error.code === '23505') {
      // Try to fetch again
      const { data: retry } = await supabase
        .from('conversations')
        .select('*')
        .eq('teacher_id', params.teacherId)
        .eq('student_id', params.studentId)
        .single();

      if (retry) return retry as Conversation;
    }
    throw error;
  }

  return data as Conversation;
}

/**
 * Find conversation between teacher and student
 */
export async function findConversation(params: {
  teacherId: string;
  studentId: string;
}): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('teacher_id', params.teacherId)
    .eq('student_id', params.studentId)
    .maybeSingle();

  if (error) throw error;
  return data as Conversation | null;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to conversation updates for a user
 * Useful for inbox real-time updates
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversation: Conversation) => void
) {
  const channel = supabase
    .channel(`conversations:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `teacher_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Conversation);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `student_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Conversation);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
