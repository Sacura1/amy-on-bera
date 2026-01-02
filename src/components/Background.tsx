'use client';

import { useCustomization } from '@/contexts';

export default function Background() {
  const { backgroundId, getBackgroundStyle, getFilterStyle } = useCustomization();

  const bgStyle = getBackgroundStyle();
  const filterStyle = getFilterStyle();
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
