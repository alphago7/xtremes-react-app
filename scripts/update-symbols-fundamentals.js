const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';
const EODHD_API_KEY = '68e0b753e65b93.29539535';

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting - EODHD has limits
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second between requests
const BATCH_SIZE = 10; // Process in batches

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchEODHDFundamentals(ticker, exchange = 'US') {
  try {
    const url = `https://eodhd.com/api/fundamentals/${ticker}.${exchange}?api_token=${EODHD_API_KEY}&fmt=json`;

    console.log(`   Fetching data for ${ticker}.${exchange}...`);
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`   ⚠️ Failed to fetch ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Extract relevant fields
    const fundamentals = {
      sector: data?.General?.Sector || null,
      industry: data?.General?.Industry || null,
      market_cap: data?.General?.MarketCapitalization || null,
      description: data?.General?.Description || null,
      employees: data?.General?.FullTimeEmployees || null,
      website: data?.General?.WebURL || null,
      exchange_actual: data?.General?.Exchange || exchange,
      currency: data?.General?.CurrencyCode || null,
      country: data?.General?.CountryISO || null,
    };

    // Also get some financial metrics
    if (data?.Highlights) {
      fundamentals.pe_ratio = data.Highlights.PERatio || null;
      fundamentals.dividend_yield = data.Highlights.DividendYield || null;
      fundamentals.profit_margin = data.Highlights.ProfitMargin || null;
      fundamentals.market_cap_value = data.Highlights.MarketCapitalization || null;
    }

    // SharesStats for more accurate share data
    if (data?.SharesStats) {
      fundamentals.shares_outstanding = data.SharesStats.SharesOutstanding || null;
      fundamentals.shares_float = data.SharesStats.SharesFloat || null;
    }

    return fundamentals;
  } catch (error) {
    console.log(`   ❌ Error fetching ${ticker}: ${error.message}`);
    return null;
  }
}

async function updateSymbolsWithFundamentals() {
  console.log('Starting to update symbols with EODHD fundamentals data\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Get all US symbols that need updating (no sector or market_cap)
    const { data: symbols, error } = await supabase
      .from('symbols')
      .select('symbol_id, ticker, exchange')
      .eq('exchange', 'US')
      .or('sector.is.null,market_cap.is.null')
      .order('priority_tier')
      .limit(100); // Start with top 100

    if (error) {
      console.error('Error fetching symbols:', error);
      return;
    }

    console.log(`Found ${symbols.length} US symbols to update\n`);

    let updated = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i/BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, symbols.length)} of ${symbols.length})`);
      console.log('-'.repeat(40));

      for (const symbol of batch) {
        // Fetch fundamentals from EODHD
        const fundamentals = await fetchEODHDFundamentals(symbol.ticker, symbol.exchange);

        if (fundamentals && (fundamentals.sector || fundamentals.market_cap)) {
          // Update the symbol in Supabase
          const updateData = {
            sector: fundamentals.sector,
            industry: fundamentals.industry,
            market_cap: fundamentals.market_cap,
            updated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('symbols')
            .update(updateData)
            .eq('symbol_id', symbol.symbol_id);

          if (updateError) {
            console.log(`   ❌ Failed to update ${symbol.ticker}:`, updateError.message);
            failed++;
          } else {
            console.log(`   ✅ Updated ${symbol.ticker}: ${fundamentals.sector || 'No sector'} | Market Cap: ${fundamentals.market_cap ? (fundamentals.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}`);
            updated++;
          }
        } else {
          console.log(`   ⏭️ Skipped ${symbol.ticker}: No data available`);
          failed++;
        }

        // Rate limiting
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\nUpdate Summary:');
    console.log(`✅ Successfully updated: ${updated} symbols`);
    console.log(`❌ Failed/Skipped: ${failed} symbols`);

    // Show some examples of updated symbols
    const { data: examples } = await supabase
      .from('symbols')
      .select('ticker, sector, industry, market_cap')
      .eq('exchange', 'US')
      .not('sector', 'is', null)
      .limit(10)
      .order('market_cap', { ascending: false });

    if (examples && examples.length > 0) {
      console.log('\nTop 10 US stocks by market cap with sector data:');
      console.log('-'.repeat(60));
      examples.forEach((stock, idx) => {
        const marketCapFormatted = stock.market_cap
          ? (stock.market_cap / 1e9).toFixed(2) + 'B'
          : 'N/A';
        console.log(`${idx + 1}. ${stock.ticker.padEnd(8)} | ${(stock.sector || '').padEnd(20).substring(0, 20)} | $${marketCapFormatted}`);
      });
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the update
updateSymbolsWithFundamentals().then(() => {
  console.log('\n✅ Update process complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});