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

function JnrusdModal({
  wallet,
  tier,
  sharePrice,
  escrowWallet,
  onClose,
  onSuccess,
}: {
  wallet: string;
  tier: string;
  sharePrice: number;
  escrowWallet: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'amount' | 'done'>('amount');
  const [usdeAmount, setUsdeAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ unitQuantity: number; earningStartDate: string } | null>(null);

  const account = useActiveAccount();

  const units = usdeAmount ? (parseFloat(usdeAmount) / sharePrice).toFixed(6) : '—';

  async function handleDeposit() {
    if (!account) { setError('Wallet not connected'); return; }
    setLoading(true);
    setError('');
    try {
      const usdeContract = getContract({ client, chain: berachain, address: USDE_ADDRESS as `0x${string}` });
      const tx = transfer({ contract: usdeContract, to: escrowWallet as `0x${string}`, amount: usdeAmount });
      const receipt = await sendTransaction({ transaction: tx, account });
      const txHash = receipt.transactionHash;

      const res = await fetch(`${API_BASE_URL}/api/exclusive/jnrusd/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, depositUsde: parseFloat(usdeAmount), depositTxHash: txHash }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to confirm');
      setResult({ unitQuantity: data.data.unitQuantity, earningStartDate: data.data.earningStartDate });
      setStep('done');
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('0xec442f05') || msg.toLowerCase().includes('insufficient')) {
        setError('Insufficient USDE balance in your wallet.');
      } else if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('denied')) {
        setError('Transaction rejected.');
      } else {
        setError(msg);
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
                <label className="text-sm text-gray-400 mb-1.5 block">Amount to deposit (USDE)</label>
                <input
                  type="number"
                  value={usdeAmount}
                  onChange={e => setUsdeAmount(e.target.value)}
                  placeholder="e.g. 100"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {usdeAmount && parseFloat(usdeAmount) > 0 && (
                <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Entry share price</span>
                    <span className="text-white">${sharePrice.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>You deposit</span>
                    <span className="text-white">{parseFloat(usdeAmount).toLocaleString()} USDE</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-300">Unit quantity</span>
                    <span className="text-yellow-400">{units} units</span>
                  </div>
                  <p className="text-gray-500 text-xs">Your position value grows as the share price increases.</p>
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleDeposit}
                disabled={loading || !usdeAmount || parseFloat(usdeAmount) <= 0}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Waiting for wallet...' : 'Deposit USDE'}
              </button>
            </>
          )}

          {step === 'done' && result && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-white font-bold text-lg">Position Created!</p>
              <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Units</span>
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
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('0xec442f05') || msg.toLowerCase().includes('insufficient')) {
        setError('Insufficient HONEY balance in your wallet.');
      } else if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('denied')) {
        setError('Transaction rejected.');
      } else {
        setError(msg);
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
                <label className="text-sm text-gray-400 mb-1.5 block">HONEY amount to spend</label>
                <input
                  type="number"
                  value={honeyAmount}
                  onChange={e => setHoneyAmount(e.target.value)}
                  placeholder="e.g. 100"
                  min="0"
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
                disabled={loading || !honeyAmount || parseFloat(honeyAmount) <= 0}
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

function PerkCard({
  minTier,
  title,
  description,
  assetImage,
  assetName,
  assetSubtitle,
  footer,
  userTier,
  isFull,
  onUnlock,
  isDisplayOnly,
}: {
  minTier: string;
  title: string;
  description: React.ReactNode;
  assetImage: string;
  assetName: string;
  assetSubtitle: string;
  footer: React.ReactNode;
  userTier: string | null;
  isFull?: boolean;
  onUnlock?: () => void;
  isDisplayOnly?: boolean;
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
        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>{title}</h3>
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
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image src={assetImage} alt={assetName} fill className="rounded-full object-cover" />
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
              Deposit
            </button>
          ) : locked ? (
            <div className="w-full py-3 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
              style={requiresGoldStyle}>
              <span>🔒</span>
              <span>Requires <strong className="capitalize">{minTier}</strong> ({minTier === 'gold' ? '10,000' : '300'} AMY)</span>
            </div>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl text-sm font-semibold cursor-not-allowed opacity-40"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaaaaa',
              }}
            >
              {/* ESCROW_DISABLED — restore disabled={false}, onClick={onUnlock}, and hover handlers once escrow wallet is set */}
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
            userTier={userTier}
            isFull={sailrFull}
            onUnlock={() => setOpenModal('sailr')}
            assetImage="/sail.png"
            assetName="SAIL"
            assetSubtitle="Liquid Royalty Token"
            description={
              <>
                <p>Buy SAIL at a fixed 18% discount — a rare entry into a high-performing, yield-generating asset.</p>
                <p className="mt-2">Earn daily rewards, distributed weekly. Positions are locked for 6 months.</p>
                {capacity?.sailr && !capacity.sailr.unlimited && (
                  <p className="mt-2 text-xs text-gray-500">
                    Allocation: {capacity.sailr.used.toFixed(2)} / {capacity.sailr.cap.toFixed(2)} SAIL.r used
                  </p>
                )}
              </>
            }
            footer={
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-gray-400"><span>⏳</span><span>Limited allocation</span></div>
                <div className="flex items-center gap-2 text-gray-400"><span>🔒</span><span>6 month lock applies</span></div>
              </div>
            }
          />

          {/* Partner Access — display only */}
          <PerkCard
            minTier="gold"
            title="Direct Partner Access"
            userTier={userTier}
            isDisplayOnly
            assetImage="/sail.png"
            assetName="Partner Network"
            assetSubtitle="Priority Access"
            description={
              <>
                <p>Skip the queue. Get priority access to Amy&apos;s partner network.</p>
                <p className="mt-2">Faster answers. Better outcomes. Routed through Amy directly.</p>
              </>
            }
            footer={
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <span>⭐</span><span>Priority support for Gold+ holders</span>
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
          sharePrice={sharePrice}
          escrowWallet={process.env.NEXT_PUBLIC_JNRUSD_ESCROW_WALLET || ''}
          onClose={() => setOpenModal(null)}
          onSuccess={handleSuccess}
        />
      )}
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
