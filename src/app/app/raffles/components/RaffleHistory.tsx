'use client';

import { useState } from 'react';

interface CompletedRaffle {
  id: number;
  title: string;
  image_url: string;
  status: 'COMPLETED' | 'CANCELLED';
  winner_wallet: string | null;
  ends_at: string | null;
  total_tickets: number;
}

interface RaffleHistoryProps {
  history: CompletedRaffle[];
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

function truncateWallet(w: string) {
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

export default function RaffleHistory({ history }: RaffleHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
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
          <p className="px-4 md:px-6 py-3 text-xs text-gray-500">
            All completed raffles are recorded here for transparency
          </p>
          <div className="divide-y divide-gray-700/30">
          {history.map((raffle) => (
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
                <p className="text-white font-bold text-sm truncate">{raffle.title}</p>
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
                  </>
                ) : (
                  <p className="text-red-400 text-xs font-bold">CANCELLED</p>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
