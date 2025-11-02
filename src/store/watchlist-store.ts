'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WatchlistItem {
  symbol: string;
  exchange: string;
  companyName?: string;
  indicatorKey?: string;
  indicatorTitle?: string;
  indicatorName?: string;
  indicatorValue?: number;
  indicatorRank?: number;
  capturedAt: string;
}

export interface WatchlistItemInput {
  symbol: string;
  exchange: string;
  companyName?: string;
  indicatorKey?: string;
  indicatorTitle?: string;
  indicatorName?: string;
  indicatorValue?: number;
  indicatorRank?: number;
  capturedAt?: string;
}

interface WatchlistState {
  items: WatchlistItem[];
  addItem: (item: WatchlistItemInput) => void;
  removeItem: (symbol: string, exchange: string) => void;
  clear: () => void;
  isInWatchlist: (symbol: string, exchange: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const exists = state.items.some(
            (existing) =>
              existing.symbol.toUpperCase() === item.symbol.toUpperCase() &&
              existing.exchange.toUpperCase() === item.exchange.toUpperCase()
          );

          if (exists) {
            return state;
          }

          const newItem: WatchlistItem = {
            ...item,
            symbol: item.symbol.toUpperCase(),
            exchange: item.exchange.toUpperCase(),
            capturedAt: item.capturedAt ?? new Date().toISOString(),
          };

          return { items: [...state.items, newItem] };
        }),
      removeItem: (symbol, exchange) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.symbol.toUpperCase() === symbol.toUpperCase() &&
                item.exchange.toUpperCase() === exchange.toUpperCase()
              )
          ),
        })),
      clear: () => set({ items: [] }),
      isInWatchlist: (symbol, exchange) =>
        get().items.some(
          (item) =>
            item.symbol.toUpperCase() === symbol.toUpperCase() &&
            item.exchange.toUpperCase() === exchange.toUpperCase()
        ),
    }),
    {
      name: 'xtreme-watchlist',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ items: state.items }),
    }
  )
);
