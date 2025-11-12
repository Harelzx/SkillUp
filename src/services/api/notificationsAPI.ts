import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Notification } from '@/types/api';
import type { Database } from '@/types/database';

type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED';
type ChannelError = Error | { message?: string; code?: string; [key: string]: unknown } | undefined;

const db = supabase as SupabaseClient<Database>;

// ============================================
// GET NOTIFICATIONS
// ============================================

/**
 * Get user's notifications
 */
export async function getNotifications(params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = db
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (params?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    notifications: data as Notification[],
    total: count || 0,
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count, error } = await db
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Get notification by ID
 */
export async function getNotification(notificationId: string) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as Notification;
}

// ============================================
// MARK AS READ/UNREAD
// ============================================

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updatePayload: NotificationUpdate = { is_read: true };

  const { data, error } = await (db
    .from('notifications') as any)
    .update(updatePayload)
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updatePayload: NotificationUpdate = { is_read: true };

  const { error } = await (db
    .from('notifications') as any)
    .update(updatePayload)
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return { success: true };
}

/**
 * Mark notification as unread
 */
export async function markAsUnread(notificationId: string) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updatePayload: NotificationUpdate = { is_read: false };

  const { data, error } = await (db
    .from('notifications') as any)
    .update(updatePayload)
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

// ============================================
// DELETE NOTIFICATIONS
// ============================================

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await db
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await db
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('is_read', true);

  if (error) throw error;
  return { success: true };
}

// ============================================
// CREATE NOTIFICATIONS (System/Admin)
// ============================================

/**
 * Create notification for user
 * (Called by system/backend for various events)
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  subtitle?: string;
  data?: any;
}) {
  console.log('[createNotification] Starting notification creation:', {
    userId: params.userId,
    type: params.type,
    title: params.title.substring(0, 50),
    hasSubtitle: !!params.subtitle,
    hasData: !!params.data,
  });

  try {
    // Use RPC function with SECURITY DEFINER to bypass RLS
    // The function now returns the full notification record
    const { data, error } = await (db as any)
      .rpc('create_notification', {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_subtitle: params.subtitle || null,
        p_data: params.data || null,
      })
      .single();

    if (error) {
      console.error('[createNotification] RPC call failed:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        params: {
          userId: params.userId,
          type: params.type,
        },
      });
      throw error;
    }

    console.log('[createNotification] Notification created successfully:', {
      notificationId: data?.id,
      userId: data?.user_id,
      type: data?.type,
    });

    return data as Notification;
  } catch (err) {
    console.error('[createNotification] Unexpected error:', {
      error: err,
      params: {
        userId: params.userId,
        type: params.type,
        title: params.title.substring(0, 50),
      },
    });
    throw err;
  }
}

// ============================================
// NOTIFICATION SUBSCRIPTIONS (Real-time)
// ============================================

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  console.log('[subscribeToNotifications] Creating channel for user:', userId);

  const MAX_RETRIES = 3;
  const RAPID_CLOSE_THRESHOLD_MS = 5000;

  let retryCount = 0;
  let lastSubscribedAt = 0;
  let lastFailureAt = 0;
  let isActive = true;
  let channel = createChannel();

  function createChannel() {
    return db
      .channel(`notifications:${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[subscribeToNotifications] 📨 Received realtime event:', {
            type: payload.eventType,
            table: payload.table,
            new: payload.new,
          });
          callback(payload.new as Notification);
        }
      )
      .subscribe((status, err) => {
        handleStatus(status, err);
      });
  }

  function handleStatus(status: ChannelStatus, err?: ChannelError) {
    const context = err ? { error: err } : undefined;
    console.log('[subscribeToNotifications] Channel status:', status, context);

    if (status === 'SUBSCRIBED') {
      const now = Date.now();
      if (lastFailureAt && now - lastFailureAt > RAPID_CLOSE_THRESHOLD_MS) {
        retryCount = 0;
      }
      lastSubscribedAt = now;
      console.log('[subscribeToNotifications] ✅ Successfully subscribed to notifications');
      return;
    }

    if (!isActive) {
      return;
    }

    if (status === 'TIMED_OUT') {
      console.error('[subscribeToNotifications] ⏱️ Subscription timed out', context);
    } else if (status === 'CHANNEL_ERROR') {
      console.error('[subscribeToNotifications] ❌ Channel error', context);
    } else if (status === 'CLOSED') {
      const elapsed = lastSubscribedAt ? Date.now() - lastSubscribedAt : null;
      console.warn('[subscribeToNotifications] Channel closed unexpectedly', {
        elapsedSinceSubscribeMs: elapsed,
        ...(context || {}),
      });

      if (elapsed !== null && elapsed > RAPID_CLOSE_THRESHOLD_MS) {
        retryCount = 0;
      }
    } else {
      return;
    }

    lastFailureAt = Date.now();
    retryCount += 1;

    if (retryCount >= MAX_RETRIES) {
      console.error('[subscribeToNotifications] ❗ Realtime subscription failed repeatedly, giving up', {
        status,
        attempt: retryCount,
        ...(context || {}),
      });
      return;
    }

    const backoff = Math.min(5000, 500 * retryCount);
    console.log(`[subscribeToNotifications] 🔁 Retrying subscription in ${backoff}ms (attempt ${retryCount})`);

    setTimeout(() => {
      if (!isActive) return;
      db.removeChannel(channel);
      channel = createChannel();
    }, backoff);
  }

  return () => {
    console.log('[subscribeToNotifications] Unsubscribing from channel');
    isActive = false;
    if (channel) {
      db.removeChannel(channel);
    }
  };
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    LESSON_REMINDER_STUDENT: '📚',
    LESSON_REMINDER_TEACHER: '👨‍🏫',
    BOOKING_CONFIRMED: '✅',
    BOOKING_CANCELLED: '❌',
    BOOKING_RESCHEDULED: '🔄',
    REVIEW_RECEIVED: '⭐',
    PAYMENT_RECEIVED: '💰',
    PAYMENT_SENT: '💸',
    CREDITS_PURCHASED: '💳',
    CREDITS_REFUNDED: '↩️',
    NEW_MESSAGE: '💬',
    SYSTEM_ANNOUNCEMENT: '📢',
  };

  return iconMap[type] || '🔔';
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: string): string {
  if (type.includes('CANCELLED') || type.includes('FAILED')) {
    return 'error';
  }
  if (type.includes('CONFIRMED') || type.includes('RECEIVED')) {
    return 'success';
  }
  if (type.includes('REMINDER')) {
    return 'warning';
  }
  return 'primary';
}

/**
 * Format notification time (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'עכשיו';
  } else if (diffMins < 60) {
    return `לפני ${diffMins} דקות`;
  } else if (diffHours < 24) {
    return `לפני ${diffHours} שעות`;
  } else if (diffDays === 1) {
    return 'אתמול';
  } else if (diffDays < 7) {
    return `לפני ${diffDays} ימים`;
  } else {
    return created.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  }
}

// ============================================
// NOTIFICATION PREFERENCES (Future Feature)
// ============================================

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // TODO: Implement notification preferences table
  // For now, return default preferences
  return {
    lessonReminders: true,
    bookingUpdates: true,
    reviewNotifications: true,
    paymentNotifications: true,
    marketingEmails: false,
    pushNotifications: true,
  };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  lessonReminders?: boolean;
  bookingUpdates?: boolean;
  reviewNotifications?: boolean;
  paymentNotifications?: boolean;
  marketingEmails?: boolean;
  pushNotifications?: boolean;
}) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // TODO: Implement notification preferences table
  // For now, return updated preferences
  return {
    ...await getNotificationPreferences(),
    ...preferences,
  };
}
