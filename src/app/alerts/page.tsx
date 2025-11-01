'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus } from 'lucide-react';

export default function AlertsPage() {
  const alerts = [
    {
      id: 1,
      symbol: 'TCS',
      condition: 'RSI > 70',
      status: 'active',
      lastTriggered: null,
    },
    {
      id: 2,
      symbol: 'INFY',
      condition: 'MACD Cross Signal',
      status: 'triggered',
      lastTriggered: '2 hours ago',
    },
    {
      id: 3,
      symbol: 'RELIANCE',
      condition: 'Price > 2500',
      status: 'active',
      lastTriggered: null,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Price Alerts</h1>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Symbol</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Condition</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Triggered</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-border hover:bg-surface/50">
                  <td className="p-4 font-medium">{alert.symbol}</td>
                  <td className="p-4 text-sm">{alert.condition}</td>
                  <td className="p-4">
                    <Badge
                      variant={alert.status === 'triggered' ? 'destructive' : 'default'}
                      className={
                        alert.status === 'active'
                          ? 'bg-bullish/20 text-bullish border-bullish/30'
                          : ''
                      }
                    >
                      {alert.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {alert.lastTriggered || '-'}
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-surface rounded-lg flex items-center space-x-3">
        <Bell className="h-5 w-5 text-warning" />
        <div>
          <p className="text-sm font-medium">Alert Notifications</p>
          <p className="text-xs text-muted-foreground">
            You have 2 active alerts and 1 recently triggered alert
          </p>
        </div>
      </div>
    </div>
  );
}