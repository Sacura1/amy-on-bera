'use client';

import Link from 'next/link';

export default function PointsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="text-4xl md:text-7xl mb-3 md:mb-4">⭐</div>
          <h1 className="text-3xl md:text-6xl font-black mb-3 md:mb-4 text-shadow-strong" style={{ color: '#FF1493' }}>
            Amy Points
          </h1>
        </div>

        {/* Main Intro */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <p className="text-sm md:text-xl text-yellow-300 leading-relaxed font-medium mb-3 md:mb-4">
            Amy Points are our way of rewarding behaviour, not gambling.
          </p>
          <p className="text-sm md:text-lg text-gray-300">
            They are not a token and not something you trade – they&apos;re a points system that sits on top of the app and our partner ecosystem.
          </p>
        </div>

        {/* How to Earn */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🎯</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              How to Earn Points
            </h2>
          </div>

          <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">You&apos;ll earn Amy Points for things like:</p>

          <div className="space-y-2 md:space-y-3">
            <div className="flex items-start gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-xl md:text-2xl">📅</span>
              <span className="text-gray-300 text-sm md:text-base">showing up regularly and using the app,</span>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-xl md:text-2xl">🎪</span>
              <span className="text-gray-300 text-sm md:text-base">taking part in Weekly Focus campaigns,</span>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-xl md:text-2xl">🤝</span>
              <span className="text-gray-300 text-sm md:text-base">trying partner products through Amy,</span>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-black/40 p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-400/20">
              <span className="text-xl md:text-2xl">📚</span>
              <span className="text-gray-300 text-sm md:text-base">completing short &quot;learn & earn&quot; tasks around APR/APY, risk and good money habits.</span>
            </div>
          </div>
        </div>

        {/* What Points Can Be Used For */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🛒</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Spend Your Points On
            </h2>
          </div>

          <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">Over time, Points will be spendable on things like:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-pink-900/40 to-purple-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-pink-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🚀</div>
              <h4 className="text-base md:text-lg font-bold text-pink-400 mb-1 md:mb-2">Boosts</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Earn points faster for a period of time
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-purple-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎲</div>
              <h4 className="text-base md:text-lg font-bold text-purple-400 mb-1 md:mb-2">Games</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Raffles and prediction-style games
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-blue-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎯</div>
              <h4 className="text-base md:text-lg font-bold text-blue-400 mb-1 md:mb-2">Access</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Special campaigns or cosmetic upgrades
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-emerald-500/30">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎮</div>
              <h4 className="text-base md:text-lg font-bold text-emerald-400 mb-1 md:mb-2">Stay & Play</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                Other fun features inside Amy
              </p>
            </div>
          </div>
        </div>

        {/* Angels Info */}
        <div className="info-box p-4 md:p-10 mb-6 md:mb-8" style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.05))', borderColor: '#FFD700' }}>
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="text-3xl md:text-5xl">👼</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Angels Get More
            </h2>
          </div>

          <p className="text-yellow-300 text-sm md:text-lg">
            <strong>Angels</strong> (people who hold $AMY) will have extra ways to earn and use Amy Points, but everyone can start building a balance.
          </p>
        </div>

        {/* Current Status */}
        <div className="info-box p-4 md:p-10">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">📊</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Current Status
            </h2>
          </div>

          <p className="text-gray-400 text-sm md:text-lg">
            Full Amy Points hub is still rolling out – right now we use it mainly for <span className="text-yellow-300 font-semibold">leaderboards</span> and <span className="text-yellow-300 font-semibold">Focus rewards</span> – but this will become a core part of the app as we move toward the full money experience.
          </p>
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
