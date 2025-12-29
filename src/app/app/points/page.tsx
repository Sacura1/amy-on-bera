'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useAmyBalance } from '@/hooks';
import { API_BASE_URL } from '@/lib/constants';
import Link from 'next/link';

interface TierInfo {
  minBalance: number;
  pointsPerHour: number;
  name: string;
  emoji: string;
}

interface PointsData {
  wallet: string;
  totalPoints: number;
  currentTier: string;
  tierInfo: TierInfo;
  pointsPerHour: number;
  lastAmyBalance: number;
  lastPointsUpdate?: string;
  lpValueUsd?: number;
  lpMultiplier?: number;
}

interface LpData {
  lpValueUsd: number;
  totalLpValueUsd: number;
  lpMultiplier: number;
  positionsFound: number;
  inRangePositions: number;
  isInRange: boolean;
  amyPriceUsd: number;
}

const TIERS: Record<string, TierInfo> = {
  platinum: { minBalance: 100000, pointsPerHour: 10, name: 'Platinum', emoji: '💎' },
  gold: { minBalance: 10000, pointsPerHour: 5, name: 'Gold', emoji: '🥇' },
  silver: { minBalance: 1000, pointsPerHour: 3, name: 'Silver', emoji: '🥈' },
  bronze: { minBalance: 300, pointsPerHour: 1, name: 'Bronze', emoji: '🟫' },
  none: { minBalance: 0, pointsPerHour: 0, name: 'None', emoji: '⚪' }
};

// TEST MODE - set to true to see the page with mock data (no wallet needed)
const TEST_MODE = false;
const MOCK_BALANCE = 150000; // Platinum tier
const MOCK_POINTS_DATA: PointsData = {
  wallet: '0xMockWallet',
  totalPoints: 52843.75,
  currentTier: 'platinum',
  tierInfo: TIERS.platinum,
  pointsPerHour: 10,
  lastAmyBalance: 150000,
  lastPointsUpdate: new Date().toISOString(),
};
const MOCK_LP_DATA: LpData = {
  lpValueUsd: 750,
  totalLpValueUsd: 5000,
  lpMultiplier: 100,
  positionsFound: 3,
  inRangePositions: 2,
  isInRange: true,
  amyPriceUsd: 0.0042,
};

// Multiplier Badge Component
interface MultiplierTier {
  requirement: string;
  multiplier: string;
}

interface BadgeProps {
  name: string;
  title: string;
  image?: string;
  description?: string;
  multipliers?: MultiplierTier[];
  currentMultiplier?: string;
  isActive: boolean;
  isPlaceholder?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const MultiplierBadge = ({ name, title, image, description, multipliers, currentMultiplier, isActive, isPlaceholder, actionUrl, actionLabel }: BadgeProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupStyle, setPopupStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Calculate popup position to keep it fully visible in viewport
  const updatePopupPosition = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const popupWidth = 288; // w-72 = 18rem = 288px
      const popupHeight = 400; // Approximate max popup height
      const padding = 16; // Padding from viewport edges

      // Calculate initial position (centered below the card)
      let top = rect.bottom + 8;
      let left = rect.left + (rect.width / 2) - (popupWidth / 2);

      // Adjust horizontal position to stay within viewport
      if (left < padding) {
        left = padding;
      } else if (left + popupWidth > window.innerWidth - padding) {
        left = window.innerWidth - popupWidth - padding;
      }

      // Adjust vertical position - prefer below, but show above if not enough space
      const spaceBelow = window.innerHeight - rect.bottom - padding;
      const spaceAbove = rect.top - padding;

      if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
        // Show above the card
        top = rect.top - popupHeight - 8;
        // Make sure it doesn't go above the viewport
        if (top < padding) {
          top = padding;
        }
      } else {
        // Show below - make sure it doesn't go below viewport
        if (top + popupHeight > window.innerHeight - padding) {
          top = window.innerHeight - popupHeight - padding;
        }
      }

      setPopupStyle({ top, left });
    }
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  // Placeholder badge (Coming Soon)
  if (isPlaceholder) {
    return (
      <div className="rounded-xl border border-gray-700/30 overflow-hidden bg-black/20">
        <div className="p-3 flex justify-center">
          <div className="w-14 h-12 rounded-lg bg-gray-800/60 flex items-center justify-center">
            <div className="w-8 h-6 rounded bg-gray-700/40" />
          </div>
        </div>
        <div className="px-2 pb-2">
          <p className="text-[10px] text-yellow-600/60 text-center">Coming Soon</p>
        </div>
      </div>
    );
  }

  // Named badge with popup details
  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => {
        updatePopupPosition();
        setShowPopup(true);
      }}
      onMouseLeave={() => setShowPopup(false)}
    >
      {/* Compact card - always visible */}
      <div className={`rounded-xl border overflow-hidden bg-black/20 cursor-pointer transition-all hover:border-yellow-500/50 ${
        isActive ? 'border-yellow-500/50' : 'border-gray-700/30'
      }`}>
        {/* Info button for mobile */}
        {description && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updatePopupPosition();
              setShowPopup(!showPopup);
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-700/80 hover:bg-gray-600 flex items-center justify-center z-10 transition-colors"
          >
            <span className="text-[10px] font-bold text-gray-300">i</span>
          </button>
        )}

        {/* Multiplier badge corner */}
        {isActive && currentMultiplier && (() => {
          // Color based on multiplier tier
          let badgeColors = 'bg-amber-700 text-amber-200 border-amber-500'; // x3 - Bronze
          if (currentMultiplier.includes('100')) {
            badgeColors = 'bg-yellow-500 text-yellow-950 border-yellow-300'; // x100 - Gold
          } else if (currentMultiplier.includes('10')) {
            badgeColors = 'bg-slate-400 text-slate-900 border-slate-200'; // x10 - Silver
          }

          return (
            <div className={`absolute -top-2 -left-2 text-xs font-black px-2 py-1 rounded-md z-10 shadow-lg border-2 ${badgeColors}`}>
              {currentMultiplier}
            </div>
          );
        })()}

        {/* Icon */}
        <div className="p-3 flex justify-center">
          <div className={`w-14 h-12 rounded-lg flex items-center justify-center overflow-hidden relative ${
            isActive ? 'bg-white' : 'bg-gray-800/60'
          }`}>
            {image ? (
              <>
                <img src={image} alt={name} className={`w-10 h-10 object-contain ${!isActive && 'opacity-60'}`} />
                {/* Subtle overlay for inactive state */}
                {!isActive && <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />}
              </>
            ) : (
              <div className="w-8 h-6 rounded bg-green-500" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="px-1 pb-2">
          <p className={`text-[9px] text-center leading-tight ${
            isActive ? 'text-yellow-400' : 'text-yellow-600/50'
          }`}>
            {name} - {title}
          </p>
        </div>
      </div>

      {/* Popup - shows details */}
      {showPopup && description && (
        <div
          ref={popupRef}
          className="fixed z-[9999] w-72 rounded-2xl border border-yellow-500/50 overflow-hidden shadow-2xl shadow-black/50 bg-gray-800"
          style={{ top: popupStyle.top, left: popupStyle.left }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          <div className="bg-gray-800">
            {/* Close button for mobile */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center z-10 md:hidden"
            >
              <span className="text-gray-300 text-sm">×</span>
            </button>

            {/* Header with logo */}
            <div className="bg-gradient-to-b from-gray-700/50 to-gray-800 p-4 flex justify-center">
              <div className="w-24 h-20 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-lg">
                {image ? (
                  <img src={image} alt={name} className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-12 h-10 rounded bg-green-500" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h3 className="text-base font-bold text-yellow-400 mb-2">
                {name} – {title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-300 mb-4">{description}</p>

              {/* Multipliers */}
              {multipliers && multipliers.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Multipliers:</div>
                  <div className="space-y-2">
                    {multipliers.map((tier, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-300">
                          {tier.requirement}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-yellow-400 font-bold">{tier.multiplier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 italic mb-3">
                  Only the highest unlocked multiplier applies.
                </p>
                {actionUrl && (
                  <a
                    href={actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-sm py-2.5 px-4 rounded-xl text-center transition-all shadow-lg hover:shadow-yellow-500/25"
                  >
                    {actionLabel || 'Add Liquidity'} →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tier Icon Component
const TierIcon = ({ tier }: { tier: string }) => {
  const iconStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    platinum: {
      bg: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-500',
      border: 'border-cyan-300',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
        </svg>
      )
    },
    gold: {
      bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500',
      border: 'border-yellow-300',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/>
        </svg>
      )
    },
    silver: {
      bg: 'bg-gradient-to-br from-gray-300 via-slate-400 to-gray-500',
      border: 'border-gray-300',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8L15 13.2L21 14.3L16.5 18.6L17.5 24L12 21.2L6.5 24L7.5 18.6L3 14.3L9 13.2L12 8Z"/>
        </svg>
      )
    },
    bronze: {
      bg: 'bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-800',
      border: 'border-orange-400',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 10V12.5L12 11L9 12.5V10L3 7V9L9 12V22H11V16H13V22H15V12L21 9Z"/>
        </svg>
      )
    },
    none: {
      bg: 'bg-gradient-to-br from-gray-600 to-gray-700',
      border: 'border-gray-500',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
        </svg>
      )
    }
  };

  const style = iconStyles[tier] || iconStyles.none;

  return (
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${style.bg} ${style.border} border-2 flex items-center justify-center shadow-lg flex-shrink-0`}>
      {style.icon}
    </div>
  );
};

export default function PointsPage() {
  const account = useActiveAccount();
  const { balance: realBalance, walletAddress: realWalletAddress } = useAmyBalance();

  // Use mock data in test mode
  const balance = TEST_MODE ? MOCK_BALANCE : realBalance;
  const walletAddress = TEST_MODE ? '0xMockWallet' : realWalletAddress;

  const [pointsData, setPointsData] = useState<PointsData | null>(TEST_MODE ? MOCK_POINTS_DATA : null);
  const [lpData, setLpData] = useState<LpData | null>(TEST_MODE ? MOCK_LP_DATA : null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLp, setIsLoadingLp] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(TEST_MODE ? MOCK_POINTS_DATA.totalPoints : 0);

  // Fetch points data
  const fetchPointsData = useCallback(async () => {
    if (!walletAddress || TEST_MODE) return;

    setIsLoading(true);
    try {
      // First update the balance on backend
      await fetch(`${API_BASE_URL}/api/points/update-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          amyBalance: balance,
          xUsername: null
        })
      });

      // Then fetch the points data
      const response = await fetch(`${API_BASE_URL}/api/points/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        setPointsData(data.data);

        // Calculate elapsed time since last points update and add simulated points
        const basePoints = parseFloat(data.data.totalPoints) || 0;
        let initialDisplayPoints = basePoints;

        if (data.data.lastPointsUpdate && data.data.pointsPerHour > 0) {
          const lastUpdate = new Date(data.data.lastPointsUpdate).getTime();
          const now = Date.now();
          const elapsedSeconds = (now - lastUpdate) / 1000;
          const pointsPerSecond = data.data.pointsPerHour / 3600;
          const simulatedPoints = elapsedSeconds * pointsPerSecond;
          initialDisplayPoints = basePoints + simulatedPoints;
        }

        setDisplayPoints(initialDisplayPoints);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, balance]);

  // Fetch LP data
  const fetchLpData = useCallback(async () => {
    if (!walletAddress || TEST_MODE) return;

    setIsLoadingLp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/lp/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        setLpData(data.data);
      }
    } catch (error) {
      console.error('Error fetching LP data:', error);
    } finally {
      setIsLoadingLp(false);
    }
  }, [walletAddress]);

  // Fetch points and LP data when wallet connects
  useEffect(() => {
    if (walletAddress) {
      fetchPointsData();
      fetchLpData();
    }
  }, [walletAddress, fetchPointsData, fetchLpData]);

  // Animate points counter (increment based on points per hour)
  useEffect(() => {
    if (!pointsData || pointsData.pointsPerHour <= 0) return;

    // Calculate points per second
    const pointsPerSecond = pointsData.pointsPerHour / 3600;

    const interval = setInterval(() => {
      setDisplayPoints(prev => prev + pointsPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [pointsData]);

  // Get current tier based on balance
  const getCurrentTier = () => {
    if (balance >= 100000) return TIERS.platinum;
    if (balance >= 10000) return TIERS.gold;
    if (balance >= 1000) return TIERS.silver;
    if (balance >= 300) return TIERS.bronze;
    return TIERS.none;
  };

  const currentTier = getCurrentTier();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Points Dashboard - Only show when wallet connected (or in test mode) */}
        {(TEST_MODE || (account && walletAddress)) && (
          <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-8 mb-6 md:mb-8">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner w-12 h-12" />
              </div>
            ) : (
              <>
                {/* Points Balance */}
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Your Points Balance</div>
                  <div className="flex items-center justify-center gap-4 md:gap-6">
                    <div className="text-5xl md:text-7xl font-black hero-text">
                      {displayPoints.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* Base Points and Total Multiplier badges */}
                    <div className="flex flex-row gap-3 md:gap-4">
                      {/* Base Points - color based on tier */}
                      {(() => {
                        const tierName = currentTier.name.toLowerCase();
                        let badgeGradient = 'bg-gray-600'; // none
                        if (tierName === 'platinum') {
                          badgeGradient = 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500';
                        } else if (tierName === 'gold') {
                          badgeGradient = 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500';
                        } else if (tierName === 'silver') {
                          badgeGradient = 'bg-gradient-to-br from-slate-300 via-slate-400 to-gray-500';
                        } else if (tierName === 'bronze') {
                          badgeGradient = 'bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-800';
                        }
                        return (
                          <div className="flex flex-col items-center">
                            <div className="text-[10px] md:text-xs font-bold text-white leading-tight">Base</div>
                            <div className="text-[10px] md:text-xs font-bold text-white mb-1 leading-tight">Points</div>
                            <div className={`${badgeGradient} px-3 md:px-4 py-1.5 md:py-2 rounded-lg`}>
                              <div className="text-sm md:text-base font-black text-gray-900">{currentTier.pointsPerHour}x</div>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Total Multiplier - color based on multiplier value */}
                      {(() => {
                        const totalMultiplier = lpData && lpData.lpMultiplier > 1 ? lpData.lpMultiplier : 1;
                        let badgeGradient = 'bg-gray-600'; // default for 1x
                        if (totalMultiplier >= 100) {
                          badgeGradient = 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500';
                        } else if (totalMultiplier >= 10) {
                          badgeGradient = 'bg-gradient-to-br from-slate-300 via-slate-400 to-gray-500';
                        } else if (totalMultiplier >= 3) {
                          badgeGradient = 'bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-800';
                        }
                        return (
                          <div className="flex flex-col items-center">
                            <div className="text-[10px] md:text-xs font-bold text-white leading-tight">Total</div>
                            <div className="text-[10px] md:text-xs font-bold text-white mb-1 leading-tight">multiplier</div>
                            <div className={`${badgeGradient} px-3 md:px-4 py-1.5 md:py-2 rounded-lg`}>
                              <div className="text-sm md:text-base font-black text-gray-900">{totalMultiplier}x</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Current Tier Display */}
                <div className="bg-gray-800/60 rounded-xl p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <TierIcon tier={currentTier.name.toLowerCase()} />
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Current Tier</div>
                        <div className="text-xl font-black text-white">{currentTier.name}</div>
                      </div>
                    </div>
                    <div className="sm:text-right w-full sm:w-auto">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Your Balance</div>
                      <div className="text-xl font-bold text-yellow-300">
                        {balance.toLocaleString()} $AMY
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* How You Earn Amy Points */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">📈</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              How You Earn Amy Points
            </h2>
          </div>

          <p className="text-sm md:text-xl text-yellow-300 leading-relaxed font-medium mb-3 md:mb-4">
            Amy Points are our way of rewarding behaviour — not gambling.
          </p>
          <p className="text-sm md:text-lg text-gray-300 mb-4">
            They&apos;re not a token and not something you trade. Amy Points are in-app points that sit on top of the Amy app and our partner ecosystem.
          </p>
          <p className="text-sm md:text-lg text-gray-300 mb-6">
            You start with a base earning rate by holding $AMY. Your tier determines how many Amy Points you earn per hour. You can then boost this with badges and activity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-900/40 to-amber-900/20 p-4 rounded-xl border-2 border-orange-500/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🟫</span>
                <div>
                  <span className="font-bold text-orange-400">Bronze</span>
                  <span className="text-gray-300 text-sm ml-2">– 300+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 1 Amy Point per hour</p>
            </div>

            <div className="bg-gradient-to-br from-slate-600/40 to-gray-700/20 p-4 rounded-xl border-2 border-slate-400/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥈</span>
                <div>
                  <span className="font-bold text-slate-300">Silver</span>
                  <span className="text-gray-300 text-sm ml-2">– 1,000+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 3 Amy Points per hour</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-700/40 to-amber-800/20 p-4 rounded-xl border-2 border-yellow-500/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥇</span>
                <div>
                  <span className="font-bold text-yellow-400">Gold</span>
                  <span className="text-gray-300 text-sm ml-2">– 10,000+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 5 Amy Points per hour</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-700/40 to-blue-800/20 p-4 rounded-xl border-2 border-cyan-400/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <div>
                  <span className="font-bold text-cyan-300">Platinum</span>
                  <span className="text-gray-300 text-sm ml-2">– 100,000+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 10 Amy Points per hour</p>
            </div>
          </div>

          <p className="text-sm md:text-base text-gray-400 italic">
            All tiers qualify for Weekly Focus participation.
          </p>
        </div>

        {/* Amy Multiplier Badges */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🏅</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Amy Multiplier Badges
            </h2>
          </div>

          <div className="bg-black/30 rounded-xl p-4 md:p-6 mb-6 max-w-2xl mx-auto">
            <p className="text-gray-200 text-sm md:text-base leading-relaxed mb-3">
              Multiplier Badges boost your Amy Points when you actively use partner strategies.
            </p>
            <ul className="text-gray-400 text-sm md:text-base space-y-1.5 mb-3 list-disc list-inside">
              <li>Each badge represents a specific action (like LPing or vaults)</li>
              <li>Only your highest unlocked badge per strategy applies</li>
            </ul>
            <p className="text-gray-400 text-sm md:text-base">
              Access these strategies from the{' '}
              <Link href="/app/earn" className="text-yellow-400 hover:text-yellow-300 font-semibold">
                Earn
              </Link>{' '}
              page.
            </p>
          </div>

          {/* Badge Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {/* 1. Bulla Exchange - AMY/HONEY */}
            <MultiplierBadge
              name="Bulla Exchange"
              title="AMY/HONEY"
              image="/bulla.jpg"
              description="Provide liquidity to the AMY / HONEY pool on Bulla Exchange."
              multipliers={[
                { requirement: '$10+ LP', multiplier: 'x3' },
                { requirement: '$100+ LP', multiplier: 'x10' },
                { requirement: '$500+ LP', multiplier: 'x100' },
              ]}
              isActive={lpData ? lpData.lpMultiplier > 1 : false}
              currentMultiplier={lpData && lpData.lpMultiplier > 1 ? `${lpData.lpMultiplier}x` : undefined}
              actionUrl="https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84"
              actionLabel="Add Liquidity"
            />

            {/* 2. Staked plsBERA */}
            <MultiplierBadge
              name="Staked"
              title="plsBERA"
              image="/plsbera.jpg"
              description="Rewarding users who stake plsBERA and support Berachain's economic security. This badge reflects active staking participation and may update over time as your position changes. Powered by Plutus."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
            />

            {/* 3. plvHEDGE */}
            <MultiplierBadge
              name="plvHEDGE"
              title="Vault"
              image="/plvhedge.jpg"
              description="Rewarding users who deploy capital into the plvHEDGE delta-neutral strategy. plvHEDGE is an automated vault with dynamic yield sourcing, designed to generate yield while managing market exposure across chains. Powered by Plutus."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
            />

            {/* 4. SAIL.r */}
            <MultiplierBadge
              name="SAIL.r"
              title="Royalty"
              image="/sail.jpg"
              description="Rewarding users who hold SAIL.r, a royalty token backed by real e-commerce revenue. SAIL.r represents a claim on revenue from e-commerce brands, with holders receiving monthly stablecoin distributions based on their share of tokens held. Powered by Liquid Royalty."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
              actionUrl="https://www.liquidroyalty.com/invest"
              actionLabel="View SAIL.r"
            />

            {/* 5. snrUSD */}
            <MultiplierBadge
              name="snrUSD"
              title="Senior"
              image="/snr.jpg"
              description="Rewarding users who hold or deploy capital into snrUSD, a senior tranche stable yield product. snrUSD is designed to maintain a stable $1 value while generating yield, backed by over-collateralisation and senior position within the strategy. Powered by Liquid Royalty."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
              actionUrl="https://www.liquidroyalty.com/vaults"
              actionLabel="View Vaults"
            />

            {/* 6. jnrUSD */}
            <MultiplierBadge
              name="jnrUSD"
              title="Junior"
              image="/jnr.jpg"
              description="Rewarding users who deploy capital into jnrUSD, the junior tranche designed to capture excess yield. jnrUSD sits below the senior tranche and is exposed to variable returns, offering higher potential yield in exchange for higher risk. Powered by Liquid Royalty."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
              actionUrl="https://www.liquidroyalty.com/vaults"
              actionLabel="View Vaults"
            />

            {/* 7. Amy × Kodiak Perps */}
            <MultiplierBadge
              name="Amy × Kodiak"
              title="Perps"
              image="/kodiak.jpg"
              description="Trade perpetuals on Kodiak through Amy in December 2025."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
            />

            {/* 8. Dawn Referral Season */}
            <MultiplierBadge
              name="Dawn Referral"
              title="Season"
              image="/ref.jpg"
              description="Invite new users to Amy during the Dawn referral season. Ends 12 January 2025."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'TBC' },
                { requirement: 'Level 2', multiplier: 'TBC' },
                { requirement: 'Level 3', multiplier: 'TBC' },
              ]}
              isActive={false}
            />

            {/* 9. Amy Onchain Conviction */}
            <MultiplierBadge
              name="Amy Onchain"
              title="Conviction"
              image="/convic.jpg"
              description="Rewarding users who actively deploy capital on Berachain. This badge reflects ongoing onchain activity and may change over time."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'x3' },
                { requirement: 'Level 2', multiplier: 'x5' },
                { requirement: 'Level 3', multiplier: 'x10' },
              ]}
              isActive={false}
            />

            {/* All other badges - Coming Soon */}
            {Array.from({ length: 20 }).map((_, index) => (
              <MultiplierBadge
                key={index}
                name=""
                title=""
                isActive={false}
                isPlaceholder={true}
              />
            ))}
          </div>
        </div>

        {/* What Points Can Be Used For */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🛒</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Spend Your Points On
            </h2>
          </div>

          <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">Over time, Points will be spendable on things like:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-pink-900/40 to-purple-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-pink-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🚀</div>
              <h4 className="text-base md:text-lg font-bold text-pink-400 mb-1 md:mb-2">Boosts</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Earn points faster for a period of time
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-purple-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎲</div>
              <h4 className="text-base md:text-lg font-bold text-purple-400 mb-1 md:mb-2">Games</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Raffles and prediction-style games
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-blue-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎯</div>
              <h4 className="text-base md:text-lg font-bold text-blue-400 mb-1 md:mb-2">Access</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Special campaigns or cosmetic upgrades
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-emerald-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎮</div>
              <h4 className="text-base md:text-lg font-bold text-emerald-400 mb-1 md:mb-2">Stay & Play</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Other fun features inside Amy
              </p>
            </div>
          </div>
        </div>

        {/* Buy Amy Points */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">💳</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Buy Amy Points
            </h2>
          </div>

      

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-pink-900/40 to-purple-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-pink-500/30 text-center">
              <div className="text-2xl md:text-3xl font-black text-pink-400 mb-1">$10</div>
              <div className="text-lg md:text-xl font-bold text-white">10,000</div>
              <div className="text-xs text-gray-400">Amy Points</div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-purple-500/30 text-center">
              <div className="text-2xl md:text-3xl font-black text-purple-400 mb-1">$30</div>
              <div className="text-lg md:text-xl font-bold text-white">50,000</div>
              <div className="text-xs text-gray-400">Amy Points</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-700/40 to-amber-800/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-yellow-500/30 text-center">
              <div className="text-2xl md:text-3xl font-black text-yellow-400 mb-1">$100</div>
              <div className="text-lg md:text-xl font-bold text-white">250,000</div>
              <div className="text-xs text-gray-400">Amy Points</div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center italic">
            Coming soon
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/"
            className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase inline-block"
          >
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
