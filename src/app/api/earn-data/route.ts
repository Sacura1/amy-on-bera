import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://amy-production-fd10.up.railway.app';

export async function GET() {
  try {
    // We add a timestamp to the URL to bypass any server-side fetch caching
    const response = await fetch(`${API_BASE_URL}/api/earn-data?t=${Date.now()}`, {
        cache: 'no-store', // Ensure we get fresh data from the backend
        next: { revalidate: 0 }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch from backend');
    }

    const data = await response.json();
    const backendData = data.data || {};
    
    // LOGIC FIX: Explicitly mapping backend keys to frontend keys
    // Backend uses 'amy-honey' and 'amy-usdt0'
    // Frontend Earn page expects 'amyhoney' and 'amyusdt'
    
    return NextResponse.json({
      success: true,
      data: {
        'amyhoney': backendData['amy-honey'] || { tvl: 'TBC', apr: '0%' },
        'amyusdt': backendData['amy-usdt0'] || { tvl: 'TBC', apr: '0%' },
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
        'amyhoney': { tvl: 'TBC', apr: '0%' },
        'amyusdt': { tvl: 'TBC', apr: '0%' },
        'plskdk': { tvl: 'TBC', apr: '0%' },
        'honeybend': { tvl: '$12.5M', apr: '8%' },
        'stakedbera': { tvl: '$85M', apr: '21%' },
        lastUpdated: new Date().toISOString()
      },
      error: 'Backend unavailable, using fallback values'
    });
  }
}
