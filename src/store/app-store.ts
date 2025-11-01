import { create } from 'zustand';
import { AppState, TableFilters, StockIndicator, Symbol, Watchlist, Alert } from '@/types';

interface AppStore extends AppState {
  // Data
  stockIndicators: StockIndicator[];
  symbols: Symbol[];
  watchlists: Watchlist[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;

  // Actions
  setUniverse: (universe: AppState['selectedUniverse']) => void;
  setTimeframe: (timeframe: AppState['selectedTimeframe']) => void;
  setDate: (date: string) => void;
  setActiveIndicator: (indicator: string) => void;
  setTableFilters: (filters: TableFilters) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setChartDrawerOpen: (open: boolean) => void;
  setSelectedExchange: (exchange: AppState['selectedExchange']) => void;
  setSelectedCategory: (category: AppState['selectedCategory']) => void;

  // Data Actions
  setStockIndicators: (indicators: StockIndicator[]) => void;
  setSymbols: (symbols: Symbol[]) => void;
  setWatchlists: (watchlists: Watchlist[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility Actions
  resetFilters: () => void;
}

const initialFilters: TableFilters = {
  sector: undefined,
  marketCap: undefined,
  priceRange: undefined,
  volumeRange: undefined,
  gapFilter: null,
  beta: undefined,
};

export const useAppStore = create<AppStore>((set) => ({
  // Initial State
  selectedUniverse: 'NSE_FO',
  selectedTimeframe: '1D',
  selectedDate: new Date().toISOString().split('T')[0],
  activeIndicator: 'rsi',
  tableFilters: initialFilters,
  selectedSymbol: null,
  chartDrawerOpen: false,
  selectedExchange: 'ALL',
  selectedCategory: 'all',

  // Data State
  stockIndicators: [],
  symbols: [],
  watchlists: [],
  alerts: [],
  loading: false,
  error: null,

  // Actions
  setUniverse: (universe) => set({ selectedUniverse: universe }),
  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),
  setDate: (date) => set({ selectedDate: date }),
  setActiveIndicator: (indicator) => set({ activeIndicator: indicator }),
  setTableFilters: (filters) => set((state) => ({
    tableFilters: { ...state.tableFilters, ...filters }
  })),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setChartDrawerOpen: (open) => set({ chartDrawerOpen: open }),
  setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  // Data Actions
  setStockIndicators: (indicators) => set({ stockIndicators: indicators }),
  setSymbols: (symbols) => set({ symbols: symbols }),
  setWatchlists: (watchlists) => set({ watchlists: watchlists }),
  setAlerts: (alerts) => set({ alerts: alerts }),
  setLoading: (loading) => set({ loading: loading }),
  setError: (error) => set({ error: error }),

  // Utility Actions
  resetFilters: () => set({
    tableFilters: initialFilters,
    selectedExchange: 'ALL',
    selectedCategory: 'all',
    selectedTimeframe: '1D',
  }),
}));