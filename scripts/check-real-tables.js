const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealTables() {
  console.log('Checking actual database schema...\n');

  // Try to query PostgreSQL information schema directly
  let schemaData = null;
  let schemaError = null;
  try {
    const result = await supabase.rpc('get_database_schema', {});
    schemaData = result.data;
    schemaError = result.error;
  } catch (e) {
    schemaError = 'Function not found';
  }

  if (schemaError) {
    console.log('Cannot query schema directly, trying alternative approach...\n');

    // Try various table name patterns
    const possibleTableNames = [
      'symbols',
      'stock_prices',
      'daily_prices',
      'price_data',
      'ohlcv',
      'market_data',
      'indicators',
      'technical_indicators',
      'ta_indicators',
      'indicator_values',
      'extreme_scores',
      'rankings',
      'top_movers',
      'watchlists',
      'alerts',
      'users',
      'nse_fo',
      'nifty50',
      'nifty100'
    ];

    console.log('Testing possible table names...\n');
    for (const tableName of possibleTableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`✓ Table '${tableName}' exists (count query succeeded)`);

          // Get column info
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (sampleData && sampleData.length > 0) {
            const columns = Object.keys(sampleData[0]);
            console.log(`  Columns: ${columns.join(', ')}`);

            // Show sample values for key columns
            const keyColumns = columns.filter(col =>
              col.includes('date') ||
              col.includes('symbol') ||
              col.includes('ticker') ||
              col.includes('indicator') ||
              col.includes('rsi') ||
              col.includes('adx')
            );

            if (keyColumns.length > 0) {
              const sample = {};
              keyColumns.forEach(col => {
                sample[col] = sampleData[0][col];
              });
              console.log(`  Sample values:`, sample);
            }
          }
          console.log('');
        }
      } catch (e) {
        // Silent fail - table doesn't exist
      }
    }

    // Check for any Edge Functions
    console.log('\nChecking for Edge Functions...');
    const possibleFunctions = [
      'get_extremes',
      'get_indicators',
      'get_stock_data',
      'get_market_data',
      'fetch_indicators',
      'calculate_extremes'
    ];

    for (const funcName of possibleFunctions) {
      try {
        const { error } = await supabase.rpc(funcName, {});
        if (!error || error.message.includes('parameter') || error.message.includes('argument')) {
          console.log(`✓ Function '${funcName}' might exist`);
        }
      } catch (e) {
        // Silent fail
      }
    }
  }

  // Try to get actual function list with SQL
  console.log('\nTrying to list actual functions via SQL...');
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'"
    });

    if (data) {
      console.log('Available functions:', data);
    }
  } catch (e) {
    console.log('Cannot query functions directly');
  }
}

checkRealTables().then(() => {
  console.log('\nCheck complete.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});