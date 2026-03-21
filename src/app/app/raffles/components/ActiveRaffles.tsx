'use client';

import React, { useState } from 'react';
import { useRaffleCountdown } from '../hooks/useRaffleCountdown';

import { RaffleStatus } from '../types';

interface UserEntry {
  raffle_id: number;
  tickets: number;
  points_spent: number;
  purchased_at: string;
  title: string;
  status: RaffleStatus;
  ends_at: string | null;
  winner_wallet: string | null;
  image_url: string;
}

interface ActiveRafflesProps {
  entries: UserEntry[];
  wallet?: string;
  onBuyMore: (raffleId: number) => void;
}

function EntryImage({ entry, onClick }: { entry: UserEntry; onClick: () => void }) {
  return (
    <div className="w-28 h-28 md:w-44 md:h-44 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-yellow-400/50 transition-all cursor-pointer" onClick={onClick}>
      {entry.image_url ? (
        <img src={entry.image_url} alt={entry.title} className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <span className="text-2xl">🎟️</span>
        </div>
      )}
    </div>
  );
}

function RaffleStatusBadge({ entry }: { entry: UserEntry }) {
  if (entry.status === 'LIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black leading-none bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
        LIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black leading-none bg-gray-700 text-gray-300">
      TNM &middot; Waiting for players
    </span>
  );
}

function RaffleCountdown({ endsAt }: { endsAt: string }) {
  const { label } = useRaffleCountdown(endsAt);
  return <span className="text-yellow-400 font-bold ml-1">{label}</span>;
}

export default function ActiveRaffles({ entries, wallet, onBuyMore }: ActiveRafflesProps) {
  const active = entries.filter(e => e.status === 'TNM' || e.status === 'LIVE');
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden max-w-4xl mx-auto" style={{ isolation: 'isolate' } as React.CSSProperties}>
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
          <div className="mt-2 text-xs text-white/90 leading-relaxed">
            <p className="text-sm">
              Spend AMY Points to enter raffles and win prizes.<br />
              Every ticket has the same chance of winning — more tickets simply improve your odds.
            </p>

            <div className="mt-3">
              <p className="text-sm font-black text-yellow-400">Raffle Flow</p>
              <p className="text-[13px] font-semibold text-yellow-200  tracking-[0.3em] mt-0.5">
                Waiting for players → Countdown → Tickets close → Winner drawn
              </p>
            </div>

            <p className="mt-4">
              Each ticket costs <span className="text-white font-bold">50 AMY Points</span>.
            </p>

            <p className="mt-4 text-white font-semibold">Waiting for players (TNM)</p>
            <p className="mt-1">
              The raffle is filling up before the countdown begins. Tickets can still be purchased during this stage — every ticket bought brings the raffle closer to activating.
            </p>

            <p className="mt-2">
              Once minimum participation is reached, the raffle activates and the countdown begins.
            </p>

            <p className="mt-3 text-white font-semibold">Countdown (Raffle live)</p>
            <p className="mt-1">
              The clock is running and tickets remain available until the timer reaches zero. Countdown lengths vary by prize — some raffles run for around 24 hours, while others remain open for several days.
            </p>

            <p className="mt-3 text-white font-semibold">Winner drawn</p>
            <p className="mt-1">
              Around 10 minutes after the countdown ends, a winner is selected automatically.
            </p>

            <p className="mt-2">
              Example: if 100 tickets are sold and you hold 10, you have a 10% chance of winning.
            </p>

            <p className="mt-2">
              The draw uses on-chain randomness — fully automated, tamper-proof, and independently verifiable by anyone.
            </p>

            <p className="mt-2">
              Prizes are typically transferred within 24 hours of the raffle closing.
            </p>

            <p className="mt-2">
              New raffles are added regularly as others finish — keep an eye out for new prizes.
            </p>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-700/30">
        {!wallet ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">Connect your wallet to see your active raffles.</p>
          </div>
        ) : active.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">You have no active raffles. Buy tickets above to enter!</p>
          </div>
        ) : (
          active.map((entry) => (
            <div key={entry.raffle_id} className="px-4 py-4 md:px-5 md:py-4 space-y-2">
              <RaffleStatusBadge entry={entry} />

              <div className="flex items-center gap-4 landscape:gap-6 md:gap-12">
                <EntryImage entry={entry} onClick={() => onBuyMore(entry.raffle_id)} />

                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm leading-snug">
                    {entry.title} <span className="text-gray-500 text-xs font-mono font-normal">#{entry.raffle_id}</span>
                  </p>
                  
                  <div className="mt-1">
                    <p className="text-gray-400 text-xs font-semibold">
                      Tickets: <span className="text-white font-bold">{entry.tickets}</span>
                    </p>
                    {entry.status === 'LIVE' && entry.ends_at && (
                      <p className="text-gray-400 text-[11px] font-semibold mt-0.5 uppercase tracking-wider">
                        Ends in: <RaffleCountdown endsAt={entry.ends_at} />
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end md:justify-start mt-3">
                    <button
                      onClick={() => onBuyMore(entry.raffle_id)}
                      className="btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap"
                    >
                      Buy more
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
