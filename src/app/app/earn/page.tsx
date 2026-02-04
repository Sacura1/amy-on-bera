'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
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
}

const STRATEGIES: Strategy[] = [
  // 1. AMY/HONEY Pool
  {
    id: 'amy-honey',
    name: 'AMY/ HONEY Pool',
    subtitle: 'Bulla Exchange',
    image: '/bulla.jpg',
    tvl: '$1.17K',
    apr: '2.11%',
    amyPoints: 'Earn up to 100x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84',
    description: 'Provide liquidity to the AMY / HONEY pool on Bulla Exchange. Earn trading fees plus Amy Points multipliers based on your LP value.',
    infoButtonLabel: 'AMY Pool',
    dynamicDataKey: 'amy-honey',
    buyUnderlying: {
      token: '0x098a75baeddec78f9a8d0830d6b86eac5cc8894e', // AMY token
      fromToken: 'HONEY',
    },
  },
  // 2. plsBERA
  {
    id: 'plsbera',
    name: 'Staked – plsBERA',
    subtitle: 'Plutus',
    image: '/plsbera.jpg',
    tvl: '$22K',
    apr: '31.91%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://plutus.fi/Assets/a/plsBERA/tab/convert',
    description: 'Stake plsBERA and support Berachain\'s economic security. This strategy reflects active staking participation and may update over time as your position changes. Powered by Plutus.',
    buyUnderlying: {
      token: '0xc66D1a2460De7b96631f4AC37ce906aCFa6A3c30', // plsBERA
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'plsbera',
  },
  // 3. plvHEDGE
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
    description: 'Deploy capital into the plvHEDGE delta-neutral strategy. plvHEDGE is an automated vault with dynamic yield sourcing, designed to generate yield while managing market exposure across chains. Powered by Plutus.',
    protocolUrl: 'https://plutus.fi',
    dynamicDataKey: 'plvhedge',
  },
  // 4. SAIL.r
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
    description: 'Hold SAIL.r, a royalty token backed by real e-commerce revenue. SAIL.r represents a claim on revenue from e-commerce brands, with holders receiving monthly stablecoin distributions based on their share of tokens held. Powered by Liquid Royalty.',
    protocolUrl: 'https://www.liquidroyalty.com',
    dynamicDataKey: 'sailr',
  },
  // 5. snrUSD
  {
    id: 'snrusd',
    name: 'snrUSD – Senior',
    subtitle: 'Liquid Royalty',
    image: '/snr.jpg',
    tvl: '$2.13M',
    apr: '13%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'stable',
    actionType: 'deposit',
    actionUrl: 'https://www.liquidroyalty.com/vaults/senior',
    description: 'Deploy capital into snrUSD, a senior tranche stable yield product. snrUSD is designed to maintain a stable $1 value while generating yield, backed by over-collateralisation and senior position within the strategy. Powered by Liquid Royalty.',
    protocolUrl: 'https://www.liquidroyalty.com',
    buyUnderlying: {
      token: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // USDe
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'snrusd',
  },
  // 6. jnrUSD
  {
    id: 'jnrusd',
    name: 'jnrUSD – Junior',
    subtitle: 'Liquid Royalty',
    image: '/jnr.jpg',
    tvl: '$2.12M',
    apr: '93%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://www.liquidroyalty.com/vaults/junior',
    description: 'Deploy capital into jnrUSD, the junior tranche designed to capture excess yield. jnrUSD sits below the senior tranche and is exposed to variable returns, offering higher potential yield in exchange for higher risk. Powered by Liquid Royalty.',
    protocolUrl: 'https://www.liquidroyalty.com',
    buyUnderlying: {
      token: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // USDe
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'jnrusd',
  },
  // 7. HONEY Bend
  {
    id: 'honeybend',
    name: 'HONEY – Bend',
    subtitle: 'Bend Protocol',
    image: '/honey.jpg',
    tvl: '$12.5M',
    apr: '8%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'stable',
    actionType: 'deposit',
    actionUrl: 'https://bend.berachain.com/',
    description: 'Lend HONEY on Bend Protocol to earn interest while supporting the Berachain lending ecosystem. Your HONEY-Bend position earns Amy Points multipliers based on your deposit value.',
    protocolUrl: 'https://bend.berachain.com/',
    dynamicDataKey: 'honeybend',
  },
  // 8. Staked BERA (sWBERA)
  {
    id: 'stakedbera',
    name: 'Staked – BERA',
    subtitle: 'Berachain Staking',
    image: '/BERA.png',
    tvl: '$85M',
    apr: '21%',
    amyPoints: 'Earn up to 10x',
    riskCategory: 'balanced',
    actionType: 'deposit',
    actionUrl: 'https://hub.berachain.com/stake',
    description: 'Stake BERA for sWBERA to secure the network while earning staking rewards. Your liquid staking position earns Amy Points multipliers based on your staked value. You can also swap HONEY for sWBERA directly.',
    protocolUrl: 'https://hub.berachain.com/stake',
    buyUnderlying: {
      token: '0x118D2cEeE9785eaf70C15Cd74CD84c9f8c3EeC9a', // sWBERA
      fromToken: 'HONEY',
    },
    dynamicDataKey: 'stakedbera',
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

          {/* Action Links */}
          <div className="space-y-2">
            {strategy.actionUrl && (
              <a
                href={strategy.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl px-4 py-3 transition-colors"
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <span className="text-sm text-white font-medium">{strategy.infoButtonLabel || `View ${getShortName()} pool details`}</span>
              </a>
            )}
            {strategy.protocolUrl && (
              <a
                href={strategy.protocolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl px-4 py-3 transition-colors"
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <span className="text-sm text-white font-medium">View protocol details</span>
              </a>
            )}
          </div>
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
            <div className="text-white font-bold">AMY / HONEY Pool</div>
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSortMenu(false);
    if (showSortMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSortMenu]);

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
  const hasActiveTokens = tokenData && (tokenData.sailr?.isActive || tokenData.plvhedge?.isActive || tokenData.plsbera?.isActive || tokenData.honeybend?.isActive || tokenData.stakedbera?.isActive);
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

  // Sort strategies based on selected option
  const sortedStrategies = [...STRATEGIES].sort((a, b) => {
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
              {hasActiveLp && <ActivePositionCard lpData={lpData || MOCK_LP_DATA} />}
              {tokenData?.sailr?.isActive && (
                <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden mt-4">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                        <img src="/sail.jpg" alt="SAIL.r" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-white font-bold">SAIL.r</div>
                        <div className="text-sm text-gray-400">Liquid Royalty</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Your Token Value</div>
                        <div className="text-xl font-bold text-white">${tokenData.sailr.valueUsd.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Balance</div>
                        <div className="text-xl font-bold text-white">{tokenData.sailr.balance.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
                        <div className="text-xl font-bold text-yellow-400">{tokenData.sailr.multiplier}x</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Manage your position on Liquid Royalty</span>
                    <a
                      href="https://www.liquidroyalty.com/invest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
                    >
                      View Position →
                    </a>
                  </div>
                </div>
              )}
              {tokenData?.plvhedge?.isActive && (
                <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden mt-4">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                        <img src="/plvhedge.jpg" alt="plvHEDGE" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-white font-bold">plvHEDGE</div>
                        <div className="text-sm text-gray-400">Plutus</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Your Token Value</div>
                        <div className="text-xl font-bold text-white">${tokenData.plvhedge.valueUsd.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Balance</div>
                        <div className="text-xl font-bold text-white">{tokenData.plvhedge.balance.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
                        <div className="text-xl font-bold text-yellow-400">{tokenData.plvhedge.multiplier}x</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Manage your position on Plutus</span>
                    <a
                      href="https://plutus.fi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
                    >
                      View Position →
                    </a>
                  </div>
                </div>
              )}
              {tokenData?.plsbera?.isActive && (
                <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden mt-4">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                        <img src="/plsbera.jpg" alt="plsBERA" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-white font-bold">plsBERA</div>
                        <div className="text-sm text-gray-400">Plutus</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Your Staked Value</div>
                        <div className="text-xl font-bold text-white">${tokenData.plsbera.valueUsd.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Balance</div>
                        <div className="text-xl font-bold text-white">{tokenData.plsbera.balance.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
                        <div className="text-xl font-bold text-yellow-400">{tokenData.plsbera.multiplier}x</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Manage your position on Plutus</span>
                    <a
                      href="https://plutus.fi/Assets/a/plsBERA/tab/convert"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
                    >
                      View Position →
                    </a>
                  </div>
                </div>
              )}
              {tokenData?.honeybend?.isActive && (
                <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden mt-4">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                        <img src="/honey.jpg" alt="HONEY-Bend" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-white font-bold">HONEY-Bend</div>
                        <div className="text-sm text-gray-400">Bend Protocol</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Your Deposit Value</div>
                        <div className="text-xl font-bold text-white">${tokenData.honeybend.valueUsd.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Balance</div>
                        <div className="text-xl font-bold text-white">{tokenData.honeybend.balance.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
                        <div className="text-xl font-bold text-yellow-400">{tokenData.honeybend.multiplier}x</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Manage your position on Bend</span>
                    <a
                      href="https://bend.berachain.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
                    >
                      View Position →
                    </a>
                  </div>
                </div>
              )}
              {tokenData?.stakedbera?.isActive && (
                <div className="bg-gray-900/80 rounded-2xl border border-green-500/30 overflow-hidden mt-4">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                        <img src="/BERA.png" alt="sWBERA" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-white font-bold">Staked BERA (sWBERA)</div>
                        <div className="text-sm text-gray-400">Berachain Staking</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Your Staked Value</div>
                        <div className="text-xl font-bold text-white">${tokenData.stakedbera.valueUsd.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Balance</div>
                        <div className="text-xl font-bold text-white">{tokenData.stakedbera.balance.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase mb-1">Points Multiplier</div>
                        <div className="text-xl font-bold text-yellow-400">{tokenData.stakedbera.multiplier}x</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Manage your stake on Berachain Hub</span>
                    <a
                      href="https://hub.berachain.com/stake"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
                    >
                      View Position →
                    </a>
                  </div>
                </div>
              )}
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
            <button className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              ALL
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {sortedStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} dynamicData={dynamicEarnData || undefined} />
            ))}
          </div>
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
