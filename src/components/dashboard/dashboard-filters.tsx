'use client';

import { useAppStore } from '@/store/app-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INDICATOR_CATEGORIES, EXCHANGES } from '@/config/indicators';

interface DashboardFiltersProps {
  onFilterChange?: () => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const {
    selectedExchange,
    selectedCategory,
    setSelectedExchange,
    setSelectedCategory,
  } = useAppStore();

  const handleExchangeChange = (value: string) => {
    setSelectedExchange(value as 'NSE' | 'US' | 'ALL');
    onFilterChange?.();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as 'all' | 'momentum' | 'trend' | 'volume' | 'volatility');
    onFilterChange?.();
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      <Select value={selectedExchange} onValueChange={handleExchangeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Exchange" />
        </SelectTrigger>
        <SelectContent>
          {EXCHANGES.map((exchange) => (
            <SelectItem key={exchange.value} value={exchange.value}>
              {exchange.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
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
  );
}
