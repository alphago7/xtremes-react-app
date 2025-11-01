import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const EODHD_API_KEY = process.env.NEXT_PUBLIC_EODHD_API_KEY || '68e0b753e65b93.29539535';

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface EodhdResponseEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface OhlcRow {
  trading_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

async function fetchFromEODHD(symbol: string, exchange: string, limit: number): Promise<OHLCData[]> {
  try {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - (limit * 2)); // Get more days to ensure we have enough trading days

    const toDate = today.toISOString().split('T')[0];
    const from = fromDate.toISOString().split('T')[0];

    const url = `https://eodhd.com/api/eod/${symbol}.${exchange}?api_token=${EODHD_API_KEY}&from=${from}&to=${toDate}&fmt=json`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`EODHD API error for ${symbol}: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as EodhdResponseEntry[] | undefined;

    if (!Array.isArray(data)) {
      return [];
    }

    // Transform to our format and limit to requested number
    return data.slice(-limit).map((item) => ({
      time: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));
  } catch (error) {
    console.error(`Error fetching from EODHD for ${symbol}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const exchange = searchParams.get('exchange') || 'NSE';
    const limit = parseInt(searchParams.get('limit') || '200');
    const interval = searchParams.get('interval') || '1d';

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Only support daily interval for now
    if (interval !== '1d') {
      return NextResponse.json(
        { success: false, error: 'Only daily interval (1d) is currently supported' },
        { status: 400 }
      );
    }

    // Try to fetch from database first
    const { data: dbData, error: dbError } = await supabase
      .from<OhlcRow>('ohlc_prices')
      .select('trading_date, open, high, low, close, volume')
      .eq('symbol', symbol)
      .eq('exchange', exchange)
      .order('trading_date', { ascending: true });

    if (dbError) {
      console.error('Supabase OHLC fetch error:', dbError);
    }

    let ohlcData: OHLCData[] = [];

    if (dbData && dbData.length > 0) {
      // Transform database data to chart format
      ohlcData = dbData.map((item) => ({
        time: item.trading_date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume ?? undefined,
      }));

      // Take last N records
      ohlcData = ohlcData.slice(-limit);
    }

    // If we don't have enough data, try EODHD
    if (ohlcData.length < limit) {
      console.log(`DB has ${ohlcData.length} records, fetching from EODHD for ${symbol}`);
      const eodhData = await fetchFromEODHD(symbol, exchange, limit);

      if (eodhData.length > 0) {
        // Merge data (prefer DB data, fill gaps with EODHD)
        const dbDates = new Set(ohlcData.map(d => d.time));
        const newData = eodhData.filter(d => !dbDates.has(d.time));

        ohlcData = [...ohlcData, ...newData].sort((a, b) =>
          a.time.localeCompare(b.time)
        );

        // Limit to requested size
        ohlcData = ohlcData.slice(-limit);
      }
    }

    return NextResponse.json({
      success: true,
      data: ohlcData,
      meta: {
        symbol,
        exchange,
        count: ohlcData.length,
        source: ohlcData.length === 0 ? 'none' : dbData?.length > 0 ? 'database' : 'eodhd',
      },
    });
  } catch (error) {
    console.error('OHLC API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
