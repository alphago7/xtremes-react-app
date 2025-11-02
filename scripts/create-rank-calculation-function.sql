-- Create reusable function to calculate all indicator ranks
-- This can be called manually or scheduled via pg_cron

CREATE OR REPLACE FUNCTION calculate_indicator_ranks(table_name TEXT DEFAULT 'stock_indicators')
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Momentum Indicators
  EXECUTE format('
    WITH rsi_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY rsi_14_value DESC NULLS LAST) as rank
      FROM %I WHERE rsi_14_value IS NOT NULL
    )
    UPDATE %I si SET rsi_14_rank = rr.rank
    FROM rsi_ranks rr
    WHERE si.symbol = rr.symbol AND si.exchange = rr.exchange AND si.as_of = rr.as_of
  ', table_name, table_name);

  EXECUTE format('
    WITH macd_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(macd_z_score) DESC NULLS LAST) as rank
      FROM %I WHERE macd_z_score IS NOT NULL
    )
    UPDATE %I si SET macd_z_rank = mr.rank
    FROM macd_ranks mr
    WHERE si.symbol = mr.symbol AND si.exchange = mr.exchange AND si.as_of = mr.as_of
  ', table_name, table_name);

  -- Trend Indicators
  EXECUTE format('
    WITH adx_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY adx_14_value DESC NULLS LAST) as rank
      FROM %I WHERE adx_14_value IS NOT NULL
    )
    UPDATE %I si SET adx_14_rank = ar.rank
    FROM adx_ranks ar
    WHERE si.symbol = ar.symbol AND si.exchange = ar.exchange AND si.as_of = ar.as_of
  ', table_name, table_name);

  EXECUTE format('
    WITH sma_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(sma_normalized) DESC NULLS LAST) as rank
      FROM %I WHERE sma_normalized IS NOT NULL
    )
    UPDATE %I si SET sma_normalized_rank = sr.rank
    FROM sma_ranks sr
    WHERE si.symbol = sr.symbol AND si.exchange = sr.exchange AND si.as_of = sr.as_of
  ', table_name, table_name);

  -- Volume Indicators
  EXECUTE format('
    WITH cmf_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(cmf_20_value) DESC NULLS LAST) as rank
      FROM %I WHERE cmf_20_value IS NOT NULL
    )
    UPDATE %I si SET cmf_20_rank = cr.rank
    FROM cmf_ranks cr
    WHERE si.symbol = cr.symbol AND si.exchange = cr.exchange AND si.as_of = cr.as_of
  ', table_name, table_name);

  EXECUTE format('
    WITH avgvol_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY avgvol_normalized DESC NULLS LAST) as rank
      FROM %I WHERE avgvol_normalized IS NOT NULL
    )
    UPDATE %I si SET avgvol_normalized_rank = ar.rank
    FROM avgvol_ranks ar
    WHERE si.symbol = ar.symbol AND si.exchange = ar.exchange AND si.as_of = ar.as_of
  ', table_name, table_name);

  -- Volatility Indicators
  EXECUTE format('
    WITH bollinger_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(bollinger_z_score) DESC NULLS LAST) as rank
      FROM %I WHERE bollinger_z_score IS NOT NULL
    )
    UPDATE %I si SET bollinger_z_score_rank = br.rank
    FROM bollinger_ranks br
    WHERE si.symbol = br.symbol AND si.exchange = br.exchange AND si.as_of = br.as_of
  ', table_name, table_name);

  EXECUTE format('
    WITH atr_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY atr_normalized DESC NULLS LAST) as rank
      FROM %I WHERE atr_normalized IS NOT NULL
    )
    UPDATE %I si SET atr_normalized_rank = ar.rank
    FROM atr_ranks ar
    WHERE si.symbol = ar.symbol AND si.exchange = ar.exchange AND si.as_of = ar.as_of
  ', table_name, table_name);

  EXECUTE format('
    WITH beta_ranks AS (
      SELECT symbol, exchange, as_of,
             ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY ABS(beta) DESC NULLS LAST) as rank
      FROM %I WHERE beta IS NOT NULL
    )
    UPDATE %I si SET beta_rank = br.rank
    FROM beta_ranks br
    WHERE si.symbol = br.symbol AND si.exchange = br.exchange AND si.as_of = br.as_of
  ', table_name, table_name);

  RAISE NOTICE 'Ranks calculated for % at %', table_name, NOW();
END;
$$;

-- Usage:
-- SELECT calculate_indicator_ranks('stock_indicators');
-- SELECT calculate_indicator_ranks('stock_indicators_us');

-- OPTION 1: Schedule with pg_cron (if enabled on Supabase)
-- Runs daily at 6 PM (after market close)
-- SELECT cron.schedule(
--   'calculate-indicator-ranks-daily',
--   '0 18 * * *', -- 6 PM daily
--   $$
--     SELECT calculate_indicator_ranks('stock_indicators');
--     SELECT calculate_indicator_ranks('stock_indicators_us');
--   $$
-- );

-- OPTION 2: Trigger on indicator update (more real-time but more expensive)
-- Not recommended for high-frequency updates

-- OPTION 3: Manual call via Edge Function (recommended)
-- Create an edge function that calls this and schedule it via Supabase's cron
