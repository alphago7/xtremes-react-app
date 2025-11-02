'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
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
  symbols: ExtremSymbol[];
  onSymbolClick: (symbol: string, options?: string | SymbolClickMeta) => void;
  category?: string;
  latestValue?: number;
  formatValue?: (value: number) => string;
  indicatorKey?: string;
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
  symbols,
  onSymbolClick,
  category,
  latestValue,
  formatValue,
  indicatorKey,
}: ExtremeCardProps) {
  const getExtremeColor = (extreme: string | null) => {
    if (!extreme) return 'text-neutral';
    if (extreme.includes('overbought') || extreme.includes('strong_buying')) {
      return 'text-danger';
    }
    if (extreme.includes('oversold') || extreme.includes('strong_selling')) {
      return 'text-bullish';
    }
    return 'text-neutral';
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
    <Card className="bg-card border-border hover:border-accent/50 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>{title}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={cn('text-xs', getCategoryColor(category))}>
              {category?.toUpperCase() || indicator.toUpperCase()}
            </Badge>
            {latestValue !== undefined && (
              <span className="text-xs font-medium text-muted-foreground">
                {formatValue ? formatValue(latestValue) : latestValue.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {symbols.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No data available
          </div>
        ) : (
          symbols.map((symbol, index) => (
            <div
              key={symbol.ticker}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-surface/50 cursor-pointer transition-all duration-150 group"
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
                    capturedAt: symbol.captured_at,
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
