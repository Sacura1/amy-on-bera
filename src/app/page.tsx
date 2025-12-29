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
        <section className="container mx-auto px-4 py-8 md:py-16 text-center">
          <div className="mb-4 md:mb-6">
            <div className="w-28 h-28 md:w-40 md:h-40 mx-auto mb-4 md:mb-6 rounded-full overflow-hidden border-4 md:border-6 border-yellow-400 shadow-2xl">
              <Image
                src="/pro.jpg"
                alt="Amy"
                width={160}
                height={160}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          {/* AMY Title - Bright Yellow like "Join the Community" */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 md:mb-8 text-shadow-strong" style={{ color: '#FFD700' }}>
            AMY
          </h1>

          {/* Main Content Box */}
          <div className="max-w-2xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-8 mb-6">
            {/* Subtitle */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-6" style={{ color: '#FFD700' }}>
              The new home for your money
            </h2>

            {/* Body copy */}
            <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-3">
              A modern money app built on Berachain.
            </p>
            <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-6">
              Amy helps you manage value, explore opportunities, and understand where your money actually goes.
            </p>

            {/* Tagline */}
            <p className="text-lg md:text-xl font-bold text-white">
              Pay · Earn · Points · Learn
            </p>
          </div>

          {/* Feature Sections Box */}
          <div className="max-w-2xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-8 mb-6">
            {/* PAY */}
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-black mb-2" style={{ color: '#FFD700' }}>PAY</h3>
              <p className="text-base md:text-lg text-gray-200">
                Move value simply and securely.
              </p>
            </div>

            {/* EARN */}
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-black mb-2" style={{ color: '#FFD700' }}>EARN</h3>
              <p className="text-base md:text-lg text-gray-200">
                Access real opportunities across the ecosystem.
              </p>
            </div>

            {/* POINTS */}
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-black mb-2" style={{ color: '#FFD700' }}>POINTS</h3>
              <p className="text-base md:text-lg text-gray-200">
                Track progress, unlock rewards, and level up.
              </p>
            </div>

            {/* LEARN */}
            <div>
              <h3 className="text-xl md:text-2xl font-black mb-2" style={{ color: '#FFD700' }}>LEARN</h3>
              <p className="text-base md:text-lg text-gray-200">
                Understand what you&apos;re using and why.
              </p>
            </div>
          </div>

          {/* WHY IT MATTERS Box */}
          <div className="max-w-2xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-8 mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-6" style={{ color: '#FFD700' }}>
              WHY IT MATTERS
            </h2>

            <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-6">
              Amy brings your money, activity, and progress into one place — without the usual complexity.
            </p>

            <div className="text-base md:text-lg text-gray-200 mb-6 space-y-1">
              <p>No juggling apps.</p>
              <p>No guessing what&apos;s working.</p>
              <p>No noise.</p>
            </div>

            <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-6">
              Just a clear view of where your value lives, how it&apos;s growing, and what you can do next.
            </p>

            <div className="text-base md:text-lg text-gray-200 space-y-1">
              <p>Built to make sense.</p>
              <p>Built to reward real participation.</p>
            </div>
          </div>

          {/* Join the Community Box */}
          <div className="max-w-2xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 md:mb-6" style={{ color: '#FFD700' }}>
              JOIN THE COMMUNITY
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6">
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
