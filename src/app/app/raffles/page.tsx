'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { API_BASE_URL } from '@/lib/constants';
import PrizeCarousel from './components/PrizeCarousel';
import TicketModal from './components/TicketModal';
import ActiveRaffles from './components/ActiveRaffles';
import RaffleHistory from './components/RaffleHistory';

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

interface CompletedRaffle {
  id: number;
  title: string;
  image_url: string;
  status: 'COMPLETED' | 'CANCELLED';
  winner_wallet: string | null;
  ends_at: string | null;
  total_tickets: number;
}

export default function RafflesPage() {
  const account = useActiveAccount();
  const wallet = account?.address;

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [userEntries, setUserEntries] = useState<Record<number, number>>({});
  const [userEntriesFull, setUserEntriesFull] = useState<UserEntry[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [history, setHistory] = useState<CompletedRaffle[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRaffles = useCallback(async () => {
    try {
      const url = wallet
        ? `${API_BASE_URL}/api/raffles?wallet=${wallet}`
        : `${API_BASE_URL}/api/raffles`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRaffles(data.data || []);
        setUserEntries(data.userEntries || {});
      }
    } catch {
      // ignore
    }
  }, [wallet]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/raffles/history`);
      const data = await res.json();
      if (data.success) setHistory(data.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchUserEntries = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/raffles?wallet=${wallet}`);
      const data = await res.json();
      if (data.success) {
        setRaffles(data.data || []);
        setUserEntries(data.userEntries || {});
        // Build full entry objects by combining raffle data with entry counts
        const entries: UserEntry[] = (data.data || []).flatMap((r: Raffle) => {
          const tickets = data.userEntries?.[r.id];
          if (!tickets) return [];
          return [{
            raffle_id: r.id,
            tickets,
            points_spent: tickets * (r.ticket_cost || 50),
            purchased_at: '',
            title: r.title,
            status: r.status,
            ends_at: r.ends_at,
            winner_wallet: null,
            image_url: r.image_url,
          }];
        });
        setUserEntriesFull(entries);
      }
    } catch {
      // ignore
    }
  }, [wallet]);

  const fetchPoints = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/points/${wallet}`);
      const data = await res.json();
      if (data.success && data.data) {
        setPointsBalance(data.data.totalPoints || 0);
      }
    } catch {
      // ignore
    }
  }, [wallet]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchRaffles(), fetchHistory()]);
      setIsLoading(false);
    };
    init();
  }, [fetchRaffles, fetchHistory]);

  useEffect(() => {
    if (wallet) {
      fetchPoints();
      fetchUserEntries();
    }
  }, [wallet, fetchPoints, fetchUserEntries]);

  // Poll every 30s so status changes (TNM→LIVE, winner drawn) reflect automatically
  useEffect(() => {
    const id = setInterval(() => {
      fetchRaffles();
      fetchHistory();
      if (wallet) {
        fetchUserEntries();
        fetchPoints();
      }
    }, 30000);
    return () => clearInterval(id);
  }, [fetchRaffles, fetchHistory, fetchUserEntries, fetchPoints, wallet]);

  const handleSuccess = useCallback(() => {
    fetchUserEntries();
    fetchPoints();
    fetchHistory();
  }, [fetchUserEntries, fetchPoints, fetchHistory]);

  const handleBuyMore = useCallback((raffleId: number) => {
    const raffle = raffles.find(r => r.id === raffleId);
    if (raffle) setSelectedRaffle(raffle);
  }, [raffles]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-3 md:py-4 space-y-6">
      {/* Prize Carousel */}
      <section>
        <PrizeCarousel
          raffles={raffles}
          onSelectRaffle={(raffle) => {
            if (!wallet) {
              // Carousel is read-only without wallet — still show modal info
              setSelectedRaffle(raffle);
            } else {
              setSelectedRaffle(raffle);
            }
          }}
        />
      </section>

      {/* My Active Raffles */}
      {wallet && userEntriesFull.length > 0 && (
        <section>
          <ActiveRaffles entries={userEntriesFull} onBuyMore={handleBuyMore} />
        </section>
      )}

      {/* Raffle History */}
      <section>
        <RaffleHistory history={history} />
      </section>

      {/* Ticket Modal */}
      {selectedRaffle && wallet && (
        <TicketModal
          raffle={selectedRaffle}
          userCurrentTickets={userEntries[selectedRaffle.id] || 0}
          pointsBalance={pointsBalance}
          wallet={wallet}
          onClose={() => setSelectedRaffle(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Read-only modal prompt for unconnected users */}
      {selectedRaffle && !wallet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={() => setSelectedRaffle(null)}
        >
          <div className="bg-gray-900 border border-yellow-400/30 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">🎟️</div>
            <h3 className="text-xl font-black text-yellow-400 mb-2">{selectedRaffle.title}</h3>
            <p className="text-gray-400 text-sm mb-4">Connect your wallet to buy tickets.</p>
            <button
              onClick={() => setSelectedRaffle(null)}
              className="btn-samy btn-samy-enhanced text-white px-6 py-2.5 rounded-full font-bold uppercase text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
