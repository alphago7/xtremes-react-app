-- Add rank columns for all indicators in stock_indicators_us table
-- Run this in Supabase SQL Editor AFTER adding columns to stock_indicators

-- Add rank columns for momentum indicators
ALTER TABLE stock_indicators_us
ADD COLUMN IF NOT EXISTS rsi_14_rank INTEGER,
ADD COLUMN IF NOT EXISTS macd_rank INTEGER,
ADD COLUMN IF NOT EXISTS macd_z_rank INTEGER,
ADD COLUMN IF NOT EXISTS cci_rank INTEGER,
ADD COLUMN IF NOT EXISTS stoch_rsi_rank INTEGER,
ADD COLUMN IF NOT EXISTS stochastic_rank INTEGER;

-- Add rank columns for trend indicators
ALTER TABLE stock_indicators_us
ADD COLUMN IF NOT EXISTS adx_14_rank INTEGER,
ADD COLUMN IF NOT EXISTS sma_rank INTEGER,
ADD COLUMN IF NOT EXISTS sma_normalized_rank INTEGER,
ADD COLUMN IF NOT EXISTS wma_rank INTEGER,
ADD COLUMN IF NOT EXISTS wma_normalized_rank INTEGER,
ADD COLUMN IF NOT EXISTS slope_rank INTEGER,
ADD COLUMN IF NOT EXISTS slope_normalized_rank INTEGER;

-- Add rank columns for volume indicators
ALTER TABLE stock_indicators_us
ADD COLUMN IF NOT EXISTS cmf_20_rank INTEGER,
ADD COLUMN IF NOT EXISTS avgvol_rank INTEGER,
ADD COLUMN IF NOT EXISTS avgvol_normalized_rank INTEGER,
ADD COLUMN IF NOT EXISTS avgvolccy_rank INTEGER,
ADD COLUMN IF NOT EXISTS avgvolccy_normalized_rank INTEGER;

-- Add rank columns for volatility indicators
ALTER TABLE stock_indicators_us
ADD COLUMN IF NOT EXISTS bollinger_z_rank INTEGER,
ADD COLUMN IF NOT EXISTS bollinger_z_score_rank INTEGER,
ADD COLUMN IF NOT EXISTS bollinger_breakout_rank INTEGER,
ADD COLUMN IF NOT EXISTS atr_rank INTEGER,
ADD COLUMN IF NOT EXISTS atr_normalized_rank INTEGER,
ADD COLUMN IF NOT EXISTS stddev_rank INTEGER,
ADD COLUMN IF NOT EXISTS stddev_normalized_rank INTEGER;

-- Add rank column for beta
ALTER TABLE stock_indicators_us
ADD COLUMN IF NOT EXISTS beta_rank INTEGER;

-- Create indexes for rank columns (for efficient sorting)
CREATE INDEX IF NOT EXISTS idx_stock_indicators_us_rsi_rank ON stock_indicators_us(rsi_14_rank) WHERE rsi_14_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_indicators_us_macd_rank ON stock_indicators_us(macd_rank) WHERE macd_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_indicators_us_adx_rank ON stock_indicators_us(adx_14_rank) WHERE adx_14_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_indicators_us_cmf_rank ON stock_indicators_us(cmf_20_rank) WHERE cmf_20_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_indicators_us_bollinger_rank ON stock_indicators_us(bollinger_z_rank) WHERE bollinger_z_rank IS NOT NULL;
