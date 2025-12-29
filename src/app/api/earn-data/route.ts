import { NextResponse } from 'next/server';

// Cache the data for 1 hour
let cachedData: EarnData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const BERACHAIN_RPC = 'https://rpc.berachain.com';

interface PoolData {
  tvl: string;
  apy: string;
}

interface EarnData {
  'amy-honey': PoolData;
  'sailr': PoolData;
  'snrusd': PoolData;
  'jnrusd': PoolData;
  lastUpdated: string;
}

// Fetch AMY/HONEY pool data from Bulla Exchange
async function fetchBullaPoolData(): Promise<PoolData> {
  try {
    // Bulla Exchange uses a GraphQL-like API, we'll fetch the pool page and extract data
    const response = await fetch('https://www.bulla.exchange/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; AmyBot/1.0)',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Bulla fetch failed: ${response.status}`);
    }

    const html = await response.text();

    // Try to extract TVL from the page
    // Look for patterns like "tvlUSD" or dollar amounts near TVL
    const tvlMatch = html.match(/tvlUSD["\s:]+(\d+\.?\d*)/i) ||
                     html.match(/"usdValue"["\s:]+(\d+\.?\d*)/i) ||
                     html.match(/totalValueLockedUSD["\s:]+(\d+\.?\d*)/i);

    const aprMatch = html.match(/avgAPR["\s:]+(\d+\.?\d*)/i) ||
                     html.match(/"apr"["\s:]+(\d+\.?\d*)/i);

    let tvl = '$1.17K'; // Default
    let apy = '2.68%'; // Default

    if (tvlMatch && tvlMatch[1]) {
      const tvlNum = parseFloat(tvlMatch[1]);
      tvl = formatTvl(tvlNum);
    }

    if (aprMatch && aprMatch[1]) {
      const aprNum = parseFloat(aprMatch[1]);
      apy = `${aprNum.toFixed(2)}%`;
    }

    return { tvl, apy };
  } catch (error) {
    console.error('Error fetching Bulla pool data:', error);
    return { tvl: '$1.17K', apy: '2.68%' }; // Return defaults on error
  }
}

// Fetch SAIL.r pool data from GeckoTerminal API
async function fetchSailrPoolData(): Promise<PoolData> {
  try {
    const response = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/berachain/pools/0x704d1c9dddeb2ccd4bf999f3426c755917f0d00c',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      throw new Error(`GeckoTerminal fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const poolData = data?.data?.attributes;

    if (poolData) {
      const reserveUsd = parseFloat(poolData.reserve_in_usd || '0');
      return {
        tvl: formatTvl(reserveUsd),
        apy: '30%' // SAIL.r APY stays at 30% per user request
      };
    }

    return { tvl: '$4.32M', apy: '30%' }; // Default
  } catch (error) {
    console.error('Error fetching SAIL.r pool data:', error);
    return { tvl: '$4.32M', apy: '30%' }; // Return defaults on error
  }
}

// Format TVL number to readable string
function formatTvl(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

// Generic function to call contract view functions via RPC
async function callContract(contractAddress: string, functionSelector: string): Promise<bigint | null> {
  try {
    const response = await fetch(BERACHAIN_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: functionSelector }, 'latest'],
        id: 1
      })
    });

    const result = await response.json();
    if (result.result && result.result !== '0x') {
      return BigInt(result.result);
    }
    return null;
  } catch (error) {
    console.error('Contract call error:', error);
    return null;
  }
}

// Fetch snrUSD vault data from on-chain
// Contract: 0x49298F4314eb127041b814A2616c25687Db6b650
async function fetchSnrUsdData(): Promise<PoolData> {
  try {
    // snrUSD is pegged to $1, so totalSupply = TVL
    const totalSupply = await callContract(
      '0x49298F4314eb127041b814A2616c25687Db6b650',
      '0x18160ddd' // totalSupply()
    );

    if (totalSupply) {
      const tvl = Number(totalSupply) / 1e18;
      return {
        tvl: formatTvl(tvl),
        apy: '13%' // Fixed APY per LiquidRoyalty
      };
    }

    return { tvl: '$2.13M', apy: '13%' };
  } catch (error) {
    console.error('Error fetching snrUSD data:', error);
    return { tvl: '$2.13M', apy: '13%' };
  }
}

// Fetch jnrUSD vault data from on-chain
// Contract: 0x3a0A97DcA5e6CaCC258490d5ece453412f8E1883
async function fetchJnrUsdData(): Promise<PoolData> {
  try {
    const totalAssets = await callContract(
      '0x3a0A97DcA5e6CaCC258490d5ece453412f8E1883',
      '0x01e1d114' // totalAssets()
    );

    if (totalAssets) {
      const tvl = Number(totalAssets) / 1e18;
      return {
        tvl: formatTvl(tvl),
        apy: '93%' // Variable APY - would need share price tracking for real-time
      };
    }

    return { tvl: '$2.12M', apy: '93%' };
  } catch (error) {
    console.error('Error fetching jnrUSD data:', error);
    return { tvl: '$2.12M', apy: '93%' };
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return NextResponse.json({
      success: true,
      data: cachedData,
      cached: true
    });
  }

  try {
    // Fetch data from all sources in parallel
    const [bullaData, sailrData, snrUsdData, jnrUsdData] = await Promise.all([
      fetchBullaPoolData(),
      fetchSailrPoolData(),
      fetchSnrUsdData(),
      fetchJnrUsdData()
    ]);

    const earnData: EarnData = {
      'amy-honey': bullaData,
      'sailr': sailrData,
      'snrusd': snrUsdData,
      'jnrusd': jnrUsdData,
      lastUpdated: new Date().toISOString()
    };

    // Update cache
    cachedData = earnData;
    lastFetchTime = now;

    return NextResponse.json({
      success: true,
      data: earnData,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching earn data:', error);

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        stale: true
      });
    }

    // Return defaults if no cache
    return NextResponse.json({
      success: true,
      data: {
        'amy-honey': { tvl: '$1.17K', apy: '2.68%' },
        'sailr': { tvl: '$4.32M', apy: '30%' },
        'snrusd': { tvl: '$2.13M', apy: '13%' },
        'jnrusd': { tvl: '$2.12M', apy: '93%' },
        lastUpdated: new Date().toISOString()
      },
      error: 'Using default values'
    });
  }
}
