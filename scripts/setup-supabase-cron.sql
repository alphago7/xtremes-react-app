-- Setup automated rank calculation on Supabase
-- Run this in Supabase SQL Editor

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Schedule the rank calculation to run daily at 6:30 PM IST (1:00 PM UTC)
-- Note: 6:30 PM IST = 13:00 UTC (IST is UTC+5:30)
SELECT cron.schedule(
  'calculate-indicator-ranks-daily',  -- Job name
  '0 13 * * *',                        -- Cron expression: 1:00 PM UTC = 6:30 PM IST
  $$
    SELECT calculate_indicator_ranks('stock_indicators');
    SELECT calculate_indicator_ranks('stock_indicators_us');
  $$
);

-- Step 3: Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'calculate-indicator-ranks-daily';

-- You should see output like:
-- jobid | schedule  | command | nodename | nodeport | database | username | active | jobname
-- ------+-----------+---------+----------+----------+----------+----------+--------+---------
--   123 | 0 13 * * *| SELECT...| ...      | ...      | postgres | ...      | true   | calculate-indicator-ranks-daily

-- To view job run history:
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'calculate-indicator-ranks-daily')
ORDER BY start_time DESC
LIMIT 10;

-- To unschedule (if needed):
-- SELECT cron.unschedule('calculate-indicator-ranks-daily');

-- To manually trigger the job now (for testing):
SELECT calculate_indicator_ranks('stock_indicators');
SELECT calculate_indicator_ranks('stock_indicators_us');
