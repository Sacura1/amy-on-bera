'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';

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
  DAILY_EARN: 'Daily Points Earned',
  GIVEAWAY: 'Amy Point Giveaway',
  COSMETIC_BACKGROUND_BUY: 'Background Purchase',
  COSMETIC_FILTER_BUY: 'Filter Purchase',
  RAFFLE_ENTRY: 'Raffle Entry',
  PREDICTION_WAGER: 'Prediction Market Wager',
  PREDICTION_PAYOUT: 'Prediction Market Payout',
  PREDICTION_REFUND: 'Prediction Market Refund'
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  DAILY_EARN: '+',
  GIVEAWAY: '+',
  COSMETIC_BACKGROUND_BUY: '-',
  COSMETIC_FILTER_BUY: '-',
  RAFFLE_ENTRY: '-',
  PREDICTION_WAGER: '-',
  PREDICTION_PAYOUT: '+',
  PREDICTION_REFUND: '+'
};

interface PointsHistoryProps {
  walletAddress: string | undefined;
}

export default function PointsHistory({ walletAddress }: PointsHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/points/history/${walletAddress}?limit=50`);
      const data = await response.json();

      if (data.success && data.data) {
        setHistory(data.data);
      } else {
        setError('Failed to load history');
      }
    } catch (err) {
      console.error('Error fetching points history:', err);
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch history when expanded
  useEffect(() => {
    if (isExpanded && walletAddress && history.length === 0) {
      fetchHistory();
    }
  }, [isExpanded, walletAddress, fetchHistory, history.length]);

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
    if (entry.reason === 'hourly_earning') return 'Daily Points Earned';
    return entry.reason || 'Points Update';
  };

  const getDescription = (entry: HistoryEntry): string => {
    if (entry.description) return entry.description;
    // Fallback for legacy entries
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

  if (!walletAddress) return null;

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden mb-6 md:mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <h2 className="text-base font-bold text-yellow-400">Points History</h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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
                onClick={fetchHistory}
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

              {/* History Entries */}
              {history.map((entry, index) => (
                <div
                  key={index}
                  className="bg-gray-800/40 rounded-xl p-3 md:p-4 hover:bg-gray-800/60 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-gray-400">
                        {formatDate(entry.createdAt)}
                      </div>
                      <div className={`text-lg font-bold ${getPointsColor(entry.pointsEarned)}`}>
                        {formatPoints(entry.pointsEarned)}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-yellow-300">
                      {getDisplayCategory(entry)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getDescription(entry)}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-4 gap-4 items-center">
                    <div className="text-sm text-gray-300">
                      {formatDate(entry.createdAt)}
                    </div>
                    <div className="text-sm font-medium text-yellow-300">
                      {getDisplayCategory(entry)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {getDescription(entry)}
                    </div>
                    <div className={`text-right text-lg font-bold ${getPointsColor(entry.pointsEarned)}`}>
                      {formatPoints(entry.pointsEarned)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button (if needed in future) */}
              {history.length >= 50 && (
                <div className="text-center pt-4">
                  <span className="text-sm text-gray-500">
                    Showing last 50 entries
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
