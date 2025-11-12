/**
 * Instrumented Supabase Client (DEV ONLY)
 * Wraps Supabase client to log all DB writes for debugging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Original client
const originalClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Stack trace helper
function getCallerInfo(): string {
  const error = new Error();
  const stack = error.stack || '';
  const lines = stack.split('\n');
  
  // Find first line that's from our app code (not this file, not node_modules)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes('app/') || 
      line.includes('src/') ||
      line.includes('components/')
    ) {
      // Extract file and line number
      const match = line.match(/\((.*?):\d+:\d+\)/);
      if (match) {
        const path = match[1];
        // Get just the filename for brevity
        const parts = path.split('/');
        return parts.slice(-3).join('/'); // Last 3 parts of path
      }
    }
  }
  return 'unknown';
}

// Wrap the from() method to intercept writes
function wrapQueryBuilder(table: string, builder: any): any {
  const originalInsert = builder.insert;
  const originalUpdate = builder.update;
  const originalUpsert = builder.upsert;

  if (originalInsert) {
    builder.insert = function (values: any, options?: any) {
      if (__DEV__) {
        const keys = Array.isArray(values) 
          ? Object.keys(values[0] || {}) 
          : Object.keys(values || {});
        const caller = getCallerInfo();
        console.warn(
          `[DB WRITE] table=${table} operation=INSERT keys=[${keys.join(', ')}] caller=${caller}`
        );
      }
      return originalInsert.call(this, values, options);
    };
  }

  if (originalUpdate) {
    builder.update = function (values: any, options?: any) {
      if (__DEV__) {
        const keys = Object.keys(values || {});
        const caller = getCallerInfo();
        console.warn(
          `[DB WRITE] table=${table} operation=UPDATE keys=[${keys.join(', ')}] caller=${caller}`
        );
      }
      return originalUpdate.call(this, values, options);
    };
  }

  if (originalUpsert) {
    builder.upsert = function (values: any, options?: any) {
      if (__DEV__) {
        const keys = Array.isArray(values) 
          ? Object.keys(values[0] || {}) 
          : Object.keys(values || {});
        const caller = getCallerInfo();
        console.warn(
          `[DB WRITE] table=${table} operation=UPSERT keys=[${keys.join(', ')}] caller=${caller}`
        );
      }
      return originalUpsert.call(this, values, options);
    };
  }

  return builder;
}

// Wrap the RPC method
const originalRpc = originalClient.rpc.bind(originalClient);
originalClient.rpc = function (fn: string, params?: any, options?: any) {
  if (__DEV__) {
    const keys = params ? Object.keys(params) : [];
    const caller = getCallerInfo();
    console.warn(
      `[DB WRITE] operation=RPC function=${fn} params=[${keys.join(', ')}] caller=${caller}`
    );
    
    // Log the actual payload for update operations
    if (fn.includes('update') && params) {
      console.warn(`[DB WRITE] RPC payload:`, JSON.stringify(params, null, 2));
    }
  }
  return originalRpc(fn, params, options);
} as any;

// Wrap the from() method
const originalFrom = originalClient.from.bind(originalClient);
originalClient.from = function (table: any) {
  const builder = originalFrom(table);
  return __DEV__ ? wrapQueryBuilder(table, builder) : builder;
} as any;

// Export the instrumented client
export const supabase = originalClient as SupabaseClient<Database>;

// Re-export helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Get user metadata to determine role
  const role = user?.user_metadata?.role || 'student';
  const table = role === 'teacher' ? 'teachers' : 'students';

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function isTeacher() {
  const profile = await getCurrentUserProfile();
  return (profile as any)?.role === 'teacher';
}

export async function isStudent() {
  const profile = await getCurrentUserProfile();
  return (profile as any)?.role === 'student';
}
