'use client';

import Link from 'next/link';
import { useState } from 'react';

// Menu items for the dropdown
const MENU_ITEMS = [
  { href: '/app/profile', label: 'PROFILE' },
  { href: '/app/earn', label: 'EARN' },
  { href: '/app/points', label: 'AMY POINTS' },
  { href: '/app/trade', label: 'TRADE' },
  { href: '/app/leaderboard', label: 'LEADERBOARDS' },
  { href: '/app/partners', label: 'PARTNERS & INVESTORS' },
];

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="container mx-auto px-4 py-4 md:py-6">
      <nav className="flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-3xl md:text-4xl font-black text-shadow-strong" style={{ color: '#FFD700' }}>
          AMY
        </Link>

        {/* Desktop: 4 buttons - Profile, Earn, Amy Points, Menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/app/profile"
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            PROFILE
          </Link>
          <Link
            href="/app/earn"
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            EARN
          </Link>
          <Link
            href="/app/points"
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            AMY POINTS
          </Link>
          <button
            onClick={toggleMenu}
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            MENU
          </button>
        </div>

        {/* Mobile: Profile + Menu buttons */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/app/profile"
            className="btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full text-sm font-bold uppercase"
          >
            PROFILE
          </Link>
          <button
            onClick={toggleMenu}
            className="btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full text-sm font-bold uppercase"
          >
            MENU
          </button>
        </div>
      </nav>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full z-40 flex items-center justify-center md:justify-end animate-fadeIn"
          style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleMenu();
            }
          }}
        >
          <div className="md:mr-12 space-y-2 md:space-y-3 relative z-50 max-h-[80vh] overflow-y-auto px-4">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block btn-samy btn-samy-enhanced text-white px-6 md:px-10 py-2 md:py-2.5 rounded-full text-sm md:text-base font-bold uppercase text-center cursor-pointer"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
