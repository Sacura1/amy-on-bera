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

interface Strategy {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  tvl: string;
  apy: string;
  amyPoints: string;
  riskCategory: 'hedge' | 'balanced' | 'stable';
  actionType: 'deposit' | 'buy';
  actionUrl?: string;
  buyToken?: string;
  fromToken?: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: 'amy-honey',
    name: 'AMY/ HONEY Pool',
    subtitle: 'Bulla Exchange',
    image: '/bulla.jpg',
    tvl: '$1.17K',
    apy: '0.54%',
    amyPoints: 'Earn up to 100x',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84',
  },
  {
    id: 'plsbera',
    name: 'Staked – plsBERA',
    subtitle: 'Plutus',
    image: '/plsbera.jpg',
    tvl: '',
    apy: '36.02%',
    amyPoints: 'TBC',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://plutus.fi/Assets/a/plsBERA/tab/convert',
  },
  {
    id: 'plvhedge',
    name: 'plvHEDGE – Vault',
    subtitle: 'Plutus',
    image: '/plvhedge.jpg',
    tvl: '$270,279K',
    apy: '22.54%',
    amyPoints: 'TBC',
    riskCategory: 'balanced',
    actionType: 'deposit',
    actionUrl: 'https://plutus.fi/Vaults/v/plvHEDGE/chain/berachain',
  },
  {
    id: 'sailr',
    name: 'SAIL.r – Liquid Royalty',
    subtitle: 'Liquid Royalty',
    image: '/sail.jpg',
    tvl: '',
    apy: '30%',
    amyPoints: 'TBC',
    riskCategory: 'balanced',
    actionType: 'buy',
    buyToken: '0x59a61B8d3064A51a95a5D6393c03e2152b1a2770',
    fromToken: 'BERA',
  },
  {
    id: 'snrusd',
    name: 'snrUSD – Senior Vault',
    subtitle: 'Liquid Royalty',
    image: '/snr.jpg',
    tvl: '$2.13M',
    apy: '13%',
    amyPoints: 'TBC',
    riskCategory: 'stable',
    actionType: 'deposit',
    actionUrl: 'https://www.liquidroyalty.com/vaults/senior',
  },
  {
    id: 'jnrusd',
    name: 'jnrUSD – Junior Vault',
    subtitle: 'Liquid Royalty',
    image: '/jnr.jpg',
    tvl: '$2.13M',
    apy: '136%',
    amyPoints: 'TBC',
    riskCategory: 'hedge',
    actionType: 'deposit',
    actionUrl: 'https://www.liquidroyalty.com/vaults/junior',
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

const StrategyCard = ({ strategy }: { strategy: Strategy }) => {
  const router = useRouter();
  const risk = getRiskStyles(strategy.riskCategory);

  const handleAction = () => {
    if (strategy.actionType === 'deposit' && strategy.actionUrl) {
      window.open(strategy.actionUrl, '_blank');
    } else if (strategy.actionType === 'buy' && strategy.buyToken) {
      // Navigate to trade page with pre-filled tokens
      const fromToken = strategy.fromToken || 'HONEY';
      router.push(`/app/trade?from=${fromToken}&to=${strategy.buyToken}`);
    }
  };

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header with logo and action button */}
      <div className="p-4 flex items-center justify-between">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center">
          <img src={strategy.image} alt={strategy.name} className="w-12 h-12 object-contain" />
        </div>
        <button
          onClick={handleAction}
          className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${
            strategy.actionType === 'deposit'
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-transparent border-2 border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white'
          }`}
        >
          {strategy.actionType === 'deposit' ? 'Deposit' : 'Buy'}
        </button>
      </div>

      {/* TVL and APY */}
      <div className="px-4 pb-3 flex items-center gap-6">
        <div>
          <div className="text-xs text-gray-500 uppercase">TVL</div>
          <div className="text-lg font-bold text-white">{strategy.tvl || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">APY</div>
          <div className="text-lg font-bold text-green-400">{strategy.apy}</div>
        </div>
      </div>

      {/* Amy Points and Risk */}
      <div className="px-4 pb-3 flex gap-2">
        <div className="flex-1 bg-gray-800/80 rounded-lg px-3 py-2">
          <div className="text-xs font-semibold text-white">Amy Points</div>
          <div className="text-xs text-yellow-400 font-medium">{strategy.amyPoints}</div>
        </div>
        <div className={`flex-1 ${risk.bg} rounded-lg px-3 py-2 flex items-center justify-between`}>
          <div>
            <div className={`text-xs font-semibold ${risk.text}`}>{risk.label}</div>
          </div>
          <RiskBars level={risk.bars} />
        </div>
      </div>

      {/* Strategy name footer */}
      <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
        <span className="text-sm text-gray-300 font-medium">{strategy.name}</span>
        <button className="text-gray-500 hover:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeWidth="2" d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </div>
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
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <img src="/bulla.jpg" alt="Bulla Exchange" className="w-12 h-12 object-contain" />
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

export default function EarnPage() {
  const account = useActiveAccount();
  const [lpData, setLpData] = useState<LpData | null>(null);
  const [isLoadingLp, setIsLoadingLp] = useState(false);

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

  // Fetch LP data when wallet connects
  useEffect(() => {
    if (account?.address) {
      fetchLpData();
    } else {
      setLpData(null);
    }
  }, [account?.address, fetchLpData]);

  // Check if user has active LP position
  const hasActiveLp = lpData && lpData.lpValueUsd > 0 && lpData.positionsFound > 0;

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
          ) : hasActiveLp ? (
            <ActivePositionCard lpData={lpData} />
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
            <button className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Sort
            </button>
          </div>

          {/* Strategy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STRATEGIES.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
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
