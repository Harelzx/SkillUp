import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type UpcomingLesson = {
  id: string;
  startAt: string;
  endAt: string;
  subject?: { id: string; name?: string; name_he?: string; icon?: string } | null;
  mode: 'online' | 'at_student' | 'at_teacher' | 'student_location' | 'teacher_location';
  totalPrice?: number | null;
  student: { id: string; first_name?: string; last_name?: string; avatar_url?: string } | null;
  status: 'pending' | 'confirmed' | 'awaiting_payment' | 'completed' | 'cancelled';
};

export function useTeacherUpcomingLessons(teacherId: string | undefined, opts?: { limit?: number }) {
  const limit = opts?.limit ?? 5;

  return useQuery({
    queryKey: ['teacher', teacherId, 'upcomingLessons', { limit }],
    enabled: Boolean(teacherId),
    queryFn: async (): Promise<UpcomingLesson[]> => {
      if (!teacherId) {
        return [];
      }

      const nowIso = new Date().toISOString();

      // Step 1: Fetch bookings with student_id explicitly
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_at,
          end_at,
          mode,
          total_price,
          status,
          student_id,
          subject:subjects(id, name, name_he, icon)
        `)
        .eq('teacher_id', teacherId as string)
        .in('status', ['confirmed', 'awaiting_payment', 'pending'])
        .gte('start_at', nowIso)
        .order('start_at', { ascending: true })
        .limit(limit);

      if (bookingsError) {
        console.error('[useTeacherUpcomingLessons] Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      const safeBookings = (bookings || []) as any[];

      // Step 2: Extract unique student IDs
      const studentIds = Array.from(
        new Set(
          safeBookings
            .map((b) => b.student_id)
            .filter((id: any) => id != null && id !== undefined && (typeof id === 'string' ? id.trim().length > 0 : true))
        )
      ) as string[];

      // Step 3: Fetch students separately if we have any student IDs
      let studentsMap: Record<string, { id: string; first_name?: string; last_name?: string; avatar_url?: string }> = {};
      
      if (studentIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, avatar_url')
          .in('id', studentIds);

        if (studentsError) throw studentsError;

        // Step 4: Create map for easy lookup
        studentsMap = (students || []).reduce((acc: any, s: any) => {
          acc[s.id] = {
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            avatar_url: s.avatar_url,
          };
          return acc;
        }, {} as Record<string, { id: string; first_name?: string; last_name?: string; avatar_url?: string }>);
      } else {
        // no student ids to fetch
      }

      // Step 5: Merge student data back into bookings
      const result = safeBookings.map((row) => ({
        id: row.id,
        startAt: row.start_at,
        endAt: row.end_at,
        subject: row.subject || null,
        mode: (row.mode as any) || 'online',
        totalPrice: row.total_price ?? null,
        student: row.student_id ? (studentsMap[row.student_id] || null) : null,
        status: row.status,
      }));

      return result;
    },
    staleTime: 0, // Always consider data stale - fetch fresh data on mount and focus
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to the app/tab
    refetchOnMount: true, // Always refetch when component mounts
  });
}


