'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface Raffle {
  id: number;
  title: string;
  prize_description: string;
  image_url: string;
  ticket_cost: number;
  status: 'TNM' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  countdown_hours: number;
  ends_at: string | null;
  total_tickets: number;
  unique_participants: number;
  total_points_committed: number;
}

interface TicketModalProps {
  raffle: Raffle;
  userCurrentTickets: number;
  pointsBalance: number;
  wallet: string;
  onClose: () => void;
  onSuccess: () => void;
}

function useCountdown(endsAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!endsAt) return;
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Drawing...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return timeLeft;
}

export default function TicketModal({ raffle, userCurrentTickets, pointsBalance, wallet, onClose, onSuccess }: TicketModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchased, setPurchased] = useState<{ quantity: number; raffleName: string; imageUrl: string } | null>(null);

  const totalCost = quantity * (raffle.ticket_cost || 50);
  const hasEnough = pointsBalance >= totalCost;
  const countdown = useCountdown(raffle.ends_at);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  const handleBuy = async () => {
    if (!hasEnough || quantity < 1) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/raffles/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': wallet,
        },
        body: JSON.stringify({ wallet, raffleId: raffle.id, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        setPurchased({ quantity, raffleName: raffle.title, imageUrl: raffle.image_url });
      } else {
        setError(data.error || 'Failed to buy tickets');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success confirmation screen
  if (purchased) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        <div className="bg-gray-900 border border-yellow-400/40 rounded-2xl overflow-hidden max-w-xs w-full text-center">
          {purchased.imageUrl ? (
            <img src={purchased.imageUrl} alt={purchased.raffleName} className="w-full h-28 object-cover" />
          ) : (
            <div className="w-full h-28 bg-gray-800 flex items-center justify-center text-4xl">🎟️</div>
          )}
          <div className="p-5">
          <h3 className="text-yellow-400 font-black text-base mb-2">Purchase Successful!</h3>
          <p className="text-gray-300 text-sm mb-5">
            You have successfully purchased{' '}
            <span className="text-white font-bold">
              {purchased.quantity} ticket{purchased.quantity !== 1 ? 's' : ''}
            </span>{' '}
            for{' '}
            <span className="text-yellow-400 font-bold">{purchased.raffleName}</span>!
          </p>
          <button
            onClick={onClose}
            className="w-full btn-samy btn-samy-enhanced text-white py-2.5 rounded-full font-bold uppercase text-sm"
          >
            OK
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.45)', paddingRight: '5%' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-gray-900 border border-yellow-400/30 rounded-2xl w-60 overflow-hidden">
        {/* Header image */}
        <div className="relative">
          {raffle.image_url ? (
            <img src={raffle.image_url} alt={raffle.title} className="w-full h-20 object-cover" />
          ) : (
            <div className="w-full h-20 bg-gray-800 flex items-center justify-center">
              <span className="text-4xl">🎟️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — no scroll */}
        <div className="p-3">
          <h2 className="text-sm font-black text-yellow-400 mb-1.5">{raffle.title}</h2>

          {/* Status block */}
          {raffle.status === 'TNM' && (
            <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg px-2.5 py-2 mb-2">
              <p className="text-orange-400 font-bold text-xs mb-0.5">Status: Threshold Not Met</p>
              <p className="text-gray-400 text-xs leading-snug">This raffle activates once minimum participation is reached. Draws 72 hours after activation.</p>
            </div>
          )}
          {raffle.status === 'LIVE' && (
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg px-2.5 py-2 mb-2">
              <p className="text-green-400 font-bold text-xs mb-0.5">Status: Live</p>
              <p className="text-gray-400 text-xs">Draw ends in <span className="text-white font-bold">{countdown || '...'}</span>.</p>
            </div>
          )}

          <div className="bg-gray-800/60 rounded-lg p-2 mb-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Cost/ticket</span>
              <span className="text-white font-bold">{raffle.ticket_cost || 50} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Your tickets</span>
              <span className="text-white font-bold">{userCurrentTickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Balance</span>
              <span className={`font-bold ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                {pointsBalance.toLocaleString()} pts
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-2">
            <label className="block text-xs text-gray-400 mb-1">Tickets</label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition-colors"
              >−</button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center bg-gray-800 border border-gray-600 rounded-lg py-1 text-white font-bold text-sm focus:border-yellow-400 focus:outline-none"
              />
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mb-2 px-2 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <span className="text-gray-300 text-xs">Total</span>
            <span className={`font-black text-sm ${hasEnough ? 'text-yellow-400' : 'text-red-400'}`}>
              {totalCost.toLocaleString()} pts
            </span>
          </div>

          {!hasEnough && (
            <p className="text-red-400 text-xs text-center mb-2">
              Need {(totalCost - pointsBalance).toLocaleString()} more pts
            </p>
          )}
          {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}

          <button
            onClick={handleBuy}
            disabled={!hasEnough || quantity < 1 || isLoading}
            className="w-full btn-samy btn-samy-enhanced text-white py-2 rounded-full font-bold uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: '0 auto' }} />
            ) : `Buy ${quantity} Ticket${quantity !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
