import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INDICATOR_CONFIGS } from '@/config/indicators';
import type { ExtremSymbol } from '@/types';

interface IndicatorRow {
  symbol: string;
  company_name: string;
  exchange?: string;
  [key: string]: string | number | null | undefined;
}

type ExchangeFilter = 'NSE' | 'US';

type ViewType = 'top' | 'bottom';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const getTableForExchange = (exchange: ExchangeFilter) =>
  exchange === 'US' ? 'stock_indicators_us' : 'stock_indicators';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const indicatorKey = searchParams.get('indicator');
    const viewParam = (searchParams.get('view') || 'top').toLowerCase();
    const exchangeParam = (searchParams.get('exchange') || 'NSE').toUpperCase();
    const limitParam = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

    if (!indicatorKey) {
      return NextResponse.json(
        { success: false, error: 'indicator query param is required' },
        { status: 400 }
      );
    }

    const indicator = INDICATOR_CONFIGS.find((cfg) => cfg.key === indicatorKey);
    if (!indicator) {
      return NextResponse.json(
        { success: false, error: `Unknown indicator key: ${indicatorKey}` },
        { status: 400 }
      );
    }

    const view: ViewType = viewParam === 'bottom' ? 'bottom' : 'top';
    const exchange: ExchangeFilter = exchangeParam === 'US' ? 'US' : 'NSE';
    const limit = Math.min(Math.max(limitParam, 1), MAX_LIMIT);
    const offset = Math.max(offsetParam, 0);

    const tableName = getTableForExchange(exchange);
    const selectColumns = [
      'symbol',
      'company_name',
      indicator.valueColumn,
    ];

    // Only select extreme column for NSE table
    if (indicator.extremeColumn && tableName === 'stock_indicators') {
      selectColumns.push(indicator.extremeColumn);
    }

    // Include rank column if available
    if (indicator.rankColumn) {
      selectColumns.push(indicator.rankColumn);
    }

    if (tableName !== 'stock_indicators_us') {
      selectColumns.push('exchange');
    }

    let query = supabase
      .from(tableName)
      .select(selectColumns.join(', '))
      .not(indicator.valueColumn, 'is', null);

    if (tableName === 'stock_indicators') {
      query = query.eq('exchange', exchange);
    }

    // Use rank-based queries if rank column is available
    if (indicator.rankColumn) {
      if (view === 'top') {
        // Top view: fetch low rank numbers (1, 2, 3...)
        query = query
          .gte(indicator.rankColumn, offset + 1)
          .lte(indicator.rankColumn, offset + limit)
          .order(indicator.rankColumn, { ascending: true, nullsFirst: false });
      } else {
        // Bottom view: fetch high rank numbers (descending from highest)
        query = query
          .order(indicator.rankColumn, { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1);
      }
    } else {
      // Fallback to value-based ordering for indicators without rank columns
      const orderAscending = indicator.direction === 'high' ? view === 'bottom' : view === 'top';
      query = query
        .order(indicator.valueColumn, { ascending: orderAscending, nullsFirst: false })
        .range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      // Handle missing columns gracefully (schema differences between NSE and US)
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: [],
          meta: {
            indicatorKey,
            exchange,
            view,
            limit,
            offset,
            count: 0,
            hasMore: false,
          },
        });
      }
      console.error('Indicator explore query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as IndicatorRow[];
    const capturedAt = new Date().toISOString();

    const results: ExtremSymbol[] = rows.map((row, index) => {
      const exchangeValue =
        tableName === 'stock_indicators_us'
          ? 'US'
          : (row.exchange as string | undefined) ?? exchange;

      // Use actual rank from database if available, otherwise calculate from offset
      const rank = indicator.rankColumn && row[indicator.rankColumn] !== null && row[indicator.rankColumn] !== undefined
        ? Number(row[indicator.rankColumn])
        : offset + index + 1;

      return {
        ticker: row.symbol,
        company_name: row.company_name,
        value: Number(row[indicator.valueColumn] ?? 0),
        extreme: indicator.extremeColumn && tableName === 'stock_indicators'
          ? (row[indicator.extremeColumn] as string | null)
          : null,
        exchange: exchangeValue,
        captured_at: capturedAt,
        rank: rank,
        sparkline: [],
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        indicatorKey,
        exchange,
        view,
        limit,
        offset,
        count: results.length,
        hasMore: results.length === limit,
      },
    });
  } catch (error) {
    console.error('Indicator explore API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
