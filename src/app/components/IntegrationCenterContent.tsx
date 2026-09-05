'use client';

import React, { useState } from 'react';
import IntegrationKPIGrid from './IntegrationKPIGrid';
import IntegrationTable, { Integration } from './IntegrationTable';
import ConnectorDistributionChart from './ConnectorDistributionChart';
import IntegrationActivityFeed from './IntegrationActivityFeed';
import IntegrationCatalogModal from './IntegrationCatalogModal';
import FailedIntegrationsPanel from './FailedIntegrationsPanel';
import ConversionAPIPanel from './ConversionAPIPanel';
import TataIntegrationPopup from './TataIntegrationPopup';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import ConnectorIcon, { getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { Plus, Search, Download, RefreshCw, X, ChevronDown, AlertTriangle, Zap, LayoutGrid, List, Activity, Edit2, ExternalLink } from 'lucide-react';

const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int-001', name: 'Facebook Lead Gen - Main',       type: 'facebook',     status: 'healthy',         lastSync: '3 min ago',  events24h: 1842, successRate: 98.7, latencyMs: 214,  owner: 'Pramod Bhujbal', created: 'Aug 12, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-002', name: 'Google Ads - Brand Campaign',    type: 'google-ads',   status: 'healthy',         lastSync: '11 min ago', events24h: 2914, successRate: 99.2, latencyMs: 188,  owner: 'Pramod Bhujbal', created: 'Jul 28, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-003', name: 'Twilio IVR - Inbound Tier1',     type: 'twilio',       status: 'needs-attention', lastSync: '2 hr ago',   events24h: 740,  successRate: 81.3, latencyMs: 1840, owner: 'Kavya Iyer',    created: 'Aug 1, 2026',  environment: 'production', errorCount: 12 },
  { id: 'int-004', name: 'Zapier - HubSpot Bridge',        type: 'zapier',       status: 'active',          lastSync: '1 hr ago',   events24h: 1980, successRate: 97.4, latencyMs: 342,  owner: 'Meera Nair',    created: 'Sep 1, 2026',  environment: 'production', errorCount: 0 },
  { id: 'int-005', name: 'JustDial - Premium Leads',       type: 'justdial',     status: 'healthy',         lastSync: '1 hr ago',   events24h: 620,  successRate: 96.8, latencyMs: 290,  owner: 'Rahul Verma',   created: 'Aug 5, 2026',  environment: 'production', errorCount: 0 },
  { id: 'int-006', name: 'WordPress CF7 - Contact',        type: 'wordpress',    status: 'active',          lastSync: '45 min ago', events24h: 560,  successRate: 94.1, latencyMs: 410,  owner: 'Sneha Patel',   created: 'Jul 15, 2026', environment: 'staging',    errorCount: 2 },
  { id: 'int-007', name: 'LinkedIn Ads - APAC',            type: 'linkedin',     status: 'paused',          lastSync: '3 hr ago',   events24h: 0,    successRate: 0,    latencyMs: 0,    owner: 'Pramod Bhujbal', created: 'Aug 20, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-008', name: 'ERP CRM - Salesforce Sync',      type: 'erp-crm',      status: 'healthy',         lastSync: '4 hr ago',   events24h: 420,  successRate: 100,  latencyMs: 156,  owner: 'Pramod Bhujbal', created: 'Jun 10, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-009', name: 'Facebook Lead Gen - Retarget',   type: 'facebook',     status: 'failed',          lastSync: '6 hr ago',   events24h: 0,    successRate: 0,    latencyMs: 0,    owner: 'Kavya Iyer',    created: 'Aug 18, 2026', environment: 'production', errorCount: 47 },
  { id: 'int-010', name: 'API Connector - Partner Portal', type: 'api',          status: 'healthy',         lastSync: '8 min ago',  events24h: 2340, successRate: 99.8, latencyMs: 92,   owner: 'Rahul Verma',   created: 'Jul 2, 2026',  environment: 'production', errorCount: 0 },
  { id: 'int-011', name: 'Google Forms - Event Reg',       type: 'google-forms', status: 'mapping-pending', lastSync: 'Never',      events24h: 0,    successRate: 0,    latencyMs: 0,    owner: 'Meera Nair',    created: 'Sep 1, 2026',  environment: 'development', errorCount: 0 },
  { id: 'int-012', name: 'PHP Webhook - Legacy CRM',       type: 'php',          status: 'needs-attention', lastSync: '1 day ago',  events24h: 88,   successRate: 72.4, latencyMs: 2100, owner: 'Sneha Patel',   created: 'May 3, 2026',  environment: 'production', errorCount: 23 },
  { id: 'int-014', name: 'JS Embed - Landing Page A',      type: 'js',           status: 'active',          lastSync: '22 min ago', events24h: 184,  successRate: 95.6, latencyMs: 380,  owner: 'Pramod Bhujbal', created: 'Aug 8, 2026',  environment: 'production', errorCount: 0 },
  { id: 'int-015', name: 'Ozonetel IVR - Support Line',    type: 'ozonetel',     status: 'healthy',         lastSync: '18 min ago', events24h: 310,  successRate: 97.1, latencyMs: 420,  owner: 'Kavya Iyer',    created: 'Aug 22, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-016', name: 'MyOperator - Sales Queue',       type: 'myoperator',   status: 'active',          lastSync: '35 min ago', events24h: 195,  successRate: 93.8, latencyMs: 510,  owner: 'Rahul Verma',   created: 'Sep 1, 2026',  environment: 'production', errorCount: 0 },
  { id: 'int-017', name: 'RingCentral - Enterprise UCaaS', type: 'ringcentral',  status: 'setup-pending',   lastSync: 'Never',      events24h: 0,    successRate: 0,    latencyMs: 0,    owner: 'Meera Nair',    created: 'Sep 2, 2026',  environment: 'staging',    errorCount: 0 },
  { id: 'int-018', name: 'TATA - Sales Hotline',          type: 'tata',          status: 'healthy',         lastSync: '6 min ago',  events24h: 426,  successRate: 98.9, latencyMs: 260, owner: 'Pramod Bhujbal', created: 'Sep 3, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-019', name: 'Exotel - Lead Capture',          type: 'exotel',        status: 'active',          lastSync: '14 min ago', events24h: 318,  successRate: 97.6, latencyMs: 340, owner: 'Kavya Iyer',    created: 'Sep 3, 2026', environment: 'production', errorCount: 0 },
  { id: 'int-020', name: 'Knowlarity - Support IVR',      type: 'knowlarity',    status: 'healthy',         lastSync: '21 min ago', events24h: 205,  successRate: 96.8, latencyMs: 390, owner: 'Rahul Verma',   created: 'Sep 4, 2026', environment: 'production', errorCount: 0 },
];

const STATUS_FILTERS = [
  'all', 'healthy', 'needs-attention', 'failed', 'active', 'paused', 'setup-pending', 'mapping-pending'
] as const;

const TYPE_CATEGORY_MAP: Record<string, string> = {
  facebook: 'Lead Sources', 'google-forms': 'Lead Sources', 'google-ads': 'Lead Sources',
  justdial: 'Lead Sources', linkedin: 'Lead Sources', wordpress: 'Lead Sources',
  api: 'Developer / API', js: 'Developer / API', php: 'Developer / API', 'id-based': 'Developer / API',
  ivr: 'Telephony / IVR', twilio: 'Telephony / IVR', ozonetel: 'Telephony / IVR',
  myoperator: 'Telephony / IVR', cloudtalk: 'Telephony / IVR', ringcentral: 'Telephony / IVR', 'ivr-custom': 'Telephony / IVR',
  tata: 'Telephony / IVR', exotel: 'Telephony / IVR', knowlarity: 'Telephony / IVR',
  'erp-crm': 'ERP CRM',
  zapier: 'Automation',
};

/* ── Integration Detail Modal ── */
function IntegrationDetailModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const envColor = (env: string) => {
    if (env === 'production') return 'text-success bg-success-bg border-success-border';
    if (env === 'staging') return 'text-warning bg-warning-bg border-warning-border';
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <ConnectorIcon type={integration.type} size={36} />
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">{integration.name}</h3>
              <p className="text-[12px] text-muted-foreground">{integration.id} · {getConnectorLabel(integration.type)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={integration.status} size="sm" />
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${envColor(integration.environment)}`}>
              {integration.environment}
            </span>
            <span className="text-[12px] text-muted-foreground">Created {integration.created}</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Events (24h)', value: integration.events24h.toLocaleString() },
              { label: 'Success Rate', value: integration.successRate > 0 ? `${integration.successRate}%` : '—' },
              { label: 'Avg Latency', value: integration.latencyMs > 0 ? `${integration.latencyMs}ms` : '—' },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-[18px] font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {[
              { label: 'Owner', value: integration.owner },
              { label: 'Last Sync', value: integration.lastSync },
              { label: 'Category', value: TYPE_CATEGORY_MAP[integration.type] ?? 'Other' },
              { label: 'Error Count', value: String(integration.errorCount ?? 0) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-[12px] text-muted-foreground">{row.label}</span>
                <span className="text-[12px] font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20 rounded-b-xl">
          <a href="/integration-monitoring" className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <Activity size={13} /> Monitor
          </a>
          <a href="/integration-setup-wizard" className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <Edit2 size={13} /> Edit
          </a>
          <button onClick={onClose} className="ml-auto h-8 px-4 text-[12px] font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Grid Card ── */
function IntegrationGridCard({ integration, onViewDetails, onOpenTata }: { integration: Integration; onViewDetails: (i: Integration) => void; onOpenTata: () => void }) {
  const envColor = (env: string) => {
    if (env === 'production') return 'text-success bg-success-bg border-success-border';
    if (env === 'staging') return 'text-warning bg-warning-bg border-warning-border';
    return 'text-muted-foreground bg-muted border-border';
  };
  const isTelephony = ['ivr', 'tata', 'exotel', 'knowlarity', 'twilio', 'ozonetel', 'myoperator', 'cloudtalk', 'ringcentral', 'ivr-custom'].includes(integration.type);

  return (
    <div onClick={integration.type === 'tata' ? onOpenTata : undefined} role={integration.type === 'tata' ? 'button' : undefined} tabIndex={integration.type === 'tata' ? 0 : undefined} onKeyDown={(event) => { if (integration.type === 'tata' && (event.key === 'Enter' || event.key === ' ')) onOpenTata(); }} className={`card-base p-4 flex flex-col gap-3 hover:shadow-md transition-shadow ${integration.type === 'tata' ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ConnectorIcon type={integration.type} size={32} />
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-1">{integration.name}</p>
            <p className="text-[11px] text-muted-foreground">{getConnectorLabel(integration.type)}</p>
          </div>
        </div>
        <StatusBadge status={integration.status} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-[14px] font-bold text-foreground">{integration.events24h > 0 ? integration.events24h.toLocaleString() : '—'}</p>
          <p className="text-[9px] text-muted-foreground">Events/24h</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className={`text-[14px] font-bold ${integration.successRate >= 95 ? 'text-success' : integration.successRate >= 80 ? 'text-warning' : 'text-danger'}`}>
            {integration.successRate > 0 ? `${integration.successRate}%` : '—'}
          </p>
          <p className="text-[9px] text-muted-foreground">Success</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className={`text-[14px] font-bold ${integration.latencyMs < 300 ? 'text-success' : integration.latencyMs < 800 ? 'text-warning' : 'text-danger'}`}>
            {integration.latencyMs > 0 ? `${integration.latencyMs}ms` : '—'}
          </p>
          <p className="text-[9px] text-muted-foreground">Latency</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{integration.owner}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${envColor(integration.environment)}`}>
          {integration.environment}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-border">
        <span className="text-[10px] text-muted-foreground flex-1">Last sync: {integration.lastSync}</span>
        {isTelephony && <Link href={`/integration-setup-wizard?type=${integration.type}`} onClick={(event) => event.stopPropagation()}><button className="h-6 px-2 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded hover:bg-primary/20">Test</button></Link>}
        <button onClick={(event) => { event.stopPropagation(); onViewDetails(integration); }} className="flex items-center gap-1 h-6 px-2 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors"><ExternalLink size={10} /> Manage</button>
      </div>
    </div>
  );
}

export default function IntegrationCenterContent() {
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [failedPanelOpen, setFailedPanelOpen] = useState(false);
  const [conversionAPIPanelOpen, setConversionAPIPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [detailIntegration, setDetailIntegration] = useState<Integration | null>(null);
  const [tataPopupOpen, setTataPopupOpen] = useState(false);

  const handleDelete = (id: string) => {
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  const stats = {
    totalIntegrations: integrations.length,
    activeIntegrations: integrations.filter((i) => ['healthy', 'active'].includes(i.status)).length,
    failedIntegrations: integrations.filter((i) => ['failed', 'needs-attention'].includes(i.status)).length,
    avgLatency: 387,
    eventsToday: 17842,
    needsAttention: integrations.filter((i) => ['failed', 'needs-attention'].includes(i.status)).length,
  };

  const filtered = integrations.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.owner.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchType = typeFilter === 'all' || i.type === typeFilter;
    const matchCategory = categoryFilter === 'all' || TYPE_CATEGORY_MAP[i.type] === categoryFilter;
    return matchSearch && matchStatus && matchType && matchCategory;
  });

  const uniqueTypes = Array.from(new Set(integrations.map((i) => i.type)));
  const uniqueCategories = Array.from(new Set(Object.values(TYPE_CATEGORY_MAP)));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Integration Center</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {MOCK_INTEGRATIONS.length} integrations configured · Last refreshed Sep 2, 2026 at 6:43 AM · Admin: <span className="font-medium text-foreground">Pramod Bhujbal (PB)</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConversionAPIPanelOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground"
          >
            <Zap size={13} className="text-primary" />
            <span className="hidden sm:block">Conversion API</span>
          </button>
          <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
            <Download size={13} />
            <span className="hidden sm:block">Export</span>
          </button>
          <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
            <RefreshCw size={13} />
            <span className="hidden sm:block">Refresh</span>
          </button>
          <button
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={14} />
            Add Integration
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {stats.needsAttention > 0 && (
        <div className="flex items-center gap-3 p-3 bg-danger-bg border border-danger-border rounded-lg text-[12px]">
          <div className="pulse-dot-red flex-shrink-0" />
          <span className="font-semibold text-danger">
            {stats.needsAttention} integration{stats.needsAttention > 1 ? 's' : ''} need immediate attention
          </span>
          <span className="text-muted-foreground">— Twilio IVR latency above SLA, PHP Webhook degraded</span>
          <button
            onClick={() => setFailedPanelOpen(true)}
            className="ml-auto flex items-center gap-1.5 text-danger font-semibold hover:underline whitespace-nowrap"
          >
            <AlertTriangle size={12} />
            View Failed →
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <IntegrationKPIGrid stats={stats} />

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
        <div className="lg:col-span-3 2xl:col-span-3">
          <ConnectorDistributionChart />
        </div>
        <div className="lg:col-span-2 2xl:col-span-2">
          <IntegrationActivityFeed />
        </div>
      </div>

      {/* Integration List / Grid */}
      <div className="card-base overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-foreground">All Integrations</h3>
            <p className="text-[11px] text-muted-foreground">{filtered.length} of {MOCK_INTEGRATIONS.length} shown</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-3 w-48 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setTypeFilter('all'); }}
                className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((c) => (
                  <option key={`catf-${c}`} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={`sf-${s}`} value={s}>
                    {s === 'all' ? 'All Status' : s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((t) => (
                  <option key={`tf-${t}`} value={t}>{t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Active filters */}
            {(statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || search) && (
              <div className="flex items-center gap-1.5">
                {statusFilter !== 'all' && (
                  <span className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    <StatusBadge status={statusFilter as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
                    <button onClick={() => setStatusFilter('all')}><X size={10} /></button>
                  </span>
                )}
                <button
                  onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setCategoryFilter('all'); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X size={11} /> Clear all
                </button>
              </div>
            )}

            {/* Failed integrations quick access */}
            {stats.needsAttention > 0 && (
              <button
                onClick={() => setFailedPanelOpen(true)}
                className="flex items-center gap-1.5 h-8 px-2.5 text-[12px] font-medium bg-danger-bg border border-danger-border text-danger rounded-md hover:bg-danger/10 transition-colors"
              >
                <AlertTriangle size={12} />
                {stats.needsAttention} Failed
              </button>
            )}

            {/* View mode toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center w-8 h-8 transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center w-8 h-8 transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* List or Grid view */}
        {viewMode === 'list' ? (
          <IntegrationTable
            integrations={filtered}
            loading={loading}
            onViewDetails={(i) => setDetailIntegration(i)}
            onOpenTata={() => setTataPopupOpen(true)}
            onDelete={handleDelete}
          />
        ) : (
          <div className="p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-[14px]">No integrations found</p>
                <p className="text-[12px] mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((integration) => (
                  <IntegrationGridCard
                    key={integration.id}
                    integration={integration}
                    onViewDetails={(i) => setDetailIntegration(i)}
                    onOpenTata={() => setTataPopupOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals & Panels */}
      <IntegrationCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
      {failedPanelOpen && <FailedIntegrationsPanel onClose={() => setFailedPanelOpen(false)} />}
      {conversionAPIPanelOpen && <ConversionAPIPanel onClose={() => setConversionAPIPanelOpen(false)} />}
      {detailIntegration && <IntegrationDetailModal integration={detailIntegration} onClose={() => setDetailIntegration(null)} />}
      <TataIntegrationPopup open={tataPopupOpen} onClose={() => setTataPopupOpen(false)} />
    </div>
  );
}