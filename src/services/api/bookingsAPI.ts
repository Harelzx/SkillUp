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
 * Create a new booking (student creates booking)
 */
export async function createBooking(params: {
  teacherId: string;
  subjectId: string;
  startAt: string; // ISO datetime
  endAt: string;   // ISO datetime
  isOnline: boolean;
  location?: string;
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get teacher's hourly rate
  const { data: teacher, error: teacherError } = await supabase
    .from('profiles')
    .select('hourly_rate')
    .eq('id', params.teacherId)
    .single();

  if (teacherError) throw teacherError;
  if (!teacher.hourly_rate) throw new Error('Teacher hourly rate not set');

  // Calculate duration in hours
  const startTime = new Date(params.startAt);
  const endTime = new Date(params.endAt);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const price = teacher.hourly_rate * durationHours;

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      teacher_id: params.teacherId,
      student_id: user.id,
      subject_id: params.subjectId,
      start_at: params.startAt,
      end_at: params.endAt,
      price,
      is_online: params.isOnline,
      location: params.location,
      notes: params.notes,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
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
 * Cancel booking (with refund logic if needed)
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get booking details
  const booking = await getBookingById(bookingId);

  // Check if user is authorized to cancel
  if (booking.student_id !== user.id && booking.teacher_id !== user.id) {
    throw new Error('Not authorized to cancel this booking');
  }

  // Update booking status
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;

  // If student cancels and booking was confirmed, issue refund
  if (booking.student_id === user.id && booking.status === 'confirmed') {
    const { error: refundError } = await supabase
      .from('credit_transactions')
      .insert({
        student_id: user.id,
        amount: booking.price,
        type: 'refund',
        booking_id: bookingId,
        description: `החזר עבור שיעור שבוטל: ${booking.subject?.name_he}`,
      });

    if (refundError) throw refundError;
  }

  return data as Booking;
}

/**
 * Reschedule booking
 */
export async function rescheduleBooking(
  bookingId: string,
  newStartAt: string,
  newEndAt: string
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      start_at: newStartAt,
      end_at: newEndAt,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
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
