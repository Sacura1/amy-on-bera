'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { darkTheme } from 'thirdweb/react';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS, API_BASE_URL } from '@/lib/constants';

const amyTheme = darkTheme({
  colors: {
    primaryButtonBg: '#FF1493',
    primaryButtonText: '#ffffff',
    connectedButtonBg: '#FF1493',
    connectedButtonBgHover: '#FF69B4',
    borderColor: '#FFD700',
    accentButtonBg: '#FF1493',
    accentButtonText: '#ffffff',
    modalBg: 'rgba(0, 0, 0, 0.95)',
    accentText: '#FFD700',
    primaryText: '#ffffff',
    secondaryText: '#cccccc',
  },
});

const PANEL_W = 350;

const HOLDER_RING: Record<string, string> = {
  platinum: 'border-cyan-400',
  gold:     'border-yellow-400',
  silver:   'border-slate-400',
  bronze:   'border-orange-500',
  none:     'border-white/20',
};

const TIER_COLOR: Record<string, string> = {
  platinum: '#22d3ee',
  gold:     '#facc15',
  silver:   '#cbd5e1',
  bronze:   '#f97316',
  none:     '#9ca3af',
};

const TIER_LABEL: Record<string, string> = {
  platinum: 'Platinum Status',
  gold:     'Gold Status',
  silver:   'Silver Status',
  bronze:   'Bronze Status',
  none:     'None',
};

const CrownIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-4 h-4 flex-shrink-0">
    <path d="M5 16L2 7l5 3.5 5-6.5 5 6.5L22 7l-3 9H5zm0 2h14v2H5v-2z"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="1.8" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

// ── Icons matching design reference ──────────────────────────────────────────

// Earn — sharp trending-up line with arrowhead
const EarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="17 7 21 7 21 11" />
  </svg>
);

// Trade — two clean opposing swap arrows
const TradeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
    <path d="M5 8h14M19 8l-4-4M19 8l-4 4"/>
    <path d="M19 16H5M5 16l4-4M5 16l4 4"/>
  </svg>
);

// Portfolio — 3 ascending hollow candlesticks with visible wicks, faded white fill
const PortfolioIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    {/* Left candle — smallest, hollow body + wicks */}
    <rect x="2.5" y="16" width="4" height="5" rx="0.5" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="4.5" y1="12.5" x2="4.5" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="4.5" y1="21" x2="4.5" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Middle candle — medium, hollow body + wicks */}
    <rect x="10" y="10" width="4" height="11" rx="0.5" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="12" y1="6.5" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Right candle — tallest, hollow body + wicks */}
    <rect x="17.5" y="5" width="4" height="16" rx="0.5" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="19.5" y1="2" x2="19.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="19.5" y1="21" x2="19.5" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// Amy Points — star inside a circle
const AmyPointsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 6.8l1.2 3.6h3.8l-3.1 2.2 1.2 3.6-3.1-2.3-3.1 2.3 1.2-3.6-3.1-2.2h3.8z" fill="currentColor"/>
  </svg>
);

// Raffles — 3D gift box with ribbon and bow (stroke style matching gift.jpg)
const RafflesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
    {/* Front face (U-shape — top edge implicit) */}
    <path d="M3 12v10h14V12"/>
    {/* Top face (parallelogram) */}
    <path d="M3 12l4-4h14l-4 4"/>
    {/* Right side face */}
    <path d="M17 12l4-4v10l-4 4"/>
    {/* Ribbon: vertical on front */}
    <line x1="10" y1="12" x2="10" y2="22"/>
    {/* Ribbon: vertical on top (perspective) */}
    <line x1="10" y1="12" x2="14" y2="8"/>
    {/* Ribbon: horizontal on front */}
    <line x1="3" y1="16" x2="17" y2="16"/>
    {/* Ribbon: horizontal on top */}
    <line x1="5" y1="10" x2="19" y2="10"/>
    {/* Bow: left loop */}
    <path d="M14 8C11 5.5 9 3.5 11 2.5S14.5 4.5 14 8z"/>
    {/* Bow: right loop */}
    <path d="M14 8C17 5.5 19 3.5 17 2.5S13.5 4.5 14 8z"/>
  </svg>
);

// Leaderboard — trophy cup
const LeaderboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[30px] h-[30px]">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

// Profile — person silhouette
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[30px] h-[30px]">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

// Exclusive Access — TV shape: two antennas, transparent screen top, solid bottom with VIP cutout
const ExclusiveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    {/* Left antenna */}
    <path d="M9.5 5.5L7 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    {/* Right antenna */}
    <path d="M14.5 5.5L17 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    {/* TV frame outline (screen area is transparent) */}
    <rect x="2.5" y="5" width="19" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    {/* Divider between screen and VIP section */}
    <line x1="2.5" y1="14" x2="21.5" y2="14" stroke="currentColor" strokeWidth="1"/>
    {/* Bottom filled area with VIP text as dark cutout */}
    <path d="M2.5 14h19v5.5a1.5 1.5 0 0 1-1.5 1.5h-16a1.5 1.5 0 0 1-1.5-1.5V14z" fill="currentColor"/>
    <text x="12" y="19.5" textAnchor="middle" fontSize="5.5" fontWeight="900"
          fontFamily="Arial,sans-serif" fill="rgba(12,18,32,0.95)" letterSpacing="1">VIP</text>
  </svg>
);

// Partners — 5-node atom/molecule: large center + 4 outer nodes of varying size
const PartnersIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    {/* Connection lines (draw first so nodes sit on top) */}
    <path d="M12 12L12 5M12 12L20 9M12 12L19 18.5M12 12L4 17M12 5L20 9M4 17L19 18.5"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    {/* Center node — biggest */}
    <circle cx="12" cy="12" r="2.8" fill="currentColor"/>
    {/* Top node — medium */}
    <circle cx="12" cy="5" r="1.9" fill="currentColor"/>
    {/* Right node — medium-large */}
    <circle cx="20" cy="9" r="2.1" fill="currentColor"/>
    {/* Bottom-right node — small */}
    <circle cx="19" cy="18.5" r="1.5" fill="currentColor"/>
    {/* Left-bottom node — medium-small */}
    <circle cx="4" cy="17" r="1.7" fill="currentColor"/>
  </svg>
);

// ── Tile definitions ──────────────────────────────────────────────────────────

interface Tile {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const TILES: Tile[] = [
  { label: 'Earn',                 href: '/app/earn',        icon: <EarnIcon /> },
  { label: 'Trade',                href: '/app/trade',       icon: <TradeIcon /> },
  { label: 'Portfolio',            href: '/app/portfolio',   icon: <PortfolioIcon /> },
  { label: 'Amy Points',          href: '/app/points',      icon: <AmyPointsIcon /> },
  { label: 'Raffles',              href: '/app/raffles',     icon: <RafflesIcon /> },
  { label: 'Leaderboard',           href: '/app/leaderboard', icon: <LeaderboardIcon /> },
  { label: 'Profile',              href: '/app/profile',     icon: <ProfileIcon /> },
  { label: 'Exclusive Access',     href: '/app/exclusive',   icon: <ExclusiveIcon /> },
  { label: 'Partners & Investors', href: '/app/partners',   icon: <PartnersIcon /> },
  { disabled: true },
  { disabled: true },
  { disabled: true },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppHeader() {
  const account = useActiveAccount();
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [holderTier, setHolderTier] = useState('none');
  const [amyScore, setAmyScore] = useState(0);

  const close = () => setIsOpen(false);

  useEffect(() => {
    const openMenu = () => setIsOpen(true);
    window.addEventListener('amy-open-menu', openMenu);
    return () => window.removeEventListener('amy-open-menu', openMenu);
  }, []);

  useEffect(() => {
    const wa = account?.address;
    if (!wa) { setAvatarUrl(null); setHolderTier('none'); return; }
    fetch(`${API_BASE_URL}/api/profile/${wa}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const p = d.data?.profile;
          if (p?.avatarData) setAvatarUrl(p.avatarData);
          else if (p?.avatarUrl) setAvatarUrl(`${API_BASE_URL}${p.avatarUrl}`);
          else setAvatarUrl(null);
        }
      }).catch(() => {});
    fetch(`${API_BASE_URL}/api/points/${wa}`)
      .then(r => r.json())
      .then(d => { if (d.success) setHolderTier(d.data?.currentTier || 'none'); })
      .catch(() => {});
    fetch(`${API_BASE_URL}/api/amy-score/${wa}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAmyScore(d.score ?? 0); })
      .catch(() => {});
  }, [account?.address]);

  return (
    <>
      {/* ── Header ── */}
      <header className="container mx-auto px-4 py-4 md:py-3 landscape:py-1">
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-3xl md:text-4xl landscape:text-2xl font-black text-shadow-strong" style={{ color: '#FFD700' }}>
            AMY
          </Link>

          {/* Desktop nav — shifts left in sync with panel */}
          <div
            className="hidden md:flex items-center gap-4 landscape:gap-2"
            style={{
              marginRight: isOpen ? PANEL_W : 0,
              transition: 'margin-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Link href="/app/profile" onClick={close} className="btn-samy btn-samy-enhanced text-white px-8 py-3 landscape:px-4 landscape:py-1.5 rounded-full text-xl landscape:text-sm font-bold uppercase">
              PROFILE
            </Link>
            <Link href="/app/earn" onClick={close} className="btn-samy btn-samy-enhanced text-white px-8 py-3 landscape:px-4 landscape:py-1.5 rounded-full text-xl landscape:text-sm font-bold uppercase">
              EARN
            </Link>
            <Link href="/app/points" onClick={close} className="btn-samy btn-samy-enhanced text-white px-8 py-3 landscape:px-4 landscape:py-1.5 rounded-full text-xl landscape:text-sm font-bold uppercase">
              AMY POINTS
            </Link>
            <button
              onClick={() => setIsOpen(o => !o)}
              className="btn-samy btn-samy-enhanced text-white px-8 py-3 landscape:px-4 landscape:py-1.5 rounded-full text-xl landscape:text-sm font-bold uppercase"
            >
              MENU
            </button>
          </div>

          {/* Mobile nav */}
          <div className={`flex md:hidden items-center gap-2 landscape:gap-1 ${isIOS ? 'landscape:ml-4' : 'landscape:ml-3'}`}>
            <Link href="/app/profile" onClick={close} className={`btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full landscape:rounded-[999px] text-sm font-bold uppercase ${isIOS ? 'landscape:px-2 landscape:py-0.5 landscape:text-[10px]' : 'landscape:px-2.5 landscape:py-1 landscape:text-[11px]'}`}>
              PROFILE
            </Link>
            <button
              onClick={() => setIsOpen(o => !o)}
              className={`btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full landscape:rounded-[999px] text-sm font-bold uppercase ${isIOS ? 'landscape:px-2 landscape:py-0.5 landscape:text-[10px]' : 'landscape:px-2.5 landscape:py-1 landscape:text-[11px]'}`}
            >
              MENU
            </button>
          </div>
        </nav>

        {/* Wallet connect */}
        <div className="mt-4 landscape:mt-1">
          <ConnectButton
            client={client}
            chain={berachain}
            appMetadata={{
              name: '$AMY',
              url: 'https://amybera.com',
              description: '$AMY - Berachain Ecosystem Token',
              logoUrl: '/pro.jpg',
            }}
            connectButton={{
              label: 'CONNECT',
              style: {
                background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                border: '2px solid #FFD700',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase' as const,
                boxShadow: '0 4px 0 #8B008B, 0 6px 10px rgba(0, 0, 0, 0.4)',
              },
            }}
            detailsButton={{
              style: {
                background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                border: '2px solid #FFD700',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 0 #8B008B, 0 6px 10px rgba(0, 0, 0, 0.4)',
              },
            }}
            supportedTokens={{
              [berachain.id]: [
                { address: AMY_TOKEN_ADDRESS, name: 'AMY', symbol: 'AMY', icon: '/pro.jpg' },
                { address: '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce', name: 'HONEY', symbol: 'HONEY', icon: '/honey.png' },
                { address: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736', name: 'USDT0', symbol: 'USDT0', icon: '/usdt0.png' },
                { address: '0x549943e04f40284185054145c6E4e9568C1D3241', name: 'USDC.e', symbol: 'USDC.e', icon: '/usdce.jpg' },
                { address: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', name: 'USDe', symbol: 'USDe', icon: '/usde.jpg' },
                { address: '0x59a61B8d3064A51a95a5D6393c03e2152b1a2770', name: 'SAIL.r', symbol: 'SAIL.r', icon: '/sail.png' },
                { address: '0xc66D1a2460De7b96631f4AC37ce906aCFa6A3c30', name: 'plsBERA', symbol: 'plsBERA', icon: '/plsbera.png' },
                { address: '0xC6173A3405Fdb1f5c42004D2d71Cba9Bf1Cfa522', name: 'plsKDK', symbol: 'plsKDK', icon: '/plskdk.png' },
                { address: '0x28602B1ae8cA0ff5CD01B96A36f88F72FeBE727A', name: 'plvHEDGE', symbol: 'plvHEDGE', icon: '/plvhedge.png' },
              ],
            }}
            theme={amyTheme}
          />
        </div>
      </header>

      {/* ── Side panel ── */}
      <div
        className={`fixed right-0 top-0 h-full z-50 flex flex-col w-full landscape:w-[350px] md:w-[350px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          backgroundColor: '#1c2028',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.6)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Panel header */}
        <div className="flex-shrink-0 px-4 pt-2 pb-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* AMY + close row */}
          <div className="flex items-center justify-between mb-2">
            <Link href="/" onClick={close} className="text-xl font-black" style={{ color: '#FFD700' }}>AMY</Link>
            <button onClick={close} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-base font-bold" aria-label="Close menu">✕</button>
          </div>

          {account ? (
            /* Connected — score | status | avatar */
            <div className="flex items-center gap-3 pb-2">
              {/* Score */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs text-gray-400 font-medium">Score</span>
                  <StarIcon />
                </div>
                <p className="text-5xl font-black text-white leading-none">{amyScore}</p>
              </div>

              <div className="w-px self-stretch bg-white/10" />

              {/* Status + perks */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CrownIcon color={TIER_COLOR[holderTier] ?? '#9ca3af'} />
                  <span className="text-sm font-bold" style={{ color: TIER_COLOR[holderTier] ?? '#9ca3af' }}>
                    {TIER_LABEL[holderTier] ?? 'Status'}
                  </span>
                </div>
                <p className="text-[11px] font-semibold mb-1" style={{ color: holderTier === 'none' ? '#f87171' : '#4ade80' }}>
                  {holderTier === 'none' ? 'Inactive' : 'Active'}
                </p>
                <Link href="/app/exclusive" onClick={close}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-gray-300 transition-colors hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span>🎁</span>
                  <span>Unlocks perks &amp; rewards</span>
                </Link>
              </div>

              {/* Avatar */}
              <Link href="/app/profile" onClick={close} className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${HOLDER_RING[holderTier] ?? 'border-white/20'} hover:opacity-80 transition-opacity`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-xl">🐻</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            /* Not connected — two column info block */
            <div className="flex gap-2 pb-2">
              {/* Left: Amy Score */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs text-gray-300 font-medium">Your Amy Score</span>
                  <StarIcon />
                </div>
                <div className="flex flex-col gap-1 mb-1">
                  <div className="h-1.5 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  <div className="h-1.5 w-10 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.2)' }} />
                </div>
                <p className="text-[10px] text-gray-400 leading-snug">
                  Connect <Link href="/app/profile" onClick={close} className="font-semibold" style={{ color: '#facc15' }}>the app</Link> to see your score and status.
                </p>
              </div>

              <div className="w-px self-stretch bg-white/10" />

              {/* Right: Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <CrownIcon color="#facc15" />
                  <span className="text-xs font-bold" style={{ color: '#facc15' }}>Status</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-1">Connect the app to see your status.</p>
                <div className="rounded-lg p-1.5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-[10px] font-semibold text-white">🎁 Unlocks perks &amp; rewards</p>
                  <p className="text-[10px] text-gray-400">Connect the app to access them.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid — scrollable */}
        <div className="grid grid-cols-2 content-start md:content-normal gap-[8px] md:gap-[4px] lg:gap-[3px] p-2 md:px-2 md:py-1 overflow-y-auto flex-1">
          {TILES.map((tile, i) => {
            if (tile.disabled) {
              return (
                <div key={i} className="flex flex-col items-center justify-center gap-1 min-h-[60px] md:h-full w-full px-2 py-2 rounded-xl"
                  style={{
                    background: 'linear-gradient(145deg, rgba(40,45,58,0.92), rgba(20,24,32,0.97))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'not-allowed',
                  }} />
              );
            }
            return (
              <Link
                key={i}
                href={tile.href!}
                onClick={close}
                className="flex flex-col items-center justify-center gap-1 min-h-[60px] md:h-full px-2 py-2 rounded-xl transition-all duration-200"
                style={{
                  background: 'linear-gradient(145deg, rgba(40,45,58,0.92), rgba(20,24,32,0.97))',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = 'linear-gradient(145deg, rgba(52,58,74,0.95), rgba(30,35,48,0.98))';
                  el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.13), 0 0 0 1px rgba(255,255,255,0.06)';
                  el.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = 'linear-gradient(145deg, rgba(40,45,58,0.92), rgba(20,24,32,0.97))';
                  el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.25)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ color: 'rgba(210,218,230,0.88)' }}>{tile.icon}</div>
                <span className="text-[14px] font-semibold leading-tight text-center"
                  style={{ color: 'rgba(210,218,230,0.82)' }}>{tile.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
