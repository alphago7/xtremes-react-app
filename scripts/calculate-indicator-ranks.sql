-- Calculate and update ranks for all indicators in stock_indicators table
-- Rank 1 = highest value, Rank N = lowest value (for most indicators)
-- Run this in Supabase SQL Editor

-- MOMENTUM INDICATORS (Higher is typically more extreme)

-- RSI Ranks (both high and low are interesting)
WITH rsi_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY rsi_14_value DESC NULLS LAST) as rank_desc,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY rsi_14_value ASC NULLS LAST) as rank_asc
  FROM stock_indicators
  WHERE rsi_14_value IS NOT NULL
)
UPDATE stock_indicators si
SET rsi_14_rank = rr.rank_desc
FROM rsi_ranks rr
WHERE si.symbol = rr.symbol
  AND si.exchange = rr.exchange
  AND si.as_of = rr.as_of;

-- MACD Z-Score Ranks (higher absolute value = stronger signal)
WITH macd_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(macd_z_score) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE macd_z_score IS NOT NULL
)
UPDATE stock_indicators si
SET macd_z_rank = mr.rank
FROM macd_ranks mr
WHERE si.symbol = mr.symbol
  AND si.exchange = mr.exchange
  AND si.as_of = mr.as_of;

-- CCI Ranks
WITH cci_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(cci) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE cci IS NOT NULL
)
UPDATE stock_indicators si
SET cci_rank = cr.rank
FROM cci_ranks cr
WHERE si.symbol = cr.symbol
  AND si.exchange = cr.exchange
  AND si.as_of = cr.as_of;

-- Stochastic RSI Ranks
WITH stoch_rsi_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY stoch_rsi DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE stoch_rsi IS NOT NULL
)
UPDATE stock_indicators si
SET stoch_rsi_rank = sr.rank
FROM stoch_rsi_ranks sr
WHERE si.symbol = sr.symbol
  AND si.exchange = sr.exchange
  AND si.as_of = sr.as_of;

-- Stochastic Ranks
WITH stochastic_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY stochastic DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE stochastic IS NOT NULL
)
UPDATE stock_indicators si
SET stochastic_rank = sr.rank
FROM stochastic_ranks sr
WHERE si.symbol = sr.symbol
  AND si.exchange = sr.exchange
  AND si.as_of = sr.as_of;

-- TREND INDICATORS

-- ADX Ranks (higher = stronger trend)
WITH adx_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY adx_14_value DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE adx_14_value IS NOT NULL
)
UPDATE stock_indicators si
SET adx_14_rank = ar.rank
FROM adx_ranks ar
WHERE si.symbol = ar.symbol
  AND si.exchange = ar.exchange
  AND si.as_of = ar.as_of;

-- SMA Normalized Ranks (most divergent from SMA)
WITH sma_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(sma_normalized) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE sma_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET sma_normalized_rank = sr.rank
FROM sma_ranks sr
WHERE si.symbol = sr.symbol
  AND si.exchange = sr.exchange
  AND si.as_of = sr.as_of;

-- WMA Normalized Ranks
WITH wma_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(wma_normalized) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE wma_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET wma_normalized_rank = wr.rank
FROM wma_ranks wr
WHERE si.symbol = wr.symbol
  AND si.exchange = wr.exchange
  AND si.as_of = wr.as_of;

-- Slope Normalized Ranks (steepest trends)
WITH slope_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(slope_normalized) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE slope_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET slope_normalized_rank = sr.rank
FROM slope_ranks sr
WHERE si.symbol = sr.symbol
  AND si.exchange = sr.exchange
  AND si.as_of = sr.as_of;

-- VOLUME INDICATORS

-- CMF Ranks (highest absolute value = strongest flow)
WITH cmf_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(cmf_20_value) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE cmf_20_value IS NOT NULL
)
UPDATE stock_indicators si
SET cmf_20_rank = cr.rank
FROM cmf_ranks cr
WHERE si.symbol = cr.symbol
  AND si.exchange = cr.exchange
  AND si.as_of = cr.as_of;

-- Average Volume Normalized Ranks
WITH avgvol_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY avgvol_normalized DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE avgvol_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET avgvol_normalized_rank = ar.rank
FROM avgvol_ranks ar
WHERE si.symbol = ar.symbol
  AND si.exchange = ar.exchange
  AND si.as_of = ar.as_of;

-- Average Volume Currency Normalized Ranks
WITH avgvolccy_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY avgvolccy_normalized DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE avgvolccy_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET avgvolccy_normalized_rank = ar.rank
FROM avgvolccy_ranks ar
WHERE si.symbol = ar.symbol
  AND si.exchange = ar.exchange
  AND si.as_of = ar.as_of;

-- VOLATILITY INDICATORS

-- Bollinger Z-Score Ranks (most extreme positions)
WITH bollinger_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(bollinger_z_score) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE bollinger_z_score IS NOT NULL
)
UPDATE stock_indicators si
SET bollinger_z_score_rank = br.rank
FROM bollinger_ranks br
WHERE si.symbol = br.symbol
  AND si.exchange = br.exchange
  AND si.as_of = br.as_of;

-- ATR Normalized Ranks (highest volatility first)
WITH atr_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY atr_normalized DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE atr_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET atr_normalized_rank = ar.rank
FROM atr_ranks ar
WHERE si.symbol = ar.symbol
  AND si.exchange = ar.exchange
  AND si.as_of = ar.as_of;

-- StdDev Normalized Ranks
WITH stddev_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY stddev_normalized DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE stddev_normalized IS NOT NULL
)
UPDATE stock_indicators si
SET stddev_normalized_rank = sr.rank
FROM stddev_ranks sr
WHERE si.symbol = sr.symbol
  AND si.exchange = sr.exchange
  AND si.as_of = sr.as_of;

-- Beta Ranks (highest beta first)
WITH beta_ranks AS (
  SELECT
    symbol,
    exchange,
    as_of,
    ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(beta) DESC NULLS LAST) as rank
  FROM stock_indicators
  WHERE beta IS NOT NULL
)
UPDATE stock_indicators si
SET beta_rank = br.rank
FROM beta_ranks br
WHERE si.symbol = br.symbol
  AND si.exchange = br.exchange
  AND si.as_of = br.as_of;

-- Verify rankings
SELECT
  symbol,
  exchange,
  rsi_14_value,
  rsi_14_rank,
  adx_14_value,
  adx_14_rank,
  cmf_20_value,
  cmf_20_rank
FROM stock_indicators
WHERE exchange = 'NSE'
  AND (rsi_14_rank IS NOT NULL OR adx_14_rank IS NOT NULL OR cmf_20_rank IS NOT NULL)
ORDER BY rsi_14_rank
LIMIT 10;
