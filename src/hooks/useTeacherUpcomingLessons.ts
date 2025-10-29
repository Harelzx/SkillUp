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
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_at,
          end_at,
          subject:subjects(id, name, name_he, icon),
          mode,
          total_price,
          status,
          student:students!bookings_student_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('teacher_id', teacherId as string)
        .in('status', ['confirmed', 'awaiting_payment', 'pending'])
        .gte('start_at', nowIso)
        .order('start_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        startAt: row.start_at,
        endAt: row.end_at,
        subject: row.subject || null,
        mode: (row.mode as any) || 'online',
        totalPrice: row.total_price ?? null,
        student: row.student || null,
        status: row.status,
      }));
    },
    staleTime: 1000 * 60, // 1 min
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}


