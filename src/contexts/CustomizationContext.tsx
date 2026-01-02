'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Background and filter configurations
export const BACKGROUNDS: Record<string, { preview: string | null }> = {
  bg_default: { preview: null },
  bg_1: { preview: '/bg_1.jpg' },
  bg_2: { preview: '/bg_2.jpg' },
  bg_3: { preview: '/bg_3.jpg' },
  bg_4: { preview: '/bg_4.jpg' },
};

export const FILTERS: Record<string, { color: string }> = {
  filter_none: { color: 'transparent' },
  filter_grey: { color: 'rgba(107, 114, 128, 0.3)' },
  filter_blue: { color: 'rgba(59, 130, 246, 0.3)' },
  filter_pink: { color: 'rgba(236, 72, 153, 0.3)' },
  filter_yellow: { color: 'rgba(234, 179, 8, 0.3)' },
};

interface CustomizationContextType {
  backgroundId: string;
  filterId: string;
  setBackgroundId: (id: string) => void;
  setFilterId: (id: string) => void;
  getBackgroundStyle: () => React.CSSProperties;
  getFilterStyle: () => React.CSSProperties;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [backgroundId, setBackgroundId] = useState('bg_default');
  const [filterId, setFilterId] = useState('filter_none');

  // Load from localStorage on mount
  useEffect(() => {
    const savedBg = localStorage.getItem('amyBackgroundId');
    const savedFilter = localStorage.getItem('amyFilterId');
    if (savedBg) setBackgroundId(savedBg);
    if (savedFilter) setFilterId(savedFilter);
  }, []);

  const handleSetBackground = (id: string) => {
    setBackgroundId(id);
    localStorage.setItem('amyBackgroundId', id);
  };

  const handleSetFilter = (id: string) => {
    setFilterId(id);
    localStorage.setItem('amyFilterId', id);
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = BACKGROUNDS[backgroundId];
    if (bg?.preview) {
      return {
        backgroundImage: `url(${bg.preview})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    return {};
  };

  const getFilterStyle = (): React.CSSProperties => {
    const filter = FILTERS[filterId];
    if (filter && filter.color !== 'transparent') {
      return {
        backgroundColor: filter.color,
      };
    }
    return {};
  };

  return (
    <CustomizationContext.Provider
      value={{
        backgroundId,
        filterId,
        setBackgroundId: handleSetBackground,
        setFilterId: handleSetFilter,
        getBackgroundStyle,
        getFilterStyle,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
}
