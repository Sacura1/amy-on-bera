'use client';

import Link from 'next/link';
import { useState } from 'react';

const PANEL_W = 350;

const EarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="17 7 21 7 21 11" />
  </svg>
);

const TradeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
    <path d="M5 8h14M19 8l-4-4M19 8l-4 4"/>
    <path d="M19 16H5M5 16l4-4M5 16l4 4"/>
  </svg>
);

const PortfolioIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    <rect x="2.5" y="16" width="4" height="5" rx="0.5" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="4.5" y1="12.5" x2="4.5" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="4.5" y1="21" x2="4.5" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <rect x="10" y="10" width="4" height="11" rx="0.5" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="12" y1="6.5" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <rect x="17.5" y="5" width="4" height="16" rx="0.5" fill="rgba(255,255,255,0.18)" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="19.5" y1="2" x2="19.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="19.5" y1="21" x2="19.5" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const AmyPointsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 6.8l1.2 3.6h3.8l-3.1 2.2 1.2 3.6-3.1-2.3-3.1 2.3 1.2-3.6-3.1-2.2h3.8z" fill="currentColor"/>
  </svg>
);

const RafflesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
    <path d="M3 12v10h14V12"/>
    <path d="M3 12l4-4h14l-4 4"/>
    <path d="M17 12l4-4v10l-4 4"/>
    <line x1="10" y1="12" x2="10" y2="22"/>
    <line x1="10" y1="12" x2="14" y2="8"/>
    <line x1="3" y1="16" x2="17" y2="16"/>
    <line x1="5" y1="10" x2="19" y2="10"/>
    <path d="M14 8C11 5.5 9 3.5 11 2.5S14.5 4.5 14 8z"/>
    <path d="M14 8C17 5.5 19 3.5 17 2.5S13.5 4.5 14 8z"/>
  </svg>
);

const LeaderboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[30px] h-[30px]">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[30px] h-[30px]">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const ExclusiveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    <path d="M9.5 5.5L7 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M14.5 5.5L17 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <rect x="2.5" y="5" width="19" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="2.5" y1="14" x2="21.5" y2="14" stroke="currentColor" strokeWidth="1"/>
    <path d="M2.5 14h19v5.5a1.5 1.5 0 0 1-1.5 1.5h-16a1.5 1.5 0 0 1-1.5-1.5V14z" fill="currentColor"/>
    <text x="12" y="19.5" textAnchor="middle" fontSize="5.5" fontWeight="900" fontFamily="Arial,sans-serif" fill="rgba(12,18,32,0.95)" letterSpacing="1">VIP</text>
  </svg>
);

const PartnersIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[30px] h-[30px]">
    <path d="M12 12L12 5M12 12L20 9M12 12L19 18.5M12 12L4 17M12 5L20 9M4 17L19 18.5"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="12" r="2.8" fill="currentColor"/>
    <circle cx="12" cy="5" r="1.9" fill="currentColor"/>
    <circle cx="20" cy="9" r="2.1" fill="currentColor"/>
    <circle cx="19" cy="18.5" r="1.5" fill="currentColor"/>
    <circle cx="4" cy="17" r="1.7" fill="currentColor"/>
  </svg>
);

interface Tile { label?: string; href?: string; icon?: React.ReactNode; disabled?: boolean; }

const TILES: Tile[] = [
  { label: 'Earn',                  href: '/app/earn',        icon: <EarnIcon /> },
  { label: 'Trade',                 href: '/app/trade',       icon: <TradeIcon /> },
  { label: 'Portfolio',             href: '/app/portfolio',   icon: <PortfolioIcon /> },
  { label: 'Amy Points',           href: '/app/points',      icon: <AmyPointsIcon /> },
  { label: 'Raffles',               href: '/app/raffles',     icon: <RafflesIcon /> },
  { label: 'Leaderboard',           href: '/app/leaderboard', icon: <LeaderboardIcon /> },
  { label: 'Profile',               href: '/app/profile',     icon: <ProfileIcon /> },
  { label: 'Exclusive Access',      href: '/app/exclusive',   icon: <ExclusiveIcon /> },
  { label: 'Partners & Investors',  href: '/app/partners',    icon: <PartnersIcon /> },
  { disabled: true },
  { disabled: true },
  { disabled: true },
];

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="#facc15" className="w-4 h-4 flex-shrink-0">
    <path d="M5 16L2 7l5 3.5 5-6.5 5 6.5L22 7l-3 9H5zm0 2h14v2H5v-2z"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="1.8" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const TILE_STYLE = {
  background: 'linear-gradient(145deg, rgba(40,45,58,0.92), rgba(20,24,32,0.97))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
};

export default function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <>
      <header className="container mx-auto px-4 py-4 md:py-3 landscape:py-1">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-3xl md:text-4xl landscape:text-2xl font-black text-shadow-strong" style={{ color: '#FFD700' }}>
            AMY
          </Link>

          <div
            className="hidden md:flex items-center gap-4 landscape:gap-2"
            style={{ marginRight: isOpen ? PANEL_W : 0, transition: 'margin-right 300ms cubic-bezier(0.4,0,0.2,1)' }}
          >
            <Link href="/app/profile" className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase">PROFILE</Link>
            <Link href="/app/earn" className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase">EARN</Link>
            <Link href="/app/points" className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase">AMY POINTS</Link>
            <button onClick={() => setIsOpen(true)} className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase">MENU</button>
          </div>

          <div className="flex md:hidden items-center gap-2 landscape:gap-1">
            <Link href="/app/profile" className="btn-samy btn-samy-enhanced text-white px-4 py-2 landscape:px-2 landscape:py-1 landscape:text-[10px] rounded-full text-sm font-bold uppercase">PROFILE</Link>
            <button onClick={() => setIsOpen(true)} className="btn-samy btn-samy-enhanced text-white px-4 py-2 landscape:px-2 landscape:py-1 landscape:text-[10px] rounded-full text-sm font-bold uppercase">MENU</button>
          </div>
        </nav>
      </header>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={close} />}

      <div
        className={`fixed right-0 top-0 h-full z-50 flex flex-col w-full landscape:w-[350px] md:w-[350px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          backgroundColor: '#1c2028',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
          transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Panel header */}
        <div className="flex-shrink-0 px-4 pt-2 pb-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* AMY + close row */}
          <div className="flex items-center justify-between mb-2">
            <Link href="/" onClick={close} className="text-xl font-black" style={{ color: '#FFD700' }}>AMY</Link>
            <button onClick={close} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-base font-bold">✕</button>
          </div>

          {/* Not connected — two column info block */}
          <div className="flex gap-2 pb-2">
            {/* Left: Amy Score */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-300 font-medium">Your Amy Score</span>
                <StarIcon />
              </div>
              <div className="flex flex-col gap-1 mb-1">
                <div className="h-1.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="h-1.5 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <p className="text-[10px] text-gray-400 leading-snug">
                Connect <Link href="/app/profile" onClick={close} className="font-semibold" style={{ color: '#facc15' }}>the app</Link> to see your score and status.
              </p>
            </div>

            <div className="w-px self-stretch bg-white/10" />

            {/* Right: Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <CrownIcon />
                <span className="text-xs font-bold" style={{ color: '#facc15' }}>Status</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-1">Connect the app to see your status.</p>
              <div className="rounded-lg p-1.5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-[10px] font-semibold text-white">🎁 Unlocks perks &amp; rewards</p>
                <p className="text-[10px] text-gray-400">Connect the app to access them.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 content-start md:content-normal gap-[8px] md:gap-[4px] lg:gap-[3px] p-2 md:px-2 md:py-1 overflow-y-auto flex-1">
          {TILES.map((tile, i) => {
            if (tile.disabled) {
              return (
                <div key={i} className="flex flex-col items-center justify-center gap-1.5 min-h-[52px] md:h-full w-full px-2 py-3 rounded-xl"
                  style={{ ...TILE_STYLE, cursor: 'not-allowed' }} />
              );
            }
            return (
              <Link key={i} href={tile.href!} onClick={close}
                className="flex flex-col items-center justify-center gap-1 min-h-[52px] md:h-full px-2 py-2 rounded-xl transition-all duration-200"
                style={TILE_STYLE}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'linear-gradient(145deg, rgba(52,58,74,0.95), rgba(30,35,48,0.98))';
                  el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.13), 0 0 0 1px rgba(255,255,255,0.06)';
                  el.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
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
