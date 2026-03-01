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

function EntryThumbnail({ entry }: { entry: UserEntry }) {
  const { label, expired } = entry.status === 'LIVE' && entry.ends_at
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useCompactCountdown(entry.ends_at)
    : { label: '', expired: false };

  return (
    <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
      {/* Badge sits ABOVE the image, outside it */}
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
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
        {entry.image_url ? (
          <img src={entry.image_url} alt={entry.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-xl">🎟️</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActiveRaffles({ entries, onBuyMore }: ActiveRafflesProps) {
  const active = entries.filter(e => e.status === 'TNM' || e.status === 'LIVE');
  if (active.length === 0) return null;

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-700/50">
        <h2 className="text-xl font-black text-yellow-400">My Active Raffles</h2>
        <div className="mt-1.5 space-y-0.5">
          <p className="text-xs text-gray-500">Each ticket costs 50 AMY Points. More tickets = higher probability.</p>
          <p className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">TNM</span> = Threshold Not Met — minimum participation hasn&apos;t been reached yet.
          </p>
          <p className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">Countdown</span> — when it hits zero the winner is drawn automatically.
          </p>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-700/30">
        {active.map((entry) => (
          <div
            key={entry.raffle_id}
            className="grid items-center gap-3 px-4 py-3 md:px-5 md:py-4"
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
          >
            <EntryThumbnail entry={entry} />

            {/* Purchased info — 1fr guarantees it gets all leftover space */}
            <div className="overflow-hidden">
              <p className="text-white font-black text-xs md:text-sm leading-snug">Purchased</p>
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
