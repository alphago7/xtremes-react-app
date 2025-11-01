const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

// EODHD API Key from env
const EODHD_API = '68e0b753e65b93.29539535';

async function testSymbolFunctions() {
  console.log('Testing Symbol Update Functions with Parameters\n');
  console.log('=' .repeat(50) + '\n');

  // Test update_symbol_fundamentals
  console.log('1. Testing update_symbol_fundamentals:');
  console.log('-'.repeat(40));
  try {
    // Try with a test symbol
    const { data, error } = await supabase.rpc('update_symbol_fundamentals', {
      symbol: 'AAPL',
      exchange: 'US'
    });
    if (!error) {
      console.log('✅ Success with basic params');
      console.log('   Result:', data);
    } else {
      console.log('❌ Failed with basic params:', error.message);

      // Try with API key
      const { data: data2, error: error2 } = await supabase.rpc('update_symbol_fundamentals', {
        symbol: 'AAPL',
        exchange: 'US',
        api_key: EODHD_API
      });

      if (!error2) {
        console.log('✅ Success with API key');
        console.log('   Result:', data2);
      } else {
        console.log('❌ Failed with API key:', error2.message);
      }
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test fetch_eodhd_fundamentals
  console.log('\n2. Testing fetch_eodhd_fundamentals:');
  console.log('-'.repeat(40));
  try {
    const { data, error } = await supabase.rpc('fetch_eodhd_fundamentals', {
      ticker: 'AAPL',
      exchange: 'US'
    });

    if (!error) {
      console.log('✅ Success');
      console.log('   Data structure:', Object.keys(data || {}).slice(0, 10));
    } else {
      console.log('❌ Error:', error.message);

      // Try with different params
      const { data: data2, error: error2 } = await supabase.rpc('fetch_eodhd_fundamentals', {
        symbol: 'AAPL.US'
      });

      if (!error2) {
        console.log('✅ Success with symbol param');
        console.log('   Data:', data2);
      }
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test enrich_symbols
  console.log('\n3. Testing enrich_symbols:');
  console.log('-'.repeat(40));
  try {
    // Try to enrich US symbols
    const { data, error } = await supabase.rpc('enrich_symbols', {
      exchange_filter: 'US'
    });

    if (!error) {
      console.log('✅ Success with exchange filter');
      console.log('   Result:', data);
    } else {
      console.log('❌ Error with exchange filter:', error.message);

      // Try without params
      const { data: data2, error: error2 } = await supabase.rpc('enrich_symbols', {});

      if (!error2) {
        console.log('✅ Success without params');
        console.log('   Result:', data2);
      } else {
        console.log('❌ Error without params:', error2.message);
      }
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test fetch_fundamentals
  console.log('\n4. Testing fetch_fundamentals:');
  console.log('-'.repeat(40));
  try {
    const { data, error } = await supabase.rpc('fetch_fundamentals', {
      ticker: 'AAPL',
      exchange: 'US'
    });

    if (!error) {
      console.log('✅ Success');
      if (data) {
        console.log('   Data keys:', Object.keys(data).slice(0, 10));
        if (data.General) {
          console.log('   General info:', {
            Sector: data.General?.Sector,
            Industry: data.General?.Industry,
            MarketCapitalization: data.General?.MarketCapitalization
          });
        }
      }
    } else {
      console.log('❌ Error:', error.message);
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // Test Edge Function
  console.log('\n5. Testing Edge Function (HTTP):');
  console.log('-'.repeat(40));
  try {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/enrich-symbols`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exchange: 'US',
        limit: 5
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Edge function success');
      console.log('   Response:', data);
    } else {
      console.log('❌ Edge function failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }
  } catch (e) {
    console.log('   Error calling edge function:', e.message);
  }

  // Test if we can directly update a symbol
  console.log('\n6. Testing direct symbol update:');
  console.log('-'.repeat(40));

  try {
    // First get Apple's current data
    const { data: currentData } = await supabase
      .from('symbols')
      .select('*')
      .eq('ticker', 'AAPL')
      .eq('exchange', 'US')
      .single();

    console.log('Current AAPL data:');
    console.log('  Sector:', currentData?.sector || 'null');
    console.log('  Market Cap:', currentData?.market_cap || 'null');
    console.log('  Industry:', currentData?.industry || 'null');
  } catch (e) {
    console.log('Error fetching current data:', e.message);
  }
}

testSymbolFunctions().then(() => {
  console.log('\n✅ Testing complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});