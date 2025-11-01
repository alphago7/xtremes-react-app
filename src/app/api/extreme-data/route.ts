import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INDICATOR_CONFIGS } from '@/config/indicators';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exchange = searchParams.get('exchange') || 'ALL';
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
          'exchange',
          config.valueColumn,
        ];

        if (config.extremeColumn) {
          selectColumns.push(config.extremeColumn);
        }

        let query = supabase
          .from('stock_indicators')
          .select(selectColumns.join(', '))
          .not(config.valueColumn, 'is', null);

        // Apply exchange filter
        if (exchange !== 'ALL') {
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
        const transformedData = (data || []).map((item: any) => ({
          ticker: item.symbol,
          company_name: item.company_name,
          value: item[config.valueColumn] || 0,
          extreme: config.extremeColumn ? item[config.extremeColumn] : item.exchange,
          exchange: item.exchange,
          sparkline: [], // Will be populated with historical data in future enhancement
        }));

        return { key: config.key, data: transformedData };
      } catch (err) {
        console.error(`Error processing ${config.key}:`, err);
        return { key: config.key, data: [] };
      }
    });

    const results = await Promise.all(promises);
    const dataMap: Record<string, any[]> = {};
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
