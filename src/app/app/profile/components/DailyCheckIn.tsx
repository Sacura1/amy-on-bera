'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, MINIMUM_AMY_BALANCE } from '@/lib/constants';

interface CheckInData {
  lastCheckinDate: string | null;
  currentStreakDay: number;
  streakPointsTotal: number;
  canCheckIn: boolean;
  nextCheckInTime: string | null;
}

interface DailyCheckInProps {
  walletAddress: string | null;
  amyBalance: number;
  isHolder: boolean;
  onPointsEarned?: (points: number) => void;
}

// Points per day based on streak
const getPointsForDay = (day: number): number => {
  if (day >= 1 && day <= 4) return 50;
  if (day === 5 || day === 6) return 75;
  if (day === 7) return 150;
  return 50; // Fallback
};

// Calculate total points for a streak
const calculateStreakPoints = (currentDay: number): number => {
  let total = 0;
  for (let i = 1; i <= currentDay; i++) {
    total += getPointsForDay(i);
  }
  return total;
};

export default function DailyCheckIn({ walletAddress, amyBalance, isHolder, onPointsEarned }: DailyCheckInProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dailyCheckInExpanded');
    if (saved !== null) {
      setIsExpanded(saved === 'true');
    }
  }, []);

  // Save expanded state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('dailyCheckInExpanded', String(newState));
  };

  // Fetch check-in data
  const fetchCheckInData = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/checkin/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        setCheckInData(data.data);
      }
    } catch (error) {
      console.error('Error fetching check-in data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress && isHolder) {
      fetchCheckInData();
    }
  }, [walletAddress, isHolder, fetchCheckInData]);

  // Countdown timer
  useEffect(() => {
    if (!checkInData?.nextCheckInTime || checkInData.canCheckIn) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const next = new Date(checkInData.nextCheckInTime!).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setCountdown('');
        fetchCheckInData(); // Refresh data
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [checkInData?.nextCheckInTime, checkInData?.canCheckIn, fetchCheckInData]);

  // Handle check-in
  const handleCheckIn = async () => {
    if (!walletAddress || !checkInData?.canCheckIn || isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/checkin/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        setJustCheckedIn(true);
        setCheckInData(data.data);

        // Notify parent of points earned
        if (onPointsEarned && data.data.pointsAwarded) {
          onPointsEarned(data.data.pointsAwarded);
        }

        // Reset the "just checked in" state after animation
        setTimeout(() => setJustCheckedIn(false), 3000);
      }
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Calculate display values
  const currentDay = checkInData?.currentStreakDay || 0;
  const displayDay = checkInData?.canCheckIn ? currentDay + 1 : currentDay;
  const streakPoints = checkInData?.streakPointsTotal || 0;

  // Render non-holder state
  if (!isHolder) {
    return (
      <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden mb-4">
        <button
          onClick={toggleExpanded}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
        >
          <h3 className="text-base font-bold text-yellow-400">Daily Check-In</h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Hold {MINIMUM_AMY_BALANCE}+ Amy to unlock</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-base font-bold text-yellow-400">Daily Check-In</h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="loading-spinner w-8 h-8" />
            </div>
          ) : (
            <>
              {/* Explanation */}
              <p className="text-gray-400 text-xs mb-4">
                Check in every day to build your streak and earn points. Miss a day and your streak resets to Day 1.
              </p>

              {/* Streak Progress - 7 boxes */}
              <div className="flex justify-between gap-1 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isCompleted = day <= currentDay;
                  const isCurrent = day === displayDay;
                  const isFuture = day > displayDay;

                  return (
                    <div
                      key={day}
                      className={`flex-1 aspect-square max-w-[40px] rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                        isCompleted
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black'
                          : isCurrent
                          ? 'bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 animate-pulse'
                          : 'bg-gray-800 border border-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        day
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Points Display */}
              <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-yellow-400 mb-1">
                    {streakPoints} Points
                  </div>
                  <div className="text-xs text-gray-400">
                    This Streak
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  {/* <div className="text-[10px] text-gray-500 text-center">
                    Days 1-4: 50pts | Day 5-6: 75pts | Day 7: 150pts
                  </div> */}
                </div>
              </div>

              {/* Check-In Button - Always visible */}
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn || !checkInData?.canCheckIn}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                  justCheckedIn
                    ? 'bg-green-500 text-white'
                    : checkInData?.canCheckIn
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black'
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCheckingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="loading-spinner" style={{ width: 20, height: 20, margin: 0 }} />
                    Checking In...
                  </span>
                ) : justCheckedIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Checked In!
                  </span>
                ) : !checkInData?.canCheckIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Checked In Today
                  </span>
                ) : (
                  'Check In'
                )}
              </button>
              {/* Countdown shown below button when already checked in */}
              {!checkInData?.canCheckIn && countdown && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Next check-in in {countdown}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
