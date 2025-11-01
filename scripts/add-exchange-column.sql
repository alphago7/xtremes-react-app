-- Add exchange column to stock_indicators table as the 3rd column
-- Run this SQL in Supabase SQL Editor

-- Add the exchange column (will be added at the end, we can't control position in ALTER TABLE)
ALTER TABLE stock_indicators
ADD COLUMN IF NOT EXISTS exchange TEXT DEFAULT 'NSE';

-- Update all existing records to have exchange = 'NSE'
UPDATE stock_indicators
SET exchange = 'NSE'
WHERE exchange IS NULL OR exchange = '';

-- Remove .NS suffix from all symbols
UPDATE stock_indicators
SET symbol = REPLACE(symbol, '.NS', '')
WHERE symbol LIKE '%.NS';

-- Create index on exchange for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_indicators_exchange ON stock_indicators(exchange);

-- Create composite index on symbol and exchange
CREATE INDEX IF NOT EXISTS idx_stock_indicators_symbol_exchange ON stock_indicators(symbol, exchange);
