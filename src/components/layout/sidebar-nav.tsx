'use client';

import { motion } from 'framer-motion';
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
    <div className="flex h-full w-64 flex-col glass border-r border-sidebar-border backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BarChart3 className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-sidebar-foreground">
            Xtreme Signals
          </span>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                  'hover:bg-accent/10 hover:text-accent hover:scale-[1.02]',
                  isActive
                    ? 'bg-primary/20 text-accent border-l-2 border-l-accent'
                    : 'text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-accent/5"
                    layoutId="activeNav"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110", isActive && "text-accent")} />
                <div className="flex flex-col relative z-10">
                  <span>{item.title}</span>
                  <span className="text-xs opacity-70">{item.description}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <motion.div
          className="flex items-center space-x-2 text-xs text-sidebar-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <TrendingUp className="h-4 w-4 text-bullish-active" />
          <span>Live Market Data</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-bullish-active pulse-glow" />
        </motion.div>
      </div>
    </div>
  );
}