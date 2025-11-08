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
  updateTeacherSubjectExperience,
  getTeacherSubjectExperience,
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

// Conversations API
export * from './conversationsAPI';

// Messages API
export * from './messagesAPI';

// Lesson Tracking API
export {
  getTeacherCompletedLessons,
  getLessonTracking,
  upsertLessonNote,
  getLessonTrackingDetails,
  type LessonTracking,
  type CompletedLesson,
  type LessonTrackingFilters,
  type LessonTrackingResponse,
} from './lessonTrackingAPI';

// Static Data API
export {
  getLanguages,
  getLanguageByCode,
  getStudentLevelCategories,
  getStudentLevelCategoryByValue,
  getStudentLevelProficiencies,
  getStudentLevelProficiencyByValue,
  getLessonModes,
  getLessonModeByValue,
  getLessonDurations,
  getLessonDurationByMinutes,
  getBookingStatuses,
  getBookingStatusByValue,
  toOptions,
  durationsToOptions,
  languagesToOptions,
  type Language,
  type StudentLevelCategory,
  type StudentLevelProficiency,
  type LessonMode,
  type LessonDuration,
  type BookingStatus,
} from './staticDataAPI';

// Re-export all types
export * from '@/types/api';
