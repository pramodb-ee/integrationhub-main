'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, HelpCircle, ChevronRight } from 'lucide-react';

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

  const routeInfo = routeLabels[pathname] || { label: 'IntegrationHub' };

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
