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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
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

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      // Fetch profile from Supabase - explicit columns to avoid cache issues
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, display_name, bio, avatar_url, video_url, phone_number, email, location, hourly_rate, experience_years, total_students, is_verified, is_active, created_at, updated_at, lesson_modes, duration_options, regions, timezone, teaching_style, profile_completed')
        .eq('id', userId)
        .single();

      if (error) {
        // If cache issue (PGRST204), try with minimal columns
        if (error.code === 'PGRST204') {
          console.log('⚠️ Schema cache issue in fetchProfile, using fallback...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, role, display_name, bio, avatar_url, hourly_rate, location, created_at, updated_at, profile_completed')
            .eq('id', userId)
            .single();

          if (!fallbackError && fallbackData) {
            const row = fallbackData as any;
            const transformedProfile: Profile = {
              id: row.id,
              role: row.role,
              displayName: row.display_name,
              email: row.email,
              phoneNumber: row.phone_number,
              bio: row.bio,
              avatarUrl: row.avatar_url,
              videoUrl: undefined,
              hourlyRate: row.hourly_rate,
              subjects: [],
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              profileCompleted: row.profile_completed,
            };
            console.log('✅ Profile loaded from Supabase (fallback):', transformedProfile.displayName, `(${transformedProfile.role})`);
            setProfile(transformedProfile);
            return;
          }
        }
        
        // If profile not found (PGRST116) and we have retries left, wait and retry
        if (error.code === 'PGRST116' && retries > 0) {
          // Silent retry - no console spam
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchProfile(userId, retries - 1);
        }

        // Silent fail - profile doesn't exist yet or user logged out
        // This is normal during logout or before profile is created
        return;
      }

      // Transform snake_case to camelCase for consistency with TypeScript conventions
      const row = data as any;
      const transformedProfile: Profile = {
        id: row.id,
        role: row.role,
        displayName: row.display_name,
        email: row.email,
        phoneNumber: row.phone_number,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        videoUrl: row.video_url,
        hourlyRate: row.hourly_rate,
        subjects: row.subjects,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        profileCompleted: row.profile_completed,
      };

      console.log('✅ Profile loaded from Supabase:', transformedProfile.displayName, `(${transformedProfile.role})`);
      setProfile(transformedProfile);
    } catch (error: any) {
      // Silent fail - already handled above
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sign in with Supabase
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile after successful Supabase login
      if (data.user) {
        await fetchProfile(data.user.id);
        // Return the profile (it's now in state, but also return it directly)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, role, display_name, bio, avatar_url, video_url, phone_number, email, location, hourly_rate, experience_years, total_students, is_verified, is_active, created_at, updated_at, lesson_modes, duration_options, regions, timezone, teaching_style, profile_completed')
          .eq('id', data.user.id)
          .single();

        // Transform to camelCase
        const profileRow = profileData as any;
        const transformedProfile: Profile | null = profileRow ? {
          id: profileRow.id,
          role: profileRow.role,
          displayName: profileRow.display_name,
          email: profileRow.email,
          phoneNumber: profileRow.phone_number,
          bio: profileRow.bio,
          avatarUrl: profileRow.avatar_url,
          videoUrl: profileRow.video_url,
          hourlyRate: profileRow.hourly_rate,
          subjects: profileRow.subjects,
          createdAt: profileRow.created_at,
          updatedAt: profileRow.updated_at,
          profileCompleted: profileRow.profile_completed,
        } : null;
        
        return { error: null, profile: transformedProfile };
      }

      return { error: null, profile: null };
    } catch (error) {
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

      // Create profile with all user data
      if (data.user) {
        const profileData: any = {
          id: data.user.id,
          role: userData.role,
          display_name: userData.displayName,
          phone_number: userData.phoneNumber || null,
          is_verified: false,
          is_active: true,
          total_students: 0,
        };

        // Try to add email if column exists
        try {
          profileData.email = email;
        } catch (e) {
          // Email column might not exist, that's OK
        }

        console.log('🔵 Creating profile with data:', profileData);

        const { error: profileError, data: insertedProfile } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        console.log('🔵 Profile insert response:', {
          success: !profileError,
          error: profileError?.message,
          profileCreated: !!insertedProfile
        });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw profileError;
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

      // Convert camelCase updates to snake_case for database
      const dbUpdates: any = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
      if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;

      console.log('🔵 Updating profile in auth-context:', dbUpdates);

      const { error } = await (supabase as any)
        .from('profiles')
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