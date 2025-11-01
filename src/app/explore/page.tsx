'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ExplorePage() {
  const indicators = ['RSI', 'ADX', 'Bollinger', 'MACD', 'CMF', 'OBV', 'ATR'];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Explore Indicators</h1>

      <Tabs defaultValue="RSI" className="w-full">
        <TabsList className="bg-surface">
          {indicators.map((indicator) => (
            <TabsTrigger key={indicator} value={indicator}>
              {indicator}
            </TabsTrigger>
          ))}
        </TabsList>

        {indicators.map((indicator) => (
          <TabsContent key={indicator} value={indicator}>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">{indicator} Analysis</h2>
              <p className="text-muted-foreground">
                {indicator} indicator analysis and distribution charts will be displayed here.
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}