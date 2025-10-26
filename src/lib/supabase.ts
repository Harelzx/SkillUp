import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

// Supabase configuration
const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Get role from user metadata
  const role = user?.user_metadata?.role || 'student';
  const table = role === 'teacher' ? 'teachers' : 'students';

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  
  // Transform to unified profile format
  const profile = data as any;
  if (role === 'teacher') {
    return {
      id: profile.id,
      role: 'teacher' as const,
      display_name: profile.display_name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      ...profile,
    };
  } else {
    return {
      id: profile.id,
      role: 'student' as const,
      display_name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      ...profile,
    };
  }
}

/**
 * Check if current user is a teacher
 */
export async function isTeacher() {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'teacher';
}

/**
 * Check if current user is a student
 */
export async function isStudent() {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'student';
}

// ============================================
// LEGACY TYPES (kept for backward compatibility)
// Use types from @/src/types/api instead
// ============================================

/** @deprecated Use Profile from @/src/types/api */
export interface Profile {
  id: string;
  role: 'teacher' | 'student';
  displayName: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  avatarUrl?: string;
  videoUrl?: string;
  hourlyRate?: number;
  subjects?: string[];
  createdAt: string;
  updatedAt: string;
  profileCompleted?: boolean; // Indicates if teacher has completed onboarding
}

/** @deprecated Use Subject from @/src/types/api */
export interface Subject {
  id: string;
  name: string;
  category?: string;
}

/** @deprecated Use TeacherAvailability from @/src/types/api */
export interface TeacherAvailability {
  id: string;
  teacherId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  repeatRule?: string;
}

/** @deprecated Use Booking from @/src/types/api */
export interface Booking {
  id: string;
  teacherId: string;
  studentId: string;
  startAt: string;
  endAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  price: number;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use Review from @/src/types/api */
export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  text?: string;
  isVerified: boolean;
  createdAt: string;
}

/** @deprecated Use PaymentIntent from @/src/types/api */
export interface PaymentIntent {
  id: string;
  bookingId: string;
  stripePaymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use PayoutAccount from @/src/types/api */
export interface PayoutAccount {
  id: string;
  teacherId: string;
  stripeAccountId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}