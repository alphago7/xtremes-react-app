'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>

      <Tabs defaultValue="general" className="w-full max-w-4xl">
        <TabsList className="bg-surface">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-universe">Default Universe</Label>
                <select
                  id="default-universe"
                  className="w-full px-3 py-2 bg-surface border border-input rounded-md text-sm"
                >
                  <option value="NSE_FO">NSE F&O</option>
                  <option value="NIFTY50">Nifty 50</option>
                  <option value="NIFTY100">Nifty 100</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Auto Refresh Interval (seconds)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  defaultValue="30"
                  className="bg-surface"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">Enable Auto Refresh</Label>
                <Switch id="auto-refresh" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">Data Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="realtime">Enable Realtime Updates</Label>
                <Switch id="realtime" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="cache">Enable Data Caching</Label>
                <Switch id="cache" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>API Status</Label>
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-bullish"></span>
                  <span className="text-sm text-muted-foreground">Connected to Supabase</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alert-notifications">Alert Notifications</Label>
                <Switch id="alert-notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="extreme-notifications">Extreme Value Notifications</Label>
                <Switch id="extreme-notifications" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Play Sound</Label>
                <Switch id="sound" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="bg-teal-900 text-white">Deep Teal</Button>
                  <Button variant="outline">Light</Button>
                  <Button variant="outline">System</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compact">Compact Mode</Label>
                <Switch id="compact" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Enable Animations</Label>
                <Switch id="animations" defaultChecked />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex gap-4">
        <Button className="bg-primary hover:bg-primary-hover">Save Changes</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  );
}