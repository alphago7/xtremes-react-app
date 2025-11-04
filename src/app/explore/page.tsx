'use client';

import { useEffect, useMemo, useState } from 'react';
import { INDICATOR_CONFIGS } from '@/config/indicators';
import type { IndicatorConfig, ExtremSymbol } from '@/types';
import type { WatchlistItemInput } from '@/store/watchlist-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleChartPanel } from '@/components/chart/simple-chart-panel';
import { Loader2 } from 'lucide-react';

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS: { value: IndicatorConfig['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'trend', label: 'Trend' },
  { value: 'volume', label: 'Volume' },
  { value: 'volatility', label: 'Volatility' },
];

const EXCHANGE_OPTIONS = [
  { value: 'NSE', label: 'NSE' },
  { value: 'US', label: 'US' },
];

type ListView = 'top' | 'bottom';

type FetchState = {
  items: ExtremSymbol[];
  loading: boolean;
  offset: number;
  hasMore: boolean;
};

const initialState: FetchState = {
  items: [],
  loading: false,
  offset: 0,
  hasMore: true,
};

export default function ExploreIndicatorsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | IndicatorConfig['category']>('all');
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState<string>(INDICATOR_CONFIGS[0]?.key ?? '');
  const [selectedExchange, setSelectedExchange] = useState<'NSE' | 'US'>('US');

  const [topState, setTopState] = useState<FetchState>(initialState);
  const [bottomState, setBottomState] = useState<FetchState>(initialState);

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartExchange, setChartExchange] = useState<'NSE' | 'US'>('US');
  const [chartWatchlistMeta, setChartWatchlistMeta] = useState<Partial<WatchlistItemInput> | null>(null);
  const [chartOpen, setChartOpen] = useState(false);

  const handleCategoryChange = (value: 'all' | IndicatorConfig['category']) => {
    setSelectedCategory(value);
    const nextIndicators = value === 'all'
      ? INDICATOR_CONFIGS
      : INDICATOR_CONFIGS.filter((cfg) => cfg.category === value);

    if (!nextIndicators.some((cfg) => cfg.key === selectedIndicatorKey) && nextIndicators.length > 0) {
      setSelectedIndicatorKey(nextIndicators[0].key);
    }
  };

  const filteredIndicators = useMemo(() => {
    return selectedCategory === 'all'
      ? INDICATOR_CONFIGS
      : INDICATOR_CONFIGS.filter((cfg) => cfg.category === selectedCategory);
  }, [selectedCategory]);

  const indicatorConfig = useMemo(() => {
    return (
      INDICATOR_CONFIGS.find((cfg) => cfg.key === selectedIndicatorKey) ?? filteredIndicators[0] ?? INDICATOR_CONFIGS[0]
    );
  }, [filteredIndicators, selectedIndicatorKey]);

  useEffect(() => {
    if (!indicatorConfig) {
      return;
    }

    let isCancelled = false;

    const resetAndLoad = async () => {
      setTopState({ ...initialState, loading: true });
      setBottomState({ ...initialState, loading: true });

      const paramsBase = `indicator=${indicatorConfig.key}&exchange=${selectedExchange}`;

      try {
        const [topRes, bottomRes] = await Promise.all([
          fetch(`/api/indicator-explore?${paramsBase}&view=top&offset=0&limit=${PAGE_SIZE}`),
          fetch(`/api/indicator-explore?${paramsBase}&view=bottom&offset=0&limit=${PAGE_SIZE}`),
        ]);

        if (!isCancelled) {
          const topJson = await topRes.json();
          const bottomJson = await bottomRes.json();

          setTopState({
            items: topJson.success ? (topJson.data as ExtremSymbol[]) : [],
            loading: false,
            offset: topJson.success ? (topJson.data as ExtremSymbol[]).length : 0,
            hasMore: Boolean(topJson.meta?.hasMore && (topJson.data as ExtremSymbol[]).length === PAGE_SIZE),
          });
          setBottomState({
            items: bottomJson.success ? (bottomJson.data as ExtremSymbol[]) : [],
            loading: false,
            offset: bottomJson.success ? (bottomJson.data as ExtremSymbol[]).length : 0,
            hasMore: Boolean(bottomJson.meta?.hasMore && (bottomJson.data as ExtremSymbol[]).length === PAGE_SIZE),
          });
        }
      } catch (error) {
        console.error('Error loading indicator explore data:', error);
        if (!isCancelled) {
          setTopState((prev) => ({ ...prev, loading: false, hasMore: false }));
          setBottomState((prev) => ({ ...prev, loading: false, hasMore: false }));
        }
      }
    };

    resetAndLoad();

    return () => {
      isCancelled = true;
    };
  }, [indicatorConfig, selectedIndicatorKey, selectedExchange]);

  const loadMore = async (view: ListView) => {
    const state = view === 'top' ? topState : bottomState;
    const setState = view === 'top' ? setTopState : setBottomState;

    if (state.loading || !state.hasMore || !indicatorConfig) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const params = new URLSearchParams({
        indicator: indicatorConfig.key,
        exchange: selectedExchange,
        view,
        offset: state.offset.toString(),
        limit: PAGE_SIZE.toString(),
      });

      const response = await fetch(`/api/indicator-explore?${params.toString()}`);
      const json = await response.json();
      const newItems: ExtremSymbol[] = json.success ? json.data ?? [] : [];

      setState((prev) => ({
        items: [...prev.items, ...newItems],
        loading: false,
        offset: prev.offset + newItems.length,
        hasMore: newItems.length === PAGE_SIZE,
      }));
    } catch (error) {
      console.error('Error loading more data:', error);
      setState((prev) => ({ ...prev, loading: false, hasMore: false }));
    }
  };

  const handleSymbolClick = (item: ExtremSymbol, indicator: IndicatorConfig) => {
    setSelectedSymbol(item.ticker);
    const exchangeValue = (item.exchange as 'NSE' | 'US' | undefined) ?? selectedExchange;
    setChartExchange(exchangeValue === 'US' ? 'US' : 'NSE');
    setChartWatchlistMeta({
      symbol: item.ticker,
      exchange: exchangeValue,
      companyName: item.company_name,
      indicatorKey: indicator.key,
      indicatorTitle: indicator.title,
      indicatorName: indicator.name,
      indicatorValue: item.value,
      indicatorRank: item.rank ?? undefined,
      capturedAt: item.captured_at ?? new Date().toISOString(),
    });
    setChartOpen(true);
  };

  const handleCloseChart = () => {
    setChartOpen(false);
    setTimeout(() => {
      setSelectedSymbol(null);
      setChartWatchlistMeta(null);
    }, 300);
  };

  const renderList = (view: ListView, state: FetchState) => {
    const items = state.items;
    const loading = state.loading && state.offset === 0;

    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <p className="py-8 text-sm text-muted-foreground text-center">No data available for this indicator.</p>
      );
    }

    return (
      <div className="space-y-2">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li
              key={`${view}-${item.ticker}-${item.rank ?? item.value}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface/60 cursor-pointer"
              onClick={() => indicatorConfig && handleSymbolClick(item, indicatorConfig)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground w-6 text-right">{item.rank ?? '-'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{item.ticker}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.company_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="tabular-nums font-medium">{indicatorConfig?.formatValue ? indicatorConfig.formatValue(item.value) : item.value.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground uppercase">{item.exchange ?? selectedExchange}</span>
              </div>
            </li>
          ))}
        </ul>
        {state.hasMore && (
          <div className="flex justify-center pt-2">
            <Button size="sm" variant="outline" onClick={() => loadMore(view)} disabled={state.loading}>
              {state.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Explore Indicators</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Browse the strongest and weakest performers for any technical indicator. Select an indicator and exchange to see the top and bottom ranked securities, then open a chart for deeper analysis or add them to your watchlist.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={selectedCategory} onValueChange={(value) => handleCategoryChange(value as typeof selectedCategory)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Indicator</label>
          <Select
            value={indicatorConfig?.key ?? ''}
            onValueChange={(value) => setSelectedIndicatorKey(value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredIndicators.map((cfg) => (
                <SelectItem key={cfg.key} value={cfg.key}>
                  {cfg.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Exchange</label>
          <Select value={selectedExchange} onValueChange={(value) => setSelectedExchange(value as 'NSE' | 'US')}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXCHANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Top {PAGE_SIZE} — {indicatorConfig?.title}</span>
              <span className="text-xs text-muted-foreground uppercase">{selectedExchange}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>{indicatorConfig && renderList('top', topState)}</CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Bottom {PAGE_SIZE} — {indicatorConfig?.title}</span>
              <span className="text-xs text-muted-foreground uppercase">{selectedExchange}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>{indicatorConfig && renderList('bottom', bottomState)}</CardContent>
        </Card>
      </div>

      <SimpleChartPanel
        symbol={selectedSymbol || 'AAPL'}
        exchange={chartExchange}
        isOpen={chartOpen}
        onClose={handleCloseChart}
        watchlistMeta={chartWatchlistMeta}
      />
    </div>
  );
}
