// Stock and Symbol Types
export interface Symbol {
  symbol_id: number;
  ticker: string;
  company_name: string;
  sector: string;
  industry: string;
  market_cap: number;
  avg_volume: number | null;
  exchange: string;
  is_active: boolean;
  priority_tier: string;
  created_at: string;
  updated_at: string;
  index_memberships: string[];
}

// Stock Indicators
export interface StockIndicator {
  symbol: string;
  company_name: string;
  exchange: string;
  as_of: string;
  // Momentum Indicators
  rsi_14_value: number | null;
  rsi_14_extreme: string | null;
  macd_value: number | null;
  macd_z_score: number | null;
  macd_extreme: string | null;
  cci: number | null;
  stoch_rsi: number | null;
  stochastic: number | null;
  // Trend Indicators
  adx_14_value: number | null;
  adx_14_extreme: string | null;
  sma: number | null;
  sma_normalized: number | null;
  wma: number | null;
  wma_normalized: number | null;
  slope: number | null;
  slope_normalized: number | null;
  // Volume Indicators
  cmf_20_value: number | null;
  cmf_20_extreme: string | null;
  avgvol: number | null;
  avgvol_normalized: number | null;
  avgvolccy: number | null;
  avgvolccy_normalized: number | null;
  // Volatility Indicators
  bollinger_z_value: number | null;
  bollinger_z_score: number | null;
  bollinger_z_extreme: string | null;
  bollinger_breakout_value: number | null;
  bollinger_breakout_extreme: string | null;
  atr: number | null;
  atr_normalized: number | null;
  stddev: number | null;
  stddev_normalized: number | null;
  // Other
  beta: number | null;
  updated_at: string;
}

// OHLC Price Data
export interface OHLCPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Extreme Ranks
export interface ExtremeRank {
  date: string;
  indicator: string;
  rank: number;
  symbol: string;
  value: number;
  score: number;
  universe: string;
}

// Watchlist Types
export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  items?: WatchlistItem[];
}

export interface WatchlistItem {
  watchlist_id: string;
  symbol: string;
  added_at: string;
}

// Alert Types
export interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  indicator: string;
  trigger_type: 'above' | 'below' | 'crosses';
  threshold: number;
  status: 'active' | 'triggered' | 'disabled';
  created_at: string;
  last_triggered_at: string | null;
}

// Chart Layout
export interface ChartLayout {
  id: string;
  user_id: string;
  name: string;
  layout_json: unknown;
  created_at: string;
}

// Dashboard Types
export interface IndicatorExtreme {
  indicator: string;
  label: string;
  topSymbols: ExtremSymbol[];
}

export interface ExtremSymbol {
  ticker: string;
  company_name: string;
  value: number;
  extreme: string | null;
  exchange?: string;
  captured_at?: string | null;
  rank?: number | null;
  change_pct?: number;
  sparkline?: number[];
}

export interface IndicatorDetailItem {
  key: string;
  column: string;
  title: string;
  name: string;
  category: IndicatorConfig['category'] | 'additional';
  value: number | null;
  extreme: string | null;
  rank: number | null;
  direction?: IndicatorConfig['direction'];
  thresholds?: IndicatorConfig['thresholds'] | null;
  format?: (value: number) => string;
}

export interface IndicatorDetailResponse {
  symbol: string;
  exchange: 'NSE' | 'US';
  companyName?: string;
  updatedAt: string | null;
  indicators: IndicatorDetailItem[];
}

// Table Row Type for main extremes table
export interface ExtremeTableRow {
  symbol: string;
  name: string;
  last: number;
  change_pct: number;
  volume: number;
  rsi_14: number;
  adx_14: number;
  bb_pctb: number;
  macd_hist: number;
  cmf_20: number;
  obv_z: number;
  atr_14: number;
  rank: number;
  sparkline: number[];
}

// Filter Types
export interface TableFilters {
  sector?: string;
  marketCap?: { min: number; max: number };
  priceRange?: { min: number; max: number };
  volumeRange?: { min: number; max: number };
  gapFilter?: 'up' | 'down' | null;
  beta?: { min: number; max: number };
}

// App State Types
export interface AppState {
  selectedUniverse: 'NSE_FO' | 'NIFTY50' | 'NIFTY100' | 'US' | 'CUSTOM';
  selectedTimeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'All';
  selectedDate: string;
  activeIndicator: string;
  tableFilters: TableFilters;
  selectedSymbol: string | null;
  chartDrawerOpen: boolean;
  selectedExchange: 'NSE' | 'US' | 'ALL';
  selectedCategory: 'all' | 'momentum' | 'trend' | 'volume' | 'volatility';
}

// Indicator Configuration
export interface IndicatorConfig {
  key: string;
  name: string;
  category: 'momentum' | 'trend' | 'volume' | 'volatility';
  valueColumn: string;
  extremeColumn?: string;
  direction: 'high' | 'low';
  title: string;
  description: string;
  unit?: string;
  thresholds?: {
    overbought?: number;
    oversold?: number;
    strong?: number;
    weak?: number;
  };
  formatValue: (value: number) => string;
}
