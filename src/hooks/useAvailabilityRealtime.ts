/**
 * Hook for student search/availability realtime updates
 * Subscribes to availability changes across all teachers
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AvailabilityRealtimeEvent {
  type: 'slot_unavailable' | 'slot_available';
  teacher_id: string;
  start_at: string;
  end_at: string;
}

export function useAvailabilityRealtime(
  onAvailabilityChange: (event: AvailabilityRealtimeEvent) => void
) {
  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log('[Realtime] Availability event:', payload);
    
    try {
      const event = JSON.parse(payload.payload) as AvailabilityRealtimeEvent;
      onAvailabilityChange(event);
    } catch (error) {
      console.error('[Realtime] Failed to parse event:', error);
    }
  }, [onAvailabilityChange]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      // Subscribe to availability_slots table changes
      channel = supabase.channel('search:availability')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'availability_slots',
        }, (payload) => {
          console.log('[Realtime] Availability slots change:', payload);
          
          // Determine event type
          let eventType: 'slot_unavailable' | 'slot_available' = 'slot_unavailable';
          
          if (payload.eventType === 'UPDATE') {
            eventType = payload.new?.is_booked ? 'slot_unavailable' : 'slot_available';
          } else if (payload.eventType === 'INSERT') {
            eventType = 'slot_available';
          } else if (payload.eventType === 'DELETE') {
            eventType = 'slot_unavailable';
          }

          onAvailabilityChange({
            type: eventType,
            teacher_id: payload.new?.teacher_id || payload.old?.teacher_id,
            start_at: payload.new?.start_at || payload.old?.start_at,
            end_at: payload.new?.end_at || payload.old?.end_at,
          });
        })
        .subscribe((status) => {
          console.log(`[Realtime] Availability channel status: ${status}`);
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log('[Realtime] Unsubscribing from availability channel');
        supabase.removeChannel(channel);
      }
    };
  }, [handleRealtimeEvent, onAvailabilityChange]);
}

/**
 * Hook for specific teacher availability updates
 * Useful for teacher profile/booking pages
 */
export function useTeacherAvailabilityRealtime(
  teacherId: string | null,
  onAvailabilityChange: (event: AvailabilityRealtimeEvent) => void
) {
  useEffect(() => {
    if (!teacherId) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      channel = supabase.channel(`teacher_availability:${teacherId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'availability_slots',
          filter: `teacher_id=eq.${teacherId}`,
        }, (payload) => {
          console.log('[Realtime] Teacher availability change:', payload);
          
          let eventType: 'slot_unavailable' | 'slot_available' = 'slot_unavailable';
          
          if (payload.eventType === 'UPDATE') {
            eventType = payload.new?.is_booked ? 'slot_unavailable' : 'slot_available';
          } else if (payload.eventType === 'INSERT') {
            eventType = 'slot_available';
          } else if (payload.eventType === 'DELETE') {
            eventType = 'slot_unavailable';
          }

          onAvailabilityChange({
            type: eventType,
            teacher_id: teacherId,
            start_at: payload.new?.start_at || payload.old?.start_at,
            end_at: payload.new?.end_at || payload.old?.end_at,
          });
        })
        .subscribe((status) => {
          console.log(`[Realtime] Teacher availability channel status: ${status}`);
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log('[Realtime] Unsubscribing from teacher availability channel');
        supabase.removeChannel(channel);
      }
    };
  }, [teacherId, onAvailabilityChange]);
}

