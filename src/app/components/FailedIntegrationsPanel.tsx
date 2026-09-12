'use client';

import OverlayPortal from '@/components/ui/OverlayPortal';
import React, { useState } from 'react';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import { X, RefreshCw, Edit2, FileText, AlertTriangle, TrendingDown, ChevronDown, Download, RotateCcw, Activity, Shield, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FailedIntegration {
  id: string;
  name: string;
  provider: ConnectorType;
  type: string;
  status: 'failed' | 'needs-attention';
  errorMessage: string;
  rootCause: string;
  lastActivity: string;
  errorCount: number;
  logs: { time: string; level: 'error' | 'warn' | 'info'; message: string }[];
}

const FAILED_INTEGRATIONS: FailedIntegration[] = [
  {
    id: 'int-009',
    name: 'Facebook Lead Gen - Retarget',
    provider: 'facebook',
    type: 'Lead Source',
    status: 'failed',
    errorMessage: 'Webhook delivery failed — access token expired',
    rootCause: 'OAuth access token expired on Aug 27, 2026. Facebook requires token refresh every 60 days. No events received in the last 6 hours.',
    lastActivity: '6 hr ago',
    errorCount: 47,
    logs: [
      { time: '10:12 AM', level: 'error', message: 'Token validation failed: access_token expired (code: 190)' },
      { time: '10:11 AM', level: 'error', message: 'Webhook POST /api/fb/leads returned 401 Unauthorized' },
      { time: '10:10 AM', level: 'warn', message: 'Retry attempt 3/3 failed — backing off' },
      { time: '10:08 AM', level: 'info', message: 'Retry attempt 2/3 initiated' },
      { time: '10:05 AM', level: 'error', message: 'Initial webhook delivery failed: HTTP 401' },
    ],
  },
  {
    id: 'int-003',
    name: 'Twilio IVR - Inbound Tier1',
    provider: 'twilio',
    type: 'Telephony / IVR',
    status: 'needs-attention',
    errorMessage: 'Latency above SLA threshold — avg 1,840ms (SLA: 1,000ms)',
    rootCause: 'High call volume spike causing queue saturation. Studio Flow execution time increased due to complex branching logic. 4 of last 10 events exceeded SLA.',
    lastActivity: '2 hr ago',
    errorCount: 12,
    logs: [
      { time: '08:45 AM', level: 'warn', message: 'Event latency: 2,140ms — exceeded SLA threshold of 1,000ms' },
      { time: '08:30 AM', level: 'warn', message: 'Queue depth: 18 pending calls — above normal (avg: 4)' },
      { time: '08:15 AM', level: 'info', message: 'Studio Flow execution: 1,920ms (step: IVR Menu → Agent Transfer)' },
      { time: '08:00 AM', level: 'warn', message: 'Latency spike detected — monitoring escalated' },
    ],
  },
  {
    id: 'int-012',
    name: 'PHP Webhook - Legacy CRM',
    provider: 'php',
    type: 'Developer / API',
    status: 'needs-attention',
    errorMessage: 'Success rate degraded to 72.4% — field schema mismatch',
    rootCause: 'CRM schema updated on Aug 31 — fields "lead_source_v2" and "campaign_ref" are no longer valid. 27.6% of payloads rejected with 422 Unprocessable Entity.',
    lastActivity: '1 day ago',
    errorCount: 23,
    logs: [
      { time: 'Yesterday', level: 'error', message: 'Field validation failed: "lead_source_v2" not in schema (HTTP 422)' },
      { time: 'Yesterday', level: 'error', message: 'Field validation failed: "campaign_ref" deprecated — use "campaign_id"' },
      { time: 'Yesterday', level: 'info', message: '72 of 88 events processed successfully' },
      { time: 'Yesterday', level: 'warn', message: 'Schema mismatch rate: 27.6% — above warning threshold (10%)' },
    ],
  },
];

const ERROR_TREND_DATA = [
  { time: '6h ago', errors: 3 }, { time: '5h ago', errors: 8 }, { time: '4h ago', errors: 12 },
  { time: '3h ago', errors: 7 }, { time: '2h ago', errors: 15 }, { time: '1h ago', errors: 9 },
  { time: 'Now', errors: 13 },
];

const PROVIDER_BREAKDOWN = [
  { name: 'Facebook', errors: 47, color: '#1877F2' },
  { name: 'Twilio', errors: 12, color: '#F22F46' },
  { name: 'PHP', errors: 23, color: '#777BB4' },
];

interface FailedIntegrationsPanelProps {
  onClose: () => void;
}

export default function FailedIntegrationsPanel({ onClose }: FailedIntegrationsPanelProps) {
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState<FailedIntegration | null>(null);
  const [detailTab, setDetailTab] = useState<'summary' | 'logs' | 'health' | 'config'>('summary');
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());

  const filtered = FAILED_INTEGRATIONS.filter((i) => {
    const matchProvider = providerFilter === 'all' || i.provider === providerFilter;
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchProvider && matchStatus;
  });

  const handleRetry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Mock retry action
  };

  const handlePause = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPausedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <OverlayPortal><div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-5xl bg-card shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-danger-bg/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Failed / Degraded Integrations</h2>
              <p className="text-[11px] text-muted-foreground">{FAILED_INTEGRATIONS.length} integrations need attention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-danger text-white rounded-md hover:bg-danger/90 transition-colors">
              <RotateCcw size={12} /> Retry All Failed
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
              <Download size={12} /> Export Error Report
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Table + Widgets */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="relative">
                <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}
                  className="h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                  <option value="all">All Providers</option>
                  <option value="facebook">Facebook</option>
                  <option value="twilio">Twilio</option>
                  <option value="php">PHP</option>
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                  <option value="all">All Status</option>
                  <option value="failed">Failed</option>
                  <option value="needs-attention">Needs Attention</option>
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}
                  className="h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                  <option value="all">Last Activity</option>
                  <option value="1h">Last 1 hour</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="24h">Last 24 hours</option>
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} shown</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-shrink-0">
              <table className="w-full text-[12px]" style={{ minWidth: '600px' }}>
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Integration Name', 'Provider', 'Type', 'Status', 'Error Message', 'Last Activity', 'Actions'].map((h) => (
                      <th key={`fth-${h}`} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedIntegration(item)}
                      className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/40 ${selectedIntegration?.id === item.id ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground text-[12px] leading-tight">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground">{item.id}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <ConnectorIcon type={item.provider} size={20} />
                          <span className="text-[11px] text-muted-foreground">{getConnectorLabel(item.provider)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{item.type}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <p className="text-[11px] text-danger truncate" title={item.errorMessage}>{item.errorMessage}</p>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{item.lastActivity}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => handleRetry(item.id, e)} title="Retry" className="p-1 rounded hover:bg-success-bg text-muted-foreground hover:text-success transition-colors">
                            <RefreshCw size={12} />
                          </button>
                          <button title="Edit Config" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button title="View Logs" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <FileText size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Monitoring Widgets */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Error Trend */}
              <div className="card-base p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={14} className="text-danger" />
                    <h4 className="text-[13px] font-semibold text-foreground">Error Trend (Last 6h)</h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Total: {ERROR_TREND_DATA.reduce((s, d) => s + d.errors, 0)} errors</span>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={ERROR_TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }} />
                    <Area type="monotone" dataKey="errors" stroke="#DC2626" strokeWidth={2} fill="url(#errGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Provider Breakdown */}
              <div className="card-base p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-primary" />
                  <h4 className="text-[13px] font-semibold text-foreground">Provider Breakdown</h4>
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={PROVIDER_BREAKDOWN} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }} />
                    <Bar dataKey="errors" radius={[3, 3, 0, 0]}>
                      {PROVIDER_BREAKDOWN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right: Detail Panel */}
          {selectedIntegration ? (
            <div className="w-80 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 mb-1">
                  <ConnectorIcon type={selectedIntegration.provider} size={22} />
                  <h3 className="text-[13px] font-semibold text-foreground leading-tight">{selectedIntegration.name}</h3>
                </div>
                <StatusBadge status={selectedIntegration.status} size="sm" />
              </div>

              {/* Detail Tabs */}
              <div className="flex border-b border-border">
                {(['summary', 'logs', 'health', 'config'] as const).map((tab) => (
                  <button
                    key={`dtab-${tab}`}
                    onClick={() => setDetailTab(tab)}
                    className={`flex-1 py-2 text-[11px] font-medium capitalize transition-colors border-b-2 -mb-px ${
                      detailTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {detailTab === 'summary' && (
                  <>
                    <div className="p-3 rounded-lg bg-danger-bg border border-danger-border">
                      <div className="flex items-start gap-2">
                        <XCircle size={13} className="text-danger flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-danger mb-1">Error Summary</p>
                          <p className="text-[11px] text-danger/80">{selectedIntegration.errorMessage}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-[11px] font-semibold text-foreground mb-1.5">Root Cause</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{selectedIntegration.rootCause}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[18px] font-bold text-danger font-tabular">{selectedIntegration.errorCount}</p>
                        <p className="text-[10px] text-muted-foreground">Total Errors</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
                        <p className="text-[13px] font-semibold text-foreground">{selectedIntegration.lastActivity}</p>
                        <p className="text-[10px] text-muted-foreground">Last Activity</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="flex items-center justify-center gap-1.5 h-8 text-[12px] font-medium bg-success text-white rounded-md hover:bg-success/90 transition-colors">
                        <RefreshCw size={12} /> Retry Integration
                      </button>
                      <button className="flex items-center justify-center gap-1.5 h-8 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
                        <Edit2 size={12} /> Edit Configuration
                      </button>
                    </div>
                  </>
                )}

                {detailTab === 'logs' && (
                  <div className="space-y-2">
                    {selectedIntegration.logs.map((log, i) => (
                      <div key={`log-${i}`} className={`p-2.5 rounded-lg border text-[11px] ${
                        log.level === 'error' ? 'bg-danger-bg border-danger-border' :
                        log.level === 'warn'? 'bg-warning-bg border-warning-border' : 'bg-info-bg border-info-border'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`font-semibold uppercase text-[10px] ${
                            log.level === 'error' ? 'text-danger' : log.level === 'warn' ? 'text-warning' : 'text-info'
                          }`}>{log.level}</span>
                          <span className="text-muted-foreground ml-auto">{log.time}</span>
                        </div>
                        <p className="text-foreground leading-relaxed">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === 'health' && (
                  <div className="space-y-3">
                    {[
                      { label: 'Connectivity', status: selectedIntegration.status === 'failed' ? 'fail' : 'warn', detail: selectedIntegration.status === 'failed' ? 'Cannot reach endpoint' : 'Intermittent delays' },
                      { label: 'Authentication', status: selectedIntegration.status === 'failed' ? 'fail' : 'pass', detail: selectedIntegration.status === 'failed' ? 'Token expired' : 'Valid credentials' },
                      { label: 'Schema Validation', status: selectedIntegration.provider === 'php' ? 'fail' : 'pass', detail: selectedIntegration.provider === 'php' ? '2 fields invalid' : 'All fields valid' },
                      { label: 'Webhook Delivery', status: selectedIntegration.status === 'failed' ? 'fail' : 'warn', detail: selectedIntegration.status === 'failed' ? 'Delivery failing' : 'Above SLA threshold' },
                    ].map((check) => (
                      <div key={`hc-${check.label}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border">
                        {check.status === 'pass' ? <CheckCircle size={14} className="text-success flex-shrink-0" /> :
                         check.status === 'warn' ? <AlertTriangle size={14} className="text-warning flex-shrink-0" /> :
                         <XCircle size={14} className="text-danger flex-shrink-0" />}
                        <div>
                          <p className="text-[12px] font-medium text-foreground">{check.label}</p>
                          <p className="text-[10px] text-muted-foreground">{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === 'config' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-[11px] font-semibold text-foreground mb-2">Configuration Details</p>
                      <div className="space-y-1.5">
                        {[
                          { key: 'Integration ID', val: selectedIntegration.id },
                          { key: 'Provider', val: getConnectorLabel(selectedIntegration.provider) },
                          { key: 'Type', val: selectedIntegration.type },
                          { key: 'Status', val: selectedIntegration.status },
                          { key: 'Error Count', val: String(selectedIntegration.errorCount) },
                        ].map((row) => (
                          <div key={`cfg-${row.key}`} className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">{row.key}</span>
                            <span className="text-[11px] font-medium text-foreground">{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="flex items-center justify-center gap-1.5 w-full h-8 text-[12px] font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                      <Edit2 size={12} /> Edit Configuration
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-72 flex items-center justify-center text-center p-6">
              <div>
                <Shield size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground">Select an integration</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Click a row to view error details, logs, and health check</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div></OverlayPortal>
  );
}
