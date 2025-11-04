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

        // Include rank column if available
        if (config.rankColumn) {
          selectColumns.push(config.rankColumn);
        }

        let query = supabase
          .from(tableName)
          .select(selectColumns.join(', '))
          .not(config.valueColumn, 'is', null);

        // Apply exchange filter
        if (exchange !== 'ALL' && tableName === 'stock_indicators') {
          query = query.eq('exchange', exchange);
        }

        // Use rank-based query if rankColumn is available, otherwise fallback to value ordering
        if (config.rankColumn) {
          if (config.direction === 'high') {
            // For high direction: fetch first 10 ranks (1-10 are highest values/overbought)
            query = query.lte(config.rankColumn, limit).order(config.rankColumn, { ascending: true });
          } else {
            // For low direction: fetch last 10 ranks (highest rank numbers are lowest values/oversold)
            query = query.order(config.rankColumn, { ascending: false, nullsFirst: false });
          }
        } else {
          // Fallback to old logic for indicators without rank columns
          query = query.order(config.valueColumn, {
            ascending: config.direction === 'low',
            nullsFirst: false,
          });
        }

        const { data, error } = await query.limit(limit);

        if (error) {
          console.error(`Error fetching ${config.key}:`, error);
          return { key: config.key, data: [] };
        }

        // Transform data to match ExtremSymbol interface
        const transformedData: ExtremSymbol[] = ((data || []) as unknown as StockIndicatorRow[]).map((item, index) => {
          const exchangeValue =
            tableName === 'stock_indicators_us'
              ? 'US'
              : (item.exchange as string | undefined);

          // Use actual rank from database if available, otherwise use index
          const rank = config.rankColumn && item[config.rankColumn] !== null && item[config.rankColumn] !== undefined
            ? Number(item[config.rankColumn])
            : index + 1;

          return {
            ticker: item.symbol,
            company_name: item.company_name,
            value: Number(item[config.valueColumn] ?? 0),
            extreme: config.extremeColumn
              ? (item[config.extremeColumn] as string | null)
              : exchangeValue ?? null,
            exchange: exchangeValue,
            captured_at: new Date().toISOString(),
            rank: rank,
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
