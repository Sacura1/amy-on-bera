'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, MINIMUM_AMY_BALANCE } from '@/lib/constants';

interface LeaderboardEntry {
  position: number;
  xUsername: string;
  mindshare?: number;
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
  profileImage?: string;
  mindshareScore?: number;
}

// Get tier based on AMY balance
const getTierFromBalance = (balance: number): { name: string; ringColor: string } => {
  if (balance >= 100000) {
    return { name: 'platinum', ringColor: 'ring-cyan-400' };
  } else if (balance >= 10000) {
    return { name: 'gold', ringColor: 'ring-yellow-400' };
  } else if (balance >= 1000) {
    return { name: 'silver', ringColor: 'ring-slate-400' };
  } else if (balance >= 300) {
    return { name: 'bronze', ringColor: 'ring-orange-500' };
  }
  return { name: 'none', ringColor: 'ring-gray-600' };
};

// Profile picture with tier ring component
const TierRingAvatar = ({
  xUsername,
  amyBalance = 0,
  profileImage,
  size = 'md'
}: {
  xUsername: string;
  amyBalance?: number;
  profileImage?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const tier = getTierFromBalance(amyBalance);
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-14 h-14'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ring-2 ${tier.ringColor} overflow-hidden flex-shrink-0 bg-gray-700`}>
      {profileImage ? (
        <img
          src={profileImage}
          alt={xUsername}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
          {xUsername.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

interface PointsEntry {
  wallet: string;
  xUsername: string;
  totalPoints: number;
  currentTier: string;
  displayName?: string;
  bio?: string;
  amyBalance?: number;
  profileImage?: string;
}

type TabType = 'weekly' | 'points';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [displayEntries, setDisplayEntries] = useState<EnrichedEntry[]>([]);
  const [pointsEntries, setPointsEntries] = useState<PointsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPointsLoading, setIsPointsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'points' && pointsEntries.length === 0) {
      loadPointsLeaderboard();
    }
  }, [activeTab, pointsEntries.length]);

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
      // Process in batches of 20 to avoid overwhelming the dev proxy
      const entries = leaderboardData.leaderboard || [];
      const batchSize = 20;
      const enrichedLeaderboard: EnrichedEntry[] = [];

      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (entry: LeaderboardEntry) => {
            try {
              // Fetch user data from backend by X username
              const userResponse = await fetch(`${API_BASE_URL}/api/user/${entry.xUsername}`);
              const userData = await userResponse.json();

              if (userData.success && userData.verified && userData.data) {
                // Fetch profile data for avatar
                let profileImage: string | undefined;
                try {
                  const profileRes = await fetch(`${API_BASE_URL}/api/profile/${userData.data.walletAddress}`);
                  const profileData = await profileRes.json();
                  if (profileData.success && profileData.data?.profile) {
                    profileImage = profileData.data.profile.avatarData || profileData.data.profile.avatarUrl;
                  }
                } catch {
                  // Profile fetch failed, continue without profile image
                }

                // User has verified their wallet + X on the website
                return {
                  xUsername: entry.xUsername,
                  walletAddress: userData.data.walletAddress,
                  amyBalance: userData.data.amyBalance,
                  verified: true,
                  eligible: userData.data.amyBalance >= MINIMUM_AMY_BALANCE,
                  originalRank: entry.position,
                  isFromLeaderboard: true,
                  mindshareScore: entry.mindshare != null ? parseFloat(String(entry.mindshare)) : undefined,
                  profileImage
                };
              } else {
                // User is on leaderboard but hasn't verified on the website
                return {
                  xUsername: entry.xUsername,
                  verified: false,
                  eligible: false,
                  originalRank: entry.position,
                  isFromLeaderboard: true,
                  mindshareScore: entry.mindshare != null ? parseFloat(String(entry.mindshare)) : undefined
                };
              }
            } catch {
              return {
                xUsername: entry.xUsername,
                verified: false,
                eligible: false,
                originalRank: entry.position,
                isFromLeaderboard: true,
                mindshareScore: entry.mindshare != null ? parseFloat(String(entry.mindshare)) : undefined
              };
            }
          })
        );
        enrichedLeaderboard.push(...batchResults);
      }

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

  const loadPointsLeaderboard = async () => {
    setIsPointsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/points/leaderboard?limit=25`);
      const result = await response.json();

      if (result.success) {
        // Handle both array format and wrapped format
        const leaderboardData = Array.isArray(result.data)
          ? result.data
          : (result.data?.leaderboard || result.data?.entries || []);

        if (!Array.isArray(leaderboardData)) {
          console.error('Points leaderboard data is not an array:', result);
          setPointsEntries([]);
          return;
        }

        // Fetch profile data for each user (in batches to avoid overwhelming proxy)
        const entriesWithProfiles: PointsEntry[] = [];
        const batchSize = 20;

        for (let i = 0; i < leaderboardData.length; i += batchSize) {
          const batch = leaderboardData.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (entry: PointsEntry) => {
              try {
                const profileResponse = await fetch(`${API_BASE_URL}/api/profile/${entry.wallet}`);
                const profileData = await profileResponse.json();
                if (profileData.success && profileData.data?.profile) {
                  const profile = profileData.data.profile;
                  return {
                    ...entry,
                    displayName: profile.displayName || null,
                    bio: profile.bio || null,
                    profileImage: profile.avatarData || profile.avatarUrl || null
                  };
                }
                return entry;
              } catch {
                return entry;
              }
            })
          );
          entriesWithProfiles.push(...batchResults);
        }
        setPointsEntries(entriesWithProfiles);
      }
    } catch (err) {
      console.error('Error loading points leaderboard:', err);
    } finally {
      setIsPointsLoading(false);
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

  const shortenWallet = (wallet: string) => {
    if (!wallet) return '';
    return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  };

  const formatPoints = (points: number) => {
    return points.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-black text-white text-center mb-6">Leaderboards</h1>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900/80 rounded-xl p-1 inline-flex">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${
                activeTab === 'weekly'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Weekly Focus on X
            </button>
            <button
              onClick={() => setActiveTab('points')}
              className={`px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${
                activeTab === 'points'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Amy Points
            </button>
          </div>
        </div>

        {/* Information Box - Different content per tab */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-8 mb-6 md:mb-8">
          {activeTab === 'weekly' ? (
            <div className="space-y-3 md:space-y-4 text-yellow-300">
              <p className="text-sm md:text-base font-semibold">
                To appear here, you&apos;ll need to:
              </p>
              <ul className="space-y-2 text-sm md:text-base pl-4">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Connect your wallet and X account on the Amy site</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Hold 300+ $AMY</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Stay active on X in supporting Amy Weekly Focus</span>
                </li>
              </ul>
              <p className="text-sm md:text-base leading-relaxed">
                We use anti-gamification checks so you can&apos;t just buy 300 $AMY for a single day and qualify – you&apos;ll generally need to hold for most of the week.
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4 text-yellow-300">
              <p className="text-sm md:text-base leading-relaxed">
                Ranks are based on your total Amy Points.
              </p>
              <p className="text-sm md:text-base font-semibold">
                To appear here, you must:
              </p>
              <ul className="space-y-2 text-sm md:text-base pl-4">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Hold 300+ $AMY</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Connect at least one account (X, Discord, or Telegram)</span>
                </li>
              </ul>
              <p className="text-sm md:text-base leading-relaxed">
                Points update as you earn, spend, and unlock multipliers. Holding more $AMY increases your base point earning rate.
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard Card */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
          {/* Table Header */}
          <div className="px-4 md:px-6 py-4 bg-gray-800/50 border-b border-gray-700/50 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              {activeTab === 'weekly'
                ? '7 Day'
                : 'Amy Points'}
            </p>
            {lastUpdated && activeTab === 'weekly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">🔄</span>
                <span className="text-xs text-gray-400 font-semibold">
                  {formatLastUpdated(lastUpdated)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'weekly' ? (
              // Weekly Focus on X Tab
              isLoading ? (
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
                  <p className="text-xl md:text-2xl font-bold text-gray-300 mb-2">No eligible users yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Connect your wallet and X account to be the first on the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {displayEntries.slice(0, 25).map((entry, index) => {
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
                          {/* Profile picture with tier ring */}
                          <TierRingAvatar
                            xUsername={entry.xUsername}
                            amyBalance={entry.amyBalance}
                            profileImage={entry.profileImage}
                          />
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
                          {/* Mindshare score if available */}
                          {entry.mindshareScore != null && typeof entry.mindshareScore === 'number' && !isNaN(entry.mindshareScore) && (
                            <div className="text-right flex-shrink-0">
                              <span className="text-sm md:text-base font-bold text-green-400">
                                {entry.mindshareScore.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Amy Points Tab
              isPointsLoading ? (
                <div className="text-center py-12">
                  <div className="loading-spinner mx-auto mb-4" />
                  <p className="text-gray-400 font-semibold">Loading points leaderboard...</p>
                </div>
              ) : pointsEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl md:text-2xl font-bold text-gray-300 mb-2">No points earned yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start earning Amy Points by holding $AMY!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {pointsEntries.slice(0, 25).map((entry, index) => {
                    const displayPosition = index + 1;
                    const displayName = entry.displayName || shortenWallet(entry.wallet);
                    // Get tier from currentTier string or amyBalance
                    const tierBalance = entry.amyBalance || (
                      entry.currentTier === 'platinum' ? 100000 :
                      entry.currentTier === 'gold' ? 10000 :
                      entry.currentTier === 'silver' ? 1000 :
                      entry.currentTier === 'bronze' ? 300 : 0
                    );
                    return (
                      <div
                        key={`${entry.wallet}-${index}`}
                        className="leaderboard-row"
                        style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                      >
                        <div className="flex items-center justify-between gap-3 md:gap-4">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className={getPositionBadgeClass(displayPosition)}>
                              {displayPosition}
                            </div>
                            {/* Profile picture with tier ring */}
                            <TierRingAvatar
                              xUsername={entry.xUsername || displayName}
                              amyBalance={tierBalance}
                              profileImage={entry.profileImage}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-base md:text-lg font-bold text-white truncate block">
                                {displayName}
                              </span>
                              {entry.bio && (
                                <span className="text-xs text-gray-400 truncate block mt-0.5">
                                  {entry.bio.length > 50 ? `${entry.bio.slice(0, 50)}...` : entry.bio}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-base md:text-lg font-bold text-yellow-400">
                              {formatPoints(entry.totalPoints)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
