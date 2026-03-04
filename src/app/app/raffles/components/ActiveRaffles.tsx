'use client';

import { useEffect, useState } from 'react';

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
          TNM
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

export default function ActiveRaffles({ entries, onBuyMore }: ActiveRafflesProps) {
  const active = entries.filter(e => e.status === 'TNM' || e.status === 'LIVE');

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-700/50">
        <h2 className="text-xl font-black text-yellow-400">My Active Raffles</h2>
        <div className="mt-1.5 space-y-1">
          <p className="text-xs text-gray-500">Each ticket costs 50 AMY Points. More tickets = higher probability.</p>
          <p className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">TNM</span> = Threshold Not Met — minimum participation hasn&apos;t been reached yet.
          </p>
          <p className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">Countdown</span> — when it hits zero, ticket sales close.
          </p>
          <p className="text-xs text-gray-500">
            Winners are selected automatically approximately 10 minutes after countdown ends using a publicly verifiable blockchain-based randomness source. The draw is fully automated and applied uniformly across all tickets.
          </p>
          <p className="text-xs text-gray-500">
            Prizes are typically transferred within 24 hours of raffle close.
          </p>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-700/30">
        {active.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">Your active raffles will appear here.</p>
          </div>
        )}
        {active.map((entry) => (
          <div
            key={entry.raffle_id}
            className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4"
          >
            <EntryThumbnail entry={entry} onClick={() => onBuyMore(entry.raffle_id)} />

            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-snug truncate">{entry.title}</p>
              <p className="text-gray-500 text-xs font-mono mt-0.5">#{entry.raffle_id}</p>
              <p className="text-gray-400 text-xs font-semibold mt-0.5">
                Tickets: <span className="text-white font-bold">{entry.tickets}</span>
              </p>
            </div>

            {/* Buy more */}
            <button
              onClick={() => onBuyMore(entry.raffle_id)}
              className="btn-samy btn-samy-enhanced text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap"
            >
              Buy more
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
