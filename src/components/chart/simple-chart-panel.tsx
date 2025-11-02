'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import { useWatchlistStore } from '@/store/watchlist-store';
import { formatDistanceToNow } from 'date-fns';

interface SimpleChartPanelProps {
  symbol: string;
  exchange?: string;
  isOpen: boolean;
  onClose: () => void;
  watchlistMeta?: {
    indicatorKey?: string;
    indicatorTitle?: string;
    indicatorName?: string;
    indicatorValue?: number;
    indicatorRank?: number;
    companyName?: string;
    capturedAt?: string;
  } | null;
}

const TIMEFRAMES = [
  { value: '1M', days: 30 },
  { value: '3M', days: 90 },
  { value: '6M', days: 180 },
  { value: '200D', days: 200 },
  { value: '1Y', days: 365 },
];

type CandlestickWithVolume = CandlestickData & { volume?: number | null };

interface ChartInstance {
  chart: IChartApi;
  series: ISeriesApi<'Candlestick'>;
  volumeSeries?: ISeriesApi<'Histogram'>;
}

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

export function SimpleChartPanel({ symbol, exchange = 'NSE', isOpen, onClose, watchlistMeta }: SimpleChartPanelProps) {
  const chartDivRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ChartInstance | null>(null);
  const latestDataRef = useRef<CandlestickWithVolume[]>([]);
  const [timeframe, setTimeframe] = useState('200D');
  const [ohlcData, setOhlcData] = useState<CandlestickWithVolume[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [chartContainerReady, setChartContainerReady] = useState(false);
  const hasRegisteredContainerRef = useRef(false);

  const addToWatchlist = useWatchlistStore((state) => state.addItem);
  const removeFromWatchlist = useWatchlistStore((state) => state.removeItem);
  const resolvedExchange = exchange || 'NSE';
  const isInWatchlist = useWatchlistStore((state) =>
    state.isInWatchlist(symbol, resolvedExchange)
  );

  useEffect(() => {
    if (watchlistMeta?.companyName) {
      setCompanyName(watchlistMeta.companyName);
    }
  }, [watchlistMeta?.companyName]);

  const handleToggleWatchlist = () => {
    if (!symbol) return;

    if (isInWatchlist) {
      removeFromWatchlist(symbol, resolvedExchange);
    } else {
      addToWatchlist({
        symbol,
        exchange: resolvedExchange,
        companyName: companyName || watchlistMeta?.companyName,
        indicatorKey: watchlistMeta?.indicatorKey,
        indicatorTitle: watchlistMeta?.indicatorTitle,
        indicatorName: watchlistMeta?.indicatorName,
        indicatorValue: watchlistMeta?.indicatorValue,
        indicatorRank: watchlistMeta?.indicatorRank,
        capturedAt: watchlistMeta?.capturedAt,
      });
    }
  };

  const applyDataToChart = (data: CandlestickWithVolume[]) => {
    const instance = chartInstanceRef.current;
    if (!instance?.series) {
      return false;
    }

    const candleData = data.map(({ time, open, high, low, close }) => ({
      time,
      open,
      high,
      low,
      close,
    }));
    instance.series.setData(candleData);

    if (instance.volumeSeries) {
      const volumeData: HistogramData[] = data.map(({ time, volume, open, close }) => ({
        time,
        value: volume ?? 0,
        color: close >= open ? '#10b981' : '#ef4444',
      }));

      instance.volumeSeries.setData(volumeData);
    }

    instance.chart.timeScale().fitContent();
    return true;
  };

  // Callback ref to know when div is mounted
  const setChartDivRef = useCallback((node: HTMLDivElement | null) => {
    if (chartDivRef.current === node) {
      return;
    }

    chartDivRef.current = node;

    if (node) {
      console.log('📍 Chart div mounted');
      if (!hasRegisteredContainerRef.current) {
        hasRegisteredContainerRef.current = true;
        setChartContainerReady(true);
      }
    } else {
      hasRegisteredContainerRef.current = false;
      setChartContainerReady(false);
    }
  }, []);

  // Initialize chart whenever the sheet is open and the container is ready
  useEffect(() => {
    if (!isOpen || !chartContainerReady || !chartDivRef.current || chartInstanceRef.current) {
      console.log('⏸️ Waiting...', {
        chartContainerReady,
        hasDiv: !!chartDivRef.current,
        hasChart: !!chartInstanceRef.current,
        isOpen,
      });
      return;
    }

    console.log('🚀 Starting chart initialization...');

    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    const init = async () => {
      const div = chartDivRef.current;
      if (!div) {
        console.error('❌ Div disappeared');
        return;
      }

      try {
        console.log('📦 Loading lightweight-charts...');
        const lightweightCharts = await import('lightweight-charts');
        if (cancelled) {
          return;
        }
        const createChartFn =
          lightweightCharts.createChart || lightweightCharts.default?.createChart;

        if (!createChartFn) {
          throw new Error('lightweight-charts createChart function not found');
        }
        console.log('✅ Library loaded');

        console.log('🎨 Creating chart...');

        const chart = createChartFn(div, {
          width: div.clientWidth || 800,
          height: 500,
          layout: {
            background: { color: '#0a0a0a' },
            textColor: '#d1d5db',
          },
          grid: {
            vertLines: { color: '#1f2937' },
            horzLines: { color: '#1f2937' },
          },
          timeScale: {
            borderColor: '#374151',
            timeVisible: true,
          },
          rightPriceScale: {
            borderColor: '#374151',
          },
        });

        const candlestickDefinition =
          lightweightCharts.CandlestickSeries || lightweightCharts.default?.CandlestickSeries;

        let series: ISeriesApi<'Candlestick'> | null = null;
        if (chart.addSeries && candlestickDefinition) {
          series = chart.addSeries(candlestickDefinition as never, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
          }) as ISeriesApi<'Candlestick'>;
        } else if (typeof chart.addCandlestickSeries === 'function') {
          series = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
          }) as ISeriesApi<'Candlestick'>;
        } else {
          throw new Error('No candlestick series API available on chart instance');
        }

        let volumeSeries: ISeriesApi<'Histogram'> | null = null;
        const histogramDefinition =
          lightweightCharts.HistogramSeries || lightweightCharts.default?.HistogramSeries;

        if (chart.addSeries && histogramDefinition) {
          volumeSeries = chart.addSeries(histogramDefinition as never, {
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            color: '#2563eb',
            baseLineColor: '#2563eb',
          }) as ISeriesApi<'Histogram'>;
        } else if (typeof chart.addHistogramSeries === 'function') {
          volumeSeries = chart.addHistogramSeries({
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

        if (cancelled) {
          chart.remove();
          return;
        }

        chartInstanceRef.current = {
          chart,
          series,
          volumeSeries: volumeSeries || undefined,
        };

        if (latestDataRef.current.length > 0) {
          applyDataToChart(latestDataRef.current);
        }

        console.log('✅✅✅ Chart initialized successfully!');

        resizeObserver = new ResizeObserver(() => {
          if (chart && div) {
            chart.applyOptions({ width: div.clientWidth });
          }
        });

        if (!cancelled) {
          resizeObserver.observe(div);
        }
      } catch (err) {
        console.error('❌ Chart init error:', err);
      }
    };

    init();

    return () => {
      console.log('🧹 Cleaning up chart...');
      cancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      const instance = chartInstanceRef.current;
      if (instance?.chart) {
        instance.chart.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [chartContainerReady, isOpen]); // Re-run when sheet opens/closes

  useEffect(() => {
    if (ohlcData.length === 0) {
      return;
    }

    applyDataToChart(ohlcData);
  }, [ohlcData]);

  // Fetch data when symbol/timeframe changes
  useEffect(() => {
    if (!isOpen || !symbol) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const days = TIMEFRAMES.find(t => t.value === timeframe)?.days || 200;

        const [ohlcRes, infoRes] = await Promise.all([
          fetch(`/api/chart/ohlc?symbol=${symbol}&exchange=${exchange}&limit=${days}`),
          fetch(`/api/symbol?ticker=${symbol}&exchange=${exchange}`)
        ]);

        if (ohlcRes.ok) {
          const result: OhlcApiResponse = await ohlcRes.json();
          if (result.success && result.data) {
            const responseData = result.data ?? [];
            const data: CandlestickWithVolume[] = responseData.map((d) => ({
              time: d.time,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
              volume: d.volume ?? 0,
            }));

            latestDataRef.current = data;
            setOhlcData(data);

            if (applyDataToChart(data)) {
              console.log(`✅ Set ${data.length} candles`);
            } else {
              console.log('ℹ️ Chart not ready yet; data will be applied once initialized');
            }
          }
        }

        if (infoRes.ok) {
          const info: SymbolInfoResponse = await infoRes.json();
          setCompanyName(info.data?.company_name || '');
        }
      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, exchange, timeframe, isOpen]);

  const price = ohlcData[ohlcData.length - 1]?.close || 0;
  const change = ohlcData.length > 1
    ? ((ohlcData[ohlcData.length - 1].close - ohlcData[ohlcData.length - 2].close) / ohlcData[ohlcData.length - 2].close) * 100
    : 0;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-4xl lg:max-w-6xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl font-bold">{symbol}</SheetTitle>
                  <Badge variant="outline">{resolvedExchange}</Badge>
                  {price > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">${price.toFixed(2)}</span>
                      <span className={cn('text-sm', change >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
                {(companyName || watchlistMeta?.indicatorTitle) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {companyName && <span>{companyName}</span>}
                    {watchlistMeta?.indicatorTitle && (
                      <>
                        <span className="hidden sm:inline">·</span>
                        <span className="font-medium text-foreground">{watchlistMeta.indicatorTitle}</span>
                        {typeof watchlistMeta.indicatorValue === 'number' && (
                          <span>Value {watchlistMeta.indicatorValue.toFixed(2)}</span>
                        )}
                        {typeof watchlistMeta.indicatorRank === 'number' && (
                          <span>Rank #{watchlistMeta.indicatorRank}</span>
                        )}
                        {watchlistMeta.capturedAt && (
                          <span>
                            Snapshot{' '}
                            {formatDistanceToNow(new Date(watchlistMeta.capturedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isInWatchlist ? 'secondary' : 'default'}
                  size="sm"
                  onClick={handleToggleWatchlist}
                  className="h-8"
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Timeframe Buttons */}
          <div className="px-6 py-3 border-b shrink-0 flex gap-2">
            {TIMEFRAMES.map(tf => (
              <Button
                key={tf.value}
                size="sm"
                variant={timeframe === tf.value ? 'default' : 'outline'}
                className={cn(
                  'min-w-[64px] transition-colors',
                  timeframe === tf.value
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 dark:hover:bg-muted/20'
                )}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.value}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <div className="flex-1 relative bg-[#0a0a0a] p-4">
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-white">Loading...</div>
              </div>
            )}

            {/* Always render chart div */}
            <div ref={setChartDivRef} style={{ width: '100%', height: '500px' }} />

            {/* Debug */}
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {ohlcData.length} bars | {chartInstanceRef.current ? 'Chart OK' : 'No Chart'}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
