'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WatchlistsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Watchlists</h1>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          New Watchlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">High Momentum</h3>
          <p className="text-sm text-muted-foreground mb-3">12 stocks</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-surface px-2 py-1 rounded">TCS</span>
            <span className="text-xs bg-surface px-2 py-1 rounded">INFY</span>
            <span className="text-xs bg-surface px-2 py-1 rounded">RELIANCE</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">Oversold Watch</h3>
          <p className="text-sm text-muted-foreground mb-3">8 stocks</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-surface px-2 py-1 rounded">WIPRO</span>
            <span className="text-xs bg-surface px-2 py-1 rounded">HDFC</span>
            <span className="text-xs bg-surface px-2 py-1 rounded">SBIN</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border hover:border-accent/50 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">Breakout Candidates</h3>
          <p className="text-sm text-muted-foreground mb-3">15 stocks</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-surface px-2 py-1 rounded">MARUTI</span>
            <span className="text-xs bg-surface px-2 py-1 rounded">TITAN</span>
            <span className="text-xs bg-surface px-2 py-1 rounded">ITC</span>
          </div>
        </div>
      </div>
    </div>
  );
}