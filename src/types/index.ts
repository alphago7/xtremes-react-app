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
  as_of: string;
  rsi_14_value: number;
  rsi_14_extreme: string | null;
  macd_value: number;
  macd_z_score: number;
  macd_extreme: string | null;
  bollinger_z_value: number;
  bollinger_z_score: number;
  bollinger_z_extreme: string | null;
  bollinger_breakout_value: number;
  bollinger_breakout_extreme: string | null;
  adx_14_value: number;
  adx_14_extreme: string | null;
  cmf_20_value: number;
  cmf_20_extreme: string | null;
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
  layout_json: any;
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
  change_pct?: number;
  sparkline?: number[];
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
  selectedUniverse: 'NSE_FO' | 'NIFTY50' | 'NIFTY100' | 'CUSTOM';
  selectedTimeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  selectedDate: string;
  activeIndicator: string;
  tableFilters: TableFilters;
  selectedSymbol: string | null;
  chartDrawerOpen: boolean;
}