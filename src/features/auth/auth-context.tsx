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
      // Get user metadata to determine role
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role || 'student';

      // Determine which table to query
      const table = role === 'teacher' ? 'teachers' : 'students';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile not found (PGRST116) and we have retries left, wait and retry
        if (error.code === 'PGRST116' && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchProfile(userId, retries - 1);
        }
        return;
      }

      // Transform based on table type
      let transformedProfile: Profile;

      if (role === 'teacher') {
        const row = data as any;
        transformedProfile = {
          id: row.id,
          role: 'teacher',
          displayName: row.display_name,
          email: row.email,
          phoneNumber: row.phone,
          bio: row.bio,
          avatarUrl: row.avatar_url,
          videoUrl: row.video_url,
          hourlyRate: row.hourly_rate,
          subjects: [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          profileCompleted: row.profile_completed || false,
        };
      } else {
        const row = data as any;
        transformedProfile = {
          id: row.id,
          role: 'student',
          displayName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Student',
          email: row.email,
          phoneNumber: row.phone,
          bio: row.bio,
          avatarUrl: row.avatar_url,
          videoUrl: undefined,
          hourlyRate: undefined,
          subjects: row.subjects_interests || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          profileCompleted: true, // Students don't have this flag
        };
      }

      console.log('✅ Profile loaded from Supabase:', transformedProfile.displayName, `(${transformedProfile.role})`);
      setProfile(transformedProfile);
    } catch (error: any) {
      // Silent fail
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
        return { error: null, profile };
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
          profileData.phone = userData.phoneNumber || null;
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

      const { error } = await supabase
        .from(table)
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