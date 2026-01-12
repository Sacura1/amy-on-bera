import { NextResponse } from 'next/server';

// Cache the data for 1 hour
let cachedData: EarnData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const BERACHAIN_RPC = 'https://rpc.berachain.com';

interface PoolData {
  tvl: string;
  apr: string; // Changed from apr to apr
}

interface EarnData {
  'amy-honey': PoolData;
  'sailr': PoolData;
  'snrusd': PoolData;
  'jnrusd': PoolData;
  'plvhedge': PoolData;
  'plsbera': PoolData;
  lastUpdated: string;
}

// Fetch AMY/HONEY pool data from GeckoTerminal API (more reliable than scraping)
async function fetchBullaPoolData(): Promise<PoolData> {
  try {
    // Use GeckoTerminal API to get AMY/HONEY pool data
    const response = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/berachain/pools/0xff716930eefb37b5b4ac55b1901dc5704b098d84',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`GeckoTerminal AMY/HONEY fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const poolData = data?.data?.attributes;

    if (poolData) {
      const reserveUsd = parseFloat(poolData.reserve_in_usd || '0');
      // GeckoTerminal provides volume data, we can estimate APR from fees
      // For now, use a reasonable estimate based on pool activity
      const volume24h = parseFloat(poolData.volume_usd?.h24 || '0');
      // Estimate APR: (daily fees * 365) / TVL * 100
      // Assuming 0.3% fee tier
      const dailyFees = volume24h * 0.003;
      const estimatedApr = reserveUsd > 0 ? (dailyFees * 365 / reserveUsd) * 100 : 0;

      return {
        tvl: formatTvl(reserveUsd),
        apr: estimatedApr > 0 ? `${estimatedApr.toFixed(2)}%` : '2.11%'
      };
    }

    return { tvl: '$1.17K', apr: '2.11%' }; // Default
  } catch (error) {
    console.error('Error fetching AMY/HONEY pool data:', error);
    return { tvl: '$1.17K', apr: '2.11%' }; // Return defaults on error
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
        apr: '30%' // SAIL.r APR stays at 30% per user request
      };
    }

    return { tvl: '$4.32M', apr: '30%' }; // Default
  } catch (error) {
    console.error('Error fetching SAIL.r pool data:', error);
    return { tvl: '$4.32M', apr: '30%' }; // Return defaults on error
  }
}


// Fetch plvHEDGE APR from Plutus API
async function fetchPlvHedgeData(): Promise<PoolData> {
  try {
    const response = await fetch(
      'https://plutus.fi/api/assets/80094/0x28602B1ae8cA0ff5CD01B96A36f88F72FeBE727A',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      throw new Error(`Plutus API fetch failed: ${response.status}`);
    }

    const data = await response.json();
    // Plutus API returns APR and TVL in uppercase
    const apr = data?.APR || data?.apr || data?.apy || 22.54;
    const tvl = data?.TVL || data?.tvl || data?.totalValueLocked;

    return {
      tvl: tvl ? formatTvl(tvl) : '$271.91K',
      apr: `${Number(apr).toFixed(2)}%`
    };
  } catch (error) {
    console.error('Error fetching plvHEDGE data from Plutus:', error);
    return { tvl: '$271.91K', apr: '22.25%' };
  }
}

// Fetch plsBERA data from Plutus API and on-chain
async function fetchPlsBeraData(): Promise<PoolData> {
  try {
    const aprResponse = await fetch(
      'https://plutus.fi/api/assets/80094/0xe8bEB147a93BB757DB15e468FaBD119CA087EfAE',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      }
    );

    let apr = '15%';
    if (aprResponse.ok) {
      const aprData = await aprResponse.json();
      // Plutus API returns APR in uppercase
      const aprValue = aprData?.APR || aprData?.apr || aprData?.apy || 15;
      apr = `${Number(aprValue).toFixed(2)}%`;
    }

    const totalSupply = await callContract(
      '0xe8bEB147a93BB757DB15e468FaBD119CA087EfAE',
      '0x18160ddd'
    );

    let tvl = '$500K';
    if (totalSupply) {
      const priceResponse = await fetch(
        'https://api.geckoterminal.com/api/v2/networks/berachain/pools/0x225915329b032b3385ac28b0dc53d989e8446fd1',
        { headers: { 'Accept': 'application/json' } }
      );

      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        const tokenPrice = parseFloat(priceData?.data?.attributes?.base_token_price_usd || '0');
        if (tokenPrice > 0) {
          const totalStaked = Number(totalSupply) / 1e18;
          const tvlValue = totalStaked * tokenPrice;
          tvl = formatTvl(tvlValue);
        }
      }
    }

    return { tvl, apr };
  } catch (error) {
    console.error('Error fetching plsBERA data:', error);
    return { tvl: '$22K', apr: '31.91%' };
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
        apr: '13%' // Fixed APR per LiquidRoyalty
      };
    }

    return { tvl: '$2.13M', apr: '13%' };
  } catch (error) {
    console.error('Error fetching snrUSD data:', error);
    return { tvl: '$2.13M', apr: '13%' };
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
        apr: '93%' // Variable APR - would need share price tracking for real-time
      };
    }

    return { tvl: '$2.12M', apr: '93%' };
  } catch (error) {
    console.error('Error fetching jnrUSD data:', error);
    return { tvl: '$2.12M', apr: '93%' };
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
    const [bullaData, sailrData, snrUsdData, jnrUsdData, plvhedgeData, plsberaData] = await Promise.all([
      fetchBullaPoolData(),
      fetchSailrPoolData(),
      fetchSnrUsdData(),
      fetchJnrUsdData(),
      fetchPlvHedgeData(),
      fetchPlsBeraData()
    ]);

    const earnData: EarnData = {
      'amy-honey': bullaData,
      'sailr': sailrData,
      'snrusd': snrUsdData,
      'jnrusd': jnrUsdData,
      'plvhedge': plvhedgeData,
      'plsbera': plsberaData,
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
        'amy-honey': { tvl: '$1.17K', apr: '2.11%' },
        'sailr': { tvl: '$4.32M', apr: '30%' },
        'snrusd': { tvl: '$2.13M', apr: '13%' },
        'jnrusd': { tvl: '$2.12M', apr: '93%' },
        'plvhedge': { tvl: '$271.91K', apr: '22.25%' },
        'plsbera': { tvl: '$22K', apr: '31.91%' },
        lastUpdated: new Date().toISOString()
      },
      error: 'Using default values'
    });
  }
}
