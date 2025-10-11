import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreditsContextType {
  credits: number;
  addCredits: (amount: number) => void;
  subtractCredits: (amount: number) => void;
  setCredits: (amount: number) => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCreditsState] = useState<number>(0);

  const addCredits = (amount: number) => {
    setCreditsState(prev => prev + amount);
  };

  const subtractCredits = (amount: number) => {
    setCreditsState(prev => Math.max(0, prev - amount));
  };

  const setCredits = (amount: number) => {
    setCreditsState(Math.max(0, amount));
  };

  return (
    <CreditsContext.Provider value={{ credits, addCredits, subtractCredits, setCredits }}>
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

