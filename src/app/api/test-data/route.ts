import { NextResponse } from 'next/server';
import { SupabaseService } from '@/services/supabase-service';

export async function GET() {
  try {
    console.log('Testing data fetch from API route...');

    // Test fetching RSI high extremes
    const rsiHigh = await SupabaseService.getExtremeStocks('rsi', 5, 'high');
    console.log('RSI High result:', rsiHigh);

    // Test fetching RSI low extremes
    const rsiLow = await SupabaseService.getExtremeStocks('rsi', 5, 'low');
    console.log('RSI Low result:', rsiLow);

    return NextResponse.json({
      success: true,
      data: {
        rsi_high: rsiHigh,
        rsi_low: rsiLow,
      }
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}