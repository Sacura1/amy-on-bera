'use client';

import React, { useState } from 'react';

interface CompletedRaffle {
  id: number;
  title: string;
  image_url: string;
  status: 'COMPLETED' | 'CANCELLED';
  winner_wallet: string | null;
  ends_at: string | null;
  total_tickets: number;
  user_tickets?: number;
  winner_probability?: number;
}

interface RaffleHistoryProps {
  history: CompletedRaffle[];
  wallet?: string | null;
}

function formatDate(ts: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' — ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

function formatProbability(value?: number | null) {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return num.toFixed(1);
}

function truncateWallet(w: string) {
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

export default function RaffleHistory({ history, wallet }: RaffleHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedWallet = wallet?.trim().toLowerCase() || null;

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden max-w-4xl mx-auto" style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', willChange: 'transform' } as React.CSSProperties}>
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-800/40 transition-colors"
      >
        <h2 className="text-xl font-black text-yellow-400">Raffle History</h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-700/50">
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-400 text-sm">Completed raffles will show here.</p>
            </div>
          ) : (
          <>
          <p className="px-4 md:px-6 py-3 text-xs text-gray-400">
            All completed raffles are recorded here for transparency
          </p>
          <div className="divide-y divide-gray-700/30">
          {history.map((raffle) => {
            const winnerProbability = formatProbability(raffle.winner_probability);
            const userTickets = raffle.user_tickets ?? 0;
            const youWon =
              normalizedWallet &&
              raffle.winner_wallet &&
              normalizedWallet === raffle.winner_wallet.toLowerCase();
            return (
              <div key={raffle.id} className="flex items-center gap-4 p-4">
              {raffle.image_url ? (
                <img
                  src={raffle.image_url}
                  alt={raffle.title}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎟️</span>
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm truncate">{raffle.title}</p>
                  <span className="text-gray-500 text-xs font-mono flex-shrink-0">#{raffle.id}</span>
                </div>
                {raffle.status === 'COMPLETED' ? (
                  <>
                    <p className="text-gray-400 text-xs">
                      Winner:{' '}
                      <span className="text-green-400 font-mono font-bold">
                        {raffle.winner_wallet ? truncateWallet(raffle.winner_wallet) : 'No entries'}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Drawn: {formatDate(raffle.ends_at)} &middot; {raffle.total_tickets} tickets
                    </p>
                    <p className="text-gray-400 text-xs font-semibold">Winner chance: {winnerProbability}%</p>
                    <p className="text-gray-400 text-xs flex gap-2 font-semibold">
                      <span>Your tickets: {userTickets}</span>
                      {youWon && (
                        <span className="text-green-400 font-semibold text-xs">You won!</span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-red-400 text-xs font-bold">CANCELLED</p>
                )}
                </div>
              </div>
            );
          })}
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}
