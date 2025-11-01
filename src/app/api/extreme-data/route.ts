import { NextResponse } from 'next/server';
import { SupabaseService } from '@/services/supabase-service';

const indicatorConfig = [
  {
    key: 'rsi_high',
    indicator: 'rsi' as const,
    direction: 'high' as const,
  },
  {
    key: 'rsi_low',
    indicator: 'rsi' as const,
    direction: 'low' as const,
  },
  {
    key: 'adx_high',
    indicator: 'adx' as const,
    direction: 'high' as const,
  },
  {
    key: 'macd_high',
    indicator: 'macd' as const,
    direction: 'high' as const,
  },
  {
    key: 'macd_low',
    indicator: 'macd' as const,
    direction: 'low' as const,
  },
  {
    key: 'bollinger_high',
    indicator: 'bollinger' as const,
    direction: 'high' as const,
  },
  {
    key: 'bollinger_low',
    indicator: 'bollinger' as const,
    direction: 'low' as const,
  },
  {
    key: 'cmf_high',
    indicator: 'cmf' as const,
    direction: 'high' as const,
  },
  {
    key: 'cmf_low',
    indicator: 'cmf' as const,
    direction: 'low' as const,
  },
];

export async function GET() {
  try {
    // Load extreme stocks for each indicator configuration
    const promises = indicatorConfig.map(async (config) => {
      const data = await SupabaseService.getExtremeStocks(
        config.indicator,
        5,
        config.direction
      );
      return { key: config.key, data };
    });

    const results = await Promise.all(promises);
    const dataMap: Record<string, any[]> = {};
    results.forEach(({ key, data }) => {
      dataMap[key] = data;
    });

    return NextResponse.json({
      success: true,
      data: dataMap
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}