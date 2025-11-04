'use client';

import { ReactNode } from 'react';
import { SidebarNav } from './sidebar-nav';
import { TopBar } from './top-bar';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { CommandPalette } from '@/components/ui/command-palette';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Command Palette */}
      <CommandPalette />

      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}