'use client';

import { useState, useEffect } from 'react';
import { useCustomizationOptional, BACKGROUNDS, FILTERS } from '@/contexts';

export default function Background() {
  const customization = useCustomizationOptional();
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect mobile vs desktop based on screen width and orientation
  useEffect(() => {
    const checkScreenState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setIsLandscape(width > height);
    };

    // Check on mount
    checkScreenState();

    // Listen for resize and orientation change events
    window.addEventListener('resize', checkScreenState);
    window.addEventListener('orientationchange', checkScreenState);

    return () => {
      window.removeEventListener('resize', checkScreenState);
      window.removeEventListener('orientationchange', checkScreenState);
    };
  }, []);

  // If not in CustomizationProvider (e.g., landing page), use defaults
  const backgroundId = customization?.backgroundId || 'bg_default';
  const filterId = customization?.filterId || 'filter_none';

  const bg = BACKGROUNDS[backgroundId];
  const filter = FILTERS[filterId];

  // Select appropriate preview based on screen size and orientation
  // Mobile landscape uses the landscape variant (wider image)
  // Mobile portrait uses the portrait variant
  // Desktop always uses desktop variant
  const getPreview = () => {
    if (!isMobile) {
      return bg?.previewDesktop;
    }
    // On mobile, use landscape image when in landscape orientation
    if (isLandscape && bg?.previewMobileLandscape) {
      return bg.previewMobileLandscape;
    }
    return bg?.previewMobile;
  };

  const preview = getPreview();

  // Note: backgroundAttachment: 'fixed' doesn't work on iOS Safari
  // On mobile, we use a different approach with position: fixed on the container
  const bgStyle: React.CSSProperties = preview
    ? {
        backgroundImage: `url(${preview})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        // Only use fixed attachment on desktop - iOS doesn't support it
        ...(isMobile ? {} : { backgroundAttachment: 'fixed' }),
      }
    : {};

  const filterStyle: React.CSSProperties =
    filter && filter.color !== 'transparent'
      ? { backgroundColor: filter.color }
      : {};

  const hasCustomBg = backgroundId !== 'bg_default';
  const hasFilter = filter && filter.color !== 'transparent' && filterId !== 'filter_none';

  // Extend beyond viewport to cover iOS Safari address bar
  const extendedStyle: React.CSSProperties = {
    position: 'fixed',
    top: isMobile ? '-150px' : '-100px',
    left: 0,
    right: 0,
    bottom: isMobile ? '-150px' : '-100px',
  };

  return (
    <>
      {/* Default pattern background - hidden when custom bg is set */}
      {!hasCustomBg && <div className="bg-pattern" />}

      {/* Custom background image */}
      {hasCustomBg && (
        <div
          style={{
            ...extendedStyle,
            ...bgStyle,
            zIndex: -2,
          }}
        />
      )}

      {/* Filter overlay - only render if there's an active filter */}
      {hasFilter && (
        <div
          style={{
            ...extendedStyle,
            ...filterStyle,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Default overlay for contrast */}
      <div className="bg-overlay" />
    </>
  );
}
