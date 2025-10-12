/**
 * Hook for teacher calendar realtime updates
 * Subscribes to teacher-specific booking events
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface BookingRealtimeEvent {
  type: 'slot_booked' | 'slot_released' | 'booking_rescheduled';
  booking_id: string;
  start_at: string;
  end_at: string;
  old_start_at?: string;
  old_end_at?: string;
  new_start_at?: string;
  new_end_at?: string;
}

export function useTeacherBookingRealtime(
  teacherId: string | null,
  onBookingUpdate: (event: BookingRealtimeEvent) => void
) {
  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log('[Realtime] Teacher event:', payload);
    
    try {
      const event = JSON.parse(payload.payload) as BookingRealtimeEvent;
      onBookingUpdate(event);
    } catch (error) {
      console.error('[Realtime] Failed to parse event:', error);
    }
  }, [onBookingUpdate]);

  useEffect(() => {
    if (!teacherId) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      // Subscribe to teacher-specific channel
      channel = supabase.channel(`teacher:${teacherId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `teacher_id=eq.${teacherId}`,
        }, (payload) => {
          console.log('[Realtime] Booking table change:', payload);
          // Trigger a refresh when bookings table changes
          onBookingUpdate({
            type: 'slot_booked',
            booking_id: payload.new?.id || payload.old?.id,
            start_at: payload.new?.start_at || payload.old?.start_at,
            end_at: payload.new?.end_at || payload.old?.end_at,
          });
        })
        .subscribe((status) => {
          console.log(`[Realtime] Teacher channel status: ${status}`);
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log('[Realtime] Unsubscribing from teacher channel');
        supabase.removeChannel(channel);
      }
    };
  }, [teacherId, handleRealtimeEvent, onBookingUpdate]);
}

