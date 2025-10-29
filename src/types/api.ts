// ============================================
// DATABASE TYPES (from Supabase schema)
// ============================================

export type UserRole = 'teacher' | 'student';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export type NotificationType =
  | 'LESSON_REMINDER_STUDENT'
  | 'LESSON_REMINDER_TEACHER'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'REVIEW_RECEIVED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_SENT'
  | 'CREDITS_PURCHASED'
  | 'CREDITS_REFUNDED'
  | 'NEW_MESSAGE'
  | 'SYSTEM_ANNOUNCEMENT';

export type CreditTransactionType = 'purchase' | 'used' | 'refund' | 'bonus';

// ============================================
// PROFILES
// ============================================

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  hourly_rate: number | null; // Only for teachers
  experience_years: number | null; // Only for teachers
  total_students: number; // Only for teachers
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile extends Profile {
  role: 'teacher';
  hourly_rate: number;
  experience_years: number;
  avg_rating: number;
  review_count: number;
  subjects: Subject[];
  subject_ids: string[]; // For filtering
  subject_names: string[]; // For display
}

// ============================================
// SUBJECTS
// ============================================

export interface Subject {
  id: string;
  name: string;
  name_he: string;
  category: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_id: string;
  created_at: string;
}

// ============================================
// BOOKINGS
// ============================================

export interface Booking {
  id: string;
  teacher_id: string;
  student_id: string;
  subject_id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  price: number;
  is_online: boolean;
  location: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  teacher: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    phone?: string | null;
    hourly_rate?: number;
  };
  student: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    phone?: string | null;
  };
  subject: {
    id: string;
    name: string;
    name_he: string;
    icon: string;
  };
}

// ============================================
// REVIEWS
// ============================================

export interface Review {
  id: string;
  booking_id: string;
  teacher_id: string;
  student_id: string;
  rating: number; // 1-5
  text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithDetails extends Review {
  student: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  booking?: {
    id: string;
    subject: {
      name_he: string;
    };
  };
}

export interface RatingStatistics {
  avgRating: number;
  reviewCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// ============================================
// TEACHER AVAILABILITY
// ============================================

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  weekday: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
}

// ============================================
// CREDITS
// ============================================

export interface StudentCredits {
  id: string;
  student_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  student_id: string;
  amount: number;
  type: CreditTransactionType;
  booking_id: string | null;
  payment_intent_id: string | null;
  description: string;
  created_at: string;
}

export interface CreditTransactionWithDetails extends CreditTransaction {
  booking?: {
    id: string;
    start_at: string;
    teacher: {
      display_name: string;
    };
    subject: {
      name_he: string;
    };
  };
}

export interface CreditStatistics {
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  totalBonuses: number;
}

export interface CreditPackage {
  id: string;
  amount: number;
  bonus: number;
  total: number;
  price: number;
  displayPrice: string;
  popular?: boolean;
  savings?: string;
}

// ============================================
// PAYMENTS
// ============================================

export interface PaymentIntent {
  id: string;
  student_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutAccount {
  id: string;
  teacher_id: string;
  stripe_account_id: string | null;
  status: 'pending' | 'active' | 'restricted';
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EarningsStatistics {
  totalEarnings: number;
  monthEarnings: number;
  pendingEarnings: number;
  completedLessons: number;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  subtitle: string | null;
  data: any; // JSONB - flexible data
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  lessonReminders: boolean;
  bookingUpdates: boolean;
  reviewNotifications: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface TeacherSearchParams {
  subjectId?: string;
  location?: string;
  minRate?: number;
  maxRate?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface BookingQueryParams {
  status?: BookingStatus;
  upcoming?: boolean;
  date?: string;
}

export interface TransactionQueryParams {
  limit?: number;
  offset?: number;
  type?: CreditTransactionType;
}

export interface NotificationQueryParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface CreateBookingData {
  teacherId: string;
  subjectId: string;
  startAt: string;
  endAt: string;
  isOnline: boolean;
  location?: string;
  notes?: string;
}

export interface CreateReviewData {
  bookingId: string;
  teacherId: string;
  rating: number;
  text?: string;
}

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  hourly_rate?: number;
  experience_years?: number;
}

export interface UpdateAvailabilityData {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// ============================================
// CALENDAR TYPES
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booking' | 'availability';
  status?: BookingStatus;
  student?: string;
  subject?: string;
  isOnline?: boolean;
  location?: string;
}

export interface WeekAvailability {
  [weekday: number]: TeacherAvailability[];
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

export interface TeacherStatistics {
  totalStudents: number;
  totalLessons: number;
  avgRating: number;
  reviewCount: number;
  totalEarnings: number;
  monthEarnings: number;
  completedThisMonth: number;
  upcomingBookings: number;
}

export interface StudentStatistics {
  totalLessons: number;
  creditsBalance: number;
  totalSpent: number;
  favoriteSubjects: string[];
  favoriteTeachers: string[];
}

// ============================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================

export interface SubscriptionCallback<T> {
  (data: T): void;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}
