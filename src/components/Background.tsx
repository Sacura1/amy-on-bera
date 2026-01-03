'use client';

import { useCustomizationOptional, BACKGROUNDS, FILTERS } from '@/contexts';

export default function Background() {
  const customization = useCustomizationOptional();

  // If not in CustomizationProvider (e.g., landing page), use defaults
  const backgroundId = customization?.backgroundId || 'bg_default';
  const filterId = customization?.filterId || 'filter_none';

  const bg = BACKGROUNDS[backgroundId];
  const filter = FILTERS[filterId];

  const bgStyle: React.CSSProperties = bg?.preview
    ? {
        backgroundImage: `url(${bg.preview})`,
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
