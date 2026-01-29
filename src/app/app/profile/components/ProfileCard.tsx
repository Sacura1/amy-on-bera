'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface LpData {
  lpValueUsd: number;
  lpMultiplier: number;
  isInRange: boolean;
}

interface TokenHolding {
  multiplier: number;
  isActive: boolean;
  valueUsd?: number;
}

interface TokenHoldingsData {
  sailr: TokenHolding;
  plvhedge: TokenHolding;
  plsbera: TokenHolding;
}

interface PointsData {
  raidsharkMultiplier?: number;
  onchainConvictionMultiplier?: number;
  referralMultiplier?: number;
  swapperMultiplier?: number;
}

interface EquippedBadge {
  slotNumber: number;
  badgeId: string;
}

interface ProfileData {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarData: string | null;
  avatarType: string;
}

interface SocialData {
  discordUsername: string | null;
  telegramUsername: string | null;
  email: string | null;
}

interface SocialConnections {
  xConnected?: boolean;
  discordConnected?: boolean;
  telegramConnected?: boolean;
  emailConnected?: boolean;
}

interface ProfileCardProps {
  wallet: string;
  xUsername: string;
  balance: number;
  tier: string;
  totalMultiplier: number;
  pointsPerHour: number;
  onEditProfile: () => void;
  onEditBadges: () => void;
  onConnectX: () => void;
  onConnectDiscord: () => void;
  onConnectTelegram: () => void;
  onConnectEmail: () => void;
  socialConnections: SocialConnections;
}

// Helper to get the correct backend badge ID based on value tier
function getLpBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'lp_x10';
  if (valueUsd >= 100) return 'lp_x5';
  if (valueUsd >= 10) return 'lp_x3';
  return null;
}

function getSailrBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'sailr_x10';
  if (valueUsd >= 100) return 'sailr_x5';
  if (valueUsd >= 10) return 'sailr_x3';
  return null;
}

// Get ring color based on tier
function getTierRingColor(tier: string): string {
  switch (tier) {
    case 'platinum':
      return 'border-cyan-400';
    case 'gold':
      return 'border-yellow-400';
    case 'silver':
      return 'border-slate-300';
    case 'bronze':
      return 'border-amber-600';
    default:
      return 'border-gray-500';
  }
}

function getPlvhedgeBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'plvhedge_x10';
  if (valueUsd >= 100) return 'plvhedge_x5';
  if (valueUsd >= 10) return 'plvhedge_x3';
  return null;
}

function getPlsberaBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'plsbera_x10';
  if (valueUsd >= 100) return 'plsbera_x5';
  if (valueUsd >= 10) return 'plsbera_x3';
  return null;
}

function getRaidsharkBadgeId(multiplier: number): string | null {
  if (multiplier >= 15) return 'raidshark_x15';
  if (multiplier >= 7) return 'raidshark_x7';
  if (multiplier >= 3) return 'raidshark_x3';
  return null;
}

function getConvictionBadgeId(multiplier: number): string | null {
  if (multiplier >= 10) return 'conviction_x10';
  if (multiplier >= 5) return 'conviction_x5';
  if (multiplier >= 3) return 'conviction_x3';
  return null;
}

function getReferralBadgeId(multiplier: number): string | null {
  if (multiplier >= 10) return 'referral_x10';
  if (multiplier >= 5) return 'referral_x5';
  if (multiplier >= 3) return 'referral_x3';
  return null;
}

function getSwapperBadgeId(multiplier: number): string | null {
  if (multiplier >= 10) return 'swapper_x10';
  if (multiplier >= 5) return 'swapper_x5';
  if (multiplier >= 3) return 'swapper_x3';
  return null;
}

export default function ProfileCard({
  wallet,
  xUsername,
  balance,
  tier,
  totalMultiplier,
  pointsPerHour,
  onEditProfile,
  onEditBadges,
  onConnectX,
  onConnectDiscord,
  onConnectTelegram,
  onConnectEmail,
  socialConnections
}: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [equippedBadges, setEquippedBadges] = useState<EquippedBadge[]>([]);
  const [lpData, setLpData] = useState<LpData | null>(null);
  const [tokenData, setTokenData] = useState<TokenHoldingsData | null>(null);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { discordConnected, telegramConnected, emailConnected } = socialConnections || {};

  useEffect(() => {
    if (!wallet) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch profile data
        const profileRes = await fetch(`${API_BASE_URL}/api/profile/${wallet}`);
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data.profile);
          setEquippedBadges(profileData.data.badges?.equipped || []);
          // Store social data with usernames
          if (profileData.data.social) {
            setSocialData(profileData.data.social);
          }
        }

        // Fetch LP data for Bulla badge
        const lpRes = await fetch(`${API_BASE_URL}/api/lp/${wallet}`);
        const lpDataResponse = await lpRes.json();
        if (lpDataResponse.success && lpDataResponse.data) {
          setLpData(lpDataResponse.data);
        }

        // Fetch token data for SAIL.r and plvHEDGE badges
        const tokenRes = await fetch(`${API_BASE_URL}/api/tokens/${wallet}`);
        const tokenDataResponse = await tokenRes.json();
        if (tokenDataResponse.success && tokenDataResponse.data) {
          setTokenData(tokenDataResponse.data);
        }

        // Fetch points data for RaidShark, Conviction, Referral, and Swapper badges
        const pointsRes = await fetch(`${API_BASE_URL}/api/points/${wallet}`);
        const pointsDataResponse = await pointsRes.json();
        if (pointsDataResponse.success && pointsDataResponse.data) {
          setPointsData({
            raidsharkMultiplier: pointsDataResponse.data.raidsharkMultiplier,
            onchainConvictionMultiplier: pointsDataResponse.data.onchainConvictionMultiplier,
            referralMultiplier: pointsDataResponse.data.referralMultiplier,
            swapperMultiplier: pointsDataResponse.data.swapperMultiplier
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [wallet]);

  // Get active badges with their multipliers - using correct backend badge IDs
  const getActiveBadges = () => {
    const active: { id: string; multiplier: number; name: string; title: string; image: string }[] = [];

    // Bulla Exchange (LP) badge - use correct tier ID
    if (lpData && lpData.lpValueUsd >= 10) {
      const badgeId = getLpBadgeId(lpData.lpValueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: lpData.lpMultiplier,
          name: 'Bulla Exchange',
          title: 'AMY/HONEY LP',
          image: '/bulla.jpg'
        });
      }
    }

    // plvHEDGE badge
    if (tokenData && tokenData.plvhedge.isActive && tokenData.plvhedge.multiplier > 1) {
      const valueUsd = tokenData.plvhedge.valueUsd || (tokenData.plvhedge.multiplier >= 100 ? 500 : tokenData.plvhedge.multiplier >= 10 ? 100 : 10);
      const badgeId = getPlvhedgeBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: tokenData.plvhedge.multiplier,
          name: 'plvHEDGE',
          title: 'Vault',
          image: '/plvhedge.jpg'
        });
      }
    }

    // SAIL.r badge
    if (tokenData && tokenData.sailr.isActive && tokenData.sailr.multiplier > 1) {
      const valueUsd = tokenData.sailr.valueUsd || (tokenData.sailr.multiplier >= 100 ? 500 : tokenData.sailr.multiplier >= 10 ? 100 : 10);
      const badgeId = getSailrBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: tokenData.sailr.multiplier,
          name: 'SAIL.r',
          title: 'Royalty',
          image: '/sail.jpg'
        });
      }
    }

    // plsBERA badge
    if (tokenData && tokenData.plsbera && tokenData.plsbera.isActive && tokenData.plsbera.multiplier > 1) {
      const valueUsd = tokenData.plsbera.valueUsd || (tokenData.plsbera.multiplier >= 10 ? 500 : tokenData.plsbera.multiplier >= 5 ? 100 : 10);
      const badgeId = getPlsberaBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: tokenData.plsbera.multiplier,
          name: 'plsBERA',
          title: 'Staking',
          image: '/plsbera.jpg'
        });
      }
    }

    // RaidShark badge
    if (pointsData && pointsData.raidsharkMultiplier && pointsData.raidsharkMultiplier > 0) {
      const badgeId = getRaidsharkBadgeId(pointsData.raidsharkMultiplier);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: pointsData.raidsharkMultiplier,
          name: 'RaidShark',
          title: 'Raider',
          image: '/shark.jpg'
        });
      }
    }

    // Conviction badge
    if (pointsData && pointsData.onchainConvictionMultiplier && pointsData.onchainConvictionMultiplier > 0) {
      const badgeId = getConvictionBadgeId(pointsData.onchainConvictionMultiplier);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: pointsData.onchainConvictionMultiplier,
          name: 'Conviction',
          title: 'Holder',
          image: '/convic.jpg'
        });
      }
    }

    // Referral badge
    if (pointsData && pointsData.referralMultiplier && pointsData.referralMultiplier > 0) {
      const badgeId = getReferralBadgeId(pointsData.referralMultiplier);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: pointsData.referralMultiplier,
          name: 'Referral',
          title: 'Ambassador',
          image: '/ref.jpg'
        });
      }
    }

    // Swapper badge
    if (pointsData && pointsData.swapperMultiplier && pointsData.swapperMultiplier > 0) {
      const badgeId = getSwapperBadgeId(pointsData.swapperMultiplier);
      if (badgeId) {
        active.push({
          id: badgeId,
          multiplier: pointsData.swapperMultiplier,
          name: 'Swapper',
          title: 'Seasoned',
          image: '/swapper.jpg'
        });
      }
    }

    return active;
  };

  const activeBadges = getActiveBadges();

  // Get badge for slot
  const getBadgeForSlot = (slotNumber: number) => {
    const equipped = equippedBadges.find(b => b.slotNumber === slotNumber);
    if (!equipped) return null;
    return activeBadges.find(b => b.id === equipped.badgeId) || null;
  };

  // Get ring color based on multiplier tier (gold/silver/bronze)
  const getMultiplierRingColor = (multiplier: number) => {
    if (multiplier >= 10) return 'ring-4 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'; // Gold - $500+ (10x)
    if (multiplier >= 5) return 'ring-4 ring-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.5)]';  // Silver - $100+ (5x)
    return 'ring-4 ring-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.5)]';                         // Bronze - $10+ (3x)
  };

  const getAvatarUrl = () => {
    // Prioritize base64 data (stored in PostgreSQL, persists across deploys)
    if (profile?.avatarData) {
      return profile.avatarData;
    }
    // Fallback to URL (legacy, will be lost on deploy)
    if (profile?.avatarUrl) {
      return `${API_BASE_URL}${profile.avatarUrl}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6">
        <div className="flex justify-center py-8">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 relative">
      {/* Edit Profile Button */}
      <button
        onClick={onEditProfile}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
        title="Edit Profile"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 ${getTierRingColor(tier)} overflow-hidden`}>
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()!}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-4xl">🐻</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
            {profile?.displayName || xUsername}
          </h2>
          {profile?.bio && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{profile.bio}</p>
          )}

          {/* Multiplier Badge Slots */}
          <div className="flex gap-3 my-3">
            {[1, 2, 3, 4, 5].map((slotNumber) => {
              const badge = getBadgeForSlot(slotNumber);
              return (
                <div
                  key={slotNumber}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                    badge
                      ? `bg-white ${getMultiplierRingColor(badge.multiplier)}`
                      : 'border-2 border-gray-600/50 bg-gray-800/50 border-dashed'
                  }`}
                >
                  {badge ? (
                    <img src={badge.image} alt={badge.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-[10px] text-gray-600">{slotNumber}</span>
                  )}
                </div>
              );
            })}
            <button
              onClick={onEditBadges}
              className="w-10 h-10 rounded-full border-2 border-dashed border-gray-600 hover:border-pink-500 flex items-center justify-center transition-colors"
              title="Edit Badges"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-400">AMY:</span>{' '}
              <span className="text-white font-semibold">{Number(balance || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">Multiplier:</span>{' '}
              <span className="text-yellow-400 font-semibold">{totalMultiplier || 1}x</span>
            </div>
            <div>
              <span className="text-gray-400">Points/hr:</span>{' '}
              <span className="text-green-400 font-semibold">{Number(pointsPerHour || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Social Connections */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* X/Twitter */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-700/50 text-sm">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-white">@{xUsername}</span>
            </div>

            {/* Discord */}
            {discordConnected ? (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#5865F2]/20 text-sm cursor-default"
                title={socialData?.discordUsername && socialData.discordUsername !== 'connected' ? `@${socialData.discordUsername}` : 'Discord connected'}
              >
                <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="text-white">{socialData?.discordUsername && socialData.discordUsername !== 'connected' ? socialData.discordUsername : 'Connected'}</span>
              </div>
            ) : (
              <button
                onClick={onConnectDiscord}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-sm transition-colors"
              >
                <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="text-gray-400">Connect</span>
              </button>
            )}

            {/* Telegram */}
            {telegramConnected ? (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0088cc]/20 text-sm cursor-default"
                title={socialData?.telegramUsername && socialData.telegramUsername !== 'connected' ? `@${socialData.telegramUsername}` : 'Telegram connected'}
              >
                <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-white">{socialData?.telegramUsername && socialData.telegramUsername !== 'connected' ? socialData.telegramUsername : 'Connected'}</span>
              </div>
            ) : (
              <button
                onClick={onConnectTelegram}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-sm transition-colors"
              >
                <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-gray-400">Connect</span>
              </button>
            )}

            {/* Email - Commented out until SendGrid implementation is ready
            {emailConnected ? (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/20 text-sm cursor-default"
                title={socialData?.email || 'Email verified'}
              >
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-green-400">Verified</span>
              </div>
            ) : (
              <button
                onClick={onConnectEmail}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-sm transition-colors"
              >
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400">Add Email</span>
              </button>
            )}
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
