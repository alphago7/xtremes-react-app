'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  BookmarkIcon,
  Bell,
  Filter,
  Settings,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Top Extremes'
  },
  {
    title: 'Explore',
    href: '/explore',
    icon: Search,
    description: 'All Indicators'
  },
  {
    title: 'Watchlists',
    href: '/watchlists',
    icon: BookmarkIcon,
    description: 'Your Lists'
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: Bell,
    description: 'Price Alerts'
  },
  {
    title: 'Screeners',
    href: '/screeners',
    icon: Filter,
    description: 'Saved Queries'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Preferences'
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-teal-400" />
          <span className="text-lg font-semibold text-sidebar-foreground">
            Xtreme Signals
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <div className="flex flex-col">
                <span>{item.title}</span>
                <span className="text-xs opacity-70">{item.description}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-2 text-xs text-sidebar-foreground/60">
          <TrendingUp className="h-4 w-4" />
          <span>Live Market Data</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-bullish animate-pulse" />
        </div>
      </div>
    </div>
  );
}