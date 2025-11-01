const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateStockIndicators() {
  console.log('Migrating stock_indicators table\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Add exchange column (using raw SQL via RPC or direct query)
    console.log('Step 1: Adding exchange column...');

    // We'll use Supabase's SQL editor via RPC, but since we can't easily run DDL,
    // we'll do this via updating data directly and let the column be added via Supabase UI

    // First, let's get all current records
    const { data: allRecords, error: fetchError } = await supabase
      .from('stock_indicators')
      .select('symbol, as_of');

    if (fetchError) {
      console.error('Error fetching records:', fetchError.message);
      return;
    }

    console.log(`Found ${allRecords.length} records to update\n`);

    // Step 2: Update symbols - remove .NS suffix
    console.log('Step 2: Removing .NS suffix from symbols...\n');

    let updated = 0;
    let failed = 0;

    for (const record of allRecords) {
      if (record.symbol && record.symbol.endsWith('.NS')) {
        const newSymbol = record.symbol.replace('.NS', '');

        // Update the record
        const { error: updateError } = await supabase
          .from('stock_indicators')
          .update({
            symbol: newSymbol
          })
          .eq('symbol', record.symbol)
          .eq('as_of', record.as_of);

        if (updateError) {
          console.log(`  ❌ Failed to update ${record.symbol}: ${updateError.message}`);
          failed++;
        } else {
          updated++;
          if (updated % 50 === 0) {
            console.log(`  Progress: ${updated}/${allRecords.length} updated...`);
          }
        }
      }
    }

    console.log(`\n✅ Updated ${updated} symbols (removed .NS suffix)`);
    console.log(`❌ Failed: ${failed}\n`);

    // Step 3: Check if exchange column exists and update
    console.log('Step 3: Checking exchange column...');

    const { data: testData, error: testError } = await supabase
      .from('stock_indicators')
      .select('symbol, exchange')
      .limit(1);

    if (testError) {
      if (testError.message.includes('column') && testError.message.includes('exchange')) {
        console.log('⚠️  Exchange column does not exist yet.');
        console.log('\nYou need to add the exchange column in Supabase UI:');
        console.log('1. Go to Supabase Dashboard > Table Editor > stock_indicators');
        console.log('2. Click "Add Column"');
        console.log('3. Name: exchange, Type: text/varchar, Default: NSE');
        console.log('4. Position it as the 3rd column (after company_name)');
      } else {
        console.log('Error checking exchange column:', testError.message);
      }
    } else {
      console.log('✅ Exchange column exists!');

      // Update all records to have exchange = NSE
      console.log('\nUpdating all records to set exchange = NSE...');

      const { error: updateAllError, count } = await supabase
        .from('stock_indicators')
        .update({ exchange: 'NSE' })
        .is('exchange', null);

      if (updateAllError) {
        console.log('❌ Error updating exchange:', updateAllError.message);
      } else {
        console.log(`✅ Updated ${count || 'all'} records with exchange = NSE`);
      }
    }

    // Verify the changes
    console.log('\n' + '='.repeat(60));
    console.log('\nVerification:');
    console.log('-'.repeat(60));

    const { data: verifyData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, exchange')
      .limit(5);

    if (verifyData && verifyData.length > 0) {
      console.log('Sample of updated records:');
      verifyData.forEach((row, idx) => {
        console.log(`${idx + 1}. Symbol: ${row.symbol.padEnd(10)} | Exchange: ${row.exchange || 'null'} | Company: ${row.company_name?.substring(0, 40)}`);
      });
    }

    // Check for any remaining .NS symbols
    const { data: remainingNS, error: nsError } = await supabase
      .from('stock_indicators')
      .select('symbol')
      .like('symbol', '%.NS');

    if (!nsError && remainingNS) {
      if (remainingNS.length > 0) {
        console.log(`\n⚠️  Warning: ${remainingNS.length} symbols still have .NS suffix`);
        console.log('First few:', remainingNS.slice(0, 5).map(r => r.symbol).join(', '));
      } else {
        console.log('\n✅ No symbols with .NS suffix remaining');
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

migrateStockIndicators().then(() => {
  console.log('\n✅ Migration complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
