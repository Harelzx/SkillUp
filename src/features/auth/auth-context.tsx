import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile | null }>;
  signUp: (email: string, password: string, data: { role: 'teacher' | 'student'; displayName: string; phoneNumber?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        // If session exists but profile doesn't load after retries, clear the stale session
        if (!profile) {
          console.warn('⚠️ [AuthContext] Session exists but profile not found - clearing stale session');
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const metaRole = user?.user_metadata?.role as 'teacher' | 'student' | undefined;

      const tablesToTry: Array<{ table: 'teachers' | 'students'; role: 'teacher' | 'student' }> =
        metaRole === 'teacher'
          ? [{ table: 'teachers', role: 'teacher' }, { table: 'students', role: 'student' }]
          : metaRole === 'student'
            ? [{ table: 'students', role: 'student' }, { table: 'teachers', role: 'teacher' }]
            : [
                { table: 'teachers', role: 'teacher' },
                { table: 'students', role: 'student' },
              ];

      for (const candidate of tablesToTry) {
        const { data, error } = await supabase
          .from(candidate.table)
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Not found in this table, try the next one
            continue;
          }

          // Unexpected error
          throw error;
        }

        const row = data as any;
        let transformedProfile: Profile;

        if (candidate.role === 'teacher') {
          transformedProfile = {
            id: row.id,
            role: 'teacher',
            displayName: row.display_name ?? row.displayName ?? 'Teacher',
            email: row.email ?? user?.email ?? null,
            phoneNumber: row.phone_number ?? row.phone ?? null,
            bio: row.bio ?? null,
            avatarUrl: row.avatar_url ?? null,
            videoUrl: row.video_url ?? null,
            hourlyRate: row.hourly_rate ?? undefined,
            subjects: [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            profileCompleted: Boolean(row.profile_completed),
          };
        } else {
          transformedProfile = {
            id: row.id,
            role: 'student',
            displayName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Student',
            email: row.email ?? user?.email ?? null,
            phoneNumber: row.phone ?? row.phone_number ?? null,
            bio: row.bio ?? null,
            avatarUrl: row.avatar_url ?? null,
            videoUrl: undefined,
            hourlyRate: undefined,
            subjects: row.subjects_interests || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            profileCompleted: Boolean(row.profile_completed),
          };
        }

        console.log('✅ Profile loaded from Supabase:', transformedProfile.displayName, `(${transformedProfile.role})`);
        setProfile(transformedProfile);
        return transformedProfile;
      }

      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return fetchProfile(userId, retries - 1);
      }

      return null;
    } catch (error: any) {
      console.error('❌ [AuthContext] fetchProfile error:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sign in with Supabase
      // Wrap in try-catch to catch network errors that might be thrown as exceptions
      let result;
      try {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } catch (networkException: any) {
        // If Supabase throws an exception (e.g., network error), catch it here
        const exceptionMessage = networkException?.message || '';
        if (exceptionMessage.includes('Failed to fetch') ||
            exceptionMessage.includes('ERR_NAME_NOT_RESOLVED') ||
            exceptionMessage.includes('Network request failed') ||
            exceptionMessage.includes('network') ||
            exceptionMessage.includes('fetch')) {
          throw new Error('בעיית חיבור לאינטרנט. אנא בדוק את החיבור שלך ונסה שוב.');
        }
        throw networkException; // Re-throw if not a network error
      }
      
      const { error, data } = result;

      if (error) {
        // Check for network errors - check both message and status
        const errorMessage = error.message || '';
        const errorStatus = error.status || '';
        
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
            errorMessage.includes('Network request failed') ||
            errorMessage.includes('network') ||
            errorStatus === '0' || // Network error status
            !errorStatus) { // No status usually means network error
          const networkError = new Error('בעיית חיבור לאינטרנט. אנא בדוק את החיבור שלך ונסה שוב.');
          networkError.name = 'NetworkError';
          throw networkError;
        }
        throw error;
      }

      // Fetch profile after successful Supabase login
      if (data.user) {
        console.log('🔵 Fetching profile for user:', data.user.id);
        const fetchedProfile = await fetchProfile(data.user.id);
        
        // Check if profile was loaded - if not, sign out and return error
        if (!fetchedProfile) {
          console.warn('⚠️ No profile found after sign in - signing out');
          await supabase.auth.signOut();
          return { error: new Error('User profile not found in database'), profile: null };
        }
        
        console.log('✅ SignIn completed successfully!');
        return { error: null, profile: fetchedProfile };
      }

      return { error: null, profile: null };
    } catch (error: any) {
      console.error('SignIn error:', error);
      
      // Enhanced error handling - check multiple error properties
      const errorMessage = error?.message || '';
      const errorName = error?.name || '';
      const errorStatus = error?.status || '';
      
      // Network errors
      if (errorName === 'NetworkError' || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorStatus === '0' ||
          !errorStatus) {
        console.warn('⚠️ Network error detected during sign in');
        return { 
          error: new Error('בעיית חיבור לאינטרנט. אנא בדוק את החיבור שלך ונסה שוב.'), 
          profile: null 
        };
      }
      
      // Check for authentication errors
      if (errorMessage.includes('Invalid login credentials') ||
          errorMessage.includes('Email not confirmed') ||
          errorMessage.includes('invalid') ||
          errorStatus === '400' || errorStatus === '401') {
        return { 
          error: new Error('כתובת אימייל או סיסמה שגויים'), 
          profile: null 
        };
      }
      
      // Default error
      return { error: error as Error, profile: null };
    }
  };

  const signUp = async (email: string, password: string, userData: { role: 'teacher' | 'student'; displayName: string; phoneNumber?: string }) => {
    try {
      console.log('🔵 signUp called with:', { email, role: userData.role, displayName: userData.displayName });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: userData.role },
        },
      });

      console.log('🔵 Supabase signUp response:', {
        hasUser: !!data.user,
        userId: data.user?.id,
        userEmail: data.user?.email,
        error: error?.message
      });

      if (error) {
        console.error('❌ Supabase signUp error:', error);
        throw error;
      }

      // Create profile in appropriate table based on role
      if (data.user) {
        const profileData: any = {
          id: data.user.id,
          email,
          is_active: true,
        };

        if (userData.role === 'teacher') {
          // Insert into teachers table
          profileData.display_name = userData.displayName;
          profileData.phone_number = userData.phoneNumber || null;
          profileData.is_verified = false;
          profileData.total_students = 0;

          console.log('🔵 Creating teacher profile:', profileData);
          const { error: profileError } = await supabase
            .from('teachers')
            .insert(profileData);
          
          if (profileError) {
            console.error('❌ Teacher profile creation error:', profileError);
            throw profileError;
          }
        } else {
          // Insert into students table
          const nameParts = userData.displayName.split(' ');
          profileData.first_name = nameParts[0] || 'Student';
          profileData.last_name = nameParts.slice(1).join(' ') || '';
          profileData.phone = userData.phoneNumber || null;

          console.log('🔵 Creating student profile:', profileData);
          const { error: profileError } = await supabase
            .from('students')
            .insert(profileData);
          
          if (profileError) {
            console.error('❌ Student profile creation error:', profileError);
            throw profileError;
          }
        }

        console.log('✅ Profile created successfully!');

        // Small delay to ensure DB has committed the transaction
        await new Promise(resolve => setTimeout(resolve, 300));

        // Fetch the created profile (with retry logic)
        console.log('🔵 Fetching created profile...');
        await fetchProfile(data.user.id);
        console.log('✅ SignUp completed successfully!');
      } else {
        console.warn('⚠️ No user returned from Supabase signUp');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ SignUp error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!session?.user) throw new Error('No user logged in');
      if (!profile) throw new Error('No profile loaded');

      // Determine which table to update based on role
      const table = profile.role === 'teacher' ? 'teachers' : 'students';
      
      // Convert camelCase updates to snake_case for database
      const dbUpdates: any = {};
      
      if (profile.role === 'teacher') {
        if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
        if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
      } else {
        // For students, would need to handle first_name/last_name split
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      }

      console.log('🔵 Updating profile in auth-context:', dbUpdates);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table as any) as any)
        .update(dbUpdates)
        .eq('id', session.user.id);

      if (error) {
        console.error('❌ Error in updateProfile:', error);
        throw error;
      }

      console.log('✅ Profile updated in auth-context');
      await fetchProfile(session.user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}