const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';
const EODHD_API_KEY = '68e0b753e65b93.29539535';

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting - EODHD API has limits
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between API calls
const INSERT_BATCH_SIZE = 500; // Insert 500 records at a time

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHistoricalPrices(ticker, exchange = 'US') {
  try {
    // Calculate date range - last 365 days to ensure we get 250 trading days
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 365);

    const toDate = today.toISOString().split('T')[0];
    const from = fromDate.toISOString().split('T')[0];

    const url = `https://eodhd.com/api/eod/${ticker}.${exchange}?api_token=${EODHD_API_KEY}&from=${from}&to=${toDate}&fmt=json`;

    const response = await fetch(url);

    if (!response.ok) {
      console.log(`   ⚠️ Failed to fetch ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`   ⚠️ No data for ${ticker}`);
      return null;
    }

    // Transform data to match our table structure
    const records = data.map(day => ({
      symbol: ticker,
      exchange: exchange,
      trading_date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      volume: day.volume
    }));

    return records;
  } catch (error) {
    console.log(`   ❌ Error fetching ${ticker}: ${error.message}`);
    return null;
  }
}

async function updateOHLCPrices() {
  console.log('Updating OHLC prices for US stocks from EODHD\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Get all US symbols from the database
    console.log('Fetching US symbols from database...\n');

    const { data: symbols, error } = await supabase
      .from('symbols')
      .select('ticker, exchange, symbol_id')
      .eq('exchange', 'US')
      .not('market_cap', 'is', null) // Only symbols we successfully updated
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching symbols:', error);
      return;
    }

    console.log(`Found ${symbols.length} US symbols to update\n`);
    console.log('=' .repeat(60) + '\n');

    let totalSymbolsProcessed = 0;
    let totalRecordsInserted = 0;
    let totalFailed = 0;

    // Process each symbol
    for (const symbol of symbols) {
      console.log(`\n[${totalSymbolsProcessed + 1}/${symbols.length}] Processing ${symbol.ticker}...`);

      // Check if we already have data for this symbol
      const { data: existingData, error: checkError } = await supabase
        .from('ohlc_prices')
        .select('trading_date')
        .eq('symbol', symbol.ticker)
        .eq('exchange', 'US')
        .limit(1);

      if (existingData && existingData.length > 0) {
        console.log(`   ⏭️  Skipping ${symbol.ticker} - already has data`);
        totalSymbolsProcessed++;
        continue;
      }

      // Fetch historical prices
      const prices = await fetchHistoricalPrices(symbol.ticker, symbol.exchange);

      if (prices && prices.length > 0) {
        console.log(`   Fetched ${prices.length} days of data`);

        // Insert in batches
        let inserted = 0;
        for (let i = 0; i < prices.length; i += INSERT_BATCH_SIZE) {
          const batch = prices.slice(i, i + INSERT_BATCH_SIZE);

          const { error: insertError } = await supabase
            .from('ohlc_prices')
            .insert(batch);

          if (insertError) {
            console.log(`   ❌ Failed to insert batch for ${symbol.ticker}: ${insertError.message}`);
            totalFailed++;
            break;
          } else {
            inserted += batch.length;
          }
        }

        if (inserted === prices.length) {
          console.log(`   ✅ Inserted ${inserted} records for ${symbol.ticker}`);
          totalRecordsInserted += inserted;
        }
      } else {
        console.log(`   ❌ No data available for ${symbol.ticker}`);
        totalFailed++;
      }

      totalSymbolsProcessed++;

      // Progress update every 10 symbols
      if (totalSymbolsProcessed % 10 === 0) {
        console.log('\n' + '-'.repeat(60));
        console.log(`Progress: ${totalSymbolsProcessed}/${symbols.length} symbols processed`);
        console.log(`Total records inserted: ${totalRecordsInserted.toLocaleString()}`);
        console.log(`Failed: ${totalFailed}`);
        console.log('-'.repeat(60));
      }

      // Rate limiting
      await sleep(DELAY_BETWEEN_REQUESTS);
    }

    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('\nFinal Summary:');
    console.log(`✅ Symbols processed: ${totalSymbolsProcessed}`);
    console.log(`✅ Total OHLC records inserted: ${totalRecordsInserted.toLocaleString()}`);
    console.log(`❌ Failed: ${totalFailed}`);

    // Show sample of inserted data
    const { data: sampleData } = await supabase
      .from('ohlc_prices')
      .select('symbol, trading_date, open, high, low, close, volume')
      .eq('exchange', 'US')
      .order('trading_date', { ascending: false })
      .limit(5);

    if (sampleData && sampleData.length > 0) {
      console.log('\nMost recent OHLC data in database:');
      console.log('-'.repeat(60));
      sampleData.forEach((record, idx) => {
        console.log(`${idx + 1}. ${record.symbol} | ${record.trading_date} | O:${record.open} H:${record.high} L:${record.low} C:${record.close}`);
      });
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the update
updateOHLCPrices().then(() => {
  console.log('\n✅ Update process complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
