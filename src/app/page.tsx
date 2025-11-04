'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { ExtremeCard } from '@/components/dashboard/extreme-card';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { SimpleChartPanel } from '@/components/chart/simple-chart-panel';
import { ExtremSymbol } from '@/types';
import type { WatchlistItemInput } from '@/store/watchlist-store';
import { Skeleton } from '@/components/ui/skeleton';
import { INDICATOR_CONFIGS } from '@/config/indicators';

interface ExtremeDataMeta {
  indicatorCount: number;
  [key: string]: unknown;
}

interface ExtremeDataResponse {
  success: boolean;
  data: Record<string, ExtremSymbol[]>;
  meta: ExtremeDataMeta;
}

export default function DashboardPage() {
  const {
    selectedSymbol,
    chartDrawerOpen,
    setSelectedSymbol,
    setChartDrawerOpen,
    setLoading,
    loading,
    selectedExchange,
    selectedCategory,
  } = useAppStore();
  const [extremeData, setExtremeData] = useState<Record<string, ExtremSymbol[]>>({});
  const [meta, setMeta] = useState<ExtremeDataMeta | null>(null);
  const [chartSymbolExchange, setChartSymbolExchange] = useState<string>('US');
  const [chartWatchlistMeta, setChartWatchlistMeta] = useState<Partial<WatchlistItemInput> | null>(null);

  const loadExtremeData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        exchange: selectedExchange,
        category: selectedCategory,
        limit: '10',
      });

      const response = await fetch(`/api/extreme-data?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result: ExtremeDataResponse = await response.json();
      if (result.success) {
        setExtremeData(result.data);
        setMeta(result.meta);
      }
    } catch (error) {
      console.error('Error loading extreme data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedExchange, setLoading]);

  useEffect(() => {
    loadExtremeData();
  }, [loadExtremeData]);

  const handleSymbolClick = (
    symbol: string,
    options?: string | {
      exchange?: string;
      meta?: {
        indicatorKey?: string;
        indicatorTitle?: string;
        indicatorName?: string;
        indicatorValue?: number;
        indicatorRank?: number;
        companyName?: string;
        capturedAt?: string;
      };
    }
  ) => {
    const opts = typeof options === 'string' ? { exchange: options } : options || {};
    setSelectedSymbol(symbol);
    const resolvedExchange =
      opts.exchange && opts.exchange !== 'ALL'
        ? opts.exchange
        : selectedExchange === 'ALL'
          ? 'NSE'
          : selectedExchange;

    setChartSymbolExchange(resolvedExchange);
    setChartWatchlistMeta({
      symbol,
      exchange: resolvedExchange,
      companyName: opts.meta?.companyName,
      indicatorKey: opts.meta?.indicatorKey,
      indicatorTitle: opts.meta?.indicatorTitle,
      indicatorName: opts.meta?.indicatorName,
      indicatorValue: opts.meta?.indicatorValue,
      indicatorRank: opts.meta?.indicatorRank,
      capturedAt: opts.meta?.capturedAt ?? new Date().toISOString(),
    });
    setChartDrawerOpen(true);
  };

  const handleCloseChart = () => {
    setChartDrawerOpen(false);
    // Keep symbol selected for a moment before clearing
    setTimeout(() => {
      setSelectedSymbol(null);
      setChartWatchlistMeta(null);
    }, 300);
  };

  // Filter configs based on selected category
  const displayConfigs = useMemo(() => {
    return selectedCategory === 'all'
      ? INDICATOR_CONFIGS
      : INDICATOR_CONFIGS.filter((config) => config.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Technical Indicators Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time analysis of extreme indicator values across {selectedExchange === 'ALL' ? 'all exchanges' : selectedExchange}
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters onFilterChange={loadExtremeData} />

      {/* Indicator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? // Loading skeletons
            displayConfigs.map((config) => (
              <Skeleton key={config.key} className="h-80 bg-surface" />
            ))
          : // Actual cards
            displayConfigs.map((config) => (
              <ExtremeCard
                key={config.key}
                title={config.title}
                indicator={config.name}
                description={config.description}
                category={config.category}
                symbols={extremeData[config.key] || []}
                onSymbolClick={handleSymbolClick}
                formatValue={config.formatValue}
              />
            ))}
      </div>

      {/* Chart Panel */}
      <SimpleChartPanel
        symbol={selectedSymbol || 'AAPL'}
        exchange={chartSymbolExchange}
        isOpen={chartDrawerOpen}
        onClose={handleCloseChart}
        watchlistMeta={chartWatchlistMeta}
      />
    </div>
  );
}
