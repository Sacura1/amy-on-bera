'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SwapWidget } from 'thirdweb/react';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS } from '@/lib/constants';

// Known token addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  'AMY': AMY_TOKEN_ADDRESS,
  'HONEY': '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce',
  'BERA': '', // Native token, no address needed
};

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

function TradeWidget() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get from/to tokens from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  // Default to HONEY if no from token specified
  const sellTokenAddress = resolveTokenAddress(fromParam) || TOKEN_ADDRESSES['HONEY'];
  const buyTokenAddress = resolveTokenAddress(toParam) || AMY_TOKEN_ADDRESS;

  if (!mounted) {
    return <div className="loading-spinner w-10 h-10" />;
  }

  return (
    <SwapWidget
      key={`${fromParam || 'default'}-${toParam || 'default'}`}
      client={client}
      theme="dark"
      prefill={{
        sellToken: {
          chainId: berachain.id,
          tokenAddress: sellTokenAddress,
        },
        buyToken: {
          chainId: berachain.id,
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
  );
}

export default function TradePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-md mx-auto">
        {/* Swap Widget Container */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-3 md:p-4 flex justify-center min-h-[400px] items-center">
          <Suspense fallback={<div className="loading-spinner w-10 h-10" />}>
            <TradeWidget />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
