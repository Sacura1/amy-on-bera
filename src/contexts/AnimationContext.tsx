'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnimationContextType {
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: ReactNode }) {
  // Animations disabled by default for new users
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('amyAnimationsEnabled');
    if (saved !== null) {
      setAnimationsEnabled(saved === 'true');
    }
  }, []);

  // Save to localStorage when changed
  const handleSetAnimations = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
    localStorage.setItem('amyAnimationsEnabled', String(enabled));
  };

  return (
    <AnimationContext.Provider value={{ animationsEnabled, setAnimationsEnabled: handleSetAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimations() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
}
