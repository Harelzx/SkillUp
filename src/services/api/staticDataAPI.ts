// ============================================
// Static Data API
// Functions for fetching static reference data from database
// ============================================

import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export interface Language {
  id: string;
  name_he: string;
  name_en: string;
  code: string;
  is_common: boolean;
  sort_order: number;
}

export interface StudentLevelCategory {
  id: string;
  value: string;
  label_he: string;
  label_en: string;
  sort_order: number;
}

export interface StudentLevelProficiency {
  id: string;
  value: string;
  label_he: string;
  label_en: string;
  sort_order: number;
}

export interface LessonMode {
  id: string;
  value: string;
  label_he: string;
  label_en: string;
  description_he?: string;
  description_en?: string;
  icon_name?: string;
  sort_order: number;
}

export interface LessonDuration {
  id: string;
  duration_minutes: number;
  label_he: string;
  label_en: string;
  is_default: boolean;
  sort_order: number;
}

export interface BookingStatus {
  id: string;
  value: string;
  label_he: string;
  label_en: string;
  color_hex: string;
  bg_color_hex: string;
  icon_name?: string;
  sort_order: number;
}

// ============================================
// Languages
// ============================================

/**
 * Get all languages
 * @param onlyCommon - If true, returns only common languages
 */
export async function getLanguages(onlyCommon: boolean = false): Promise<Language[]> {
  let query = supabase
    .from('languages')
    .select('*')
    .order('sort_order', { ascending: true });

  if (onlyCommon) {
    query = query.eq('is_common', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching languages:', error);
    throw new Error(`Failed to fetch languages: ${error.message}`);
  }

  return data || [];
}

/**
 * Get language by code
 */
export async function getLanguageByCode(code: string): Promise<Language | null> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error('❌ Error fetching language:', error);
    return null;
  }

  return data;
}

// ============================================
// Student Level Categories
// ============================================

/**
 * Get all student level categories
 */
export async function getStudentLevelCategories(): Promise<StudentLevelCategory[]> {
  const { data, error } = await supabase
    .from('student_level_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching student level categories:', error);
    throw new Error(`Failed to fetch student level categories: ${error.message}`);
  }

  return data || [];
}

/**
 * Get student level category by value
 */
export async function getStudentLevelCategoryByValue(value: string): Promise<StudentLevelCategory | null> {
  const { data, error } = await supabase
    .from('student_level_categories')
    .select('*')
    .eq('value', value)
    .single();

  if (error) {
    console.error('❌ Error fetching student level category:', error);
    return null;
  }

  return data;
}

// ============================================
// Student Level Proficiencies
// ============================================

/**
 * Get all student level proficiencies
 */
export async function getStudentLevelProficiencies(): Promise<StudentLevelProficiency[]> {
  const { data, error } = await supabase
    .from('student_level_proficiencies')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching student level proficiencies:', error);
    throw new Error(`Failed to fetch student level proficiencies: ${error.message}`);
  }

  return data || [];
}

/**
 * Get student level proficiency by value
 */
export async function getStudentLevelProficiencyByValue(value: string): Promise<StudentLevelProficiency | null> {
  const { data, error } = await supabase
    .from('student_level_proficiencies')
    .select('*')
    .eq('value', value)
    .single();

  if (error) {
    console.error('❌ Error fetching student level proficiency:', error);
    return null;
  }

  return data;
}

// ============================================
// Lesson Modes
// ============================================

/**
 * Get all lesson modes
 */
export async function getLessonModes(): Promise<LessonMode[]> {
  const { data, error } = await supabase
    .from('lesson_modes')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching lesson modes:', error);
    throw new Error(`Failed to fetch lesson modes: ${error.message}`);
  }

  return data || [];
}

/**
 * Get lesson mode by value
 */
export async function getLessonModeByValue(value: string): Promise<LessonMode | null> {
  const { data, error } = await supabase
    .from('lesson_modes')
    .select('*')
    .eq('value', value)
    .single();

  if (error) {
    console.error('❌ Error fetching lesson mode:', error);
    return null;
  }

  return data;
}

// ============================================
// Lesson Durations
// ============================================

/**
 * Get all lesson durations
 * @param onlyDefault - If true, returns only default durations
 */
export async function getLessonDurations(onlyDefault: boolean = false): Promise<LessonDuration[]> {
  let query = supabase
    .from('lesson_durations')
    .select('*')
    .order('sort_order', { ascending: true });

  if (onlyDefault) {
    query = query.eq('is_default', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching lesson durations:', error);
    throw new Error(`Failed to fetch lesson durations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get lesson duration by minutes
 */
export async function getLessonDurationByMinutes(minutes: number): Promise<LessonDuration | null> {
  const { data, error } = await supabase
    .from('lesson_durations')
    .select('*')
    .eq('duration_minutes', minutes)
    .single();

  if (error) {
    console.error('❌ Error fetching lesson duration:', error);
    return null;
  }

  return data;
}

// ============================================
// Booking Statuses
// ============================================

/**
 * Get all booking statuses
 */
export async function getBookingStatuses(): Promise<BookingStatus[]> {
  const { data, error } = await supabase
    .from('booking_statuses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching booking statuses:', error);
    throw new Error(`Failed to fetch booking statuses: ${error.message}`);
  }

  return data || [];
}

/**
 * Get booking status by value
 */
export async function getBookingStatusByValue(value: string): Promise<BookingStatus | null> {
  const { data, error } = await supabase
    .from('booking_statuses')
    .select('*')
    .eq('value', value)
    .single();

  if (error) {
    console.error('❌ Error fetching booking status:', error);
    return null;
  }

  return data;
}

// ============================================
// Helper: Convert to options format for pickers
// ============================================

/**
 * Convert any static data array to { value, label } format
 * Useful for dropdown/picker components
 */
export function toOptions<T extends { value: string; label_he: string }>(
  items: T[]
): Array<{ value: string; label: string }> {
  return items.map(item => ({
    value: item.value,
    label: item.label_he
  }));
}

/**
 * Convert durations to options format
 */
export function durationsToOptions(
  durations: LessonDuration[]
): Array<{ value: number; label: string }> {
  return durations.map(d => ({
    value: d.duration_minutes,
    label: d.label_he
  }));
}

/**
 * Convert languages to options format
 */
export function languagesToOptions(
  languages: Language[]
): Array<{ value: string; label: string }> {
  return languages.map(lang => ({
    value: lang.name_he,
    label: lang.name_he
  }));
}
