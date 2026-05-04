'use client';

import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, MINIMUM_AMY_BALANCE } from '@/lib/constants';
import ProfileCard from '@/app/app/profile/components/ProfileCard';

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
  size = 'md',
  useXProfile = false
}: {
  xUsername: string;
  amyBalance?: number;
  profileImage?: string;
  size?: 'sm' | 'md' | 'lg';
  useXProfile?: boolean; // true = fetch from X, false = use uploaded profile image
}) => {
  const [imgError, setImgError] = useState(false);
  const tier = getTierFromBalance(amyBalance);
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-14 h-14'
  };

  // X leaderboard: always use X profile picture
  // Amy Points: use uploaded avatar, fallback to X profile picture
  const xPic = xUsername ? `https://unavatar.io/x/${xUsername}` : null;
  const imageSrc = useXProfile ? xPic : (profileImage || xPic);

  return (
    <div className={`${sizeClasses[size]} rounded-full ring-2 ring-offset-1 ring-offset-gray-900 ${tier.ringColor} overflow-hidden flex-shrink-0 bg-gray-700`}>
      {imageSrc && !imgError ? (
        <img
          src={imageSrc}
          alt={xUsername}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
          {xUsername?.charAt(0).toUpperCase() || '?'}
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

const formatPointsAbbrev = (points: number): string => {
  if (points >= 1_000_000) return `${parseFloat((points / 1_000_000).toFixed(2))}M`;
  if (points >= 1_000) return `${parseFloat((points / 1_000).toFixed(2))}K`;
  return points.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const WEEKLY_CACHE_KEY = 'amy-weekly-leaderboard';
const POINTS_CACHE_KEY = 'amy-points-leaderboard';
const WEEKLY_CACHE_LIMIT = 25;
const POINTS_CACHE_LIMIT = 25;
const POINTS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const trimLeaderboardEntries = (entries: EnrichedEntry[]) =>
  entries.slice(0, WEEKLY_CACHE_LIMIT).map(entry => ({
    xUsername: entry.xUsername,
    walletAddress: entry.walletAddress,
    amyBalance: entry.amyBalance,
    verified: entry.verified,
    eligible: entry.eligible,
    originalRank: entry.originalRank,
    mindshareScore: entry.mindshareScore
  }));

const trimPointsEntries = (entries: PointsEntry[]) =>
  entries.slice(0, POINTS_CACHE_LIMIT).map(entry => ({
    wallet: entry.wallet,
    xUsername: entry.xUsername,
    totalPoints: entry.totalPoints,
    currentTier: entry.currentTier,
    amyBalance: entry.amyBalance,
    displayName: entry.displayName,
    bio: entry.bio
  }));

const safeSessionStorageSet = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    window.sessionStorage.removeItem(key);
  }
};

type SelectedProfile = {
  wallet: string;
  xUsername: string;
};

type LeaderboardProfileData = {
  balance: number;
  tier: string;
  totalMultiplier: number;
  pointsPerHour: number;
  amyScore: number;
  referralCode: string;
  cardBackgroundId: string | null;
  socialConnections: {
    xConnected?: boolean;
    discordConnected?: boolean;
    telegramConnected?: boolean;
    emailConnected?: boolean;
  };
};

const PROFILE_MODAL_CACHE_TTL_MS = 5 * 60 * 1000;
const profileModalCache = new Map<string, { data: LeaderboardProfileData; cachedAt: number }>();

function LeaderboardProfileModal({
  selected,
  onClose,
}: {
  selected: SelectedProfile | null;
  onClose: () => void;
}) {
  const [profileData, setProfileData] = useState<LeaderboardProfileData | null>(null);
  const [viewportWidth, setViewportWidth] = useState(560);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    const loadProfile = async () => {
      const cacheKey = selected.wallet.toLowerCase();
      const cached = profileModalCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < PROFILE_MODAL_CACHE_TTL_MS) {
        setProfileData(cached.data);
        return;
      }

      const fallbackData: LeaderboardProfileData = {
        balance: 0,
        tier: 'none',
        totalMultiplier: 1,
        pointsPerHour: 0,
        amyScore: 0,
        referralCode: '',
        cardBackgroundId: null,
        socialConnections: {
          xConnected: !!selected.xUsername,
        },
      };
      setProfileData(fallbackData);

      const safeJson = async (url: string) => {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          return await res.json();
        } catch {
          return null;
        }
      };

      const [profileRes, pointsRes, referralRes, scoreRes] = await Promise.all([
        safeJson(`${API_BASE_URL}/api/profile/${selected.wallet}`),
        safeJson(`${API_BASE_URL}/api/points/${selected.wallet}`),
        safeJson(`${API_BASE_URL}/api/referral/${selected.wallet}`),
        safeJson(`${API_BASE_URL}/api/amy-score/${selected.wallet}`),
      ]);

      if (cancelled) return;

      const profile = profileRes?.data?.profile || {};
      const social = profileRes?.data?.social || {};
      const points = pointsRes?.data || {};

      const loadedData: LeaderboardProfileData = {
        balance: Number(points.lastAmyBalance || points.last_amy_balance || 0),
        tier: points.currentTier || 'none',
        totalMultiplier: Number(points.totalMultiplier || 1),
        pointsPerHour: Number(points.effectivePointsPerHour || points.pointsPerHour || 0),
        amyScore: Number(scoreRes?.score || 0),
        referralCode: referralRes?.data?.referralCode || '',
        cardBackgroundId: profile.cardBackgroundId || null,
        socialConnections: {
          xConnected: !!selected.xUsername,
          discordConnected: !!social.discordUsername,
          telegramConnected: !!social.telegramUsername,
          emailConnected: !!social.email,
        },
      };

      profileModalCache.set(cacheKey, { data: loadedData, cachedAt: Date.now() });
      setProfileData(loadedData);
    };

    loadProfile();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected, onClose]);

  if (!selected) return null;

  const cardScale = Math.min(1, Math.max(0.48, (viewportWidth - 56) / 560));
  const scaledCardWidth = 560 * cardScale;
  const scaledCardHeight = 335 * cardScale;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90dvh] max-w-[calc(100vw-16px)] overflow-x-hidden overflow-y-auto rounded-2xl border border-gray-600/70 bg-gray-800 p-3 shadow-2xl min-[430px]:p-4 md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-1 top-0 z-10 w-6 h-6 md:right-0 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-black transition-colors"
        >
          <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div style={{ width: scaledCardWidth, height: scaledCardHeight }}>
        <div
          className="origin-top-left w-[560px]"
          style={{ transform: `scale(${cardScale})` }}
        >
          {profileData ? (
            <ProfileCard
              wallet={selected.wallet}
              xUsername={selected.xUsername}
              balance={profileData.balance}
              tier={profileData.tier}
              totalMultiplier={profileData.totalMultiplier}
              pointsPerHour={profileData.pointsPerHour}
              amyScore={profileData.amyScore}
              userReferralCode={profileData.referralCode}
              onEditProfile={() => {}}
              onEditBadges={() => {}}
              onConnectX={() => {}}
              onConnectDiscord={() => {}}
              onConnectTelegram={() => {}}
              onConnectEmail={() => {}}
              socialConnections={profileData.socialConnections}
              readOnly
              exportPreview
              cardBackgroundId={profileData.cardBackgroundId}
            />
          ) : (
            <div className="w-[560px] rounded-2xl border border-gray-700/50 bg-gray-900 p-10 flex justify-center">
              <div className="loading-spinner w-8 h-8" />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('points');
  const pointsRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayEntries, setDisplayEntries] = useState<EnrichedEntry[]>([]);
  const [pointsEntries, setPointsEntries] = useState<PointsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPointsLoading, setIsPointsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [hasCachedLeaderboard, setHasCachedLeaderboard] = useState(false);
  const [hasCachedPointsLeaderboard, setHasCachedPointsLeaderboard] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(WEEKLY_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.entries)) {
            setDisplayEntries(parsed.entries);
            setLastUpdated(parsed.lastUpdated || '');
            setHasCachedLeaderboard(true);
            setIsLoading(false);
          }
        } catch {
          sessionStorage.removeItem(WEEKLY_CACHE_KEY);
        }
      }
    }
    loadLeaderboard();
  }, []);

  useEffect(() => {
    // Load points leaderboard: check cache TTL, fetch if stale/missing
    const initPoints = () => {
      if (typeof window === 'undefined') return;
      const cached = sessionStorage.getItem(POINTS_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - (parsed.cachedAt || 0);
          if (age < POINTS_CACHE_TTL_MS && Array.isArray(parsed.entries)) {
            setPointsEntries(parsed.entries);
            setHasCachedPointsLeaderboard(true);
            setIsPointsLoading(false);
            return; // Cache is fresh, skip fetch
          }
        } catch { /* fall through to fetch */ }
        sessionStorage.removeItem(POINTS_CACHE_KEY);
      }
      loadPointsLeaderboard();
    };

    if (activeTab === 'points' && pointsEntries.length === 0) {
      initPoints();
    }

    // Auto-refresh every 15 minutes while on points tab
    if (activeTab === 'points') {
      pointsRefreshRef.current = setInterval(() => {
        sessionStorage.removeItem(POINTS_CACHE_KEY);
        loadPointsLeaderboard();
      }, POINTS_CACHE_TTL_MS);
    }

    return () => {
      if (pointsRefreshRef.current) {
        clearInterval(pointsRefreshRef.current);
        pointsRefreshRef.current = null;
      }
    };
  }, [activeTab]);

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
      setHasCachedLeaderboard(true);
      safeSessionStorageSet(WEEKLY_CACHE_KEY, {
        entries: trimLeaderboardEntries(combinedEntries),
        lastUpdated: leaderboardData.lastUpdated || ''
      });

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
      const response = await fetch(`${API_BASE_URL}/api/points/leaderboard?limit=25`, { cache: 'no-store' });
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
        setHasCachedPointsLeaderboard(true);
        safeSessionStorageSet(POINTS_CACHE_KEY, {
          entries: trimPointsEntries(entriesWithProfiles),
          cachedAt: Date.now()
        });
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
            <div className="space-y-3 md:space-y-4 text-white">
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
            <div className="space-y-3 md:space-y-4 text-white">
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
                        role="button"
                        tabIndex={entry.walletAddress ? 0 : -1}
                        onClick={() => entry.walletAddress && setSelectedProfile({ wallet: entry.walletAddress, xUsername: entry.xUsername })}
                        onKeyDown={(event) => {
                          if (entry.walletAddress && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            setSelectedProfile({ wallet: entry.walletAddress, xUsername: entry.xUsername });
                          }
                        }}
                        className={`leaderboard-row ${entry.walletAddress ? 'cursor-pointer hover:border-yellow-400/40' : ''}`}
                        style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                      >
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                          <div className="flex items-center gap-2 md:gap-4 min-w-0">
                            <div className={`${getPositionBadgeClass(displayPosition)} flex-shrink-0`}>
                              {displayPosition}
                            </div>
                            {/* Profile picture with tier ring */}
                            <div className="flex-shrink-0">
                              <TierRingAvatar
                                xUsername={entry.xUsername}
                                amyBalance={entry.amyBalance}
                                useXProfile={true}
                              />
                            </div>
                            <span className="text-sm md:text-lg font-bold text-yellow-400 transition-colors truncate">
                              @{entry.xUsername}
                            </span>
                          </div>
                          {/* Mindshare score if available */}
                          {entry.mindshareScore != null && typeof entry.mindshareScore === 'number' && !isNaN(entry.mindshareScore) && (
                            <span className="text-sm md:text-base font-bold text-green-400 flex-shrink-0">
                              {entry.mindshareScore.toFixed(2)}%
                            </span>
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
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedProfile({ wallet: entry.wallet, xUsername: entry.xUsername || displayName })}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedProfile({ wallet: entry.wallet, xUsername: entry.xUsername || displayName });
                          }
                        }}
                        className="leaderboard-row cursor-pointer hover:border-yellow-400/40"
                        style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <div className="flex items-start gap-2 md:gap-4 flex-1 min-w-0">
                            <div className={`${getPositionBadgeClass(displayPosition)} flex-shrink-0 mt-1`}>
                              {displayPosition}
                            </div>
                            {/* Profile picture with tier ring */}
                            <div className="flex-shrink-0 mt-1">
                              <TierRingAvatar
                                xUsername={entry.xUsername || displayName}
                                amyBalance={tierBalance}
                                profileImage={entry.profileImage}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm md:text-lg font-bold text-white block break-words">
                                {displayName}
                              </span>
                              {entry.bio && (
                                <p className="text-xs text-gray-400 mt-1 break-words line-clamp-2">
                                  {entry.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm md:text-lg font-bold text-yellow-400 flex-shrink-0 mt-1">
                            {formatPointsAbbrev(entry.totalPoints)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Menu Button */}
        <div className="text-center mt-8 md:mt-12 pb-4">
          <button
            onClick={() => window.dispatchEvent(new Event('amy-open-menu'))}
            className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase"
          >
            MENU
          </button>
        </div>
      </div>
      <LeaderboardProfileModal selected={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
}
