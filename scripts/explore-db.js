const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreTables() {
  console.log('Exploring Supabase database...\n');

  try {
    // Get list of tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      // Try alternative approach
      console.log('Trying alternative approach to list tables...');

      // Try known table names from the project instructions
      const knownTables = [
        'symbols',
        'ohlc_daily',
        'indicators_daily',
        'extreme_ranks',
        'watchlists',
        'watchlist_items',
        'alerts',
        'chart_layouts'
      ];

      for (const tableName of knownTables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            console.log(`✓ Table '${tableName}' exists`);

            // Get sample data
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);

            if (sample && sample.length > 0) {
              console.log(`  Columns: ${Object.keys(sample[0]).join(', ')}`);
            }
          } else {
            console.log(`✗ Table '${tableName}' not found or inaccessible`);
          }
        } catch (e) {
          console.log(`✗ Error checking table '${tableName}': ${e.message}`);
        }
      }

      // Check for views
      console.log('\nChecking for views...');
      const viewNames = ['v_top_extremes'];
      for (const viewName of viewNames) {
        try {
          const { data, error } = await supabase
            .from(viewName)
            .select('*')
            .limit(1);

          if (!error) {
            console.log(`✓ View '${viewName}' exists`);
            if (data && data.length > 0) {
              console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
            }
          } else {
            console.log(`✗ View '${viewName}' not found`);
          }
        } catch (e) {
          console.log(`✗ Error checking view '${viewName}': ${e.message}`);
        }
      }

      // Check for RPC functions
      console.log('\nChecking for RPC functions...');
      const rpcFunctions = [
        'get_top_indicators',
        'get_symbol_timeseries',
        'search_symbols',
        'get_indicator_distribution',
        'get_scatter_xy'
      ];

      for (const funcName of rpcFunctions) {
        try {
          // Test with minimal parameters
          const { data, error } = await supabase.rpc(funcName, {});
          if (!error || error.message.includes('parameter')) {
            console.log(`✓ RPC function '${funcName}' exists`);
          } else {
            console.log(`✗ RPC function '${funcName}' not found`);
          }
        } catch (e) {
          if (e.message.includes('parameter') || e.message.includes('argument')) {
            console.log(`✓ RPC function '${funcName}' exists (requires parameters)`);
          } else {
            console.log(`✗ Error checking RPC '${funcName}': ${e.message}`);
          }
        }
      }
    } else {
      console.log('Tables found:', tables);
    }

  } catch (error) {
    console.error('Error exploring database:', error.message);
  }
}

exploreTables().then(() => {
  console.log('\nDatabase exploration complete.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});