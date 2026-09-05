'use client';

import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, ChevronRight } from 'lucide-react';
import { ERP_REGISTRY, ERPId, ERPDefinition, CATEGORY_ORDER } from './erpRegistry';

// Keep legacy export for backward compat
export type ERPSystem = ERPId;

interface ERPSelectStepProps {
  onSelect: (erp: ERPId) => void;
}

function ERPCard({ erp, onSelect }: { erp: ERPDefinition; onSelect: (id: ERPId) => void }) {
  return (
    <button
      onClick={() => onSelect(erp.id)}
      className="group relative text-left p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${erp.iconBg} flex items-center justify-center flex-shrink-0 font-bold text-[11px] text-gray-700`}>
          {erp.iconText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">{erp.name}</p>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${erp.badgeColor}`}>
              {erp.badge}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{erp.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {erp.features.slice(0, 3).map((f) => (
              <span key={`f-${f}`} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                {f}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function ERPSelectStep({ onSelect }: ERPSelectStepProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ERP_REGISTRY;
    return ERP_REGISTRY.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ERPDefinition[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const erp of filtered) {
      const list = map.get(erp.category);
      if (list) list.push(erp);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [filtered]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-foreground mb-1">Select Integration Source</h2>
        <p className="text-[13px] text-muted-foreground">
          Choose the ERP or API system to integrate with your CRM. Click a card to proceed immediately.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search ERP systems, vendors, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 text-[13px] bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[11px]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-[12px] text-muted-foreground mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
        </p>
      )}

      {/* Grouped Cards */}
      {grouped.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[14px] font-semibold text-foreground mb-1">No results found</p>
          <p className="text-[12px] text-muted-foreground">Try a different search term or browse all systems</p>
          <button onClick={() => setSearch('')} className="mt-3 text-[12px] text-primary hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, erps]) => (
            <div key={`cat-${category}`}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{category}</p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                  {erps.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {erps.map((erp) => (
                  <ERPCard key={erp.id} erp={erp} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-6 pt-4 border-t border-border flex items-center gap-2">
        <CheckCircle size={13} className="text-primary" />
        <p className="text-[11px] text-muted-foreground">
          Selecting an ERP will immediately advance to the authentication step. Architecture is reusable — add new integrations via the ERP registry.
        </p>
      </div>
    </div>
  );
}
