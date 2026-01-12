'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCustomizationOptional, BACKGROUNDS, FILTERS } from '@/contexts';

export default function Background() {
  const customization = useCustomizationOptional();
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [, forceUpdate] = useState(0);

  // Detect mobile vs desktop based on screen width and orientation
  const checkScreenState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setIsMobile(width < 768);
    setIsLandscape(width > height);
  }, []);

  useEffect(() => {
    // Check on mount
    checkScreenState();

    // Listen for resize events
    window.addEventListener('resize', checkScreenState);

    // For iOS Safari, also listen to orientationchange with a delay
    // because dimensions aren't immediately updated
    const handleOrientationChange = () => {
      // Force immediate check
      checkScreenState();
      // And check again after animation completes
      setTimeout(() => {
        checkScreenState();
        forceUpdate(n => n + 1);
      }, 100);
      setTimeout(() => {
        checkScreenState();
        forceUpdate(n => n + 1);
      }, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    // Also use matchMedia for more reliable orientation detection
    const landscapeQuery = window.matchMedia('(orientation: landscape)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
      forceUpdate(n => n + 1);
    };
    landscapeQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('resize', checkScreenState);
      window.removeEventListener('orientationchange', handleOrientationChange);
      landscapeQuery.removeEventListener('change', handleMediaChange);
    };
  }, [checkScreenState]);

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
        backgroundPosition: 'center top',
        // Only use fixed attachment on desktop - iOS doesn't support it
        ...(isMobile ? {} : { backgroundAttachment: 'fixed' }),
      }
    : {};

  // Filter can be color-based or image-based
  const filterStyle: React.CSSProperties = filter
    ? filter.image
      ? {
          backgroundImage: `url(${filter.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          opacity: 0.3,
        }
      : filter.color !== 'transparent'
        ? { backgroundColor: filter.color }
        : {}
    : {};

  const hasCustomBg = backgroundId !== 'bg_default';
  const hasFilter = filter && (filter.color !== 'transparent' || filter.image) && filterId !== 'filter_none';
  // Only show cyan overlay on landing page (when not in CustomizationProvider)
  const isLandingPage = customization === null;

  // Fill the viewport for custom backgrounds
  const extendedStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

      {/* Default overlay for contrast - ONLY on landing page */}
      {isLandingPage && <div className="bg-overlay" />}
    </>
  );
}
