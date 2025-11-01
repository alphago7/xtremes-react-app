'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ExtremSymbol } from '@/types';
import { cn } from '@/lib/utils';

interface ExtremeCardProps {
  title: string;
  indicator: string;
  description: string;
  symbols: ExtremSymbol[];
  onSymbolClick: (symbol: string) => void;
}

export function ExtremeCard({
  title,
  indicator,
  description,
  symbols,
  onSymbolClick,
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

  const formatValue = (value: number, indicator: string) => {
    if (indicator === 'rsi' || indicator === 'adx') {
      return value.toFixed(1);
    }
    if (indicator === 'cmf' || indicator === 'macd' || indicator === 'bollinger') {
      return value.toFixed(3);
    }
    return value.toFixed(2);
  };

  return (
    <Card className="bg-card border-border hover:border-accent/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline" className="text-xs">
            {indicator.toUpperCase()}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {symbols.map((symbol, index) => (
          <div
            key={symbol.ticker}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-surface/50 cursor-pointer transition-colors"
            onClick={() => onSymbolClick(symbol.ticker)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xs text-muted-foreground w-4">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{symbol.ticker}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {symbol.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn('text-sm font-medium', getExtremeColor(symbol.extreme))}>
                {formatValue(symbol.value, indicator)}
              </span>
              {symbol.change_pct !== undefined && (
                <div className="flex items-center">
                  {symbol.change_pct > 0 ? (
                    <TrendingUp className="h-3 w-3 text-bullish" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                  <span
                    className={cn(
                      'text-xs ml-1',
                      symbol.change_pct > 0 ? 'text-bullish' : 'text-danger'
                    )}
                  >
                    {Math.abs(symbol.change_pct).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}