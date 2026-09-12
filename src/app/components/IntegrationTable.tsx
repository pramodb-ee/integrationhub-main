'use client';

import React, { useState, useRef, useEffect } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import ConnectorIcon, { ConnectorType } from '@/components/ui/ConnectorIcon';
import { getConnectorLabel } from '@/components/ui/ConnectorIcon';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  ChevronUp, ChevronDown, MoreHorizontal, Edit2, Pause, Trash2,
  Eye, ArrowUpDown, CheckSquare, Square, Activity, RefreshCw,
  Play, Settings2, GripVertical, Check, AlertCircle, Loader2, FileText
} from 'lucide-react';
import Link from 'next/link';

export interface Integration {
  id: string;
  name: string;
  type: ConnectorType;
  status: 'draft' | 'setup-pending' | 'test-pending' | 'mapping-pending' | 'ready' | 'active' | 'healthy' | 'needs-attention' | 'failed' | 'paused';
  lastSync: string;
  events24h: number;
  successRate: number;
  latencyMs: number;
  owner: string;
  created: string;
  environment: 'production' | 'staging' | 'development';
  errorCount?: number;
}

interface IntegrationTableProps {
  integrations: Integration[];
  loading?: boolean;
  onRefresh?: () => void;
  onEdit?: (integration: Integration) => void;
  onViewDetails?: (integration: Integration) => void;
  onViewLogs?: (integration: Integration) => void;
  onDelete?: (id: string) => void;
  onOpenTata?: () => void;
}

type SortKey = keyof Integration;
const TELEPHONY_TYPES: ConnectorType[] = ['ivr', 'tata', 'exotel', 'knowlarity', 'twilio', 'mcube', 'ozonetel', 'myoperator', 'cloudtalk', 'ringcentral', 'ivr-custom'];

export function buildMonitorHref(integration: Integration): string {
  const params = new URLSearchParams({
    id: integration.id,
    name: integration.name,
    type: integration.type,
    status: integration.status,
    events24h: String(integration.events24h),
    successRate: String(integration.successRate),
    latencyMs: String(integration.latencyMs),
    errorCount: String(integration.errorCount ?? 0),
    lastSync: integration.lastSync,
  });
  return `/integration-monitoring?${params.toString()}`;
}

type ColumnId = 'name' | 'type' | 'status' | 'lastSync' | 'events24h' | 'successRate' | 'latencyMs' | 'owner' | 'errorCount';

interface ColumnDef {
  id: ColumnId;
  label: string;
  sortKey: SortKey;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'name',        label: 'Integration Name', sortKey: 'name' },
  { id: 'type',        label: 'Connector',         sortKey: 'type' },
  { id: 'status',      label: 'Status',            sortKey: 'status' },
  { id: 'lastSync',    label: 'Last Sync',         sortKey: 'lastSync' },
  { id: 'events24h',   label: 'Events (24h)',      sortKey: 'events24h' },
  { id: 'successRate', label: 'Success Rate',      sortKey: 'successRate' },
  { id: 'latencyMs',   label: 'Latency',           sortKey: 'latencyMs' },
  { id: 'owner',       label: 'Owner',             sortKey: 'owner' },
  { id: 'errorCount',  label: 'Error Count',       sortKey: 'errorCount' },
];

const DEFAULT_VISIBLE: ColumnId[] = ['name', 'type', 'status', 'lastSync', 'events24h', 'successRate', 'latencyMs', 'owner'];

export default function IntegrationTable({ integrations, loading, onRefresh, onEdit, onViewDetails, onViewLogs, onDelete, onOpenTata }: IntegrationTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('lastSync');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE);
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(DEFAULT_VISIBLE);
  const [showColSelector, setShowColSelector] = useState(false);
  const [dragCol, setDragCol] = useState<ColumnId | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const colSelectorRef = useRef<HTMLDivElement>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Integration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (integration: Integration) => {
    setDeleteTarget(integration);
    setDeleteError(null);
    setOpenMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      // Simulate async deletion (replace with real API call if needed)
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulate 95% success rate for demo; always succeeds in practice
          resolve();
        }, 1000);
      });
      onDelete?.(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteError('Unable to delete integration. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colSelectorRef.current && !colSelectorRef.current.contains(e.target as Node)) {
        setShowColSelector(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...integrations].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((i) => i.id)));
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const togglePause = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPausedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleColumn = (colId: ColumnId) => {
    setVisibleColumns((prev) => {
      if (prev.includes(colId)) {
        if (prev.length <= 2) return prev; // keep at least 2 columns
        const next = prev.filter((c) => c !== colId);
        setColumnOrder((o) => o.filter((c) => c !== colId));
        return next;
      } else {
        const next = [...prev, colId];
        setColumnOrder((o) => [...o, colId]);
        return next;
      }
    });
  };

  const handleDragStart = (colId: ColumnId) => setDragCol(colId);
  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => { e.preventDefault(); setDragOverCol(colId); };
  const handleDrop = (targetColId: ColumnId) => {
    if (!dragCol || dragCol === targetColId) { setDragCol(null); setDragOverCol(null); return; }
    setColumnOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragCol);
      const toIdx = next.indexOf(targetColId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragCol);
      return next;
    });
    setDragCol(null);
    setDragOverCol(null);
  };

  const orderedVisibleCols = columnOrder.filter((c) => visibleColumns.includes(c));

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  };

  const envColor = (env: string) => {
    if (env === 'production') return 'text-success bg-success-bg border-success-border';
    if (env === 'staging') return 'text-warning bg-warning-bg border-warning-border';
    return 'text-muted-foreground bg-muted border-border';
  };

  const renderCell = (integration: Integration, colId: ColumnId) => {
    const isPaused = pausedIds.has(integration.id);
    const effectiveStatus = isPaused ? 'paused' : integration.status;

    switch (colId) {
      case 'name':
        return (
          <td key={`cell-${integration.id}-name`} className="px-3 py-3">
            <div className="font-medium text-foreground text-[13px] leading-tight">{integration.name}</div>
            <div className="text-[11px] text-muted-foreground font-tabular">{integration.id}</div>
          </td>
        );
      case 'type':
        return (
          <td key={`cell-${integration.id}-type`} className="px-3 py-3">
            <div className="flex items-center gap-2">
              <ConnectorIcon type={integration.type} size={24} />
              <span className="text-[12px] text-muted-foreground">{getConnectorLabel(integration.type)}</span>
            </div>
          </td>
        );
      case 'status':
        return (
          <td key={`cell-${integration.id}-status`} className="px-3 py-3">
            <StatusBadge status={effectiveStatus} size="sm" />
          </td>
        );
      case 'lastSync':
        return (
          <td key={`cell-${integration.id}-lastSync`} className="px-3 py-3 text-[12px] text-muted-foreground font-tabular whitespace-nowrap">
            {integration.lastSync}
          </td>
        );
      case 'events24h':
        return (
          <td key={`cell-${integration.id}-events24h`} className="px-3 py-3">
            <span className="font-semibold text-foreground font-tabular">{integration.events24h.toLocaleString()}</span>
          </td>
        );
      case 'successRate':
        return (
          <td key={`cell-${integration.id}-successRate`} className="px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" style={{ width: '48px' }}>
                <div
                  className={`h-full rounded-full ${integration.successRate >= 95 ? 'bg-success' : integration.successRate >= 80 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${integration.successRate}%` }}
                />
              </div>
              <span className={`text-[12px] font-semibold font-tabular ${integration.successRate >= 95 ? 'text-success' : integration.successRate >= 80 ? 'text-warning' : 'text-danger'}`}>
                {integration.successRate}%
              </span>
            </div>
          </td>
        );
      case 'latencyMs':
        return (
          <td key={`cell-${integration.id}-latencyMs`} className="px-3 py-3">
            <span className={`text-[12px] font-semibold font-tabular ${integration.latencyMs < 300 ? 'text-success' : integration.latencyMs < 800 ? 'text-warning' : 'text-danger'}`}>
              {integration.latencyMs > 0 ? `${integration.latencyMs}ms` : '—'}
            </span>
          </td>
        );
      case 'owner':
        return (
          <td key={`cell-${integration.id}-owner`} className="px-3 py-3 text-[12px] text-muted-foreground">{integration.owner}</td>
        );
      case 'errorCount':
        return (
          <td key={`cell-${integration.id}-errorCount`} className="px-3 py-3">
            <span className={`text-[12px] font-semibold font-tabular ${(integration.errorCount ?? 0) > 0 ? 'text-danger' : 'text-muted-foreground'}`}>
              {integration.errorCount ?? 0}
            </span>
          </td>
        );
      default:
        return <td key={`cell-${integration.id}-${colId}`} className="px-3 py-3" />;
    }
  };

  if (loading) return <TableSkeleton rows={8} cols={9} />;

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center flex-shrink-0">
                  <Trash2 size={16} className="text-danger" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">Delete Integration?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">{deleteTarget.name}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[13px] text-muted-foreground">
                This will permanently remove the integration. This action cannot be undone.
              </p>
              {deleteError && (
                <div className="flex items-center gap-2 p-2.5 bg-danger-bg border border-danger-border rounded-lg">
                  <AlertCircle size={13} className="text-danger flex-shrink-0" />
                  <span className="text-[12px] text-danger">{deleteError}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20 rounded-b-xl">
              <button
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
                className="flex-1 h-8 px-4 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 h-8 px-4 text-[12px] font-semibold bg-danger text-white rounded-md hover:bg-danger/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Customization Bar */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-muted/20">
        <div className="relative" ref={colSelectorRef}>
          <button
            onClick={() => setShowColSelector(!showColSelector)}
            className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <Settings2 size={11} />
            Customize Columns
            <ChevronDown size={10} />
          </button>

          {showColSelector && (
            <div className="absolute right-0 top-8 z-30 w-64 bg-card rounded-lg shadow-lg border border-border py-2">
              <div className="px-3 py-1.5 border-b border-border mb-1">
                <p className="text-[11px] font-semibold text-foreground">Column Visibility</p>
                <p className="text-[10px] text-muted-foreground">Drag to reorder · Click to toggle</p>
              </div>
              {ALL_COLUMNS.map((col) => {
                const isVisible = visibleColumns.includes(col.id);
                const isDragging = dragCol === col.id;
                const isDragOver = dragOverCol === col.id;
                return (
                  <div
                    key={`colsel-${col.id}`}
                    draggable
                    onDragStart={() => handleDragStart(col.id)}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={() => handleDrop(col.id)}
                    onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors select-none ${
                      isDragOver ? 'bg-primary/10' : 'hover:bg-muted'
                    } ${isDragging ? 'opacity-50' : ''}`}
                    onClick={() => toggleColumn(col.id)}
                  >
                    <GripVertical size={12} className="text-muted-foreground/40 cursor-grab flex-shrink-0" />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isVisible ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isVisible && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-[12px] text-foreground">{col.label}</span>
                  </div>
                );
              })}
              <div className="px-3 pt-2 border-t border-border mt-1">
                <button
                  onClick={() => { setVisibleColumns(DEFAULT_VISIBLE); setColumnOrder(DEFAULT_VISIBLE); }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Reset to default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="slide-up flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20">
          <span className="text-[12px] font-semibold text-primary">{selected.size} selected</span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors">
              <Pause size={11} /> Pause
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors">
              <RefreshCw size={11} /> Resync
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-danger-bg border border-danger-border text-danger rounded-md hover:bg-danger/10 transition-colors">
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: '800px' }}>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-4 py-2.5 text-left">
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                  {selected.size === paginated.length && paginated.length > 0
                    ? <CheckSquare size={14} className="text-primary" />
                    : <Square size={14} />}
                </button>
              </th>
              {orderedVisibleCols.map((colId) => {
                const col = ALL_COLUMNS.find((c) => c.id === colId)!;
                return (
                  <th
                    key={`th-${col.id}`}
                    className="px-3 py-2.5 text-left font-semibold text-[11px] tracking-wide text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort(col.sortKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col.sortKey} />
                    </div>
                  </th>
                );
              })}
              <th className="px-3 py-2.5 text-left font-semibold text-[11px] tracking-wide text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={orderedVisibleCols.length + 2}>
                  <EmptyState
                    title="No integrations found"
                    description="No integrations match your current filters. Try adjusting the search or status filters."
                  />
                </td>
              </tr>
            ) : (
              paginated.map((integration) => {
                const isPaused = pausedIds.has(integration.id);
                return (
                  <tr
                    key={integration.id}
                    className={`border-b border-border transition-colors hover:bg-muted/40 group ${
                      selected.has(integration.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRow(integration.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        {selected.has(integration.id)
                          ? <CheckSquare size={14} className="text-primary" />
                          : <Square size={14} />}
                      </button>
                    </td>
                    {orderedVisibleCols.map((colId) => renderCell(integration, colId))}
                    {/* Action Column */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {/* View Monitoring */}
                        <Link href={buildMonitorHref(integration)}>
                          <button
                            className="flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded-md bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                            title="View Monitoring"
                          >
                            <Activity size={12} />
                            <span className="hidden xl:block">Monitor</span>
                          </button>
                        </Link>
                        {/* Edit Integration */}
                        <React.Fragment>
                          <button onClick={(event) => { event.stopPropagation(); onEdit?.(integration); }}
                            className="flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded-md bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                            title="Edit Integration"
                          >
                            <Edit2 size={12} />
                            <span className="hidden xl:block">Edit</span>
                          </button>
                        </React.Fragment>
                        {/* Pause / Resume */}
                        <button
                          onClick={(e) => togglePause(integration.id, e)}
                          className={`flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded-md transition-colors border ${
                            isPaused
                              ? 'bg-success-bg text-success border-success-border hover:bg-success/10' :'bg-muted text-muted-foreground border-transparent hover:bg-warning-bg hover:text-warning hover:border-warning-border'
                          }`}
                          title={isPaused ? 'Resume Integration' : 'Pause Integration'}
                        >
                          {isPaused ? <Play size={12} /> : <Pause size={12} />}
                          <span className="hidden xl:block">{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                        {/* More options */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === integration.id ? null : integration.id)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                            title="More options"
                          >
                            <MoreHorizontal size={13} />
                          </button>
                          {openMenu === integration.id && (
                            <div className="absolute right-0 top-7 z-20 w-40 bg-card rounded-lg shadow-lg border border-border py-1">
                              <button
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors"
                                onClick={() => { setOpenMenu(null); onViewDetails?.(integration); }}
                              >
                                <Eye size={12} /> View Details
                              </button>
                              <button
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors"
                                onClick={() => { setOpenMenu(null); onViewLogs?.(integration); }}
                              >
                                <FileText size={12} /> View Logs
                              </button>
                              <hr className="my-1 border-border" />
                              <button
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-danger hover:bg-danger-bg transition-colors"
                                onClick={() => handleDeleteClick(integration)}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Show</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="h-7 px-2 text-[12px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[10, 20, 50].map((n) => (
              <option key={`pp-${n}`} value={n}>{n}</option>
            ))}
          </select>
          <span>of {integrations.length} integrations</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 text-[12px] rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={`page-${p}`}
                onClick={() => setPage(p)}
                className={`w-7 h-7 text-[12px] rounded-md border transition-colors ${
                  page === p
                    ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1 text-[12px] rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}