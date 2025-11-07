/**
 * Lesson Tracking API functions
 * Functions for teachers to track and add notes to completed lessons
 */

import { supabase } from '@/lib/supabase';
import type { BookingWithDetails } from '@/types/api';

// ============================================
// Types
// ============================================

export interface LessonTracking {
  id: string;
  booking_id: string;
  teacher_id: string;
  student_id: string;
  note: string | null;
  note_summary: string | null;
  next_lesson_id: string | null;
  alert_minutes_before: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompletedLesson extends BookingWithDetails {
  tracking?: LessonTracking;
}

export interface LessonTrackingFilters {
  studentId?: string;
  subjectId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  cursor?: string; // For pagination (end_at timestamp)
  limit?: number; // Default 20
}

export interface LessonTrackingResponse {
  lessons: CompletedLesson[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================
// Get Teacher's Completed Lessons
// ============================================

/**
 * Get teacher's completed lessons with optional filters and pagination
 */
export async function getTeacherCompletedLessons(
  teacherId: string,
  filters: LessonTrackingFilters = {}
): Promise<LessonTrackingResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Security: Only allow teachers to view their own lessons
  if (user.id !== teacherId) {
    throw new Error('Unauthorized: Can only view own lessons');
  }

  const limit = filters.limit || 20;
  let query = supabase
    .from('bookings')
    .select(`
      *,
      student:students!bookings_student_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        phone
      ),
      subject:subjects(
        id,
        name,
        name_he,
        icon
      ),
      tracking:lesson_tracking!lesson_tracking_booking_id_fkey(*)
    `)
    .eq('teacher_id', teacherId)
    .neq('status', 'cancelled')
    .lte('end_at', new Date().toISOString())
    .order('end_at', { ascending: false });

  // Apply filters
  if (filters.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters.subjectId) {
    query = query.eq('subject_id', filters.subjectId);
  }

  if (filters.dateFrom) {
    query = query.gte('end_at', new Date(filters.dateFrom).toISOString());
  }

  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    query = query.lte('end_at', dateTo.toISOString());
  }

  // Cursor-based pagination
  if (filters.cursor) {
    query = query.lt('end_at', filters.cursor);
  }

  // Apply limit
  query = query.limit(limit + 1); // Fetch one extra to check if there's more

  const { data, error } = await query;

  if (error) {
    console.error('[LessonTrackingAPI] Error fetching completed lessons:', error);
    throw error;
  }

  const lessons = (data || []) as CompletedLesson[];
  const hasMore = lessons.length > limit;
  const lessonsToReturn = hasMore ? lessons.slice(0, limit) : lessons;
  const nextCursor = hasMore && lessonsToReturn.length > 0
    ? lessonsToReturn[lessonsToReturn.length - 1].end_at
    : null;

  return {
    lessons: lessonsToReturn,
    nextCursor,
    hasMore,
  };
}

// ============================================
// Get Lesson Tracking
// ============================================

/**
 * Get tracking details for a specific lesson
 */
export async function getLessonTracking(bookingId: string): Promise<LessonTracking | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First verify the booking belongs to the teacher
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('teacher_id')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  const bookingData = booking as { teacher_id: string };
  if (bookingData.teacher_id !== user.id) {
    throw new Error('Unauthorized: Can only view own lesson tracking');
  }

  const { data, error } = await supabase
    .from('lesson_tracking')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('[LessonTrackingAPI] Error fetching lesson tracking:', error);
    throw error;
  }

  return data as LessonTracking;
}

// ============================================
// Upsert Lesson Note
// ============================================

/**
 * Create or update a note for a lesson
 */
export async function upsertLessonNote(
  bookingId: string,
  note: string
): Promise<LessonTracking> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First verify the booking belongs to the teacher and is completed
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('teacher_id, student_id, end_at, status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  const bookingData = booking as {
    teacher_id: string;
    student_id: string;
    end_at: string;
    status: string;
  };

  if (bookingData.teacher_id !== user.id) {
    throw new Error('Unauthorized: Can only add notes to own lessons');
  }

  // Check if lesson is completed (end_at <= now)
  const now = new Date();
  const endAt = new Date(bookingData.end_at);
  if (endAt > now) {
    throw new Error('Cannot add notes to lessons that have not ended yet');
  }

  if (bookingData.status === 'cancelled') {
    throw new Error('Cannot add notes to cancelled lessons');
  }

  // Upsert the tracking entry
  const { data, error } = await supabase
    .from('lesson_tracking')
    .upsert({
      booking_id: bookingId,
      teacher_id: bookingData.teacher_id,
      student_id: bookingData.student_id,
      note: note.trim() || null,
    } as any, {
      onConflict: 'booking_id',
    })
    .select()
    .single();

  if (error) {
    console.error('[LessonTrackingAPI] Error upserting lesson note:', error);
    throw error;
  }

  return data as LessonTracking;
}

// ============================================
// Get Lesson Tracking Details
// ============================================

/**
 * Get full lesson details including tracking information
 */
export async function getLessonTrackingDetails(bookingId: string): Promise<CompletedLesson> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      student:students!bookings_student_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        phone
      ),
      subject:subjects(
        id,
        name,
        name_he,
        icon
      ),
      tracking:lesson_tracking!lesson_tracking_booking_id_fkey(*)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('[LessonTrackingAPI] Error fetching lesson details:', error);
    throw error;
  }

  const lesson = data as CompletedLesson;

  // Security check
  if (lesson.teacher_id !== user.id) {
    throw new Error('Unauthorized: Can only view own lesson details');
  }

  return lesson;
}

