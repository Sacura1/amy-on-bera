'use client';

import Link from 'next/link';
import { useActiveAccount } from 'thirdweb/react';
import { useAmyBalance } from '@/hooks';
import { MINIMUM_AMY_BALANCE } from '@/lib/constants';

export default function AppPage() {
  const account = useActiveAccount();
  const { balance, isLoading, isEligible } = useAmyBalance();

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-6 md:p-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-6 text-yellow-400">
            Welcome to $AMY
          </h1>

          {!account ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-lg">
                Connect your wallet to access the $AMY ecosystem.
              </p>
              <div className="icon-badge mx-auto">🔗</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Display */}
              <div className="glass-card p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-badge-small">💰</div>
                    <div className="text-left">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
                        Your Holdings
                      </div>
                      <div className="text-lg md:text-xl text-yellow-300 font-bold">
                        $AMY Balance
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isLoading ? (
                      <div className="loading-spinner w-8 h-8" />
                    ) : (
                      <>
                        <div className="text-3xl md:text-4xl font-black hero-text">
                          {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">tokens</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-400/20">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-400">Minimum Required:</span>
                    <span className="text-yellow-300 font-bold">{MINIMUM_AMY_BALANCE} $AMY</span>
                  </div>
                </div>
              </div>

              {/* Eligibility Status */}
              <div className="glass-card p-6 md:p-8">
                <div className="text-center">
                  <div className="icon-badge mx-auto mb-4">
                    {isEligible ? '✅' : '⚠️'}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">
                    {isEligible ? 'You are Eligible!' : 'Not Yet Eligible'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {isEligible
                      ? 'You hold enough $AMY to access all features.'
                      : `You need at least ${MINIMUM_AMY_BALANCE} $AMY tokens to be eligible.`}
                  </p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/app/profile"
                  className="btn-samy btn-samy-enhanced text-white px-4 py-3 rounded-full text-center font-bold"
                >
                  PROFILE
                </Link>
                <Link
                  href="/app/leaderboard"
                  className="btn-samy btn-samy-enhanced text-white px-4 py-3 rounded-full text-center font-bold"
                >
                  LEADERBOARDS
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
