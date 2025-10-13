import { supabase } from '@/lib/supabase';
import type {
  TeacherProfile,
  Subject,
  TeacherAvailability,
  Review
} from '@/types/api';

// ============================================
// TEACHER PROFILES
// ============================================

/**
 * Get teacher profile with stats by ID
 */
export async function getTeacherById(teacherId: string) {
  const { data, error } = await supabase
    .from('teacher_profiles_with_stats')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error) throw error;
  return data as TeacherProfile;
}

/**
 * Get all teachers with pagination and filters
 */
export async function getTeachers(params?: {
  subjectId?: string;
  location?: string;
  minRate?: number;
  maxRate?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('teacher_profiles_with_stats')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('avg_rating', { ascending: false, nullsFirst: false });

  // Filter by subject
  if (params?.subjectId) {
    query = query.contains('subject_ids', [params.subjectId]);
  }

  // Filter by location
  if (params?.location) {
    query = query.ilike('location', `%${params.location}%`);
  }

  // Filter by hourly rate range
  if (params?.minRate !== undefined) {
    query = query.gte('hourly_rate', params.minRate);
  }
  if (params?.maxRate !== undefined) {
    query = query.lte('hourly_rate', params.maxRate);
  }

  // Search by name or bio
  if (params?.searchQuery) {
    query = query.or(
      `display_name.ilike.%${params.searchQuery}%,bio.ilike.%${params.searchQuery}%`
    );
  }

  // Pagination
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { teachers: data as TeacherProfile[], total: count || 0 };
}

/**
 * Get featured/top teachers
 */
export async function getFeaturedTeachers(limit: number = 10) {
  const { data, error } = await supabase
    .from('teacher_profiles_with_stats')
    .select('*')
    .eq('is_active', true)
    .eq('is_verified', true)
    // In development: show all verified teachers
    // In production: uncomment the rating/review filters
    // .gte('avg_rating', 4.5)
    // .gte('review_count', 5)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .order('total_students', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TeacherProfile[];
}

// ============================================
// TEACHER SUBJECTS
// ============================================

/**
 * Get all subjects
 */
export async function getSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name_he');

  if (error) throw error;
  return data as Subject[];
}

/**
 * Get subjects by category
 */
export async function getSubjectsByCategory(category: string) {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('category', category)
    .order('name_he');

  if (error) throw error;
  return data as Subject[];
}

/**
 * Get teacher's subjects
 */
export async function getTeacherSubjects(teacherId: string) {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('subject_id, subjects(*)')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return data.map(item => (item as any).subjects) as Subject[];
}

// ============================================
// TEACHER AVAILABILITY
// ============================================

/**
 * Get teacher's weekly availability
 */
export async function getTeacherAvailability(teacherId: string) {
  const { data, error } = await supabase
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('weekday')
    .order('start_time');

  if (error) throw error;
  return data as TeacherAvailability[];
}

/**
 * Update teacher's availability (for teacher role)
 */
export async function updateTeacherAvailability(
  teacherId: string,
  availability: Omit<TeacherAvailability, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>[]
) {
  // Delete existing availability
  const { error: deleteError } = await supabase
    .from('teacher_availability')
    .delete()
    .eq('teacher_id', teacherId);

  if (deleteError) throw deleteError;

  // Insert new availability
  const availabilityData = availability.map(item => ({
    ...item,
    teacher_id: teacherId,
  }));

  const { data, error } = await supabase
    .from('teacher_availability')
    .insert(availabilityData as any)
    .select();

  if (error) throw error;
  return data as TeacherAvailability[];
}

// ============================================
// TEACHER REVIEWS
// ============================================

/**
 * Get reviews for a teacher
 */
export async function getTeacherReviews(teacherId: string, limit?: number) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      student:profiles!reviews_student_id_fkey(id, display_name, avatar_url)
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Review[];
}

/**
 * Get teacher's average rating and review count
 */
export async function getTeacherRatingStats(teacherId: string) {
  const { data: avgRating } = await supabase.rpc('get_teacher_avg_rating', {
    teacher_uuid: teacherId,
  } as any);

  const { data: reviewCount } = await supabase.rpc('get_teacher_review_count', {
    teacher_uuid: teacherId,
  } as any);

  return {
    avgRating: avgRating || 0,
    reviewCount: reviewCount || 0,
  };
}

// ============================================
// TEACHER PROFILE UPDATES (for teacher role)
// ============================================

// NOTE: updateTeacherProfile has been moved to teacherAPI.ts
// It now uses RPC with JSONB to bypass PostgREST cache issues

/**
 * Update teacher subjects
 */
export async function updateTeacherSubjects(teacherId: string, subjectIds: string[]) {
  // Delete existing subjects
  const { error: deleteError } = await supabase
    .from('teacher_subjects')
    .delete()
    .eq('teacher_id', teacherId);

  if (deleteError) throw deleteError;

  // Insert new subjects
  const subjectData = subjectIds.map(subjectId => ({
    teacher_id: teacherId,
    subject_id: subjectId,
  }));

  const { data, error } = await supabase
    .from('teacher_subjects')
    .insert(subjectData as any)
    .select();

  if (error) throw error;
  return data;
}
