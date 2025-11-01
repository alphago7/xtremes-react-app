const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSymbolFunctions() {
  console.log('Searching for symbol and EODHD related functions...\n');

  // List of potential function names
  const functionNames = [
    // Symbol update functions
    'update_symbol_fundamentals',
    'update_symbol_metadata',
    'enrich_symbols',
    'sync_symbol_data',
    'update_symbols',
    'update_market_cap',

    // EODHD specific
    'fetch_eodhd_data',
    'fetch_eodhd_fundamentals',
    'sync_eodhd_symbols',
    'update_from_eodhd',
    'eodhd_update_symbols',

    // Fetch functions
    'fetch_symbol_data',
    'fetch_fundamentals',
    'fetch_market_data',
    'get_symbol_info',

    // Edge function related
    'call_edge_function',
    'trigger_symbol_update',
    'update_symbol_from_api'
  ];

  console.log('Testing RPC functions:');
  console.log('======================\n');

  for (const funcName of functionNames) {
    try {
      const { data, error } = await supabase.rpc(funcName, {});

      if (!error) {
        console.log(`✅ FOUND: ${funcName} - Works without parameters`);
        if (data) {
          console.log(`   Returns: ${typeof data}`);
        }
      } else if (error.message.includes('parameter') ||
                 error.message.includes('argument') ||
                 error.message.includes('required')) {
        console.log(`✅ FOUND: ${funcName} - Requires parameters`);
        console.log(`   Error hint: ${error.message}`);
      } else if (!error.message.includes('does not exist')) {
        console.log(`⚠️  FOUND: ${funcName} - Other error`);
        console.log(`   Error: ${error.message}`);
      }
    } catch (e) {
      if (e.message.includes('parameter') ||
          e.message.includes('argument') ||
          e.message.includes('required')) {
        console.log(`✅ FOUND: ${funcName} - Requires parameters`);
        console.log(`   Error hint: ${e.message}`);
      } else if (!e.message.includes('does not exist')) {
        console.log(`⚠️  Possible: ${funcName}`);
        console.log(`   Error: ${e.message}`);
      }
    }
  }

  // Test Edge Functions endpoint
  console.log('\n\nChecking Edge Functions:');
  console.log('========================\n');

  try {
    // Edge functions are typically called via different endpoints
    const edgeFunctionNames = [
      'update-symbols',
      'fetch-fundamentals',
      'sync-eodhd',
      'update-market-data',
      'enrich-symbols'
    ];

    console.log('Note: Edge functions are typically at:');
    console.log('https://mximklnchreklbjzedyg.supabase.co/functions/v1/{function-name}\n');

    for (const funcName of edgeFunctionNames) {
      console.log(`Potential edge function: /functions/v1/${funcName}`);
    }
  } catch (e) {
    console.error('Error checking edge functions:', e.message);
  }

  // Check if there's a way to list all functions
  console.log('\n\nTrying to list all database functions:');
  console.log('======================================\n');

  try {
    // Try querying information schema
    const { data: funcs, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION');

    if (funcs && funcs.length > 0) {
      console.log('Database functions found:');
      funcs.forEach(f => {
        console.log(`  - ${f.routine_name}`);
      });
    }
  } catch (e) {
    // May not have access to information schema
    console.log('Cannot access information_schema.routines');
  }

  // Try the functions we already know exist
  console.log('\n\nKnown working functions:');
  console.log('========================\n');

  const knownFunctions = [
    'get_top_indicators',
    'get_symbol_timeseries',
    'search_symbols',
    'get_indicator_distribution',
    'get_scatter_xy'
  ];

  for (const func of knownFunctions) {
    console.log(`- ${func}`);
  }
}

findSymbolFunctions().then(() => {
  console.log('\n✅ Search complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});