'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NAV_LINKS, BUY_LINK } from '@/lib/constants';

interface HeaderProps {
  showWalletButton?: boolean;
  walletButton?: React.ReactNode;
}

export default function Header({ showWalletButton = false, walletButton }: HeaderProps) {
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
          <Link href="/" className="text-3xl font-black text-shadow-strong" style={{ color: '#FFD700' }}>
            AMY
          </Link>
        </div>

        {/* Desktop: Logo */}
        <Link href="/" className="hidden md:block text-4xl font-black text-shadow-strong" style={{ color: '#FFD700' }}>
          AMY
        </Link>

        {/* Desktop: Nav Buttons + Menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            HOME
          </Link>
          <a
            href={BUY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            GET $AMY
          </a>
          <button
            onClick={toggleMenu}
            className="btn-samy btn-samy-enhanced text-white px-8 py-3 rounded-full text-xl font-bold uppercase"
          >
            MENU
          </button>
        </div>

        {/* Mobile: Home Button */}
        <Link
          href="/"
          className="md:hidden btn-samy btn-samy-enhanced text-white px-4 py-2 rounded-full text-sm font-bold uppercase"
        >
          HOME
        </Link>
      </nav>

      {/* Wallet Button (shown on app pages) */}
      {showWalletButton && walletButton && (
        <div className="mt-4">
          {walletButton}
        </div>
      )}

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
          <div className="md:mr-12 space-y-6 relative z-50">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block btn-samy btn-samy-enhanced text-white px-12 py-4 rounded-full text-xl font-bold uppercase text-center cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={BUY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="block btn-samy btn-samy-enhanced text-white px-12 py-4 rounded-full text-xl font-bold uppercase text-center cursor-pointer"
            >
              GET $AMY
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
