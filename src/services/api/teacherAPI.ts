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
    timezone?: string;
    teachingStyle?: string;
    location?: string;
  }
): Promise<{ success: boolean; profile: any }> {
  console.log('🔵 [teacherAPI] updateTeacherProfile called with:', { teacherId, updates });
  
  // Build JSONB object with snake_case column names
  const updateData: any = {};
  
  if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
  if (updates.bio !== undefined) updateData.bio = updates.bio;
  if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
  if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate;
  if (updates.lessonModes !== undefined) updateData.lesson_modes = updates.lessonModes;
  if (updates.durationOptions !== undefined) updateData.duration_options = updates.durationOptions;
  if (updates.regions !== undefined) updateData.regions = updates.regions;
  if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
  if (updates.teachingStyle !== undefined) updateData.teaching_style = updates.teachingStyle;
  if (updates.location !== undefined) updateData.location = updates.location;
  
  console.log('🔵 [teacherAPI] Mapped to snake_case for RPC:', updateData);
  console.log('🔵 [teacherAPI] Calling RPC: update_teacher_profile_simple');
  
  // Use simple RPC function that accepts JSONB (bypasses PostgREST cache completely)
  const { data, error } = await supabase.rpc('update_teacher_profile_simple', {
    p_teacher_id: teacherId,
    p_updates: updateData,
  } as any); // Type assertion to bypass missing function signature

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
    // Try explicit column selection first
    const { data, error } = await supabase
      .from('profiles')
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
        teaching_style
      `)
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single();

    if (error) {
      console.error('❌ Error fetching teacher profile (attempt 1):', error);
      
      // Fallback: try with minimal columns if cache issue
      if (error.code === 'PGRST204') {
        console.log('⚠️ Schema cache issue, trying fallback with minimal columns...');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, display_name, bio, avatar_url, hourly_rate, location')
          .eq('id', teacherId)
          .eq('role', 'teacher')
          .single();
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        const fbData = fallbackData as any;
        console.log('✅ Fetched profile with fallback (using defaults for new fields)');
        
        return {
          id: fbData.id,
          displayName: fbData.display_name,
          bio: fbData.bio,
          avatarUrl: fbData.avatar_url,
          hourlyRate: fbData.hourly_rate || 150,
          lessonModes: ['online', 'at_teacher', 'at_student'], // defaults
          durationOptions: [45, 60, 90], // defaults
          regions: [],
          timezone: 'Asia/Jerusalem',
          teachingStyle: undefined,
          location: fbData.location,
        };
      }
      
      throw error;
    }

    if (!data) return null;

    const profileData = data as any;
    console.log('✅ Teacher profile fetched successfully');

    return {
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
    };
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

