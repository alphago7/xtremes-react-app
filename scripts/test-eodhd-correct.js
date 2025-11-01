const fetch = require('node-fetch');

const EODHD_API_KEY = '68e0b753e65b93.29539535';

async function testEODHDAPI() {
  console.log('Testing EODHD API with correct endpoint format\n');
  console.log('='.repeat(50) + '\n');

  // Test with the format provided by user
  const testUrls = [
    // Test with demo token first (as provided by user)
    `https://eodhd.com/api/fundamentals/AAPL.US?order=d&from=2025-09-01&to=2025-11-01&api_token=demo&fmt=json`,

    // Test with our API key
    `https://eodhd.com/api/fundamentals/AAPL.US?api_token=${EODHD_API_KEY}&fmt=json`,

    // Test without date range
    `https://eodhd.com/api/fundamentals/AAPL.US?api_token=demo&fmt=json`,
  ];

  for (const url of testUrls) {
    const urlParts = url.split('?');
    const params = new URLSearchParams(urlParts[1]);
    const token = params.get('api_token');

    console.log(`Testing: ${urlParts[0]}`);
    console.log(`  Token: ${token === 'demo' ? 'demo' : token?.substring(0, 10) + '...'}`);

    try {
      const response = await fetch(url);
      console.log(`  Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS! Data received`);

        // Check what type of data we got
        if (data?.General) {
          console.log(`  Data type: Fundamentals`);
          console.log(`  Company: ${data.General.Name}`);
          console.log(`  Sector: ${data.General.Sector}`);
          console.log(`  Industry: ${data.General.Industry}`);
          console.log(`  Market Cap: ${data.General.MarketCapitalization}`);
          console.log(`  Exchange: ${data.General.Exchange}`);
        } else if (Array.isArray(data)) {
          console.log(`  Data type: Historical data (${data.length} records)`);
        } else {
          console.log(`  Data structure:`, Object.keys(data).slice(0, 10));
        }
        console.log();
        return data; // Return on first success
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Error: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
    }

    console.log();
  }

  return null;
}

testEODHDAPI().then((data) => {
  if (data) {
    console.log('✅ Successfully connected to EODHD API');

    // If we got fundamentals data, show more details
    if (data?.General) {
      console.log('\nAdditional data available:');
      console.log('- Highlights:', data.Highlights ? '✓' : '✗');
      console.log('- Valuation:', data.Valuation ? '✓' : '✗');
      console.log('- SharesStats:', data.SharesStats ? '✓' : '✗');
      console.log('- Technicals:', data.Technicals ? '✓' : '✗');
      console.log('- SplitsDividends:', data.SplitsDividends ? '✓' : '✗');
      console.log('- Earnings:', data.Earnings ? '✓' : '✗');
      console.log('- Financials:', data.Financials ? '✓' : '✗');
    }
  } else {
    console.log('❌ Could not connect to EODHD API');
  }

  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});