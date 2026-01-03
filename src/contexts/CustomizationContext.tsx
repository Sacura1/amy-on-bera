'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Background and filter configurations (mobile/desktop variants)
export const BACKGROUNDS: Record<string, { previewMobile: string | null; previewDesktop: string | null }> = {
  bg_default: { previewMobile: null, previewDesktop: null },
  bg_1: { previewMobile: '/bg_mobile_1.jpg', previewDesktop: '/bg_desktop_1.jpg' },
  bg_2: { previewMobile: '/bg_mobile_2.jpg', previewDesktop: '/bg_desktop_2.jpg' },
  bg_3: { previewMobile: '/bg_mobile_3.jpg', previewDesktop: '/bg_desktop_3.jpg' },
  bg_4: { previewMobile: '/bg_mobile_4.jpg', previewDesktop: '/bg_desktop_4.jpg' },
  bg_5: { previewMobile: '/bg_mobile_5.jpg', previewDesktop: '/bg_desktop_5.jpg' },
  bg_6: { previewMobile: '/bg_mobile_6.jpg', previewDesktop: '/bg_desktop_6.jpg' },
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
  getBackgroundStyle: (isMobile?: boolean) => React.CSSProperties;
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

  const getBackgroundStyle = (isMobile?: boolean): React.CSSProperties => {
    const bg = BACKGROUNDS[backgroundId];
    const preview = isMobile ? bg?.previewMobile : bg?.previewDesktop;
    if (preview) {
      return {
        backgroundImage: `url(${preview})`,
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

// Optional hook that returns null when not in a provider (for components used outside the app)
export function useCustomizationOptional() {
  return useContext(CustomizationContext);
}
