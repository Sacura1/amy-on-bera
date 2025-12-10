'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, MINIMUM_AMY_BALANCE } from '@/lib/constants';

interface LeaderboardEntry {
  position: number;
  xUsername: string;
}

interface HolderEntry {
  wallet: string;
  xUsername: string;
  amyBalance: number;
}

interface EnrichedEntry {
  xUsername: string;
  walletAddress?: string;
  amyBalance?: number;
  verified: boolean;
  eligible: boolean;
  originalRank?: number;
  isFromLeaderboard: boolean;
}

export default function LeaderboardPage() {
  const [displayEntries, setDisplayEntries] = useState<EnrichedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // Fetch leaderboard data
      const leaderboardResponse = await fetch(`${API_BASE_URL}/api/leaderboard`);
      const leaderboardResult = await leaderboardResponse.json();

      if (!leaderboardResult.success) {
        throw new Error('Failed to fetch leaderboard');
      }

      const leaderboardData = leaderboardResult.data;
      setLastUpdated(leaderboardData.lastUpdated || '');

      // For each X username in the leaderboard, check if they've verified on the website
      const enrichedLeaderboard: EnrichedEntry[] = await Promise.all(
        (leaderboardData.leaderboard || []).map(async (entry: LeaderboardEntry) => {
          try {
            // Fetch user data from backend by X username
            const userResponse = await fetch(`${API_BASE_URL}/api/user/${entry.xUsername}`);
            const userData = await userResponse.json();

            if (userData.success && userData.verified && userData.data) {
              // User has verified their wallet + X on the website
              return {
                xUsername: entry.xUsername,
                walletAddress: userData.data.walletAddress,
                amyBalance: userData.data.amyBalance,
                verified: true,
                eligible: userData.data.amyBalance >= MINIMUM_AMY_BALANCE,
                originalRank: entry.position,
                isFromLeaderboard: true
              };
            } else {
              // User is on leaderboard but hasn't verified on the website
              return {
                xUsername: entry.xUsername,
                verified: false,
                eligible: false,
                originalRank: entry.position,
                isFromLeaderboard: true
              };
            }
          } catch {
            return {
              xUsername: entry.xUsername,
              verified: false,
              eligible: false,
              originalRank: entry.position,
              isFromLeaderboard: true
            };
          }
        })
      );

      // Get eligible users from leaderboard (verified AND have 300+ AMY)
      const eligibleLeaderboardUsers = enrichedLeaderboard.filter(user => user.verified && user.eligible);

      // Get usernames of users already on leaderboard (for filtering token holders)
      const leaderboardUsernames = (leaderboardData.leaderboard || []).map(
        (entry: LeaderboardEntry) => entry.xUsername.toLowerCase()
      );

      // Fetch token holders
      let tokenHoldersToAppend: EnrichedEntry[] = [];
      try {
        const holdersResponse = await fetch(`${API_BASE_URL}/api/holders`);
        const holdersResult = await holdersResponse.json();

        if (holdersResult.success && holdersResult.holders) {
          // Filter out users already on leaderboard and sort by AMY balance (descending)
          tokenHoldersToAppend = holdersResult.holders
            .filter((holder: HolderEntry) => !leaderboardUsernames.includes(holder.xUsername.toLowerCase()))
            .sort((a: HolderEntry, b: HolderEntry) => b.amyBalance - a.amyBalance)
            .map((holder: HolderEntry) => ({
              xUsername: holder.xUsername,
              walletAddress: holder.wallet,
              amyBalance: holder.amyBalance,
              eligible: true,
              verified: true,
              isFromLeaderboard: false
            }));
        }
      } catch (err) {
        console.error('Error fetching token holders for merge:', err);
      }

      // Sort eligible leaderboard users by their original rank position
      eligibleLeaderboardUsers.sort((a, b) => {
        const rankA = a.originalRank || 999999;
        const rankB = b.originalRank || 999999;
        return rankA - rankB;
      });

      // Combine: first leaderboard users, then token holders
      const combinedEntries = [...eligibleLeaderboardUsers, ...tokenHoldersToAppend];
      setDisplayEntries(combinedEntries);

    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionBadgeClass = (position: number) => {
    if (position === 1) return 'position-badge position-1';
    if (position === 2) return 'position-badge position-2';
    if (position === 3) return 'position-badge position-3';
    return 'position-badge';
  };

  const formatLastUpdated = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl md:text-6xl trophy-bounce">🏆</span>
            <h2 className="text-4xl md:text-6xl font-black hero-text">
              Leaderboard
            </h2>
            <span className="text-4xl md:text-6xl trophy-bounce" style={{ animationDelay: '0.5s' }}>🏆</span>
          </div>
        </div>

        {/* Information Box */}
        <div className="info-box p-4 md:p-8 mb-6 md:mb-8">
          <div className="space-y-3 md:space-y-4 text-yellow-300">
            <p className="text-sm md:text-base leading-relaxed">
              This page shows the supporters who are currently eligible for Amy rewards.
            </p>
            <p className="text-sm md:text-base leading-relaxed">
              We will use this leaderboard to decide the winners in the weekly yapping campaign.
            </p>
            <p className="text-sm md:text-base font-semibold">
              To appear here, you&apos;ll need to:
            </p>
            <ul className="space-y-2 text-sm md:text-base pl-4">
              <li className="flex items-start">
                <span className="mr-2">-</span>
                <span>Connect your wallet and X account on the Amy site</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">-</span>
                <span>Hold 300+ $AMY</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">-</span>
                <span>Stay active in Amy campaigns (like weekly yapping)</span>
              </li>
            </ul>
            <p className="text-sm md:text-base leading-relaxed">
              We use anti-gamification checks so you can&apos;t just buy 300 $AMY for a single day and qualify – you&apos;ll generally need to hold for most of the week.
            </p>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div className="glass-card overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-4 md:p-5 border-b-2 border-yellow-400/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="icon-badge-small">📊</div>
                <h3 className="text-lg md:text-xl font-black text-yellow-300">Top Performers</h3>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">🔄</span>
                  <span className="text-xs md:text-sm text-yellow-400 font-semibold">
                    {formatLastUpdated(lastUpdated)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table Header (Desktop) */}
          <div className="hidden md:block px-6 py-4 bg-black/30 border-b border-yellow-400/20">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Eligible Users (300+ AMY + X Connected)
            </p>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="loading-spinner mx-auto mb-4" />
                <p className="text-gray-400 font-semibold">Loading leaderboard...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="text-gray-400">{error}</p>
                <p className="text-sm text-gray-500 mt-2">Please try again later</p>
              </div>
            ) : displayEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😢</div>
                <p className="text-xl md:text-2xl font-bold text-gray-300 mb-2">No eligible users yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Connect your wallet and X account to be the first on the leaderboard! 🚀
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {displayEntries.map((entry, index) => {
                  const displayPosition = index + 1;
                  return (
                    <div
                      key={`${entry.xUsername}-${index}`}
                      className="leaderboard-row"
                      style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={getPositionBadgeClass(displayPosition)}>
                          {displayPosition}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={`https://x.com/${entry.xUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base md:text-lg font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            @{entry.xUsername}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
