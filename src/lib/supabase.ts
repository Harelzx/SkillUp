import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

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

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
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
  bio?: string;
  avatarUrl?: string;
  videoUrl?: string;
  hourlyRate?: number;
  subjects?: string[];
  createdAt: string;
  updatedAt: string;
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