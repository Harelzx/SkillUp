/**
 * Realtime updates for teacher booking data
 * Subscribes to changes in teacher availability and profile
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToTeacherAvailability, subscribeToTeacherProfile } from '@/services/api';

interface UseTeacherBookingRealtimeOptions {
  teacherId: string | null | undefined;
  enabled?: boolean;
}

/**
 * Hook to set up realtime subscriptions for teacher booking data
 * Automatically invalidates queries when changes occur
 * 
 * @param options - Configuration options
 */
export function useTeacherBookingRealtime(options: UseTeacherBookingRealtimeOptions) {
  const { teacherId, enabled = true } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !teacherId) return;

    console.log(`📡 Setting up realtime subscriptions for teacher: ${teacherId}`);

    // Subscribe to availability changes
    const unsubscribeAvailability = subscribeToTeacherAvailability(teacherId, (payload) => {
      console.log('📡 Realtime: Availability updated', payload);
      
      // Invalidate availability queries
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', teacherId],
      });
    });

    // Subscribe to profile changes
    const unsubscribeProfile = subscribeToTeacherProfile(teacherId, (payload) => {
      console.log('📡 Realtime: Profile updated', payload);
      
      // Invalidate profile and booking data queries
      queryClient.invalidateQueries({
        queryKey: ['teacher-booking-data', teacherId],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['teacher', teacherId],
      });
    });

    // Cleanup on unmount
    return () => {
      console.log(`📡 Cleaning up realtime subscriptions for teacher: ${teacherId}`);
      unsubscribeAvailability();
      unsubscribeProfile();
    };
  }, [teacherId, enabled, queryClient]);
}
