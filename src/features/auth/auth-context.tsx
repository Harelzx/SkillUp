import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { 
  IS_DEV_MODE, 
  validateDevUser, 
  getDevUserProfile,
  createDevSession,
  isDevUser 
} from '@/data/dev-users';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile | null }>;
  signUp: (email: string, password: string, role: 'teacher' | 'student') => Promise<{ error: Error | null }>;
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

  const fetchProfile = async (userId: string) => {
    try {
      // Check if this is a DEV user first
      if (IS_DEV_MODE) {
        const devProfile = getDevUserProfile(userId);
        if (devProfile) {
          console.log('📝 Using DEV profile:', devProfile.displayName, `(${devProfile.role})`);
          setProfile(devProfile);
          return;
        }
      }

      // Otherwise, fetch from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // DEV Mode: Check for dev users first
      if (IS_DEV_MODE && isDevUser(email)) {
        console.log('🔧 DEV Mode: Attempting login with dev user:', email);
        const devUser = validateDevUser(email, password);
        
        if (devUser) {
          // Create mock session
          const mockSession = createDevSession(devUser) as any;
          setSession(mockSession);
          setProfile(devUser.profile);
          
          console.log('✅ DEV Login successful! Role:', devUser.profile.role);
          return { error: null, profile: devUser.profile };
        } else {
          console.log('❌ DEV Login failed: Invalid credentials');
          throw new Error('Invalid email or password');
        }
      }

      // Production: Use Supabase
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
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        return { error: null, profile: profileData };
      }

      return { error: null, profile: null };
    } catch (error) {
      return { error: error as Error, profile: null };
    }
  };

  const signUp = async (email: string, password: string, role: 'teacher' | 'student') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role,
            displayName: email.split('@')[0],
          });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Clear state for both DEV and production
    if (IS_DEV_MODE && session?.access_token?.startsWith('dev-token-')) {
      console.log('🔧 DEV Mode: Signing out dev user');
      setSession(null);
      setProfile(null);
      return;
    }

    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!session?.user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

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