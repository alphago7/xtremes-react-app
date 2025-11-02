const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRankCalculation() {
  console.log('Starting indicator rank calculation...\n');
  console.log('='.repeat(60));

  try {
    // Calculate ranks for NSE stock_indicators
    console.log('\n📊 Calculating ranks for stock_indicators (NSE)...');
    const startNSE = Date.now();

    const { error: nseError } = await supabase
      .rpc('calculate_indicator_ranks', { table_name: 'stock_indicators' });

    if (nseError) {
      console.error('❌ NSE Error:', nseError.message);
      throw nseError;
    }

    const nseTime = ((Date.now() - startNSE) / 1000).toFixed(2);
    console.log(`✅ NSE ranks calculated in ${nseTime}s`);

    // Calculate ranks for US stock_indicators_us
    console.log('\n📊 Calculating ranks for stock_indicators_us (US)...');
    const startUS = Date.now();

    const { error: usError } = await supabase
      .rpc('calculate_indicator_ranks', { table_name: 'stock_indicators_us' });

    if (usError) {
      console.error('❌ US Error:', usError.message);
      throw usError;
    }

    const usTime = ((Date.now() - startUS) / 1000).toFixed(2);
    console.log(`✅ US ranks calculated in ${usTime}s`);

    // Verify rankings
    console.log('\n📋 Verifying rankings...\n');

    const { data: nseVerify } = await supabase
      .from('stock_indicators')
      .select('symbol, exchange, rsi_14_value, rsi_14_rank, adx_14_value, adx_14_rank')
      .eq('exchange', 'NSE')
      .not('rsi_14_rank', 'is', null)
      .order('rsi_14_rank')
      .limit(5);

    if (nseVerify && nseVerify.length > 0) {
      console.log('Top 5 NSE stocks by RSI rank:');
      nseVerify.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.symbol.padEnd(12)} | RSI: ${s.rsi_14_value?.toFixed(1) || 'N/A'} (Rank ${s.rsi_14_rank})`);
      });
    }

    const { data: usVerify } = await supabase
      .from('stock_indicators_us')
      .select('symbol, exchange, rsi_14_value, rsi_14_rank, adx_14_value, adx_14_rank')
      .eq('exchange', 'US')
      .not('rsi_14_rank', 'is', null)
      .order('rsi_14_rank')
      .limit(5);

    if (usVerify && usVerify.length > 0) {
      console.log('\nTop 5 US stocks by RSI rank:');
      usVerify.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.symbol.padEnd(12)} | RSI: ${s.rsi_14_value?.toFixed(1) || 'N/A'} (Rank ${s.rsi_14_rank})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All ranks updated successfully');
    console.log(`⏱️  Total time: ${((Date.now() - (startNSE - (Date.now() - startNSE))) / 1000).toFixed(2)}s`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

runRankCalculation().then(() => {
  console.log('\n✅ Rank calculation complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
