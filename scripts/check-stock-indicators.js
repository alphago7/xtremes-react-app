const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStockIndicators() {
  console.log('Examining stock_indicators table...\n');

  try {
    // Get table structure
    const { data: sampleData, error } = await supabase
      .from('stock_indicators')
      .select('*')
      .limit(5);

    if (error) {
      console.log('Error accessing stock_indicators:', error.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✓ Table stock_indicators exists\n');
      console.log('Columns:', Object.keys(sampleData[0]).join(', '), '\n');

      // Show sample data
      console.log('Sample data (first record):');
      console.log(JSON.stringify(sampleData[0], null, 2));

      // Get unique dates
      const { data: dates } = await supabase
        .from('stock_indicators')
        .select('date')
        .order('date', { ascending: false })
        .limit(10);

      if (dates && dates.length > 0) {
        const uniqueDates = [...new Set(dates.map(d => d.date))];
        console.log('\nRecent dates with data:', uniqueDates.join(', '));
      }

      // Get unique symbols/tickers
      const { data: symbols } = await supabase
        .from('stock_indicators')
        .select('ticker')
        .limit(100);

      if (symbols && symbols.length > 0) {
        const uniqueSymbols = [...new Set(symbols.map(s => s.ticker))].slice(0, 10);
        console.log('\nSample tickers:', uniqueSymbols.join(', '));
      }

      // Count total records
      const { count } = await supabase
        .from('stock_indicators')
        .select('*', { count: 'exact', head: true });

      console.log('\nTotal records in stock_indicators:', count);

      // Check for specific indicators columns
      const indicatorColumns = Object.keys(sampleData[0]).filter(col =>
        col.includes('rsi') ||
        col.includes('adx') ||
        col.includes('bb') ||
        col.includes('macd') ||
        col.includes('cmf') ||
        col.includes('obv') ||
        col.includes('atr') ||
        col.includes('ema') ||
        col.includes('sma')
      );

      console.log('\nIndicator columns found:', indicatorColumns.join(', '));

      // Try to get extreme values for RSI
      if (indicatorColumns.some(col => col.includes('rsi'))) {
        const rsiCol = indicatorColumns.find(col => col.includes('rsi'));
        const latestDate = dates[0]?.date;

        if (latestDate) {
          const { data: extremeRsi } = await supabase
            .from('stock_indicators')
            .select(`ticker, ${rsiCol}`)
            .eq('date', latestDate)
            .order(rsiCol, { ascending: false })
            .limit(5);

          if (extremeRsi) {
            console.log(`\nTop 5 highest ${rsiCol} values for ${latestDate}:`);
            extremeRsi.forEach(row => {
              console.log(`  ${row.ticker}: ${row[rsiCol]}`);
            });
          }
        }
      }
    } else {
      console.log('No data found in stock_indicators table');
    }

    // Check related tables
    console.log('\n\n=== CHECKING RELATED TABLES ===');

    const relatedTables = [
      'symbols',
      'watchlists',
      'alerts',
      'chart_layouts'
    ];

    for (const table of relatedTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`✓ Table '${table}' exists (${count || 0} records)`);
      } else {
        console.log(`✗ Table '${table}' not accessible`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStockIndicators().then(() => {
  console.log('\n\nAnalysis complete.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});