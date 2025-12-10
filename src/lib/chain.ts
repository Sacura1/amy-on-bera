import { defineChain } from 'thirdweb';

// Berachain Mainnet Configuration
export const berachain = defineChain({
  id: 80094,
  name: 'Berachain',
  nativeCurrency: {
    name: 'BERA',
    symbol: 'BERA',
    decimals: 18,
  },
  rpc: 'https://rpc.berachain.com/',
  blockExplorers: [
    {
      name: 'Beratrail',
      url: 'https://beratrail.io/',
    },
  ],
});

// Export chain ID for convenience
export const BERACHAIN_ID = 80094;
