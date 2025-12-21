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
}

const TIERS: Record<string, TierInfo> = {
  platinum: { minBalance: 100000, pointsPerHour: 10, name: 'Platinum', emoji: '💎' },
  gold: { minBalance: 10000, pointsPerHour: 5, name: 'Gold', emoji: '🥇' },
  silver: { minBalance: 1000, pointsPerHour: 3, name: 'Silver', emoji: '🥈' },
  bronze: { minBalance: 300, pointsPerHour: 1, name: 'Bronze', emoji: '🟫' },
  none: { minBalance: 0, pointsPerHour: 0, name: 'None', emoji: '⚪' }
};

// Bulla Logo Component
const BullaLogo = ({ isActive }: { isActive: boolean }) => (
  <svg viewBox="0 0 100 80" className={`w-16 h-12 md:w-20 md:h-16 ${isActive ? 'text-green-500' : 'text-green-800'}`} fill="currentColor">
    <path d="M50 35 C50 35 20 10 10 40 C5 55 15 65 25 60 C30 57 35 50 40 45 L50 55 L60 45 C65 50 70 57 75 60 C85 65 95 55 90 40 C80 10 50 35 50 35 Z" />
    <circle cx="50" cy="60" r="10" />
  </svg>
);

// Multiplier Badge Component
interface MultiplierTier {
  requirement: string;
  multiplier: string;
}

interface BadgeProps {
  name: string;
  strategy: string;
  description?: string;
  multipliers?: MultiplierTier[];
  currentMultiplier?: string;
  isActive: boolean;
  isPlaceholder?: boolean;
}

const MultiplierBadge = ({ name, strategy, description, multipliers, currentMultiplier, isActive, isPlaceholder }: BadgeProps) => {
  // Placeholder badge (compact)
  if (isPlaceholder) {
    return (
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        {/* Placeholder image area */}
        <div className="p-2 flex justify-center">
          <div className="w-16 h-10 rounded-md bg-gray-800/80 flex items-center justify-center">
            <div className="w-8 h-6 rounded bg-gray-700/50" />
          </div>
        </div>
        {/* Coming Soon text */}
        <div className="bg-gray-900/50 px-2 py-1.5">
          <p className="text-[10px] font-medium text-yellow-500/70 text-center">Coming Soon</p>
        </div>
      </div>
    );
  }

  // Main badge card
  return (
    <div className={`relative rounded-2xl overflow-hidden border ${isActive ? 'border-yellow-500' : 'border-gray-700'}`}>
      {/* Corner ribbon */}
      <div className="absolute top-0 right-0 w-10 h-10 overflow-hidden z-10">
        <div className={`absolute top-1.5 -right-5 w-16 text-center transform rotate-45 text-[10px] font-bold py-0.5 ${isActive ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-400'}`}>
          {isActive && currentMultiplier ? currentMultiplier : ''}
        </div>
      </div>

      {/* Logo area */}
      <div className="p-3 pb-1 flex justify-center">
        <div className={`rounded-lg p-2 ${isActive ? 'bg-white' : 'bg-gray-700/50'}`}>
          <BullaLogo isActive={isActive} />
        </div>
      </div>

      {/* Content area */}
      <div className="bg-gray-900/80 p-3 pt-2">
        {/* Title */}
        <h3 className={`text-xs font-bold mb-1 ${isActive ? 'text-yellow-400' : 'text-gray-300'}`}>
          <span className="font-black">{name}</span> – {strategy}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-[10px] text-gray-400 mb-2 leading-tight">{description}</p>
        )}

        {/* Multipliers list */}
        {multipliers && multipliers.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">Multipliers:</div>
            <div className="space-y-0.5">
              {multipliers.map((tier, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-600'}`} />
                  <span className={isActive ? 'text-gray-200' : 'text-gray-500'}>
                    {tier.requirement} → <span className={isActive ? 'text-yellow-400 font-semibold' : 'text-gray-500'}>{tier.multiplier}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[9px] text-gray-500 italic">
          Only the highest unlocked multiplier applies.
        </p>
      </div>
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
  const { balance, walletAddress } = useAmyBalance();

  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);

  // Fetch points data
  const fetchPointsData = useCallback(async () => {
    if (!walletAddress) return;

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

  // Fetch points when wallet connects
  useEffect(() => {
    if (walletAddress) {
      fetchPointsData();
    }
  }, [walletAddress, fetchPointsData]);

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
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="text-4xl md:text-7xl mb-3 md:mb-4">⭐</div>
          <h1 className="text-3xl md:text-6xl font-black mb-3 md:mb-4 text-shadow-strong" style={{ color: '#FF1493' }}>
            Amy Points
          </h1>
        </div>

        {/* Points Dashboard - Only show when wallet connected */}
        {account && walletAddress && (
          <div className="glass-card p-6 md:p-8 mb-6 md:mb-8">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner w-12 h-12" />
              </div>
            ) : (
              <>
                {/* Points Balance */}
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Your Points Balance</div>
                  <div className="text-5xl md:text-7xl font-black hero-text">
                    {displayPoints.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Current Tier Display */}
                <div className="bg-black/40 rounded-2xl p-4 md:p-6 border-2 border-yellow-400/30">
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

        {/* Main Intro */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <p className="text-sm md:text-xl text-yellow-300 leading-relaxed font-medium mb-3 md:mb-4">
            Amy Points are our way of rewarding behaviour, not gambling.
          </p>
          <p className="text-sm md:text-lg text-gray-300">
            They are not a token and not something you trade – they&apos;re a points system that sits on top of the app and our partner ecosystem.
          </p>
        </div>

        {/* Amy Multiplier Badges */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
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

          {/* Main Strategy Badge - full width on mobile */}
          <div className="max-w-xs mb-3 md:mb-4">
            <MultiplierBadge
              name="Bulla"
              strategy="AMY / HONEY LP"
              description="Provide liquidity to the AMY / HONEY pool on Bulla Exchange."
              multipliers={[
                { requirement: '$10+ LP', multiplier: 'x3' },
                { requirement: '$100+ LP', multiplier: 'x10' },
                { requirement: '$500+ LP', multiplier: 'x100' },
              ]}
              currentMultiplier="x3"
              isActive={true}
            />
          </div>

          {/* Placeholder badges - separate grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 19 }).map((_, index) => (
              <MultiplierBadge
                key={index}
                name=""
                strategy=""
                isActive={false}
                isPlaceholder={true}
              />
            ))}
          </div>
        </div>

        {/* What Points Can Be Used For */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
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

        {/* Angels Info */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8" style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.05))', borderColor: '#FFD700' }}>
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="text-3xl md:text-5xl">👼</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Angels Get More
            </h2>
          </div>

          <p className="text-yellow-300 text-sm md:text-lg">
            <strong>Angels</strong> (people who hold $AMY) will have extra ways to earn and use Amy Points, but everyone can start building a balance.
          </p>
        </div>

        {/* Current Status */}
        <div className="info-box p-4 md:p-10">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">📊</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Current Status
            </h2>
          </div>

          <p className="text-gray-400 text-sm md:text-lg">
            Full Amy Points hub is still rolling out – right now we use it mainly for <span className="text-yellow-300 font-semibold">leaderboards</span> and <span className="text-yellow-300 font-semibold">Focus rewards</span> – but this will become a core part of the app as we move toward the full money experience.
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
