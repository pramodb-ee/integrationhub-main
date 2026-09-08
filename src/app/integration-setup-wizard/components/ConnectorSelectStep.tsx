'use client';

import React, { useState } from 'react';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { Search, ArrowRight, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface ConnectorEntry {
  type: ConnectorType;
  description: string;
  category: string;
  badge?: string;
}

const CATEGORY_GROUPS: { label: string; connectors: ConnectorEntry[] }[] = [
  {
    label: 'Lead Sources',
    connectors: [
      { type: 'facebook',     description: 'Capture leads from Facebook Lead Ads and Pages',            category: 'Lead Sources' },
      { type: 'google-forms', description: 'Sync responses from Google Forms to your CRM',              category: 'Lead Sources' },
      { type: 'google-ads',   description: 'Pull lead data from Google Ads campaigns',                  category: 'Lead Sources' },
      { type: 'justdial',     description: 'Import leads from JustDial business listings',              category: 'Lead Sources' },
      { type: 'linkedin',     description: 'Capture leads via LinkedIn Lead Gen Forms via Pabbly',      category: 'Lead Sources' },
      { type: 'wordpress',    description: 'Connect WordPress contact and gravity forms',               category: 'Lead Sources' },
    ],
  },
  {
    label: 'Developer / API',
    connectors: [
      { type: 'api',          description: 'Generic REST API connector for custom integrations',        category: 'Developer / API' },
      { type: 'js',           description: 'Embed JavaScript snippet to capture form submissions',      category: 'Developer / API' },
      { type: 'php',          description: 'Server-side PHP webhook integration',                       category: 'Developer / API' },
      { type: 'id-based',     description: 'Map incoming data by unique identifier fields',             category: 'Developer / API' },
    ],
  },
  {
    label: 'Telephony / IVR',
    connectors: [
      { type: 'tata',         description: 'TATA Tele Business Services voice and IVR integration', category: 'Telephony / IVR', badge: 'Vendor' },
      { type: 'exotel',       description: 'Exotel cloud telephony, call flows, and recordings', category: 'Telephony / IVR', badge: 'Vendor' },
      { type: 'knowlarity',   description: 'Knowlarity IVR, call routing, and agent workflows', category: 'Telephony / IVR', badge: 'Vendor' },
      { type: 'ozonetel',     description: 'Ozonetel CloudAgent IVR lead capture',                     category: 'Telephony / IVR', badge: 'Vendor' },
      { type: 'myoperator',   description: 'MyOperator cloud telephony and IVR integration',           category: 'Telephony / IVR', badge: 'Vendor' },
      { type: 'ivr-custom',   description: 'Custom / internal IVR — bring your own vendor',            category: 'Telephony / IVR', badge: 'Custom' },
    ],
  },
  {
    label: 'ERP CRM',
    connectors: [
      { type: 'erp-crm',      description: 'Bidirectional sync with ERP and CRM platforms',            category: 'ERP CRM' },
    ],
  },
  {
    label: 'Automation',
    connectors: [
      { type: 'zapier',       description: 'Connect 5000+ apps through Zapier automation',             category: 'Automation' },
    ],
  },
];

const ALL_CONNECTORS: ConnectorEntry[] = CATEGORY_GROUPS.flatMap((g) => g.connectors);

interface ConnectorSelectStepProps {
  selected: ConnectorType | null;
  onSelect: (type: ConnectorType) => void;
}

export default function ConnectorSelectStep({ selected, onSelect }: ConnectorSelectStepProps) {
  const [search, setSearch] = useState('');
  // Track which category panels are expanded (collapsed by default when connector is selected)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(CATEGORY_GROUPS.map((g) => g.label))
  );

  const selectedConnector = selected ? ALL_CONNECTORS.find((c) => c.type === selected) : null;

  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleSelect = (type: ConnectorType) => {
    onSelect(type);
    // Collapse all panels when a connector is selected (Zoho/Dynamics pattern)
    setExpandedCategories(new Set());
  };

  const filtered = ALL_CONNECTORS.filter((c) => {
    if (!search) return true;
    return (
      getConnectorLabel(c.type).toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  const isSearching = search.trim().length > 0;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[16px] font-semibold text-foreground">Select Integration Type</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Choose a connector to begin. Configuration fields load dynamically based on your selection.
        </p>
      </div>

      {/* Selected connector — auto-highlighted hero card */}
      {selectedConnector && !isSearching && (
        <div className="mb-5 p-4 rounded-xl border-2 border-primary bg-primary/5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
              {selectedConnector.type === 'api' ? 'API Integration Selected' : 'Selected Integration Type'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectorIcon type={selectedConnector.type} size={48} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-foreground">{getConnectorLabel(selectedConnector.type)}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{selectedConnector.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {selectedConnector.category}
                </span>
                {selectedConnector.badge && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                    {selectedConnector.badge}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
              <Zap size={13} />
              Active
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-primary/20">
            Expand a category below to change your selection.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search ${ALL_CONNECTORS.length} connectors...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Search results — flat grid */}
      {isSearching ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filtered.map((connector) => (
              <ConnectorCard
                key={`search-${connector.type}`}
                connector={connector}
                selected={selected}
                onSelect={handleSelect}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-[13px]">
              No connectors match &ldquo;{search}&rdquo;
            </div>
          )}
        </>
      ) : (
        /* Collapsible category panels */
        <div className="space-y-2">
          {CATEGORY_GROUPS.map((group) => {
            const isExpanded = expandedCategories.has(group.label);
            const hasSelected = group.connectors.some((c) => c.type === selected);
            return (
              <div
                key={`panel-${group.label}`}
                className={`rounded-lg border transition-all ${
                  hasSelected
                    ? 'border-primary/30 bg-primary/3' :'border-border bg-card'
                }`}
              >
                {/* Panel header */}
                <button
                  onClick={() => toggleCategory(group.label)}
                  className="flex items-center justify-between w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      {group.connectors.slice(0, 3).map((c) => (
                        <div key={`thumb-${c.type}`} className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                          <ConnectorIcon type={c.type} size={16} />
                        </div>
                      ))}
                      {group.connectors.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
                          <span className="text-[9px] font-bold text-muted-foreground">+{group.connectors.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${hasSelected ? 'text-primary' : 'text-foreground'}`}>
                        {group.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{group.connectors.length} connectors</p>
                    </div>
                    {hasSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        <CheckCircle size={9} />
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {group.connectors.length}
                    </span>
                    {isExpanded
                      ? <ChevronUp size={15} className="text-muted-foreground" />
                      : <ChevronDown size={15} className="text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Panel body — connector grid */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-3">
                      {group.connectors.map((connector) => (
                        <ConnectorCard
                          key={`panel-card-${connector.type}`}
                          connector={connector}
                          selected={selected}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConnectorCard({
  connector,
  selected,
  onSelect,
}: {
  connector: ConnectorEntry;
  selected: ConnectorType | null;
  onSelect: (type: ConnectorType) => void;
}) {
  const isSelected = selected === connector.type;
  return (
    <button
      onClick={() => onSelect(connector.type)}
      className={`group flex flex-col items-start gap-2.5 p-3.5 rounded-lg border transition-all text-left ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-card'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <ConnectorIcon type={connector.type} size={36} />
        <div className="flex items-center gap-1">
          {connector.badge && (
            <span className="text-[9px] font-semibold text-muted-foreground bg-muted border border-border rounded-full px-1.5 py-0.5">
              {connector.badge}
            </span>
          )}
          {isSelected && <CheckCircle size={16} className="text-primary" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">
          {getConnectorLabel(connector.type)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
          {connector.description}
        </p>
        <span className="inline-block mt-1.5 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {connector.category}
        </span>
      </div>
      {!isSelected && (
        <div className="flex items-center gap-1 text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Select <ArrowRight size={10} />
        </div>
      )}
    </button>
  );
}
