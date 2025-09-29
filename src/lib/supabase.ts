import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// These will need to be replaced with actual values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (these will be generated from your Supabase schema)
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

export interface Subject {
  id: string;
  name: string;
  category?: string;
}

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  weekday: number; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  repeatRule?: string;
}

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

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  text?: string;
  isVerified: boolean;
  createdAt: string;
}

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

export interface PayoutAccount {
  id: string;
  teacherId: string;
  stripeAccountId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}