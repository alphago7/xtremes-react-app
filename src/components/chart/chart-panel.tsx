'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Minus, GitFork, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartPanelProps {
  symbol: string;
  exchange?: string;
  isOpen: boolean;
  onClose: () => void;
}

const TIMEFRAME_OPTIONS = [
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 90 },
  { value: '6M', label: '6M', days: 180 },
  { value: '200D', label: '200D', days: 200 },
  { value: '1Y', label: '1Y', days: 365 },
];

export function ChartPanel({ symbol, exchange = 'NSE', isOpen, onClose }: ChartPanelProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('200D');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [chartReady, setChartReady] = useState(false);

  // Callback ref to initialize chart when container is ready
  const chartContainerRef = (node: HTMLDivElement | null) => {
    if (!node || !isOpen || chartRef.current) return;

    console.log('Chart container mounted, initializing...');
    console.log('Container dimensions:', node.clientWidth, 'x', node.clientHeight);

    try {
      const chart = createChart(node, {
        layout: {
          background: { color: '#0a0a0a' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        width: node.clientWidth || 800,
        height: 500,
        timeScale: {
          borderColor: '#2B2B43',
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: '#2B2B43',
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: 'rgba(255, 255, 255, 0.3)',
            style: 2,
          },
          horzLine: {
            width: 1,
            color: 'rgba(255, 255, 255, 0.3)',
            style: 2,
          },
        },
      });

      console.log('Chart created, adding candlestick series');

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      console.log('Chart initialized successfully ✅');
      setChartReady(true);

      // Handle resize
      const handleResize = () => {
        if (chart) {
          chart.applyOptions({
            width: node.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && chartRef.current) {
      console.log('Panel closed, cleaning up chart');
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setChartReady(false);
      setChartData([]);
    }
  }, [isOpen]);

  // Fetch OHLC data - only after chart is ready
  useEffect(() => {
    if (!isOpen || !symbol || !chartReady) {
      console.log(`Waiting for chart ready: isOpen=${isOpen}, symbol=${symbol}, chartReady=${chartReady}`);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const timeframe = TIMEFRAME_OPTIONS.find(tf => tf.value === selectedTimeframe);
        const days = timeframe?.days || 200;

        console.log(`Fetching OHLC data for ${symbol} (${exchange}) - ${days} days`);

        const response = await fetch(
          `/api/chart/ohlc?symbol=${symbol}&exchange=${exchange}&limit=${days}`
        );

        if (!response.ok) {
          console.error(`Failed to fetch OHLC: ${response.status}`);
          throw new Error('Failed to fetch OHLC data');
        }

        const result = await response.json();
        console.log(`OHLC API response:`, result);

        if (result.success && result.data && result.data.length > 0) {
          // Transform data for lightweight-charts
          const formattedData: CandlestickData[] = result.data.map((item: any) => ({
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }));

          console.log(`Setting ${formattedData.length} candles to chart`);
          setChartData(formattedData);

          if (candlestickSeriesRef.current && formattedData.length > 0) {
            console.log('Updating chart with data');
            candlestickSeriesRef.current.setData(formattedData);
            chartRef.current?.timeScale().fitContent();
          } else {
            console.warn('Chart series not ready or no data');
          }
        } else {
          console.warn('No data in API response');
        }

        // Fetch company name from symbols table
        const symbolResponse = await fetch(`/api/symbol?ticker=${symbol}&exchange=${exchange}`);
        if (symbolResponse.ok) {
          const symbolData = await symbolResponse.json();
          setCompanyName(symbolData.data?.company_name || '');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, exchange, selectedTimeframe, isOpen, chartReady]);

  const latestPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const priceChange =
    chartData.length > 1
      ? ((chartData[chartData.length - 1].close - chartData[chartData.length - 2].close) /
          chartData[chartData.length - 2].close) *
        100
      : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl lg:max-w-6xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl font-bold">{symbol}</SheetTitle>
                <Badge variant="outline">{exchange}</Badge>
                {latestPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">${latestPrice.toFixed(2)}</span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        priceChange >= 0 ? 'text-bullish' : 'text-danger'
                      )}
                    >
                      {priceChange >= 0 ? '+' : ''}
                      {priceChange.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {companyName && (
              <p className="text-sm text-muted-foreground">{companyName}</p>
            )}
          </SheetHeader>

          {/* Timeframe Selector */}
          <div className="px-6 py-3 border-b border-border bg-surface/50">
            <div className="flex items-center gap-2">
              {TIMEFRAME_OPTIONS.map((tf) => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe === tf.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf.value)}
                  className="h-7 px-3 text-xs"
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
            {loading && (
              <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading chart data...</div>
              </div>
            )}

            {/* Debug Info */}
            <div className="absolute top-2 right-2 z-20 bg-black/80 p-2 rounded text-xs text-white">
              <div>Chart Ready: {chartReady ? '✅' : '❌'}</div>
              <div>Data Points: {chartData.length}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
            </div>

            <div ref={chartContainerRef} className="w-full h-full" style={{ height: '500px' }} />

            {chartData.length === 0 && !loading && chartReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No chart data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try selecting a different timeframe
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Drawing Tools - Coming Soon */}
          <div className="px-6 py-3 border-t border-border bg-surface/50">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled className="h-8 px-3">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Trend Line</span>
              </Button>
              <Button variant="ghost" size="sm" disabled className="h-8 px-3">
                <Minus className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Horizontal</span>
              </Button>
              <Button variant="ghost" size="sm" disabled className="h-8 px-3">
                <GitFork className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Fib Retracement</span>
              </Button>
              <Button variant="ghost" size="sm" disabled className="h-8 px-3">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Indicators</span>
              </Button>
              <div className="ml-auto">
                <Badge variant="secondary" className="text-xs">
                  {chartData.length} bars
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
