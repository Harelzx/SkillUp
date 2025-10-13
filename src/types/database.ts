// ============================================
// Supabase Database Types
// Auto-generated types for full type safety
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'teacher' | 'student'
          display_name: string
          bio: string | null
          avatar_url: string | null
          video_url: string | null
          phone_number: string | null
          phone: string | null
          email: string | null
          location: string | null
          hourly_rate: number | null
          experience_years: number | null
          total_students: number
          is_verified: boolean
          is_active: boolean
          lesson_modes: string[] | null
          duration_options: number[] | null
          regions: string[] | null
          timezone: string | null
          teaching_style: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'teacher' | 'student'
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          video_url?: string | null
          phone_number?: string | null
          phone?: string | null
          email?: string | null
          location?: string | null
          hourly_rate?: number | null
          experience_years?: number | null
          total_students?: number
          is_verified?: boolean
          is_active?: boolean
          lesson_modes?: string[] | null
          duration_options?: number[] | null
          regions?: string[] | null
          timezone?: string | null
          teaching_style?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'teacher' | 'student'
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          video_url?: string | null
          phone_number?: string | null
          phone?: string | null
          email?: string | null
          location?: string | null
          hourly_rate?: number | null
          experience_years?: number | null
          total_students?: number
          is_verified?: boolean
          is_active?: boolean
          lesson_modes?: string[] | null
          duration_options?: number[] | null
          regions?: string[] | null
          timezone?: string | null
          teaching_style?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          name_he: string
          category: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_he: string
          category: string
          icon: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_he?: string
          category?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
      }
      teacher_subjects: {
        Row: {
          id: string
          teacher_id: string
          subject_id: string
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          subject_id: string
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          subject_id?: string
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          teacher_id: string
          student_id: string
          subject_id: string
          start_at: string
          end_at: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          price: number
          is_online: boolean
          location: string | null
          notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          student_id: string
          subject_id: string
          start_at: string
          end_at: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          price: number
          is_online?: boolean
          location?: string | null
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          student_id?: string
          subject_id?: string
          start_at?: string
          end_at?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          price?: number
          is_online?: boolean
          location?: string | null
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          teacher_id: string
          student_id: string
          rating: number
          text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          teacher_id: string
          student_id: string
          rating: number
          text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          teacher_id?: string
          student_id?: string
          rating?: number
          text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teacher_availability: {
        Row: {
          id: string
          teacher_id: string
          weekday: number
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          weekday: number
          start_time: string
          end_time: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          weekday?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_intents: {
        Row: {
          id: string
          student_id: string
          amount: number
          currency: string
          status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          stripe_payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'cancelled'
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payout_accounts: {
        Row: {
          id: string
          teacher_id: string
          stripe_account_id: string | null
          status: 'pending' | 'active' | 'restricted'
          details_submitted: boolean
          charges_enabled: boolean
          payouts_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          stripe_account_id?: string | null
          status?: 'pending' | 'active' | 'restricted'
          details_submitted?: boolean
          charges_enabled?: boolean
          payouts_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          stripe_account_id?: string | null
          status?: 'pending' | 'active' | 'restricted'
          details_submitted?: boolean
          charges_enabled?: boolean
          payouts_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_credits: {
        Row: {
          id: string
          student_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          student_id: string
          amount: number
          type: 'purchase' | 'used' | 'refund' | 'bonus'
          booking_id: string | null
          payment_intent_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          type: 'purchase' | 'used' | 'refund' | 'bonus'
          booking_id?: string | null
          payment_intent_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          amount?: number
          type?: 'purchase' | 'used' | 'refund' | 'bonus'
          booking_id?: string | null
          payment_intent_id?: string | null
          description?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          subtitle: string | null
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          subtitle?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          subtitle?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      teacher_profiles_with_stats: {
        Row: {
          id: string
          role: 'teacher'
          display_name: string
          bio: string | null
          avatar_url: string | null
          phone: string | null
          location: string | null
          hourly_rate: number
          experience_years: number
          total_students: number
          is_verified: boolean
          is_active: boolean
          avg_rating: number
          review_count: number
          subject_ids: string[]
          subject_names: string[]
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      get_teacher_avg_rating: {
        Args: { teacher_uuid: string }
        Returns: number
      }
      get_teacher_review_count: {
        Args: { teacher_uuid: string }
        Returns: number
      }
      add_student_credits: {
        Args: { p_student_id: string; p_amount: number }
        Returns: void
      }
    }
    Enums: {
      user_role: 'teacher' | 'student'
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
      credit_transaction_type: 'purchase' | 'used' | 'refund' | 'bonus'
    }
  }
}
