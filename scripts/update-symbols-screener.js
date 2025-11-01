const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';
const EODHD_API_KEY = '68e0b753e65b93.29539535';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchUSStocksWithScreener(limit = 100, offset = 0) {
  try {
    // Build screener API URL to get US stocks with market cap > 1B
    // Filter for US exchange and get stocks sorted by market cap
    const filters = JSON.stringify([
      ["exchange", "=", "US"],
      ["market_capitalization", ">", 1000000000] // > $1B market cap
    ]);

    const url = `https://eodhd.com/api/screener?api_token=${EODHD_API_KEY}&sort=market_capitalization.desc&filters=${encodeURIComponent(filters)}&limit=${limit}&offset=${offset}`;

    console.log(`Fetching batch: offset=${offset}, limit=${limit}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.log(`Error: ${response.status} ${response.statusText}`);

      // Try with demo token if our token fails
      const demoUrl = `https://eodhd.com/api/screener?api_token=demo&sort=market_capitalization.desc&filters=${encodeURIComponent(filters)}&limit=${limit}&offset=${offset}`;
      const demoResponse = await fetch(demoUrl);

      if (demoResponse.ok) {
        console.log('Using demo token instead...');
        return await demoResponse.json();
      }

      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching screener data:', error);
    return null;
  }
}

async function updateSymbolsWithScreenerData() {
  console.log('Updating US symbols with sector and market cap data from EODHD Screener\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // First, let's test the screener API with a small batch
    console.log('Testing screener API...\n');

    const testData = await fetchUSStocksWithScreener(10, 0);

    if (!testData || !testData.data) {
      console.log('❌ Failed to fetch data from screener API');
      console.log('Response:', testData);
      return;
    }

    console.log(`✅ Screener API working! Found ${testData.data.length} stocks in test batch\n`);

    // Show sample data structure
    if (testData.data.length > 0) {
      console.log('Sample stock data:');
      const sample = testData.data[0];
      console.log(`  Symbol: ${sample.code}`);
      console.log(`  Name: ${sample.name}`);
      console.log(`  Exchange: ${sample.exchange}`);
      console.log(`  Sector: ${sample.sector}`);
      console.log(`  Industry: ${sample.industry}`);
      console.log(`  Market Cap: ${sample.market_capitalization}`);
      console.log();
    }

    // Now fetch all US stocks in batches
    let totalUpdated = 0;
    let totalFailed = 0;
    const batchSize = 100;
    let offset = 0;
    let hasMore = true;

    console.log('Starting full update...\n');
    console.log('-'.repeat(40) + '\n');

    while (hasMore && offset < 1000) { // Limit to 1000 stocks for now
      const batchData = await fetchUSStocksWithScreener(batchSize, offset);

      if (!batchData || !batchData.data || batchData.data.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing batch ${offset / batchSize + 1}: ${batchData.data.length} stocks`);

      // Update each stock in Supabase
      for (const stock of batchData.data) {
        try {
          // Map the screener data to our symbols table structure
          const updateData = {
            sector: stock.sector || null,
            industry: stock.industry || null,
            market_cap: stock.market_capitalization || null,
            updated_at: new Date().toISOString()
          };

          // Update by ticker and exchange
          const { error } = await supabase
            .from('symbols')
            .update(updateData)
            .eq('ticker', stock.code)
            .eq('exchange', 'US');

          if (error) {
            console.log(`  ❌ Failed to update ${stock.code}: ${error.message}`);
            totalFailed++;
          } else {
            const marketCapFormatted = stock.market_capitalization
              ? `$${(stock.market_capitalization / 1e9).toFixed(2)}B`
              : 'N/A';
            console.log(`  ✅ ${stock.code}: ${stock.sector || 'N/A'} | ${marketCapFormatted}`);
            totalUpdated++;
          }
        } catch (e) {
          console.log(`  ❌ Error updating ${stock.code}: ${e.message}`);
          totalFailed++;
        }
      }

      offset += batchSize;

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('\nUpdate Summary:');
    console.log(`✅ Successfully updated: ${totalUpdated} symbols`);
    console.log(`❌ Failed: ${totalFailed} symbols`);

    // Verify the updates
    const { data: topStocks } = await supabase
      .from('symbols')
      .select('ticker, company_name, sector, industry, market_cap')
      .eq('exchange', 'US')
      .not('sector', 'is', null)
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(10);

    if (topStocks && topStocks.length > 0) {
      console.log('\nTop 10 US stocks by market cap:');
      console.log('-'.repeat(60));
      topStocks.forEach((stock, idx) => {
        const marketCapFormatted = stock.market_cap
          ? `$${(stock.market_cap / 1e9).toFixed(2)}B`
          : 'N/A';
        console.log(
          `${(idx + 1).toString().padStart(2)}. ${stock.ticker.padEnd(8)} | ` +
          `${(stock.sector || '').padEnd(20).substring(0, 20)} | ` +
          `${marketCapFormatted.padStart(10)}`
        );
      });
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the update
updateSymbolsWithScreenerData().then(() => {
  console.log('\n✅ Update process complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});