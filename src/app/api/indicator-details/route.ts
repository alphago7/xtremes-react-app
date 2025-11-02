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

    const seenValueColumns = new Set<string>();

    const indicators: IndicatorDetailItem[] = INDICATOR_CONFIGS.map((config) => {
      const rankColumn = deriveRankColumn(config.valueColumn);
      seenValueColumns.add(config.valueColumn);
      if (config.extremeColumn) {
        seenValueColumns.add(config.extremeColumn);
      }
      if (rankColumn) {
        seenValueColumns.add(rankColumn);
      }

      const value = data[config.valueColumn as keyof typeof data];
      const extremeValue = config.extremeColumn
        ? data[config.extremeColumn as keyof typeof data]
        : null;
      const rankValue = data[rankColumn as keyof typeof data];

      return {
        key: config.key,
        title: config.title,
        name: config.name,
        category: config.category,
        value: typeof value === 'number' ? value : value === null ? null : Number(value ?? null),
        extreme: typeof extremeValue === 'string' ? extremeValue : extremeValue === null ? null : String(extremeValue),
        rank: typeof rankValue === 'number' ? rankValue : rankValue === null ? null : Number(rankValue ?? null),
        direction: config.direction,
        thresholds: config.thresholds || null,
      };
    });

    const additionalIndicators: IndicatorDetailItem[] = Object.keys(data)
      .filter((column) => {
        if (seenValueColumns.has(column)) return false;
        if (['symbol', 'company_name', 'exchange', 'updated_at', 'created_at', 'as_of'].includes(column)) return false;
        if (column.endsWith('_rank') || column.endsWith('_extreme') || column.endsWith('_value')) return false;
        const raw = data[column as keyof typeof data];
        return typeof raw === 'number';
      })
      .map((column) => {
        const rawValue = data[column as keyof typeof data];
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? null);
        const extremeValue = data[`${column}_extreme` as keyof typeof data] ?? null;
        const rankColumn = deriveRankColumn(column);
        const rankValue = data[rankColumn as keyof typeof data];

        const category = inferCategory(column);
        const title = getFriendlyTitle(column);

        seenValueColumns.add(column);
        if (rankColumn) {
          seenValueColumns.add(rankColumn);
        }
        if (typeof extremeValue !== 'undefined') {
          seenValueColumns.add(`${column}_extreme`);
        }

        return {
          key: column,
          title,
          name: title,
          category,
          value: Number.isFinite(value) ? value : null,
          extreme: typeof extremeValue === 'string' ? extremeValue : extremeValue === null ? null : String(extremeValue),
          rank: typeof rankValue === 'number' ? rankValue : rankValue === null ? null : Number(rankValue ?? null),
          format: getFormatter(column),
        } satisfies IndicatorDetailItem;
      });

    const combined = [...indicators, ...additionalIndicators].sort((a, b) => {
      const categoryOrder = ['momentum', 'trend', 'volume', 'volatility', 'additional'];
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });

    const response: IndicatorDetailResponse = {
      symbol: data.symbol,
      exchange,
      companyName: data.company_name,
      updatedAt: data.updated_at || data.as_of || null,
      indicators: combined,
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
