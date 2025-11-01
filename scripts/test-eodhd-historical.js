const fetch = require('node-fetch');

const EODHD_API_KEY = '68e0b753e65b93.29539535';

async function testHistoricalPrices() {
  console.log('Testing EODHD Historical Prices API\n');
  console.log('='.repeat(50) + '\n');

  // Calculate date range - last 250 trading days (roughly 1 year)
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 365); // Go back 365 days to ensure we get 250 trading days

  const toDate = today.toISOString().split('T')[0];
  const from = fromDate.toISOString().split('T')[0];

  console.log(`Date range: ${from} to ${toDate}\n`);

  // Test with AAPL
  const url = `https://eodhd.com/api/eod/AAPL.US?api_token=${EODHD_API_KEY}&from=${from}&to=${toDate}&fmt=json`;

  console.log('Testing with AAPL.US...\n');

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ SUCCESS! Received ${data.length} trading days of data\n`);

      // Show first few records
      console.log('Sample data (first 3 records):');
      console.log('-'.repeat(50));
      data.slice(0, 3).forEach(record => {
        console.log(`Date: ${record.date}`);
        console.log(`  Open: ${record.open}`);
        console.log(`  High: ${record.high}`);
        console.log(`  Low: ${record.low}`);
        console.log(`  Close: ${record.close}`);
        console.log(`  Volume: ${record.volume}`);
        console.log(`  Adjusted Close: ${record.adjusted_close || 'N/A'}`);
        console.log();
      });

      // Show last record
      console.log('Last record:');
      console.log('-'.repeat(50));
      const lastRecord = data[data.length - 1];
      console.log(`Date: ${lastRecord.date}`);
      console.log(`  Open: ${lastRecord.open}`);
      console.log(`  High: ${lastRecord.high}`);
      console.log(`  Low: ${lastRecord.low}`);
      console.log(`  Close: ${lastRecord.close}`);
      console.log(`  Volume: ${lastRecord.volume}`);

      console.log('\n✅ API endpoint confirmed working!');
      console.log(`\nURL format: https://eodhd.com/api/eod/{SYMBOL}.{EXCHANGE}?api_token=...&from=...&to=...&fmt=json`);

    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testHistoricalPrices().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
