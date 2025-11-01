const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataFetch() {
  console.log('Testing data fetch from stock_indicators...\n');

  try {
    // Fetch all data from stock_indicators
    const { data, error } = await supabase
      .from('stock_indicators')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${data?.length || 0} records\n`);

    // Get top RSI values
    console.log('=== TOP RSI VALUES ===');
    const { data: rsiData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, rsi_14_value, rsi_14_extreme')
      .order('rsi_14_value', { ascending: false })
      .limit(5);

    rsiData?.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.symbol}: RSI=${item.rsi_14_value?.toFixed(2)} (${item.rsi_14_extreme || 'normal'})`);
    });

    // Get top ADX values
    console.log('\n=== TOP ADX VALUES ===');
    const { data: adxData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, adx_14_value, adx_14_extreme')
      .order('adx_14_value', { ascending: false })
      .limit(5);

    adxData?.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.symbol}: ADX=${item.adx_14_value?.toFixed(2)} (${item.adx_14_extreme || 'normal'})`);
    });

    // Get top MACD z-scores
    console.log('\n=== TOP MACD Z-SCORES ===');
    const { data: macdData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, macd_value, macd_z_score, macd_extreme')
      .order('macd_z_score', { ascending: false })
      .limit(5);

    macdData?.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.symbol}: MACD Z-Score=${item.macd_z_score?.toFixed(3)} (${item.macd_extreme || 'normal'})`);
    });

    // Get top Bollinger z-scores
    console.log('\n=== TOP BOLLINGER Z-SCORES ===');
    const { data: bollingerData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, bollinger_z_value, bollinger_z_score, bollinger_z_extreme')
      .order('bollinger_z_score', { ascending: false })
      .limit(5);

    bollingerData?.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.symbol}: BB Z-Score=${item.bollinger_z_score?.toFixed(3)} (${item.bollinger_z_extreme || 'normal'})`);
    });

    // Get top CMF values
    console.log('\n=== TOP CMF VALUES ===');
    const { data: cmfData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, cmf_20_value, cmf_20_extreme')
      .order('cmf_20_value', { ascending: false })
      .limit(5);

    cmfData?.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.symbol}: CMF=${item.cmf_20_value?.toFixed(3)} (${item.cmf_20_extreme || 'normal'})`);
    });

    // Get oversold RSI (lowest values)
    console.log('\n=== OVERSOLD RSI (LOWEST VALUES) ===');
    const { data: oversoldData } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, rsi_14_value, rsi_14_extreme')
      .order('rsi_14_value', { ascending: true })
      .limit(5);

    oversoldData?.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.symbol}: RSI=${item.rsi_14_value?.toFixed(2)} (${item.rsi_14_extreme || 'normal'})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testDataFetch();