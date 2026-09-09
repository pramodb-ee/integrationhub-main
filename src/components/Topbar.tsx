'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, RefreshCw, HelpCircle, ChevronRight } from 'lucide-react';

const routeLabels: Record<string, { label: string; parent?: string }> = {
  '/': { label: 'Integration Center' },
  '/integration-setup-wizard': { label: 'Setup Wizard', parent: 'Integration Center' },
  '/integration-monitoring': { label: 'Monitoring', parent: 'Integration Center' },
};

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const routeInfo = routeLabels[pathname] || { label: 'IntegrationHub' };
  const isIntegrationCenter = pathname === '/';

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 z-30">
      {/* Mobile menu */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        <span className="text-muted-foreground text-[12px] font-medium hidden sm:block">IntegrationHub</span>
        {routeInfo.parent && (
          <>
            <ChevronRight size={12} className="text-muted-foreground hidden sm:block" />
            <span className="text-muted-foreground text-[12px] hidden sm:block">{routeInfo.parent}</span>
          </>
        )}
        <ChevronRight size={12} className="text-muted-foreground hidden sm:block" />
        <span className="font-semibold text-[13px] text-foreground truncate">{routeInfo.label}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      {!isIntegrationCenter && <div className="relative hidden md:block">
        {searchOpen ? (
          <input
            autoFocus
            onBlur={() => setSearchOpen(false)}
            type="text"
            placeholder="Search integrations..."
            className="w-56 lg:w-72 h-8 pl-8 pr-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-8 px-3 text-[12px] text-muted-foreground bg-muted rounded-md border border-border hover:border-primary/40 transition-colors"
          >
            <Search size={13} />
            <span className="hidden lg:block">Search...</span>
            <kbd className="hidden lg:block text-[10px] bg-card border border-border rounded px-1 py-0.5">⌘K</kbd>
          </button>
        )}
        {searchOpen && (
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        )}
      </div>}

      {/* Last updated */}
      {!isIntegrationCenter && <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted rounded-md px-2.5 py-1.5">
        <div className="pulse-dot w-1.5 h-1.5" />
        <span>Live</span>
      </div>}

      {/* Actions */}
      {!isIntegrationCenter && <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors relative" title="Refresh data">
        <RefreshCw size={16} />
      </button>}

      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors relative" title="Notifications">
        <Bell size={16} />
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-danger rounded-full border border-card" />
      </button>

      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="Help">
        <HelpCircle size={16} />
      </button>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" title="Pramod B">
        PB
      </div>
    </header>
  );
}
