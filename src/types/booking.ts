// Booking Flow Types

export type LessonType = 'online' | 'student_location' | 'teacher_location';
export type StudentLevelCategory = 'elementary' | 'middle_school' | 'high_school' | 'student' | 'adult' | 'other';
export type StudentLevelProficiency = 'beginner' | 'basic' | 'intermediate' | 'advanced' | 'competitive';

export interface BookingData {
  // Step 1: Lesson Details
  subject: string;
  lessonType: LessonType;
  duration: 45 | 60 | 90;
  studentLevelCategory?: StudentLevelCategory;
  studentLevelProficiency?: StudentLevelProficiency;
  notes?: string;

  // Step 2: Date & Time
  date?: Date;
  timeSlot?: string; // e.g., "15:00"

  // Step 3: Location (only for in-person)
  address?: string;
  savedAddressId?: string;

  // Step 4: Pricing
  useCredits: boolean;
  couponCode?: string;

  // Step 5: Confirmation
  agreedToTerms: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  teacherId: string;
}

export interface AvailableDay {
  date: Date;
  hasAvailability: boolean;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  default: boolean;
}

export interface BookingPricing {
  hourlyRate: number;
  duration: number;
  subtotal: number;
  creditsUsed: number;
  discount: number;
  total: number;
}

export interface BookingStep {
  number: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
}

