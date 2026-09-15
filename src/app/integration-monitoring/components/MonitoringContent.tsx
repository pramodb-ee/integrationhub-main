'use client';

import React, { useState } from 'react';
import { isRemovedConnector } from '@/app/components/removedConnectors';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MonitoringKPIRow from './MonitoringKPIRow';
import HealthTimelineChart from './HealthTimelineChart';
import ErrorBreakdownChart from './ErrorBreakdownChart';
import LatencyTrendChart from './LatencyTrendChart';
import EventLogTable from './EventLogTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { Search, Filter, RefreshCw, Download, X, ChevronDown, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import TataMonitorStep from '@/app/integration-setup-wizard/components/TataMonitorStep';


const CONNECTOR_TYPES: ConnectorType[] = [
  'facebook', 'google-ads', 'google-forms', 'justdial', 'linkedin',
  'wordpress', 'api', 'js', 'php',
  'twilio', 'mcube', 'ozonetel', 'myoperator', 'cloudtalk', 'ringcentral', 'ivr', 'ivr-custom',
  'erp-crm', 'zapier'
];

export default function MonitoringContent() {
  const searchParams = useSearchParams();

  // When arriving from an integration's "Monitor" button, the URL carries that
  // integration's own real stats — the dashboard locks to it instead of showing
  // the all-integrations mock data, so numbers stay consistent with the table.
  const lockedId = searchParams.get('id');
  const lockedName = searchParams.get('name');
  const lockedType = searchParams.get('type') as ConnectorType | null;
  const lockedStatus = searchParams.get('status');
  const lockedEvents24h = searchParams.get('events24h');
  const lockedSuccessRate = searchParams.get('successRate');
  const lockedLatencyMs = searchParams.get('latencyMs');
  const lockedErrorCount = searchParams.get('errorCount');
  const lockedLastSync = searchParams.get('lastSync');
  const isLocked = Boolean(lockedId && lockedName && lockedType);

  const [statusFilter, setStatusFilter] = useState('all');
  const [connectorFilter, setConnectorFilter] = useState(() => (isLocked && lockedType ? lockedType : 'all'));
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('24h');
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'health' | 'alerts'>('overview');

  if (isRemovedConnector(searchParams.get('type'))) return <div className="card-base p-6"><p>This connector is no longer available.</p><Link href="/" className="mt-4 inline-block text-primary">Back to Integration Center</Link></div>;
  if (isLocked && lockedType === 'tata') {
    return <TataMonitorStep integrationName={lockedName ?? 'TATA Integration'} connectorType="tata" />;
  }

  const stats = isLocked
    ? {
        totalEvents: Number(lockedEvents24h) || 0,
        successRate: Number(lockedSuccessRate) || 0,
        failedCount: Number(lockedErrorCount) || 0,
        avgLatency: Number(lockedLatencyMs) || 0,
        activeIntegrations: lockedStatus === 'active' || lockedStatus === 'healthy' ? 1 : 0,
        p99Latency: Math.round((Number(lockedLatencyMs) || 0) * 2.4),
      }
    : {
        totalEvents: 17842,
        successRate: 96.8,
        failedCount: 67,
        avgLatency: 387,
        activeIntegrations: 10,
        p99Latency: 1280,
      };

  const alertItems = [
    { id: 'alert-001', severity: 'critical', integration: 'Facebook Lead Gen - Retarget', connector: 'facebook' as ConnectorType, message: 'Webhook delivery failed — access token expired. 0 events received in 6h.', time: '6 hr ago' },
    { id: 'alert-002', severity: 'warning', integration: 'IVR Lead Capture - Tier1', connector: 'ivr' as ConnectorType, message: 'Latency above threshold — avg 1,840ms (SLA: 1,000ms). 4 of last 10 events exceeded SLA.', time: '28 min ago' },
    { id: 'alert-003', severity: 'warning', integration: 'PHP Webhook - Legacy CRM', connector: 'php' as ConnectorType, message: 'Success rate degraded to 72.4% — field schema mismatch on 2 fields.', time: '1 day ago' },
  ].filter((alert) => !isLocked || alert.integration === lockedName);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'logs' as const, label: 'Event Logs', icon: Filter },
    { id: 'health' as const, label: 'Health Details', icon: CheckCircle },
    { id: 'alerts' as const, label: 'Alerts', icon: AlertTriangle, badge: alertItems.filter((a) => a.severity === 'critical').length },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">{isLocked ? `${lockedName} Monitoring` : 'Integration Monitoring'}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {isLocked
              ? `Logs, metrics, and activity for ${lockedName}`
              : 'Real-time health, event logs, and performance across all integrations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8 pl-3 pr-7 text-[12px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            >
              {['1h', '6h', '24h', '7d', '14d', '30d'].map((r) => (
                <option key={`dr-${r}`} value={r}>Last {r}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
            <Download size={13} />
            <span className="hidden sm:block">Export Logs</span>
          </button>
          <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
            <RefreshCw size={13} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
      </div>

      {/* Locked-integration banner */}
      {isLocked && lockedType && (
        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-primary/5 border border-primary/20">
          <ConnectorIcon type={lockedType} size={32} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-foreground">{lockedName}</span>
              {lockedStatus && <StatusBadge status={lockedStatus as Parameters<typeof StatusBadge>[0]['status']} size="sm" />}
              <span className="text-[11px] text-muted-foreground">{getConnectorLabel(lockedType)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Showing this integration only{lockedLastSync ? ` · Last sync ${lockedLastSync}` : ''}
            </p>
          </div>
          <Link href="/integration-monitoring" className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
            <X size={12} /> View All Integrations
          </Link>
        </div>
      )}

      {/* KPI Row */}
      <MonitoringKPIRow stats={stats} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={`mtab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="bg-danger text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {isLocked ? (
            <div className="card-base overflow-hidden">
              <div className="px-5 py-3 border-b border-border"><h3 className="text-[14px] font-semibold text-foreground">Integration Activity</h3><p className="text-[11px] text-muted-foreground">Current performance for {lockedName}</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {[['Last Sync', lockedLastSync ?? '—'], ['Connector', lockedType ? getConnectorLabel(lockedType) : '—'], ['Successful Events', Math.max(0, (Number(lockedEvents24h) || 0) - (Number(lockedErrorCount) || 0)).toLocaleString()], ['Failed Events', String(Number(lockedErrorCount) || 0)]].map(([label, value]) => <div key={label} className="p-5"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-[16px] font-semibold text-foreground font-tabular">{value}</p></div>)}
              </div>
            </div>
          ) : (
            <><HealthTimelineChart /><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4"><ErrorBreakdownChart /><LatencyTrendChart /></div></>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card-base overflow-hidden">
          {/* Log filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-foreground">Event Log</h3>
              <p className="text-[11px] text-muted-foreground">All integration events with full traceability</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search events, IDs, error codes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 pr-3 w-52 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {/* Connector filter */}
              <div className="relative">
                <select
                  value={connectorFilter}
                  onChange={(e) => setConnectorFilter(e.target.value)}
                  className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="all">All Connectors</option>
                  {CONNECTOR_TYPES.map((t) => (
                    <option key={`cf-${t}`} value={t}>{t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {(statusFilter !== 'all' || connectorFilter !== 'all' || search) && (
                <button
                  onClick={() => { setStatusFilter('all'); setConnectorFilter('all'); setSearch(''); }}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          </div>
          <EventLogTable
            filters={{ status: statusFilter, connector: connectorFilter, search }}
            lockedIntegrationName={isLocked ? (lockedName ?? undefined) : undefined}
            lockedConnectorType={isLocked ? (lockedType ?? undefined) : undefined}
            lockedLatencyMs={isLocked ? (Number(lockedLatencyMs) || 0) : undefined}
          />
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HealthTimelineChart />
            <LatencyTrendChart />
          </div>
          {/* Per-integration health table */}
          <div className="card-base overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-[14px] font-semibold text-foreground">Per-Integration Health</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]" style={{ minWidth: '700px' }}>
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Integration', 'Connector', 'Success Rate (24h)', 'Avg Latency', 'Events (24h)', 'Last Event', 'Health Score'].map((h) => (
                      <th key={`hth-${h}`} className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(isLocked && lockedType
                    ? [{
                        id: lockedId ?? 'hrow-locked',
                        name: lockedName ?? '',
                        connector: lockedType,
                        successRate: Number(lockedSuccessRate) || 0,
                        latency: Number(lockedLatencyMs) || 0,
                        events: Number(lockedEvents24h) || 0,
                        lastEvent: lockedLastSync ?? '—',
                        score: Math.max(0, Math.min(100, Math.round((Number(lockedSuccessRate) || 0) - (Number(lockedErrorCount) || 0)))),
                      }]
                    : [
                    { id: 'hrow-001', name: 'Facebook Lead Gen - Main', connector: 'facebook' as ConnectorType, successRate: 98.7, latency: 214, events: 1842, lastEvent: '3 min ago', score: 98 },
                    { id: 'hrow-002', name: 'Google Ads - Brand Campaign', connector: 'google-ads' as ConnectorType, successRate: 99.2, latency: 188, events: 2914, lastEvent: '11 min ago', score: 99 },
                    { id: 'hrow-003', name: 'IVR Lead Capture - Tier1', connector: 'ivr' as ConnectorType, successRate: 81.3, latency: 1840, events: 740, lastEvent: '2 hr ago', score: 62 },
                    { id: 'hrow-004', name: 'API Connector - Partner Portal', connector: 'api' as ConnectorType, successRate: 99.8, latency: 92, events: 2340, lastEvent: '8 min ago', score: 100 },
                    { id: 'hrow-005', name: 'Zapier - HubSpot Bridge', connector: 'zapier' as ConnectorType, successRate: 97.4, latency: 342, events: 1980, lastEvent: '1 hr ago', score: 95 },
                    { id: 'hrow-006', name: 'PHP Webhook - Legacy CRM', connector: 'php' as ConnectorType, successRate: 72.4, latency: 2100, events: 88, lastEvent: '1 day ago', score: 48 },
                  ]).map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-2.5"><ConnectorIcon type={row.connector} size={22} /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.successRate >= 95 ? 'bg-success' : row.successRate >= 80 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${row.successRate}%` }}
                            />
                          </div>
                          <span className={`font-semibold font-tabular ${row.successRate >= 95 ? 'text-success' : row.successRate >= 80 ? 'text-warning' : 'text-danger'}`}>
                            {row.successRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`font-semibold font-tabular ${row.latency < 500 ? 'text-success' : row.latency < 1200 ? 'text-warning' : 'text-danger'}`}>
                          {row.latency}ms
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-tabular text-foreground">{row.events.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.lastEvent}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.score >= 90 ? 'bg-success' : row.score >= 70 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${row.score}%` }}
                            />
                          </div>
                          <span className={`text-[12px] font-bold font-tabular ${row.score >= 90 ? 'text-success' : row.score >= 70 ? 'text-warning' : 'text-danger'}`}>
                            {row.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">{alertItems.length} active alerts</p>
            <button className="text-[12px] text-primary hover:underline">Configure alert rules →</button>
          </div>
          {alertItems.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                alert.severity === 'critical' ?'border-danger-border bg-danger-bg/30' :'border-warning-border bg-warning-bg/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-danger-bg' : 'bg-warning-bg'}`}>
                <AlertTriangle size={14} className={alert.severity === 'critical' ? 'text-danger' : 'text-warning'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ConnectorIcon type={alert.connector} size={20} />
                  <span className="text-[13px] font-semibold text-foreground">{alert.integration}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${alert.severity === 'critical' ? 'bg-danger text-white' : 'bg-warning text-white'}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">{alert.message}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[11px] text-muted-foreground">{alert.time}</span>
                <button className="text-[11px] font-medium text-primary hover:underline">Investigate →</button>
              </div>
            </div>
          ))}

          {alertItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-success-bg flex items-center justify-center mb-3">
                <CheckCircle size={22} className="text-success" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-1">No active alerts</h3>
              <p className="text-[13px] text-muted-foreground">All integrations are operating within normal thresholds.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
