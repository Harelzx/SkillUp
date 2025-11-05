/**
 * Teacher-specific API functions
 * Functions for teachers to manage their profile and availability
 */

import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export interface TeacherProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  hourlyRate: number;
  lessonModes: ('online' | 'at_teacher' | 'at_student')[];
  durationOptions: number[];
  regions?: string[];
  timezone: string;
  teachingStyle?: string;
  location?: string;
  education?: string[];
  languages?: string[];
  experienceYears?: number;
  regionId?: string;
  cityId?: string;
}

export interface AvailabilitySlot {
  id: string;
  teacherId: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  bookingId?: string;
}

export interface SlotInput {
  start_time: string;  // HH:MM format
  end_time: string;    // HH:MM format
}

// ============================================
// Teacher Profile Management
// ============================================

/**
 * Update teacher profile
 */
export async function updateTeacherProfile(
  teacherId: string,
  updates: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    hourlyRate?: number;
    lessonModes?: ('online' | 'at_teacher' | 'at_student')[];
    durationOptions?: number[];
    regions?: string[];
    regionId?: string;
    cityId?: string;
    timezone?: string;
    teachingStyle?: string;
    location?: string;
    phone?: string;
    education?: string[];
    languages?: string[];
    experienceYears?: number;
  }
): Promise<{ success: boolean; profile: any }> {
  console.log('🔵 [teacherAPI] updateTeacherProfile called with:', { teacherId, updates });

  // Use the correct RPC function that updates BOTH teachers and profiles tables
  // This function is from migration 033 and handles all fields including education, languages, experience
  const { data, error } = await supabase.rpc('update_teacher_profile', {
    p_teacher_id: teacherId,
    p_display_name: updates.displayName ?? null,
    p_bio: updates.bio ?? null,
    p_phone_number: updates.phone ?? null,
    p_hourly_rate: updates.hourlyRate ?? null,
    p_location: updates.location ?? null,
    p_region_id: updates.regionId ?? null,
    p_city_id: updates.cityId ?? null,
    p_lesson_modes: updates.lessonModes ?? null,
    p_duration_options: updates.durationOptions ?? null,
    p_avatar_url: updates.avatarUrl ?? null,
    p_education: updates.education ?? null,
    p_languages: updates.languages ?? null,
    p_experience_years: updates.experienceYears ?? null,
  } as any);

  if (error) {
    console.error('❌ [teacherAPI] Error updating teacher profile:', error);
    console.error('❌ [teacherAPI] Error code:', error.code);
    console.error('❌ [teacherAPI] Error message:', error.message);
    console.error('❌ [teacherAPI] Full error object:', JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }

  console.log('✅ [teacherAPI] Profile update successful, result:', data);

  const result = data as any;
  if (!result?.success) {
    throw new Error(result?.error || 'Update failed');
  }

  return {
    success: true,
    profile: result,
  };
}

/**
 * Get teacher profile by ID
 */
export async function getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
  console.log('🔵 Fetching teacher profile:', teacherId);
  
  try {
    // Fetch from teachers table
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        display_name,
        bio,
        avatar_url,
        hourly_rate,
        location,
        lesson_modes,
        duration_options,
        regions,
        timezone,
        teaching_style,
        education,
        languages,
        experience_years,
        region_id,
        city_id
      `)
      .eq('id', teacherId)
      .single();

    if (error) {
      console.error('❌ Error fetching teacher profile:', error);
      throw error;
    }

    if (!data) return null;

    const profileData = data as any;
    console.log('✅ Teacher profile fetched successfully');
    console.log('📊 [getTeacherProfile] Raw data from DB:', JSON.stringify(profileData, null, 2));

    const result = {
      id: profileData.id,
      displayName: profileData.display_name,
      bio: profileData.bio,
      avatarUrl: profileData.avatar_url,
      hourlyRate: profileData.hourly_rate || 150,
      lessonModes: profileData.lesson_modes || ['online', 'at_teacher', 'at_student'],
      durationOptions: profileData.duration_options || [45, 60, 90],
      regions: profileData.regions || [],
      timezone: profileData.timezone || 'Asia/Jerusalem',
      teachingStyle: profileData.teaching_style,
      location: profileData.location,
      education: profileData.education || [],
      languages: profileData.languages || [],
      experienceYears: profileData.experience_years,
      regionId: profileData.region_id,
      cityId: profileData.city_id,
    };

    console.log('📤 [getTeacherProfile] Returning:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Fatal error fetching teacher profile:', error);
    throw error;
  }
}

// ============================================
// Availability Management
// ============================================

/**
 * Get availability slots for a teacher in a date range
 */
export async function getTeacherAvailabilitySlots(
  teacherId: string,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase.rpc('get_teacher_availability_slots', {
    p_teacher_id: teacherId,
    p_start_date: startDate,
    p_end_date: endDate,
  } as any);

  if (error) {
    console.error('❌ Error fetching availability slots:', error);
    throw new Error(error.message);
  }

  return ((data as any) || []).map((slot: any) => ({
    id: slot.id,
    teacherId: teacherId,
    startAt: slot.start_at,
    endAt: slot.end_at,
    isBooked: slot.is_booked,
    bookingId: slot.booking_id,
  }));
}

/**
 * Upsert availability slots for a specific date
 */
export async function upsertAvailabilitySlots(
  teacherId: string,
  date: string,  // YYYY-MM-DD
  slots: SlotInput[]
): Promise<{ success: boolean; slotsInserted: number }> {
  console.log('🔵 [teacherAPI] upsertAvailabilitySlots called');
  console.log('   Teacher ID:', teacherId);
  console.log('   Date:', date);
  console.log('   Slots:', JSON.stringify(slots, null, 2));

  const { data, error } = await supabase.rpc('upsert_availability_slots', {
    p_teacher_id: teacherId,
    p_date: date,
    p_slots: slots,
  } as any);

  if (error) {
    console.error('❌ [teacherAPI] Error upserting availability slots:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Error details:', error.details);
    console.error('   Error hint:', error.hint);

    // Provide user-friendly error messages
    if (error.code === '23505') {
      throw new Error('חלק מהמשבצות חופפות להזמנות קיימות או משבצות אחרות');
    } else if (error.code === '22000') {
      throw new Error('ערכי זמן לא תקינים. אנא בדוק שהשעות נכונות');
    } else if (error.code === '42883') {
      throw new Error('הפונקציה upsert_availability_slots לא קיימת. הרץ migration 014');
    }

    throw new Error(error.message);
  }

  console.log('✅ [teacherAPI] upsert_availability_slots succeeded');
  console.log('   Response:', data);

  const result = data as any;
  return {
    success: result.success,
    slotsInserted: result.slots_inserted,
  };
}

/**
 * Close a day (delete all unbooked slots)
 */
export async function closeDay(
  teacherId: string,
  date: string  // YYYY-MM-DD
): Promise<{ success: boolean; slotsDeleted: number }> {
  const { data, error } = await supabase.rpc('close_day', {
    p_teacher_id: teacherId,
    p_date: date,
  } as any);

  if (error) {
    console.error('❌ Error closing day:', error);
    
    if (error.code === '23505') {
      throw new Error('לא ניתן לסגור יום עם הזמנות קיימות. אנא בטל את ההזמנות תחילה');
    }
    
    throw new Error(error.message);
  }

  const result = data as any;
  return {
    success: result.success,
    slotsDeleted: result.slots_deleted,
  };
}

/**
 * Open a day (create default slots)
 */
export async function openDay(
  teacherId: string,
  date: string,  // YYYY-MM-DD
  options?: {
    defaultStartTime?: string;  // HH:MM format
    defaultEndTime?: string;    // HH:MM format
    slotDuration?: number;      // minutes
  }
): Promise<{ success: boolean; slotsCreated: number }> {
  console.log('🔵 [teacherAPI] openDay called');
  console.log('   Teacher ID:', teacherId);
  console.log('   Date:', date);
  console.log('   Options:', options);

  const { data, error } = await supabase.rpc('open_day', {
    p_teacher_id: teacherId,
    p_date: date,
    p_default_start_time: options?.defaultStartTime || '09:00',
    p_default_end_time: options?.defaultEndTime || '17:00',
    p_slot_duration: options?.slotDuration || 60,
  } as any);

  if (error) {
    console.error('❌ [teacherAPI] Error opening day:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Error details:', error.details);

    if (error.code === '42883') {
      throw new Error('הפונקציה open_day לא קיימת. הרץ migration 014');
    }

    throw new Error(error.message);
  }

  console.log('✅ [teacherAPI] open_day succeeded');
  console.log('   Response:', data);

  const result = data as any;
  return {
    success: result.success,
    slotsCreated: result.slots_created,
  };
}

/**
 * Delete a specific slot (if not booked)
 */
export async function deleteAvailabilitySlot(slotId: string): Promise<void> {
  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', slotId)
    .eq('is_booked', false);

  if (error) {
    console.error('❌ Error deleting availability slot:', error);
    throw new Error(error.message);
  }
}

// ============================================
// Realtime Subscriptions
// ============================================

/**
 * Subscribe to teacher availability updates
 */
export function subscribeToTeacherAvailability(
  teacherId: string,
  callback: (payload: any) => void
) {
  const channel = supabase.channel(`teacher:${teacherId}`);

  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'availability_slots',
      filter: `teacher_id=eq.${teacherId}`,
    }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to teacher profile updates
 */
export function subscribeToTeacherProfile(
  teacherId: string,
  callback: (payload: any) => void
) {
  const channel = supabase.channel(`teacher_profile:${teacherId}`);

  channel
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${teacherId}`,
    }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Subject Experience Management
// ============================================

/**
 * Update teacher's per-subject experience
 * @param teacherId - Teacher's ID
 * @param subjectExperience - Object mapping subject IDs to experience years
 * @returns Success response with counts
 */
export async function updateTeacherSubjectExperience(
  teacherId: string,
  subjectExperience: { [subjectId: string]: number }
): Promise<{ success: boolean; inserted: number; updated: number }> {
  console.log('🔵 [teacherAPI] updateTeacherSubjectExperience called');
  console.log('   Teacher ID:', teacherId);
  console.log('   Subject Experience:', JSON.stringify(subjectExperience, null, 2));

  const { data, error } = await supabase.rpc('upsert_teacher_subject_experience', {
    p_teacher_id: teacherId,
    p_subject_experience: subjectExperience,
  } as any);

  if (error) {
    console.error('❌ [teacherAPI] Error updating subject experience:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    throw new Error(error.message);
  }

  console.log('✅ [teacherAPI] Subject experience updated successfully');
  console.log('   Response:', data);

  const result = data as any;
  return {
    success: result.success,
    inserted: result.inserted,
    updated: result.updated,
  };
}

/**
 * Get teacher's per-subject experience
 * @param teacherId - Teacher's ID
 * @returns Object mapping subject IDs to experience years
 */
export async function getTeacherSubjectExperience(
  teacherId: string
): Promise<{ [subjectId: string]: number }> {
  console.log('🔵 [teacherAPI] getTeacherSubjectExperience called');
  console.log('   Teacher ID:', teacherId);

  const { data, error } = await supabase.rpc('get_teacher_subject_experience', {
    p_teacher_id: teacherId,
  } as any);

  if (error) {
    console.error('❌ [teacherAPI] Error fetching subject experience:', error);
    throw new Error(error.message);
  }

  console.log('✅ [teacherAPI] Subject experience fetched successfully');
  console.log('   Data:', JSON.stringify(data, null, 2));

  // data is already a JSON object mapping subject IDs to years
  return (data as any) || {};
}

