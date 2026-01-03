'use client';

import { useState, useEffect } from 'react';
import { useCustomizationOptional, BACKGROUNDS, FILTERS } from '@/contexts';

export default function Background() {
  const customization = useCustomizationOptional();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile vs desktop based on screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If not in CustomizationProvider (e.g., landing page), use defaults
  const backgroundId = customization?.backgroundId || 'bg_default';
  const filterId = customization?.filterId || 'filter_none';

  const bg = BACKGROUNDS[backgroundId];
  const filter = FILTERS[filterId];

  // Select mobile or desktop preview based on screen size
  const preview = isMobile ? bg?.previewMobile : bg?.previewDesktop;

  const bgStyle: React.CSSProperties = preview
    ? {
        backgroundImage: `url(${preview})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {};

  const filterStyle: React.CSSProperties =
    filter && filter.color !== 'transparent'
      ? { backgroundColor: filter.color }
      : {};

  const hasCustomBg = backgroundId !== 'bg_default';

  return (
    <>
      {/* Default pattern background - hidden when custom bg is set */}
      {!hasCustomBg && <div className="bg-pattern" />}

      {/* Custom background image */}
      {hasCustomBg && (
        <div
          className="fixed inset-0 z-0"
          style={bgStyle}
        />
      )}

      {/* Filter overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={filterStyle}
      />

      {/* Default overlay for contrast */}
      <div className="bg-overlay" />
    </>
  );
}
