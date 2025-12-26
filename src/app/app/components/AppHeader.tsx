'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ConnectButton } from 'thirdweb/react';
import { darkTheme } from 'thirdweb/react';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { BUY_LINK, AMY_TOKEN_ADDRESS } from '@/lib/constants';

// Custom theme matching Amy's pink/gold design
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

// Full menu items - same structure for desktop and mobile
const MENU_ITEMS = [
  { href: '/app/profile', label: 'PROFILE' },
  { href: '/app/earn', label: 'EARN' },
  { href: '/app/points', label: 'AMY POINTS' },
  { href: '/app/leaderboard', label: 'LEADERBOARD' },
  { href: '/app/trade', label: 'TRADE' },
  { href: BUY_LINK, label: 'GET $AMY', external: true },
  { href: '/app/contact', label: 'PARTNERS & INVESTORS' },
];

export default function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="container mx-auto px-4 py-4 md:py-6">
      <nav className="flex justify-between items-center">
        {/* Mobile: Hamburger + Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleMenu}
            className="text-white focus:outline-none z-50"
            aria-label="Toggle menu"
          >
            <div className="space-y-2">
              <span
                className={`block w-8 h-1 bg-yellow-400 transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-3' : ''
                }`}
              />
              <span
                className={`block w-8 h-1 bg-yellow-400 transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-8 h-1 bg-yellow-400 transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-3' : ''
                }`}
              />
            </div>
          </button>
          <Link href="/" className="text-3xl font-bold text-shadow-strong text-white">
            $AMY
          </Link>
        </div>

        {/* Desktop: Logo */}
        <Link href="/" className="hidden md:block text-4xl font-bold text-shadow-strong text-white">
          $AMY
        </Link>

        {/* Desktop: Nav Buttons - Profile, Earn, Amy Points, Menu */}
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

        {/* Mobile: Profile Button */}
        <Link
          href="/app/profile"
          className="md:hidden btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full text-sm font-bold uppercase"
        >
          PROFILE
        </Link>
      </nav>

      {/* Wallet Connect Button using thirdweb */}
      <div className="mt-4">
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
              {
                address: AMY_TOKEN_ADDRESS,
                name: 'AMY',
                symbol: 'AMY',
                icon: '/pro.jpg',
              },
              {
                address: '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce',
                name: 'HONEY',
                symbol: 'HONEY',
                icon: '/honey.jpg',
              },
              {
                address: '0x59a61B8d3064A51a95a5D6393c03e2152b1a2770',
                name: 'SAIL.r',
                symbol: 'SAIL.r',
                icon: '/sail.jpg',
              },
              {
                address: '0x28602B1ae8cA0ff5CD01B96A36f88F72FeBE727A',
                name: 'plvHEDGE',
                symbol: 'plvHEDGE',
                icon: '/plvhedge.jpg',
              },
            ],
          }}
          theme={amyTheme}
        />
      </div>

      {/* Dropdown Menu - Same structure for desktop and mobile */}
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
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="block btn-samy btn-samy-enhanced text-white px-6 md:px-10 py-2 md:py-2.5 rounded-full text-sm md:text-base font-bold uppercase text-center cursor-pointer"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block btn-samy btn-samy-enhanced text-white px-6 md:px-10 py-2 md:py-2.5 rounded-full text-sm md:text-base font-bold uppercase text-center cursor-pointer"
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
