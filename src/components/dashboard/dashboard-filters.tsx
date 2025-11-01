'use client';

import { useAppStore } from '@/store/app-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { INDICATOR_CATEGORIES, TIME_RANGES, EXCHANGES } from '@/config/indicators';
import { Search, X } from 'lucide-react';

interface DashboardFiltersProps {
  onFilterChange?: () => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const {
    selectedExchange,
    selectedCategory,
    selectedTimeframe,
    setSelectedExchange,
    setSelectedCategory,
    setTimeframe,
    resetFilters,
  } = useAppStore();

  const handleExchangeChange = (value: string) => {
    setSelectedExchange(value as 'NSE' | 'US' | 'ALL');
    onFilterChange?.();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as 'all' | 'momentum' | 'trend' | 'volume' | 'volatility');
    onFilterChange?.();
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'All');
    onFilterChange?.();
  };

  const handleReset = () => {
    resetFilters();
    onFilterChange?.();
  };

  const hasActiveFilters =
    selectedExchange !== 'ALL' ||
    selectedCategory !== 'all' ||
    selectedTimeframe !== '1D';

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Exchange Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Exchange
            </label>
            <Select value={selectedExchange} onValueChange={handleExchangeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXCHANGES.map((exchange) => (
                  <SelectItem key={exchange.value} value={exchange.value}>
                    {exchange.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATOR_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Time Range
            </label>
            <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search - for future use */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Search Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="h-9 pl-8"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Active:</span>
            {selectedExchange !== 'ALL' && (
              <Badge variant="secondary" className="text-xs">
                {EXCHANGES.find((e) => e.value === selectedExchange)?.label}
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {INDICATOR_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
              </Badge>
            )}
            {selectedTimeframe !== '1D' && (
              <Badge variant="secondary" className="text-xs">
                {TIME_RANGES.find((t) => t.value === selectedTimeframe)?.label}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
