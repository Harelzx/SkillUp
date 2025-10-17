import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { addDays, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export interface AvailabilitySlot {
  start_at: string; // ISO string
  end_at: string; // ISO string
  is_booked: boolean;
  booking_id?: string;
}

export interface DayAvailability {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  slots: AvailabilitySlot[];
  hasSlots: boolean;
}

interface UseTeacherAvailabilityOptions {
  enabled?: boolean;
  daysAhead?: number; // How many days ahead to fetch (default: 30)
  timezone?: string; // User's timezone (default: 'Asia/Jerusalem')
}

/**
 * Hook to fetch teacher's availability slots
 * - Fetches availability_slots from DB
 * - Filters out booked slots
 * - Filters out slots in past
 * - Filters out slots overlapping with confirmed/awaiting_payment bookings
 * 
 * @param teacherId - Teacher UUID
 * @param options - Query options
 */
export function useTeacherAvailability(
  teacherId: string | null | undefined,
  options?: UseTeacherAvailabilityOptions
) {
  const {
    enabled = true,
    daysAhead = 30,
    timezone = 'Asia/Jerusalem',
  } = options || {};

  return useQuery({
    queryKey: ['teacher-availability', teacherId, daysAhead, timezone],
    queryFn: async () => {
      if (!teacherId) {
        throw new Error('teacherId is required');
      }

      const now = new Date();
      const futureDate = addDays(now, daysAhead);

      console.log('🔍 [useTeacherAvailability] Fetching for teacher:', teacherId);
      console.log('📅 [useTeacherAvailability] Date range:', {
        from: now.toISOString(),
        to: futureDate.toISOString(),
      });

      // 1. Fetch availability slots
      const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_booked', false) // Only unbooked slots
        .gte('start_at', now.toISOString())
        .lte('start_at', futureDate.toISOString())
        .order('start_at');

      console.log('📊 [useTeacherAvailability] Raw slots from DB:', slots?.length || 0);
      if (slots && slots.length > 0) {
        console.log('   First slot:', slots[0].start_at);
        console.log('   Last slot:', slots[slots.length - 1].start_at);
      }

      if (slotsError) {
        console.error('❌ [useTeacherAvailability] Error fetching slots:', slotsError);
        throw slotsError;
      }

      // 2. Fetch confirmed/awaiting_payment bookings to filter overlaps
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, start_at, end_at, status')
        .eq('teacher_id', teacherId)
        .in('status', ['confirmed', 'awaiting_payment'])
        .gte('end_at', now.toISOString())
        .lte('start_at', futureDate.toISOString());

      if (bookingsError) throw bookingsError;

      // 3. Filter out slots that overlap with bookings
      const availableSlots = (slots || []).filter(slot => {
        const slotStart = parseISO(slot.start_at);
        const slotEnd = parseISO(slot.end_at);

        // Check if slot overlaps with any booking
        const hasOverlap = (bookings || []).some(booking => {
          const bookingStart = parseISO(booking.start_at);
          const bookingEnd = parseISO(booking.end_at);

          // Check overlap: (StartA < EndB) and (EndA > StartB)
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        return !hasOverlap;
      });

      console.log('📊 [useTeacherAvailability] After booking overlap filter:', availableSlots.length);

      // 4. Group slots by date
      const slotsByDate = new Map<string, AvailabilitySlot[]>();

      availableSlots.forEach(slot => {
        const slotDate = toZonedTime(parseISO(slot.start_at), timezone);
        const dateKey = format(slotDate, 'yyyy-MM-dd');

        if (!slotsByDate.has(dateKey)) {
          slotsByDate.set(dateKey, []);
        }

        slotsByDate.get(dateKey)!.push({
          start_at: slot.start_at,
          end_at: slot.end_at,
          is_booked: slot.is_booked,
          booking_id: slot.booking_id,
        });
      });

      console.log('🗺️ [useTeacherAvailability] Grouped into', slotsByDate.size, 'days');
      console.log('📆 [useTeacherAvailability] Dates with availability:', Array.from(slotsByDate.keys()).slice(0, 5));

      // 5. Build day availability array
      const daysAvailability: DayAvailability[] = [];

      for (let i = 0; i < daysAhead; i++) {
        const date = addDays(startOfDay(now), i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const daySlots = slotsByDate.get(dateKey) || [];

        daysAvailability.push({
          date,
          dateKey,
          slots: daySlots,
          hasSlots: daySlots.length > 0,
        });
      }

      return {
        slots: availableSlots,
        byDate: slotsByDate,
        days: daysAvailability,
        totalSlots: availableSlots.length,
      };
    },
    enabled: enabled && !!teacherId,
    staleTime: 2 * 60 * 1000, // 2 minutes (availability changes frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Always refetch on focus for latest availability
  });
}

/**
 * Hook to get slots for a specific date
 */
export function useDateSlots(
  teacherId: string | null | undefined,
  date: Date | null | undefined,
  options?: UseTeacherAvailabilityOptions
) {
  const { data, ...rest } = useTeacherAvailability(teacherId, options);

  const dateKey = date ? format(date, 'yyyy-MM-dd') : null;
  const slots = dateKey && data?.byDate ? (data.byDate.get(dateKey) || []) : [];

  return {
    slots,
    hasSlots: slots.length > 0,
    ...rest,
  };
}

/**
 * Helper to check if a date has availability
 */
export function useHasAvailability(
  teacherId: string | null | undefined,
  date: Date,
  options?: UseTeacherAvailabilityOptions
) {
  const { data } = useTeacherAvailability(teacherId, options);
  const dateKey = format(date, 'yyyy-MM-dd');
  return data?.byDate?.has(dateKey) && (data.byDate.get(dateKey)?.length || 0) > 0;
}

