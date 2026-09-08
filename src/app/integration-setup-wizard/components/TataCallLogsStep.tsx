'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronDown, Download, RefreshCw, MoreHorizontal,
  Calendar, PhoneIncoming, PhoneMissed, PhoneCall, Eye, Play, Copy, ExternalLink, ChevronLeft, ChevronRight,
  X,
} from 'lucide-react';

interface CallLogRow {
  id: string;
  solution: 'Incoming' | 'Clicktocall';
  connected: boolean;
  customerNo: string;
  didNo: string;
  duration: string;
  time: string;
  agent?: { initials: string; color: string };
}

const MOCK_CALL_LOGS: CallLogRow[] = [
  { id: 'HYD3-D2-1782451', solution: 'Incoming',    connected: true,  customerNo: '+918384040711', didNo: '+918065067963', duration: '00:04:39', time: 'Sep 4, 2026 | 5:25:39 PM', agent: { initials: 'HK', color: '#0d9488' } },
  { id: 'MUM10-D6-17845',  solution: 'Incoming',    connected: false, customerNo: '+919835921714', didNo: '+918065067963', duration: '00:00:32', time: 'Sep 4, 2026 | 5:25:20 PM' },
  { id: 'MUM10-D2-17839',  solution: 'Incoming',    connected: false, customerNo: '+916370583882', didNo: '+918065067950', duration: '00:00:02', time: 'Sep 4, 2026 | 5:21:24 PM' },
  { id: 'MUM10-D8-17831',  solution: 'Incoming',    connected: false, customerNo: '+919310033787', didNo: '+918065067962', duration: '00:00:30', time: 'Sep 4, 2026 | 5:19:01 PM' },
  { id: 'MUM10-D12-1780',  solution: 'Incoming',    connected: false, customerNo: '+917358776586', didNo: '+918065067953', duration: '00:00:00', time: 'Sep 4, 2026 | 5:15:11 PM' },
  { id: 'HYD3-D3-178822',  solution: 'Incoming',    connected: true,  customerNo: '+917349629833', didNo: '+918065067950', duration: '00:01:32', time: 'Sep 4, 2026 | 5:13:05 PM', agent: { initials: 'HK', color: '#16a34a' } },
  { id: 'HYD3-D9-178815',  solution: 'Incoming',    connected: false, customerNo: '+917358776586', didNo: '+918065067953', duration: '00:00:00', time: 'Sep 4, 2026 | 5:09:18 PM' },
  { id: 'HYD1-D5-178802',  solution: 'Clicktocall', connected: true,  customerNo: '+919199352450', didNo: '+918065067962', duration: '00:01:03', time: 'Sep 4, 2026 | 5:08:45 PM', agent: { initials: 'SK', color: '#7c3aed' } },
  { id: 'MUM10-D3-17822',  solution: 'Incoming',    connected: false, customerNo: '+919229085171', didNo: '+918065067955', duration: '00:00:00', time: 'Sep 4, 2026 | 5:08:44 PM' },
  { id: 'DR4-D8-178814',   solution: 'Clicktocall', connected: true,  customerNo: '+919636488853', didNo: '+918065067962', duration: '00:00:51', time: 'Sep 4, 2026 | 5:07:21 PM', agent: { initials: 'SK', color: '#7c3aed' } },
];

const WAVEFORM = [5, 9, 6, 12, 8, 14, 7, 10, 6];
const DATE_RANGES = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'];
const SOLUTION_FILTERS = ['All Solutions', 'Incoming', 'Clicktocall'];
const STATUS_FILTERS = ['All Status', 'Connected', 'Missed'];
const TOTAL_PAGES = 114;

function truncateId(id: string) {
  return id.length > 10 ? `${id.slice(0, 10)}...` : id;
}

interface TataCallLogsStepProps {
  integrationName?: string;
  onOpenMonitor?: () => void;
}

export default function TataCallLogsStep({ integrationName = 'TATA IVR Integration', onOpenMonitor }: TataCallLogsStepProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState('10');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [goToInput, setGoToInput] = useState('1');

  const [dateRange, setDateRange] = useState('Today');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterSolution, setFilterSolution] = useState('All Solutions');
  const [filterStatus, setFilterStatus] = useState('All Status');

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const filtered = useMemo(
    () => MOCK_CALL_LOGS.filter((row) => {
      const matchSearch = row.id.toLowerCase().includes(search.toLowerCase());
      const matchSolution = filterSolution === 'All Solutions' || row.solution === filterSolution;
      const matchStatus = filterStatus === 'All Status' || (filterStatus === 'Connected' ? row.connected : !row.connected);
      return matchSearch && matchSolution && matchStatus;
    }),
    [search, filterSolution, filterStatus]
  );

  const activeFilterCount = (filterSolution !== 'All Solutions' ? 1 : 0) + (filterStatus !== 'All Status' ? 1 : 0);

  const allSelected = filtered.length > 0 && filtered.every((row) => selected.has(row.id));
  const toggleAll = () => {
    setSelected((current) => {
      if (allSelected) return new Set();
      return new Set(filtered.map((row) => row.id));
    });
  };
  const toggleRow = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
    setPage(1);
    setGoToInput('1');
    toast.success('Call logs refreshed');
  };

  const goToPage = (target: number) => {
    const clamped = Math.min(TOTAL_PAGES, Math.max(1, target));
    setPage(clamped);
    setGoToInput(String(clamped));
    toast(`Page ${clamped} of ${TOTAL_PAGES} — preview shows sample data only`);
  };

  const clearFilters = () => {
    setFilterSolution('All Solutions');
    setFilterStatus('All Status');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Call Logs</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">TATA IVR call detail records — inbound calls, click-to-call, and recordings.</p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Date range filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setDateMenuOpen((open) => !open); setFilterMenuOpen(false); setMoreMenuOpen(false); }}
            className="flex items-center gap-2 h-9 px-3 text-[12px] text-muted-foreground bg-muted rounded-md border border-border hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Calendar size={13} />
            <span className="font-tabular">{dateRange}</span>
            <ChevronDown size={12} />
          </button>
          {dateMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDateMenuOpen(false)} />
              <div className="absolute left-0 top-10 z-20 w-40 bg-card rounded-lg shadow-lg border border-border py-1">
                {DATE_RANGES.map((option) => (
                  <button
                    key={option}
                    onClick={() => { setDateRange(option); setDateMenuOpen(false); toast(`Showing calls for ${option}`); }}
                    className={`flex items-center w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors ${
                      option === dateRange ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Call ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 pl-8 pr-3 w-40 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setFilterMenuOpen((open) => !open); setDateMenuOpen(false); setMoreMenuOpen(false); }}
            className={`flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium rounded-md border transition-all ${
              activeFilterCount > 0
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Filter size={13} /> Filter
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold">{activeFilterCount}</span>
            )}
            <ChevronDown size={12} />
          </button>
          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterMenuOpen(false)} />
              <div className="absolute left-0 top-10 z-20 w-56 bg-card rounded-lg shadow-lg border border-border p-3 space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Solution</label>
                  <div className="relative">
                    <select
                      value={filterSolution}
                      onChange={(event) => setFilterSolution(event.target.value)}
                      className="w-full h-8 pl-2.5 pr-7 text-[12px] bg-muted rounded-md border border-border appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {SOLUTION_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(event) => setFilterStatus(event.target.value)}
                      className="w-full h-8 pl-2.5 pr-7 text-[12px] bg-muted rounded-md border border-border appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {STATUS_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X size={11} /> Clear filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast('Old CDR view is not available in this preview')}
          className="h-9 px-3 text-[12px] font-semibold text-orange-600 bg-white border border-orange-300 rounded-md hover:bg-orange-50 transition-colors"
        >
          Old CDR
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <button type="button" onClick={() => toast('Exporting call logs…')} className="flex items-center justify-center w-9 h-9 text-muted-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors" title="Download">
            <Download size={14} />
          </button>
          <button type="button" onClick={handleRefresh} className="flex items-center justify-center w-9 h-9 text-muted-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors" title="Refresh">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setMoreMenuOpen((open) => !open); setDateMenuOpen(false); setFilterMenuOpen(false); }}
              className="flex items-center justify-center w-9 h-9 text-muted-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
              title="More"
            >
              <MoreHorizontal size={14} />
            </button>
            {moreMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-44 bg-card rounded-lg shadow-lg border border-border py-1">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors"
                    onClick={() => { setMoreMenuOpen(false); toast.success('Call logs exported as CSV'); }}
                  >
                    <Download size={12} /> Export as CSV
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors"
                    onClick={() => { setMoreMenuOpen(false); toast('Preparing print view…'); }}
                  >
                    <ExternalLink size={12} /> Print view
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors"
                    onClick={() => { setMoreMenuOpen(false); navigator.clipboard?.writeText(window.location.href); toast.success('Shareable link copied'); }}
                  >
                    <Copy size={12} /> Copy shareable link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[28px_1.1fr_1.2fr_1.1fr_1.1fr_0.9fr_0.9fr_1.3fr_60px] gap-3 px-4 py-2.5 bg-orange-50 border-b border-orange-100 items-center">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Call ID</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Solution</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Customer No.</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">DID No.</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Duration</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Agents Involved</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Recording</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground text-center">Action</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((row) => {
              const SolutionIcon = row.solution === 'Clicktocall' ? PhoneCall : row.connected ? PhoneIncoming : PhoneMissed;
              return (
                <div key={row.id} className="grid grid-cols-[28px_1.1fr_1.2fr_1.1fr_1.1fr_0.9fr_0.9fr_1.3fr_60px] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="cursor-pointer" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12px] font-semibold text-orange-600 truncate">{truncateId(row.id)}</span>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(row.id); toast.success('Call ID copied'); }} className="text-muted-foreground hover:text-foreground flex-shrink-0" title="Copy Call ID">
                      <Copy size={11} />
                    </button>
                    <ExternalLink size={11} className="text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <SolutionIcon size={14} className={`flex-shrink-0 ${row.connected || row.solution === 'Clicktocall' ? 'text-success' : 'text-danger'}`} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground">{row.solution}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{row.time}</p>
                    </div>
                  </div>
                  <span className="text-[12px] text-foreground font-tabular truncate">{row.customerNo}</span>
                  <span className="text-[12px] text-muted-foreground font-tabular truncate">{row.didNo}</span>
                  <span className="text-[12px] text-foreground font-tabular">{row.duration}</span>
                  <div>
                    {row.agent ? (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: row.agent.color }}
                        title={row.agent.initials}
                      >
                        {row.agent.initials}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toast('Playing recording…')} className="flex items-center justify-center w-6 h-6 rounded-full text-orange-600 hover:bg-orange-50 flex-shrink-0" title="Play recording">
                      <Play size={13} fill="currentColor" />
                    </button>
                    <div className="flex items-end gap-0.5 h-4">
                      {WAVEFORM.map((h, index) => (
                        <span key={index} className="w-0.5 rounded-full bg-orange-300" style={{ height: `${h}px` }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => toast(`Viewing details for ${truncateId(row.id)}`)} className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="View details">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-4 py-10 text-center text-[12px] text-muted-foreground">No call logs match the current search &amp; filters</p>
            )}
          </div>
        </div>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Showing</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(event) => setPageSize(event.target.value)}
              className="h-8 pl-2.5 pr-6 text-[12px] bg-card border border-border rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {['10', '25', '50', '100'].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <span>of 1,139</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="flex items-center gap-1.5">
            Go to
            <input
              type="text"
              value={goToInput}
              onChange={(event) => setGoToInput(event.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(event) => { if (event.key === 'Enter') goToPage(Number(goToInput) || 1); }}
              onBlur={() => goToPage(Number(goToInput) || 1)}
              className="w-10 h-7 text-center text-[12px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            / {TOTAL_PAGES} page
          </span>
          <button
            type="button"
            disabled={page === TOTAL_PAGES}
            onClick={() => goToPage(page + 1)}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
