import { supabase } from '@/lib/supabase';
import type { TeacherStudentSummary } from '@/types/api';

// ============================================
// Types
// ============================================

export interface TeacherStudentFilters {
  search?: string;
  subjectId?: string;
  status?: 'active' | 'inactive';
  limit?: number;
  cursor?: string; // ISO timestamp for updated_at pagination
}

export interface TeacherStudentCard extends TeacherStudentSummary {
  student_name: string;
  student_first_name: string | null;
  student_last_name: string | null;
  student_birth_date: string | null;
  student_avatar_url: string | null;
  age: number | null;
  topic: {
    id: string | null;
    name: string | null;
    name_he: string | null;
  };
}

export interface TeacherStudentListResponse {
  students: TeacherStudentCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

type TeacherStudentRow = TeacherStudentSummary & {
  student?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
    avatar_url: string | null;
  } | null;
};

// ============================================
// Helpers
// ============================================

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const m = now.getUTCMonth() - parsed.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < parsed.getUTCDate())) {
    age--;
  }
  return Math.max(0, age);
}

// ============================================
// API Calls
// ============================================

export async function listTeacherStudents(
  teacherId: string,
  filters: TeacherStudentFilters = {}
): Promise<TeacherStudentListResponse> {
  const limit = filters.limit ?? 20;
  let query = supabase
    .from('teacher_student_summary')
    .select(
      `
        teacher_id,
        student_id,
        status,
        first_lesson_at,
        last_lesson_at,
        completed_count,
        cancelled_count,
        primary_subject_id,
        primary_subject_name,
        primary_subject_name_he,
        created_at,
        updated_at,
        student:students!teacher_student_summary_student_id_fkey (
          id,
          first_name,
          last_name,
          birth_date,
          avatar_url
        )
      `
    )
    .eq('teacher_id', teacherId)
    .order('updated_at', { ascending: false })
    .limit(limit + 1);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.subjectId) {
    query = query.eq('primary_subject_id', filters.subjectId);
  }

  if (filters.cursor) {
    query = query.lt('updated_at', filters.cursor);
  }

  if (filters.search) {
    const term = escapeIlike(filters.search.trim());
    if (term.length > 0) {
      query = query.or(
        `students.first_name.ilike.%${term}%,students.last_name.ilike.%${term}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[teacherStudentsAPI] listTeacherStudents error:', error);
    throw error;
  }

  const rows = (data ?? []) as TeacherStudentRow[];
  const hasMore = rows.length > limit;
  const studentsToReturn: TeacherStudentRow[] = hasMore ? rows.slice(0, limit) : rows;

  const students: TeacherStudentCard[] = studentsToReturn.map((row: TeacherStudentRow) => {
    const student = row.student ?? null;
    const firstName = student?.first_name ?? null;
    const lastName = student?.last_name ?? null;
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'תלמיד/ה';

    const birthDate = student?.birth_date ?? null;

    return {
      teacher_id: row.teacher_id,
      student_id: row.student_id,
      status: row.status,
      first_lesson_at: row.first_lesson_at,
      last_lesson_at: row.last_lesson_at,
      completed_count: row.completed_count,
      cancelled_count: row.cancelled_count,
      primary_subject_id: row.primary_subject_id ?? null,
      primary_subject_name: row.primary_subject_name ?? null,
      primary_subject_name_he: row.primary_subject_name_he ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student_name: displayName,
      student_first_name: firstName,
      student_last_name: lastName,
      student_birth_date: birthDate,
      student_avatar_url: student?.avatar_url ?? null,
      age: calculateAge(birthDate),
      topic: {
        id: row.primary_subject_id ?? null,
        name: row.primary_subject_name ?? null,
        name_he: row.primary_subject_name_he ?? row.primary_subject_name ?? null,
      },
    };
  });

  const nextCursor =
    hasMore && students.length > 0 ? students[students.length - 1].updated_at : null;

  return {
    students,
    nextCursor,
    hasMore,
  };
}

export async function getTeacherStudentById(
  teacherId: string,
  studentId: string
): Promise<TeacherStudentCard | null> {
  const { data, error } = await supabase
    .from('teacher_student_summary')
    .select(
      `
        teacher_id,
        student_id,
        status,
        first_lesson_at,
        last_lesson_at,
        completed_count,
        cancelled_count,
        primary_subject_id,
        primary_subject_name,
        primary_subject_name_he,
        created_at,
        updated_at,
        student:students!teacher_student_summary_student_id_fkey (
          id,
          first_name,
          last_name,
          birth_date,
          avatar_url
        )
      `
    )
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    console.error('[teacherStudentsAPI] getTeacherStudentById error:', error);
    throw error;
  }

  if (!data) return null;

  const row: TeacherStudentRow = data as TeacherStudentRow;
  const student = row.student ?? null;
  const firstName = student?.first_name ?? null;
  const lastName = student?.last_name ?? null;
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'תלמיד/ה';

  const birthDate = student?.birth_date ?? null;

  return {
    teacher_id: row.teacher_id,
    student_id: row.student_id,
    status: row.status,
    first_lesson_at: row.first_lesson_at,
    last_lesson_at: row.last_lesson_at,
    completed_count: row.completed_count,
    cancelled_count: row.cancelled_count,
    primary_subject_id: row.primary_subject_id ?? null,
    primary_subject_name: row.primary_subject_name ?? null,
    primary_subject_name_he: row.primary_subject_name_he ?? row.primary_subject_name ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student_name: displayName,
    student_first_name: firstName,
    student_last_name: lastName,
    student_birth_date: birthDate,
    student_avatar_url: student?.avatar_url ?? null,
    age: calculateAge(birthDate),
    topic: {
      id: row.primary_subject_id ?? null,
      name: row.primary_subject_name ?? null,
      name_he: row.primary_subject_name_he ?? row.primary_subject_name ?? null,
    },
  };
}

