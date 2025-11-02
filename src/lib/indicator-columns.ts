export interface AdditionalIndicatorDefinition {
  column: string;
  title: string;
  name?: string;
  category: 'momentum' | 'trend' | 'volume' | 'volatility' | 'additional';
  format?: (value: number) => string;
}

export const ADDITIONAL_INDICATOR_DEFINITIONS: AdditionalIndicatorDefinition[] = [
  { column: 'ema_fast', title: 'EMA Fast (12)', category: 'trend', format: (v) => v.toFixed(2) },
  { column: 'ema_slow', title: 'EMA Slow (26)', category: 'trend', format: (v) => v.toFixed(2) },
  { column: 'sma_normalized', title: 'SMA Normalized', category: 'trend', format: (v) => v.toFixed(3) },
  { column: 'slope_normalized', title: 'Price Slope', category: 'trend', format: (v) => v.toFixed(3) },
  { column: 'avgvol_normalized', title: 'Average Volume', category: 'volume', format: (v) => v.toFixed(2) },
  { column: 'avgvolccy_normalized', title: 'Avg Volume (Value)', category: 'volume', format: (v) => v.toFixed(2) },
  { column: 'obv', title: 'On-Balance Volume', category: 'volume', format: (v) => v.toFixed(0) },
  { column: 'obv_z', title: 'OBV Z-Score', category: 'volume', format: (v) => v.toFixed(3) },
  { column: 'atr_14', title: 'ATR (14)', category: 'volatility', format: (v) => v.toFixed(3) },
  { column: 'atr_normalized', title: 'ATR Normalized', category: 'volatility', format: (v) => v.toFixed(3) },
  { column: 'beta', title: 'Beta', category: 'volatility', format: (v) => v.toFixed(2) },
  { column: 'stddev_normalized', title: 'Std Dev Normalized', category: 'volatility', format: (v) => v.toFixed(3) },
  { column: 'vwap_deviation', title: 'VWAP Deviation', category: 'momentum', format: (v) => v.toFixed(3) },
  { column: 'volume_ratio', title: 'Volume Ratio', category: 'volume', format: (v) => v.toFixed(2) },
];
