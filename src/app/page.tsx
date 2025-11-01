'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { ExtremeCard } from '@/components/dashboard/extreme-card';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { SimpleChartPanel } from '@/components/chart/simple-chart-panel';
import { ExtremSymbol } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { INDICATOR_CONFIGS } from '@/config/indicators';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [meta, setMeta] = useState<any>(null);
  const [chartSymbolExchange, setChartSymbolExchange] = useState<string>('NSE');

  useEffect(() => {
    loadExtremeData();
  }, [selectedExchange, selectedCategory]);

  const loadExtremeData = async () => {
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
      const result = await response.json();
      if (result.success) {
        setExtremeData(result.data);
        setMeta(result.meta);
      }
    } catch (error) {
      console.error('Error loading extreme data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = (symbol: string, exchange?: string) => {
    setSelectedSymbol(symbol);
    setChartSymbolExchange(exchange || selectedExchange === 'ALL' ? 'NSE' : selectedExchange);
    setChartDrawerOpen(true);
  };

  const handleCloseChart = () => {
    setChartDrawerOpen(false);
    // Keep symbol selected for a moment before clearing
    setTimeout(() => setSelectedSymbol(null), 300);
  };

  // Filter configs based on selected category
  const displayConfigs = useMemo(() => {
    return selectedCategory === 'all'
      ? INDICATOR_CONFIGS
      : INDICATOR_CONFIGS.filter((config) => config.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalStocks = Object.values(extremeData).reduce((acc, symbols) => {
      return Math.max(acc, symbols.length);
    }, 0);

    const overbought = extremeData.rsi_high?.filter((s) => s.value > 70).length || 0;
    const oversold = extremeData.rsi_low?.filter((s) => s.value < 30).length || 0;
    const strongTrends = extremeData.adx_high?.filter((s) => s.value > 25).length || 0;

    return { totalStocks, overbought, oversold, strongTrends };
  }, [extremeData]);

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

      {/* Tabs for different views */}
      <Tabs defaultValue="extremes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="extremes">Extremes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Extremes Tab */}
        <TabsContent value="extremes" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Indicators Shown</p>
              <p className="text-2xl font-bold text-foreground">
                {meta?.indicatorCount || displayConfigs.length}
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Overbought (RSI {`>`} 70)</p>
              <p className="text-2xl font-bold text-danger">{summaryStats.overbought}</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Oversold (RSI {`<`} 30)</p>
              <p className="text-2xl font-bold text-bullish">{summaryStats.oversold}</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Strong Trends (ADX {`>`} 25)</p>
              <p className="text-2xl font-bold text-warning">{summaryStats.strongTrends}</p>
            </div>
          </div>

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
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Performance Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Comparative performance metrics and charts will be displayed here
            </p>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Indicator correlations and crossover signals will be shown here
            </p>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
            <p className="text-sm text-muted-foreground">
              AI-generated insights based on indicator movements will appear here
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Chart Panel */}
      <SimpleChartPanel
        symbol={selectedSymbol || 'AAPL'}
        exchange={chartSymbolExchange}
        isOpen={chartDrawerOpen}
        onClose={handleCloseChart}
      />
    </div>
  );
}