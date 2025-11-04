'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, BarChart3, BookmarkIcon, Bell, Filter, Settings, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'View top extremes and indicators',
      icon: BarChart3,
      action: () => router.push('/'),
      category: 'Navigation',
    },
    {
      id: 'explore',
      title: 'Explore Indicators',
      description: 'Browse all available indicators',
      icon: Search,
      action: () => router.push('/explore'),
      category: 'Navigation',
    },
    {
      id: 'watchlists',
      title: 'Watchlists',
      description: 'View your saved watchlists',
      icon: BookmarkIcon,
      action: () => router.push('/watchlists'),
      category: 'Navigation',
    },
    {
      id: 'alerts',
      title: 'Alerts',
      description: 'Manage price and indicator alerts',
      icon: Bell,
      action: () => router.push('/alerts'),
      category: 'Navigation',
    },
    {
      id: 'screeners',
      title: 'Screeners',
      description: 'View saved screener queries',
      icon: Filter,
      action: () => router.push('/screeners'),
      category: 'Navigation',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Adjust your preferences',
      icon: Settings,
      action: () => router.push('/settings'),
      category: 'Navigation',
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }

      if (!isOpen) return;

      // Navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }

      // Execute command
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    },
    [isOpen, filteredCommands, selectedIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl pointer-events-auto"
            >
              <div className="glass-heavy radius-brutal overflow-hidden shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-accent/20">
                  <Search className="h-5 w-5 text-accent" />
                  <input
                    type="text"
                    placeholder="Type a command or search..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedIndex(0);
                    }}
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground glass-light rounded border border-accent/20">
                    <Command className="h-3 w-3" />K
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {filteredCommands.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      No commands found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredCommands.map((cmd, index) => {
                        const Icon = cmd.icon;
                        const isSelected = index === selectedIndex;

                        return (
                          <motion.button
                            key={cmd.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => {
                              cmd.action();
                              setIsOpen(false);
                              setQuery('');
                              setSelectedIndex(0);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-150',
                              isSelected
                                ? 'bg-accent/20 border border-accent/40'
                                : 'hover:bg-accent/10 border border-transparent'
                            )}
                          >
                            <div
                              className={cn(
                                'p-2 rounded-md transition-colors',
                                isSelected ? 'bg-accent/30 text-accent' : 'bg-accent/10 text-accent/70'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground">{cmd.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {cmd.description}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground px-2 py-1 glass-light rounded border border-accent/10">
                              {cmd.category}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-accent/20 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 glass-light rounded border border-accent/10">↑</kbd>
                      <kbd className="px-1.5 py-0.5 glass-light rounded border border-accent/10">↓</kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 glass-light rounded border border-accent/10">↵</kbd>
                      to select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 glass-light rounded border border-accent/10">esc</kbd>
                      to close
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
