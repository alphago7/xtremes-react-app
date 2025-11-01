Project: Extreme Signals — Web App (Deep-Teal Edition)

Goal: Build a premium, fast, TradingView‑style web app that ranks stocks by “extremes” across technical indicators (e.g., RSI, ADX, BB %B, MACD, CMF, OBV, ATR), with gorgeous deep‑teal theming. Users can: (1) sort and filter leaders/laggards, (2) open a chart panel with overlays/draw tools, (3) save to watchlists and alerts. Data comes from Supabase tables.

1) Product Pillars

Speed: <150 ms UI interactions, <1.5 s first contentful paint.

Clarity: Minimal chrome, strong hierarchy, zero clutter.

Control: One‑click drilldowns, intuitive chart tools, undo/redo.

Trust: Precise numbers, stable colors, no flicker, transparent signal logic.

Focus: Default to the “Top Extremes Today” view; sensible defaults everywhere.

2) Visual Identity (Deep‑Teal System)

Brand keywords: precise • premium • calm • analytical • decisive.

2.1 Color Tokens

--teal-900 #022C2C (background base)

--teal-800 #043D3D (surfaces)

--teal-600 #0A6A6A (primary accent)

--teal-400 #12A3A3 (interactive/hover)

--teal-200 #7FE7E7 (highlights)

--ink-1000 #0A0F1E (deep navy noir)

--ink-800 #1B2236 (elevated panel)

--ink-500 #8EA3B0 (muted text)

--ink-300 #C7D3D9 (hairlines)

Signal hues (consistent across UI + charts):

Bullish: --green-500 #22C55E

Bearish: --red-500 #EF4444

Neutral: --amber-400 #F59E0B

Contrast: Ensure ≥ 4.5:1 for body text; ≥ 3:1 for large text and graphical marks.

2.2 Typography

Display: Inter Tight or Plus Jakarta Sans (600/700 for headlines)

Body: Inter (400/500)

Numeric UI uses tabular‑nums.

2.3 Density & Motion

Comfortable density by default; toggle for “Compact Mode”.

Motion: 120–180 ms, easing cubic-bezier(.2,.8,.2,1). Use for hover, panel slide, and in‑chart tooltips. No parallax.

3) UX Information Architecture

Primary nav (left rail)

Dashboard (Top Extremes)

Explore (All Indicators)

Watchlists

Alerts

Screeners (saved queries)

Settings (theme, data, account)

Top bar

Search (by symbol/name)

Universe switch (NSE F&O / Nifty 50 / Custom)

Timeframe (1D, 1W, 1M, 3M, 6M, 1Y)

Date (defaults to latest trading day; calendar for past dates)

Main content (Dashboard)

Hero tiles: Most Overbought RSI, Strongest Trend ADX, Tightest BB Squeeze, Highest OBV Surge, etc. Each tile shows top 5 with mini‑sparklines.

Extreme Table: Unified, sortable, virtualized table (1000+ rows) with columns:

Symbol  | Name | Last | Δ% | Vol | RSI14 | ADX14 | %B | MACD Hist | CMF20 | OBV Z | ATR14 | Rank | Sparkline

Row click → Right Drawer Chart (sticky). Double‑click → full chart page.

Facet filters (top of table): Sector, Market‑Cap, Price Range, Volume, Gap Up/Down, Beta.

Explore

Indicator tabs (RSI, ADX, BB, MACD, CMF, OBV, ATR, etc.)

Each tab: distribution histogram, leader/laggard lists, and an interactive scatter (e.g., RSI vs ADX with bubble size=Volume, color=Δ%).

Chart Drawer / Chart Page

Candle chart (6–12 mo by default) with:

Overlays: MA/EMA, BB, VWAP, Supertrend (optional), Ichimoku (optional)

Oscillators panel: RSI, MACD, ADX, CMF/OBV (select up to 3)

Tools: trendline, horizontal/vertical ray, fib retracement, rectangle, path, measure tool, magnet snap, undo/redo

Compare symbols; toggle events (earnings/dividends)

Save layout → Watchlist

4) Interaction & UX Rules

One primary action per area (e.g., “Add to Watchlist” on chart header).

Progressive disclosure: advanced settings in collapsible panels.

Feedback: optimistic UI on favorites/alerts; inline toasts (3 s).

Keyboard: / focus search, ↑/↓ navigate table, Enter open chart, D draw, U undo, R redo, S save layout, A add alert.

Empty states that teach with examples. Error states with retry + support link.

Accessible charts: keyboard focus rings, tooltip values mirrored in a data table below the chart on request.

5) Engineering Architecture (React + Supabase)

5.1 Frontend Stack

Framework: Next.js (App Router) + React 18

Styling: Tailwind + CSS variables for theme tokens; shadcn/ui for primitives.

Charts: TradingView Lightweight‑Charts for candles + overlays; custom canvas layers for drawings; Recharts for histograms/scatters; D3 utilities for calculations.

State: Zustand or Redux Toolkit (URL‑synced query state via next/navigation).

Tables: TanStack Table + row virtualization (TanStack Virtual or React‑Window).

Forms: React Hook Form + Zod.

Intl: i18n ready; numbers formatted by locale; currency toggle.

5.2 Data Model (Supabase/Postgres)

Tables (minimum viable):

symbols (pk symbol): name, exchange, sector, industry, market_cap, beta, lot_size

ohlc_daily (pk symbol,date): o,h,l,c,v

indicators_daily (pk symbol,date):

rsi14, adx14, bb_pctb, bb_width, macd, macd_signal, macd_hist, cmf20, obv, atr14, ema20, ema50, ema200

extreme_ranks (pk date,indicator,rank): symbol, score (z‑score or percentile), value, universe

watchlists (pk id): user_id, name, created_at

watchlist_items (pk watchlist_id,symbol)

alerts (pk id): user_id, symbol, rule_json, active, created_at

chart_layouts (pk id): user_id, name, layout_json

Indexes: on (date), (indicator), (symbol,date), and GIN on jsonb rule fields if needed.

5.3 Access Layer

Views

v_top_extremes(date, universe) → returns top N per indicator with ranks.

RPCs (SQL or Edge Functions)

get_top_indicators(date, indicator, universe, limit, min_volume)

get_symbol_timeseries(symbol, start_date, end_date)

search_symbols(q, limit) (ILIKE with trigram index)

get_indicator_distribution(date, indicator, universe) (for histogram)

get_scatter_xy(date, x_indicator, y_indicator, universe, min_volume)

Edge Functions (Deno) for heavy compute / caching:

recompute_extremes (schedule/cron) — writes to extreme_ranks

alerts_eval — evaluates alert rules; pushes notifications (Supabase Realtime or webhook)

Security

RLS: allow read to public views (anonymized universe) or gated by plan; write limited to user‑owned tables (watchlists, alerts, chart_layouts).

JWT auth (Supabase Auth); optional OAuth (Google).

5.4 Performance

Server components for data‑heavy pages; client components only for charts.

Caching: ISR (60–120 s) for v_top_extremes; SWR on client with stale‑while‑revalidate.

Realtime: Supabase Realtime channels to push daily refresh events; optimistic UI for watchlist/alerts.

Web Workers for indicator math if needed client‑side (drawing tools unaffected).

5.5 Charting Implementation Notes

Use Lightweight‑Charts for performance; maintain custom overlay layer API:

overlay: { id, type, points[], style{}, visible } (trendline, ray, fib, rect)

Hit‑testing for selection; undoStack[], redoStack[].

Indicator panes: compute on the server where possible; otherwise compute in a Web Worker on load.

Export PNG of current viewport; save/load layout JSON per user.

6) Enhancements (High‑Leverage)

Signal Explainers: hover on “RSI 84 (PCTL 98)” → “Overbought vs 1‑year history; mean 51, σ 12.”

Smart Sorting: composite rank = weighted z‑scores across chosen indicators.

Theme Toggle: Deep‑Teal (default) ↔ Light.

Compare Mode: up to 4 symbols in small multiples.

Playhead: scrub historical dates; table/tiles sync to that date.

Screener Composer: visual query builder → save as preset.

7) UX Copy Guidelines

Titles: terse & bold — “Top Extremes Today”.

Labels: sentence case — “Relative Strength Index (RSI)”.

Tooltips: one insight + number — “ADX 42: strong trend”.

Empty: instructive — “No matches. Try lowering volume > 1M.”

8) Accessibility & Compliance

WCAG 2.1 AA color/contrast, focus order, skip‑to‑content.

All chart interactions keyboard reachable; tool labels have aria‑describedby.

Numerals: tabular lining for aligned columns; provide thousand separators.

9) Delivery Plan & Milestones

M0 – Design System (1 wk)

Color tokens, type scale, spacing, shadows, states, icon set.

Component library (Button, Input, Select, Tabs, Drawer, Tooltip, Table, Toast).

M1 – Core Data & Tables (2 wks)

Supabase schema + RLS; seed endpoints + v_top_extremes.

Extreme Table (virtualized, sortable, faceted filters, mini sparklines).

M2 – Chart Drawer (2 wks)

Lightweight‑Charts integration; overlays; 2 oscillators; save layout; compare.

M3 – Explore Analytics (2 wks)

Indicator distributions, scatter explorer, leaders/laggards views.

M4 – Watchlists & Alerts (1–2 wks)

CRUD watchlists; alert rules (threshold, cross, band break); Realtime notification.

M5 – Polish & QA (ongoing)

Performance budgets, a11y audit, keyboard map, smoke tests, docs.

10) Acceptance Criteria (Must‑Have)

Extreme Table loads 1000 rows < 200 ms after data cached; scrolling 60 fps.

Chart Drawer opens < 150 ms; drawing tools latency < 16 ms.

Indicator Accuracy matches server reference calculations within tolerance.

Saves (watchlist, layout) are instantaneous (optimistic) and reconcile in < 1 s.

Responsive: Desktop ≥1280px, Laptop ≥1024px, Tablet ≥768px; mobile read‑only list with basic chart.

11) Dev Tasks — Detailed Checklist

Frontend



Backend (Supabase)



QA & Tooling



12) Wireframe (Text Spec)

Dashboard

Left: Nav rail (icons + labels)

Top: Search | Universe | Timeframe | Date

Body: 2×3 card grid of “Top Extremes” → each card: header + top 5 list + tiny sparkline per symbol.

Below: Full Extreme Table with filters; right drawer hidden by default.

Chart Drawer (right 40% width)

Header: SYMBOL • name • Add to Watchlist • Alert • Layout ▾

Chart area: candles; bottom panes for selected oscillators.

Toolbar (top‑right of chart): Crosshair ▾ | Draw ▾ | Overlays ▾ | Indicators ▾ | Compare ▾ | Export

Footer: OHLC readout; indicator values at cursor; UTC/local toggle.

13) Copy‑Paste Briefs

13.1 Brief for UI/UX Team

Design a deep‑teal, premium analytics app that surfaces “extreme” technical signals. Deliver:

Tokenized design system (colors/typography/spacing/shadows/states), 2) high‑fidelity mocks for Dashboard, Explore, Chart Drawer, and Chart Page (desktop + tablet), 3) interaction specs for filters, table, and chart tools, 4) iconography (line icons, 2px stroke), 5) a11y annotations and keyboard map, 6) motion guidelines (micro‑interactions 120–180 ms). Keep surfaces calm, typography disciplined, and charts legible. Use sparklines and compact badges to reduce cognitive load.

13.2 Brief for Dev Team

Implement Next.js + Tailwind + shadcn/ui with Lightweight‑Charts for candles and custom drawing overlays. Build the v_top_extremes view and RPCs in Supabase, enforce RLS, and wire ISR/SWR caching. Table must be virtualized, sortable, and filterable. Right‑drawer chart opens via row click; support overlays, oscillators, drawing tools with undo/redo, compare mode, and layout save/load. Add watchlists and alert rules stored per user; Realtime updates when extreme ranks refresh. Tests, performance budgets, a11y, and telemetry are mandatory.

14) Future Roadmap (Optional)

Multi‑timeframe extremes (intraday 5m/15m)

Strategy templates (e.g., BB squeeze + ADX rising + MACD cross)

Backtest “toy” engine with commission/slippage presets

Mobile app (React Native or Flutter) — read‑only first

15) Tailored Deep‑Teal Palette (Drop‑in Tokens + Tailwind setup)

Use this immediately; replace if you have a brand hex. All tokens map 1:1 to CSS variables and Tailwind.

15.1 Core Brand Shades

--teal-950: #011A1A  // canvas base (nearly black teal)

--teal-900: #022C2C  // app background

--teal-800: #073A3A  // elevated surfaces

--teal-700: #0B4D4D  // cards/rails

--teal-600: #0F6C6C  // primary actions

--teal-500: #118686  // hovers/active

--teal-400: #12A3A3  // focus/links

--teal-300: #4BC8C8  // accents/sparklines

--teal-200: #7FE7E7  // highlights

--teal-100: #C7FBFB  // subtle backgrounds

15.2 Neutrals & Signals

Neutrals: --ink-1000:#0A0F1E, --ink-900:#121A2A, --ink-800:#1B2236, --ink-600:#5F7282, --ink-500:#8EA3B0, --ink-300:#C7D3D9, --ink-200:#E1E7EA.

Signals: --green-500:#22C55E, --red-500:#EF4444, --amber-400:#F59E0B, --blue-400:#60A5FA.

15.3 CSS Variables (global)

:root {
  --bg: var(--teal-900);
  --surface: var(--teal-800);
  --text: #E8F3F3;
  --text-muted: var(--ink-500);
  --primary: var(--teal-600);
  --primary-hover: var(--teal-500);
  --accent: var(--teal-300);
  --border: var(--ink-300);
  --success: var(--green-500);
  --danger: var(--red-500);
  --warning: var(--amber-400);
}

15.4 Tailwind config snippet

// tailwind.config.ts
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)'
      },
      fontFeatureSettings: { 'tnum': '"tnum" 1' },
    }
  }
}

15.5 Component Tokens

Buttons: default bg-primary text-bg, hover bg-[--primary-hover], focus ring ring-2 ring-[--accent].

Tables: header text-muted, row hover bg-[color-mix(in_oklab,var(--surface),white_5%)], selected outline outline-1 outline-[--accent].

Charts: candle up --green-500, candle down --red-500, grid lines #2A3947 @ 20% opacity, crosshair --teal-200.

16) Supabase Binding Guide (Map to Existing Tables)

Use these SQL blocks as non-destructive migrations to align your current schema to the app contract.

16.1 Contract Interfaces

We assume the frontend calls these views/RPCs. Implement by mapping/aliasing to your real columns.

-- VIEW: v_top_extremes
create or replace view v_top_extremes as
select
  e.date,
  e.indicator,      -- text e.g. 'rsi14','adx14','bb_pctb','macd_hist','cmf20','obv_z','atr14'
  e.rank,
  e.symbol,
  e.value,
  e.score,          -- z-score or percentile
  e.universe
from extreme_ranks e;

-- RPC: get_top_indicators(date, indicator, universe, limit, min_volume)
create or replace function get_top_indicators(
  p_date date,
  p_indicator text,
  p_universe text default 'NIFTY50',
  p_limit int default 50,
  p_min_volume bigint default 0
) returns table (
  symbol text, name text, last numeric, pct_change numeric,
  volume bigint, value numeric, score numeric
) language sql stable as $$
  select s.symbol, s.name, o.c as last,
         round(100*(o.c/lag(o.c) over (partition by s.symbol order by o.date)-1),2) as pct_change,
         o.v as volume,
         i.(p_indicator)::numeric as value,
         e.score
  from symbols s
  join ohlc_daily o on o.symbol=s.symbol and o.date=p_date
  join indicators_daily i on i.symbol=s.symbol and i.date=p_date
  join extreme_ranks e on e.symbol=s.symbol and e.date=p_date and e.indicator=p_indicator
  where e.universe=p_universe and o.v >= p_min_volume
  order by e.rank asc
  limit p_limit;
$$;

-- RPC: get_symbol_timeseries(symbol, start_date, end_date)
create or replace function get_symbol_timeseries(
  p_symbol text,
  p_start date,
  p_end date
) returns table (
  date date, o double precision, h double precision, l double precision, c double precision, v bigint,
  rsi14 double precision, adx14 double precision, bb_pctb double precision, bb_width double precision,
  macd double precision, macd_signal double precision, macd_hist double precision,
  cmf20 double precision, obv double precision, atr14 double precision,
  ema20 double precision, ema50 double precision, ema200 double precision
) language sql stable as $$
  select o.date, o.o, o.h, o.l, o.c, o.v,
         i.rsi14, i.adx14, i.bb_pctb, i.bb_width,
         i.macd, i.macd_signal, i.macd_hist,
         i.cmf20, i.obv, i.atr14,
         i.ema20, i.ema50, i.ema200
  from ohlc_daily o
  left join indicators_daily i using (symbol, date)
  where o.symbol=p_symbol and o.date between p_start and p_end
  order by o.date;
$$;

16.2 Compatibility Views (if your names differ)

-- Example: your table is price_daily(symbol_id, d, open, high, low, close, volume)
create or replace view ohlc_daily as
select symbol_id as symbol, d as date,
       open as o, high as h, low as l, close as c, volume as v
from price_daily;

-- Example: your indicators table columns
create or replace view indicators_daily as
select symbol_id as symbol, d as date,
       rsi as rsi14, adx as adx14,
       bbp as bb_pctb, bbw as bb_width,
       macd, macd_signal, macd_hist,
       cmf20, obv, atr as atr14,
       ema20, ema50, ema200
from ta_daily;

16.3 Minimal RLS (read public metrics, write only owned data)

-- Enable RLS
alter table watchlists enable row level security;
create policy "watchlists_owner" on watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table watchlist_items enable row level security;
create policy "watchlist_items_owner" on watchlist_items
  for all using (
    exists(select 1 from watchlists w where w.id=watchlist_id and w.user_id=auth.uid())
  ) with check (
    exists(select 1 from watchlists w where w.id=watchlist_id and w.user_id=auth.uid())
  );

-- Views can be exposed read-only to anon or restricted by API route
grant usage on schema public to anon, authenticated;
grant select on v_top_extremes to anon, authenticated;

16.4 Edge Function scaffolds

// supabase/functions/recompute_extremes/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { date, universe } = await req.json().catch(()=>({}));
  // 1) fetch indicator snapshot for date
  // 2) compute z-scores per indicator
  // 3) write top N into extreme_ranks
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
});

17) Frontend Glue (Drop‑in Examples)

17.1 Data Hooks

// lib/useTopExtremes.ts
import useSWR from 'swr';
export function useTopExtremes(params: {date?: string; indicator: string; universe?: string; limit?: number; minVolume?: number}) {
  const q = new URLSearchParams({ ...params as any }).toString();
  const { data, error, isLoading } = useSWR(`/api/top-extremes?${q}`, (u)=>fetch(u).then(r=>r.json()));
  return { data, error, isLoading };
}

17.2 API Route (Next.js)

// app/api/top-extremes/route.ts
import { createClient } from '@supabase/supabase-js';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const indicator = searchParams.get('indicator')!;
  const date = searchParams.get('date')!;
  const universe = searchParams.get('universe') ?? 'NIFTY50';
  const limit = Number(searchParams.get('limit') ?? 50);
  const minVolume = Number(searchParams.get('minVolume') ?? 0);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.rpc('get_top_indicators', { p_date: date, p_indicator: indicator, p_universe: universe, p_limit: limit, p_min_volume: minVolume });
  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}

17.3 Lightweight‑Charts Setup (candles + overlays)

// components/Chart.tsx
import { createChart, ISeriesApi } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
export default function Chart({ candles, overlays }: { candles: any[]; overlays?: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if (!ref.current) return;
    const chart = createChart(ref.current, { layout: { background: { color: getComputedStyle(document.documentElement).getPropertyValue('--surface') }, textColor: getComputedStyle(document.documentElement).getPropertyValue('--text') }, grid: { vertLines: { color: '#2A394733' }, horzLines: { color: '#2A394733' } } });
    const series = chart.addCandlestickSeries({ upColor: getVar('--success'), downColor: getVar('--danger'), borderVisible: false, wickUpColor: getVar('--success'), wickDownColor: getVar('--danger') });
    series.setData(candles);
    // TODO: draw overlays (EMA/BB) by additional series
    const r = () => chart.timeScale().fitContent();
    window.addEventListener('resize', r); r();
    return () => window.removeEventListener('resize', r);
  }, [candles]);
  return <div ref={ref} className="h-full w-full"/>;
}
function getVar(name: string){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

18) Migration Helper (If you already have data)

Create compatibility views (16.2) to alias your existing tables.

Create extreme_ranks if missing:

create table if not exists extreme_ranks (
  date date not null,
  indicator text not null,
  rank int not null,
  symbol text not null,
  value double precision,
  score double precision,
  universe text default 'NIFTY50',
  primary key (date, indicator, rank)
);
create index on extreme_ranks(date, indicator, universe);

Backfill with a one‑time script (Edge Function or SQL insert into ... select ...).

Point the frontend to the RPCs; verify acceptance criteria in Section 10.

End of Instruction Pack

