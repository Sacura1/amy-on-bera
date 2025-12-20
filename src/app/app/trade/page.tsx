'use client';

import { SwapWidget } from 'thirdweb/react';
import { client } from '@/app/client';
import { BERACHAIN_ID } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS } from '@/lib/constants';

export default function TradePage() {
  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-4xl font-black mb-2 hero-text">
            Trade
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">
            Swap BERA for $AMY on Berachain
          </p>
        </div>

        {/* Swap Widget Container */}
        <div className="glass-card p-3 md:p-4 flex justify-center">
          <SwapWidget
            client={client}
            theme="dark"
            prefill={{
              sellToken: {
                chainId: BERACHAIN_ID,
              },
              buyToken: {
                chainId: BERACHAIN_ID,
                tokenAddress: AMY_TOKEN_ADDRESS,
              },
            }}
            style={{
              width: '100%',
              maxWidth: '360px',
              border: 'none',
              borderRadius: '12px',
            }}
          />
        </div>

      </div>
    </div>
  );
}
