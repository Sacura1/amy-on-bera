'use client';

import Link from 'next/link';
import { SOCIAL_LINKS } from '@/lib/constants';
import { XIcon } from '@/components';

export default function EarnPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="text-4xl md:text-7xl mb-3 md:mb-4">💰</div>
          <h1 className="text-3xl md:text-6xl font-black mb-3 md:mb-4 text-shadow-strong" style={{ color: '#FF1493' }}>
            Earn with Amy
          </h1>
          <p className="text-lg md:text-2xl font-bold text-yellow-400">
            (coming soon)
          </p>
        </div>

        {/* Main Content */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <p className="text-sm md:text-xl text-yellow-300 leading-relaxed font-medium mb-4 md:mb-6">
            We&apos;re designing simple, Amy-branded strategies that sit on top of trusted partners on Berachain – so you don&apos;t have to dig through a DeFi jungle.
          </p>

          <p className="text-base md:text-xl font-bold text-white mb-4 md:mb-6">
            The idea is straightforward:
          </p>

          {/* Strategy Lanes */}
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <h3 className="text-lg md:text-2xl font-black text-yellow-400 mb-3 md:mb-4">
              Choose a lane that fits your risk:
            </h3>

            <div className="bg-gradient-to-r from-green-900/40 to-green-800/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-green-500/50">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-4xl">🟢</div>
                <div>
                  <h4 className="text-base md:text-xl font-bold text-green-400 mb-1 md:mb-2">Amy Stable</h4>
                  <p className="text-gray-300 text-xs md:text-base">
                    Boring on purpose, capital preservation first.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-900/40 to-amber-800/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-yellow-500/50">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-4xl">🟡</div>
                <div>
                  <h4 className="text-base md:text-xl font-bold text-yellow-400 mb-1 md:mb-2">Amy Balanced</h4>
                  <p className="text-gray-300 text-xs md:text-base">
                    A mix of stable yield and a bit more upside.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/40 to-red-800/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-red-500/50">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-4xl">🔴</div>
                <div>
                  <h4 className="text-base md:text-xl font-bold text-red-400 mb-1 md:mb-2">Amy Hedge</h4>
                  <p className="text-gray-300 text-xs md:text-base">
                    Higher risk / higher potential, clearly explained.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Under the Hood */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">⚙️</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Under the Hood
            </h2>
          </div>

          <p className="text-gray-300 text-sm md:text-lg mb-3 md:mb-4">
            Amy routes into curated partners:
          </p>

          <div className="bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-yellow-400/30">
            <p className="text-gray-400 text-xs md:text-base">
              For example: <span className="text-yellow-300 font-semibold">Plutus, Bulla, Osito</span> and other Berachain projects as they&apos;re vetted.
            </p>
          </div>
        </div>

        {/* What You See */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">👀</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              On the Surface, You See
            </h2>
          </div>

          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-yellow-400 text-xl md:text-2xl">💵</span>
              <span className="text-gray-300 text-sm md:text-base">what you&apos;ve put in,</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-yellow-400 text-xl md:text-2xl">📈</span>
              <span className="text-gray-300 text-sm md:text-base">what it&apos;s earned,</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-yellow-400 text-xl md:text-2xl">📋</span>
              <span className="text-gray-300 text-sm md:text-base">and a plain-language breakdown of risk, fees and where the yield comes from.</span>
            </div>
          </div>

          <p className="text-gray-300 mt-4 md:mt-6 text-sm md:text-lg">
            We&apos;ll start small and transparent, then expand as we prove things out.
          </p>
        </div>

        {/* Status */}
        <div className="info-box p-4 md:p-10">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🚧</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Current Status
            </h2>
          </div>

          <p className="text-sm md:text-lg text-white font-semibold mb-3 md:mb-4">
            Earn is in active design and testing.
          </p>

          <p className="text-gray-400 text-sm md:text-base mb-4 md:mb-6">
            If you want to be early on this, keep an eye on our X and the Amy site – Angels will be the first to try it.
          </p>

          <a
            href={SOCIAL_LINKS.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase inline-flex items-center gap-2 md:gap-3"
          >
            <XIcon className="w-4 h-4 md:w-5 md:h-5" />
            Follow
          </a>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/"
            className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase inline-block"
          >
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
