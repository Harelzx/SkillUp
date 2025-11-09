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
      regions: {
        Row: {
          id: string
          name_he: string
          name_en: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_he: string
          name_en: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_he?: string
          name_en?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name_he: string
          name_en: string
          region_id: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_he: string
          name_en: string
          region_id: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_he?: string
          name_en?: string
          region_id?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          birth_year: number | null
          city: string | null
          bio: string | null
          avatar_url: string | null
          subjects_interests: string[] | null
          level_category: string | null
          level_proficiency: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          birth_year?: number | null
          city?: string | null
          bio?: string | null
          avatar_url?: string | null
          subjects_interests?: string[] | null
          level_category?: string | null
          level_proficiency?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          birth_year?: number | null
          city?: string | null
          bio?: string | null
          avatar_url?: string | null
          subjects_interests?: string[] | null
          level_category?: string | null
          level_proficiency?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          display_name: string
          email: string | null
          phone_number: string | null
          bio: string | null
          avatar_url: string | null
          video_url: string | null
          location: string | null
          hourly_rate: number | null
          experience_years: number | null
          education: string[] | null
          languages: string[] | null
          total_students: number
          is_verified: boolean
          is_active: boolean
          is_subscribed: boolean
          subscription_tier: string | null
          lesson_modes: string[] | null
          duration_options: number[] | null
          regions: string[] | null
          region_id: string | null
          city_id: string | null
          timezone: string | null
          teaching_style: string | null
          profile_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          email?: string | null
          phone_number?: string | null
          bio?: string | null
          avatar_url?: string | null
          video_url?: string | null
          location?: string | null
          hourly_rate?: number | null
          experience_years?: number | null
          education?: string[] | null
          languages?: string[] | null
          total_students?: number
          is_verified?: boolean
          is_active?: boolean
          is_subscribed?: boolean
          subscription_tier?: string | null
          lesson_modes?: string[] | null
          duration_options?: number[] | null
          regions?: string[] | null
          region_id?: string | null
          city_id?: string | null
          timezone?: string | null
          teaching_style?: string | null
          profile_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          email?: string | null
          phone_number?: string | null
          bio?: string | null
          avatar_url?: string | null
          video_url?: string | null
          location?: string | null
          hourly_rate?: number | null
          education?: string[] | null
          languages?: string[] | null
          experience_years?: number | null
          total_students?: number
          is_verified?: boolean
          is_active?: boolean
          is_subscribed?: boolean
          subscription_tier?: string | null
          lesson_modes?: string[] | null
          duration_options?: number[] | null
          regions?: string[] | null
          region_id?: string | null
          city_id?: string | null
          timezone?: string | null
          teaching_style?: string | null
          profile_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
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
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'awaiting_payment' | 'refunded'
          price: number
          is_online: boolean
          location: string | null
          notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          mode: 'online' | 'student_location' | 'teacher_location' | null
          duration_minutes: number | null
          price_per_hour: number | null
          total_price: number | null
          credits_applied: number | null
          coupon_code: string | null
          discount_amount: number | null
          timezone: string | null
          source: string | null
          currency: string | null
          payment_method_selected: string | null
          hold_expires_at: string | null
          student_level_category: string | null
          student_level_proficiency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          student_id: string
          subject_id?: string
          start_at: string
          end_at: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'awaiting_payment' | 'refunded'
          price?: number
          is_online?: boolean
          location?: string | null
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          mode?: 'online' | 'student_location' | 'teacher_location' | null
          duration_minutes?: number | null
          price_per_hour?: number | null
          total_price?: number | null
          credits_applied?: number | null
          coupon_code?: string | null
          discount_amount?: number | null
          timezone?: string | null
          source?: string | null
          currency?: string | null
          payment_method_selected?: string | null
          hold_expires_at?: string | null
          student_level_category?: string | null
          student_level_proficiency?: string | null
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
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'awaiting_payment' | 'refunded'
          price?: number
          is_online?: boolean
          location?: string | null
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          mode?: 'online' | 'student_location' | 'teacher_location' | null
          duration_minutes?: number | null
          price_per_hour?: number | null
          total_price?: number | null
          credits_applied?: number | null
          coupon_code?: string | null
          discount_amount?: number | null
          timezone?: string | null
          source?: string | null
          currency?: string | null
          payment_method_selected?: string | null
          hold_expires_at?: string | null
          student_level_category?: string | null
          student_level_proficiency?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teacher_student_summary: {
        Row: {
          teacher_id: string
          student_id: string
          status: 'active' | 'inactive'
          first_lesson_at: string | null
          last_lesson_at: string | null
          completed_count: number
          cancelled_count: number
          primary_subject_id: string | null
          primary_subject_name: string | null
          primary_subject_name_he: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          teacher_id: string
          student_id: string
          status?: 'active' | 'inactive'
          first_lesson_at?: string | null
          last_lesson_at?: string | null
          completed_count?: number
          cancelled_count?: number
          primary_subject_id?: string | null
          primary_subject_name?: string | null
          primary_subject_name_he?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          teacher_id?: string
          student_id?: string
          status?: 'active' | 'inactive'
          first_lesson_at?: string | null
          last_lesson_at?: string | null
          completed_count?: number
          cancelled_count?: number
          primary_subject_id?: string | null
          primary_subject_name?: string | null
          primary_subject_name_he?: string | null
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

// ============================================
// Type Aliases for Convenience
// ============================================

export type Region = Database['public']['Tables']['regions']['Row']
export type City = Database['public']['Tables']['cities']['Row']

export type RegionInsert = Database['public']['Tables']['regions']['Insert']
export type CityInsert = Database['public']['Tables']['cities']['Insert']

export type RegionUpdate = Database['public']['Tables']['regions']['Update']
export type CityUpdate = Database['public']['Tables']['cities']['Update']
