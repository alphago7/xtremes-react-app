const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUSStocksImport() {
  console.log('Running US stocks import with duplicate handling...\n');

  try {
    // Read and parse CSV file
    const csvFilePath = path.join(__dirname, '..', 'us_500.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} stocks in CSV\n`);

    // Get ALL existing stocks (not just US)
    const { data: allExistingStocks, error: fetchError } = await supabase
      .from('symbols')
      .select('ticker, exchange');

    if (fetchError) {
      console.error('Error fetching existing stocks:', fetchError);
      return;
    }

    // Create maps for tracking
    const existingByTicker = {};
    allExistingStocks.forEach(stock => {
      if (!existingByTicker[stock.ticker]) {
        existingByTicker[stock.ticker] = [];
      }
      existingByTicker[stock.ticker].push(stock.exchange);
    });

    console.log(`Found ${allExistingStocks.length} total stocks in database\n`);

    // Process each CSV record
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const failedInserts = [];

    for (const record of records) {
      const ticker = record['Ticker Symbol'].trim();
      const companyName = record['Company Name'].trim();
      const rank = parseInt(record['Rank']) || 999;

      const stockData = {
        ticker: ticker,
        company_name: companyName,
        exchange: 'US',
        is_active: true,
        priority_tier: rank,
        index_memberships: ['SP500'],
        updated_at: new Date().toISOString()
      };

      // Check if ticker exists
      if (existingByTicker[ticker]) {
        if (existingByTicker[ticker].includes('US')) {
          // Update existing US stock
          const { error } = await supabase
            .from('symbols')
            .update({
              company_name: companyName,
              priority_tier: rank,
              index_memberships: ['SP500'],
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('ticker', ticker)
            .eq('exchange', 'US');

          if (error) {
            console.error(`Error updating ${ticker}:`, error.message);
            failedInserts.push({ ticker, reason: 'update failed' });
          } else {
            updated++;
          }
        } else {
          // Ticker exists with different exchange
          console.log(`⚠️  ${ticker} exists with exchange: ${existingByTicker[ticker].join(', ')}`);

          // Try to insert with US exchange anyway (if ticker is unique per exchange)
          const { error } = await supabase
            .from('symbols')
            .insert(stockData);

          if (error) {
            if (error.code === '23505') {
              // Unique constraint violation - ticker must be globally unique
              console.log(`   Cannot add ${ticker} with US exchange (ticker must be unique)`);
              failedInserts.push({ ticker, reason: 'duplicate ticker' });
              skipped++;
            } else {
              console.error(`   Error inserting ${ticker}:`, error.message);
              failedInserts.push({ ticker, reason: error.message });
            }
          } else {
            inserted++;
            console.log(`   ✅ Added ${ticker} with US exchange`);
          }
        }
      } else {
        // New ticker - insert
        const { error } = await supabase
          .from('symbols')
          .insert(stockData);

        if (error) {
          console.error(`Error inserting ${ticker}:`, error.message);
          failedInserts.push({ ticker, reason: error.message });
        } else {
          inserted++;
          if (inserted % 50 === 0) {
            console.log(`Progress: ${inserted} inserted...`);
          }
        }
      }
    }

    // Final verification
    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`✅ Inserted: ${inserted} new stocks`);
    console.log(`📝 Updated: ${updated} existing stocks`);
    console.log(`⏭️  Skipped: ${skipped} stocks (duplicates)`);

    if (failedInserts.length > 0) {
      console.log(`\n❌ Failed to process ${failedInserts.length} stocks:`);
      failedInserts.forEach(({ ticker, reason }) => {
        console.log(`   ${ticker}: ${reason}`);
      });
    }

    // Verify final count
    const { count: usCount } = await supabase
      .from('symbols')
      .select('*', { count: 'exact', head: true })
      .eq('exchange', 'US');

    const { count: totalCount } = await supabase
      .from('symbols')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Database Status:`);
    console.log(`   US stocks: ${usCount}`);
    console.log(`   Total stocks: ${totalCount}`);

    // Show top 10 US stocks
    const { data: topStocks } = await supabase
      .from('symbols')
      .select('ticker, company_name, priority_tier')
      .eq('exchange', 'US')
      .order('priority_tier')
      .limit(10);

    console.log('\n🏆 Top 10 US stocks by priority:');
    topStocks?.forEach(stock => {
      console.log(`   ${stock.priority_tier}. ${stock.ticker} - ${stock.company_name}`);
    });

  } catch (error) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
fixUSStocksImport().then(() => {
  console.log('\nImport process complete.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});