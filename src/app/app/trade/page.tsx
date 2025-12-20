'use client';

import { PayEmbed } from 'thirdweb/react';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS } from '@/lib/constants';

export default function TradePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black mb-3 hero-text">
            Trade
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Swap tokens instantly on Berachain
          </p>
        </div>

        {/* Swap Widget Container */}
        <div className="glass-card p-4 md:p-6 flex justify-center">
          <PayEmbed
            client={client}
            theme="dark"
            payOptions={{
              mode: "fund_wallet",
              prefillBuy: {
                chain: berachain,
                token: {
                  address: AMY_TOKEN_ADDRESS,
                  name: "AMY",
                  symbol: "AMY",
                  icon: "/pro.jpg",
                },
              },
            }}
            style={{
              width: '100%',
              maxWidth: '420px',
              border: 'none',
              borderRadius: '16px',
            }}
          />
        </div>

        {/* Info Box */}
        <div className="info-box p-4 md:p-6 mt-6">
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <span className="text-yellow-400 font-bold">Powered by thirdweb</span> - Swap any token from any chain directly to $AMY on Berachain.
            </p>
            <p>
              The widget automatically handles bridging and routing for the best rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
