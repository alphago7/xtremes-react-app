'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { ExtremSymbol } from '@/types';
import { cn } from '@/lib/utils';

interface SymbolClickMeta {
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

interface ExtremeCardProps {
  title: string;
  indicator: string;
  description: string;
  highSymbols: ExtremSymbol[];
  lowSymbols: ExtremSymbol[];
  onSymbolClick: (symbol: string, options?: string | SymbolClickMeta) => void;
  category?: string;
  latestValue?: number;
  formatValue?: (value: number) => string;
  highIndicatorKey?: string;
  lowIndicatorKey?: string;
  highLabel?: string;
  lowLabel?: string;
}

// Simple sparkline component
function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg
      width="60"
      height="20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="inline-block"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className={cn(isPositive ? 'text-bullish' : 'text-danger')}
      />
    </svg>
  );
}

export function ExtremeCard({
  title,
  indicator,
  description,
  highSymbols,
  lowSymbols,
  onSymbolClick,
  category,
  latestValue,
  formatValue,
  highIndicatorKey,
  lowIndicatorKey,
  highLabel = 'Highest',
  lowLabel = 'Lowest',
}: ExtremeCardProps) {
  const [view, setView] = useState<'high' | 'low'>('high');

  const symbols = view === 'high' ? highSymbols : lowSymbols;
  const indicatorKey = view === 'high' ? highIndicatorKey : lowIndicatorKey;
  const getExtremeColor = (extreme: string | null) => {
    if (!extreme) return 'text-neutral-flow-start';
    if (extreme.includes('overbought') || extreme.includes('strong_buying')) {
      return 'text-bearish-critical';
    }
    if (extreme.includes('oversold') || extreme.includes('strong_selling')) {
      return 'text-bullish-active';
    }
    return 'text-neutral-flow-start';
  };

  const getSignalIntensity = (value: number, indicator: string) => {
    // Map indicator value to signal intensity (0-100%)
    // This determines which color spectrum to use
    if (indicator === 'rsi') {
      if (value > 70) return 'explosive'; // Overbought extreme
      if (value > 60) return 'active';
      if (value < 30) return 'explosive'; // Oversold extreme
      if (value < 40) return 'active';
      return 'calm';
    }
    return 'calm';
  };

  const defaultFormatValue = (value: number, indicator: string) => {
    if (indicator === 'rsi' || indicator === 'adx') {
      return value.toFixed(1);
    }
    if (indicator === 'cmf' || indicator === 'macd' || indicator === 'bollinger') {
      return value.toFixed(3);
    }
    return value.toFixed(2);
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'momentum':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'trend':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'volume':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'volatility':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card variant="glass" className="overflow-hidden texture-grain">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>{title}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs glass-heavy">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Badge variant="outline" className={cn('text-xs backdrop-blur-sm shrink-0', getCategoryColor(category))}>
            {category?.toUpperCase() || indicator.toUpperCase()}
          </Badge>
        </div>

        {/* Toggle Control */}
        <div className="inline-flex items-center rounded-lg bg-muted/50 p-1 gap-1">
          <button
            onClick={() => setView('high')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              view === 'high'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowUp className="h-3 w-3" />
            {highLabel}
          </button>
          <button
            onClick={() => setView('low')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              view === 'low'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowDown className="h-3 w-3" />
            {lowLabel}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {symbols.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          symbols.map((symbol, index) => (
            <motion.div
              key={symbol.ticker}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/10 cursor-pointer transition-all duration-150 group hover:scale-[1.01]"
              whileHover={{ x: 4 }}
              onClick={() =>
                onSymbolClick(symbol.ticker, {
                  exchange: symbol.exchange,
                  meta: {
                    indicatorKey,
                    indicatorTitle: title,
                    indicatorName: indicator,
                    indicatorValue: symbol.value,
                    indicatorRank: index + 1,
                    companyName: symbol.company_name,
                    capturedAt: symbol.captured_at ?? undefined,
                  },
                })
              }
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground w-4 shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-accent transition-colors">
                    {symbol.ticker}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {symbol.company_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                {/* Sparkline */}
                {symbol.sparkline && symbol.sparkline.length > 0 && (
                  <div className="hidden md:block">
                    <MiniSparkline data={symbol.sparkline} />
                  </div>
                )}

                {/* Value */}
                <div className="flex flex-col items-end">
                  <span className={cn('text-sm font-medium tabular-nums', getExtremeColor(symbol.extreme))}>
                    {formatValue ? formatValue(symbol.value) : defaultFormatValue(symbol.value, indicator)}
                  </span>

                  {/* Change Percentage */}
                  {symbol.change_pct !== undefined && (
                    <div className="flex items-center">
                      {symbol.change_pct > 0 ? (
                        <TrendingUp className="h-3 w-3 text-bullish" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-danger" />
                      )}
                      <span
                        className={cn(
                          'text-xs ml-1 tabular-nums',
                          symbol.change_pct > 0 ? 'text-bullish' : 'text-danger'
                        )}
                      >
                        {Math.abs(symbol.change_pct).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
