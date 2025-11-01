const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log('Inspecting table structures...\n');

  // Get sample data from key tables
  const tables = [
    'symbols',
    'ohlc_daily',
    'indicators_daily',
    'extreme_ranks'
  ];

  for (const table of tables) {
    console.log(`\n=== ${table.toUpperCase()} ===`);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(2);

      if (error) {
        console.log(`Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Sample data:');
        console.log(JSON.stringify(data, null, 2));
        console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log('No data found');
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  // Test RPC functions with parameters
  console.log('\n\n=== TESTING RPC FUNCTIONS ===');

  // Test get_top_indicators
  try {
    console.log('\nTesting get_top_indicators...');
    const { data, error } = await supabase.rpc('get_top_indicators', {
      p_date: '2025-01-17',
      p_indicator: 'rsi',
      p_universe: 'NSE_FO',
      p_limit: 5
    });

    if (error) {
      console.log(`Error: ${error.message}`);
    } else {
      console.log(`Found ${data?.length || 0} results`);
      if (data && data.length > 0) {
        console.log('Sample result:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Test search_symbols
  try {
    console.log('\nTesting search_symbols...');
    const { data, error } = await supabase.rpc('search_symbols', {
      p_query: 'TCS',
      p_limit: 3
    });

    if (error) {
      console.log(`Error: ${error.message}`);
    } else {
      console.log(`Found ${data?.length || 0} results`);
      if (data && data.length > 0) {
        console.log('Results:', data.map(d => `${d.ticker} - ${d.company_name}`).join('\n'));
      }
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Check for available dates
  try {
    console.log('\n\n=== AVAILABLE DATES ===');
    const { data, error } = await supabase
      .from('extreme_ranks')
      .select('date')
      .order('date', { ascending: false })
      .limit(10);

    if (!error && data) {
      console.log('Recent dates with data:', data.map(d => d.date).join(', '));
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Check available indicators
  try {
    console.log('\n=== AVAILABLE INDICATORS ===');
    const { data, error } = await supabase
      .from('extreme_ranks')
      .select('indicator')
      .limit(100);

    if (!error && data) {
      const uniqueIndicators = [...new Set(data.map(d => d.indicator))];
      console.log('Available indicators:', uniqueIndicators.join(', '));
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

inspectTables().then(() => {
  console.log('\n\nInspection complete.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});