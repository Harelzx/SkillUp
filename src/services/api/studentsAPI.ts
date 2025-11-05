import { supabase } from '@/lib/supabase';

// ============================================
// STUDENT PROFILES
// ============================================

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string; // YYYY-MM-DD format
  city?: string;
  bio?: string;
  avatarUrl?: string;
  subjectsInterests?: string[];
  levelCategory?: string;
  levelProficiency?: string;
  profileCompleted?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string; // YYYY-MM-DD format
  city?: string; // Legacy field, kept for backward compatibility
  regionId?: string; // UUID of region
  cityId?: string; // UUID of city
  bio?: string;
  subjectsInterests?: string[];
  levelCategory?: string;
  levelProficiency?: string;
  avatarUrl?: string;
  profileCompleted?: boolean;
}

/**
 * Get student profile by user ID
 */
export async function getStudentProfile(userId: string): Promise<StudentProfile> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  // Transform snake_case to camelCase
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email || undefined,
    phone: data.phone || undefined,
    birthDate: data.birth_date || undefined,
    city: data.city || undefined,
    bio: data.bio || undefined,
    avatarUrl: data.avatar_url || undefined,
    subjectsInterests: data.subjects_interests || [],
    levelCategory: data.level_category || undefined,
    levelProficiency: data.level_proficiency || undefined,
    profileCompleted: data.profile_completed || false,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update student profile (whitelist-based)
 */
export async function updateStudentProfile(
  userId: string,
  updates: StudentProfileUpdate
): Promise<void> {
  // Whitelist mapping
  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.firstName !== undefined) payload.first_name = updates.firstName.trim();
  if (updates.lastName !== undefined) payload.last_name = updates.lastName.trim();
  if (updates.email !== undefined) payload.email = updates.email.trim() || null;
  if (updates.phone !== undefined) payload.phone = normalizePhone(updates.phone) || null;
  if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate || null;
  if (updates.city !== undefined) payload.city = updates.city.trim() || null;
  if (updates.regionId !== undefined) payload.region_id = updates.regionId || null;
  if (updates.cityId !== undefined) payload.city_id = updates.cityId || null;
  if (updates.bio !== undefined) payload.bio = updates.bio.trim() || null;
  if (updates.subjectsInterests !== undefined) payload.subjects_interests = updates.subjectsInterests;
  if (updates.levelCategory !== undefined) payload.level_category = updates.levelCategory || null;
  if (updates.levelProficiency !== undefined) payload.level_proficiency = updates.levelProficiency || null;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl || null;
  if (updates.profileCompleted !== undefined) payload.profile_completed = updates.profileCompleted;

  // Validate before sending
  validateStudentProfile(payload);

  const { error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Upload student avatar to Supabase Storage
 */
export async function uploadStudentAvatar(
  userId: string,
  file: Blob
): Promise<string> {
  const fileExt = 'jpg'; // or extract from file
  const fileName = `${userId}/avatar.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ============================================
// VALIDATION
// ============================================

function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  // Remove all non-numeric characters except leading +972
  const cleaned = phone.replace(/\s|-|\(|\)/g, '');
  // Keep only digits
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

function validateEmail(email?: string | null): boolean {
  if (!email) return true; // email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateBirthYear(year?: number | null): boolean {
  if (year === undefined || year === null) return true; // optional
  const currentYear = new Date().getFullYear();
  return year >= 1930 && year <= currentYear - 4;
}

function validateStudentProfile(payload: any): void {
  // Email validation
  if (payload.email !== undefined && !validateEmail(payload.email)) {
    throw new Error('כתובת דוא"ל לא תקינה');
  }

  // Birth year validation
  if (payload.birth_year !== undefined && !validateBirthYear(payload.birth_year)) {
    throw new Error('שנת לידה לא תקינה');
  }

  // Bio length validation
  if (payload.bio && payload.bio.length > 500) {
    throw new Error('הביוגרפיה ארוכה מדי (מקסימום 500 תווים)');
  }
}

