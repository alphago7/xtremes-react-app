import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INDICATOR_CONFIGS } from '@/config/indicators';
import type { IndicatorDetailResponse, IndicatorDetailItem } from '@/types';

type ExchangeFilter = 'NSE' | 'US';

const getTableForExchange = (exchange: ExchangeFilter) =>
  exchange === 'US' ? 'stock_indicators_us' : 'stock_indicators';

const deriveRankColumn = (valueColumn: string): string | null => {
  const suffixes = [
    { match: /_value$/i, replace: '_rank' },
    { match: /_z_score$/i, replace: '_rank' },
    { match: /_normalized$/i, replace: '_rank' },
    { match: /_pctb$/i, replace: '_rank' },
    { match: /_20$/i, replace: '_rank' },
    { match: /_fast$/i, replace: '_rank' },
    { match: /_slow$/i, replace: '_rank' },
  ];

  for (const rule of suffixes) {
    if (rule.match.test(valueColumn)) {
      return valueColumn.replace(rule.match, rule.replace);
    }
  }

  return `${valueColumn}_rank`;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const exchangeParam = (searchParams.get('exchange') || 'US').toUpperCase();
    const exchange: ExchangeFilter = exchangeParam === 'NSE' ? 'NSE' : 'US';

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'symbol query param is required' }, { status: 400 });
    }

    const tableName = getTableForExchange(exchange);

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('symbol', symbol)
      .maybeSingle();

    if (error) {
      console.error('Indicator details query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Symbol not found' }, { status: 404 });
    }

    const configByColumn = new Map(INDICATOR_CONFIGS.map((cfg) => [cfg.valueColumn, cfg]));

    const indicators: IndicatorDetailItem[] = Object.keys(data)
      .filter((column) => {
        if (['symbol', 'company_name', 'exchange', 'updated_at', 'created_at', 'as_of'].includes(column)) return false;
        if (column.endsWith('_rank') || column.endsWith('_extreme')) return false;
        const raw = data[column as keyof typeof data];
        return typeof raw === 'number';
      })
      .map((column) => {
        const config = configByColumn.get(column);
        const rawValue = data[column as keyof typeof data];
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? null);
        const rankColumn = deriveRankColumn(column);
        const rankValue = data[rankColumn as keyof typeof data];
        const extremeValue = config?.extremeColumn
          ? data[config.extremeColumn as keyof typeof data] ?? null
          : data[`${column}_extreme` as keyof typeof data] ?? null;

        const title = config?.title ?? column
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        return {
          key: config?.key ?? column,
          column,
          title,
          name: config?.name ?? title,
          category: config?.category ?? 'additional',
          value: Number.isFinite(value) ? value : null,
          extreme: typeof extremeValue === 'string' ? extremeValue : extremeValue === null ? null : String(extremeValue),
          rank: typeof rankValue === 'number' ? rankValue : rankValue === null ? null : Number(rankValue ?? null),
          direction: config?.direction,
          thresholds: config?.thresholds ?? null,
          format: config?.formatValue,
        } satisfies IndicatorDetailItem;
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    const response: IndicatorDetailResponse = {
      symbol: data.symbol,
      exchange,
      companyName: data.company_name,
      updatedAt: data.updated_at || data.as_of || null,
      indicators,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Indicator details API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
