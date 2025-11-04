'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppState } from '@/types';

const universeOptions = [
  { value: 'NSE_FO', label: 'NSE F&O' },
  { value: 'NIFTY50', label: 'Nifty 50' },
  { value: 'NIFTY100', label: 'Nifty 100' },
  { value: 'CUSTOM', label: 'Custom' },
];

const timeframeOptions = [
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: '1Y', label: '1 Year' },
];

export function TopBar() {
  const {
    selectedUniverse,
    selectedTimeframe,
    selectedDate,
    setUniverse,
    setTimeframe,
    setDate,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleUniverseChange = (value: string) =>
    setUniverse(value as AppState['selectedUniverse']);
  const handleTimeframeChange = (value: string) =>
    setTimeframe(value as AppState['selectedTimeframe']);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Refresh data from API
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="h-16 flex items-center px-6 border-b border-border glass backdrop-blur-xl">
      <div className="flex items-center flex-1 space-x-4">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
          <Input
            type="text"
            placeholder="Search by symbol or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-light border-accent/20 focus:border-accent transition-all duration-200"
          />
        </div>

        {/* Universe Selector */}
        <Select value={selectedUniverse} onValueChange={handleUniverseChange}>
          <SelectTrigger className="w-32 glass-light border-accent/20 hover:border-accent/40 transition-all duration-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-heavy">
            {universeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Timeframe Selector */}
        <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-28 glass-light border-accent/20 hover:border-accent/40 transition-all duration-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-heavy">
            {timeframeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Selector */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="pl-10 w-40 glass-light border-accent/20 focus:border-accent transition-all duration-200"
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          className="glass-light border-accent/20 hover:border-accent hover:bg-accent/10"
        >
          <RefreshCw
            className={cn(
              'h-4 w-4',
              isRefreshing && 'animate-spin'
            )}
          />
        </Button>
      </div>

      {/* Right side indicators */}
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Last Update: </span>
          <span className="text-foreground font-medium tabular-nums">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center space-x-2 glass-light px-3 py-1.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-bullish-active pulse-glow" />
          <span className="text-sm text-bullish-active font-medium">Market Open</span>
        </div>
      </div>
    </div>
  );
}
