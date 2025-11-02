'use client';

import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Trash2, X } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlist-store';

export default function WatchlistsPage() {
  const items = useWatchlistStore((state) => state.items);
  const removeItem = useWatchlistStore((state) => state.removeItem);
  const clear = useWatchlistStore((state) => state.clear);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground">
            Saved tickers persist locally in your browser for quick follow-up.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={items.length === 0}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center space-y-3 bg-card/40">
          <BookmarkPlus className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">No symbols saved yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Open a ticker from the dashboard and click <span className="font-medium">Add to Watchlist</span> to track it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items
            .slice()
            .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
            .map((item) => (
              <div
                key={`${item.symbol}-${item.exchange}`}
                className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-foreground">{item.symbol}</div>
                    <div className="text-xs text-muted-foreground uppercase">{item.exchange}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.symbol, item.exchange)}
                    aria-label={`Remove ${item.symbol}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {item.companyName && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.companyName}</p>
                )}
                {(item.indicatorTitle || item.indicatorValue !== undefined || item.indicatorRank !== undefined) && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    {item.indicatorTitle && (
                      <span className="font-medium text-foreground">{item.indicatorTitle}</span>
                    )}
                    {typeof item.indicatorValue === 'number' && (
                      <span>· Value {item.indicatorValue.toFixed(2)}</span>
                    )}
                    {typeof item.indicatorRank === 'number' && (
                      <span>· Rank #{item.indicatorRank}</span>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Saved{' '}
                  {item.capturedAt
                    ? formatDistanceToNow(new Date(item.capturedAt), { addSuffix: true })
                    : 'just now'}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
