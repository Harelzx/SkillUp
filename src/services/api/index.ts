// ============================================
// API Services - Central Export
// ============================================

// Students API
export * from './studentsAPI';

// Teachers API (for students - view teachers)
export {
  getTeacherById,
  getTeachers,
  getFeaturedTeachers,
  getSubjects,
  getSubjectsByCategory,
  getTeacherSubjects,
  getTeacherAvailability,
  updateTeacherAvailability,
  updateTeacherSubjects,
  getTeacherReviews,
} from './teachersAPI';

// Teacher Management API (for teacher users - manage profile)
export {
  updateTeacherProfile,
  getTeacherProfile,
  getTeacherAvailabilitySlots,
  upsertAvailabilitySlots,
  closeDay,
  openDay,
  deleteAvailabilitySlot,
  subscribeToTeacherAvailability,
  subscribeToTeacherProfile,
} from './teacherAPI';

// Bookings API
export * from './bookingsAPI';

// Reviews API (avoiding duplicates from teachersAPI)
export {
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  getStudentReviews,
  getReviewStats,
} from './reviewsAPI';

// Credits API
export * from './creditsAPI';

// Payments API
export * from './paymentsAPI';

// Notifications API
export * from './notificationsAPI';

// Re-export all types
export * from '@/types/api';
