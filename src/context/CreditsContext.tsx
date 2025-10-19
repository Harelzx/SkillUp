import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

  // Fetch credits from DB when user is authenticated
  useEffect(() => {
    if (session?.user) {
      console.log('🔵 [CreditsContext] User authenticated, fetching credits...');
      fetchCredits();
    } else {
      console.log('🔵 [CreditsContext] No user session, setting credits to 0');
      setCreditsState(0);
    }
  }, [session]);

  const fetchCredits = async () => {
    if (isFetching) {
      console.log('⏭️ [CreditsContext] Already fetching, skipping...');
      return;
    }

    // Check if user is authenticated before attempting to fetch
    if (!session?.user) {
      console.log('🔵 [CreditsContext] No authenticated user, skipping credits fetch');
      setCreditsState(0);
      return;
    }

    setIsFetching(true);
    console.log('🔵 [CreditsContext] Fetching credits balance from DB...');

    try {
      const balance = await getCreditBalance();
      console.log('✅ [CreditsContext] Fetched credits balance:', balance);
      setCreditsState(balance);
    } catch (error: any) {
      console.error('❌ [CreditsContext] Error fetching credits:', error?.message || error);
      // If error (e.g., not logged in), keep at 0
      setCreditsState(0);
    } finally {
      setIsFetching(false);
    }
  };

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

