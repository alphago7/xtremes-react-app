const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mximklnchreklbjzedyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aW1rbG5jaHJla2xianplZHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2OTg4MywiZXhwIjoyMDc2MDQ1ODgzfQ.Xz7nvRbfgs8Vcg1J8kaKeMTBiLVT5rpq3akCLlmVHlA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testValidData() {
  console.log('Finding stocks with valid indicator values...\n');

  try {
    // Get top RSI values (non-null)
    console.log('=== TOP RSI VALUES (OVERBOUGHT) ===');
    const { data: rsiHigh } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, rsi_14_value, rsi_14_extreme')
      .not('rsi_14_value', 'is', null)
      .order('rsi_14_value', { ascending: false })
      .limit(5);

    if (rsiHigh && rsiHigh.length > 0) {
      rsiHigh.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: RSI=${item.rsi_14_value?.toFixed(2)} (${item.rsi_14_extreme || 'normal'})`);
      });
    } else {
      console.log('No data found');
    }

    // Get low RSI values (oversold)
    console.log('\n=== BOTTOM RSI VALUES (OVERSOLD) ===');
    const { data: rsiLow } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, rsi_14_value, rsi_14_extreme')
      .not('rsi_14_value', 'is', null)
      .order('rsi_14_value', { ascending: true })
      .limit(5);

    if (rsiLow && rsiLow.length > 0) {
      rsiLow.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: RSI=${item.rsi_14_value?.toFixed(2)} (${item.rsi_14_extreme || 'normal'})`);
      });
    }

    // Get top ADX values (strong trends)
    console.log('\n=== TOP ADX VALUES (STRONG TREND) ===');
    const { data: adxHigh } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, adx_14_value, adx_14_extreme')
      .not('adx_14_value', 'is', null)
      .order('adx_14_value', { ascending: false })
      .limit(5);

    if (adxHigh && adxHigh.length > 0) {
      adxHigh.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: ADX=${item.adx_14_value?.toFixed(2)} (${item.adx_14_extreme || 'normal'})`);
      });
    }

    // Get extreme MACD z-scores (both high and low)
    console.log('\n=== TOP MACD Z-SCORES (POSITIVE EXTREME) ===');
    const { data: macdHigh } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, macd_value, macd_z_score, macd_extreme')
      .not('macd_z_score', 'is', null)
      .order('macd_z_score', { ascending: false })
      .limit(5);

    if (macdHigh && macdHigh.length > 0) {
      macdHigh.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: MACD Z-Score=${item.macd_z_score?.toFixed(3)} (${item.macd_extreme || 'normal'})`);
      });
    }

    console.log('\n=== BOTTOM MACD Z-SCORES (NEGATIVE EXTREME) ===');
    const { data: macdLow } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, macd_value, macd_z_score, macd_extreme')
      .not('macd_z_score', 'is', null)
      .order('macd_z_score', { ascending: true })
      .limit(5);

    if (macdLow && macdLow.length > 0) {
      macdLow.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: MACD Z-Score=${item.macd_z_score?.toFixed(3)} (${item.macd_extreme || 'normal'})`);
      });
    }

    // Get extreme Bollinger z-scores
    console.log('\n=== TOP BOLLINGER Z-SCORES (UPPER EXTREME) ===');
    const { data: bollHigh } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, bollinger_z_value, bollinger_z_score, bollinger_z_extreme')
      .not('bollinger_z_score', 'is', null)
      .order('bollinger_z_score', { ascending: false })
      .limit(5);

    if (bollHigh && bollHigh.length > 0) {
      bollHigh.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: BB Z-Score=${item.bollinger_z_score?.toFixed(3)} (${item.bollinger_z_extreme || 'normal'})`);
      });
    }

    console.log('\n=== BOTTOM BOLLINGER Z-SCORES (LOWER EXTREME) ===');
    const { data: bollLow } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, bollinger_z_value, bollinger_z_score, bollinger_z_extreme')
      .not('bollinger_z_score', 'is', null)
      .order('bollinger_z_score', { ascending: true })
      .limit(5);

    if (bollLow && bollLow.length > 0) {
      bollLow.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: BB Z-Score=${item.bollinger_z_score?.toFixed(3)} (${item.bollinger_z_extreme || 'normal'})`);
      });
    }

    // Get CMF values
    console.log('\n=== TOP CMF VALUES (MONEY FLOW IN) ===');
    const { data: cmfHigh } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, cmf_20_value, cmf_20_extreme')
      .not('cmf_20_value', 'is', null)
      .order('cmf_20_value', { ascending: false })
      .limit(5);

    if (cmfHigh && cmfHigh.length > 0) {
      cmfHigh.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: CMF=${item.cmf_20_value?.toFixed(3)} (${item.cmf_20_extreme || 'normal'})`);
      });
    }

    console.log('\n=== BOTTOM CMF VALUES (MONEY FLOW OUT) ===');
    const { data: cmfLow } = await supabase
      .from('stock_indicators')
      .select('symbol, company_name, cmf_20_value, cmf_20_extreme')
      .not('cmf_20_value', 'is', null)
      .order('cmf_20_value', { ascending: true })
      .limit(5);

    if (cmfLow && cmfLow.length > 0) {
      cmfLow.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.symbol}: CMF=${item.cmf_20_value?.toFixed(3)} (${item.cmf_20_extreme || 'normal'})`);
      });
    }

    // Get count of non-null values for each indicator
    console.log('\n=== DATA AVAILABILITY SUMMARY ===');
    const { count: rsiCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .not('rsi_14_value', 'is', null);

    const { count: adxCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .not('adx_14_value', 'is', null);

    const { count: macdCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .not('macd_z_score', 'is', null);

    const { count: bollCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .not('bollinger_z_score', 'is', null);

    const { count: cmfCount } = await supabase
      .from('stock_indicators')
      .select('*', { count: 'exact', head: true })
      .not('cmf_20_value', 'is', null);

    console.log(`Stocks with RSI data: ${rsiCount || 0}`);
    console.log(`Stocks with ADX data: ${adxCount || 0}`);
    console.log(`Stocks with MACD data: ${macdCount || 0}`);
    console.log(`Stocks with Bollinger data: ${bollCount || 0}`);
    console.log(`Stocks with CMF data: ${cmfCount || 0}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testValidData();