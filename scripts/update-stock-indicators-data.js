const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStockIndicatorsData() {
  console.log('Updating stock_indicators table data\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Verify exchange column exists
    console.log('Step 1: Checking if exchange column exists...');

    const { data: testData, error: testError } = await supabase
      .from('stock_indicators')
      .select('symbol, exchange')
      .limit(1);

    if (testError) {
      console.log('❌ Error: exchange column might not exist yet');
      console.log('Error message:', testError.message);
      console.log('\nPlease add the exchange column in Supabase first.');
      return;
    }

    console.log('✅ Exchange column exists\n');

    // Step 2: Get all records with .NS suffix
    console.log('Step 2: Finding symbols with .NS suffix...');

    const { data: nsSymbols, error: nsError } = await supabase
      .from('stock_indicators')
      .select('symbol, as_of, exchange')
      .like('symbol', '%.NS');

    if (nsError) {
      console.log('❌ Error fetching symbols:', nsError.message);
      return;
    }

    console.log(`Found ${nsSymbols.length} records with .NS suffix\n`);

    // Step 3: Update symbols to remove .NS and set exchange
    console.log('Step 3: Removing .NS suffix and setting exchange = NSE...\n');

    let updated = 0;
    let failed = 0;

    for (const record of nsSymbols) {
      const oldSymbol = record.symbol;
      const newSymbol = oldSymbol.replace('.NS', '');

      // Update the record
      const { error: updateError } = await supabase
        .from('stock_indicators')
        .update({
          symbol: newSymbol,
          exchange: 'NSE'
        })
        .eq('symbol', oldSymbol)
        .eq('as_of', record.as_of);

      if (updateError) {
        console.log(`  ❌ Failed to update ${oldSymbol}: ${updateError.message}`);
        failed++;
      } else {
        updated++;
        if (updated % 50 === 0) {
          console.log(`  Progress: ${updated}/${nsSymbols.length} records updated...`);
        }
      }
    }

    console.log(`\n✅ Updated ${updated} records`);
    console.log(`❌ Failed: ${failed}\n`);

    // Step 4: Set exchange = NSE for any records that don't have it
    console.log('Step 4: Ensuring all records have exchange = NSE...');

    const { error: updateAllError } = await supabase
      .from('stock_indicators')
      .update({ exchange: 'NSE' })
      .or('exchange.is.null,exchange.eq.');

    if (updateAllError) {
      console.log('❌ Error:', updateAllError.message);
    } else {
      console.log('✅ All records now have exchange = NSE\n');
    }

    // Step 5: Verify the migration
    console.log('=' .repeat(60));
    console.log('\nVerification:\n');

    const { data: verifyData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, exchange, as_of')
      .order('symbol')
      .limit(10);

    if (verifyData && verifyData.length > 0) {
      console.log('Sample of migrated records:');
      console.log('-'.repeat(60));
      verifyData.forEach((row, idx) => {
        const symbol = (row.symbol || '').padEnd(12);
        const exchange = (row.exchange || 'null').padEnd(8);
        const company = (row.company_name || '').substring(0, 25).padEnd(25);
        console.log(`${(idx + 1).toString().padStart(2)}. ${symbol} | ${exchange} | ${company}`);
      });
    }

    // Check for any remaining .NS symbols
    const { data: remainingNS, count: remainingCount } = await supabase
      .from('stock_indicators')
      .select('symbol', { count: 'exact' })
      .like('symbol', '%.NS');

    if (remainingCount > 0) {
      console.log(`\n⚠️  Warning: ${remainingCount} symbols still have .NS suffix`);
    } else {
      console.log('\n✅ No symbols with .NS suffix remaining');
    }

    // Count total records by exchange
    const { count: nseCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .eq('exchange', 'NSE');

    const { count: totalCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total records: ${totalCount}`);
    console.log(`📊 Records with exchange = 'NSE': ${nseCount}`);

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

updateStockIndicatorsData().then(() => {
  console.log('\n✅ Data migration complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
