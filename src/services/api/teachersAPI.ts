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
 * Query from teachers table with subjects and stats
 */
export async function getTeacherById(teacherId: string) {
  // Query from teachers table directly
  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error) {
    console.error('❌ Error fetching teacher by ID:', error);
    throw error;
  }

  // Get subjects
  const { data: subjectsData } = await supabase
    .from('teacher_subjects')
    .select('subject_id, subjects(id, name_he)')
    .eq('teacher_id', teacherId);
  
  const subjectNames = subjectsData?.map((item: any) => item.subjects?.name_he).filter(Boolean) || [];
  const subjectIds = subjectsData?.map((item: any) => item.subject_id).filter(Boolean) || [];
  
  // Get ratings and stats
  const { data: avgRating } = await supabase
    .rpc('get_teacher_avg_rating', { teacher_uuid: teacherId } as any);
  
  const { data: reviewCount } = await supabase
    .rpc('get_teacher_review_count', { teacher_uuid: teacherId } as any);
  
  const teacherData = teacher as any;
  if (!teacherData) throw new Error('Teacher not found');
  
  return {
    ...teacherData,
    subject_names: subjectNames,
    subject_ids: subjectIds,
    avg_rating: avgRating || 0,
    review_count: reviewCount || 0,
  } as TeacherProfile;
}

/**
 * Get all teachers with pagination and filters
 */
export async function getTeachers(params?: {
  subjectIds?: string[];
  location?: string;
  regionId?: string;
  cityId?: string;
  minRate?: number;
  maxRate?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}) {
  // Query from teachers table directly to show new teachers
  let query = supabase
    .from('teachers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Filter by subject - will be done after fetching subjects

  // Filter by region (new structured approach)
  if (params?.regionId) {
    query = query.eq('region_id', params.regionId);
  }

  // Filter by city (more specific than region)
  if (params?.cityId) {
    query = query.eq('city_id', params.cityId);
  }

  // Filter by location (legacy text-based search, fallback)
  if (params?.location && !params?.regionId && !params?.cityId) {
    query = query.ilike('location', `%${params.location}%`);
  }

  // Filter by hourly rate range - handle NULL rates properly
  // Apply filters only for non-null rates, filter after in-memory
  const minRate = params?.minRate !== undefined && params.minRate > 0 ? params.minRate : undefined;
  const maxRate = params?.maxRate !== undefined && params.maxRate > 0 ? params.maxRate : undefined;
  
  // Don't apply rate filters in query, do it in memory to handle NULL

  // Search by name, bio, or subjects
  if (params?.searchQuery) {
    // Search in display_name, bio
    // Note: PostgreSQL array to text search requires RPC or textSearch
    // For now, we search name and bio, then filter subjects client-side
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

  // עכשיו מושכים subjects בנפרד עבור כל מורה
  const teachersWithSubjects = await Promise.all(
    (data || []).map(async (teacher: any) => {
      // שליפת subjects מ-teacher_subjects
      const { data: subjectsData } = await supabase
        .from('teacher_subjects')
        .select('subject_id, subjects(id, name_he)')
        .eq('teacher_id', teacher.id);
      
      const subjectNames = subjectsData?.map((item: any) => item.subjects?.name_he).filter(Boolean) || [];
      const subjectIds = subjectsData?.map((item: any) => item.subject_id).filter(Boolean) || [];
      
      // שליפת rating ו-review count
      const { data: avgRating } = await supabase
        .rpc('get_teacher_avg_rating', { teacher_uuid: teacher.id } as any);
      
      const { data: reviewCount } = await supabase
        .rpc('get_teacher_review_count', { teacher_uuid: teacher.id } as any);
      
      return {
        ...teacher,
        subject_names: subjectNames,
        subject_ids: subjectIds,
        avg_rating: avgRating || 0,
        review_count: reviewCount || 0,
      };
    })
  );

  // עכשיו מסננים לפי subjects ו-hourly_rate אם צריך
  let filtered = teachersWithSubjects;
  
  // סינון hourly_rate בזיכרון (לטיפול ב-NULL)
  if (minRate !== undefined || maxRate !== undefined) {
    filtered = filtered.filter(teacher => {
      const rate = teacher.hourly_rate;
      if (rate === null || rate === undefined) return true; // כלול מורים ללא מחיר
      if (minRate !== undefined && rate < minRate) return false;
      if (maxRate !== undefined && rate > maxRate) return false;
      return true;
    });
  }
  
  if (params?.subjectIds && params.subjectIds.length > 0) {
    filtered = filtered.filter(teacher =>
      teacher.subject_ids.some((id: string) => params.subjectIds!.includes(id))
    );
  }

  // סינון לפי searchQuery בנושאים (client-side)
  if (params?.searchQuery) {
    const queryLower = params.searchQuery.toLowerCase();
    filtered = filtered.filter(teacher => {
      const hasMatch = teacher.display_name?.toLowerCase().includes(queryLower) ||
                      teacher.bio?.toLowerCase().includes(queryLower) ||
                      teacher.subject_names?.some((s: string) => s.toLowerCase().includes(queryLower));
      return hasMatch;
    });
  }

  return { teachers: filtered as TeacherProfile[], total: filtered.length };
}

/**
 * Get featured/top teachers
 */
export async function getFeaturedTeachers(limit: number = 10) {
  // Query from teachers table directly to show new teachers immediately
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      id,
      display_name,
      bio,
      avatar_url,
      hourly_rate,
      location,
      experience_years,
      total_students,
      is_active,
      is_verified,
      created_at
    `)
    .eq('is_active', true)
    // Remove .eq('is_verified', true) to show unverified teachers too
    .order('created_at', { ascending: false })
    .order('total_students', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  // Get subjects and stats separately for each teacher (allows NULL ratings)
  const teachersWithSubjects = await Promise.all(
    (data || []).map(async (teacher: any) => {
      // Get subjects
      const { data: subjectsData } = await supabase
        .from('teacher_subjects')
        .select('subject_id, subjects(name_he)')
        .eq('teacher_id', teacher.id);
      
      const subjectNames = subjectsData?.map((item: any) => item.subjects?.name_he).filter(Boolean) || [];
      
      // Get avg rating (nullable)
      const { data: avgRating } = await supabase
        .rpc('get_teacher_avg_rating', { teacher_uuid: teacher.id } as any);
      
      // Get review count (nullable)
      const { data: reviewCount } = await supabase
        .rpc('get_teacher_review_count', { teacher_uuid: teacher.id } as any);
      
      return {
        ...teacher,
        subject_names: subjectNames,
        avg_rating: avgRating || 0,
        review_count: reviewCount || 0,
      };
    })
  );
  
  return teachersWithSubjects as TeacherProfile[];
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
