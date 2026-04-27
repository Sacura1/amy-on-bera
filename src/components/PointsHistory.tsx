'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface MultiplierEntry {
  name: string;
  multiplier: number;
}

interface ParsedDescription {
  total_multiplier: number;
  multiplier_breakdown: MultiplierEntry[];
}

interface HistoryEntry {
  pointsEarned: number;
  reason: string;
  category: string | null;
  description: string | null;
  amyBalanceAtTime: number;
  tierAtTime: string;
  createdAt: string;
}

// Category display names
const CATEGORY_DISPLAY: Record<string, string> = {
  DAILY_EARN: 'Points Earned (This Hour)',
  GIVEAWAY: 'Amy Point Giveaway',
  COSMETIC_BACKGROUND_BUY: 'Background Purchase',
  COSMETIC_FILTER_BUY: 'Filter Purchase',
  RAFFLE_ENTRY: 'Raffle Entry',
  REFERRAL_INITIAL: 'Referral Bonus',
  PARTNER_REWARD: 'Partner Reward',
  DAILY_CHECKIN: 'Daily Check-in',
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  DAILY_EARN: '+',
  GIVEAWAY: '+',
  COSMETIC_BACKGROUND_BUY: '-',
  COSMETIC_FILTER_BUY: '-',
  RAFFLE_ENTRY: '-',
  REFERRAL_INITIAL: '+',
  PARTNER_REWARD: '+',
  DAILY_CHECKIN: '+',
};

const HISTORY_PAGE_SIZE = 20;

interface PointsHistoryProps {
  walletAddress: string | undefined;
}

export default function PointsHistory({ walletAddress }: PointsHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const fetchHistory = useCallback(async ({ page = 0, append = false } = {}) => {
    if (!walletAddress) return;

    if (append) {
      setIsLoadingMoreHistory(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/points/history/${walletAddress}?limit=${HISTORY_PAGE_SIZE}&offset=${page * HISTORY_PAGE_SIZE}`);
      const data = await response.json();

      if (data.success && data.data) {
        setHistory((prev) => (append ? [...prev, ...data.data] : data.data));
        setHasMoreHistory(data.data.length === HISTORY_PAGE_SIZE);
        setHistoryPage(page);
      } else {
        setError('Failed to load history');
      }
    } catch (err) {
      console.error('Error fetching points history:', err);
      setError('Failed to load history');
    } finally {
      if (append) {
        setIsLoadingMoreHistory(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [walletAddress]);

  // Fetch history when expanded
  useEffect(() => {
    if (isExpanded && walletAddress && history.length === 0) {
      fetchHistory();
    }
  }, [isExpanded, walletAddress, fetchHistory, history.length]);

  useEffect(() => {
    setHistory([]);
    setHistoryPage(0);
    setHasMoreHistory(true);
    setIsLoadingMoreHistory(false);
  }, [walletAddress]);

  // Close filter menu on outside click
  useEffect(() => {
    if (!showFilterMenu) return;
    const close = () => setShowFilterMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showFilterMenu]);

  const loadMoreHistory = () => {
    if (!hasMoreHistory || isLoadingMoreHistory) return;
    fetchHistory({ page: historyPage + 1, append: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayCategory = (entry: HistoryEntry): string => {
    if (entry.category && CATEGORY_DISPLAY[entry.category]) {
      return CATEGORY_DISPLAY[entry.category];
    }
    // Fallback for legacy entries without category
    if (entry.reason?.startsWith('purchase_')) {
      if (entry.reason.includes('bg_')) return 'Background Purchase';
      if (entry.reason.includes('filter_')) return 'Filter Purchase';
      return 'Purchase';
    }
    if (entry.reason === 'admin_bonus') return 'Amy Point Giveaway';
    if (entry.reason === 'hourly_earning') return 'Points Earned (This Hour)';
    return entry.reason || 'Points Update';
  };

  const getCategoryKey = (entry: HistoryEntry): string => {
    if (entry.category) return entry.category;
    if (entry.reason?.startsWith('purchase_')) {
      if (entry.reason.includes('bg_')) return 'COSMETIC_BACKGROUND_BUY';
      if (entry.reason.includes('filter_')) return 'COSMETIC_FILTER_BUY';
    }
    if (entry.reason === 'admin_bonus') return 'GIVEAWAY';
    if (entry.reason === 'hourly_earning') return 'DAILY_EARN';
    return entry.reason || 'OTHER';
  };

  const parseDescription = (entry: HistoryEntry): ParsedDescription | null => {
    if (!entry.description) return null;
    try {
      const parsed = JSON.parse(entry.description);
      if (parsed.total_multiplier && Array.isArray(parsed.multiplier_breakdown)) return parsed;
    } catch {}
    return null;
  };

  const getDescription = (entry: HistoryEntry): string => {
    const parsed = parseDescription(entry);
    if (parsed) return `${parsed.total_multiplier}x total multiplier`;
    if (entry.description) return entry.description;
    return getDisplayCategory(entry);
  };

  const getPointsColor = (points: number): string => {
    if (points > 0) return 'text-green-400';
    if (points < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatPoints = (points: number): string => {
    const absPoints = Math.abs(points);
    const formatted = absPoints.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return points >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const clearFilters = () => setSelectedCategories([]);

  const hasActiveFilters = selectedCategories.length > 0;

  // Always pin these three; merge with whatever else is in loaded history
  const PINNED_CATEGORIES = ['DAILY_EARN', 'DAILY_CHECKIN', 'PARTNER_REWARD'];
  const availableCategories = Array.from(
    new Set([...PINNED_CATEGORIES, ...history.map(getCategoryKey)])
  ).filter((key) => key in CATEGORY_DISPLAY).sort((a, b) => {
    const labelA = CATEGORY_DISPLAY[a];
    const labelB = CATEGORY_DISPLAY[b];
    return labelA.localeCompare(labelB);
  });

  const filteredHistory = hasActiveFilters
    ? history.filter((entry) => selectedCategories.includes(getCategoryKey(entry)))
    : history;

  if (!walletAddress) return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 mb-6 md:mb-8">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-yellow-400">Points History</h2>
      </div>
      <div className="border-t border-gray-700/50 px-4 py-8 text-center">
        <p className="text-gray-500 text-sm">Connect your wallet to view your points history.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 mb-6 md:mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <h2 className="text-base font-bold text-yellow-400">Points History</h2>
        <div className="flex items-center gap-2">
          {/* Filter button — shown only when expanded */}
          {isExpanded && (
            <div
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu((v) => !v);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                  hasActiveFilters
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {hasActiveFilters && (
                  <span className="ml-0.5 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              {/* Filter dropdown */}
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-gray-800 rounded-xl border border-gray-700 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Filter by category</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="px-2 py-2 max-h-72 overflow-y-auto">
                    {availableCategories.map((key) => {
                      const label = CATEGORY_DISPLAY[key] ?? key;
                      const isSelected = selectedCategories.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleCategory(key)}
                          className="w-full flex items-center gap-2 py-2 px-2 hover:bg-gray-700/50 rounded transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-gray-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-white text-left">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner w-8 h-8" />
            </div>
          ) : error ? (
              <div className="text-center py-8 text-red-400">
                {error}
                <button
                  onClick={() => fetchHistory()}
                  className="ml-2 underline hover:text-red-300"
                >
                  Retry
                </button>
              </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No points history yet. Start earning points by holding $AMY!
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-700/50">
                <div>Date</div>
                <div>Category</div>
                <div>Description</div>
                <div className="text-right">Points</div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No entries match the selected filter.
                  <button onClick={clearFilters} className="ml-2 text-yellow-400 hover:text-yellow-300 underline">
                    Clear filter
                  </button>
                </div>
              ) : (
                <>
                  {/* History Entries */}
                  {filteredHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/40 rounded-xl p-3 md:p-4 hover:bg-gray-800/60 transition-colors"
                    >
                      {(() => {
                        const parsed = parseDescription(entry);
                        return (
                          <>
                            {/* Mobile Layout */}
                            <div className="md:hidden space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="text-xs text-gray-400">{formatDate(entry.createdAt)}</div>
                                <div className={`text-lg font-bold ${getPointsColor(entry.pointsEarned)}`}>{formatPoints(entry.pointsEarned)}</div>
                              </div>
                              <div className="text-sm font-medium text-yellow-300">{getDisplayCategory(entry)}</div>
                              {parsed ? (
                                <div className="text-xs text-gray-400">
                                  <span className="text-white font-semibold">{parsed.total_multiplier}x</span> total
                                  {parsed.multiplier_breakdown.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {parsed.multiplier_breakdown.map((b, i) => (
                                        <span key={i} className="bg-gray-700/60 rounded px-1.5 py-0.5">{b.name} {b.multiplier}x</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">{getDescription(entry)}</div>
                              )}
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:grid grid-cols-4 gap-4 items-start">
                              <div className="text-sm text-gray-300">{formatDate(entry.createdAt)}</div>
                              <div className="text-sm font-medium text-yellow-300">{getDisplayCategory(entry)}</div>
                              <div className="text-sm text-gray-400">
                                {parsed ? (
                                  <>
                                    <span className="text-white font-semibold">{parsed.total_multiplier}x</span> total
                                    {parsed.multiplier_breakdown.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {parsed.multiplier_breakdown.map((b, i) => (
                                          <span key={i} className="bg-gray-700/60 rounded px-1.5 py-0.5 text-xs">{b.name} {b.multiplier}x</span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                ) : getDescription(entry)}
                              </div>
                              <div className={`text-right text-lg font-bold ${getPointsColor(entry.pointsEarned)}`}>{formatPoints(entry.pointsEarned)}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}

                  {hasMoreHistory && history.length > 0 && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={loadMoreHistory}
                        disabled={isLoadingMoreHistory}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {isLoadingMoreHistory ? 'Loading more history...' : 'Load more history'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
