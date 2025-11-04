import { supabase } from '@/lib/supabase';
import {
  Symbol,
  StockIndicator,
  OHLCPrice,
  Watchlist,
  Alert,
  ChartLayout,
  ExtremSymbol
} from '@/types';

type ExchangeFilter = 'NSE' | 'US' | 'ALL';

interface StockIndicatorRow {
  symbol: string;
  company_name: string;
  exchange?: string;
  [key: string]: string | number | null | undefined;
}

const getStockIndicatorTable = (exchange: ExchangeFilter = 'NSE') =>
  exchange === 'US' ? 'stock_indicators_us' : 'stock_indicators';

export class SupabaseService {
  // Fetch all symbols
  static async getSymbols(): Promise<Symbol[]> {
    const { data, error } = await supabase
      .from('symbols')
      .select('*')
      .eq('is_active', true)
      .order('ticker');

    if (error) throw error;
    return data || [];
  }

  // Search symbols
  static async searchSymbols(query: string, limit = 10): Promise<Symbol[]> {
    const { data, error } = await supabase
      .from('symbols')
      .select('*')
      .or(`ticker.ilike.%${query}%,company_name.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get stock indicators for a specific date
  static async getStockIndicators(date?: string, exchange: ExchangeFilter = 'NSE'): Promise<StockIndicator[]> {
    const tableName = getStockIndicatorTable(exchange);

    let query = supabase
      .from(tableName)
      .select('*');

    if (date) {
      // Convert date to timestamp range for the day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query = query
        .gte('as_of', startDate.toISOString())
        .lte('as_of', endDate.toISOString());
    } else {
      // Get latest data
      query = query.order('as_of', { ascending: false }).limit(1000);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get extreme stocks for a specific indicator
  static async getExtremeStocks(
    indicator: 'rsi' | 'macd' | 'bollinger' | 'adx' | 'cmf',
    limit = 10,
    direction: 'high' | 'low' = 'high'
  ): Promise<ExtremSymbol[]> {
    const columnMap: Record<'rsi' | 'macd' | 'bollinger' | 'adx' | 'cmf', string> = {
      rsi: 'rsi_14_value',
      macd: 'macd_z_score',
      bollinger: 'bollinger_z_score',
      adx: 'adx_14_value',
      cmf: 'cmf_20_value'
    };

    const extremeColumnMap: Record<'rsi' | 'macd' | 'bollinger' | 'adx' | 'cmf', string> = {
      rsi: 'rsi_14_extreme',
      macd: 'macd_extreme',
      bollinger: 'bollinger_z_extreme',
      adx: 'adx_14_extreme',
      cmf: 'cmf_20_extreme'
    };

    const valueColumn = columnMap[indicator];
    const extremeColumn = extremeColumnMap[indicator];

    const tableName = 'stock_indicators'; // Use default table

    // Build query and filter out null values
    const selectColumns = [`symbol`, `company_name`, valueColumn, extremeColumn, 'exchange'];

    let query = supabase
      .from(tableName)
      .select(selectColumns.join(', '))
      .not(valueColumn, 'is', null);

    // Order by value
    query = query.order(valueColumn, { ascending: direction === 'low', nullsFirst: false });

    if (exchange !== 'ALL' && tableName === 'stock_indicators') {
      query = query.eq('exchange', exchange);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching extreme stocks:', error);
      return [];
    }

    const rows = (data ?? []) as StockIndicatorRow[];

    return rows.map((item) => {
      const exchangeValue =
        tableName === 'stock_indicators_us' ? 'US' : (item.exchange as string | undefined);

      return {
        ticker: item.symbol,
        company_name: item.company_name,
        value: Number(item[valueColumn] ?? 0),
        extreme: (item[extremeColumn] as string | null) ?? null,
        exchange: exchangeValue,
      };
    });
  }

  // Get OHLC price data
  static async getOHLCData(
    symbol: string,
    startDate?: string,
    endDate?: string
  ): Promise<OHLCPrice[]> {
    let query = supabase
      .from('ohlc_prices')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback: Try to get from a different table name if exists
      const { data: altData, error: altError } = await supabase
        .from('daily_prices')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: true });

      if (altError) throw altError;
      return altData || [];
    }
    return data || [];
  }

  // Get user watchlists
  static async getWatchlists(userId: string): Promise<Watchlist[]> {
    const { data, error } = await supabase
      .from('watchlists')
      .select(`
        *,
        watchlist_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Create a new watchlist
  static async createWatchlist(
    userId: string,
    name: string
  ): Promise<Watchlist> {
    const { data, error } = await supabase
      .from('watchlists')
      .insert({ user_id: userId, name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Add symbol to watchlist
  static async addToWatchlist(
    watchlistId: string,
    symbol: string
  ): Promise<void> {
    const { error } = await supabase
      .from('watchlist_items')
      .insert({ watchlist_id: watchlistId, symbol });

    if (error) throw error;
  }

  // Remove symbol from watchlist
  static async removeFromWatchlist(
    watchlistId: string,
    symbol: string
  ): Promise<void> {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('symbol', symbol);

    if (error) throw error;
  }

  // Get user alerts
  static async getAlerts(userId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Create a new alert
  static async createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'last_triggered_at'>): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update alert status
  static async updateAlertStatus(
    alertId: string,
    status: Alert['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ status })
      .eq('id', alertId);

    if (error) throw error;
  }

  // Delete alert
  static async deleteAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);

    if (error) throw error;
  }

  // Save chart layout
  static async saveChartLayout(
    userId: string,
    name: string,
    layout: unknown
  ): Promise<ChartLayout> {
    const { data, error } = await supabase
      .from('chart_layouts')
      .insert({
        user_id: userId,
        name,
        layout_json: layout
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get chart layouts
  static async getChartLayouts(userId: string): Promise<ChartLayout[]> {
    const { data, error } = await supabase
      .from('chart_layouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
