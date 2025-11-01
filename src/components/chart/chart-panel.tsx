'use client';

import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';

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

type CandlestickWithVolume = CandlestickData & { volume?: number | null };

interface OhlcApiResponse {
  success: boolean;
  data: CandlestickWithVolume[];
  meta?: Record<string, unknown>;
}

interface SymbolInfoResponse {
  data?: {
    company_name?: string;
  };
}

export function ChartPanel({ symbol, exchange = 'NSE', isOpen, onClose }: ChartPanelProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState('200D');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<CandlestickWithVolume[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [containerMounted, setContainerMounted] = useState(false);

  // Track when container ref is set and initialize chart immediately
  const setChartContainerRef = (node: HTMLDivElement | null) => {
    chartContainerRef.current = node;

    if (node && isOpen && !chartRef.current) {
      console.log('[REF] Container ref set, initializing chart immediately...');
      setContainerMounted(true);

      // Initialize chart immediately
      (async () => {
        try {
          console.log('[INIT] Container dimensions:', node.clientWidth, 'x', node.clientHeight);
          console.log('[INIT] Loading lightweight-charts...');

          const lightweightCharts = await import('lightweight-charts');
          const createChartFn = lightweightCharts.createChart || lightweightCharts.default?.createChart;

          if (!createChartFn) {
            throw new Error('lightweight-charts createChart function not found');
          }
          console.log('[INIT] lightweight-charts loaded ✅');

          console.log('[INIT] Creating chart instance...');
          const chart = createChartFn(node, {
            layout: {
              background: { color: '#0a0a0a' },
              textColor: '#d1d5db',
            },
            grid: {
              vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
              horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
            },
            width: node.clientWidth,
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
          const candlestickDefinition =
            lightweightCharts.CandlestickSeries || lightweightCharts.default?.CandlestickSeries;

          let candlestickSeries: ISeriesApi<'Candlestick'> | null = null;

          if (chart.addSeries && candlestickDefinition) {
            candlestickSeries = chart.addSeries(candlestickDefinition as never, {
              upColor: '#10b981',
              downColor: '#ef4444',
              borderVisible: false,
              wickUpColor: '#10b981',
              wickDownColor: '#ef4444',
            }) as ISeriesApi<'Candlestick'>;
          } else if (typeof chart.addCandlestickSeries === 'function') {
            candlestickSeries = chart.addCandlestickSeries({
              upColor: '#10b981',
              downColor: '#ef4444',
              borderVisible: false,
              wickUpColor: '#10b981',
              wickDownColor: '#ef4444',
            }) as ISeriesApi<'Candlestick'>;
          } else {
            throw new Error('No candlestick series API available on chart instance');
          }

          const histogramDefinition =
            lightweightCharts.HistogramSeries || lightweightCharts.default?.HistogramSeries;

          let histogramSeries: ISeriesApi<'Histogram'> | null = null;

          if (chart.addSeries && histogramDefinition) {
            histogramSeries = chart.addSeries(histogramDefinition as never, {
              priceFormat: { type: 'volume' },
              priceScaleId: '',
              color: '#2563eb',
            }) as ISeriesApi<'Histogram'>;
          } else if (typeof chart.addHistogramSeries === 'function') {
            histogramSeries = chart.addHistogramSeries({
              priceFormat: { type: 'volume' },
              priceScaleId: '',
              color: '#2563eb',
            }) as ISeriesApi<'Histogram'>;
          }

          if (chart.priceScale && typeof chart.priceScale === 'function') {
            const volumeScale = chart.priceScale('');
            volumeScale?.applyOptions?.({
              scaleMargins: {
                top: 0.8,
                bottom: 0,
              },
            });
          }

          chartRef.current = chart;
          candlestickSeriesRef.current = candlestickSeries;
          volumeSeriesRef.current = histogramSeries;

          console.log('[INIT] Chart ready! ✅');

          // Setup resize observer
          resizeObserverRef.current = new ResizeObserver(entries => {
            if (chart && entries.length > 0) {
              const { width } = entries[0].contentRect;
              chart.applyOptions({ width });
            }
          });
          resizeObserverRef.current.observe(node);

          // If data is already loaded, set it now
          if (chartData.length > 0) {
            console.log('[INIT] Data already loaded, setting to chart...');
            const candleData: CandlestickData[] = chartData.map(
              ({ time, open, high, low, close }) => ({
                time,
                open,
                high,
                low,
                close,
              })
            );
            candlestickSeries.setData(candleData);
            chart.timeScale().fitContent();
          }
        } catch (error) {
          console.error('[INIT] Error:', error);
        }
      })();
    } else if (!node) {
      setContainerMounted(false);
    }
  };

  // Cleanup when panel closes
  useEffect(() => {
    if (!isOpen) {
      console.log('[CLEANUP] Panel closed, cleaning up...');
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
      setContainerMounted(false);
      setChartData([]);
    }
  }, [isOpen]);

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
          const result: OhlcApiResponse = await ohlcRes.json();
          console.log(`[DATA] Got ${result.data?.length || 0} candles`);

          if (result.success && result.data && result.data.length > 0) {
            const formattedData: CandlestickWithVolume[] = result.data.map((item) => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
              volume: item.volume ?? 0,
            }));

            setChartData(formattedData);

            // Set data to chart (with retries if needed)
            const setDataToChart = (retries = 0) => {
              if (candlestickSeriesRef.current) {
                console.log('[DATA] Setting data to chart...');
                const candleData: CandlestickData[] = formattedData.map(
                  ({ time, open, high, low, close }) => ({
                    time,
                    open,
                    high,
                    low,
                    close,
                  })
                );
                candlestickSeriesRef.current.setData(candleData);

                if (volumeSeriesRef.current) {
                  const volumeData: HistogramData[] = formattedData.map(({ time, volume, open, close }) => ({
                    time,
                    value: volume ?? 0,
                    color: close >= open ? '#10b981' : '#ef4444',
                  }));

                  volumeSeriesRef.current.setData(volumeData);
                }

                chartRef.current?.timeScale().fitContent();
                console.log('[DATA] Chart updated ✅');
              } else if (retries < 5) {
                console.log(`[DATA] Chart not ready, retry ${retries + 1}/5 in 300ms...`);
                setTimeout(() => setDataToChart(retries + 1), 300);
              } else {
                console.error('[DATA] Chart never became ready after 5 retries');
              }
            };

            setDataToChart();
          }
        }

        if (symbolRes.ok) {
          const symbolData: SymbolInfoResponse = await symbolRes.json();
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
