/**
 * DEV-ONLY Mock Users for Local Development
 * ⚠️ WARNING: These users are for development ONLY
 * DO NOT use in production!
 */

import { Profile } from '@/lib/supabase';

// Check if we're in development mode
export const IS_DEV_MODE = process.env.NODE_ENV === 'development' || __DEV__;

/**
 * Mock user credentials for DEV testing
 * Password is intentionally weak for DEV convenience
 */
export interface DevUser {
  id: string;
  email: string;
  password: string; // Plain text for DEV ONLY
  profile: Profile;
}

/**
 * Teacher Demo User
 * Email: teacher.demo@skillup.dev
 * Password: 123456
 */
export const DEV_TEACHER_USER: DevUser = {
  id: 'dev-teacher-001',
  email: 'teacher.demo@skillup.dev',
  password: '123456',
  profile: {
    id: 'dev-teacher-001',
    role: 'teacher',
    displayName: 'ד״ר אביב כהן',
    bio: 'מורה מומחה למתמטיקה ופיזיקה. 15 שנות ניסיון בהוראה אקדמית. דוקטורט מהטכניון.',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 180,
    subjects: ['mathematics', 'physics', 'calculus'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-10-09T00:00:00.000Z',
  },
};

/**
 * Student Demo User (for comparison testing)
 * Email: student.demo@skillup.dev
 * Password: 123456
 */
export const DEV_STUDENT_USER: DevUser = {
  id: 'dev-student-001',
  email: 'student.demo@skillup.dev',
  password: '123456',
  profile: {
    id: 'dev-student-001',
    role: 'student',
    displayName: 'יעל כהן',
    bio: 'סטודנטית למדעי המחשב',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: undefined,
    subjects: undefined,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-10-09T00:00:00.000Z',
  },
};

/**
 * All DEV users
 */
export const DEV_USERS: DevUser[] = [
  DEV_TEACHER_USER,
  DEV_STUDENT_USER,
];

/**
 * Find user by email (DEV only)
 */
export const findDevUserByEmail = (email: string): DevUser | undefined => {
  if (!IS_DEV_MODE) {
    console.warn('⚠️ DEV users should not be accessed in production!');
    return undefined;
  }
  return DEV_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
};

/**
 * Validate dev user credentials (DEV only)
 */
export const validateDevUser = (email: string, password: string): DevUser | null => {
  if (!IS_DEV_MODE) {
    console.warn('⚠️ DEV authentication should not be used in production!');
    return null;
  }

  const user = findDevUserByEmail(email);
  if (!user) return null;

  // Simple password check (plain text for DEV)
  if (user.password === password) {
    console.log(`✅ DEV Login successful: ${user.email} (role: ${user.profile.role})`);
    return user;
  }

  console.log(`❌ DEV Login failed: Invalid password for ${email}`);
  return null;
};

/**
 * Check if email is a dev user
 */
export const isDevUser = (email: string): boolean => {
  if (!IS_DEV_MODE) return false;
  return DEV_USERS.some(user => user.email.toLowerCase() === email.toLowerCase());
};

/**
 * Get dev user profile by ID
 */
export const getDevUserProfile = (userId: string): Profile | undefined => {
  if (!IS_DEV_MODE) return undefined;
  const user = DEV_USERS.find(u => u.id === userId);
  return user?.profile;
};

/**
 * Create a mock session for dev user
 */
export const createDevSession = (user: DevUser) => {
  if (!IS_DEV_MODE) {
    throw new Error('DEV sessions should not be created in production!');
  }

  return {
    access_token: `dev-token-${user.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    refresh_token: `dev-refresh-${user.id}`,
    user: {
      id: user.id,
      email: user.email,
      app_metadata: { role: user.profile.role },
      user_metadata: { role: user.profile.role },
      aud: 'authenticated',
      created_at: user.profile.createdAt,
      updated_at: user.profile.updatedAt,
    },
  };
};

// Log warning on import in production
if (!IS_DEV_MODE) {
  console.warn('⚠️ DEV users module imported in non-development environment!');
}

