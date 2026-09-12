'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import TataAlertConfigModal from './TataAlertConfigModal';
import TataCallLogsPanel from './TataCallLogsPanel';
import IntegrationCatalogModal from '@/app/components/IntegrationCatalogModal';
import {
  Activity, AlertTriangle, Bell, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Download, ExternalLink, History, Loader2, PhoneCall, PhoneMissed, Plus, RefreshCw, Search,
  Server, ShieldCheck, TrendingUp, Users, X, XCircle, Zap,
} from 'lucide-react';

type LeadSyncStatus = 'success' | 'failed';

interface TataLeadLog {
  id: string;
  name: string;
  phone: string;
  campaign: string;
  agent: string;
  receivedAt: string;
  status: LeadSyncStatus;
  failureReason?: string;
}

const CAMPAIGNS = ['Inbound Sales Line', 'Support IVR', 'Click-to-Call Campaign', 'Missed Call Follow-up'];

const FAILURE_REASONS = [
  'Missing required field: Customer Name',
  'Duplicate lead — already exists in CRM',
  'CRM API rate limit exceeded',
  'Invalid phone number format',
  'Call recording unavailable for transcript sync',
];

const LEAD_SEEDS: { name: string; phone: string; campaign: string; agent: string; receivedAt: string; status: LeadSyncStatus; failureReasonIndex?: number }[] = [
  { name: 'Ananya Krishnan', phone: '+91 98765 43210', campaign: 'Inbound Sales Line', agent: 'Harish Kumar', receivedAt: '09:52:18', status: 'success' },
  { name: 'Rohit Bansal', phone: '+91 90040 55211', campaign: 'Support IVR', agent: 'Sanya Kapoor', receivedAt: '09:48:02', status: 'failed', failureReasonIndex: 0 },
  { name: 'Priya Menon', phone: '+91 97170 88342', campaign: 'Click-to-Call Campaign', agent: 'Kavya Iyer', receivedAt: '09:45:41', status: 'success' },
  { name: 'Karthik Iyer', phone: '+91 99010 22114', campaign: 'Inbound Sales Line', agent: 'Harish Kumar', receivedAt: '09:41:15', status: 'success' },
  { name: 'Fatima Sheikh', phone: '+91 98220 77654', campaign: 'Missed Call Follow-up', agent: 'Rahul Verma', receivedAt: '09:38:22', status: 'failed', failureReasonIndex: 2 },
  { name: 'Rohan Deshmukh', phone: '+91 96650 33298', campaign: 'Support IVR', agent: 'Sanya Kapoor', receivedAt: '09:35:44', status: 'success' },
  { name: 'Neha Gupta', phone: 'invalid-number', campaign: 'Click-to-Call Campaign', agent: 'Kavya Iyer', receivedAt: '09:32:05', status: 'failed', failureReasonIndex: 3 },
  { name: 'Arjun Nair', phone: '+91 90350 44112', campaign: 'Inbound Sales Line', agent: 'Harish Kumar', receivedAt: '09:29:18', status: 'success' },
  { name: 'Simran Kaur', phone: '+91 98980 66771', campaign: 'Support IVR', agent: 'Rahul Verma', receivedAt: '09:26:02', status: 'success' },
  { name: 'Deepak Verma', phone: '+91 99870 11223', campaign: 'Missed Call Follow-up', agent: 'Sanya Kapoor', receivedAt: '09:23:40', status: 'success' },
  { name: 'Ritu Chawla', phone: '+91 98110 44556', campaign: 'Inbound Sales Line', agent: 'Harish Kumar', receivedAt: '09:20:58', status: 'success' },
  { name: 'Manoj Pillai', phone: '+91 90080 22337', campaign: 'Click-to-Call Campaign', agent: 'Kavya Iyer', receivedAt: '09:17:20', status: 'failed', failureReasonIndex: 4 },
  { name: 'Sneha Kulkarni', phone: '+91 97640 33221', campaign: 'Support IVR', agent: 'Rahul Verma', receivedAt: '09:14:05', status: 'success' },
  { name: 'Aditya Bhatt', phone: '+91 96330 55009', campaign: 'Inbound Sales Line', agent: 'Harish Kumar', receivedAt: '09:10:47', status: 'success' },
  { name: 'Pooja Reddy', phone: '+91 90420 66118', campaign: 'Missed Call Follow-up', agent: 'Sanya Kapoor', receivedAt: '09:07:12', status: 'failed', failureReasonIndex: 1 },
  { name: 'Suresh Kumar', phone: '+91 99230 55142', campaign: 'Click-to-Call Campaign', agent: 'Kavya Iyer', receivedAt: '09:04:03', status: 'success' },
  { name: 'Divya Krishnan', phone: '+91 98760 12987', campaign: 'Inbound Sales Line', agent: 'Harish Kumar', receivedAt: '09:00:55', status: 'success' },
  { name: 'Amitabh Joshi', phone: '+91 99500 44778', campaign: 'Support IVR', agent: 'Rahul Verma', receivedAt: '08:57:38', status: 'success' },
];

const MOCK_LEADS: TataLeadLog[] = LEAD_SEEDS.map((seed, index) => ({
  id: `tata-lead-${1001 + index}`,
  name: seed.name,
  phone: seed.phone,
  campaign: seed.campaign,
  agent: seed.agent,
  receivedAt: seed.receivedAt,
  status: seed.status,
  failureReason: seed.failureReasonIndex !== undefined ? FAILURE_REASONS[seed.failureReasonIndex] : undefined,
}));

const STATUS_META: Record<LeadSyncStatus, { label: string; classes: string; icon: React.ElementType }> = {
  success: { label: 'Success', classes: 'bg-success-bg text-success border-success-border', icon: CheckCircle },
  failed: { label: 'Failed', classes: 'bg-danger-bg text-danger border-danger-border', icon: XCircle },
};

const CALL_TREND = [
  { time: '09:00', attempted: 42, connected: 34, missed: 5 },
  { time: '10:00', attempted: 58, connected: 47, missed: 7 },
  { time: '11:00', attempted: 76, connected: 61, missed: 9 },
  { time: '12:00', attempted: 64, connected: 52, missed: 8 },
  { time: '13:00', attempted: 81, connected: 69, missed: 7 },
  { time: '14:00', attempted: 93, connected: 77, missed: 10 },
  { time: '15:00', attempted: 72, connected: 59, missed: 8 },
];

const SERVICE_CHECKS = [
  { label: 'Voice API', detail: 'Last check 18 sec ago', status: 'Operational', latency: '184 ms' },
  { label: 'Outbound Dialer', detail: '24 active channels', status: 'Operational', latency: '231 ms' },
  { label: 'CRM Lead Sync', detail: 'Last sync 6 sec ago', status: 'Operational', latency: '284 ms' },
  { label: 'Call Recording', detail: '99.8% delivery', status: 'Operational', latency: '1.2 sec' },
];

interface TataMonitorStepProps {
  integrationName?: string;
  connectorType?: ConnectorType;
  onBack?: () => void;
}

export default function TataMonitorStep({ integrationName, connectorType = 'tata', onBack }: TataMonitorStepProps) {
  const resolvedName = integrationName || `${getConnectorLabel(connectorType)} Integration`;
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [callLogsOpen, setCallLogsOpen] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [leads, setLeads] = useState<TataLeadLog[]>(MOCK_LEADS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadSyncStatus>('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalLeads = leads.length;
  const successCount = leads.filter((l) => l.status === 'success').length;
  const failedCount = totalLeads - successCount;
  const successRate = totalLeads > 0 ? (successCount / totalLeads) * 100 : 0;
  const totalCalls = CALL_TREND.reduce((sum, item) => sum + item.attempted, 0);
  const connectedCalls = CALL_TREND.reduce((sum, item) => sum + item.connected, 0);
  const missedCalls = CALL_TREND.reduce((sum, item) => sum + item.missed, 0);
  const otherCalls = totalCalls - connectedCalls - missedCalls;

  const kpis = [
    { id: 'k-total', label: 'Leads Called', value: totalCalls.toLocaleString(), helper: 'Today', icon: PhoneCall, iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { id: 'k-connected', label: 'Connected Calls', value: connectedCalls.toLocaleString(), helper: `${((connectedCalls / totalCalls) * 100).toFixed(1)}% connect rate`, icon: TrendingUp, iconBg: '#F0FDF4', iconColor: '#16A34A' },
    { id: 'k-missed', label: 'Missed Calls', value: missedCalls.toLocaleString(), helper: `${((missedCalls / totalCalls) * 100).toFixed(1)}% of attempts`, icon: PhoneMissed, iconBg: '#FEF2F2', iconColor: '#DC2626' },
    { id: 'k-agents', label: 'Active Agents', value: '24 / 28', helper: '4 unavailable', icon: Users, iconBg: '#FFF7ED', iconColor: '#C2410C' },
  ];

  const outcomeData = [
    { name: 'Connected', value: connectedCalls, color: '#16a34a' },
    { name: 'Missed', value: missedCalls, color: '#dc2626' },
    { name: 'Busy / Failed', value: otherCalls, color: '#d97706' },
  ];

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || lead.name.toLowerCase().includes(q) || lead.phone.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchCampaign = campaignFilter === 'all' || lead.campaign === campaignFilter;
    return matchSearch && matchStatus && matchCampaign;
  }), [leads, search, statusFilter, campaignFilter]);

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, statusFilter, campaignFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginatedLeads = useMemo(() => filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredLeads, page]);
  const rangeStart = filteredLeads.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredLeads.length);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setSecondsAgo(0);
      toast.success('Monitoring data refreshed');
    }, 700);
  };

  const retryLead = (id: string) => {
    setRetrying((current) => new Set(current).add(id));
    setTimeout(() => {
      setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status: 'success', failureReason: undefined } : lead));
      setRetrying((current) => { const next = new Set(current); next.delete(id); return next; });
      toast.success('Lead re-synced successfully');
    }, 1100);
  };

  return (
    <div className="space-y-5">
      <TataAlertConfigModal open={alertModalOpen} onClose={() => setAlertModalOpen(false)} integrationName={resolvedName} />
      <TataCallLogsPanel open={callLogsOpen} onClose={() => setCallLogsOpen(false)} />
      <IntegrationCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <ConnectorIcon type={connectorType} size={40} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-foreground">{resolvedName}</h2>
              <StatusBadge status="healthy" size="sm" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-success mt-0.5">
              <div className="pulse-dot w-1.5 h-1.5" />
              Live — updated {secondsAgo}s ago
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('Monitoring report exported')}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground"
          >
            <Download size={13} />
            <span className="hidden sm:block">Export</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="card-base p-3.5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">{card.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.iconBg }}>
                  <Icon size={13} style={{ color: card.iconColor }} />
                </div>
              </div>
              <p className="text-[22px] font-bold font-tabular leading-none text-foreground">{card.value}</p>
              <p className="mt-1.5 text-[10px] text-muted-foreground">{card.helper}</p>
            </div>
          );
        })}
      </div>

      {/* Operational overview — patterns used by enterprise CRM health dashboards */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card-base p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div><h3 className="text-[14px] font-semibold text-foreground">Call Volume &amp; Outcomes</h3><p className="text-[11px] text-muted-foreground mt-0.5">Hourly lead-call activity for today</p></div>
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">Today · IST</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CALL_TREND} margin={{ left: -20, right: 8, top: 8 }}>
              <defs><linearGradient id="attempted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/><XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)"/><YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)"/>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}/>
              <Area type="monotone" dataKey="attempted" name="Attempted" stroke="#2563eb" fill="url(#attempted)" strokeWidth={2}/>
              <Area type="monotone" dataKey="connected" name="Connected" stroke="#16a34a" fill="transparent" strokeWidth={2}/>
              <Area type="monotone" dataKey="missed" name="Missed" stroke="#dc2626" fill="transparent" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-muted-foreground">{[['#2563eb','Attempted'],['#16a34a','Connected'],['#dc2626','Missed']].map(([color,label]) => <span key={label} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{backgroundColor:color}} />{label}</span>)}</div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-success-bg/40"><div className="flex items-center gap-2"><ShieldCheck size={16} className="text-success"/><div><h3 className="text-[13px] font-semibold">Service Health</h3><p className="text-[10px] text-muted-foreground">All systems operational</p></div></div><span className="text-[10px] font-bold text-success">99.98% uptime</span></div>
          <div className="divide-y divide-border">{SERVICE_CHECKS.map((service) => <div key={service.label} className="flex items-center gap-3 px-4 py-3"><span className="w-7 h-7 rounded-lg bg-success-bg flex items-center justify-center"><Server size={13} className="text-success"/></span><div className="flex-1 min-w-0"><p className="text-[11px] font-semibold truncate">{service.label}</p><p className="text-[9px] text-muted-foreground">{service.detail}</p></div><div className="text-right"><p className="text-[10px] font-semibold text-success">{service.status}</p><p className="text-[9px] text-muted-foreground">{service.latency}</p></div></div>)}</div>
        </div>
      </div>

      {/* Outcomes + recent failures */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4">
        <div className="card-base p-5">
          <div className="mb-3">
            <h3 className="text-[14px] font-semibold text-foreground">Call Outcomes</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Today&apos;s disposition mix</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="value" strokeWidth={0}>
                    {outcomeData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[16px] font-bold text-foreground font-tabular">{totalCalls}</span>
                <span className="text-[9px] text-muted-foreground">calls</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {outcomeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">{item.name}</span>
                  <span className="text-[11px] font-semibold text-foreground font-tabular">
                    {totalCalls > 0 ? ((item.value / totalCalls) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-warning" />
              <h3 className="text-[14px] font-semibold text-foreground">Recent Failures</h3>
            </div>
            <button onClick={() => setStatusFilter('failed')} className="text-[11px] font-semibold text-primary hover:underline">View Full Logs</button>
          </div>
          <div className="space-y-2">
            {leads.filter((l) => l.status === 'failed').slice(0, 3).map((lead) => (
              <div key={lead.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-danger-bg/60 border border-danger-border">
                <XCircle size={13} className="text-danger mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">{lead.name} — {lead.campaign}</p>
                  <p className="text-[10px] text-danger mt-0.5">{lead.failureReason}</p>
                </div>
              </div>
            ))}
            {failedCount === 0 && (
              <p className="text-[11px] text-muted-foreground py-2">No failures — all leads synced successfully.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lead Sync Log */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Lead Sync Log</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Every lead captured via {getConnectorLabel(connectorType)} IVR — review sync status and failure reasons.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toast.success('Lead log refreshed')} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors"><RefreshCw size={12} /> Refresh</button>
              <button onClick={() => toast.success('Logs exported')} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors"><Download size={12} /> Export Logs</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or phone"
                className="h-8 pl-8 pr-3 w-52 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | LeadSyncStatus)} className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border appearance-none focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border appearance-none focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All Campaigns</option>
                {CAMPAIGNS.map((campaign) => <option key={campaign} value={campaign}>{campaign}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {(search || statusFilter !== 'all' || campaignFilter !== 'all') && (
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setCampaignFilter('all'); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <X size={11} /> Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[100px_1.2fr_1.3fr_1fr_1.6fr_100px] gap-3 px-4 py-2.5 bg-muted/40 border-b border-border items-center">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lead ID</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lead</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Campaign</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Received</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status / Failure Reason</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground text-center">Action</span>
            </div>
            <div className="divide-y divide-border">
              {paginatedLeads.map((lead) => {
                const meta = STATUS_META[lead.status];
                const StatusIcon = meta.icon;
                const isRetrying = retrying.has(lead.id);
                return (
                  <div key={lead.id} className="grid grid-cols-[100px_1.2fr_1.3fr_1fr_1.6fr_100px] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                    <span className="text-[11px] font-mono font-semibold text-foreground truncate" title={lead.id}>{lead.id}</span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-foreground truncate">{lead.name}</span>
                      <span className="block text-[10px] text-muted-foreground truncate">{lead.phone} · {lead.agent}</span>
                    </span>
                    <span className="text-[12px] text-muted-foreground truncate">{lead.campaign}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{lead.receivedAt}</span>
                    <div className="min-w-0">
                      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${meta.classes}`}>
                        <StatusIcon size={11} />{meta.label}
                      </span>
                      {lead.failureReason && (
                        <p className="text-[10px] text-danger mt-1 font-medium truncate" title={lead.failureReason}>{lead.failureReason}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      {lead.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => retryLead(lead.id)}
                          disabled={isRetrying}
                          className="flex items-center gap-1 h-7 px-2 text-[10px] font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                          title="Re-sync this lead"
                        >
                          {isRetrying ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                          {isRetrying ? '' : 'Retry'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredLeads.length === 0 && (
                <p className="px-4 py-10 text-center text-[12px] text-muted-foreground">No leads match the current search &amp; filters.</p>
              )}
            </div>
          </div>
        </div>

        {filteredLeads.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{rangeStart}-{rangeEnd}</span> of <span className="font-semibold text-foreground">{filteredLeads.length}</span> leads
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span className="text-[11px] font-medium text-foreground px-1">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center flex-wrap gap-3 pt-1 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 mt-4 bg-card border border-border text-[13px] font-medium rounded-lg hover:bg-muted active:scale-95 transition-all"
        >
          <ChevronLeft size={14} />Back to Previous
        </button>
        <button
          onClick={() => setCallLogsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 mt-4 bg-card border border-border text-[13px] font-medium rounded-lg hover:bg-muted active:scale-95 transition-all"
        >
          <History size={14} />
          View Call Logs
        </button>
        <button
          onClick={() => setAlertModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 mt-4 bg-card border border-border text-[13px] font-medium rounded-lg hover:bg-muted active:scale-95 transition-all"
        >
          <Bell size={14} />
          Configure Alerts
        </button>
        <Link href="/integration-monitoring" className="mt-4">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-[13px] font-medium rounded-lg hover:bg-muted active:scale-95 transition-all">
            <Activity size={14} />
            Open Full Monitoring
            <ExternalLink size={11} />
          </button>
        </Link>
        <button
          onClick={() => setCatalogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 mt-4 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          <Plus size={12} />
          Add Another Integration
        </button>
      </div>
    </div>
  );
}
