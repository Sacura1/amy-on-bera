'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useAmyBalance } from '@/hooks';
import { API_BASE_URL } from '@/lib/constants';
import Link from 'next/link';
import PointsHistory from '@/components/PointsHistory';

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
  raidsharkMultiplier?: number;
  onchainConvictionMultiplier?: number;
  referralMultiplier?: number;
  swapperMultiplier?: number;
  // Dawn season (historical)
  dawnReferralCount?: number;
  dawnReferralMultiplier?: number;
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

interface TokenHolding {
  token: string;
  address: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
  multiplier: number;
  isActive: boolean;
}

interface TokenHoldingsData {
  sailr: TokenHolding;
  plvhedge: TokenHolding;
  plsbera: TokenHolding;
  honeybend: TokenHolding;
  stakedbera: TokenHolding;
  bgt: TokenHolding;
  snrusd: TokenHolding;
  jnrusd: TokenHolding;
}

const TIERS: Record<string, TierInfo> = {
  platinum: { minBalance: 100000, pointsPerHour: 10, name: 'Platinum', emoji: '💎' },
  gold: { minBalance: 10000, pointsPerHour: 5, name: 'Gold', emoji: '🥇' },
  silver: { minBalance: 1000, pointsPerHour: 3, name: 'Silver', emoji: '🥈' },
  bronze: { minBalance: 300, pointsPerHour: 1, name: 'Bronze', emoji: '🥉' },
  none: { minBalance: 0, pointsPerHour: 0, name: 'None', emoji: '⚪' }
};

// Onchain Conviction Badge - Now stored in database and fetched via API
// Level 3 = x10, Level 2 = x5, Level 1 = x3
// Admin can update via POST /api/admin/conviction/update or /api/admin/conviction/bulk

// RaidShark Badge - Now stored in database and fetched via API (updated monthly)
// Raid Legend (600+ pts) = x15, Raid Master (250+ pts) = x7, Raid Enthusiast (75+ pts) = x3
// Admin can update via POST /api/admin/raidshark/update or /api/admin/raidshark/bulk

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
const MOCK_TOKEN_DATA: TokenHoldingsData = {
  sailr: {
    token: 'SAIL.r',
    address: '0x59a61B8d3064A51a95a5D6393c03e2152b1a2770',
    balance: 250,
    priceUsd: 2.5,
    valueUsd: 625,
    multiplier: 10,
    isActive: true,
  },
  plvhedge: {
    token: 'plvHEDGE',
    address: '0x28602B1ae8cA0ff5CD01B96A36f88F72FeBE727A',
    balance: 50,
    priceUsd: 1.2,
    valueUsd: 60,
    multiplier: 3,
    isActive: true,
  },
  plsbera: {
    token: 'plsBERA',
    address: '0xe8bEB147a93BB757DB15e468FaBD119CA087EfAE',
    balance: 100,
    priceUsd: 5.0,
    valueUsd: 500,
    multiplier: 10,
    isActive: true,
  },
  honeybend: {
    token: 'HONEY-Bend',
    address: '0x30BbA9CD9Eb8c95824aa42Faa1Bb397b07545bc1',
    balance: 100,
    priceUsd: 1.0,
    valueUsd: 100,
    multiplier: 5,
    isActive: true,
  },
  stakedbera: {
    token: 'stBERA',
    address: '0x118D2cEeE9785eaf70C15Cd74CD84c9f8c3EeC9a',
    balance: 50,
    priceUsd: 5.0,
    valueUsd: 250,
    multiplier: 5,
    isActive: true,
  },
  bgt: {
    token: 'BGT',
    address: '0x656b95e550c07a9ffe548bd4085c72418ceb1dba',
    balance: 10,
    priceUsd: 0,
    valueUsd: 0,
    multiplier: 3,
    isActive: true,
  },
  snrusd: {
    token: 'snrUSD',
    address: '0x49298F4314eb127041b814A2616c25687Db6b650',
    balance: 500,
    priceUsd: 1.0,
    valueUsd: 500,
    multiplier: 10,
    isActive: true,
  },
  jnrusd: {
    token: 'jnrUSD',
    address: '0x3a0A97DcA5e6CaCC258490d5ece453412f8E1883',
    balance: 100,
    priceUsd: 1.0,
    valueUsd: 100,
    multiplier: 5,
    isActive: true,
  },
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
          // Extract number from multiplier string (e.g., "3x" -> 3, "100x" -> 100)
          const multiplierNum = parseInt(currentMultiplier.replace(/[^0-9]/g, ''), 10);

          // Color based on multiplier tier:
          // Level 1 (x3) = Bronze, Level 2 (x5) = Silver, Level 3 (x10+) = Gold
          let badgeColors = 'bg-amber-700 text-amber-200 border-amber-500'; // Level 1 - Bronze
          if (multiplierNum >= 10) {
            badgeColors = 'bg-yellow-500 text-yellow-950 border-yellow-300'; // Level 3 - Gold (10x, 50x, 100x)
          } else if (multiplierNum >= 5) {
            badgeColors = 'bg-slate-400 text-slate-900 border-slate-200'; // Level 2 - Silver (5x)
          }
          // else: Level 1 - Bronze (3x) - default

          return (
            <div className={`absolute -top-2 -left-2 text-xs font-black px-2 py-1 rounded-md z-10 shadow-lg border-2 ${badgeColors}`}>
              {currentMultiplier}
            </div>
          );
        })()}

        {/* Icon */}
        <div className="p-3 flex justify-center">
          <div className={`w-14 h-12 rounded-lg flex items-center justify-center overflow-hidden relative ${
            isActive ? 'bg-gray-800' : 'bg-gray-800/60'
          }`}>
            {image ? (
              <>
                <img src={image} alt={name} className={`w-full h-full object-cover ${!isActive && 'opacity-60'}`} />
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
              <div className="w-24 h-20 rounded-xl flex items-center justify-center overflow-hidden bg-gray-800 shadow-lg">
                {image ? (
                  <img src={image} alt={name} className="w-full h-full object-cover" />
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
  const [tokenData, setTokenData] = useState<TokenHoldingsData | null>(TEST_MODE ? MOCK_TOKEN_DATA : null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLp, setIsLoadingLp] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(TEST_MODE ? MOCK_POINTS_DATA.totalPoints : 0);
  const [xUsername, setXUsername] = useState<string | null>(null);

  // Quest/Social state
  const [xConnected, setXConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [questsExpanded, setQuestsExpanded] = useState(true);
  const [questsData, setQuestsData] = useState<{
    followAmyX: boolean;
    joinAmyDiscord: boolean;
    joinAmyTelegram: boolean;
    followAmyInstagram: boolean;
    connectX: boolean;
    connectDiscord: boolean;
    connectTelegram: boolean;
    questPointsEarned: number;
  }>({
    followAmyX: false,
    joinAmyDiscord: false,
    joinAmyTelegram: false,
    followAmyInstagram: false,
    connectX: false,
    connectDiscord: false,
    connectTelegram: false,
    questPointsEarned: 0,
  });
  const [completingQuest, setCompletingQuest] = useState<string | null>(null);

  // Calculate Onchain Conviction badge status from API
  const onchainConvictionMultiplier = pointsData?.onchainConvictionMultiplier || 0;
  const onchainConviction = onchainConvictionMultiplier > 0
    ? {
        level: onchainConvictionMultiplier >= 10 ? 3 : onchainConvictionMultiplier >= 5 ? 2 : 1,
        multiplier: onchainConvictionMultiplier
      }
    : null;

  // Calculate RaidShark badge status from API
  const raidsharkMultiplier = pointsData?.raidsharkMultiplier || 0;
  const raidsharkBadge = raidsharkMultiplier > 0
    ? {
        tier: raidsharkMultiplier >= 15 ? 'Raid Legend' : raidsharkMultiplier >= 7 ? 'Raid Master' : 'Raid Enthusiast',
        multiplier: raidsharkMultiplier
      }
    : null;

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

  // Fetch token holdings data (SAIL.r, plvHEDGE)
  const fetchTokenData = useCallback(async () => {
    if (!walletAddress || TEST_MODE) return;

    setIsLoadingTokens(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tokens/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        setTokenData(data.data);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [walletAddress]);

  // Fetch X username for RaidShark badge and connection status
  const fetchXUsername = useCallback(async () => {
    if (!walletAddress || TEST_MODE) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/status/${walletAddress}`);
      const data = await response.json();

      if (data.verified && data.data?.xUsername) {
        setXUsername(data.data.xUsername);
        setXConnected(true);
      }
    } catch (error) {
      console.error('Error fetching X username:', error);
    }
  }, [walletAddress]);

  // Fetch social connections and quests data
  const fetchSocialData = useCallback(async () => {
    if (!walletAddress || TEST_MODE) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/social/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        setDiscordConnected(!!data.data.discord || !!data.data.discordUsername);
        setTelegramConnected(!!data.data.telegram || !!data.data.telegramUsername);
      }
    } catch (error) {
      console.error('Error fetching social data:', error);
    }

    // Fetch quests data
    try {
      const response = await fetch(`${API_BASE_URL}/api/quests/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        setQuestsData({
          followAmyX: data.data.followAmyX || false,
          joinAmyDiscord: data.data.joinAmyDiscord || false,
          joinAmyTelegram: data.data.joinAmyTelegram || false,
          followAmyInstagram: data.data.followAmyInstagram || false,
          connectX: data.data.connectX || false,
          connectDiscord: data.data.connectDiscord || false,
          connectTelegram: data.data.connectTelegram || false,
          questPointsEarned: data.data.questPointsEarned || 0,
        });
      }
    } catch (error) {
      // Quests endpoint may not exist yet - that's okay
    }
  }, [walletAddress]);

  // Handle completing a community quest
  const handleCompleteQuest = async (questId: string, url: string) => {
    // Open the URL in new tab
    window.open(url, '_blank');

    // Start completion tracking
    setCompletingQuest(questId);

    // After 30 seconds, mark as complete (backend will verify)
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/quests/${walletAddress}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questId }),
        });
        const data = await response.json();

        if (data.success) {
          // Update local state immediately
          setQuestsData(prev => ({
            ...prev,
            [questId]: true
          }));
        }
        // Also refresh from server to ensure sync
        await fetchSocialData();
      } catch (error) {
        console.error('Error completing quest:', error);
      } finally {
        setCompletingQuest(null);
      }
    }, 30000); // 30 second delay
  };

  // Fetch points, LP data, token data, X username, and social data when wallet connects
  useEffect(() => {
    if (walletAddress) {
      fetchPointsData();
      fetchLpData();
      fetchTokenData();
      fetchXUsername();
      fetchSocialData();
    }
  }, [walletAddress, fetchPointsData, fetchLpData, fetchTokenData, fetchXUsername, fetchSocialData]);

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
                  {/* Desktop: side by side, Mobile: stacked */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                    <div className="text-5xl md:text-7xl font-black hero-text">
                      {displayPoints.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* Base Points, Total Multiplier, and Points Per Hour badges */}
                    <div className="flex flex-row items-end gap-2 md:gap-3">
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
                      {/* X symbol */}
                      <div className="flex items-center pb-1.5 md:pb-2">
                        <span className="text-white font-bold text-sm md:text-base">X</span>
                      </div>
                      {/* Total Multiplier - color based on multiplier value */}
                      {(() => {
                        // Calculate total multiplier from all badges (additive)
                        const lpMult = lpData && lpData.lpMultiplier > 1 ? lpData.lpMultiplier : 0;
                        const sailrMult = tokenData && tokenData.sailr?.multiplier > 1 ? tokenData.sailr.multiplier : 0;
                        const plvhedgeMult = tokenData && tokenData.plvhedge?.multiplier > 1 ? tokenData.plvhedge.multiplier : 0;
                        const plsberaMult = tokenData && tokenData.plsbera?.multiplier > 1 ? tokenData.plsbera.multiplier : 0;
                        const honeybendMult = tokenData && tokenData.honeybend?.multiplier > 1 ? tokenData.honeybend.multiplier : 0;
                        const stakedberaMult = tokenData && tokenData.stakedbera?.multiplier > 1 ? tokenData.stakedbera.multiplier : 0;
                        const bgtMult = tokenData && tokenData.bgt?.multiplier > 1 ? tokenData.bgt.multiplier : 0;
                        const snrusdMult = tokenData && tokenData.snrusd?.multiplier > 1 ? tokenData.snrusd.multiplier : 0;
                        const jnrusdMult = tokenData && tokenData.jnrusd?.multiplier > 1 ? tokenData.jnrusd.multiplier : 0;
                        const raidMult = pointsData?.raidsharkMultiplier && pointsData.raidsharkMultiplier > 0 ? pointsData.raidsharkMultiplier : 0;
                        const convMult = pointsData?.onchainConvictionMultiplier && pointsData.onchainConvictionMultiplier > 0 ? pointsData.onchainConvictionMultiplier : 0;
                        const refMult = pointsData?.referralMultiplier && pointsData.referralMultiplier > 0 ? pointsData.referralMultiplier : 0;
                        const swapMult = pointsData?.swapperMultiplier && pointsData.swapperMultiplier > 0 ? pointsData.swapperMultiplier : 0;
                        const totalMultiplier = Math.max(1, lpMult + sailrMult + plvhedgeMult + plsberaMult + honeybendMult + stakedberaMult + bgtMult + snrusdMult + jnrusdMult + raidMult + convMult + refMult + swapMult);

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
                      {/* = symbol */}
                      <div className="flex items-center pb-1.5 md:pb-2">
                        <span className="text-white font-bold text-sm md:text-base">=</span>
                      </div>
                      {/* Points Per Hour */}
                      {(() => {
                        // Calculate total multiplier from all badges (additive)
                        const lpMult = lpData && lpData.lpMultiplier > 1 ? lpData.lpMultiplier : 0;
                        const sailrMult = tokenData && tokenData.sailr?.multiplier > 1 ? tokenData.sailr.multiplier : 0;
                        const plvhedgeMult = tokenData && tokenData.plvhedge?.multiplier > 1 ? tokenData.plvhedge.multiplier : 0;
                        const plsberaMult = tokenData && tokenData.plsbera?.multiplier > 1 ? tokenData.plsbera.multiplier : 0;
                        const honeybendMult = tokenData && tokenData.honeybend?.multiplier > 1 ? tokenData.honeybend.multiplier : 0;
                        const stakedberaMult = tokenData && tokenData.stakedbera?.multiplier > 1 ? tokenData.stakedbera.multiplier : 0;
                        const bgtMult = tokenData && tokenData.bgt?.multiplier > 1 ? tokenData.bgt.multiplier : 0;
                        const snrusdMult = tokenData && tokenData.snrusd?.multiplier > 1 ? tokenData.snrusd.multiplier : 0;
                        const jnrusdMult = tokenData && tokenData.jnrusd?.multiplier > 1 ? tokenData.jnrusd.multiplier : 0;
                        const raidMult = pointsData?.raidsharkMultiplier && pointsData.raidsharkMultiplier > 0 ? pointsData.raidsharkMultiplier : 0;
                        const convMult = pointsData?.onchainConvictionMultiplier && pointsData.onchainConvictionMultiplier > 0 ? pointsData.onchainConvictionMultiplier : 0;
                        const refMult = pointsData?.referralMultiplier && pointsData.referralMultiplier > 0 ? pointsData.referralMultiplier : 0;
                        const swapMult = pointsData?.swapperMultiplier && pointsData.swapperMultiplier > 0 ? pointsData.swapperMultiplier : 0;
                        const totalMultiplier = Math.max(1, lpMult + sailrMult + plvhedgeMult + plsberaMult + honeybendMult + stakedberaMult + bgtMult + snrusdMult + jnrusdMult + raidMult + convMult + refMult + swapMult);
                        const pointsPerHour = currentTier.pointsPerHour * totalMultiplier;
                        return (
                          <div className="flex flex-col items-center">
                            <div className="text-[10px] md:text-xs font-bold text-white leading-tight">Points</div>
                            <div className="text-[10px] md:text-xs font-bold text-white mb-1 leading-tight">per hr</div>
                            <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg">
                              <div className="text-sm md:text-base font-black text-white">{pointsPerHour.toLocaleString()}</div>
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

        {/* Points History */}
        {(TEST_MODE || (account && walletAddress)) && (
          <PointsHistory walletAddress={walletAddress} />
        )}

        {/* How You Earn Amy Points */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
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
            <div className={`bg-gradient-to-br from-orange-900/40 to-amber-900/20 rounded-xl border-2 transition-all ${
              pointsData?.currentTier === 'bronze'
                ? 'border-orange-400 p-5 scale-[1.02] shadow-lg shadow-orange-500/20'
                : 'border-orange-500/30 p-4 opacity-60'
            }`}>
              <div className="flex items-center gap-2">
                <span className={pointsData?.currentTier === 'bronze' ? 'text-3xl' : 'text-2xl'}>🥉</span>
                <div>
                  <span className={`font-bold text-orange-400 ${pointsData?.currentTier === 'bronze' ? 'text-lg' : ''}`}>Bronze</span>
                  <span className="text-gray-300 text-sm ml-2">– 300+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 1 Amy Point per hour</p>
              {pointsData?.currentTier === 'bronze' && (
                <p className="text-orange-400 text-xs mt-2 font-semibold">✓ Your current tier</p>
              )}
            </div>

            <div className={`bg-gradient-to-br from-slate-600/40 to-gray-700/20 rounded-xl border-2 transition-all ${
              pointsData?.currentTier === 'silver'
                ? 'border-slate-300 p-5 scale-[1.02] shadow-lg shadow-slate-400/20'
                : 'border-slate-400/30 p-4 opacity-60'
            }`}>
              <div className="flex items-center gap-2">
                <span className={pointsData?.currentTier === 'silver' ? 'text-3xl' : 'text-2xl'}>🥈</span>
                <div>
                  <span className={`font-bold text-slate-300 ${pointsData?.currentTier === 'silver' ? 'text-lg' : ''}`}>Silver</span>
                  <span className="text-gray-300 text-sm ml-2">– 1,000+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 3 Amy Points per hour</p>
              {pointsData?.currentTier === 'silver' && (
                <p className="text-slate-300 text-xs mt-2 font-semibold">✓ Your current tier</p>
              )}
            </div>

            <div className={`bg-gradient-to-br from-yellow-700/40 to-amber-800/20 rounded-xl border-2 transition-all ${
              pointsData?.currentTier === 'gold'
                ? 'border-yellow-400 p-5 scale-[1.02] shadow-lg shadow-yellow-500/20'
                : 'border-yellow-500/30 p-4 opacity-60'
            }`}>
              <div className="flex items-center gap-2">
                <span className={pointsData?.currentTier === 'gold' ? 'text-3xl' : 'text-2xl'}>🥇</span>
                <div>
                  <span className={`font-bold text-yellow-400 ${pointsData?.currentTier === 'gold' ? 'text-lg' : ''}`}>Gold</span>
                  <span className="text-gray-300 text-sm ml-2">– 10,000+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 5 Amy Points per hour</p>
              {pointsData?.currentTier === 'gold' && (
                <p className="text-yellow-400 text-xs mt-2 font-semibold">✓ Your current tier</p>
              )}
            </div>

            <div className={`bg-gradient-to-br from-cyan-700/40 to-blue-800/20 rounded-xl border-2 transition-all ${
              pointsData?.currentTier === 'platinum'
                ? 'border-cyan-400 p-5 scale-[1.02] shadow-lg shadow-cyan-400/20'
                : 'border-cyan-400/30 p-4 opacity-60'
            }`}>
              <div className="flex items-center gap-2">
                <span className={pointsData?.currentTier === 'platinum' ? 'text-3xl' : 'text-2xl'}>💎</span>
                <div>
                  <span className={`font-bold text-cyan-300 ${pointsData?.currentTier === 'platinum' ? 'text-lg' : ''}`}>Platinum</span>
                  <span className="text-gray-300 text-sm ml-2">– 100,000+ AMY</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">→ 10 Amy Points per hour</p>
              {pointsData?.currentTier === 'platinum' && (
                <p className="text-cyan-400 text-xs mt-2 font-semibold">✓ Your current tier</p>
              )}
            </div>
          </div>

          <p className="text-sm md:text-base text-gray-400 italic">
            All tiers qualify for Weekly Focus participation.
          </p>
        </div>

        {/* Amy Multiplier Badges */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
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
                { requirement: '$10+ LP', multiplier: 'x5' },
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
                { requirement: '$10+ staked', multiplier: 'x3' },
                { requirement: '$100+ staked', multiplier: 'x5' },
                { requirement: '$500+ staked', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.plsbera?.isActive : false}
              currentMultiplier={tokenData && tokenData.plsbera?.multiplier > 1 ? `${tokenData.plsbera.multiplier}x` : undefined}
              actionUrl="https://plutus.fi/Assets/a/plsBERA/tab/convert"
              actionLabel="Stake plsBERA"
            />

            {/* 3. plvHEDGE */}
            <MultiplierBadge
              name="plvHEDGE"
              title="Vault"
              image="/plvhedge.jpg"
              description="Rewarding users who deploy capital into the plvHEDGE delta-neutral strategy. plvHEDGE is an automated vault with dynamic yield sourcing, designed to generate yield while managing market exposure across chains. Powered by Plutus."
              multipliers={[
                { requirement: '$10+ holdings', multiplier: 'x3' },
                { requirement: '$100+ holdings', multiplier: 'x5' },
                { requirement: '$500+ holdings', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.plvhedge.isActive : false}
              currentMultiplier={tokenData && tokenData.plvhedge.multiplier > 1 ? `${tokenData.plvhedge.multiplier}x` : undefined}
              actionUrl="https://plutus.fi"
              actionLabel="View plvHEDGE"
            />

            {/* 4. SAIL.r */}
            <MultiplierBadge
              name="SAIL.r"
              title="Royalty"
              image="/sail.jpg"
              description="Rewarding users who hold SAIL.r, a royalty token backed by real e-commerce revenue. SAIL.r represents a claim on revenue from e-commerce brands, with holders receiving monthly stablecoin distributions based on their share of tokens held. Powered by Liquid Royalty."
              multipliers={[
                { requirement: '$10+ holdings', multiplier: 'x3' },
                { requirement: '$100+ holdings', multiplier: 'x5' },
                { requirement: '$500+ holdings', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.sailr.isActive : false}
              currentMultiplier={tokenData && tokenData.sailr.multiplier > 1 ? `${tokenData.sailr.multiplier}x` : undefined}
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
                { requirement: '$10+ holdings', multiplier: 'x3' },
                { requirement: '$100+ holdings', multiplier: 'x5' },
                { requirement: '$500+ holdings', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.snrusd?.isActive : false}
              currentMultiplier={tokenData && tokenData.snrusd?.multiplier > 1 ? `${tokenData.snrusd.multiplier}x` : undefined}
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
                { requirement: '$10+ holdings', multiplier: 'x3' },
                { requirement: '$100+ holdings', multiplier: 'x5' },
                { requirement: '$500+ holdings', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.jnrusd?.isActive : false}
              currentMultiplier={tokenData && tokenData.jnrusd?.multiplier > 1 ? `${tokenData.jnrusd.multiplier}x` : undefined}
              actionUrl="https://www.liquidroyalty.com/vaults"
              actionLabel="View Vaults"
            />

            {/* 7. HONEY Bend */}
            <MultiplierBadge
              name="HONEY"
              title="Bend"
              image="/honey.jpg"
              description="Rewarding users who lend HONEY on Bend. HONEY-Bend represents your lending position, earning interest while supporting the Berachain lending ecosystem. Powered by Bend."
              multipliers={[
                { requirement: '$10+ deposited', multiplier: 'x3' },
                { requirement: '$100+ deposited', multiplier: 'x5' },
                { requirement: '$500+ deposited', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.honeybend?.isActive : false}
              currentMultiplier={tokenData && tokenData.honeybend?.multiplier > 1 ? `${tokenData.honeybend.multiplier}x` : undefined}
              actionUrl="https://bend.berachain.com/"
              actionLabel="Lend HONEY"
            />

            {/* 8. Staked BERA */}
            <MultiplierBadge
              name="Staked"
              title="BERA"
              image="/BERA.png"
              description="Rewarding users who stake BERA for stBERA. Staked BERA secures the network while earning staking rewards. This badge tracks your liquid staking position."
              multipliers={[
                { requirement: '$10+ staked', multiplier: 'x3' },
                { requirement: '$100+ staked', multiplier: 'x5' },
                { requirement: '$500+ staked', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.stakedbera?.isActive : false}
              currentMultiplier={tokenData && tokenData.stakedbera?.multiplier > 1 ? `${tokenData.stakedbera.multiplier}x` : undefined}
              actionUrl="https://stake.berachain.com/"
              actionLabel="Stake BERA"
            />

            {/* 9. BGT */}
            <MultiplierBadge
              name="BGT"
              title="Holder"
              image="/bgt.jpg"
              description="Rewarding users who hold BGT (Bera Governance Token). BGT is earned through providing liquidity and participating in Berachain's Proof of Liquidity consensus. This badge tracks your BGT holdings regardless of USD value."
              multipliers={[
                { requirement: '0.01+ BGT', multiplier: 'x3' },
                { requirement: '0.1+ BGT', multiplier: 'x5' },
                { requirement: '1+ BGT', multiplier: 'x10' },
              ]}
              isActive={tokenData ? tokenData.bgt?.isActive : false}
              currentMultiplier={tokenData && tokenData.bgt?.multiplier > 1 ? `${tokenData.bgt.multiplier}x` : undefined}
              actionUrl="https://bartio.station.berachain.com/"
              actionLabel="Get BGT"
            />

            {/* 10. Amy × Kodiak Perps */}
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

            {/* 8. Dawn Referral Season (Historical - no longer gives active bonus) */}
            <MultiplierBadge
              name="Dawn Referral"
              title="(Ended)"
              image="/ref.jpg"
              description="Season 1 referral badge. This season has ended - the badge is preserved but no longer gives an active multiplier bonus."
              multipliers={[
                { requirement: '1 referral', multiplier: 'x3' },
                { requirement: '2 referrals', multiplier: 'x5' },
                { requirement: '3+ referrals', multiplier: 'x10' },
              ]}
              isActive={(pointsData?.dawnReferralMultiplier || 0) > 0}
              currentMultiplier={(pointsData?.dawnReferralMultiplier || 0) > 0 ? `x${pointsData?.dawnReferralMultiplier} (ended)` : undefined}
            />

            {/* 8b. Season 2 Referral (Active) */}
            <MultiplierBadge
              name="Season 2"
              title="Referral"
              image="/ref.jpg"
              description="Invite new users to Amy and earn multipliers! Referrals count when your invitees hold 300+ $AMY. This is the active referral season."
              multipliers={[
                { requirement: '1 referral', multiplier: 'x3' },
                { requirement: '2 referrals', multiplier: 'x5' },
                { requirement: '3+ referrals', multiplier: 'x10' },
              ]}
              isActive={(pointsData?.referralMultiplier || 0) > 0}
              currentMultiplier={(pointsData?.referralMultiplier || 0) > 0 ? `x${pointsData?.referralMultiplier}` : undefined}
            />

            {/* 9. Amy Onchain Conviction */}
            <MultiplierBadge
              name="Amy Onchain"
              title="Conviction"
              image="/convic.jpg"
              description="Rewarding users who actively deploy capital on Berachain. This badge reflects ongoing onchain activity and applies a points multiplier."
              multipliers={[
                { requirement: 'Level 1', multiplier: 'x3' },
                { requirement: 'Level 2', multiplier: 'x5' },
                { requirement: 'Level 3', multiplier: 'x10' },
              ]}
              isActive={!!onchainConviction}
              currentMultiplier={onchainConviction ? `${onchainConviction.multiplier}x` : undefined}
            />

            {/* 10. RaidShark Bot */}
            <MultiplierBadge
              name="RaidShark"
              title="Bot"
              image="/shark.jpg"
              description="Rewarding users who actively raid and promote Amy across X (Twitter). This badge reflects monthly raid participation and grants ongoing point multipliers to top raiders."
              multipliers={[
                { requirement: 'Raid Enthusiast (75+ pts)', multiplier: 'x3' },
                { requirement: 'Raid Master (250+ pts)', multiplier: 'x7' },
                { requirement: 'Raid Legend (600+ pts)', multiplier: 'x15' },
              ]}
              isActive={!!raidsharkBadge}
              currentMultiplier={raidsharkBadge ? `${raidsharkBadge.multiplier}x` : undefined}
            />

            {/* 11. Seasoned Swapper */}
            <MultiplierBadge
              name="Seasoned"
              title="Swapper"
              image="/swapper.jpg"
              description="Rewarding users who actively swap through Amy's interface. This monthly badge recognizes your swap volume and applies ongoing point multipliers to your rewards."
              multipliers={[
                { requirement: 'Engaged ($250+)', multiplier: 'x3' },
                { requirement: 'Committed ($1,000+)', multiplier: 'x5' },
                { requirement: 'Elite ($3,000+)', multiplier: 'x10' },
              ]}
              isActive={(pointsData?.swapperMultiplier || 0) > 0}
              currentMultiplier={(pointsData?.swapperMultiplier || 0) > 0 ? `x${pointsData?.swapperMultiplier}` : undefined}
            />

            {/* All other badges - Coming Soon */}
            {Array.from({ length: 4 }).map((_, index) => (
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

        {/* Amy Quests Section */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden mb-6 md:mb-8">
          {/* Header - Collapsible */}
          <button
            onClick={() => setQuestsExpanded(!questsExpanded)}
            className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div>
              <h2 className="text-xl md:text-2xl font-black text-yellow-400 text-left">
                Amy Quests
              </h2>
              <p className="text-sm text-gray-300 text-left">
                Connect with the community and earn 900 bonus points
              </p>
              <p className="text-xs text-gray-500 text-left">
                All users can participate!
              </p>
            </div>
            <svg
              className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ${questsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {questsExpanded && (
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              {/* Quest Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {/* Connection Quests (100 pts each) */}
                {/* Connect X */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.connectX
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.connectX ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.connectX ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Connect X</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">100 pts</p>
                    {questsData.connectX ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : (
                      <a
                        href="/app/profile"
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>

                {/* Connect Discord */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.connectDiscord
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.connectDiscord ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.connectDiscord ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Connect Discord</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">100 pts</p>
                    {questsData.connectDiscord ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : (
                      <a
                        href="/app/profile"
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>

                {/* Connect Telegram */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.connectTelegram
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.connectTelegram ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.connectTelegram ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Connect Telegram</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">100 pts</p>
                    {questsData.connectTelegram ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : (
                      <a
                        href="/app/profile"
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>

                {/* Community Quests (150 pts each) */}
                {/* Follow Amy on X */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.followAmyX
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.followAmyX ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.followAmyX ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Follow Amy on X</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">150 pts</p>
                    {questsData.followAmyX ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : completingQuest === 'followAmyX' ? (
                      <span className="text-[10px] text-yellow-400">Verifying...</span>
                    ) : (
                      <button
                        onClick={() => handleCompleteQuest('followAmyX', 'https://x.com/amy_on_bera')}
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Join Amy Discord */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.joinAmyDiscord
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.joinAmyDiscord ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.joinAmyDiscord ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Join Amy Discord</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">150 pts</p>
                    {questsData.joinAmyDiscord ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : completingQuest === 'joinAmyDiscord' ? (
                      <span className="text-[10px] text-yellow-400">Verifying...</span>
                    ) : (
                      <button
                        onClick={() => handleCompleteQuest('joinAmyDiscord', 'https://discord.gg/9Y3UzP93r3')}
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Join Amy Telegram */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.joinAmyTelegram
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.joinAmyTelegram ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.joinAmyTelegram ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Join Amy Telegram</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">150 pts</p>
                    {questsData.joinAmyTelegram ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : completingQuest === 'joinAmyTelegram' ? (
                      <span className="text-[10px] text-yellow-400">Verifying...</span>
                    ) : (
                      <button
                        onClick={() => handleCompleteQuest('joinAmyTelegram', 'https://t.me/amy_on_bera')}
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Follow Amy on Instagram */}
                <div className={`rounded-xl border p-3 transition-all ${
                  questsData.followAmyInstagram
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      questsData.followAmyInstagram ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <svg className={`w-5 h-5 ${questsData.followAmyInstagram ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Follow on Instagram</p>
                    <p className="text-[10px] text-yellow-400 font-bold mb-2">150 pts</p>
                    {questsData.followAmyInstagram ? (
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </div>
                    ) : completingQuest === 'followAmyInstagram' ? (
                      <span className="text-[10px] text-yellow-400">Verifying...</span>
                    ) : (
                      <button
                        onClick={() => handleCompleteQuest('followAmyInstagram', 'https://www.instagram.com/amyonbera/')}
                        className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Coming Soon placeholders */}
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-gray-800/50 bg-gray-900/30 p-3 opacity-40">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center mb-2">
                        <div className="w-5 h-5 rounded bg-gray-700/50" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Coming Soon</p>
                      <p className="text-[10px] text-gray-700 mb-2">---</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Points Earned */}
              <div className="mt-4 pt-4 border-t border-gray-700/50 text-center">
                <span className="text-lg font-bold text-yellow-400">
                  {(questsData.connectX ? 100 : 0) + (questsData.connectDiscord ? 100 : 0) + (questsData.connectTelegram ? 100 : 0) +
                   (questsData.followAmyX ? 150 : 0) + (questsData.joinAmyDiscord ? 150 : 0) + (questsData.joinAmyTelegram ? 150 : 0) + (questsData.followAmyInstagram ? 150 : 0)} pts
                </span>
                <span className="text-gray-400 text-sm ml-2">Earned so far</span>
              </div>
            </div>
          )}
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
