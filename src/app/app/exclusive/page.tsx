'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useActiveAccount } from 'thirdweb/react';
import { getContract, sendTransaction } from 'thirdweb';
import { transfer } from 'thirdweb/extensions/erc20';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { API_BASE_URL } from '@/lib/constants';

const HONEY_ADDRESS = '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce';
const USDE_ADDRESS  = '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Capacity {
  cap: number;
  used: number;
  remaining: number | null;
  unlimited: boolean;
}

interface CapacityData {
  sailr: Capacity | null;
  jnrusd: Capacity | null;
  jnrusdSharePrice: number;
}

interface SailrQuote {
  quoteId: string;
  expiresAt: string;
  liveSailPrice: number;
  discountPercent: number;
  discountedSailPrice: number;
  honeyAmountInput: number;
  sailAmountOutput: number;
  escrowWallet: string;
}

interface JnrusdPosition {
  position_id: string;
  wallet: string;
  qualification_tier: string;
  deposit_usde: number;
  entry_share_price: number;
  unit_quantity: number;
  created_at_utc: string;
  earning_start_date_utc: string;
  status: 'active' | 'cooling' | 'withdrawn';
  exit_requested_at_utc?: string;
  exit_available_at_utc?: string;
  stops_earning_at_utc?: string;
  withdrawn_at_utc?: string;
}

interface SailrPurchase {
  purchase_id: string;
  quote_id?: string;
  wallet?: string;
  qualification_tier?: string;
  honey_amount_input: number;
  sail_amount_output: number;
  sail_margin_to_amy?: number;
  payment_tx_hash?: string;
  payment_confirmed_at_utc: string;
  earning_start_date_utc: string;
  lock_end_date_utc: string;
  purchase_status: string;
  live_sail_price: number;
  discount_percent?: number;
  discounted_sail_price?: number;
}

type ModalType = 'jnrusd' | 'sailr' | null;

// ─── Tier helpers ─────────────────────────────────────────────────────────────

const TIER_RANK: Record<string, number> = { none: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 };

function tierMeetsMin(userTier: string | null, minTier: string): boolean {
  if (!userTier) return false;
  return (TIER_RANK[userTier.toLowerCase()] || 0) >= (TIER_RANK[minTier.toLowerCase()] || 0);
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700 text-amber-100',
  silver: 'bg-gray-400 text-gray-900',
  gold: 'bg-yellow-500 text-yellow-950',
  platinum: 'bg-teal-400 text-teal-950',
  none: 'bg-gray-700 text-gray-300',
};

function TierBadge({ tier }: { tier: string }) {
  const label = tier.charAt(0).toUpperCase() + tier.slice(1) + '+';

  const styles: Record<string, React.CSSProperties> = {
    bronze: {
      background: 'linear-gradient(135deg, #7a4e28 0%, #c89b5a 45%, #a0652a 100%)',
      color: '#1a0e00',
      boxShadow: '0 1px 6px rgba(160,101,42,0.35)',
    },
    silver: {
      background: 'linear-gradient(135deg, #7a8290 0%, #d4d8df 45%, #9ca3af 100%)',
      color: '#1a1c20',
      boxShadow: '0 1px 6px rgba(156,163,175,0.3)',
    },
    gold: {
      background: 'linear-gradient(135deg, #7d5a0a 0%, #c8962a 25%, #f5d576 50%, #c8962a 75%, #7d5a0a 100%)',
      color: '#2a1800',
      boxShadow: '0 0 10px rgba(212,175,55,0.55), 0 1px 3px rgba(0,0,0,0.4)',
      textShadow: '0 1px 1px rgba(255,220,100,0.3)',
    },
    platinum: {
      background: 'linear-gradient(135deg, #0d7a6e 0%, #2dd4bf 45%, #0d7a6e 100%)',
      color: '#001a17',
      boxShadow: '0 0 8px rgba(45,212,191,0.4)',
    },
  };

  const s = styles[tier] || { background: 'linear-gradient(135deg, #374151, #6b7280)', color: '#fff' };

  return (
    <span
      style={{
        ...s,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        padding: '4px 12px',
        borderRadius: '999px',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

// ─── Countdown timer ──────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(left);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return seconds;
}

// ─── jnrUSDE Modal ────────────────────────────────────────────────────────────

interface JnrusdQuote {
  quoteId: string;
  expiresAt: string;
  sharePrice: number;
  depositUsde: number;
  unitsReceived: number;
  escrowWallet: string;
}

function JnrusdModal({
  wallet,
  tier,
  onClose,
  onSuccess,
}: {
  wallet: string;
  tier: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'amount' | 'quote' | 'done'>('amount');
  const [usdeAmount, setUsdeAmount] = useState('');
  const [quote, setQuote] = useState<JnrusdQuote | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ unitQuantity: number; earningStartDate: string } | null>(null);

  const account = useActiveAccount();
  const countdown = useCountdown(quote?.expiresAt || null);
  const quoteExpired = countdown === 0 && !!quote;

  async function fetchQuote() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/exclusive/jnrusd/quote?wallet=${wallet}&deposit_usde=${usdeAmount}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to get quote');
      setQuote(data.data);
      setStep('quote');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!quote || !account) { setError('Wallet not connected'); return; }
    const escrowOk = quote.escrowWallet && quote.escrowWallet !== 'false' && quote.escrowWallet.startsWith('0x') && quote.escrowWallet.length === 42;
    if (!escrowOk) { setError('Deposits are temporarily disabled. Please check back soon.'); return; }
    setLoading(true);
    setError('');
    try {
      const usdeContract = getContract({ client, chain: berachain, address: USDE_ADDRESS as `0x${string}` });
      const tx = transfer({ contract: usdeContract, to: quote.escrowWallet as `0x${string}`, amount: String(quote.depositUsde) });
      const receipt = await sendTransaction({ transaction: tx, account });
      const txHash = receipt.transactionHash;

      const res = await fetch(`${API_BASE_URL}/api/exclusive/jnrusd/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, quoteId: quote.quoteId, depositTxHash: txHash }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to confirm');
      setResult({ unitQuantity: data.data.unitQuantity, earningStartDate: data.data.earningStartDate });
      setStep('done');
      onSuccess();
    } catch (e: unknown) {
      const raw = e as Record<string, unknown>;
      const msg = raw?.shortMessage as string || raw?.message as string || (e instanceof Error ? e.message : '') || String(e);
      if (msg.includes('0xe450d38c') || msg.includes('0xec442f05') || msg.toLowerCase().includes('insufficient')) {
        setError('Insufficient USDE balance in your wallet.');
      } else if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('cancelled') || (raw?.code === 4001)) {
        setError('Transaction cancelled.');
      } else {
        setError(msg || 'Transaction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <Image src="/jnr.png" alt="jnrUSD" width={28} height={28} className="rounded-full" />
            <span className="font-bold text-white">Access jnrUSD</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'amount' && (
            <>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">USDE amount to deposit <span className="text-gray-500">(min $10)</span></label>
                <input
                  type="number"
                  value={usdeAmount}
                  onChange={e => setUsdeAmount(e.target.value)}
                  placeholder="e.g. 100"
                  min="10"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="bg-gray-800/40 rounded-xl p-4 text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2"><span className="text-yellow-400">✦</span> Earn yield from the moment your position is active</div>
                <div className="flex items-center gap-2"><span className="text-yellow-400">✦</span> Exit any time — 7-day cooldown before withdrawal</div>
                <div className="flex items-center gap-2"><span className="text-yellow-400">✦</span> Position value grows as the share price increases</div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={fetchQuote}
                disabled={loading || !usdeAmount || parseFloat(usdeAmount) < 10}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Fetching quote...' : 'Get Quote'}
              </button>
            </>
          )}

          {step === 'quote' && quote && (
            <>
              <div className={`flex items-center justify-between text-sm rounded-xl px-4 py-2 ${quoteExpired ? 'bg-red-900/40 text-red-400' : 'bg-gray-800/60 text-gray-300'}`}>
                <span>Quote valid for</span>
                <span className={`font-mono font-bold ${quoteExpired ? 'text-red-400' : countdown <= 30 ? 'text-orange-400' : 'text-green-400'}`}>
                  {quoteExpired ? 'Expired' : `${countdown}s`}
                </span>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Current share price</span>
                  <span className="text-white">${quote.sharePrice.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>USDE you deposit</span>
                  <span className="text-white">{quote.depositUsde.toLocaleString()} USDE</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-700 pt-2 mt-2">
                  <span className="text-gray-300">jnrUSD shares you receive</span>
                  <span className="text-yellow-400">{quote.unitsReceived.toFixed(6)} jnrUSD</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">Shares appreciate over time as the vault grows.</p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {quoteExpired ? (
                <button onClick={() => { setQuote(null); setStep('amount'); }} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">
                  Get New Quote
                </button>
              ) : (
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Waiting for wallet...' : 'Confirm & Send USDE'}
                </button>
              )}
              <button onClick={() => { setQuote(null); setStep('amount'); setError(''); }} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">
                Back
              </button>
            </>
          )}

          {step === 'done' && result && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-white font-bold text-lg">Position Created!</p>
              <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">jnrUSD shares</span>
                  <span className="text-yellow-400 font-semibold">{result.unitQuantity.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Earning starts</span>
                  <span className="text-white">{new Date(result.earningStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SAIL.r Modal ─────────────────────────────────────────────────────────────

function SailrModal({
  wallet,
  onClose,
  onSuccess,
}: {
  wallet: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'amount' | 'quote' | 'done'>('amount');
  const [honeyAmount, setHoneyAmount] = useState('');
  const [quote, setQuote] = useState<SailrQuote | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sailAmount: number; earningStartDate: string; lockEndDate: string } | null>(null);

  const account = useActiveAccount();
  const countdown = useCountdown(quote?.expiresAt || null);
  const quoteExpired = countdown === 0 && !!quote;

  async function fetchQuote() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/exclusive/sailr/quote?wallet=${wallet}&honey_amount=${honeyAmount}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to get quote');
      setQuote(data.data);
      setStep('quote');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!quote || !account) { setError('Wallet not connected'); return; }
    const escrowOk = quote.escrowWallet && quote.escrowWallet !== 'false' && quote.escrowWallet.startsWith('0x') && quote.escrowWallet.length === 42;
    if (!escrowOk) { setError('Deposits are temporarily disabled. Please check back soon.'); return; }
    setLoading(true);
    setError('');
    try {
      const honeyContract = getContract({ client, chain: berachain, address: HONEY_ADDRESS as `0x${string}` });
      const tx = transfer({ contract: honeyContract, to: quote.escrowWallet as `0x${string}`, amount: String(quote.honeyAmountInput) });
      const receipt = await sendTransaction({ transaction: tx, account });
      const txHash = receipt.transactionHash;

      const res = await fetch(`${API_BASE_URL}/api/exclusive/sailr/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, quoteId: quote.quoteId, paymentTxHash: txHash }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to confirm');
      setResult({ sailAmount: data.data.sailAmountOutput, earningStartDate: data.data.earningStartDate, lockEndDate: data.data.lockEndDate });
      setStep('done');
      onSuccess();
    } catch (e: unknown) {
      const raw = e as Record<string, unknown>;
      const msg = raw?.shortMessage as string || raw?.message as string || (e instanceof Error ? e.message : '') || String(e);
      if (msg.includes('0xf4d678b8') || msg.includes('0xec442f05') || msg.toLowerCase().includes('insufficient')) {
        setError('Insufficient HONEY balance in your wallet.');
      } else if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('cancelled') || (raw?.code === 4001)) {
        setError('Transaction cancelled.');
      } else {
        setError(msg || 'Transaction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <Image src="/sail.png" alt="SAIL.r" width={28} height={28} className="rounded-full" />
            <span className="font-bold text-white">SAIL — 18% Discount Access</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'amount' && (
            <>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">HONEY amount to spend <span className="text-gray-500">(min $10)</span></label>
                <input
                  type="number"
                  value={honeyAmount}
                  onChange={e => setHoneyAmount(e.target.value)}
                  placeholder="e.g. 100"
                  min="10"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="bg-gray-800/40 rounded-xl p-4 text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2"><span className="text-yellow-400">✦</span> 18% discount on live SAIL.r price</div>
                <div className="flex items-center gap-2"><span className="text-yellow-400">✦</span> Quote locks in for 120 seconds</div>
                <div className="flex items-center gap-2"><span className="text-yellow-400">✦</span> 6-month lock on all allocations</div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={fetchQuote}
                disabled={loading || !honeyAmount || parseFloat(honeyAmount) < 10}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Fetching quote...' : 'Get Quote'}
              </button>
            </>
          )}

          {step === 'quote' && quote && (
            <>
              <div className={`flex items-center justify-between text-sm rounded-xl px-4 py-2 ${quoteExpired ? 'bg-red-900/40 text-red-400' : 'bg-gray-800/60 text-gray-300'}`}>
                <span>Quote valid for</span>
                <span className={`font-mono font-bold ${quoteExpired ? 'text-red-400' : countdown <= 30 ? 'text-orange-400' : 'text-green-400'}`}>
                  {quoteExpired ? 'Expired' : `${countdown}s`}
                </span>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Live SAIL.r price</span>
                  <span className="text-white">${quote.liveSailPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Your price (18% off)</span>
                  <span className="text-green-400">${quote.discountedSailPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>HONEY you pay</span>
                  <span className="text-white">{quote.honeyAmountInput.toLocaleString()} HONEY</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-700 pt-2 mt-2">
                  <span className="text-gray-300">SAIL.r you receive</span>
                  <span className="text-yellow-400">{quote.sailAmountOutput.toFixed(4)} SAIL.r</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {quoteExpired ? (
                <button onClick={() => { setQuote(null); setStep('amount'); }} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">
                  Get New Quote
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Waiting for wallet...' : 'Accept & Send HONEY'}
                </button>
              )}
            </>
          )}

          {step === 'done' && result && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-white font-bold text-lg">Purchase Confirmed!</p>
              <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">SAIL.r allocated</span>
                  <span className="text-yellow-400 font-semibold">{result.sailAmount.toFixed(4)} SAIL.r</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Earning starts</span>
                  <span className="text-white">{new Date(result.earningStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lock ends</span>
                  <span className="text-white">{new Date(result.lockEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Perk Card ────────────────────────────────────────────────────────────────

const CARD_BASE: React.CSSProperties = {
  background: 'rgba(10, 25, 22, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(34,197,94,0.04)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
};

const CARD_HOVER: React.CSSProperties = {
  transform: 'translateY(-4px)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.13), inset 0 0 30px rgba(34,197,94,0.05)',
  borderColor: 'rgba(255,255,255,0.15)',
};

// ─── SAIL.r Info Modal ────────────────────────────────────────────────────────
function SailrInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: '#13151a', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-lg font-bold">✕</button>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 pr-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Image src="/sail.png" alt="SAIL.r" width={36} height={36} className="rounded-full flex-shrink-0 sm:w-11 sm:h-11" />
          <div className="min-w-0">
            <h2 className="text-white font-black text-lg sm:text-2xl leading-tight">About SAIL.r Access</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 leading-snug">Everything you need to know about how SAIL.r access works through Amy.</p>
          </div>
        </div>

        {/* Feature row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
          {[
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" strokeLinejoin="round"/></svg>, title: 'Discounted Access', desc: 'Get SAIL.r at 18% off the live market price.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round"/></svg>, title: 'Fixed 6-Month Lock', desc: 'Your principal is locked for 6 months from purchase.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, title: 'Earn Weekly', desc: 'Rewards are distributed weekly during the lock.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 21.73a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinecap="round"/></svg>, title: 'Inventory Backed', desc: 'All allocations are fully backed by SAIL.r inventory.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/><circle cx="12" cy="7" r="4"/></svg>, title: 'For Gold+ Holders', desc: 'Exclusive to AMY Gold and Platinum holders.' },
          ].map(f => (
            <div key={f.title} className="flex flex-col gap-1">
              <span className="mb-0.5 text-yellow-400">{f.icon}</span>
              <p className="text-yellow-400 font-bold text-xs">{f.title}</p>
              <p className="text-gray-400 text-xs leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Left col */}
          <div className="flex flex-col gap-4">
            {/* How It Works */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-yellow-400 font-bold text-base mb-3">How It Works</h4>
              <ol className="space-y-2">
                {[
                  'You choose an amount of HONEY to invest.',
                  'We fetch the live SAIL.r price and apply your 18% discount.',
                  'You send HONEY to the escrow wallet.',
                  'Your SAIL.r allocation is recorded in Amy and your 6-month lock begins.',
                  'You earn rewards weekly while your position is locked.',
                  'At the end of the lock, your SAIL.r principal is delivered to your wallet.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}>{i + 1}</span>
                    <span className="leading-snug pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Where Funds Are Held */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-yellow-400 font-bold text-base mb-3">Where Your Funds &amp; SAIL.r Are Held</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round"/><path d="M9 22V12h6v10" strokeLinecap="round"/></svg>, title: 'HONEY Escrow', desc: 'Your HONEY is held in a secure multisig escrow wallet.' },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M3 17l3-8 3 4 3-7 3 5 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 20h20" strokeLinecap="round"/></svg>, title: 'SAIL.r Inventory', desc: 'SAIL.r inventory is held in escrow, provided by Liquid Royalty.' },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: 'Three-Party Security', desc: 'Escrow is controlled by Amy, Liquid Royalty, and a trusted third party.' },
                ].map(item => (
                  <div key={item.title} className="flex flex-col gap-1.5">
                    <span className="text-yellow-400">{item.icon}</span>
                    <p className="text-white font-semibold text-xs">{item.title}</p>
                    <p className="text-gray-400 text-[11px] leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg px-4 py-3 text-xs text-gray-400 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/></svg>
                <span>Your allocation is recorded in Amy and represents your full beneficial ownership of the SAIL.r position. This structure ensures all allocations are backed, secured, and fully tracked throughout the lock period.</span>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-4">
            {/* Example Box */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-yellow-400 font-bold text-base mb-3">Example: Your 100 HONEY Investment</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-gray-500 font-normal pb-2 text-xs"></th>
                    <th className="text-center text-gray-400 font-medium pb-2 text-xs">On Exchange<br/>(Market Price)</th>
                    <th className="text-center font-bold pb-2 text-xs rounded-t-lg" style={{ color: '#facc15', background: 'rgba(250,204,21,0.08)', padding: '4px 8px' }}>With Amy<br/>(18% Discount)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'SAIL.r Price', market: '$15.80', amy: '$12.96', highlight: true },
                    { label: 'Your HONEY', market: '100 HONEY', amy: '100 HONEY', highlight: false },
                    { label: 'SAIL.r You Receive', market: '~6.32 SAIL.r', amy: '~7.74 SAIL.r', highlight: true },
                    { label: 'You Earn', market: '—', amy: '~1.42 SAIL.r extra', highlight: true },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td className="py-2.5 text-gray-300 font-medium text-xs">{row.label}</td>
                      <td className="py-2.5 text-center text-gray-400 text-xs">{row.market}</td>
                      <td className="py-2.5 text-center text-xs font-bold" style={{ color: row.highlight ? '#4ade80' : '#facc15', background: 'rgba(250,204,21,0.05)' }}>{row.amy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-bold" style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', color: '#facc15' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>That&apos;s ~22.5% more SAIL.r for the same 100 HONEY.</span>
              </div>
            </div>

            {/* Key Details */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-yellow-400 font-bold text-base mb-3">Key Details</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Lock Duration', val: '6 months from payment confirmation' },
                  { label: 'Rewards', val: 'Paid weekly based on your allocation and time held' },
                  { label: 'Delivery', val: 'Your SAIL.r principal is sent to your wallet at lock end' },
                  { label: 'No Auto-Sell', val: 'You keep your SAIL.r. Amy does not manage exits' },
                  { label: 'Inventory Limited', val: 'Purchases are limited to available inventory' },
                ].map(item => (
                  <li key={item.label} className="flex items-start gap-2 text-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-gray-300"><span className="font-semibold text-white">{item.label}:</span> {item.val}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-2 sm:gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(250,204,21,0.04)' }}>
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" strokeLinejoin="round"/></svg>
            <span><strong className="text-yellow-400">Important:</strong> This is not financial advice. SAIL.r is a yield-generating asset with risks. Always do your own research.</span>
          </div>
          <a href="https://liquidroyalty.io" target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold whitespace-nowrap transition-colors pl-6 sm:pl-0">
            Learn more about risks →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── jnrUSD Info Modal ───────────────────────────────────────────────────────
function JnrusdInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: '#13151a', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-lg font-bold">✕</button>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 pr-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Image src="/jnr.png" alt="jnrUSD" width={36} height={36} className="rounded-full flex-shrink-0 sm:w-11 sm:h-11" />
          <div className="min-w-0">
            <h2 className="text-white font-black text-lg sm:text-2xl leading-tight">About jnrUSD Access</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 leading-snug">Everything you need to know about how jnrUSD access works through Amy.</p>
          </div>
        </div>

        {/* Feature row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
          {[
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: 'Earn Yield', desc: 'Your jnrUSD shares increase in value as the share price rises.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title: 'No Long-Term Lock', desc: 'Exit any time. 7-day cooldown applies.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: 'Additional Rewards', desc: 'BGT rewards are distributed separately.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: 'Professionally Managed', desc: 'Amy manages the pooled position and liquidity.' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/><circle cx="12" cy="7" r="4"/></svg>, title: 'For Bronze+ Holders', desc: 'Available to users holding 300+ AMY.' },
          ].map(f => (
            <div key={f.title} className="flex flex-col gap-1">
              <span className="mb-0.5 text-green-400">{f.icon}</span>
              <p className="text-green-400 font-bold text-xs">{f.title}</p>
              <p className="text-gray-400 text-xs leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Left col */}
          <div className="flex flex-col gap-4">
            {/* How It Works */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-green-400 font-bold text-base mb-3">How It Works</h4>
              <ol className="space-y-2">
                {[
                  'You deposit USDe to access the jnrUSD pool.',
                  'You receive jnrUSD shares based on the current share price.',
                  'Your shares represent your portion of the pooled position.',
                  'The share price increases over time as the strategy earns yield.',
                  'Your share count stays the same, but its value grows.',
                  'When you exit, your shares are unwound and returned as USDe after cooldown.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>{i + 1}</span>
                    <span className="leading-snug pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Where Funds Are Held */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-green-400 font-bold text-base mb-3">Where Your Funds &amp; jnrUSD Are Held</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, title: 'USDe Buffer', desc: 'Your deposit is held in a managed buffer to support liquidity and withdrawals.' },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: 'jnrUSD Pool', desc: 'A pre-funded jnrUSD position managed by Amy to generate yield.' },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: 'Secure & Controlled', desc: 'Assets are managed in controlled wallets with operational safeguards.' },
                ].map(item => (
                  <div key={item.title} className="flex flex-col gap-1.5">
                    <span className="text-green-400">{item.icon}</span>
                    <p className="text-white font-semibold text-xs">{item.title}</p>
                    <p className="text-gray-400 text-[11px] leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg px-4 py-3 text-xs text-gray-400 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/></svg>
                <span>Amy tracks your position in jnrUSD shares. You own your portion of the pool.</span>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-4">
            {/* Example Box */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-green-400 font-bold text-base mb-3">Example: Your $100 USDe Deposit</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-gray-500 font-normal pb-2 text-xs"></th>
                    <th className="text-right text-gray-400 font-medium pb-2 text-xs">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Current Share Price (1 jnrUSD)', val: '$1.25 USDe' },
                    { label: 'Your Deposit', val: '100 USDe' },
                    { label: 'jnrUSD Shares You Receive', val: '~80.00 jnrUSD shares' },
                    { label: 'Share Price After Growth', val: '$1.40 USDe' },
                    { label: 'Your Position Value', val: '~$112.00 USDe', highlight: true },
                    { label: 'Gain (Before Fees)', val: '~$12.00 USDe', highlight: true },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td className="py-2.5 text-gray-300 font-medium text-xs">{row.label}</td>
                      <td className="py-2.5 text-right text-xs font-bold" style={{ color: row.highlight ? '#4ade80' : '#d1d5db' }}>{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-bold" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Your shares increase in value as the share price rises.</span>
              </div>
            </div>

            {/* Key Details */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-green-400 font-bold text-base mb-3">Key Details</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Minimum Deposit', val: '$10 USDe' },
                  { label: 'Exit Anytime', val: 'Request withdrawal at any time' },
                  { label: 'Cooldown', val: '7 days from exit request (no earnings from 00:00 UTC next day)' },
                  { label: 'Payout', val: 'Shares are unwound and returned as USDe after cooldown' },
                  { label: 'Fees', val: '~8% performance fee on realized yield (only on gains)' },
                  { label: 'Rewards', val: 'BGT rewards distributed separately' },
                  { label: 'Quote Validity', val: '120 seconds (based on live share price)' },
                  { label: 'No Maximum', val: 'No upper deposit limit' },
                ].map(item => (
                  <li key={item.label} className="flex items-start gap-2 text-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-gray-300"><span className="font-semibold text-white">{item.label}:</span> {item.val}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-2 sm:gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(34,197,94,0.04)' }}>
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" strokeLinejoin="round"/></svg>
            <span><strong className="text-green-400">Important:</strong> This is not financial advice. jnrUSD is a yield-generating asset with risks. Always do your own research.</span>
          </div>
          <a href="https://liquidroyalty.io" target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 font-semibold whitespace-nowrap transition-colors pl-6 sm:pl-0">
            Learn more about risks →
          </a>
        </div>
      </div>
    </div>
  );
}

function PerkCard({
  minTier,
  title,
  description,
  assetImage,
  assetIcon,
  assetName,
  assetSubtitle,
  footer,
  userTier,
  isFull,
  onUnlock,
  isDisplayOnly,
  displayOnlyLabel,
  onInfo,
  infoAccent,
}: {
  minTier: string;
  title: string;
  description: React.ReactNode;
  assetImage?: string;
  assetIcon?: React.ReactNode;
  assetName: string;
  assetSubtitle: string;
  footer: React.ReactNode;
  userTier: string | null;
  isFull?: boolean;
  onUnlock?: () => void;
  isDisplayOnly?: boolean;
  displayOnlyLabel?: string;
  onInfo?: () => void;
  infoAccent?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const eligible = tierMeetsMin(userTier, minTier);
  const locked = !eligible || isDisplayOnly;

  const goldBorder = 'linear-gradient(135deg, #d4af37, #f5d76e)';
  const requiresGoldStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.4)',
    color: '#d4af37',
  };

  return (
    <div
      className="relative flex flex-col"
      style={{ ...(hovered ? { ...CARD_BASE, ...CARD_HOVER } : CARD_BASE) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Subtle green edge glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: hovered ? 'inset 0 0 40px rgba(34,197,94,0.06)' : 'none', transition: 'box-shadow 0.25s ease' }} />

      {/* Badge row */}
      <div className="flex items-center gap-2 px-6 pt-6 pb-0">
        <TierBadge tier={minTier} />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-6 pt-4 pb-6 gap-4">
        <div className="flex items-center gap-2">
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>{title}</h3>
          {onInfo && (() => {
            const ac = infoAccent || '#facc15';
            const bgBase = infoAccent ? 'rgba(34,197,94,0.15)' : 'rgba(250,204,21,0.15)';
            const bgHover = infoAccent ? 'rgba(34,197,94,0.3)' : 'rgba(250,204,21,0.3)';
            const border = infoAccent ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(250,204,21,0.35)';
            return (
              <button
                onClick={e => { e.stopPropagation(); onInfo(); }}
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-200"
                style={{ background: bgBase, color: ac, border }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = bgHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bgBase; }}
                title="Learn more"
              >i</button>
            );
          })()}
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }} className="space-y-2">
          {description}
        </div>

        {/* Asset token box */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
            {assetIcon ? assetIcon : assetImage ? <Image src={assetImage} alt={assetName} fill className="rounded-full object-cover" /> : null}
          </div>
          <div>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>{assetName}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{assetSubtitle}</p>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{footer}</div>

        {/* CTA — pushed to bottom */}
        <div className="mt-auto pt-1">
          {isFull ? (
            <div className="w-full py-3 rounded-xl text-center text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>
              Allocation Full
            </div>
          ) : isDisplayOnly ? (
            <button
              disabled
              className="w-full py-3 rounded-xl text-sm font-semibold cursor-not-allowed opacity-40"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaaaaa',
              }}
            >
              {displayOnlyLabel || 'Deposit'}
            </button>
          ) : locked ? (
            <div className="w-full py-3 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
              style={requiresGoldStyle}>
              <span>🔒</span>
              <span>Requires <strong className="capitalize">{minTier}</strong> ({minTier === 'gold' ? '10,000' : '300'} AMY)</span>
            </div>
          ) : (
            <button
              onClick={onUnlock}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaaaaa',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.color = '#aaaaaa';
              }}
            >
              Deposit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Positions Dashboard ──────────────────────────────────────────────────────

function PositionsDashboard({ wallet, refreshTrigger }: { wallet: string; refreshTrigger?: number }) {
  const [positions, setPositions] = useState<JnrusdPosition[]>([]);
  const [purchases, setPurchases] = useState<SailrPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitingId, setExitingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [posRes, purRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/exclusive/jnrusd/positions/${wallet}`),
        fetch(`${API_BASE_URL}/api/exclusive/sailr/purchases/${wallet}`),
      ]);
      const [posData, purData] = await Promise.all([posRes.json(), purRes.json()]);
      if (posData.success) setPositions(posData.data);
      if (purData.success) setPurchases(purData.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  async function requestExit(positionId: string) {
    setExitingId(positionId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/exclusive/jnrusd/exit/${positionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      if (res.ok) load();
    } catch { /* silent */ } finally {
      setExitingId(null);
    }
  }

  const activePositions = positions.filter(p => p.status !== 'withdrawn');
  const activePurchases = purchases.filter(p => p.purchase_status !== 'cancelled');

  if (loading) return null;
  if (activePositions.length === 0 && activePurchases.length === 0) return null;

  return (
    <div className="mt-12 space-y-8">
      {/* Section header — same style as Available Perks */}
      <div className="flex justify-center items-center gap-1">
        <div style={{ width: '126px', height: '2px', background: 'linear-gradient(to left, rgba(212,175,55,0.7), rgba(212,175,55,0))', borderRadius: '2px' }} />
        <div style={{ background: 'rgba(10,25,22,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '10px 28px', whiteSpace: 'nowrap', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>Your Positions</span>
        </div>
        <div style={{ width: '126px', height: '2px', background: 'linear-gradient(to right, rgba(212,175,55,0.7), rgba(212,175,55,0))', borderRadius: '2px' }} />
      </div>

      {activePurchases.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3 px-1">SAIL.r Allocations</p>
          <div className="space-y-3">
            {activePurchases.map(p => (
              <div key={p.purchase_id} style={{ background: 'rgba(10,25,22,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '12px', padding: '8px' }}>
                    <Image src="/sail.png" alt="SAIL.r" width={36} height={36} className="rounded-full" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{parseFloat(String(p.sail_amount_output)).toFixed(4)} <span className="text-yellow-400">SAIL.r</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">Bought at ${parseFloat(String(p.discounted_sail_price)).toFixed(4)} · 18% discount</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase tracking-wider">Earning from</span>
                    <span className="text-white font-medium">{new Date(p.earning_start_date_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase tracking-wider">Lock ends</span>
                    <span className="text-white font-medium">{new Date(p.lock_end_date_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase tracking-wider">Status</span>
                    <span className="text-green-400 font-semibold capitalize">{p.purchase_status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePositions.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3 px-1">jnrUSD Positions</p>
          <div className="space-y-3">
            {activePositions.map(p => (
              <div key={p.position_id} style={{ background: 'rgba(10,25,22,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${p.status === 'cooling' ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '12px', padding: '8px' }}>
                    <Image src="/jnr.png" alt="jnrUSD" width={36} height={36} className="rounded-full" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{parseFloat(String(p.deposit_usde)).toLocaleString()} <span className="text-yellow-400">USDE</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{parseFloat(String(p.unit_quantity)).toFixed(4)} units · entry ${parseFloat(String(p.entry_share_price)).toFixed(4)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs items-end">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase tracking-wider">Earning from</span>
                    <span className="text-white font-medium">{new Date(p.earning_start_date_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {p.status === 'cooling' && p.exit_available_at_utc && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-orange-400 uppercase tracking-wider">Withdrawable</span>
                      <span className="text-white font-medium">{new Date(p.exit_available_at_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase tracking-wider">Status</span>
                    <span className={`font-semibold capitalize ${p.status === 'cooling' ? 'text-orange-400' : 'text-green-400'}`}>{p.status}</span>
                  </div>
                  {p.status === 'active' && (
                    <button
                      onClick={() => requestExit(p.position_id)}
                      disabled={exitingId === p.position_id}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '6px 14px', color: '#f87171', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    >
                      {exitingId === p.position_id ? 'Requesting...' : 'Request Exit'}
                    </button>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExclusivePage() {
  const account = useActiveAccount();
  const wallet = account?.address;

  const [userTier, setUserTier] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [showSailrInfo, setShowSailrInfo] = useState(false);
  const [showJnrusdInfo, setShowJnrusdInfo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!wallet) return;
    fetch(`${API_BASE_URL}/api/points/${wallet}`)
      .then(r => r.json())
      .then(d => { if (d.success) setUserTier(d.data?.currentTier?.toLowerCase() || null); })
      .catch(() => {});
  }, [wallet]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/exclusive/capacity`)
      .then(r => r.json())
      .then(d => { if (d.success) setCapacity(d.data); })
      .catch(() => {});
  }, [refreshKey]);

  const handleSuccess = () => {
    setOpenModal(null);
    setRefreshKey(k => k + 1);
  };

  const sailrFull = capacity?.sailr ? (!capacity.sailr.unlimited && (capacity.sailr.remaining ?? 1) <= 0) : false;
  const jnrusdFull = capacity?.jnrusd ? (!capacity.jnrusd.unlimited && (capacity.jnrusd.remaining ?? 1) <= 0) : false;
  const sharePrice = capacity?.jnrusdSharePrice ?? 1.0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-8 md:py-12 text-center px-4">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Exclusive Access. Better Opportunities.
          </h1>
          <p className="text-white text-base md:text-lg max-w-xl mx-auto mb-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] font-medium">
            Holding AMY gives you access to opportunities not available on the open market.
          </p>
          <p className="text-yellow-300 italic text-sm md:text-base drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] font-semibold">
            Perks are unlocked based on your position and activity.
          </p>
        </div>
      </div>

      {/* Available Perks */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Section header */}
        <div className="flex justify-center items-center mb-6 gap-1">
          <div style={{ width: '126px', height: '2px', background: 'linear-gradient(to left, rgba(212,175,55,0.7), rgba(212,175,55,0))', borderRadius: '2px' }} />
          <div style={{
            background: 'rgba(10, 25, 22, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '12px 32px',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(34,197,94,0.04)',
          }}>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }}>Available Perks</span>
          </div>
          <div style={{ width: '126px', height: '2px', background: 'linear-gradient(to right, rgba(212,175,55,0.7), rgba(212,175,55,0))', borderRadius: '2px' }} />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* jnrUSD */}
          <PerkCard
            minTier="bronze"
            title="Access jnrUSD"
            onInfo={() => setShowJnrusdInfo(true)}
            infoAccent="#22c55e"
            userTier={userTier}
            isFull={jnrusdFull}
            onUnlock={() => setOpenModal('jnrusd')}
            assetImage="/jnr.png"
            assetName="jnrUSD"
            assetSubtitle="Liquid Royalty Vault"
            description={
              <>
                <p>Skip the usual barriers and access jnrUSD directly through Amy.</p>
                <p className="mt-2">No 10k minimum. No whitelist friction.</p>
                <p className="mt-1">Start earning from day one with a strategy normally reserved for larger players.</p>
                {capacity?.jnrusd && !capacity.jnrusd.unlimited && (
                  <p className="mt-2 text-xs text-gray-500">
                    Allocation: {capacity.jnrusd.used.toFixed(0)} / {capacity.jnrusd.cap.toFixed(0)} USDE used
                  </p>
                )}
              </>
            }
            footer={
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                <span>✓</span>
                <span>Available to all AMY holders (300+)</span>
              </div>
            }
          />

          {/* SAIL.r */}
          <PerkCard
            minTier="gold"
            title="SAIL — 18% Discount Access"
            onInfo={() => setShowSailrInfo(true)}
            userTier={userTier}
            isFull={sailrFull}
            onUnlock={() => setOpenModal('sailr')}
            assetImage="/sail.png"
            assetName="SAIL"
            assetSubtitle="Liquid Royalty Token"
            description={
              <>
                <p>Access SAIL.r at a fixed 18% discount — a controlled entry not available on the open market.</p>
                <p className="mt-2">Secure an allocation into a high-yield asset with weekly rewards, backed by real inventory.</p>
                {capacity?.sailr && !capacity.sailr.unlimited && (
                  <p className="mt-2 text-xs text-gray-500">
                    Allocation: {capacity.sailr.used.toFixed(2)} / {capacity.sailr.cap.toFixed(2)} SAIL.r used
                  </p>
                )}
              </>
            }
            footer={
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-gray-400"><span>⏳</span><span>Limited allocation per round</span></div>
                <div className="flex items-center gap-2 text-gray-400"><span>📦</span><span>Inventory-backed access</span></div>
                <div className="flex items-center gap-2 text-gray-400"><span>🔒</span><span>6 month lock with weekly rewards</span></div>
              </div>
            }
          />

          {/* Partner Access — display only */}
          <PerkCard
            minTier="gold"
            title="VIP Partner Access"
            userTier={userTier}
            isDisplayOnly
            displayOnlyLabel="Request Access"
            assetIcon={
              <svg viewBox="0 0 24 24" className="w-9 h-9" style={{ color: '#d4af37' }}>
                <path d="M12 12L12 5M12 12L20 9M12 12L19 18.5M12 12L4 17M12 5L20 9M4 17L19 18.5"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                <circle cx="12" cy="12" r="2.8" fill="currentColor"/>
                <circle cx="12" cy="5" r="1.9" fill="currentColor"/>
                <circle cx="20" cy="9" r="2.1" fill="currentColor"/>
                <circle cx="19" cy="18.5" r="1.5" fill="currentColor"/>
                <circle cx="4" cy="17" r="1.7" fill="currentColor"/>
              </svg>
            }
            assetName="Partner Network"
            assetSubtitle="Curated Access"
            description={
              <>
                <p>Work directly through Amy.</p>
                <p className="mt-2">Instead of navigating protocols alone, you get routed into the right people, earlier access to opportunities, and guidance on how to position capital effectively.</p>
                <p className="mt-2">From priority introductions to new products, to support when it actually matters — this is curated access built around real relationships.</p>
              </>
            }
            footer={
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-gray-400"><span>⭐️</span><span>Direct routing into partner teams</span></div>
                <div className="flex items-center gap-2 text-gray-400"><span>⚡️</span><span>Early access to new opportunities &amp; whitelists</span></div>
                <div className="flex items-center gap-2 text-gray-400"><span>🧠</span><span>Guidance on capital allocation &amp; positioning</span></div>
              </div>
            }
          />
        </div>

        {/* Not connected notice */}
        {!wallet && (
          <p className="text-center text-gray-500 text-sm mt-8">Connect your wallet to see your tier and unlock perks.</p>
        )}

        {/* Positions dashboard */}
        {wallet && <PositionsDashboard wallet={wallet} refreshTrigger={refreshKey} />}
      </div>

      {/* Modals */}
      {openModal === 'jnrusd' && wallet && (
        <JnrusdModal
          wallet={wallet}
          tier={userTier || 'bronze'}
          onClose={() => setOpenModal(null)}
          onSuccess={handleSuccess}
        />
      )}
      {showSailrInfo && <SailrInfoModal onClose={() => setShowSailrInfo(false)} />}
      {showJnrusdInfo && <JnrusdInfoModal onClose={() => setShowJnrusdInfo(false)} />}

      {openModal === 'sailr' && wallet && (
        <SailrModal
          wallet={wallet}
          onClose={() => setOpenModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
