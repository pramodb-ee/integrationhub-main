'use client';

import React, { useState } from 'react';
import ConnectorIcon, { ConnectorType } from '@/components/ui/ConnectorIcon';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Eye, RotateCcw, ChevronUp, ChevronDown, ArrowUpDown, X } from 'lucide-react';

interface EventLog {
  id: string;
  timestamp: string;
  integrationName: string;
  connectorType: ConnectorType;
  eventType: string;
  status: 'success' | 'warning' | 'error' | 'info';
  payloadSize: string;
  latencyMs: number;
  errorCode?: string;
  retries: number;
  owner: string;
  environment: 'production' | 'staging' | 'development';
}

// Backend integration point: replace with GET /api/events/logs?page=1&limit=20
const MOCK_LOGS: EventLog[] = [
  { id: 'evt-2026090115000001', timestamp: 'Sep 1, 3:00:01 PM', integrationName: 'Facebook Lead Gen - Main', connectorType: 'facebook', eventType: 'lead.created', status: 'success', payloadSize: '2.4 KB', latencyMs: 198, retries: 0, owner: 'Priya Mehta', environment: 'production' },
  { id: 'evt-2026090114590012', timestamp: 'Sep 1, 2:59:12 PM', integrationName: 'Google Ads - Brand Campaign', connectorType: 'google-ads', eventType: 'lead.created', status: 'success', payloadSize: '1.8 KB', latencyMs: 172, retries: 0, owner: 'Arjun Sharma', environment: 'production' },
  { id: 'evt-2026090114580034', timestamp: 'Sep 1, 2:58:34 PM', integrationName: 'IVR Lead Capture - Tier1', connectorType: 'ivr', eventType: 'call.completed', status: 'warning', payloadSize: '3.1 KB', latencyMs: 1840, errorCode: 'LATENCY_HIGH', retries: 0, owner: 'Kavya Iyer', environment: 'production' },
  { id: 'evt-2026090114570045', timestamp: 'Sep 1, 2:57:45 PM', integrationName: 'Facebook Lead Gen - Retarget', connectorType: 'facebook', eventType: 'webhook.delivery', status: 'error', payloadSize: '2.1 KB', latencyMs: 0, errorCode: 'TOKEN_EXPIRED', retries: 3, owner: 'Kavya Iyer', environment: 'production' },
  { id: 'evt-2026090114560058', timestamp: 'Sep 1, 2:56:58 PM', integrationName: 'API Connector - Partner Portal', connectorType: 'api', eventType: 'lead.created', status: 'success', payloadSize: '0.9 KB', latencyMs: 88, retries: 0, owner: 'Rahul Verma', environment: 'production' },
  { id: 'evt-2026090114550067', timestamp: 'Sep 1, 2:55:07 PM', integrationName: 'Zapier - HubSpot Bridge', connectorType: 'zapier', eventType: 'zap.trigger', status: 'success', payloadSize: '4.2 KB', latencyMs: 324, retries: 0, owner: 'Meera Nair', environment: 'production' },
  { id: 'evt-2026090114540078', timestamp: 'Sep 1, 2:54:18 PM', integrationName: 'JustDial - Premium Leads', connectorType: 'justdial', eventType: 'lead.created', status: 'success', payloadSize: '1.6 KB', latencyMs: 284, retries: 0, owner: 'Rahul Verma', environment: 'production' },
  { id: 'evt-2026090114530089', timestamp: 'Sep 1, 2:53:29 PM', integrationName: 'PHP Webhook - Legacy CRM', connectorType: 'php', eventType: 'webhook.received', status: 'error', payloadSize: '1.2 KB', latencyMs: 0, errorCode: 'SCHEMA_MISMATCH', retries: 2, owner: 'Sneha Patel', environment: 'production' },
  { id: 'evt-2026090114520091', timestamp: 'Sep 1, 2:52:11 PM', integrationName: 'ERP CRM - Salesforce Sync', connectorType: 'erp-crm', eventType: 'sync.completed', status: 'success', payloadSize: '18.4 KB', latencyMs: 142, retries: 0, owner: 'Priya Mehta', environment: 'production' },
  { id: 'evt-2026090114510102', timestamp: 'Sep 1, 2:51:02 PM', integrationName: 'WordPress CF7 - Contact', connectorType: 'wordpress', eventType: 'form.submitted', status: 'success', payloadSize: '1.1 KB', latencyMs: 398, retries: 0, owner: 'Sneha Patel', environment: 'staging' },
  { id: 'evt-2026090114500113', timestamp: 'Sep 1, 2:50:13 PM', integrationName: 'JS Embed - Landing Page A', connectorType: 'js', eventType: 'form.submitted', status: 'warning', payloadSize: '0.7 KB', latencyMs: 620, errorCode: 'DUPLICATE_LEAD', retries: 0, owner: 'Priya Mehta', environment: 'production' },
  { id: 'evt-2026090114490124', timestamp: 'Sep 1, 2:49:24 PM', integrationName: 'Google Ads - Brand Campaign', connectorType: 'google-ads', eventType: 'lead.created', status: 'success', payloadSize: '1.9 KB', latencyMs: 181, retries: 0, owner: 'Arjun Sharma', environment: 'production' },
];

const statusConfig = {
  success: { label: 'Success', className: 'log-info text-success bg-success-bg' },
  warning: { label: 'Warning', className: 'text-warning bg-warning-bg' },
  error: { label: 'Error', className: 'text-danger bg-danger-bg' },
  info: { label: 'Info', className: 'text-info bg-info-bg' },
};

type SortKey = keyof EventLog;

interface EventLogTableProps {
  loading?: boolean;
  filters: { status: string; connector: string; search: string };
  lockedIntegrationName?: string;
  lockedConnectorType?: ConnectorType;
  lockedLatencyMs?: number;
}

export default function EventLogTable({ loading, filters, lockedIntegrationName, lockedConnectorType, lockedLatencyMs = 0 }: EventLogTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const scopedLogs: EventLog[] = lockedIntegrationName && lockedConnectorType
    ? Array.from({ length: 5 }, (_, index) => ({
        id: `evt-${lockedConnectorType}-${String(index + 1).padStart(4, '0')}`,
        timestamp: index === 0 ? 'Just now' : `${index * 7} min ago`,
        integrationName: lockedIntegrationName,
        connectorType: lockedConnectorType,
        eventType: ['tata', 'exotel', 'knowlarity', 'mcube', 'ivr', 'ivr-custom'].includes(lockedConnectorType) ? (index % 2 ? 'call.connected' : 'call.completed') : 'lead.created',
        status: 'success',
        payloadSize: `${(1.2 + index * 0.3).toFixed(1)} KB`,
        latencyMs: Math.max(1, lockedLatencyMs + index * 4),
        retries: 0,
        owner: 'Pramod Bhujbal',
        environment: 'production',
      }))
    : MOCK_LOGS;

  const filtered = scopedLogs.filter((log) => {
    const matchLocked = !lockedIntegrationName || log.integrationName === lockedIntegrationName;
    const matchStatus = filters.status === 'all' || log.status === filters.status;
    const matchConnector = filters.connector === 'all' || log.connectorType === filters.connector;
    const matchSearch = !filters.search ||
      log.integrationName.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      (log.errorCode ?? '').toLowerCase().includes(filters.search.toLowerCase());
    return matchLocked && matchStatus && matchConnector && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={11} className="text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ChevronUp size={11} className="text-primary" /> : <ChevronDown size={11} className="text-primary" />;
  };

  if (loading) return <TableSkeleton rows={10} cols={10} />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]" style={{ minWidth: '1100px' }}>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {[
                { key: 'timestamp' as SortKey, label: 'Timestamp' },
                { key: 'integrationName' as SortKey, label: 'Integration' },
                { key: 'connectorType' as SortKey, label: 'Connector' },
                { key: 'eventType' as SortKey, label: 'Event Type' },
                { key: 'status' as SortKey, label: 'Status' },
                { key: 'payloadSize' as SortKey, label: 'Payload' },
                { key: 'latencyMs' as SortKey, label: 'Latency' },
                { key: 'errorCode' as SortKey, label: 'Error Code' },
                { key: 'retries' as SortKey, label: 'Retries' },
                { key: 'owner' as SortKey, label: 'Owner' },
                { key: 'environment' as SortKey, label: 'Env' },
              ].map((col) => (
                <th
                  key={`evth-${col.key}`}
                  className="px-3 py-2.5 text-left font-semibold text-[10px] tracking-wide text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-semibold text-[10px] tracking-wide text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-muted-foreground text-[13px]">
                  No events match the current filters
                </td>
              </tr>
            ) : (
              paginated.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                      log.status === 'error' ? 'bg-danger-bg/20' : log.status === 'warning' ? 'bg-warning-bg/10' : ''
                    }`}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap font-tabular text-[11px] text-muted-foreground">{log.timestamp}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-foreground text-[12px] leading-tight max-w-[180px] truncate">{log.integrationName}</div>
                      <div className="text-[10px] text-muted-foreground font-tabular truncate max-w-[180px]">{log.id}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <ConnectorIcon type={log.connectorType} size={22} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground">{log.eventType}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[log.status].className}`}>
                        {statusConfig[log.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-tabular text-muted-foreground">{log.payloadSize}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-semibold font-tabular ${log.latencyMs === 0 ? 'text-muted-foreground' : log.latencyMs < 300 ? 'text-success' : log.latencyMs < 1000 ? 'text-warning' : 'text-danger'}`}>
                        {log.latencyMs === 0 ? '—' : `${log.latencyMs}ms`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {log.errorCode ? (
                        <span className="font-mono text-[10px] text-danger bg-danger-bg px-1.5 py-0.5 rounded">{log.errorCode}</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-tabular font-semibold ${log.retries > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {log.retries}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{log.owner}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${log.environment === 'production' ? 'text-success bg-success-bg border-success-border' : log.environment === 'staging' ? 'text-warning bg-warning-bg border-warning-border' : 'text-muted-foreground bg-muted border-border'}`}>
                        {log.environment}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === log.id ? null : log.id); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="View payload"
                        >
                          <Eye size={12} />
                        </button>
                        {log.status === 'error' && (
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-warning-bg text-muted-foreground hover:text-warning transition-colors"
                            title="Retry event"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-expanded`} className="border-b border-border bg-muted/20">
                      <td colSpan={12} className="px-4 py-3">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Event Details</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Event ID</p>
                                <p className="text-[11px] font-mono text-foreground">{log.id}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">Event Type</p>
                                <p className="text-[11px] font-mono text-foreground">{log.eventType}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">Payload Size</p>
                                <p className="text-[11px] text-foreground">{log.payloadSize}</p>
                              </div>
                              {log.errorCode && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Error Code</p>
                                  <p className="text-[11px] font-mono text-danger">{log.errorCode}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
        <span className="text-[12px] text-muted-foreground">{filtered.length} events matching filters</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 text-[12px] rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
            <button
              key={`evtpage-${i + 1}`}
              onClick={() => setPage(i + 1)}
              className={`w-7 h-7 text-[12px] rounded-md border transition-colors ${page === i + 1 ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2.5 py-1 text-[12px] rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
