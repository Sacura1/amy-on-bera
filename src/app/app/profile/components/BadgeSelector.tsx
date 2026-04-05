'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface BadgeData {
  badge_id: string;
  badge_title: string;
  badge_image: string;
  is_active: boolean;
  current_tier_level: 0 | 1 | 2 | 3;
  current_tier_name: 'inactive' | 'bronze' | 'silver' | 'gold';
  current_multiplier: number;
}

interface EquippedBadge {
  slotNumber: number;
  badgeId: string;
}

interface BadgeSelectorProps {
  wallet: string;
  isOpen: boolean;
  onClose: () => void;
  onBadgesUpdated: () => void;
}

const TIER_RING: Record<string, string> = {
  bronze: 'ring-amber-600',
  silver: 'ring-slate-400',
  gold:   'ring-yellow-400',
};

const TIER_BANNER: Record<string, string> = {
  bronze: 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100',
  silver: 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900',
  gold:   'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950',
};

export default function BadgeSelector({
  wallet,
  isOpen,
  onClose,
  onBadgesUpdated
}: BadgeSelectorProps) {
  const [equippedBadges, setEquippedBadges] = useState<EquippedBadge[]>([]);
  const [activeBadges, setActiveBadges]     = useState<BadgeData[]>([]);
  const [selectedSlot, setSelectedSlot]     = useState<number | null>(null);
  const [selectedBadge, setSelectedBadge]   = useState<string | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSaving, setIsSaving]             = useState(false);

  useEffect(() => {
    if (!wallet || !isOpen) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, badgesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/profile/${wallet}`),
          fetch(`${API_BASE_URL}/api/badges/${wallet}/active`),
        ]);
        const profileData = await profileRes.json();
        const badgesData  = await badgesRes.json();

        if (profileData.success && profileData.data.badges?.equipped) {
          setEquippedBadges(profileData.data.badges.equipped);
        }
        if (badgesData.success) {
          setActiveBadges(badgesData.data.filter((b: BadgeData) => b.is_active));
        }
      } catch (e) {
        console.error('Error fetching badge data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [wallet, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSlot(null);
      setSelectedBadge(null);
    }
  }, [isOpen]);

  const getBadgeForSlot = (slotNumber: number): BadgeData | null => {
    const equipped = equippedBadges.find(b => b.slotNumber === slotNumber);
    if (!equipped) return null;
    return activeBadges.find(b => b.badge_id === equipped.badgeId) || null;
  };

  const isBadgeEquipped = (badgeId: string) =>
    equippedBadges.some(b => b.badgeId === badgeId);

  const multTier   = (b: BadgeData) => b.current_multiplier >= 10 ? 'gold' : b.current_multiplier >= 5 ? 'silver' : 'bronze';
  const tierRing   = (b: BadgeData) => TIER_RING[multTier(b)]   ?? 'ring-gray-600';
  const tierBanner = (b: BadgeData) => TIER_BANNER[multTier(b)] ?? '';
  const badgeSubtitle = (b: BadgeData) => b.badge_title.split(' – ')[1] ?? '';

  const equipBadge = async () => {
    if (selectedSlot === null || selectedBadge === null) return;
    try {
      setIsSaving(true);
      const res  = await fetch(`${API_BASE_URL}/api/badges/${wallet}/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotNumber: selectedSlot, badgeId: selectedBadge }),
      });
      const data = await res.json();
      if (data.success) {
        setEquippedBadges(data.data);
        setSelectedSlot(null);
        setSelectedBadge(null);
        onBadgesUpdated();
      } else {
        alert(data.error || 'Failed to equip badge');
      }
    } catch {
      alert('Failed to equip badge');
    } finally {
      setIsSaving(false);
    }
  };

  const unequipBadge = async (slotNumber: number) => {
    try {
      setIsSaving(true);
      const res  = await fetch(`${API_BASE_URL}/api/badges/${wallet}/unequip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setEquippedBadges(data.data);
        onBadgesUpdated();
      }
    } catch {
      console.error('Error unequipping badge');
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
        {/* Header */}
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
              <div className="loading-spinner w-8 h-8" />
            </div>
          ) : (
            <>
              {/* Slot row */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  1. Select a slot
                </h3>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((slotNumber) => {
                    const badge     = getBadgeForSlot(slotNumber);
                    const isSelected = selectedSlot === slotNumber;
                    return (
                      <div key={slotNumber} className="relative">
                        <div
                          className={`relative w-14 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-900/30 scale-110'
                              : badge
                              ? `ring-2 ${tierRing(badge)} bg-white hover:scale-105`
                              : 'border-gray-600/50 bg-gray-800/50 border-dashed hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedSlot(slotNumber)}
                        >
                          {badge ? (
                            <>
                              <img src={badge.badge_image} alt={badge.badge_title} className="w-full h-full object-cover" />
                              <div className={`absolute bottom-0 left-0 ${tierBanner(badge)}`}>
                                <div className="text-[10px] font-black px-1.5 py-0.5 rounded-tr-lg">
                                  x{badge.current_multiplier}
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className={`text-sm ${isSelected ? 'text-yellow-400 font-bold' : 'text-gray-500'}`}>
                              {slotNumber}
                            </span>
                          )}
                        </div>
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
                  <p className="text-center text-sm text-yellow-400 mt-2">Slot {selectedSlot} selected</p>
                )}
              </div>

              {/* Badge list */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  2. Select a badge ({activeBadges.length} available)
                </h3>
                {activeBadges.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">No active multiplier badges yet.</p>
                    <p className="text-gray-600 text-sm">Earn badges by providing LP, holding tokens, or earning role badges.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeBadges.map((badge) => {
                      const isEquipped = isBadgeEquipped(badge.badge_id);
                      const isSelected = selectedBadge === badge.badge_id;
                      return (
                        <div
                          key={badge.badge_id}
                          onClick={() => { if (!isEquipped) setSelectedBadge(badge.badge_id); }}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isEquipped
                              ? 'border-green-500/50 bg-green-900/20 cursor-not-allowed'
                              : isSelected
                              ? 'border-yellow-400 bg-yellow-900/30 cursor-pointer'
                              : 'border-gray-600 bg-gray-800 hover:border-gray-500 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ring-2 ${tierRing(badge)}`}>
                              <img src={badge.badge_image} alt={badge.badge_title} className="w-full h-full object-cover" />
                              <div className={`absolute bottom-0 left-0 ${tierBanner(badge)}`}>
                                <div className="text-xs font-black px-2 py-0.5 rounded-tr-lg">
                                  x{badge.current_multiplier}
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">
                                {badge.badge_title}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{badgeSubtitle(badge)}</p>
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

              {selectedSlot && selectedBadge && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 text-center">
                  <p className="text-yellow-400 text-sm">Ready to equip badge to slot {selectedSlot}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
          >
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
