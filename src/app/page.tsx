'use client';

import Image from 'next/image';
import { LandingHeader, Footer, Background, SocialLinks } from '@/components';
import { BUY_LINK, AMY_TOKEN_ADDRESS } from '@/lib/constants';

export default function Home() {
  const copyCA = () => {
    navigator.clipboard.writeText(AMY_TOKEN_ADDRESS);
    alert('Contract address copied to clipboard!');
  };

  return (
    <>
      <Background />
      <div className="relative z-10">
        <LandingHeader />

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 md:py-24 text-center">
          <div className="mb-4 md:mb-6">
            <div className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-4 md:mb-6 rounded-full overflow-hidden border-4 md:border-8 border-yellow-400 shadow-2xl">
              <Image
                src="/pro.jpg"
                alt="Amy"
                width={192}
                height={192}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          {/* $AMY Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-3 md:mb-4 text-shadow-strong" style={{ color: '#FFB07C' }}>
            $AMY
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl font-medium mb-8 md:mb-12" style={{ color: '#FFE4C4' }}>
            The new home for your money life.
          </p>

          {/* Info Box with combined content */}
          <div className="max-w-4xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-12 mb-8 md:mb-12">
            <p className="text-lg sm:text-xl md:text-2xl text-yellow-300 font-semibold mb-4 md:mb-6">
              A powerful, advanced money app built on Berachain
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed mb-4 md:mb-6">
              Today it powers a community of &quot;Angels&quot; testing products, earning Amy Points and tracking their activity. Over time, Amy is designed to feel like the place you pay friends, plug into simple earn options, and actually understand where your money is going.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed mb-4 md:mb-6">
              $AMY is the token that unlocks deeper tiers, perks and influence inside that ecosystem.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-bold">
              Pay · Earn · Points · Learn – built on Berachain, designed for people not charts.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex justify-center">
            <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-8 text-center hover:scale-105 transition transform max-w-md w-full">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">🐻⛓️</div>
              <div className="text-xl md:text-2xl font-bold text-yellow-400 mb-2">
                Berachain Native
              </div>
              <div className="text-sm md:text-base text-gray-300">
                Built for the Berachain ecosystem
              </div>
            </div>
          </div>
        </section>

        {/* How to Get $AMY Section */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-6 text-center text-yellow-400">
              Become an Amy Angel (get $AMY)
            </h2>
            <p className="text-base md:text-lg text-gray-300 text-center mb-6 md:mb-8">
              Holding $AMY isn&apos;t required to use Amy, but it unlocks our Angel tiers, higher Amy Point rewards and deeper involvement in the ecosystem.
            </p>
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">1.</div>
                <div>
                  <div className="text-lg md:text-xl font-bold mb-1 text-white">
                    Connect Your Wallet
                  </div>
                  <div className="text-sm md:text-base text-gray-300">
                    Use a Berachain-compatible wallet
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">2.</div>
                <div>
                  <div className="text-lg md:text-xl font-bold mb-1 text-white">Add $AMY Token</div>
                  <div className="text-sm md:text-base text-gray-300">
                    Import the token contract address
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">3.</div>
                <div>
                  <div className="text-lg md:text-xl font-bold mb-1 text-white">Swap & Hold</div>
                  <div className="text-sm md:text-base text-gray-300">
                    Exchange your tokens for $AMY
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
              <a
                href={BUY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-samy w-full text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-xl font-bold uppercase block text-center"
              >
                GET $AMY ON OSITO
              </a>
              <button
                onClick={copyCA}
                className="bg-yellow-500 w-full text-black px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-xl font-bold uppercase border-4 border-black hover:bg-yellow-400 transition"
              >
                COPY CA
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-8 md:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 md:mb-8 text-yellow-400">
              JOIN THE COMMUNITY
            </h2>
            <p className="text-base md:text-xl text-gray-300 mb-8">
              Connect with us on social media and stay updated!
            </p>
            <SocialLinks size="md" />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
