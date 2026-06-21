'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/utils/cn';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <Header sidebarCollapsed={collapsed} />
      <main
        className={cn(
          'transition-all duration-300 pt-16',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6 min-h-[calc(100vh-64px)]">{children}</div>
      </main>
    </div>
  );
}
