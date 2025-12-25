'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SwapWidget } from 'thirdweb/react';
import { client } from '@/app/client';
import { BERACHAIN_ID } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS } from '@/lib/constants';

// Known token addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  'AMY': AMY_TOKEN_ADDRESS,
  'HONEY': '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce',
  'BERA': '', // Native token, no address needed
};

export default function TradePage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get from/to tokens from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  // Resolve token address - if it's a known symbol, use its address; otherwise treat it as an address
  const resolveTokenAddress = (param: string | null): string | undefined => {
    if (!param) return undefined;
    // Check if it's a known symbol
    const upperParam = param.toUpperCase();
    if (upperParam in TOKEN_ADDRESSES) {
      return TOKEN_ADDRESSES[upperParam] || undefined; // Return undefined for native BERA
    }
    // Otherwise assume it's already an address
    if (param.startsWith('0x')) {
      return param;
    }
    return undefined;
  };

  const sellTokenAddress = resolveTokenAddress(fromParam);
  const buyTokenAddress = resolveTokenAddress(toParam) || AMY_TOKEN_ADDRESS;

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-4xl font-black mb-2 hero-text">
            Trade
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">
            Swap tokens on Berachain
          </p>
        </div>

        {/* Swap Widget Container */}
        <div className="glass-card p-3 md:p-4 flex justify-center min-h-[400px] items-center">
          {mounted ? (
            <SwapWidget
              key={`${fromParam || 'default'}-${toParam || 'default'}`}
              client={client}
              theme="dark"
              prefill={{
                sellToken: sellTokenAddress ? {
                  chainId: BERACHAIN_ID,
                  tokenAddress: sellTokenAddress,
                } : {
                  chainId: BERACHAIN_ID,
                },
                buyToken: {
                  chainId: BERACHAIN_ID,
                  tokenAddress: buyTokenAddress,
                },
              }}
              style={{
                width: '100%',
                maxWidth: '360px',
                border: 'none',
                borderRadius: '12px',
              }}
            />
          ) : (
            <div className="loading-spinner w-10 h-10" />
          )}
        </div>

      </div>
    </div>
  );
}
