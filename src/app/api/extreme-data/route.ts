import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INDICATOR_CONFIGS } from '@/config/indicators';
import type { ExtremSymbol } from '@/types';

type ExchangeFilter = 'ALL' | 'NSE' | 'US';

interface StockIndicatorRow {
  symbol: string;
  company_name: string;
  exchange?: string;
  [key: string]: string | number | null | undefined;
}

const getIndicatorTable = (exchange: ExchangeFilter) =>
  exchange === 'US' ? 'stock_indicators_us' : 'stock_indicators';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exchange = (searchParams.get('exchange') as ExchangeFilter | null) || 'ALL';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter indicators by category
    const filteredConfigs = category === 'all'
      ? INDICATOR_CONFIGS
      : INDICATOR_CONFIGS.filter((config) => config.category === category);

    // Load extreme stocks for each filtered indicator
    const promises = filteredConfigs.map(async (config) => {
      try {
        // Build query
        const selectColumns = [
          'symbol',
          'company_name',
          config.valueColumn,
        ];

        const tableName = getIndicatorTable(exchange);

        if (tableName !== 'stock_indicators_us') {
          selectColumns.push('exchange');
        }

        if (config.extremeColumn) {
          selectColumns.push(config.extremeColumn);
        }

        let query = supabase
          .from<StockIndicatorRow>(tableName)
          .select(selectColumns.join(', '))
          .not(config.valueColumn, 'is', null);

        // Apply exchange filter
        if (exchange !== 'ALL' && tableName === 'stock_indicators') {
          query = query.eq('exchange', exchange);
        }

        // Order by value
        query = query.order(config.valueColumn, {
          ascending: config.direction === 'low',
          nullsFirst: false,
        });

        const { data, error } = await query.limit(limit);

        if (error) {
          console.error(`Error fetching ${config.key}:`, error);
          return { key: config.key, data: [] };
        }

        // Transform data to match ExtremSymbol interface
        const transformedData: ExtremSymbol[] = (data || []).map((item, index) => {
          const exchangeValue =
            tableName === 'stock_indicators_us'
              ? 'US'
              : (item.exchange as string | undefined);

          return {
            ticker: item.symbol,
            company_name: item.company_name,
            value: Number(item[config.valueColumn] ?? 0),
            extreme: config.extremeColumn
              ? (item[config.extremeColumn] as string | null)
              : exchangeValue ?? null,
            exchange: exchangeValue,
            captured_at: new Date().toISOString(),
            rank: index + 1,
            sparkline: [],
          };
        });

        return { key: config.key, data: transformedData };
      } catch (err) {
        console.error(`Error processing ${config.key}:`, err);
        return { key: config.key, data: [] };
      }
    });

    const results = await Promise.all(promises);
    const dataMap: Record<string, ExtremSymbol[]> = {};
    results.forEach(({ key, data }) => {
      dataMap[key] = data;
    });

    return NextResponse.json({
      success: true,
      data: dataMap,
      meta: {
        exchange,
        category,
        indicatorCount: filteredConfigs.length,
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
