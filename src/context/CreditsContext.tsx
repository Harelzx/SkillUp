import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
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
  const { session } = useAuth();
  const lastFetchedUserId = useRef<string | null>(null);

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
      // Add timeout to prevent hanging - increased to 15 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Credits fetch timeout')), 15000);
      });

      const balance = await Promise.race([
        getCreditBalance(),
        timeoutPromise
      ]) as number;
      
      // Check if cancelled before setting state
      if (abortSignal?.aborted) {
        console.log('🔵 [CreditsContext] Fetch cancelled after response');
        return;
      }
      
      console.log('✅ [CreditsContext] Fetched credits balance:', balance);
      setCreditsState(balance);
      lastFetchedUserId.current = session.user.id;
    } catch (error: any) {
      // Don't log timeout errors if cancelled
      if (abortSignal?.aborted) {
        console.log('🔵 [CreditsContext] Fetch cancelled');
        return;
      }
      
      console.error('❌ [CreditsContext] Error fetching credits:', error?.message || error);
      // If error (e.g., not logged in, timeout, etc.), keep at 0
      setCreditsState(0);
    } finally {
      if (!abortSignal?.aborted) {
        setIsFetching(false);
      }
    }
  }, [session?.user]);

  // Fetch credits from DB when user is authenticated or user ID changes
  useEffect(() => {
    const userId = session?.user?.id || null;

    // If no user, reset
    if (!userId) {
      console.log('🔵 [CreditsContext] No user session, setting credits to 0');
      setCreditsState(0);
      lastFetchedUserId.current = null;
      return;
    }

    // Only fetch if user ID changed or hasn't been fetched yet
    if (lastFetchedUserId.current !== userId && !isFetching) {
      console.log('🔵 [CreditsContext] User authenticated, fetching credits...');
      
      // Create abort controller for cleanup
      const abortController = new AbortController();
      fetchCredits(abortController.signal);

      // Cleanup function
      return () => {
        abortController.abort();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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

