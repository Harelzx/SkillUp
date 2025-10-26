import { useQuery } from '@tanstack/react-query';
import { getTeacherById, getTeacherSubjects } from '@/services/api/teachersAPI';
import { supabase } from '@/lib/supabase';
import type { TeacherProfile, Subject } from '@/types/api';

export type BookingMode = 'online' | 'student_location' | 'teacher_location';

export interface TeacherBookingProfile extends TeacherProfile {
  subjects: Subject[];
  lesson_modes: BookingMode[];
  region?: string;
  areas?: string[];
  duration_options?: number[];
  max_students?: number;
  notice_required_hours?: number;
}

interface UseTeacherBookingDataOptions {
  enabled?: boolean;
}

/**
 * Centralized hook to fetch all teacher data needed for booking flow
 * - Teacher profile (name, avatar, rate, location, etc.)
 * - Subjects they teach
 * - Lesson modes supported
 * - Region/areas served
 * - Duration options
 * 
 * @param teacherId - Teacher UUID
 * @param options - Query options
 */
export function useTeacherBookingData(
  teacherId: string | null | undefined,
  options?: UseTeacherBookingDataOptions
) {
  return useQuery({
    queryKey: ['teacher-booking-data', teacherId],
    queryFn: async () => {
      if (!teacherId) {
        throw new Error('teacherId is required');
      }

      // 1. Get teacher profile with stats
      const profile = await getTeacherById(teacherId);

      if (!profile.is_active) {
        throw new Error('המורה אינו פעיל כעת');
      }

      // 2. Get teacher's subjects
      const subjects = await getTeacherSubjects(teacherId);

      if (!subjects || subjects.length === 0) {
        throw new Error('המורה לא הגדיר נושאי הוראה');
      }

      // 3. Get teacher settings from teachers table (lesson_modes, duration_options, etc.)
      const { data: teacherSettings } = await supabase
        .from('teachers')
        .select('lesson_modes, duration_options, regions, timezone')
        .eq('id', teacherId)
        .single();

      // 4. Determine supported lesson modes from profile or default
      const lessonModesRaw = teacherSettings?.lesson_modes || ['online', 'at_teacher', 'at_student'];
      
      // Map lesson modes to BookingMode format
      const lessonModes: BookingMode[] = lessonModesRaw.map(mode => {
        if (mode === 'at_teacher') return 'teacher_location';
        if (mode === 'at_student') return 'student_location';
        return 'online';
      }) as BookingMode[];

      // 5. Get regions from profile
      const regions = teacherSettings?.regions || [];
      const location = profile.location || '';

      // 6. Build the complete booking profile
      const bookingProfile: TeacherBookingProfile = {
        ...profile,
        subjects,
        lesson_modes: lessonModes,
        region: regions[0] || location,
        areas: regions.length > 1 ? regions : undefined,
        duration_options: teacherSettings?.duration_options || [45, 60, 90],
        max_students: 1,
        notice_required_hours: 24,
      };

      return bookingProfile;
    },
    enabled: options?.enabled !== false && !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to check if teacher data is ready for booking
 */
export function useIsTeacherReady(teacherId: string | null | undefined) {
  const { data, isLoading, error } = useTeacherBookingData(teacherId);

  return {
    isReady: !!data && !isLoading && !error,
    isLoading,
    error: error as Error | null,
    teacher: data,
  };
}

