const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importUSStocks() {
  console.log('Starting US 500 stocks import...\n');

  try {
    // Read and parse CSV file
    const csvFilePath = path.join(__dirname, '..', 'us_500.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} stocks to import\n`);

    // First, check for existing US stocks to avoid duplicates
    const { data: existingStocks, error: fetchError } = await supabase
      .from('symbols')
      .select('ticker')
      .eq('exchange', 'US');

    if (fetchError) {
      console.error('Error fetching existing stocks:', fetchError);
    }

    const existingTickers = new Set((existingStocks || []).map(s => s.ticker));
    console.log(`Found ${existingTickers.size} existing US stocks in database\n`);

    // Prepare stocks for insertion
    const stocksToInsert = [];
    const stocksToUpdate = [];

    for (const record of records) {
      const stock = {
        ticker: record['Ticker Symbol'].trim(),
        company_name: record['Company Name'].trim(),
        exchange: 'US',
        is_active: true,
        priority_tier: parseInt(record['Rank']) || 999,
        index_memberships: ['SP500'],
        sector: null, // Could be added if we have sector data
        industry: null, // Could be added if we have industry data
        market_cap: null, // Could calculate from index weight if needed
        avg_volume: null, // Not available in CSV
      };

      if (existingTickers.has(stock.ticker)) {
        stocksToUpdate.push(stock);
      } else {
        stocksToInsert.push(stock);
      }
    }

    console.log(`Stocks to insert: ${stocksToInsert.length}`);
    console.log(`Stocks to update: ${stocksToUpdate.length}\n`);

    // Insert new stocks in batches
    if (stocksToInsert.length > 0) {
      console.log('Inserting new stocks...');
      const batchSize = 50;
      let inserted = 0;

      for (let i = 0; i < stocksToInsert.length; i += batchSize) {
        const batch = stocksToInsert.slice(i, i + batchSize);

        const { data, error } = await supabase
          .from('symbols')
          .insert(batch);

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        } else {
          inserted += batch.length;
          console.log(`Inserted ${inserted}/${stocksToInsert.length} stocks...`);
        }
      }
    }

    // Update existing stocks if needed
    if (stocksToUpdate.length > 0) {
      console.log('\nUpdating existing stocks...');
      let updated = 0;

      for (const stock of stocksToUpdate) {
        const { ticker, ...updateData } = stock;

        const { error } = await supabase
          .from('symbols')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('ticker', ticker)
          .eq('exchange', 'US');

        if (error) {
          console.error(`Error updating ${ticker}:`, error);
        } else {
          updated++;
          if (updated % 50 === 0 || updated === stocksToUpdate.length) {
            console.log(`Updated ${updated}/${stocksToUpdate.length} stocks...`);
          }
        }
      }
    }

    // Verify the import
    console.log('\nVerifying import...');
    const { count } = await supabase
      .from('symbols')
      .select('*', { count: 'exact', head: true })
      .eq('exchange', 'US');

    console.log(`\n✅ Import complete! Total US stocks in database: ${count}`);

    // Show a sample of imported stocks
    const { data: sample } = await supabase
      .from('symbols')
      .select('ticker, company_name, priority_tier')
      .eq('exchange', 'US')
      .order('priority_tier')
      .limit(10);

    console.log('\nTop 10 US stocks by priority:');
    sample?.forEach(stock => {
      console.log(`  ${stock.priority_tier}. ${stock.ticker} - ${stock.company_name}`);
    });

  } catch (error) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
importUSStocks().then(() => {
  console.log('\nImport process finished.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});