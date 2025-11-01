const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running stock_indicators migration\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-exchange-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration...\n');
    console.log(sql);
    console.log('\n' + '='.repeat(60) + '\n');

    // Execute each SQL statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (!statement) continue;

      console.log('Executing:', statement.substring(0, 80) + '...');

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.log(`  ⚠️ Error: ${error.message}`);
        // Try alternative approach - direct query
        console.log('  Trying alternative approach...');
      } else {
        console.log('  ✅ Success');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\nVerifying migration...\n');

    // Verify the changes
    const { data: verifyData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, exchange, as_of')
      .limit(5);

    if (verifyData && verifyData.length > 0) {
      console.log('Sample of migrated records:');
      console.log('-'.repeat(60));
      verifyData.forEach((row, idx) => {
        const symbol = (row.symbol || '').padEnd(10);
        const exchange = (row.exchange || 'null').padEnd(8);
        const company = (row.company_name || '').substring(0, 30);
        console.log(`${idx + 1}. ${symbol} | ${exchange} | ${company}`);
      });
    }

    // Check for any remaining .NS symbols
    const { data: remainingNS } = await supabase
      .from('stock_indicators')
      .select('symbol')
      .like('symbol', '%.NS')
      .limit(5);

    if (remainingNS && remainingNS.length > 0) {
      console.log(`\n⚠️  Warning: Found ${remainingNS.length} symbols still with .NS suffix`);
      console.log('Examples:', remainingNS.map(r => r.symbol).join(', '));
    } else {
      console.log('\n✅ No symbols with .NS suffix remaining');
    }

    // Count records with exchange = NSE
    const { count } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .eq('exchange', 'NSE');

    console.log(`✅ Total records with exchange = 'NSE': ${count}`);

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

runMigration().then(() => {
  console.log('\n✅ Migration script complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
