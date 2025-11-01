'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Play } from 'lucide-react';

export default function ScreenersPage() {
  const screeners = [
    {
      id: 1,
      name: 'Bullish Breakout',
      description: 'RSI > 60 AND ADX > 25 AND Price > 20 EMA',
      matches: 12,
      lastRun: '5 mins ago',
    },
    {
      id: 2,
      name: 'Oversold Bounce',
      description: 'RSI < 30 AND CMF > 0 AND Volume > Avg',
      matches: 8,
      lastRun: '15 mins ago',
    },
    {
      id: 3,
      name: 'Momentum Leaders',
      description: 'MACD > Signal AND BB Upper Break AND ADX > 30',
      matches: 5,
      lastRun: '1 hour ago',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Screeners</h1>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          New Screener
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screeners.map((screener) => (
          <div
            key={screener.id}
            className="bg-card p-5 rounded-lg border border-border hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg">{screener.name}</h3>
              <Badge variant="outline" className="text-xs">
                {screener.matches} matches
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-4 font-mono">
              {screener.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Last run: {screener.lastRun}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Filter className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary-hover">
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-surface p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Quick Filters</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">RSI Extremes</Button>
          <Button variant="outline" size="sm">Volume Spikes</Button>
          <Button variant="outline" size="sm">Trend Strength</Button>
          <Button variant="outline" size="sm">Bollinger Squeeze</Button>
          <Button variant="outline" size="sm">MACD Cross</Button>
          <Button variant="outline" size="sm">Gap Up/Down</Button>
        </div>
      </div>
    </div>
  );
}