const fetch = require('node-fetch');

const EODHD_API_KEY = '68e0b753e65b93.29539535';

async function testEODHDAPI() {
  console.log('Testing EODHD API Access\n');
  console.log('='.repeat(50) + '\n');

  // Test different API endpoint formats
  const testUrls = [
    // Try different formats
    `https://eodhd.com/api/fundamentals/AAPL.US?api_token=${EODHD_API_KEY}&fmt=json`,
    `https://eodhistoricaldata.com/api/fundamentals/AAPL.US?api_token=${EODHD_API_KEY}&fmt=json`,
    `https://eodhd.com/api/real-time/AAPL.US?api_token=${EODHD_API_KEY}&fmt=json`,
    `https://eodhistoricaldata.com/api/real-time/AAPL.US?api_token=${EODHD_API_KEY}&fmt=json`,

    // Try without .US suffix
    `https://eodhd.com/api/fundamentals/AAPL?api_token=${EODHD_API_KEY}&fmt=json`,
    `https://eodhistoricaldata.com/api/fundamentals/AAPL?api_token=${EODHD_API_KEY}&fmt=json`,
  ];

  for (const url of testUrls) {
    console.log(`Testing: ${url.split('?')[0]}`);

    try {
      const response = await fetch(url);
      console.log(`  Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS! Data received`);
        if (data?.General) {
          console.log(`  Company: ${data.General.Name}`);
          console.log(`  Sector: ${data.General.Sector}`);
          console.log(`  Market Cap: ${data.General.MarketCapitalization}`);
        }
        break; // Stop on first success
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Error response: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
    }

    console.log();
  }

  // Also test if the API key works with a simple endpoint
  console.log('\nTesting basic API access:');
  console.log('-'.repeat(40));

  const basicUrl = `https://eodhistoricaldata.com/api/exchanges-list/?api_token=${EODHD_API_KEY}&fmt=json`;

  try {
    const response = await fetch(basicUrl);
    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid - exchanges list retrieved');
      console.log(`Found ${data.length} exchanges`);
    } else {
      console.log('❌ API Key might be invalid or restricted');
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

testEODHDAPI().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});