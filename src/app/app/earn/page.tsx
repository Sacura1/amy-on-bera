'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { API_BASE_URL } from '@/lib/constants';

interface LpData {
  lpValueUsd: number;
  totalLpValueUsd: number;
  lpMultiplier: number;
  positionsFound: number;
  inRangePositions: number;
  isInRange: boolean;
  amyPriceUsd: number;
}

interface TokenHolding {
  token: string;
  address: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
  multiplier: number;
  isActive: boolean;
}

interface TokenHoldingsData {
  sailr: TokenHolding;
  plvhedge: TokenHolding;
  plsbera: TokenHolding;
  honeybend: TokenHolding;
  stakedbera: TokenHolding;
  bgt: TokenHolding;
  snrusd: TokenHolding;
  jnrusd: TokenHolding;
}
interface DynamicPoolData {
  tvl: string;
  apr: string;
}

interface DynamicEarnData {
  'amy-honey': DynamicPoolData;
  'sailr': DynamicPoolData;
  'snrusd': DynamicPoolData;
  'jnrusd': DynamicPoolData;
  'plvhedge': DynamicPoolData;
  'plsbera': DynamicPoolData;
  'honeybend': DynamicPoolData;
  'stakedbera': DynamicPoolData;
  lastUpdated: string;
}

interface Strategy {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  tvl: string;
  apr: string;
  amyPoints: string;
  riskCategory: 'hedge' | 'balanced' | 'stable';
  actionType: 'deposit' | 'buy';
  actionUrl?: string;
  buyToken?: string;
  fromToken?: string;
  description: string;
  protocolUrl?: string;
  // Custom label for the info panel action button
  infoButtonLabel?: string;
  // For deposit strategies that also need a "Buy" button for underlying token
  buyUnderlying?: {
    token: string;
    fromToken: string;
  };
  // Whether this strategy's TVL/APY can be dynamically updated
  dynamicDataKey?: string;
  // Chain the strategy is on
  chain: 'berachain' | 'base';
  // Target tokens (what users get/swap to)
  targetTokens: string[];
}

const STRATEGIES: Strategy[] = [
  // 1. AMY/HONEY – LP
  {
    id: 'amy-honey',
    name: 'AMY/HONEY – LP',
    subtitle: 'Bulla Exchange',
    image: '/bulla.jpg',
    tvl: '$1.17K',
    apr: '2.11%',
    amyPoints: 'Earn up to 100x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84',
    description: 'Provide liquidity to the AMY/HONEY pool on Bulla Exchange. This is a manual concentrated liquidity pool — you deposit both AMY and HONEY and choose a price range where your liquidity is active. Narrow ranges can earn more fees but may fall out of range if the price moves. A full range is simpler but less capital-efficient.\n\nEarn swap fees from traders using the pool. Fees accrue separately and can be claimed on Bulla Exchange.\n\nYour multiplier tier is based on the live USD value of this position.',
    infoButtonLabel: 'AMY Pool',
    dynamicDataKey: 'amy-honey',
    buyUnderlying: {
      token: '0x098a75baeddec78f9a8d0830d6b86eac5cc8894e', // AMY token
      fromToken: 'HONEY',
    },
    chain: 'berachain',
    targetTokens: ['AMY', 'HONEY'],
  },
  // 2. HONEY Lent
  {
    id: 'honeybend',
    name: 'HONEY – Lent',
    subtitle: 'Bend Protocol',
    image: '/honey.jpg',
    tvl: '$12.5M',
    apr: '8%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'stable',
    actionType: 'deposit',
    actionUrl: 'https://bend.berachain.com/lend/80094/0x30BbA9CD9Eb8c95824aa42Faa1Bb397b07545bc1',
    description: 'Lend HONEY on Bend to earn lending interest from borrowers. Lenders earn BGT rewards, which must be manually claimed. Holding BGT also unlocks a separate Amy Points badge.\n\nYour multiplier tier is based on the live USD value of this position.',
    protocolUrl: 'https://bend.berachain.com/lend/80094/0x30BbA9CD9Eb8c95824aa42Faa1Bb397b07545bc1',
    buyUnderlying: {
      token: '0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03', // HONEY
      fromToken: 'BERA',
    },
    dynamicDataKey: 'honeybend',
    chain: 'berachain',
    targetTokens: ['HONEY'],
  },
  // 3. BERA – Staked
  {
    id: 'stakedbera',
    name: 'BERA – Staked',
    subtitle: 'Berachain Staking',
    image: '/BERA.png',
    tvl: '$85M',
    apr: '21%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'balanced',
    actionType: 'deposit',
    actionUrl: 'https://hub.berachain.com/stake',
    description: 'Stake BERA to receive sWBERA and earn staking rewards. sWBERA uses an appreciating token model — your token balance stays constant, but each sWBERA increases in value relative to BERA as rewards accrue. Yield is generated from Berachain staking rewards and reflected in the rising exchange rate.\n\nYour multiplier tier is based on the live USD value of this position.',
    protocolUrl: 'https://hub.berachain.com/stake',
    buyUnderlying: {
      token: '0x118D2cEeE9785eaf70C15Cd74CD84c9f8c3EeC9a', // sWBERA
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'stakedbera',
    chain: 'berachain',
    targetTokens: ['BERA'],
  },
  // 4. plsBERA
  {
    id: 'plsbera',
    name: 'plsBERA – Staked',
    subtitle: 'Plutus',
    image: '/plsbera.jpg',
    tvl: '$22K',
    apr: '31.91%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://plutus.fi/Assets/a/plsBERA/tab/stake',
    description: 'Stake BERA into plsBERA via Plutus. plsBERA uses an appreciating token model — your token balance stays constant, but each plsBERA increases in value relative to BERA as staking rewards accrue. Yield is generated from Berachain staking rewards and reflected in the rising exchange rate.\n\nYour multiplier tier is based on the live USD value of this position.',
    buyUnderlying: {
      token: '0xc66D1a2460De7b96631f4AC37ce906aCFa6A3c30', // plsBERA
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'plsbera',
    chain: 'berachain',
    targetTokens: ['plsBERA'],
  },
  // 5. plvHEDGE
  {
    id: 'plvhedge',
    name: 'plvHEDGE – Vault',
    subtitle: 'Plutus',
    image: '/plvhedge.jpg',
    tvl: '$271.91K',
    apr: '22.54%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'balanced',
    actionType: 'buy',
    buyToken: '0x28602B1ae8cA0ff5CD01B96A36f88F72FeBE727A',
    fromToken: 'HONEY',
    description: 'Deposit into the plvHEDGE delta-neutral vault via Plutus. The strategy sources yield across onchain markets and is designed to stay neutral to market price movements. Yield from the strategy is auto-compounded and reflected in the increasing value of the plvHEDGE vault token, which you can enter or exit at any time.\n\nYour multiplier tier is based on the live USD value of this position.',
    protocolUrl: 'https://plutus.fi/Vaults/v/plvHEDGE/chain/berachain',
    dynamicDataKey: 'plvhedge',
    chain: 'berachain',
    targetTokens: ['plvHEDGE'],
  },
  // 6. SAIL.r
  {
    id: 'sailr',
    name: 'SAIL.r – Royalty',
    subtitle: 'Liquid Royalty',
    image: '/sail.jpg',
    tvl: '$4.32M',
    apr: '30%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'balanced',
    actionType: 'buy',
    buyToken: '0x59a61B8d3064A51a95a5D6393c03e2152b1a2770',
    fromToken: 'HONEY',
    description: 'Hold SAIL.r to receive stablecoin distributions backed by real e-commerce revenue via Liquid Royalty. Revenue is distributed in USDe daily. SAIL.r is fully liquid and can be bought or sold at any time.\n\nYour multiplier tier is based on the live USD value of this position.',
    protocolUrl: 'https://www.liquidroyalty.com/invest/sail',
    dynamicDataKey: 'sailr',
    chain: 'berachain',
    targetTokens: ['SAIL.r'],
  },
  // 7. snrUSD
  {
    id: 'snrusd',
    name: 'snrUSD – Vault',
    subtitle: 'Liquid Royalty',
    image: '/snr.jpg',
    tvl: '$2.13M',
    apr: '13%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'stable',
    actionType: 'deposit',
    actionUrl: 'https://www.liquidroyalty.com/vaults',
    description: 'Deposit into the snrUSD vault via Liquid Royalty. snrUSD is designed for more stable returns within a structured RWA strategy. It prioritises capital stability and predictable yield over higher upside.\n\nYour multiplier tier is based on the live USD value of this position.',
    protocolUrl: 'https://www.liquidroyalty.com/vaults',
    buyUnderlying: {
      token: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // USDe
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'snrusd',
    chain: 'berachain',
    targetTokens: ['USDe'],
  },
  // 8. jnrUSD
  {
    id: 'jnrusd',
    name: 'jnrUSD – Vault',
    subtitle: 'Liquid Royalty',
    image: '/jnr.jpg',
    tvl: '$2.12M',
    apr: '93%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://www.liquidroyalty.com/vaults',
    description: 'Deposit into the jnrUSD vault via Liquid Royalty. jnrUSD is the higher-return side of a structured RWA strategy. Returns are variable and depend on overall strategy performance. As the junior tranche, it takes on more risk in exchange for greater upside potential.\n\nYour multiplier tier is based on the live USD value of this position.',
    protocolUrl: 'https://www.liquidroyalty.com/vaults',
    buyUnderlying: {
      token: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // USDe
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'jnrusd',
    chain: 'berachain',
    targetTokens: ['USDe'],
  },
];

const getRiskStyles = (category: Strategy['riskCategory']) => {
  switch (category) {
    case 'stable':
      return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Amy Stable', bars: 1 };
    case 'balanced':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Amy Balanced', bars: 2 };
    case 'hedge':
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Amy Hedge', bars: 3 };
  }
};

const RiskBars = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map((bar) => (
      <div
        key={bar}
        className={`w-1 h-3 rounded-sm ${
          bar <= level
            ? level === 1
              ? 'bg-green-400'
              : level === 2
              ? 'bg-yellow-400'
              : 'bg-red-400'
            : 'bg-gray-600'
        }`}
      />
    ))}
  </div>
);

const StrategyCard = ({ strategy, dynamicData }: { strategy: Strategy; dynamicData?: DynamicEarnData }) => {
  const router = useRouter();
  const risk = getRiskStyles(strategy.riskCategory);
  const [showInfo, setShowInfo] = useState(false);

  // Get TVL and APR from dynamic data if available
  const poolData = strategy.dynamicDataKey && dynamicData
    ? dynamicData[strategy.dynamicDataKey as keyof Omit<DynamicEarnData, 'lastUpdated'>]
    : null;
  const displayTvl = poolData?.tvl || strategy.tvl;
  const displayApr = poolData?.apr || strategy.apr;

  const handleAction = () => {
    if (strategy.actionType === 'deposit' && strategy.actionUrl) {
      window.open(strategy.actionUrl, '_blank');
    } else if (strategy.actionType === 'buy' && strategy.buyToken) {
      // Navigate to trade page with pre-filled tokens
      const fromToken = strategy.fromToken || 'HONEY';
      router.push(`/app/trade?from=${fromToken}&to=${strategy.buyToken}`);
    }
  };

  const handleBuyUnderlying = () => {
    if (strategy.buyUnderlying) {
      router.push(`/app/trade?from=${strategy.buyUnderlying.fromToken}&to=${strategy.buyUnderlying.token}`);
    }
  };

  // Get short name for pool details link
  const getShortName = () => {
    // Extract main identifier from strategy name
    const name = strategy.name.split('–')[0].split('/')[0].trim();
    return name;
  };

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50">
      {/* Header with logo and action button(s) - always visible */}
      <div className="p-4 flex items-center justify-between">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
          <img src={strategy.image} alt={strategy.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2">
          {strategy.buyUnderlying && (
            <button
              onClick={handleBuyUnderlying}
              className="px-6 py-2.5 rounded-full font-bold text-sm transition-all bg-transparent border-2 border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white"
            >
              Buy
            </button>
          )}
          <button
            onClick={handleAction}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              strategy.actionType === 'deposit'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-transparent border-2 border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white'
            }`}
          >
            {strategy.actionType === 'deposit' ? 'Deposit' : 'Buy'}
          </button>
        </div>
      </div>

      {/* Conditional content: Stats OR Info panel */}
      {!showInfo ? (
        <>
          {/* TVL and APR */}
          <div className="px-4 pb-3 flex items-center gap-6">
            <div>
              <div className="text-xs text-gray-500 uppercase">TVL</div>
              <div className="text-lg font-bold text-white">{displayTvl || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">APR (est.)</div>
              <div className="text-lg font-bold text-green-400">{displayApr}</div>
            </div>
          </div>

          {/* Amy Points and Risk */}
          <div className="px-4 pb-3 flex gap-2">
            {/* Show Amy Points badge for strategies with multipliers */}
            {strategy.amyPoints && strategy.amyPoints !== 'TBC' && (
              <div className="flex-1 bg-gray-800/80 rounded-lg px-3 py-2 relative group cursor-pointer">
                <div className="text-xs font-semibold text-white">Amy Points</div>
                {/* Hover tooltip with multiplier levels */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl min-w-[160px]">
                    <div className="text-xs font-semibold text-white mb-2">MULTIPLIERS</div>
                    {strategy.id === 'amy-honey' ? (
                      <>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">$10+ LP</span>
                          <span className="text-yellow-400 font-semibold">→ x5</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">$100+ LP</span>
                          <span className="text-yellow-400 font-semibold">→ x10</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">$500+ LP</span>
                          <span className="text-yellow-400 font-semibold">→ x100</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">$10+</span>
                          <span className="text-yellow-400 font-semibold">→ x3</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">$100+</span>
                          <span className="text-yellow-400 font-semibold">→ x5</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">$500+</span>
                          <span className="text-yellow-400 font-semibold">→ x10</span>
                        </div>
                      </>
                    )}
                    <div className="absolute bottom-0 left-4 transform translate-y-full">
                      <div className="border-8 border-transparent border-t-gray-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className={`flex-1 ${risk.bg} rounded-lg px-3 py-2 flex items-center justify-between`}>
              <div>
                <div className={`text-xs font-semibold ${risk.text}`}>{risk.label}</div>
              </div>
              <RiskBars level={risk.bars} />
            </div>
          </div>

          {/* Strategy name footer */}
          <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 rounded-b-2xl flex items-center justify-between">
            <span className="text-sm text-gray-300 font-medium">{strategy.name}</span>
            <button
              onClick={() => setShowInfo(true)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        /* Info Panel Content */
        <div className="px-4 pb-4 animate-slide-up">
          {/* Title with collapse button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                <img src={strategy.image} alt={strategy.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-semibold">{strategy.name}</span>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {strategy.description}
          </p>

          {/* Action Link */}
          <a
            href={strategy.actionUrl || strategy.protocolUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl px-4 py-3 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <span className="text-sm text-white font-medium">Strategy Details</span>
          </a>
        </div>
      )}
    </div>
  );
};

// Active position card for currently earning section
const ActivePositionCard = ({ lpData }: { lpData: LpData }) => {
  return (
    <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden">
      {/* Header with logo and status */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
            <img src="/bulla.jpg" alt="Bulla Exchange" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-white font-bold">AMY/HONEY – LP</div>
            <div className="text-sm text-gray-400">Bulla Exchange</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${lpData.isInRange ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></span>
          <span className={`text-sm font-medium ${lpData.isInRange ? 'text-green-400' : 'text-red-400'}`}>
            {lpData.isInRange ? 'In Range' : 'Out of Range'}
          </span>
        </div>
      </div>

      {/* Position details */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase mb-1">Your LP Value</div>
            <div className="text-xl font-bold text-white">${lpData.lpValueUsd.toFixed(2)}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase mb-1">Positions</div>
            <div className="text-xl font-bold text-white">
              {lpData.inRangePositions}/{lpData.positionsFound}
              <span className="text-sm text-gray-400 ml-1">in range</span>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
            <div className="text-xl font-bold text-yellow-400">{lpData.lpMultiplier}x</div>
          </div>
        </div>
      </div>

      {/* Footer with action */}
      <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
        <span className="text-sm text-gray-400">Manage your position on Bulla Exchange</span>
        <a
          href="https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          View Position →
        </a>
      </div>
    </div>
  );
};

// TEST MODE - set to true to see the "Currently earning" section with mock data
const TEST_MODE = false;
const MOCK_LP_DATA: LpData = {
  lpValueUsd: 1250.75,
  totalLpValueUsd: 5000,
  lpMultiplier: 50,
  positionsFound: 2,
  inRangePositions: 1,
  isInRange: true,
  amyPriceUsd: 0.0042,
};

type SortOption = 'default' | 'tvl-high' | 'tvl-low' | 'apr-high' | 'apr-low' | 'points-high' | 'points-low';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Featured' },
  { value: 'tvl-high', label: 'TVL (highest first)' },
  { value: 'tvl-low', label: 'TVL (lowest first)' },
  { value: 'apr-high', label: 'APR (highest first)' },
  { value: 'apr-low', label: 'APR (lowest first)' },
  { value: 'points-high', label: 'Points (highest first)' },
  { value: 'points-low', label: 'Points (lowest first)' },
];

// Parse TVL/APY strings to numbers for sorting
const parseValue = (value: string): number => {
  if (!value || value === '—' || value === 'TBC') return 0;
  const num = parseFloat(value.replace(/[$%,K]/g, ''));
  if (value.includes('K')) return num * 1000;
  if (value.includes('M')) return num * 1000000;
  return num || 0;
};

// Parse points multiplier to number
const parsePoints = (points: string): number => {
  if (!points || points === 'TBC') return 0;
  const match = points.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

export default function EarnPage() {
  const account = useActiveAccount();
  const [lpData, setLpData] = useState<LpData | null>(TEST_MODE ? MOCK_LP_DATA : null);
  const [tokenData, setTokenData] = useState<TokenHoldingsData | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingLp, setIsLoadingLp] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [dynamicEarnData, setDynamicEarnData] = useState<DynamicEarnData | null>(null);

  // Fetch dynamic TVL/APY data
  useEffect(() => {
    const fetchEarnData = async () => {
      try {
        const response = await fetch('/api/earn-data');
        const result = await response.json();
        if (result.success && result.data) {
          setDynamicEarnData(result.data);
        }
      } catch (error) {
        console.error('Error fetching earn data:', error);
      }
    };

    fetchEarnData();
    // Refresh every hour
    const interval = setInterval(fetchEarnData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSortMenu(false);
      setShowFilterMenu(false);
    };
    if (showSortMenu || showFilterMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSortMenu, showFilterMenu]);

  // Fetch LP data
  const fetchLpData = useCallback(async () => {
    if (!account?.address) return;

    setIsLoadingLp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/lp/${account.address}`);
      const data = await response.json();

      if (data.success && data.data) {
        setLpData(data.data);
      }
    } catch (error) {
      console.error('Error fetching LP data:', error);
    } finally {
      setIsLoadingLp(false);
    }
  }, [account?.address]);

  // Fetch token holdings data (SAIL.r, plvHEDGE)
  const fetchTokenData = useCallback(async () => {
    if (!account?.address) return;

    setIsLoadingTokens(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tokens/${account.address}`);
      const data = await response.json();

      if (data.success && data.data) {
        setTokenData(data.data);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [account?.address]);

  // Fetch LP data when wallet connects
  useEffect(() => {
    if (account?.address) {
      fetchLpData();
      fetchTokenData();
    } else {
      setLpData(null);
    }
  }, [account?.address, fetchLpData]);

  // Check if user has active LP position (or TEST_MODE is enabled)
  const hasActiveLp = TEST_MODE || (lpData && lpData.lpValueUsd > 0 && lpData.positionsFound > 0);
  const hasActiveTokens = tokenData && (tokenData.sailr?.isActive || tokenData.plvhedge?.isActive || tokenData.plsbera?.isActive || tokenData.honeybend?.isActive || tokenData.stakedbera?.isActive || tokenData.bgt?.isActive || tokenData.snrusd?.isActive || tokenData.jnrusd?.isActive);
  const hasAnyActivePosition = hasActiveLp || hasActiveTokens;

  // Helper to get dynamic value for a strategy
  const getDynamicTvl = (strategy: Strategy) => {
    if (strategy.dynamicDataKey && dynamicEarnData) {
      const poolData = dynamicEarnData[strategy.dynamicDataKey as keyof Omit<DynamicEarnData, 'lastUpdated'>];
      return poolData?.tvl || strategy.tvl;
    }
    return strategy.tvl;
  };

  const getDynamicApr = (strategy: Strategy) => {
    if (strategy.dynamicDataKey && dynamicEarnData) {
      const poolData = dynamicEarnData[strategy.dynamicDataKey as keyof Omit<DynamicEarnData, 'lastUpdated'>];
      return poolData?.apr || strategy.apr;
    }
    return strategy.apr;
  };

  // Get unique chains and tokens
  const availableChains: ('berachain' | 'base')[] = ['berachain', 'base']; // Show all chains regardless of strategies
  const availableTokens = Array.from(new Set(STRATEGIES.flatMap(s => s.targetTokens))).sort();

  // Filter strategies based on selected chains and tokens
  const filteredStrategies = STRATEGIES.filter((strategy) => {
    // If no filters selected, show all
    const chainMatch = selectedChains.length === 0 || selectedChains.includes(strategy.chain);
    const tokenMatch = selectedTokens.length === 0 || strategy.targetTokens.some(token => selectedTokens.includes(token));
    return chainMatch && tokenMatch;
  });

  // Sort filtered strategies based on selected option
  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    switch (sortBy) {
      case 'tvl-high':
        return parseValue(getDynamicTvl(b)) - parseValue(getDynamicTvl(a));
      case 'tvl-low':
        return parseValue(getDynamicTvl(a)) - parseValue(getDynamicTvl(b));
      case 'apr-high':
        return parseValue(getDynamicApr(b)) - parseValue(getDynamicApr(a));
      case 'apr-low':
        return parseValue(getDynamicApr(a)) - parseValue(getDynamicApr(b));
      case 'points-high':
        return parsePoints(b.amyPoints) - parsePoints(a.amyPoints);
      case 'points-low':
        return parsePoints(a.amyPoints) - parsePoints(b.amyPoints);
      default:
        return 0; // Keep original order
    }
  });

  // Toggle filter selection
  const toggleChain = (chain: string) => {
    setSelectedChains(prev =>
      prev.includes(chain) ? prev.filter(c => c !== chain) : [...prev, chain]
    );
  };

  const toggleToken = (token: string) => {
    setSelectedTokens(prev =>
      prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token]
    );
  };

  const clearFilters = () => {
    setSelectedChains([]);
    setSelectedTokens([]);
  };

  const hasActiveFilters = selectedChains.length > 0 || selectedTokens.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Currently Earning Section */}
        <div className="mb-8">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Currently earning</h2>

          {isLoadingLp ? (
            <div className="bg-gray-900/60 rounded-2xl border border-gray-700/50 p-8 flex justify-center">
              <div className="loading-spinner w-8 h-8" />
            </div>
          ) : hasAnyActivePosition ? (
            <>
              {/* Build sorted list of active positions by value (highest first) */}
              {(() => {
                const positions: { key: string; valueUsd: number; element: React.ReactNode }[] = [];

                // AMY/HONEY LP
                if (hasActiveLp) {
                  positions.push({
                    key: 'lp',
                    valueUsd: lpData?.lpValueUsd || 0,
                    element: <ActivePositionCard lpData={lpData || MOCK_LP_DATA} />,
                  });
                }

                // Token positions
                const tokenPositions = [
                  { key: 'sailr', data: tokenData?.sailr, name: 'SAIL.r – Royalty', subtitle: 'Liquid Royalty', image: '/sail.jpg', valueLabel: 'Your Token Value', manageText: 'Manage your position on Liquid Royalty', link: 'https://www.liquidroyalty.com/invest/sail', linkText: 'View Position →' },
                  { key: 'plvhedge', data: tokenData?.plvhedge, name: 'plvHEDGE – Vault', subtitle: 'Plutus', image: '/plvhedge.jpg', valueLabel: 'Your Token Value', manageText: 'Manage your position on Plutus', link: 'https://plutus.fi/Vaults/v/plvHEDGE/chain/berachain', linkText: 'View Position →' },
                  { key: 'plsbera', data: tokenData?.plsbera, name: 'plsBERA – Staked', subtitle: 'Plutus', image: '/plsbera.jpg', valueLabel: 'Your Staked Value', manageText: 'Manage your position on Plutus', link: 'https://plutus.fi/Assets/a/plsBERA/tab/stake', linkText: 'View Position →' },
                  { key: 'honeybend', data: tokenData?.honeybend, name: 'HONEY – Lent', subtitle: 'Bend Protocol', image: '/honey.jpg', valueLabel: 'Your Deposit Value', manageText: 'Manage your position on Berachain', link: 'https://bend.berachain.com/lend/80094/0x30BbA9CD9Eb8c95824aa42Faa1Bb397b07545bc1', linkText: 'View Position →' },
                  { key: 'stakedbera', data: tokenData?.stakedbera, name: 'BERA – Staked', subtitle: 'Berachain Staking', image: '/BERA.png', valueLabel: 'Your Staked Value', manageText: 'Manage your position on Berachain', link: 'https://hub.berachain.com/stake', linkText: 'View Position →' },
                  { key: 'bgt', data: tokenData?.bgt, name: 'BGT', subtitle: 'Berachain Governance Token', image: '/BERA.png', valueLabel: 'Your Token Value', manageText: 'BGT earnings from liquidity provision', link: 'https://hub.berachain.com/', linkText: 'View Hub →' },
                  { key: 'snrusd', data: tokenData?.snrusd, name: 'snrUSD – Vault', subtitle: 'Liquid Royalty', image: '/snr.jpg', valueLabel: 'Your Token Value', manageText: 'Manage your position on Liquid Royalty', link: 'https://www.liquidroyalty.com/vaults', linkText: 'View Position →' },
                  { key: 'jnrusd', data: tokenData?.jnrusd, name: 'jnrUSD – Vault', subtitle: 'Liquid Royalty', image: '/jnr.jpg', valueLabel: 'Your Token Value', manageText: 'Manage your position on Liquid Royalty', link: 'https://www.liquidroyalty.com/vaults', linkText: 'View Position →' },
                ];

                tokenPositions.forEach((pos) => {
                  if (pos.data?.isActive) {
                    positions.push({
                      key: pos.key,
                      valueUsd: pos.data.valueUsd || 0,
                      element: (
                        <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden mt-4">
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                                <img src={pos.image} alt={pos.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="text-white font-bold">{pos.name}</div>
                                <div className="text-sm text-gray-400">{pos.subtitle}</div>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-gray-800/60 rounded-lg p-3">
                                <div className="text-xs text-gray-500 uppercase mb-1">{pos.valueLabel}</div>
                                <div className="text-xl font-bold text-white">${pos.data!.valueUsd.toFixed(2)}</div>
                              </div>
                              <div className="bg-gray-800/60 rounded-lg p-3">
                                <div className="text-xs text-gray-500 uppercase mb-1">Balance</div>
                                <div className="text-xl font-bold text-white">{pos.data!.balance.toFixed(2)}</div>
                              </div>
                              <div className="bg-gray-800/60 rounded-lg p-3">
                                <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
                                <div className="text-xl font-bold text-yellow-400">{pos.data!.multiplier}x</div>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                            <span className="text-sm text-gray-400">{pos.manageText}</span>
                            <a
                              href={pos.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
                            >
                              {pos.linkText}
                            </a>
                          </div>
                        </div>
                      ),
                    });
                  }
                });

                // Sort by value descending (highest first)
                positions.sort((a, b) => b.valueUsd - a.valueUsd);

                return positions.map((pos) => (
                  <React.Fragment key={pos.key}>{pos.element}</React.Fragment>
                ));
              })()}
            </>
          ) : (
            <div className="bg-gray-900/60 rounded-2xl border border-gray-700/50 p-8 text-center">
              <p className="text-gray-400 mb-4">You don&apos;t have any yield earning assets currently.</p>
              <a
                href="https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all inline-block"
              >
                Getting started with Earn
              </a>
            </div>
          )}
        </div>

        {/* Earning Opportunities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-gray-400 uppercase tracking-wider">Earning opportunities</h2>
          </div>

          {/* Filter and Sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu(!showFilterMenu);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                  hasActiveFilters
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {selectedChains.length + selectedTokens.length}
                  </span>
                )}
              </button>

              {/* Filter Dropdown Menu */}
              {showFilterMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-xl border border-gray-700 shadow-xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Filters</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-yellow-400 hover:text-yellow-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Chain Filters */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Chain</div>
                    {availableChains.map((chain) => (
                      <button
                        key={chain}
                        onClick={() => toggleChain(chain)}
                        className="w-full flex items-center gap-2 py-2 hover:bg-gray-700/50 rounded px-2 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedChains.includes(chain)
                            ? 'bg-yellow-500 border-yellow-500'
                            : 'border-gray-600'
                        }`}>
                          {selectedChains.includes(chain) && (
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-white">{chain === 'berachain' ? 'Berachain' : 'Base'}</span>
                      </button>
                    ))}
                  </div>

                  {/* Token Filters */}
                  <div className="px-4 py-3 max-h-64 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Token</div>
                    {availableTokens.map((token) => (
                      <button
                        key={token}
                        onClick={() => toggleToken(token)}
                        className="w-full flex items-center gap-2 py-2 hover:bg-gray-700/50 rounded px-2 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedTokens.includes(token)
                            ? 'bg-yellow-500 border-yellow-500'
                            : 'border-gray-600'
                        }`}>
                          {selectedTokens.includes(token) && (
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-white">{token}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex items-center gap-2">
              {/* Current sort selection display */}
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-white">
                {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Featured'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortMenu(!showSortMenu);
                }}
                className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Sort
              </button>

              {/* Sort Dropdown Menu */}
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl border border-gray-700 shadow-xl z-50 overflow-hidden">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                        sortBy === option.value ? 'text-white bg-gray-700' : 'text-gray-300'
                      }`}
                    >
                      {sortBy === option.value && (
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Strategy Cards Grid */}
          {sortedStrategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {sortedStrategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} dynamicData={dynamicEarnData || undefined} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900/60 rounded-2xl border border-gray-700/50 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">No strategies match your filters</p>
                <p className="text-sm mt-2">Try adjusting your filter selection</p>
              </div>
              <button
                onClick={clearFilters}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
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
