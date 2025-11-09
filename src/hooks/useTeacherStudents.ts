import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getTeacherStudentById,
  listTeacherStudents,
  type TeacherStudentCard,
  type TeacherStudentFilters,
  type TeacherStudentListResponse,
} from '@/services/api/teacherStudentsAPI';

export type UseTeacherStudentsFilters = Omit<TeacherStudentFilters, 'cursor'>;

export function useTeacherStudents(
  teacherId: string | undefined,
  filters: UseTeacherStudentsFilters = {}
) {
  return useInfiniteQuery<TeacherStudentListResponse>({
    queryKey: ['teacherStudents', teacherId, filters],
    enabled: Boolean(teacherId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!teacherId) {
        return { students: [], nextCursor: null, hasMore: false };
      }

      return listTeacherStudents(teacherId, {
        ...filters,
        cursor: pageParam ?? undefined,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : null,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useTeacherStudentDetail(
  teacherId: string | undefined,
  studentId: string | undefined
) {
  return useQuery<TeacherStudentCard | null>({
    queryKey: ['teacherStudent', teacherId, studentId],
    enabled: Boolean(teacherId) && Boolean(studentId),
    queryFn: async () => {
      if (!teacherId || !studentId) return null;
      return getTeacherStudentById(teacherId, studentId);
    },
    staleTime: 1000 * 30,
  });
}

