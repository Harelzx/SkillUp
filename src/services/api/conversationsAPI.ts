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

  // First, try to get conversation without joins to verify it exists and user has access
  const { data: baseData, error: baseError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (baseError) {
    console.error('[getConversationById] Error fetching conversation:', {
      error: baseError,
      code: baseError.code,
      message: baseError.message,
      conversationId,
      userId: user.id,
    });

    if (baseError.code === 'PGRST116') {
      throw new Error('לא נמצאה שיחה');
    }
    throw baseError;
  }

  // Verify user is participant
  if (baseData.teacher_id !== user.id && baseData.student_id !== user.id) {
    console.error('[getConversationById] User is not a participant:', {
      conversationId,
      userId: user.id,
      teacherId: baseData.teacher_id,
      studentId: baseData.student_id,
    });
    throw new Error('אין לך הרשאה לצפות בשיחה זו');
  }

  // Now try to get conversation with joins for full details
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
        avatar_url,
        phone
      )
    `)
    .eq('id', conversationId)
    .single();

  if (error) {
    // If join fails, log but return base data (join might fail due to RLS)
    console.warn('[getConversationById] Join failed, using base data:', {
      error: error.message,
      code: error.code,
      conversationId,
    });
    
    // Return base data without joins if join fails
    const { data: unreadData } = await supabase.rpc(
      'get_conversation_unread_count',
      {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      }
    );

    return {
      ...baseData,
      teacher: null,
      student: null,
      unread_count: unreadData || 0,
    } as ConversationWithDetails;
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

  console.log('[getOrCreateConversation] Starting:', {
    teacherId: params.teacherId,
    studentId: params.studentId,
    bookingId: params.bookingId,
    currentUserId: user.id,
  });

  // Verify user is one of the participants
  if (user.id !== params.teacherId && user.id !== params.studentId) {
    console.error('[getOrCreateConversation] User is not a participant:', {
      userId: user.id,
      teacherId: params.teacherId,
      studentId: params.studentId,
    });
    throw new Error('אין לך הרשאה ליצור שיחה זו');
  }

  // Check if conversation already exists
  const { data: existing, error: searchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('teacher_id', params.teacherId)
    .eq('student_id', params.studentId)
    .maybeSingle();

  if (searchError) {
    console.error('[getOrCreateConversation] Error searching for conversation:', {
      error: searchError,
      code: searchError.code,
      message: searchError.message,
    });
    throw searchError;
  }

  if (existing) {
    console.log('[getOrCreateConversation] Found existing conversation:', existing.id);
    return existing as Conversation;
  }

  // Note: We don't verify teacher/student existence here because:
  // 1. RLS might block access even if they exist
  // 2. Foreign key constraint will handle validation
  // 3. If they don't exist, the insert will fail with a clear error

  console.log('[getOrCreateConversation] Creating new conversation...');

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
    console.error('[getOrCreateConversation] Error creating conversation:', {
      error: error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    // Handle unique constraint violation (race condition)
    if (error.code === '23505') {
      console.log('[getOrCreateConversation] Race condition detected, retrying...');
      // Try to fetch again
      const { data: retry } = await supabase
        .from('conversations')
        .select('*')
        .eq('teacher_id', params.teacherId)
        .eq('student_id', params.studentId)
        .single();

      if (retry) {
        console.log('[getOrCreateConversation] Found conversation on retry:', retry.id);
        return retry as Conversation;
      }
    }

    // Handle foreign key constraint violations
    if (error.code === '23503') {
      if (error.message?.includes('teacher_id')) {
        throw new Error('מורה לא נמצא במערכת');
      }
      if (error.message?.includes('student_id')) {
        throw new Error('תלמיד לא נמצא במערכת');
      }
      throw new Error('אחד מהמשתמשים לא נמצא במערכת');
    }

    // Handle RLS violations
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      throw new Error('אין לך הרשאה ליצור שיחה זו');
    }

    throw error;
  }

  console.log('[getOrCreateConversation] Conversation created successfully:', data.id);
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
