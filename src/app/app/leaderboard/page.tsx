'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  isEligible: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
      const data = await response.json();

      if (data.entries) {
        setLeaderboard(data.entries);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionBadgeClass = (rank: number) => {
    if (rank === 1) return 'position-badge position-1';
    if (rank === 2) return 'position-badge position-2';
    if (rank === 3) return 'position-badge position-3';
    return 'position-badge';
  };

  const getPositionIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-4 mb-4">
              <span className="text-4xl md:text-6xl trophy-bounce">🏆</span>
              <h1 className="text-3xl md:text-5xl font-black text-yellow-400">LEADERBOARD</h1>
              <span className="text-4xl md:text-6xl trophy-bounce" style={{ animationDelay: '0.5s' }}>
                🏆
              </span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">
              Top $AMY holders and community members
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4" />
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="icon-badge mx-auto mb-4">❌</div>
              <p className="text-red-400">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="icon-badge mx-auto mb-4">📋</div>
              <p className="text-gray-400">No leaderboard entries yet</p>
            </div>
          ) : (
            <div className="space-y-4 custom-scrollbar max-h-[600px] overflow-y-auto">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="leaderboard-row"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={getPositionBadgeClass(entry.rank)}>
                      {getPositionIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-white truncate">
                          {entry.name}
                        </h3>
                        {entry.isEligible && (
                          <span className="status-eligible">ELIGIBLE</span>
                        )}
                      </div>
                      {entry.username && (
                        <a
                          href={`https://x.com/${entry.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          @{entry.username}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
