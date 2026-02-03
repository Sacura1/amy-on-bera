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
  balance?: number;
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

interface PointsData {
  raidsharkMultiplier?: number;
  onchainConvictionMultiplier?: number;
  referralMultiplier?: number;
  swapperMultiplier?: number;
  telegramModMultiplier?: number;
  discordModMultiplier?: number;
}

interface EquippedBadge {
  slotNumber: number;
  badgeId: string;
}

interface ActiveBadge {
  id: string;
  name: string;
  title: string;
  image: string;
  multiplier: number;
}

interface BadgeSelectorProps {
  wallet: string;
  isOpen: boolean;
  onClose: () => void;
  onBadgesUpdated: () => void;
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

function getHoneybendBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'honeybend_x10';
  if (valueUsd >= 100) return 'honeybend_x5';
  if (valueUsd >= 10) return 'honeybend_x3';
  return null;
}

function getStakedberaBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'stakedbera_x10';
  if (valueUsd >= 100) return 'stakedbera_x5';
  if (valueUsd >= 10) return 'stakedbera_x3';
  return null;
}

function getBgtBadgeId(balance: number): string | null {
  if (balance >= 1) return 'bgt_x10';
  if (balance >= 0.1) return 'bgt_x5';
  if (balance >= 0.01) return 'bgt_x3';
  return null;
}

function getSnrusdBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'snrusd_x10';
  if (valueUsd >= 100) return 'snrusd_x5';
  if (valueUsd >= 10) return 'snrusd_x3';
  return null;
}

function getJnrusdBadgeId(valueUsd: number): string | null {
  if (valueUsd >= 500) return 'jnrusd_x10';
  if (valueUsd >= 100) return 'jnrusd_x5';
  if (valueUsd >= 10) return 'jnrusd_x3';
  return null;
}

export default function BadgeSelector({
  wallet,
  isOpen,
  onClose,
  onBadgesUpdated
}: BadgeSelectorProps) {
  const [equippedBadges, setEquippedBadges] = useState<EquippedBadge[]>([]);
  const [lpData, setLpData] = useState<LpData | null>(null);
  const [tokenData, setTokenData] = useState<TokenHoldingsData | null>(null);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!wallet || !isOpen) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const profileRes = await fetch(`${API_BASE_URL}/api/profile/${wallet}`);
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data.badges?.equipped) {
          setEquippedBadges(profileData.data.badges.equipped);
        }

        const lpRes = await fetch(`${API_BASE_URL}/api/lp/${wallet}`);
        const lpDataResponse = await lpRes.json();
        if (lpDataResponse.success && lpDataResponse.data) {
          setLpData(lpDataResponse.data);
        }

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
        console.error('Error fetching badges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [wallet, isOpen]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSlot(null);
      setSelectedBadge(null);
    }
  }, [isOpen]);

  const getActiveBadges = (): ActiveBadge[] => {
    const active: ActiveBadge[] = [];

    // LP (Bulla Exchange) badge - use the correct tier ID
    if (lpData && lpData.lpValueUsd >= 10) {
      const badgeId = getLpBadgeId(lpData.lpValueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          name: 'Bulla Exchange',
          title: 'AMY/HONEY LP',
          image: '/bulla.jpg',
          multiplier: lpData.lpMultiplier
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
          name: 'plvHEDGE',
          title: 'Vault',
          image: '/plvhedge.jpg',
          multiplier: tokenData.plvhedge.multiplier
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
          name: 'SAIL.r',
          title: 'Royalty',
          image: '/sail.jpg',
          multiplier: tokenData.sailr.multiplier
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
          name: 'plsBERA',
          title: 'Staking',
          image: '/plsbera.jpg',
          multiplier: tokenData.plsbera.multiplier
        });
      }
    }

    // HONEY Bend badge
    if (tokenData && tokenData.honeybend && tokenData.honeybend.isActive && tokenData.honeybend.multiplier > 1) {
      const valueUsd = tokenData.honeybend.valueUsd || (tokenData.honeybend.multiplier >= 10 ? 500 : tokenData.honeybend.multiplier >= 5 ? 100 : 10);
      const badgeId = getHoneybendBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          name: 'HONEY Bend',
          title: 'Lending',
          image: '/honey.jpg',
          multiplier: tokenData.honeybend.multiplier
        });
      }
    }

    // Staked BERA badge
    if (tokenData && tokenData.stakedbera && tokenData.stakedbera.isActive && tokenData.stakedbera.multiplier > 1) {
      const valueUsd = tokenData.stakedbera.valueUsd || (tokenData.stakedbera.multiplier >= 10 ? 500 : tokenData.stakedbera.multiplier >= 5 ? 100 : 10);
      const badgeId = getStakedberaBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          name: 'Staked BERA',
          title: 'stBERA',
          image: '/BERA.png',
          multiplier: tokenData.stakedbera.multiplier
        });
      }
    }

    // BGT badge (uses balance thresholds, not USD value)
    if (tokenData && tokenData.bgt && tokenData.bgt.isActive && tokenData.bgt.multiplier > 1) {
      const balance = tokenData.bgt.balance || (tokenData.bgt.multiplier >= 10 ? 1 : tokenData.bgt.multiplier >= 5 ? 0.1 : 0.01);
      const badgeId = getBgtBadgeId(balance);
      if (badgeId) {
        active.push({
          id: badgeId,
          name: 'BGT',
          title: 'Holder',
          image: '/bgt.jpg',
          multiplier: tokenData.bgt.multiplier
        });
      }
    }

    // snrUSD badge
    if (tokenData && tokenData.snrusd && tokenData.snrusd.isActive && tokenData.snrusd.multiplier > 1) {
      const valueUsd = tokenData.snrusd.valueUsd || (tokenData.snrusd.multiplier >= 10 ? 500 : tokenData.snrusd.multiplier >= 5 ? 100 : 10);
      const badgeId = getSnrusdBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          name: 'snrUSD',
          title: 'Senior',
          image: '/snr.jpg',
          multiplier: tokenData.snrusd.multiplier
        });
      }
    }

    // jnrUSD badge
    if (tokenData && tokenData.jnrusd && tokenData.jnrusd.isActive && tokenData.jnrusd.multiplier > 1) {
      const valueUsd = tokenData.jnrusd.valueUsd || (tokenData.jnrusd.multiplier >= 10 ? 500 : tokenData.jnrusd.multiplier >= 5 ? 100 : 10);
      const badgeId = getJnrusdBadgeId(valueUsd);
      if (badgeId) {
        active.push({
          id: badgeId,
          name: 'jnrUSD',
          title: 'Junior',
          image: '/jnr.jpg',
          multiplier: tokenData.jnrusd.multiplier
        });
      }
    }

    // RaidShark badge
    if (pointsData && pointsData.raidsharkMultiplier && pointsData.raidsharkMultiplier > 0) {
      const badgeId = getRaidsharkBadgeId(pointsData.raidsharkMultiplier);
      if (badgeId) {
        const tierName = pointsData.raidsharkMultiplier >= 15 ? 'Raid Legend' : pointsData.raidsharkMultiplier >= 7 ? 'Raid Master' : 'Raid Enthusiast';
        active.push({
          id: badgeId,
          name: 'RaidShark',
          title: tierName,
          image: '/shark.jpg',
          multiplier: pointsData.raidsharkMultiplier
        });
      }
    }

    // Onchain Conviction badge
    if (pointsData && pointsData.onchainConvictionMultiplier && pointsData.onchainConvictionMultiplier > 0) {
      const badgeId = getConvictionBadgeId(pointsData.onchainConvictionMultiplier);
      if (badgeId) {
        const level = pointsData.onchainConvictionMultiplier >= 10 ? 3 : pointsData.onchainConvictionMultiplier >= 5 ? 2 : 1;
        active.push({
          id: badgeId,
          name: 'Onchain Conviction',
          title: `Level ${level}`,
          image: '/convic.jpg',
          multiplier: pointsData.onchainConvictionMultiplier
        });
      }
    }

    // Referral badge
    if (pointsData && pointsData.referralMultiplier && pointsData.referralMultiplier > 0) {
      const badgeId = getReferralBadgeId(pointsData.referralMultiplier);
      if (badgeId) {
        const tierName = pointsData.referralMultiplier >= 10 ? '3+ Referrals' : pointsData.referralMultiplier >= 5 ? '2 Referrals' : '1 Referral';
        active.push({
          id: badgeId,
          name: 'Dawn Referral',
          title: tierName,
          image: '/ref.jpg',
          multiplier: pointsData.referralMultiplier
        });
      }
    }

    // Swapper badge
    if (pointsData && pointsData.swapperMultiplier && pointsData.swapperMultiplier > 0) {
      const badgeId = getSwapperBadgeId(pointsData.swapperMultiplier);
      if (badgeId) {
        const tierName = pointsData.swapperMultiplier >= 10 ? 'Elite' : pointsData.swapperMultiplier >= 5 ? 'Committed' : 'Engaged';
        active.push({
          id: badgeId,
          name: 'Seasoned Swapper',
          title: tierName,
          image: '/swapper.jpg',
          multiplier: pointsData.swapperMultiplier
        });
      }
    }

    // Telegram Mod badge
    if (pointsData && pointsData.telegramModMultiplier && pointsData.telegramModMultiplier > 0) {
      const tierName = pointsData.telegramModMultiplier >= 15 ? 'Archlord' : pointsData.telegramModMultiplier >= 7 ? 'Sentinel' : 'Guardian';
      active.push({
        id: `telegram_mod_x${pointsData.telegramModMultiplier}`,
        name: 'Telegram Mod',
        title: tierName,
        image: '/tg.png',
        multiplier: pointsData.telegramModMultiplier
      });
    }

    // Discord Mod badge
    if (pointsData && pointsData.discordModMultiplier && pointsData.discordModMultiplier > 0) {
      const tierName = pointsData.discordModMultiplier >= 15 ? 'Archlord' : pointsData.discordModMultiplier >= 7 ? 'Sentinel' : 'Guardian';
      active.push({
        id: `discord_mod_x${pointsData.discordModMultiplier}`,
        name: 'Discord Mod',
        title: tierName,
        image: '/dc.jpg',
        multiplier: pointsData.discordModMultiplier
      });
    }

    return active;
  };

  const activeBadges = getActiveBadges();

  const getBadgeForSlot = (slotNumber: number) => {
    const equipped = equippedBadges.find(b => b.slotNumber === slotNumber);
    if (!equipped) return null;
    return activeBadges.find(b => b.id === equipped.badgeId) || null;
  };

  const isBadgeEquipped = (badgeId: string) => equippedBadges.some(b => b.badgeId === badgeId);

  const getMultiplierColors = (multiplier: number) => {
    if (multiplier >= 100) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950';
    if (multiplier >= 10) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900';
    if (multiplier >= 5) return 'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-100';
    return 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100';
  };

  // Get tier ring color based on multiplier
  const getTierRingColor = (multiplier: number) => {
    if (multiplier >= 100) return 'ring-yellow-400';
    if (multiplier >= 10) return 'ring-slate-400';
    if (multiplier >= 5) return 'ring-slate-500';
    return 'ring-amber-600';
  };

  const equipBadge = async () => {
    if (selectedSlot === null || selectedBadge === null) return;

    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/badges/${wallet}/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotNumber: selectedSlot, badgeId: selectedBadge })
      });
      const data = await response.json();

      if (data.success) {
        setEquippedBadges(data.data);
        setSelectedSlot(null);
        setSelectedBadge(null);
        onBadgesUpdated();
      } else {
        alert(data.error || 'Failed to equip badge');
      }
    } catch (error) {
      console.error('Error equipping badge:', error);
      alert('Failed to equip badge');
    } finally {
      setIsSaving(false);
    }
  };

  const unequipBadge = async (slotNumber: number) => {
    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/badges/${wallet}/unequip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotNumber })
      });
      const data = await response.json();
      if (data.success) {
        setEquippedBadges(data.data);
        onBadgesUpdated();
      }
    } catch (error) {
      console.error('Error unequipping badge:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const canEquip = selectedSlot !== null && selectedBadge !== null && !isSaving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Edit Multiplier Badges</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner w-8 h-8"></div>
            </div>
          ) : (
            <>
              {/* Slots */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  1. Select a slot
                </h3>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((slotNumber) => {
                    const badge = getBadgeForSlot(slotNumber);
                    const isSelected = selectedSlot === slotNumber;
                    return (
                      <div key={slotNumber} className="relative">
                        <div
                          className={`relative w-14 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-900/30 scale-110'
                              : badge
                              ? `ring-2 ${getTierRingColor(badge.multiplier)} bg-white hover:scale-105`
                              : 'border-gray-600/50 bg-gray-800/50 border-dashed hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedSlot(slotNumber)}
                        >
                          {badge ? (
                            <>
                              <img src={badge.image} alt={badge.name} className="w-full h-full object-cover" />
                              {/* Banner triangle in bottom left corner */}
                              <div className={`absolute bottom-0 left-0 ${getMultiplierColors(badge.multiplier)}`}>
                                <div className="text-[10px] font-black px-1.5 py-0.5 rounded-tr-lg">
                                  x{badge.multiplier}
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className={`text-sm ${isSelected ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>{slotNumber}</span>
                          )}
                        </div>
                        {/* Red X outside the badge */}
                        {badge && (
                          <button
                            onClick={(e) => { e.stopPropagation(); unequipBadge(slotNumber); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white hover:bg-red-600 shadow-lg z-10"
                            disabled={isSaving}
                          >×</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedSlot && (
                  <p className="text-center text-sm text-yellow-400 mt-2">
                    Slot {selectedSlot} selected
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  2. Select a badge ({activeBadges.length} available)
                </h3>
                {activeBadges.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">No active multiplier badges yet.</p>
                    <p className="text-gray-600 text-sm">Earn badges by providing LP, holding tokens, referring friends, or earning RaidShark & Conviction badges.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeBadges.map((badge) => {
                      const isEquipped = isBadgeEquipped(badge.id);
                      const isSelected = selectedBadge === badge.id;
                      return (
                        <div
                          key={badge.id}
                          onClick={() => {
                            if (!isEquipped) {
                              setSelectedBadge(badge.id);
                            }
                          }}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isEquipped
                              ? 'border-green-500/50 bg-green-900/20 cursor-not-allowed'
                              : isSelected
                              ? 'border-yellow-400 bg-yellow-900/30 cursor-pointer'
                              : 'border-gray-600 bg-gray-800 hover:border-gray-500 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ring-2 ${getTierRingColor(badge.multiplier)}`}>
                              <img src={badge.image} alt={badge.name} className="w-full h-full object-cover" />
                              {/* Banner in bottom left corner */}
                              <div className={`absolute bottom-0 left-0 ${getMultiplierColors(badge.multiplier)}`}>
                                <div className="text-xs font-black px-2 py-0.5 rounded-tr-lg">
                                  x{badge.multiplier}
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{badge.name}</p>
                              <p className="text-xs text-gray-400 truncate">{badge.title}</p>
                            </div>
                            {isEquipped ? (
                              <span className="text-green-400 text-sm font-bold whitespace-nowrap">Already equipped</span>
                            ) : isSelected ? (
                              <span className="text-yellow-400 text-sm font-bold">Selected</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status message */}
              {selectedSlot && selectedBadge && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 text-center">
                  <p className="text-yellow-400 text-sm">
                    Ready to equip badge to slot {selectedSlot}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={equipBadge}
            disabled={!canEquip}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              canEquip
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Equip Badge'}
          </button>
        </div>
      </div>
    </div>
  );
}
