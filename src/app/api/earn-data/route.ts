import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://amy-production-fd10.up.railway.app';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/earn-data?t=${Date.now()}`, {
        cache: 'no-store',
        next: { revalidate: 0 }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch from backend');
    }

    const data = await response.json();
    const backendData = data.data || {};
    
    // UI expects 'amy-honey' and 'amy-usdt0' based on dynamicDataKey in earn/page.tsx
    return NextResponse.json({
      success: true,
      data: {
        'amy-honey': backendData['amy-honey'] || { tvl: 'TBC', apr: '0%' },
        'amy-usdt0': backendData['amy-usdt0'] || { tvl: 'TBC', apr: '0%' },
        'plskdk': backendData['plskdk'] || { tvl: 'TBC', apr: '0%' },
        'honeybend': { tvl: '$12.5M', apr: '8%' },
        'stakedbera': { tvl: '$85M', apr: '21%' },
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
        'plskdk': { tvl: 'TBC', apr: '0%' },
        'honeybend': { tvl: '$12.5M', apr: '8%' },
        'stakedbera': { tvl: '$85M', apr: '21%' },
        lastUpdated: new Date().toISOString()
      },
      error: 'Backend unavailable, using fallback values'
    });
  }
}
