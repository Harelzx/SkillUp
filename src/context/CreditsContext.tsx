import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { getCreditBalance } from '@/services/api/creditsAPI';
import { useAuth } from '@/features/auth/auth-context';

interface CreditsContextType {
  credits: number;
  addCredits: (amount: number) => void;
  subtractCredits: (amount: number) => void;
  setCredits: (amount: number) => void;
  refetchCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCreditsState] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);
  const { session, profile, isLoading: authLoading } = useAuth();
  const lastFetchedUserId = useRef<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interactionHandleRef = useRef<{ cancel: () => void } | null>(null);

  const fetchCredits = useCallback(async (abortSignal?: AbortSignal) => {
    if (!session?.user) {
      console.log('🔵 [CreditsContext] No authenticated user, skipping credits fetch');
      setCreditsState(0);
      return;
    }

    // Check if already cancelled
    if (abortSignal?.aborted) {
      console.log('🔵 [CreditsContext] Fetch cancelled');
      return;
    }

    setIsFetching(true);
    console.log('🔵 [CreditsContext] Fetching credits balance from DB...');

    try {
      const balance = await getCreditBalance();

      // Check if cancelled before setting state
      if (abortSignal?.aborted) {
        console.log('🔵 [CreditsContext] Fetch cancelled after response');
        return;
      }

      console.log('✅ [CreditsContext] Fetched credits balance:', balance);
      setCreditsState(balance);
      lastFetchedUserId.current = session.user.id;
    } catch (error: any) {
      // Don't log errors if cancelled
      if (abortSignal?.aborted) {
        console.log('🔵 [CreditsContext] Fetch cancelled');
        return;
      }

      // Only log non-authentication errors
      if (error?.message !== 'Not authenticated') {
        console.error('❌ [CreditsContext] Error fetching credits:', error?.message || error);
      }
      // If error (e.g., not logged in, etc.), keep at 0
      setCreditsState(0);
    } finally {
      if (!abortSignal?.aborted) {
        setIsFetching(false);
      }
    }
  }, [session?.user]);

  // Fetch credits from DB when user is authenticated or user ID changes
  // Delay fetch until after app has loaded to prevent blocking UI
  useEffect(() => {
    const userId = session?.user?.id || null;

    // Cleanup any pending timeouts or interaction handles
    const cleanup = () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (interactionHandleRef.current) {
        interactionHandleRef.current.cancel();
        interactionHandleRef.current = null;
      }
    };

    // If no user, reset and don't fetch
    if (!userId) {
      cleanup();
      // Only log and reset if we previously had a user
      if (lastFetchedUserId.current !== null) {
        console.log('🔵 [CreditsContext] User logged out, resetting credits to 0');
      }
      setCreditsState(0);
      lastFetchedUserId.current = null;
      return cleanup;
    }

    // Wait for auth to finish loading before doing anything
    if (authLoading) {
      cleanup();
      return cleanup;
    }

    // Only fetch if user ID changed or hasn't been fetched yet
    if (lastFetchedUserId.current !== userId && !isFetching) {

      // Check if user is a student - only students need credits
      // If profile is loaded and user is not a student, skip credits fetch
      if (profile && profile.role !== 'student') {
        console.log('🔵 [CreditsContext] User is not a student, skipping credits fetch');
        lastFetchedUserId.current = userId;
        return cleanup;
      }

      // If profile is not loaded yet, we'll still try to fetch credits
      // The API will handle non-student users and return 0
      console.log('🔵 [CreditsContext] User authenticated, scheduling credits fetch after app load...');

      // Create abort controller for cleanup
      const abortController = new AbortController();

      // Delay fetch using InteractionManager to allow UI to render first
      // This ensures the app loads before fetching credits, preventing UI blocking
      interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
        // Additional delay to ensure app has fully rendered and navigation is complete
        fetchTimeoutRef.current = setTimeout(() => {
          console.log('🔵 [CreditsContext] App loaded, fetching credits now...');
          fetchCredits(abortController.signal);
        }, 500); // 500ms delay after interactions complete
      });

      // Cleanup function
      return () => {
        cleanup();
        abortController.abort();
      };
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, profile?.role, authLoading]);

  const addCredits = (amount: number) => {
    setCreditsState(prev => prev + amount);
  };

  const subtractCredits = (amount: number) => {
    setCreditsState(prev => Math.max(0, prev - amount));
  };

  const setCredits = (amount: number) => {
    setCreditsState(Math.max(0, amount));
  };

  const refetchCredits = async () => {
    await fetchCredits();
  };

  return (
    <CreditsContext.Provider value={{ credits, addCredits, subtractCredits, setCredits, refetchCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}

