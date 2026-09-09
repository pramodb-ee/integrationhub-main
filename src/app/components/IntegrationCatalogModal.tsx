'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { Search, ArrowRight, Star, Zap, Plus, ChevronDown, CheckCircle, X } from 'lucide-react';

interface CatalogEntry {
  type: ConnectorType;
  description: string;
  popular?: boolean;
  category: string;
  badge?: string;
  isCustom?: boolean;
  customName?: string;
}

const CATALOG_CATEGORIES = [
  {
    id: 'lead-sources',
    label: 'Lead Sources',
    description: 'Capture leads from advertising and listing platforms',
    connectors: [
      { type: 'facebook' as ConnectorType,     description: 'Capture leads from Facebook Lead Ads and Pages',            popular: true  },
      { type: 'google-forms' as ConnectorType, description: 'Sync responses from Google Forms to your CRM',               popular: true  },
      { type: 'google-ads' as ConnectorType,   description: 'Pull lead data from Google Ads campaigns',                   popular: true  },
      { type: 'justdial' as ConnectorType,     description: 'Import leads from JustDial business listings',               popular: true  },
      { type: 'linkedin' as ConnectorType,     description: 'Capture leads via LinkedIn Lead Gen Forms (Pabbly)',          popular: true  },
      { type: 'wordpress' as ConnectorType,    description: 'Connect WordPress contact and gravity forms'                              },
    ],
  },
  {
    id: 'developer-api',
    label: 'Developer / API',
    description: 'Code-level and API-based integrations',
    connectors: [
      { type: 'api' as ConnectorType,          description: 'Generic REST API connector for custom integrations',          popular: true  },
      { type: 'js' as ConnectorType,           description: 'Embed JavaScript snippet to capture form submissions'                     },
      { type: 'php' as ConnectorType,          description: 'Server-side PHP webhook integration'                                      },
      { type: 'id-based' as ConnectorType,     description: 'Map incoming data by unique identifier fields'                            },
    ],
  },
  {
    id: 'telephony',
    label: 'Telephony / IVR',
    description: 'Inbound call tracking and IVR lead capture',
    connectors: [
      { type: 'tata' as ConnectorType,         description: 'TATA Tele Business Services voice and IVR integration',             popular: true, badge: 'Vendor' },
      { type: 'exotel' as ConnectorType,       description: 'Exotel cloud telephony, call flows, and recordings',              popular: true, badge: 'Vendor' },
      { type: 'knowlarity' as ConnectorType,   description: 'Knowlarity IVR, call routing, and agent workflows',                         badge: 'Vendor' },
      { type: 'ozonetel' as ConnectorType,     description: 'Ozonetel CloudAgent IVR lead capture',                                    badge: 'Vendor' },
      { type: 'myoperator' as ConnectorType,   description: 'MyOperator cloud telephony and IVR integration',                          badge: 'Vendor' },
      { type: 'ivr-custom' as ConnectorType,   description: 'Custom / internal IVR — bring your own vendor',                          badge: 'Custom' },
    ],
  },
  {
    id: 'erp-crm',
    label: 'ERP CRM',
    description: 'Enterprise resource planning and CRM sync',
    connectors: [
      { type: 'erp-crm' as ConnectorType,      description: 'Bidirectional sync with ERP and CRM platforms'                           },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    description: 'Workflow automation and app connectors',
    connectors: [
      { type: 'zapier' as ConnectorType,       description: 'Connect 5000+ apps through Zapier automation',               popular: true  },
    ],
  },
];

const CONNECTOR_TYPE_OPTIONS: { value: ConnectorType; label: string }[] = [
  { value: 'api', label: 'REST API' },
  { value: 'js', label: 'JavaScript Embed' },
  { value: 'php', label: 'PHP Webhook' },
  { value: 'facebook', label: 'Facebook Lead Ads' },
  { value: 'google-forms', label: 'Google Forms' },
  { value: 'google-ads', label: 'Google Ads' },
  { value: 'tata', label: 'TATA Telephony' },
  { value: 'exotel', label: 'Exotel' },
  { value: 'knowlarity', label: 'Knowlarity' },
  { value: 'ozonetel', label: 'Ozonetel IVR' },
  { value: 'myoperator', label: 'MyOperator' },
  { value: 'zapier', label: 'Zapier' },
  { value: 'erp-crm', label: 'ERP / CRM' },
  { value: 'ivr-custom', label: 'Custom IVR' },
];

const ALL_CONNECTORS: CatalogEntry[] = CATALOG_CATEGORIES.flatMap((cat) =>
  cat.connectors.map((c) => ({ ...c, category: cat.label }))
);

interface AddConnectorFormProps {
  onSave: (connector: CatalogEntry) => void;
  onCancel: () => void;
}

function AddConnectorForm({ onSave, onCancel }: AddConnectorFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ConnectorType>('api');
  const [description, setDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaved(true);
    setTimeout(() => {
      onSave({
        type,
        description: description || `Custom ${name} connector`,
        category: 'Custom',
        badge: 'Custom',
        isCustom: true,
        customName: name,
      });
    }, 800);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-full bg-success-bg border border-success-border flex items-center justify-center">
          <CheckCircle size={24} className="text-success" />
        </div>
        <p className="text-[14px] font-semibold text-foreground">Connector saved!</p>
        <p className="text-[12px] text-muted-foreground">"{name}" has been added to your connector list.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Plus size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-foreground">Configure New Connector</p>
          <p className="text-[11px] text-muted-foreground">Set up a custom connector with your credentials</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[12px] font-medium text-foreground mb-1.5">
          Connector Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Custom CRM"
          required
          className="w-full h-9 px-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-[12px] font-medium text-foreground mb-1.5">Connector Type</label>
        <div className="relative">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ConnectorType)}
            className="w-full h-9 pl-3 pr-8 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
          >
            {CONNECTOR_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[12px] font-medium text-foreground mb-1.5">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this connector"
          className="w-full h-9 px-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Credentials */}
      <div className="p-3.5 rounded-lg border border-border bg-muted/30">
        <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide mb-3">Credentials</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">API Key / Token</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full h-8 px-3 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Endpoint URL</label>
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full h-8 px-3 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
          Save Connector
        </button>
      </div>
    </form>
  );
}

interface IntegrationCatalogModalProps {
  open: boolean;
  onClose: () => void;
  presentation?: 'modal' | 'drawer';
}

export default function IntegrationCatalogModal({ open, onClose, presentation = 'modal' }: IntegrationCatalogModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customConnectors, setCustomConnectors] = useState<CatalogEntry[]>([]);
  const drawerBodyRef = useRef<HTMLDivElement>(null);

  const allConnectors = [...ALL_CONNECTORS, ...customConnectors];

  const filtered = allConnectors.filter((c) => {
    const label = c.customName || getConnectorLabel(c.type);
    const matchSearch =
      label.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleSelect = (type: ConnectorType) => {
    onClose();
    if (type === 'erp-crm') {
      router.push('/erp-integration-wizard');
      return;
    }
    router.push(`/integration-setup-wizard?type=${type}`);
  };

  const handleSaveConnector = (connector: CatalogEntry) => {
    setCustomConnectors((prev) => [...prev, connector]);
    setShowAddForm(false);
  };

  const totalCount = allConnectors.length;
  const categories = [...CATALOG_CATEGORIES.map((c) => c.label), ...(customConnectors.length > 0 ? ['Custom'] : [])];
  const closeCatalog = useCallback(() => {
    setShowAddForm(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open || presentation !== 'drawer') return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCatalog();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerBodyRef.current?.scrollTo({ top: 0 });
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeCatalog, open, presentation]);

  const catalogContent = (
    <>
      {showAddForm ? (
        <AddConnectorForm
          onSave={handleSaveConnector}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <>
          {/* Search + Add Connector button row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search connectors, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-all whitespace-nowrap shadow-sm"
            >
              <Plus size={14} />
              Add Connector
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1.5 flex-wrap mb-5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                activeCategory === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              All ({totalCount})
            </button>
            {categories.map((cat) => {
              const count = allConnectors.filter((c) => c.category === cat).length;
              return (
                <button
                  key={`catpill-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                    activeCategory === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Custom connectors banner */}
          {customConnectors.length > 0 && (activeCategory === 'all' || activeCategory === 'Custom') && (
            <div className="mb-5 p-3 rounded-lg border border-success-border bg-success-bg/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={13} className="text-success" />
                <p className="text-[11px] font-semibold text-success uppercase tracking-wide">Custom Connectors ({customConnectors.length})</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {customConnectors.map((connector, idx) => (
                  <CatalogCard
                    key={`custom-card-${idx}`}
                    connector={connector}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grouped view when no search and "all" selected */}
          {!search && activeCategory === 'all' ? (
            <div className="space-y-6">
              {CATALOG_CATEGORIES.map((cat) => (
                <div key={`catgroup-${cat.id}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-[12px] font-semibold text-foreground uppercase tracking-wide">{cat.label}</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{cat.connectors.length}</span>
                    <span className="text-[11px] text-muted-foreground">— {cat.description}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {cat.connectors.map((connector) => (
                      <CatalogCard
                        key={`cat-card-${connector.type}`}
                        connector={{ ...connector, category: cat.label }}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filtered.filter((c) => !c.isCustom).map((connector, idx) => (
                  <CatalogCard key={`flat-card-${connector.type}-${idx}`} connector={connector} onSelect={handleSelect} />
                ))}
              </div>
              {filtered.filter((c) => !c.isCustom).length === 0 && !customConnectors.some((c) => filtered.includes(c)) && (
                <div className="text-center py-10 text-muted-foreground text-[13px]">
                  No connectors match &ldquo;{search}&rdquo;
                </div>
              )}
            </>
          )}

          {/* Bottom Add Connector CTA */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">
              Don&apos;t see your connector? Add a custom one.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold border border-primary text-primary rounded-md hover:bg-primary/5 transition-all"
            >
              <Plus size={13} />
              Add Connector
            </button>
          </div>
        </>
      )}
    </>
  );

  if (presentation === 'drawer') {
    if (!open) return null;
    const title = showAddForm ? 'Add New Connector' : 'Add New Integration';
    const subtitle = showAddForm
      ? 'Configure a custom connector with your credentials'
      : `Choose from ${totalCount} connectors across categories`;

    return (
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="integration-catalog-title">
        <button
          type="button"
          aria-label="Close integration panel"
          onClick={closeCatalog}
          className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[1px]"
        />
        <aside className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-card shadow-2xl md:w-[50vw]">
          <div className="flex min-h-[76px] flex-shrink-0 items-start justify-between border-b border-border bg-card px-5 py-4 sm:px-6">
            <div>
              <h2 id="integration-catalog-title" className="text-[17px] font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={closeCatalog}
              className="ml-4 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close integration panel"
            >
              <X size={18} />
            </button>
          </div>
          <div ref={drawerBodyRef} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{catalogContent}</div>
        </aside>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={closeCatalog}
      title={showAddForm ? 'Add New Connector' : 'Add New Integration'}
      subtitle={showAddForm ? 'Configure a custom connector with your credentials' : `Choose from ${totalCount} connectors across categories`}
      size="2xl"
    >
      {catalogContent}
    </Modal>
  );
}

function CatalogCard({
  connector,
  onSelect,
}: {
  connector: CatalogEntry;
  onSelect: (type: ConnectorType) => void;
}) {
  const displayName = connector.customName || getConnectorLabel(connector.type);
  const isTelephony = connector.category === 'Telephony / IVR';
  const isConnected = isTelephony && ['tata', 'exotel'].includes(connector.type);
  return (
    <button
      onClick={() => onSelect(connector.type)}
      className="group flex flex-col items-start gap-2.5 p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-card-hover transition-all text-left"
    >
      <div className="flex items-center justify-between w-full">
        <ConnectorIcon type={connector.type} size={36} />
        <div className="flex items-center gap-1">
          {connector.badge && (
            <span className={`text-[9px] font-semibold rounded-full px-1.5 py-0.5 border ${
              connector.badge === 'Custom' ?'text-primary bg-primary/10 border-primary/20' :'text-muted-foreground bg-muted border-border'
            }`}>
              {connector.badge}
            </span>
          )}
          {connector.popular && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-warning bg-warning-bg border border-warning-border rounded-full px-1.5 py-0.5">
              <Star size={8} />
              Popular
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">
          {displayName}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
          {connector.description}
        </p>
      </div>
      {isTelephony && (
        <div className={`flex items-center gap-1 text-[10px] font-medium ${isConnected ? 'text-success' : 'text-muted-foreground'}`}>
          <span className="text-[13px] leading-none">{isConnected ? '●' : '○'}</span>
          {isConnected ? 'Connected' : 'Not Connected'}
        </div>
      )}
      <div className="flex items-center gap-1 text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <Zap size={10} />
        {isTelephony && isConnected ? 'Configure' : 'Connect'}
        <ArrowRight size={10} />
      </div>
    </button>
  );
}
