'use client';

import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleChartPanelProps {
  symbol: string;
  exchange?: string;
  isOpen: boolean;
  onClose: () => void;
}

const TIMEFRAMES = [
  { value: '1M', days: 30 },
  { value: '3M', days: 90 },
  { value: '6M', days: 180 },
  { value: '200D', days: 200 },
  { value: '1Y', days: 365 },
];

export function SimpleChartPanel({ symbol, exchange = 'NSE', isOpen, onClose }: SimpleChartPanelProps) {
  const chartDivRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<any | null>(null);
  const [timeframe, setTimeframe] = useState('200D');
  const [ohlcData, setOhlcData] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize chart once when component mounts
  useEffect(() => {
    let chart: any = null;
    let series: any = null;

    const init = async () => {
      if (!chartDivRef.current) return;

      try {
        const { createChart } = await import('lightweight-charts');

        chart = createChart(chartDivRef.current, {
          width: chartDivRef.current.clientWidth || 800,
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

        series = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        chartInstanceRef.current = { chart, series };
        console.log('✅ Chart initialized');

        // Resize handler
        const resizeObserver = new ResizeObserver(() => {
          if (chart && chartDivRef.current) {
            chart.applyOptions({ width: chartDivRef.current.clientWidth });
          }
        });

        if (chartDivRef.current) {
          resizeObserver.observe(chartDivRef.current);
        }

        return () => {
          resizeObserver.disconnect();
        };
      } catch (err) {
        console.error('Chart init error:', err);
      }
    };

    init();

    return () => {
      if (chart) {
        chart.remove();
        chartInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

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
          const result = await ohlcRes.json();
          if (result.success && result.data) {
            const data = result.data.map((d: any) => ({
              time: d.time,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            }));

            setOhlcData(data);

            // Update chart
            if (chartInstanceRef.current?.series) {
              chartInstanceRef.current.series.setData(data);
              chartInstanceRef.current.chart.timeScale().fitContent();
              console.log(`✅ Set ${data.length} candles`);
            }
          }
        }

        if (infoRes.ok) {
          const info = await infoRes.json();
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl lg:max-w-6xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl font-bold">{symbol}</SheetTitle>
                <Badge variant="outline">{exchange}</Badge>
                {price > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">${price.toFixed(2)}</span>
                    <span className={cn('text-sm', change >= 0 ? 'text-green-500' : 'text-red-500')}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {companyName && <p className="text-sm text-muted-foreground">{companyName}</p>}
          </SheetHeader>

          {/* Timeframe Buttons */}
          <div className="px-6 py-3 border-b shrink-0 flex gap-2">
            {TIMEFRAMES.map(tf => (
              <Button
                key={tf.value}
                size="sm"
                variant={timeframe === tf.value ? 'default' : 'outline'}
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
            <div ref={chartDivRef} style={{ width: '100%', height: '500px' }} />

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
