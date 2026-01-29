'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { useAnimations, useCustomization } from '@/contexts';

interface CustomiseSectionProps {
  wallet: string;
  currentBackground: string;
  currentFilter: string;
  currentAnimation: string;
  userPoints: number;
  onItemApplied: () => void;
}

// Backgrounds with actual images and pricing (mobile/desktop variants)
const BACKGROUNDS = [
  { id: 'bg_default', name: 'Default', label: null, previewMobile: '/bg_mobile_1.jpg', previewDesktop: '/bg_desktop_1.jpg', cost: 0 },
  { id: 'bg_2', name: 'Urban Sunset', label: 'Urban Sunset', previewMobile: '/bg_mobile_2.jpg', previewDesktop: '/bg_desktop_2.jpg', cost: 50 },
  { id: 'bg_3', name: 'Road Trip', label: 'Road Trip', previewMobile: '/bg_mobile_3.jpg', previewDesktop: '/bg_desktop_3.jpg', cost: 50 },
  { id: 'bg_4', name: 'Temple Prayer', label: 'Temple Prayer', previewMobile: '/bg_mobile_4.jpg', previewDesktop: '/bg_desktop_4.jpg', cost: 50 },
  { id: 'bg_5', name: 'Green Queen', label: 'Green Queen', previewMobile: '/bg_mobile_5.jpg', previewDesktop: '/bg_desktop_5.jpg', cost: 100 },
  { id: 'bg_6', name: 'Get In', label: 'Get In', previewMobile: '/bg_mobile_6.jpg', previewDesktop: '/bg_desktop_6.jpg', cost: 150 },
  { id: 'bg_fuzzy', name: 'Fuzzy Hold', label: 'Fuzzy Hold', previewMobile: '/Fuzzy_mobile.png', previewDesktop: '/Fuzzy_desktop.png', cost: 500 },
];

// Filters with colors/images and pricing
const FILTERS = [
  { id: 'filter_none', name: 'None', color: '#1a1a1a', cost: 0 },
  { id: 'filter_grey', name: 'Grey', color: '#6b7280', cost: 50 },
  { id: 'filter_blue', name: 'Blue', color: '#3b82f6', cost: 50 },
  { id: 'filter_pink', name: 'Pink', color: '#ec4899', cost: 50 },
  { id: 'filter_yellow', name: 'Yellow', color: '#eab308', cost: 50 },
  { id: 'filter_green', name: 'Green', color: '#22c55e', cost: 50 },
  // Image-based texture filters
  { id: 'filter_crack', name: 'Crack', image: '/crack.png', cost: 250 },
  { id: 'filter_dust', name: 'Dust', image: '/dust.png', cost: 250 },
  { id: 'filter_film_grain', name: 'Film Grain', image: '/film_grain.png', cost: 250 },
  { id: 'filter_film', name: 'Film', image: '/film.png', cost: 250 },
  { id: 'filter_halftone', name: 'Halftone', image: '/halftone.png', cost: 250 },
  { id: 'filter_noise', name: 'Noise', image: '/noise_texture.png', cost: 250 },
  { id: 'filter_redacted', name: 'Redacted', image: '/redacted.png', cost: 250 },
  { id: 'filter_scanlines', name: 'Scanlines', image: '/scanlines.png', cost: 250 },
  { id: 'filter_vhs', name: 'VHS', image: '/vhs_effect.png', cost: 250 },
];

// Animations (keeping as placeholders for now)
const ANIMATIONS = [
  { id: 'anim_none', name: 'Turn OFF', cost: 0 },
  { id: 'anim_floating', name: 'Turn ON', cost: 0 },
  { id: 'anim_custom', name: 'Custom', cost: 9999, comingSoon: true },
];

export default function CustomiseSection({
  wallet,
  currentBackground,
  currentFilter,
  currentAnimation,
  userPoints,
  onItemApplied
}: CustomiseSectionProps) {
  const { animationsEnabled, setAnimationsEnabled } = useAnimations();
  const { backgroundId, filterId, setBackgroundId, setFilterId } = useCustomization();

  // Collapse/expand state
  const [isExpanded, setIsExpanded] = useState(true);

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customiseSectionExpanded');
    if (saved !== null) {
      setIsExpanded(saved === 'true');
    }
  }, []);

  // Save expanded state to localStorage
  const toggleExpanded = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('customiseSectionExpanded', String(newState));
  }, [isExpanded]);

  // Use context values for initial selection (they persist via localStorage)
  const [selectedBackground, setSelectedBackground] = useState(backgroundId || currentBackground || 'bg_default');
  const [selectedFilter, setSelectedFilter] = useState(filterId || currentFilter || 'filter_none');
  const [selectedAnimation, setSelectedAnimation] = useState(animationsEnabled ? 'anim_floating' : 'anim_none');
  const [ownedItems, setOwnedItems] = useState<string[]>(['bg_default', 'filter_none', 'anim_none', 'anim_floating']);
  const [isApplying, setIsApplying] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [confirmPurchase, setConfirmPurchase] = useState<{ type: string; itemId: string; cost: number; name: string } | null>(null);

  // Refs for scroll containers
  const backgroundScrollRef = useRef<HTMLDivElement>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 200;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Sync selectedAnimation with animationsEnabled context
  useEffect(() => {
    setSelectedAnimation(animationsEnabled ? 'anim_floating' : 'anim_none');
  }, [animationsEnabled]);

  useEffect(() => {
    if (!wallet) return;

    const fetchOwnedItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/customization/${wallet}/owned`);
        const data = await response.json();
        if (data.success && data.data) {
          const owned = data.data.map((item: { id: string }) => item.id);
          // Always include free items
          setOwnedItems([...new Set(['bg_default', 'filter_none', 'anim_none', 'anim_floating', ...owned])]);
        }
      } catch (error) {
        console.error('Error fetching owned items:', error);
      }
    };

    fetchOwnedItems();
  }, [wallet]);

  const purchaseItem = async (type: string, itemId: string, cost: number) => {
    if (userPoints < cost) {
      setError(`Not enough points! You need ${cost} points.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setIsPurchasing(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/customization/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, itemId, type })
      });

      const data = await response.json();
      if (data.success) {
        setOwnedItems(prev => [...prev, itemId]);
        // Auto-apply after purchase
        await applyItem(type, itemId);
        onItemApplied(); // Refresh points
      } else {
        setError(data.error || 'Failed to purchase item');
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      setError('Failed to purchase item');
    } finally {
      setIsPurchasing(false);
    }
  };

  const applyItem = async (type: string, itemId: string) => {
    // Update local state immediately for better UX
    if (type === 'background') {
      setSelectedBackground(itemId);
      // Update the global context so Background component updates
      setBackgroundId(itemId);
    }
    if (type === 'filter') {
      setSelectedFilter(itemId);
      // Update the global context so Background component updates
      setFilterId(itemId);
    }
    if (type === 'animation') {
      setSelectedAnimation(itemId);
      // Update the global animation state immediately
      setAnimationsEnabled(itemId === 'anim_floating');
    }

    // Then sync with backend
    try {
      setIsApplying(true);
      const response = await fetch(`${API_BASE_URL}/api/customization/${wallet}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId })
      });

      const data = await response.json();
      if (data.success) {
        onItemApplied();
      }
    } catch (error) {
      console.error('Error applying item:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleItemClick = (type: string, itemId: string, cost: number, name: string) => {
    const isOwned = ownedItems.includes(itemId);

    if (isOwned) {
      applyItem(type, itemId);
    } else {
      // Show confirmation modal for purchases
      setConfirmPurchase({ type, itemId, cost, name });
    }
  };

  const confirmPurchaseHandler = async () => {
    if (!confirmPurchase) return;
    await purchaseItem(confirmPurchase.type, confirmPurchase.itemId, confirmPurchase.cost);
    setConfirmPurchase(null);
  };

  return (
    <div className="bg-gray-900/90 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={toggleExpanded}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-yellow-400">Customise</h2>
          <span className="text-sm text-gray-400">
            ({userPoints.toLocaleString()} pts)
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 md:px-6 md:pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Background Section - Horizontally Swipeable with Arrows */}
          <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Background</h3>
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll(backgroundScrollRef, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-800/90 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors -ml-2 md:ml-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Right Arrow */}
          <button
            onClick={() => scroll(backgroundScrollRef, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-800/90 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors -mr-2 md:mr-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div ref={backgroundScrollRef} className="flex gap-4 overflow-x-auto pt-2 pb-4 px-10 md:px-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {BACKGROUNDS.map((bg) => {
            const isSelected = selectedBackground === bg.id;
            const isOwned = ownedItems.includes(bg.id);
            const isLocked = !isOwned && bg.cost > 0;

            return (
              <div
                key={bg.id}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  onClick={() => !isApplying && !isPurchasing && handleItemClick('background', bg.id, bg.cost, bg.name)}
                  className={`relative w-24 h-16 md:w-28 md:h-[72px] rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-yellow-400 scale-105' : 'ring-1 ring-gray-600 hover:ring-gray-500'
                  }`}
                >
                  {/* Content that gets blurred */}
                  <div className={`w-full h-full ${isLocked ? 'blur-[2px]' : ''}`}>
                    {bg.previewDesktop ? (
                      <img
                        src={bg.previewDesktop}
                        alt={bg.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Default</span>
                      </div>
                    )}
                  </div>

                  {/* Price badge for locked items - outside blur */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                        {bg.cost} pts
                      </div>
                    </div>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Label below thumbnail - only show if label exists */}
                <span className="text-[10px] text-gray-400">{bg.label || 'Default'}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Filter Section - Horizontally Swipeable with Arrows */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Filter</h3>
        <div className="relative">
          {/* Left Arrow - higher z-index to stay above items */}
          <button
            onClick={(e) => { e.stopPropagation(); scroll(filterScrollRef, 'left'); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors border border-gray-600"
            style={{ marginTop: '-10px' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Right Arrow - higher z-index to stay above items */}
          <button
            onClick={(e) => { e.stopPropagation(); scroll(filterScrollRef, 'right'); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors border border-gray-600"
            style={{ marginTop: '-10px' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div ref={filterScrollRef} className="flex gap-4 overflow-x-auto pt-2 pb-4 px-10 md:px-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            const isOwned = ownedItems.includes(filter.id);
            const isLocked = !isOwned && filter.cost > 0;
            const hasImage = 'image' in filter && filter.image;

            return (
              <div
                key={filter.id}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  onClick={() => !isApplying && !isPurchasing && handleItemClick('filter', filter.id, filter.cost, filter.name)}
                  className={`relative w-24 h-16 md:w-28 md:h-[72px] rounded-lg cursor-pointer transition-all overflow-hidden ${
                    isSelected ? 'ring-2 ring-yellow-400 scale-105' : 'ring-1 ring-gray-600 hover:ring-gray-500'
                  }`}
                >
                  {/* Background - color or image based */}
                  {hasImage ? (
                    <img
                      src={filter.image}
                      alt={filter.name}
                      className={`absolute inset-0 w-full h-full object-cover ${isLocked ? 'blur-[2px]' : ''}`}
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 ${isLocked ? 'blur-[2px]' : ''}`}
                      style={{ backgroundColor: filter.color }}
                    />
                  )}

                  {/* Price badge for locked items - NOT blurred */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
                      <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">{filter.cost}</span>
                    </div>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">{filter.name}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>

          {/* Animations Section */}
          <div>
            <h3 className="text-white font-semibold mb-3">Animations</h3>
            <div className="grid grid-cols-3 gap-3">
              {ANIMATIONS.map((anim) => {
                const isSelected = selectedAnimation === anim.id;
                const isOwned = ownedItems.includes(anim.id);
                const isLocked = !isOwned && anim.cost > 0;
                const isComingSoon = (anim as any).comingSoon;

                return (
                  <div
                    key={anim.id}
                    onClick={() => {
                      if (!isApplying && !isPurchasing && !isComingSoon) {
                        handleItemClick('animation', anim.id, anim.cost, anim.name);
                      }
                    }}
                    className={`relative px-4 py-3 rounded-lg bg-gray-800 transition-all flex items-center justify-center cursor-pointer ${
                      isSelected && !isComingSoon ? 'ring-2 ring-yellow-400 bg-gray-700' : 'ring-1 ring-gray-600 hover:ring-gray-500'
                    } ${isComingSoon ? 'cursor-not-allowed' : ''}`}
                  >
                    {/* Content that gets blurred for coming soon */}
                    <span className={`text-sm text-gray-300 whitespace-nowrap ${isComingSoon ? 'blur-[2px]' : ''}`}>{anim.name}</span>

                    {/* Coming Soon badge - outside blur */}
                    {isComingSoon && (
                      <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-10">
                        Soon
                      </div>
                    )}

                    {/* Price badge for locked items */}
                    {isLocked && !isComingSoon && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                        {anim.cost}
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && !isComingSoon && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Click on locked items to purchase with Amy Points
          </p>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {confirmPurchase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Purchase</h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to purchase <span className="text-yellow-400 font-semibold">
                {confirmPurchase.type === 'background' ? 'this background' :
                 confirmPurchase.type === 'filter' ? 'this filter' :
                 'this animation'}
              </span>?
            </p>
            <p className="text-gray-400 mb-6">
              Cost: <span className="text-yellow-400 font-bold">{confirmPurchase.cost} points</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPurchase(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isPurchasing}
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchaseHandler}
                disabled={isPurchasing || userPoints < confirmPurchase.cost}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPurchasing ? 'Purchasing...' : 'Confirm'}
              </button>
            </div>
            {userPoints < confirmPurchase.cost && (
              <p className="text-red-400 text-sm mt-3 text-center">
                Not enough points! You need {confirmPurchase.cost - userPoints} more.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
