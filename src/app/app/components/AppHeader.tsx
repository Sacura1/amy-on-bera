'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ConnectButton } from 'thirdweb/react';
import { darkTheme } from 'thirdweb/react';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS } from '@/lib/constants';

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
  { href: '/app/trade', label: 'TRADE' },
  { href: '/app/leaderboard', label: 'LEADERBOARDS' },
  { href: '/app/partners', label: 'PARTNERS & INVESTORS' },
];

export default function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="container mx-auto px-4 py-4 md:py-6">
      <nav className="flex justify-between items-center">
        {/* Logo - links to home */}
        <Link href="/" className="text-3xl md:text-4xl font-black text-shadow-strong" style={{ color: '#FFD700' }}>
          AMY
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
                address: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736',
                name: 'USDT0',
                symbol: 'USDT0',
                icon: '/usdt0.jpg',
              },
              {
                address: '0x549943e04f40284185054145c6E4e9568C1D3241',
                name: 'USDC.e',
                symbol: 'USDC.e',
                icon: '/usdce.jpg',
              },
              {
                address: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
                name: 'USDe',
                symbol: 'USDe',
                icon: '/usde.jpg',
              },
              {
                address: '0x59a61B8d3064A51a95a5D6393c03e2152b1a2770',
                name: 'SAIL.r',
                symbol: 'SAIL.r',
                icon: '/sail.jpg',
              },
              {
                address: '0xc66D1a2460De7b96631f4AC37ce906aCFa6A3c30',
                name: 'plsBERA',
                symbol: 'plsBERA',
                icon: '/plsbera.jpg',
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
