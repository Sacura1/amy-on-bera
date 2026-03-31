import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://amy-production-fd10.up.railway.app';

export async function GET() {
  try {
    // Add unique timestamp to URL to bypass any server-side fetch caching
    const response = await fetch(`${API_BASE_URL}/api/earn-data?t=${Date.now()}`, {
        cache: 'no-store', // Force fresh data from backend
        next: { revalidate: 0 }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch from backend');
    }

    const data = await response.json();
    const backendData = data.data || {};
    
    return NextResponse.json({
      success: true,
      data: {
        'amy-honey': backendData['amy-honey'] || { tvl: 'TBC', apr: '0%' },
        'amy-usdt0': backendData['amy-usdt0'] || { tvl: 'TBC', apr: '0%' },
        'jnrusd': backendData['jnrusd'] || { tvl: 'TBC', apr: '0%' },
        'snrusd': backendData['snrusd'] || { tvl: 'TBC', apr: '0%' },
        'sailr': backendData['sailr'] || { tvl: 'TBC', apr: '0%' },
        'plskdk': backendData['plskdk'] || { tvl: 'TBC', apr: '0%' },
        'plsbera': backendData['plsbera'] || { tvl: 'TBC', apr: '0%' },
        'plvhedge': backendData['plvhedge'] || { tvl: 'TBC', apr: '0%' },
        'honeybend': backendData['honeybend'] || { tvl: '$12.5M', apr: '8%' },
        'stakedbera': backendData['stakedbera'] || { tvl: '$85M', apr: '21%' },
        lastUpdated: data.lastUpdated || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in earn-data API:', error);
    
    return NextResponse.json({
      success: true,
      data: {
        'amy-honey': { tvl: 'TBC', apr: '0%' },
        'amy-usdt0': { tvl: 'TBC', apr: '0%' },
        'jnrusd': { tvl: 'TBC', apr: '0%' },
        'snrusd': { tvl: 'TBC', apr: '0%' },
        'plskdk': { tvl: 'TBC', apr: '0%' },
        'honeybend': { tvl: '$12.5M', apr: '8%' },
        'stakedbera': { tvl: '$85M', apr: '21%' },
        lastUpdated: new Date().toISOString()
      },
      error: 'Backend unavailable, using fallback values'
    });
  }
}
