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
        console.error('❌ [useTeacherUpcomingLessons] Bookings query error:', bookingsError);
        throw bookingsError;
      }

      const safeBookings = (bookings || []) as any[];
      
      // DEBUG: Log what we got from bookings query
      console.log('📚 [useTeacherUpcomingLessons] Bookings query result:', {
        count: safeBookings.length,
        bookings: safeBookings.map((b: any) => ({
          id: b.id,
          student_id: b.student_id,
          student_id_type: typeof b.student_id,
          has_student_id: 'student_id' in b,
          all_keys: Object.keys(b),
        })),
      });
      
      // Log first booking in full detail
      if (safeBookings.length > 0) {
        console.log('📚 [useTeacherUpcomingLessons] First booking FULL data:', JSON.stringify(safeBookings[0], null, 2));
      }

      // Step 2: Extract unique student IDs
      const studentIds = Array.from(
        new Set(
          safeBookings
            .map((b) => b.student_id)
            .filter((id: any) => id != null && id !== undefined && (typeof id === 'string' ? id.trim().length > 0 : true))
        )
      ) as string[];
      
      console.log('👥 [useTeacherUpcomingLessons] Extracted student IDs:', {
        count: studentIds.length,
        ids: studentIds,
      });

      // Step 3: Fetch students separately if we have any student IDs
      let studentsMap: Record<string, { id: string; first_name?: string; last_name?: string; avatar_url?: string }> = {};
      
      if (studentIds.length > 0) {
        console.log('🔍 [useTeacherUpcomingLessons] Fetching students with IDs:', studentIds);
        
        // DEBUG: Test direct student query for the specific student mentioned
        const testStudentId = '4f2970cf-601a-41d6-b897-e8cd7298003d';
        if (studentIds.includes(testStudentId)) {
          console.log('🧪 [useTeacherUpcomingLessons] Testing direct query for student:', testStudentId);
          const { data: testStudent, error: testError } = await supabase
            .from('students')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', testStudentId)
            .single();
          
          console.log('🧪 [useTeacherUpcomingLessons] Test student query result:', {
            found: !!testStudent,
            error: testError,
            student: testStudent,
          });
        }
        
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, avatar_url')
          .in('id', studentIds);

        if (studentsError) {
          console.error('❌ [useTeacherUpcomingLessons] Error fetching students:', studentsError);
          console.error('   Error code:', studentsError.code);
          console.error('   Error message:', studentsError.message);
          console.error('   Error details:', studentsError.details);
          throw studentsError;
        }

        console.log('✅ [useTeacherUpcomingLessons] Students query result:', {
          count: students?.length || 0,
          students: students?.map((s: any) => ({
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
          })),
        });

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
        
        console.log('🗺️ [useTeacherUpcomingLessons] Students map created:', {
          keys: Object.keys(studentsMap),
          entries: Object.entries(studentsMap).map(([id, data]) => ({ id, name: `${(data as any).first_name} ${(data as any).last_name}` })),
        });
      } else {
        console.warn('⚠️ [useTeacherUpcomingLessons] No student IDs to fetch!');
      }

      // Step 5: Merge student data back into bookings
      const result = safeBookings.map((row) => {
        const student = row.student_id ? (studentsMap[row.student_id] || null) : null;
        
        console.log(`🔗 [useTeacherUpcomingLessons] Merging booking ${row.id}:`, {
          booking_id: row.id,
          student_id_from_row: row.student_id,
          student_found_in_map: !!student,
          student_name: student ? `${student.first_name} ${student.last_name}` : 'null',
          map_keys: Object.keys(studentsMap),
        });
        
        return {
          id: row.id,
          startAt: row.start_at,
          endAt: row.end_at,
          subject: row.subject || null,
          mode: (row.mode as any) || 'online',
          totalPrice: row.total_price ?? null,
          student: student,
          status: row.status,
        };
      });
      
      console.log('🎯 [useTeacherUpcomingLessons] Final result:', {
        count: result.length,
        lessons: result.map(l => ({
          id: l.id,
          student: l.student ? `${l.student.first_name} ${l.student.last_name}` : 'null',
          hasStudent: !!l.student,
        })),
      });
      
      return result;
    },
    staleTime: 1000 * 60, // 1 min
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}


