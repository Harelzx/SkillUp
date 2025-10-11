import { supabase } from '@/src/lib/supabase';
import type { Review } from '@/src/types/api';

// ============================================
// GET REVIEWS
// ============================================

/**
 * Get reviews for a specific teacher
 */
export async function getTeacherReviews(
  teacherId: string,
  params?: {
    limit?: number;
    offset?: number;
  }
) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      student:profiles!reviews_student_id_fkey(id, display_name, avatar_url),
      booking:bookings(id, subject:subjects(name_he))
    `, { count: 'exact' })
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    reviews: data as Review[],
    total: count || 0,
  };
}

/**
 * Get student's reviews (reviews written by the student)
 */
export async function getMyReviews() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      teacher:profiles!reviews_teacher_id_fkey(id, display_name, avatar_url),
      booking:bookings(id, subject:subjects(name_he))
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Review[];
}

/**
 * Get review by booking ID (to check if student already reviewed)
 */
export async function getReviewByBookingId(bookingId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) throw error;
  return data as Review | null;
}

// ============================================
// CREATE & UPDATE REVIEWS
// ============================================

/**
 * Create a new review (student reviews teacher after completed lesson)
 */
export async function createReview(params: {
  bookingId: string;
  teacherId: string;
  rating: number;
  text?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate that booking exists and is completed
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('status, student_id, teacher_id')
    .eq('id', params.bookingId)
    .single();

  if (bookingError) throw bookingError;

  if (booking.status !== 'completed') {
    throw new Error('Can only review completed bookings');
  }

  if (booking.student_id !== user.id) {
    throw new Error('Not authorized to review this booking');
  }

  if (booking.teacher_id !== params.teacherId) {
    throw new Error('Teacher ID does not match booking');
  }

  // Check if review already exists
  const existingReview = await getReviewByBookingId(params.bookingId);
  if (existingReview) {
    throw new Error('Review already exists for this booking');
  }

  // Validate rating
  if (params.rating < 1 || params.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: params.bookingId,
      teacher_id: params.teacherId,
      student_id: user.id,
      rating: params.rating,
      text: params.text,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Update existing review (student can edit their review)
 */
export async function updateReview(
  reviewId: string,
  updates: {
    rating?: number;
    text?: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate rating if provided
  if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
    throw new Error('Rating must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('student_id', user.id) // Ensure user owns this review
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Delete review (student can delete their review)
 */
export async function deleteReview(reviewId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('student_id', user.id); // Ensure user owns this review

  if (error) throw error;
  return { success: true };
}

// ============================================
// REVIEW STATISTICS
// ============================================

/**
 * Get teacher's rating statistics
 */
export async function getTeacherRatingStats(teacherId: string) {
  // Get average rating
  const { data: avgRating, error: avgError } = await supabase
    .rpc('get_teacher_avg_rating', { teacher_uuid: teacherId });

  if (avgError) throw avgError;

  // Get review count
  const { data: reviewCount, error: countError } = await supabase
    .rpc('get_teacher_review_count', { teacher_uuid: teacherId });

  if (countError) throw countError;

  // Get rating distribution
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('teacher_id', teacherId);

  if (reviewsError) throw reviewsError;

  // Calculate distribution
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  reviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++;
  });

  return {
    avgRating: avgRating || 0,
    reviewCount: reviewCount || 0,
    distribution,
  };
}

/**
 * Get bookings that can be reviewed (completed bookings without reviews)
 */
export async function getReviewableBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      teacher:profiles!bookings_teacher_id_fkey(id, display_name, avatar_url),
      subject:subjects(id, name_he, icon),
      reviews!left(id)
    `)
    .eq('student_id', user.id)
    .eq('status', 'completed')
    .is('reviews.id', null)
    .order('end_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}
