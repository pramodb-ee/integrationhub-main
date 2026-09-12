'use client';
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
export default function CollapsibleCard({
  title, subtitle, icon, defaultOpen = false, badge, children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-visible">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-foreground">{title}</p>
            {badge}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="border-t border-border px-5 py-5 rounded-b-xl">{children}</div>}
    </div>
  );
}
