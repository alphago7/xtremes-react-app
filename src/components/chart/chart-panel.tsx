'use client';

import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState('200D');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [containerMounted, setContainerMounted] = useState(false);

  // Track when container ref is set
  const setChartContainerRef = (node: HTMLDivElement | null) => {
    (chartContainerRef as any).current = node;
    if (node) {
      console.log('[REF] Container ref set');
      setContainerMounted(true);
    } else {
      setContainerMounted(false);
    }
  };

  // Initialize chart when panel opens AND container is mounted
  useEffect(() => {
    if (!isOpen) {
      console.log('[INIT] Panel not open');
      return;
    }

    if (!containerMounted || !chartContainerRef.current) {
      console.log('[INIT] Container not mounted yet');
      return;
    }

    let chart: any = null;
    let candlestickSeries: any = null;

    const initChart = async () => {
      try {
        const container = chartContainerRef.current;
        if (!container) return;

        console.log('[INIT] Starting chart initialization...');

        // Dynamically import
        const { createChart } = await import('lightweight-charts');

        console.log('[INIT] Creating chart...');
        chart = createChart(container, {
          layout: {
            background: { color: '#0a0a0a' },
            textColor: '#d1d5db',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          width: container.clientWidth,
          height: 500,
          timeScale: {
            borderColor: '#374151',
            timeVisible: true,
          },
          rightPriceScale: {
            borderColor: '#374151',
          },
        });

        console.log('[INIT] Adding candlestick series...');
        candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;

        console.log('[INIT] Chart ready! ✅');

        // Setup resize observer
        resizeObserverRef.current = new ResizeObserver(entries => {
          if (chart && entries.length > 0) {
            const { width } = entries[0].contentRect;
            chart.applyOptions({ width });
          }
        });
        resizeObserverRef.current.observe(container);
      } catch (error) {
        console.error('[INIT] Error:', error);
      }
    };

    initChart();

    return () => {
      console.log('[CLEANUP] Removing chart...');
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chart) {
        chart.remove();
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [isOpen, containerMounted]);

  // Fetch OHLC data
  useEffect(() => {
    if (!isOpen || !symbol) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const timeframe = TIMEFRAME_OPTIONS.find(tf => tf.value === selectedTimeframe);
        const days = timeframe?.days || 200;

        console.log(`[DATA] Fetching ${days} days for ${symbol}...`);

        const [ohlcRes, symbolRes] = await Promise.all([
          fetch(`/api/chart/ohlc?symbol=${symbol}&exchange=${exchange}&limit=${days}`),
          fetch(`/api/symbol?ticker=${symbol}&exchange=${exchange}`)
        ]);

        if (ohlcRes.ok) {
          const result = await ohlcRes.json();
          console.log(`[DATA] Got ${result.data?.length || 0} candles`);

          if (result.success && result.data && result.data.length > 0) {
            const formattedData = result.data.map((item: any) => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
            }));

            setChartData(formattedData);

            // Set data to chart if ready
            if (candlestickSeriesRef.current) {
              console.log('[DATA] Setting data to chart...');
              candlestickSeriesRef.current.setData(formattedData);
              chartRef.current?.timeScale().fitContent();
              console.log('[DATA] Chart updated ✅');
            } else {
              console.warn('[DATA] Chart not ready yet, will retry...');
              // Retry after a short delay
              setTimeout(() => {
                if (candlestickSeriesRef.current) {
                  console.log('[DATA] Retry: Setting data to chart...');
                  candlestickSeriesRef.current.setData(formattedData);
                  chartRef.current?.timeScale().fitContent();
                }
              }, 200);
            }
          }
        }

        if (symbolRes.ok) {
          const symbolData = await symbolRes.json();
          setCompanyName(symbolData.data?.company_name || '');
        }
      } catch (error) {
        console.error('[DATA] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, exchange, selectedTimeframe, isOpen]);

  const latestPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const priceChange =
    chartData.length > 1
      ? ((chartData[chartData.length - 1].close - chartData[chartData.length - 2].close) /
          chartData[chartData.length - 2].close) *
        100
      : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl lg:max-w-6xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
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
          <div className="px-6 py-3 border-b border-border bg-surface/50 shrink-0">
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
          <div className="flex-1 relative bg-[#0a0a0a]">
            {loading && (
              <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading chart...</div>
              </div>
            )}

            {/* Debug Panel */}
            <div className="absolute top-4 right-4 z-20 bg-black/90 px-3 py-2 rounded border border-white/20 text-xs text-white space-y-1">
              <div>Container: {containerMounted ? '✅' : '❌'}</div>
              <div>Chart: {chartRef.current ? '✅' : '❌'}</div>
              <div>Series: {candlestickSeriesRef.current ? '✅' : '❌'}</div>
              <div>Candles: {chartData.length}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Symbol: {symbol}</div>
            </div>

            {/* Chart Container */}
            <div
              ref={setChartContainerRef}
              className="w-full"
              style={{ height: '500px' }}
            />

            {chartData.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">No chart data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
