import { supabase } from '@/lib/supabase';
import type { Booking, BookingWithDetails } from '@/types/api';

// ============================================
// GET BOOKINGS
// ============================================

/**
 * Get bookings for current user (student or teacher)
 */
export async function getMyBookings(params?: {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  upcoming?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('bookings')
    .select(`
      *,
      teacher:profiles!bookings_teacher_id_fkey(id, display_name, avatar_url),
      student:profiles!bookings_student_id_fkey(id, display_name, avatar_url),
      subject:subjects(id, name, name_he, icon)
    `)
    .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('start_at', { ascending: true });

  // Filter by status
  if (params?.status) {
    query = query.eq('status', params.status);
  }

  // Filter upcoming/past
  if (params?.upcoming !== undefined) {
    if (params.upcoming) {
      query = query.gte('start_at', new Date().toISOString());
      // For upcoming, include confirmed, pending, and awaiting_payment statuses
      query = query.in('status', ['pending', 'confirmed', 'awaiting_payment']);
    } else {
      query = query.lt('start_at', new Date().toISOString());
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as BookingWithDetails[];
}

/**
 * Get teacher's bookings (for teacher interface)
 */
export async function getTeacherBookings(teacherId: string, params?: {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date?: string; // ISO date string
}) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!bookings_student_id_fkey(id, display_name, avatar_url, phone),
      subject:subjects(id, name, name_he, icon)
    `)
    .eq('teacher_id', teacherId)
    .order('start_at', { ascending: true });

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.date) {
    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte('start_at', startOfDay.toISOString())
      .lte('start_at', endOfDay.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as BookingWithDetails[];
}

/**
 * Get single booking by ID
 */
export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      teacher:profiles!bookings_teacher_id_fkey(id, display_name, avatar_url, phone, hourly_rate),
      student:profiles!bookings_student_id_fkey(id, display_name, avatar_url, phone),
      subject:subjects(id, name, name_he, icon)
    `)
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data as BookingWithDetails;
}

// ============================================
// CREATE & UPDATE BOOKINGS
// ============================================

/**
 * Create a new booking using atomic RPC function
 */
export async function createBooking(params: {
  teacherId: string;
  subject: string;
  mode: 'online' | 'student_location' | 'teacher_location';
  durationMinutes: 45 | 60 | 90;
  startAt: string; // ISO datetime
  timezone?: string;
  notes?: string;
  location?: string;
  studentLevelCategory: string;
  studentLevelProficiency: string;
  creditsToApply?: number;
  couponCode?: string;
  source?: string;
  paymentMethod?: 'apple_pay' | 'google_pay' | 'card' | 'credits' | 'bit';
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate idempotency key
  const idempotencyKey = `booking_${user.id}_${params.teacherId}_${params.startAt}_${Date.now()}`;

  // Map payment methods to database enum values
  // Database only supports: 'credits', 'card', 'card_sim'
  const mapPaymentMethod = (method?: string): 'card' | 'credits' | 'card_sim' => {
    if (!method || method === 'credits') return 'credits';
    if (method === 'card' || method === 'card_sim') return method;
    // Map mobile payment methods to 'card'
    if (method === 'apple_pay' || method === 'google_pay' || method === 'bit') return 'card';
    return 'card';
  };

  const { data, error} = await supabase.rpc('create_booking', {
    p_idempotency_key: idempotencyKey,
    p_teacher_id: params.teacherId,
    p_student_id: user.id,
    p_subject: params.subject,
    p_mode: params.mode,
    p_duration_minutes: params.durationMinutes,
    p_start_at: params.startAt,
    p_timezone: params.timezone || 'Asia/Jerusalem',
    p_notes: params.notes || null,
    p_location: params.location || null,
    p_student_level_category: params.studentLevelCategory,
    p_student_level_proficiency: params.studentLevelProficiency,
    p_credits_to_apply: params.creditsToApply || 0,
    p_coupon_code: params.couponCode || null,
    p_source: params.source || 'mobile',
    p_selected_payment_method: mapPaymentMethod(params.paymentMethod),
  });

  if (error) {
    console.error('[BookingAPI] Create booking error:', error);
    
    // Handle specific error codes
    if (error.code === '23505') {
      throw new Error('השעה הזו כבר תפוסה. אנא בחר שעה אחרת.');
    } else if (error.code === '53000') {
      throw new Error('התשלום נכשל. אנא נסה שוב.');
    } else if (error.code === '22000') {
      // Handle validation errors (duration, mode, etc.)
      if (error.message.includes('Duration') || error.message.includes('not supported by teacher')) {
        throw new Error('משך השיעור שנבחר אינו נתמך על ידי המורה. אנא בחר אופציה אחרת.');
      } else if (error.message.includes('Mode') || error.message.includes('not supported')) {
        throw new Error('סוג השיעור שנבחר אינו נתמך על ידי המורה. אנא בחר אופציה אחרת.');
      }
      throw new Error(error.message || 'נתונים לא תקינים. אנא בדוק את הפרטים ונסה שוב.');
    } else if (error.message.includes('Insufficient credits')) {
      throw new Error('אין מספיק קרדיטים. אנא הוסף קרדיטים או בחר באמצעי תשלום אחר.');
    } else if (error.message.includes('already booked') || error.message.includes('Time slot is already booked')) {
      throw new Error('השעה הזו כבר תפוסה. אנא בחר שעה אחרת.');
    }
    
    throw error;
  }

  return data as {
    booking_id: string;
    status: string;
    start_at: string;
    end_at: string;
    teacher_id: string;
    total_price: number;
    credits_applied: number;
    amount_charged: number;
    currency: string;
  };
}

/**
 * Update booking status (teacher confirms/cancels, student cancels)
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled' | 'completed'
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

/**
 * Cancel booking using atomic RPC function (with refund logic)
 */
export async function cancelBooking(
  bookingId: string, 
  reason?: string,
  refundMethod?: 'credits' | 'card_sim'
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_actor_user_id: user.id,
    p_reason: reason || 'Cancelled by user',
    p_refund_method: refundMethod || 'credits',
  });

  if (error) {
    console.error('[BookingAPI] Cancel booking error:', error);
    
    if (error.code === '42501') {
      throw new Error('אין לך הרשאה לבטל הזמנה זו');
    } else if (error.message.includes('already cancelled')) {
      throw new Error('ההזמנה כבר בוטלה');
    }
    
    throw error;
  }

  return data as {
    booking_id: string;
    status: string;
    refund: {
      method: string;
      amount: number;
    };
  };
}

/**
 * Reschedule booking using atomic RPC function
 */
export async function rescheduleBooking(
  bookingId: string,
  newStartAt: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('reschedule_booking', {
    p_booking_id: bookingId,
    p_actor_user_id: user.id,
    p_new_start_at: newStartAt,
  });

  if (error) {
    console.error('[BookingAPI] Reschedule booking error:', error);
    
    if (error.code === '42501') {
      throw new Error('אין לך הרשאה לשנות הזמנה זו');
    } else if (error.code === '23505') {
      throw new Error('השעה החדשה כבר תפוסה. אנא בחר שעה אחרת.');
    } else if (error.message.includes('Cannot reschedule')) {
      throw new Error('לא ניתן לשנות הזמנה זו. אנא בטל ויצור הזמנה חדשה.');
    }
    
    throw error;
  }

  return data as {
    booking_id: string;
    old_start_at: string;
    new_start_at: string;
    status: string;
  };
}

// ============================================
// BOOKING VALIDATION
// ============================================

/**
 * Check if teacher is available at given time
 */
export async function checkTeacherAvailability(
  teacherId: string,
  startAt: string,
  endAt: string
) {
  // Check for conflicting bookings
  const { data: conflictingBookings, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('teacher_id', teacherId)
    .in('status', ['pending', 'confirmed'])
    .or(`start_at.lte.${startAt},end_at.gte.${endAt}`)
    .or(`start_at.gte.${startAt},start_at.lt.${endAt}`);

  if (error) throw error;

  return {
    isAvailable: conflictingBookings.length === 0,
    conflictingBookings,
  };
}

/**
 * Get available time slots for a teacher on a specific date
 */
export async function getAvailableTimeSlots(
  teacherId: string,
  date: string, // YYYY-MM-DD
  durationMinutes: number = 60
) {
  const dayOfWeek = new Date(date).getDay();

  // Get teacher's availability for this day
  const { data: availability } = await supabase
    .from('teacher_availability')
    .select('start_time, end_time')
    .eq('teacher_id', teacherId)
    .eq('weekday', dayOfWeek)
    .eq('is_active', true);

  if (!availability || availability.length === 0) {
    return [];
  }

  // Get existing bookings for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_at, end_at')
    .eq('teacher_id', teacherId)
    .in('status', ['pending', 'confirmed'])
    .gte('start_at', startOfDay.toISOString())
    .lte('start_at', endOfDay.toISOString());

  // Generate available time slots
  const slots: { start: string; end: string }[] = [];

  availability.forEach(slot => {
    const [startHour, startMin] = slot.start_time.split(':').map(Number);
    const [endHour, endMin] = slot.end_time.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMin, 0, 0);

    while (currentTime < slotEnd) {
      const slotStartTime = new Date(currentTime);
      const slotEndTime = new Date(currentTime.getTime() + durationMinutes * 60000);

      if (slotEndTime <= slotEnd) {
        // Check if this slot conflicts with any booking
        const hasConflict = bookings?.some(booking => {
          const bookingStart = new Date(booking.start_at);
          const bookingEnd = new Date(booking.end_at);
          return (
            (slotStartTime >= bookingStart && slotStartTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (slotStartTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        if (!hasConflict) {
          slots.push({
            start: slotStartTime.toISOString(),
            end: slotEndTime.toISOString(),
          });
        }
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute increments
    }
  });

  return slots;
}
