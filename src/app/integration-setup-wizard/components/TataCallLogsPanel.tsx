'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Copy, Download, PhoneCall, PhoneIncoming, PhoneMissed, RefreshCw, Search, X,
} from 'lucide-react';

interface CallLogRow {
  id: string;
  solution: 'Incoming' | 'Clicktocall';
  connected: boolean;
  duration: string;
  time: string;
  agent: string;
}

const AGENT_NAMES = ['Harish Kumar', 'Sanya Kapoor', 'Kavya Iyer', 'Rahul Verma'];
const SOLUTIONS: CallLogRow['solution'][] = ['Incoming', 'Clicktocall'];

// Deterministic pseudo-random generator so the same user always sees the same mock call history
// across panel opens, instead of a fresh random set every render.
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(h ^ (h >>> 15), 1 | h) + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
    h ^= h >>> 14;
    return ((h >>> 0) % 1000) / 1000;
  };
}

function buildCallLogs(seedKey: string, count: number): CallLogRow[] {
  const rand = seededRandom(seedKey);
  const rows: CallLogRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const connected = rand() > 0.28;
    const solution = SOLUTIONS[Math.floor(rand() * SOLUTIONS.length)];
    const minutesAgo = Math.floor(rand() * 60 * 24 * 3) + i * 7;
    const when = new Date(Date.now() - minutesAgo * 60000);
    const durationSec = connected ? Math.floor(rand() * 240) + 15 : 0;
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    rows.push({
      id: `${seedKey.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-${1000 + i}-${Math.floor(rand() * 900000 + 100000)}`,
      solution,
      connected,
      duration: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      time: when.toLocaleString(),
      agent: connected ? AGENT_NAMES[Math.floor(rand() * AGENT_NAMES.length)] : '',
    });
  }
  return rows.sort((a, b) => (a.time < b.time ? 1 : -1));
}

interface TataCallLogsPanelProps {
  open: boolean;
  onClose: () => void;
  user?: { name: string; mobile: string } | null;
}

export default function TataCallLogsPanel({ open, onClose, user }: TataCallLogsPanelProps) {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [bump, setBump] = useState(0);

  const logs = useMemo(
    () => buildCallLogs(user ? `${user.name}-${user.mobile}` : 'all-outbound-users', user ? 10 : 18),
    [user, bump]
  );
  const filtered = useMemo(
    () => logs.filter((row) => row.id.toLowerCase().includes(search.toLowerCase()) || row.agent.toLowerCase().includes(search.toLowerCase())),
    [logs, search]
  );

  if (!open) return null;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setBump((b) => b + 1);
      toast.success('Call logs refreshed');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl bg-card h-full shadow-2xl border-l border-border flex flex-col fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-orange-50 dark:bg-orange-950/20 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <PhoneCall size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[16px] font-bold text-foreground truncate">Call Logs</h2>
              <p className="text-[11px] text-muted-foreground truncate">{user ? `${user.name} — ${user.mobile}` : 'All outbound users'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground transition-colors flex-shrink-0" aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Call ID or Agent"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 pl-8 pr-3 w-56 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <button type="button" onClick={() => toast.success('Call logs exported')} className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors">
                <Download size={13} />Export
              </button>
              <button type="button" onClick={handleRefresh} className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />Refresh
              </button>
            </div>
          </div>

          <div className="card-base overflow-x-auto rounded-xl">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_1.3fr_1fr_1fr] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Call ID</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Type</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Time</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Duration</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Agent</span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map((row) => {
                  const SolutionIcon = row.solution === 'Clicktocall' ? PhoneCall : row.connected ? PhoneIncoming : PhoneMissed;
                  return (
                    <div key={row.id} className="grid grid-cols-[1.4fr_0.9fr_0.8fr_1.3fr_1fr_1fr] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-mono font-semibold text-foreground truncate" title={row.id}>{row.id}</span>
                        <button type="button" onClick={() => { navigator.clipboard?.writeText(row.id); toast.success('Call ID copied'); }} className="text-muted-foreground hover:text-foreground flex-shrink-0" title="Copy Call ID">
                          <Copy size={11} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <SolutionIcon size={13} className={`flex-shrink-0 ${row.connected || row.solution === 'Clicktocall' ? 'text-success' : 'text-danger'}`} />
                        <span className="text-[11px] text-foreground truncate">{row.solution}</span>
                      </div>
                      <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${row.connected ? 'bg-success-bg text-success border-success-border' : 'bg-danger-bg text-danger border-danger-border'}`}>
                        {row.connected ? 'Connected' : 'Missed'}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono truncate">{row.time}</span>
                      <span className="text-[12px] text-foreground font-tabular">{row.duration}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{row.agent || '—'}</span>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="px-4 py-10 text-center text-[12px] text-muted-foreground">No call logs match your search.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
