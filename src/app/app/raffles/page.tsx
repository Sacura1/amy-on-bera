'use client';

import Link from 'next/link';

export default function RafflesPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">🎟️</div>
          <h1 className="text-3xl md:text-4xl font-black text-yellow-400 mb-4">
            Raffles
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Coming Soon
          </p>
          <p className="text-gray-500 text-sm">
            Something exciting is in the works...
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
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
