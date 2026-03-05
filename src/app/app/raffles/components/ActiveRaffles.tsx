'use client';

import React, { useEffect, useState } from 'react';

interface UserEntry {
  raffle_id: number;
  tickets: number;
  points_spent: number;
  purchased_at: string;
  title: string;
  status: 'TNM' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  ends_at: string | null;
  winner_wallet: string | null;
  image_url: string;
}

interface ActiveRafflesProps {
  entries: UserEntry[];
  wallet?: string;
  onBuyMore: (raffleId: number) => void;
}

function useCompactCountdown(endsAt: string) {
  const [label, setLabel] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setLabel('Drawing...'); setExpired(true); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return { label, expired };
}

function EntryThumbnail({ entry, onClick }: { entry: UserEntry; onClick: () => void }) {
  const { label, expired } = entry.status === 'LIVE' && entry.ends_at
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useCompactCountdown(entry.ends_at)
    : { label: '', expired: false };

  return (
    <div className="flex flex-col items-center flex-shrink-0 gap-0.5 cursor-pointer" onClick={onClick}>
      {/* Badge sits ABOVE the image */}
      {entry.status === 'LIVE' ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black leading-none ${
          expired ? 'bg-purple-600 text-white' : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
        }`}>
          {label}
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black leading-none bg-gray-700 text-gray-300">
          TNM &middot; Waiting for players
        </span>
      )}

      {/* Image below the badge */}
      <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-yellow-400/50 transition-all">
        {entry.image_url ? (
          <img src={entry.image_url} alt={entry.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-2xl">🎟️</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActiveRaffles({ entries, wallet, onBuyMore }: ActiveRafflesProps) {
  const active = entries.filter(e => e.status === 'TNM' || e.status === 'LIVE');
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    // bg-gray-900 (fully opaque) avoids Safari desktop subpixel blur caused by
    // semi-transparent bg + overflow:hidden + border-radius compositing
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden max-w-4xl mx-auto" style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', willChange: 'transform' } as React.CSSProperties}>
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-yellow-400">My Active Raffles</h2>
          <button onClick={() => setInfoOpen(o => !o)} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${infoOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {infoOpen && (
          <div className="mt-2 space-y-2.5 text-xs text-gray-500 leading-relaxed">
            <p>Spend AMY Points to enter raffles and win prizes.<br />Every ticket has the same chance of winning — more tickets simply improve your odds.</p>

            <div>
              <p className="text-sm font-bold text-gray-300">Raffle Flow</p>
              <p className="text-[13px] font-semibold text-gray-400 mt-0.5">Waiting for players → Countdown → Tickets close → Winner drawn</p>
            </div>

            <p>Each ticket costs <span className="text-gray-300 font-bold">50 AMY Points</span>.</p>

            <div>
              <p className="text-gray-300 font-bold">Waiting for players (TNM)</p>
              <p className="mt-0.5">The raffle is filling up before the countdown begins. Tickets can still be purchased during this stage — every ticket bought brings the raffle closer to activating.</p>
              <p className="mt-1.5">Once minimum participation is reached, the raffle activates and the countdown begins.</p>
            </div>

            <div>
              <p className="text-gray-300 font-bold">Countdown (Raffle live)</p>
              <p className="mt-0.5">The clock is running and tickets remain available until the timer reaches zero. Countdown lengths vary by prize — some raffles run for around 24 hours, while others remain open for several days.</p>
            </div>

            <div>
              <p className="text-gray-300 font-bold">Winner drawn</p>
              <p className="mt-0.5">Around 10 minutes after the countdown ends, a winner is selected automatically.</p>
              <p className="mt-1.5">Example: if 100 tickets are sold and you hold 10, you have a 10% chance of winning.</p>
              <p className="mt-1.5">The draw uses on-chain randomness — fully automated, tamper-proof, and independently verifiable by anyone.</p>
              <p className="mt-1.5">Prizes are typically transferred within 24 hours of the raffle closing.</p>
            </div>

            <p>New raffles are added regularly as others finish — keep an eye out for new prizes.</p>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-700/30">
        {!wallet ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">Connect your wallet to see your active raffles.</p>
          </div>
        ) : active.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">You have no active raffles. Buy tickets above to enter!</p>
          </div>
        ) : (
          active.map((entry) => (
            <div
              key={entry.raffle_id}
              className="flex items-center gap-12 px-4 py-3 md:px-5 md:py-4"
            >
              {/* Thumbnail — gap-5 gives clear breathing room between image and text */}
              <EntryThumbnail entry={entry} onClick={() => onBuyMore(entry.raffle_id)} />

              {/* Text expands, pushing all Buy More buttons to the same right-aligned position */}
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <div className="flex-1 overflow-hidden min-w-0">
                  <p className="text-white font-black text-sm leading-snug truncate">{entry.title}</p>
                  <p className="text-gray-500 text-xs font-mono mt-0.5">#{entry.raffle_id}</p>
                  <p className="text-gray-400 text-xs font-semibold mt-0.5">
                    Tickets: <span className="text-white font-bold">{entry.tickets}</span>
                  </p>
                </div>

                <button
                  onClick={() => onBuyMore(entry.raffle_id)}
                  className="btn-samy btn-samy-enhanced text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap flex-shrink-0 mr-8 md:mr-14"
                >
                  Buy more
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
