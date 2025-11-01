'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { SupabaseService } from '@/services/supabase-service';
import { ExtremeCard } from '@/components/dashboard/extreme-card';
import { ExtremSymbol } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const indicatorConfig = [
  {
    key: 'rsi_high',
    indicator: 'rsi',
    direction: 'high' as const,
    title: 'Most Overbought RSI',
    description: 'Stocks with highest RSI values (>70 overbought)',
  },
  {
    key: 'rsi_low',
    indicator: 'rsi',
    direction: 'low' as const,
    title: 'Most Oversold RSI',
    description: 'Stocks with lowest RSI values (<30 oversold)',
  },
  {
    key: 'adx_high',
    indicator: 'adx',
    direction: 'high' as const,
    title: 'Strongest Trends ADX',
    description: 'Stocks with highest ADX showing strong directional movement',
  },
  {
    key: 'macd_high',
    indicator: 'macd',
    direction: 'high' as const,
    title: 'MACD Bullish Extremes',
    description: 'Stocks with highest MACD z-scores (bullish momentum)',
  },
  {
    key: 'macd_low',
    indicator: 'macd',
    direction: 'low' as const,
    title: 'MACD Bearish Extremes',
    description: 'Stocks with lowest MACD z-scores (bearish momentum)',
  },
  {
    key: 'bollinger_high',
    indicator: 'bollinger',
    direction: 'high' as const,
    title: 'Bollinger Upper Band',
    description: 'Stocks at upper Bollinger Band extremes (volatility expansion)',
  },
  {
    key: 'bollinger_low',
    indicator: 'bollinger',
    direction: 'low' as const,
    title: 'Bollinger Lower Band',
    description: 'Stocks at lower Bollinger Band extremes (volatility compression)',
  },
  {
    key: 'cmf_high',
    indicator: 'cmf',
    direction: 'high' as const,
    title: 'Money Flow In (CMF)',
    description: 'Stocks with highest CMF values (strong buying pressure)',
  },
  {
    key: 'cmf_low',
    indicator: 'cmf',
    direction: 'low' as const,
    title: 'Money Flow Out (CMF)',
    description: 'Stocks with lowest CMF values (strong selling pressure)',
  },
];

export default function DashboardPage() {
  const { setSelectedSymbol, setChartDrawerOpen, setLoading, loading } = useAppStore();
  const [extremeData, setExtremeData] = useState<Record<string, ExtremSymbol[]>>({});

  useEffect(() => {
    loadExtremeData();
  }, []);

  const loadExtremeData = async () => {
    setLoading(true);
    try {
      // Fetch data from API route to avoid client-side Supabase issues
      const response = await fetch('/api/extreme-data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      if (result.success) {
        setExtremeData(result.data);
      }
    } catch (error) {
      console.error('Error loading extreme data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    setChartDrawerOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Top Extremes Today</h1>
        <p className="text-muted-foreground mt-1">
          Stocks showing extreme technical indicator values across NSE F&O universe
        </p>
      </div>

      {/* Extreme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? // Loading skeletons
            indicatorConfig.map((config) => (
              <Skeleton key={config.key} className="h-64 bg-surface" />
            ))
          : // Actual cards
            indicatorConfig.map((config) => (
              <ExtremeCard
                key={config.key}
                title={config.title}
                indicator={config.indicator}
                description={config.description}
                symbols={extremeData[config.key] || []}
                onSymbolClick={handleSymbolClick}
              />
            ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Stocks Analyzed</p>
          <p className="text-2xl font-bold text-foreground">516</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Overbought (RSI {`>`} 70)</p>
          <p className="text-2xl font-bold text-danger">
            {extremeData.rsi_high?.filter((s) => s.value > 70).length || 0}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Oversold (RSI {`<`} 30)</p>
          <p className="text-2xl font-bold text-bullish">
            {extremeData.rsi_low?.filter((s) => s.value < 30).length || 0}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Strong Trends (ADX {`>`} 25)</p>
          <p className="text-2xl font-bold text-warning">
            {extremeData.adx_high?.filter((s) => s.value > 25).length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}