'use client';

import Link from 'next/link';
import { BUY_LINK } from '@/lib/constants';

export default function LandingHeader() {
  return (
    <header className="container mx-auto px-4 py-4 md:py-6">
      <nav className="flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-3xl md:text-4xl font-bold text-shadow-strong text-white">
          $AMY
        </Link>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/app/profile" className="btn-web-app">
            <span className="btn-web-app-text">WEB APP</span>
          </Link>
          <a
            href={BUY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-samy btn-samy-enhanced text-white px-4 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-xl font-bold uppercase"
          >
            GET $AMY
          </a>
        </div>
      </nav>
    </header>
  );
}
