# Automating Indicator Rank Calculations

## Best Approaches (Ranked by Recommendation)

### ⭐ Option 1: Supabase Edge Function + Scheduled Invocation (RECOMMENDED)

**Pros:**
- Clean separation of concerns
- Easy to monitor and debug
- Can run at optimal times (after market close)
- No database load during trading hours
- Can add notifications on completion

**Setup:**

1. Create edge function `supabase/functions/calculate-ranks/index.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Call the Postgres function
  const { data: nseData, error: nseError } = await supabaseClient
    .rpc('calculate_indicator_ranks', { table_name: 'stock_indicators' })

  const { data: usData, error: usError } = await supabaseClient
    .rpc('calculate_indicator_ranks', { table_name: 'stock_indicators_us' })

  return new Response(
    JSON.stringify({
      success: !nseError && !usError,
      nse: nseData,
      us: usData,
      timestamp: new Date().toISOString()
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

2. Deploy: `supabase functions deploy calculate-ranks`

3. Schedule in Supabase Dashboard → Database → Cron Jobs:
```sql
SELECT cron.schedule(
  'daily-rank-calculation',
  '0 18 * * *', -- 6 PM UTC daily
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/calculate-ranks',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
  $$
);
```

---

### Option 2: Direct pg_cron Schedule (Simple but requires pg_cron extension)

**Setup:**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 6 PM
SELECT cron.schedule(
  'calculate-indicator-ranks',
  '0 18 * * *',
  $$
    SELECT calculate_indicator_ranks('stock_indicators');
    SELECT calculate_indicator_ranks('stock_indicators_us');
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule if needed
SELECT cron.unschedule('calculate-indicator-ranks');
```

**Pros:**
- Very simple
- No external dependencies

**Cons:**
- Requires pg_cron extension (check if enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron'`)
- Less visibility into execution

---

### Option 3: Node.js Script + System Cron (For local/server control)

**Create:** `scripts/run-rank-calculation.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runRankCalculation() {
  console.log('Starting rank calculation...');

  try {
    // Call the Postgres function for both tables
    const { error: nseError } = await supabase
      .rpc('calculate_indicator_ranks', { table_name: 'stock_indicators' });

    if (nseError) throw nseError;
    console.log('✅ NSE ranks calculated');

    const { error: usError } = await supabase
      .rpc('calculate_indicator_ranks', { table_name: 'stock_indicators_us' });

    if (usError) throw usError;
    console.log('✅ US ranks calculated');

    console.log('✅ All ranks updated successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runRankCalculation();
```

**Schedule with cron** (on your server):
```bash
# Edit crontab
crontab -e

# Add: Run daily at 6 PM
0 18 * * * cd /path/to/project && node scripts/run-rank-calculation.js
```

---

### Option 4: Real-time Materialized View (Advanced)

Create a materialized view with ranks that refreshes automatically:

```sql
CREATE MATERIALIZED VIEW stock_indicators_with_ranks AS
SELECT
  si.*,
  ROW_NUMBER() OVER (PARTITION BY si.exchange ORDER BY rsi_14_value DESC NULLS LAST) as rsi_14_rank,
  ROW_NUMBER() OVER (PARTITION BY si.exchange ORDER BY ABS(macd_z_score) DESC NULLS LAST) as macd_z_rank,
  ROW_NUMBER() OVER (PARTITION BY si.exchange ORDER BY adx_14_value DESC NULLS LAST) as adx_14_rank
  -- ... add all other ranks
FROM stock_indicators si;

-- Refresh daily
SELECT cron.schedule(
  'refresh-indicator-ranks',
  '0 18 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY stock_indicators_with_ranks $$
);
```

---

## 🎯 My Recommendation

Use **Option 1 (Edge Function + Scheduled Invocation)** because:

1. ✅ **Most flexible** - Easy to modify logic
2. ✅ **Observable** - Supabase logs all executions
3. ✅ **Reliable** - Built-in retry mechanisms
4. ✅ **Integrated** - Works with Supabase auth/RLS
5. ✅ **Scalable** - Can add notifications, webhooks, etc.

## Quick Start (Easiest)

If you want to start simple, just run the calculation manually once per day:

```bash
# Add to package.json scripts
"rank:calc": "node scripts/run-rank-calculation.js"

# Run manually after market close
npm run rank:calc
```

Then graduate to cron/edge function when you want full automation.

**Want me to create the Edge Function + scheduler setup for you?**
