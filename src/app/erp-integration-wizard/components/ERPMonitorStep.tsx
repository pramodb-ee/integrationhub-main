'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, Bell, CheckCircle, ChevronLeft, Download,
  ExternalLink, Filter, LineChart as LineChartIcon, ListFilter, PauseCircle,
  PieChart as PieChartIcon, RefreshCw, Settings2, TestTube2, TrendingUp, Wifi, XCircle,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ERPId, ERP_MAP } from './erpRegistry';
import Link from 'next/link';

interface ERPMonitorStepProps {
  erpId: ERPId;
  onBack?: () => void;
  onFinish?: () => void;
}

type EventStatus = 'success' | 'error' | 'warning';

const EVENT_LOGS: { id: string; time: string; event: string; status: EventStatus; detail: string; code: string; latency: string }[] = [
  { id: 'event-1', time: '09:42:15', event: 'Sync completed', status: 'success', detail: 'Lead records created and updated', code: 'SYNC_200', latency: '142ms' },
  { id: 'event-2', time: '09:41:30', event: 'Sync failed', status: 'error', detail: 'Required email field missing', code: 'MAP_422', latency: '—' },
  { id: 'event-3', time: '09:40:55', event: 'Sync completed', status: 'success', detail: 'Contact records updated', code: 'SYNC_200', latency: '155ms' },
  { id: 'event-4', time: '09:39:44', event: 'Rate limit warning', status: 'warning', detail: '80% of hourly API quota used', code: 'RATE_080', latency: '—' },
  { id: 'event-5', time: '09:38:22', event: 'Sync failed', status: 'error', detail: 'ERP API timed out after 30 seconds', code: 'API_504', latency: '30000ms' },
  { id: 'event-6', time: '09:37:10', event: 'Sync completed', status: 'success', detail: 'Lead records created', code: 'SYNC_200', latency: '161ms' },
];

const VOLUME_DATA = [
  { time: '06:00', records: 180 }, { time: '08:00', records: 320 }, { time: '10:00', records: 460 },
  { time: '12:00', records: 390 }, { time: '14:00', records: 540 }, { time: '16:00', records: 610 }, { time: '18:00', records: 480 },
];
const ENTITY_DATA = [
  { entity: 'Leads', records: 620 }, { entity: 'Contacts', records: 410 }, { entity: 'Accounts', records: 190 }, { entity: 'Activities', records: 87 },
];
const OUTCOME_DATA = [{ name: 'Successful', value: 1284, color: '#16a34a' }, { name: 'Failed', value: 23, color: '#dc2626' }];

export default function ERPMonitorStep({ erpId, onBack, onFinish }: ERPMonitorStepProps) {
  const erp = ERP_MAP[erpId];
  const [eventFilter, setEventFilter] = useState<'all' | EventStatus>('all');
  const [notifications, setNotifications] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [lastTested, setLastTested] = useState<string | null>(null);

  const events = useMemo(
    () => eventFilter === 'all' ? EVENT_LOGS : EVENT_LOGS.filter((event) => event.status === eventFilter),
    [eventFilter],
  );
  const statusLabel = disabled ? 'Disconnected' : 'Connected';

  const statusIcon = (status: EventStatus) => {
    if (status === 'success') return <CheckCircle size={14} className="text-green-600" />;
    if (status === 'error') return <XCircle size={14} className="text-red-500" />;
    return <AlertTriangle size={14} className="text-yellow-600" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted text-muted-foreground">
          <ChevronLeft size={14} /> Back to Previous Step
        </button>
        <button onClick={onFinish} className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">
          <CheckCircle size={13} /> Save &amp; Activate
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${erp?.iconBg || 'bg-gray-100'} flex items-center justify-center text-[11px] font-bold text-gray-700`}>{erp?.iconText}</div>
          <div><div className="flex items-center gap-2"><h2 className="text-[19px] font-bold text-foreground">Monitor</h2><span className="flex items-center gap-1 text-[10px] font-semibold text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live health</span></div><p className="text-[12px] text-muted-foreground mt-0.5">Post-activation health, sync performance, and operational controls for {erp?.name}.</p></div>
        </div>
        <div className="flex items-center gap-2"><button onClick={() => setLastTested('just now')} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted"><TestTube2 size={12} /> Test Connection</button><button onClick={() => setDisabled((value) => !value)} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted"><PauseCircle size={12} /> {disabled ? 'Enable Integration' : 'Disable Integration'}</button><button className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted"><Download size={12} /> Export Logs</button></div>
      </div>
      {lastTested && <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Connection test completed {lastTested}. API credentials and endpoint are reachable.</p>}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Integration status</p><p className="text-[15px] font-semibold text-foreground mt-1">{erp?.name} ERP sync</p></div><span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${disabled ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}><Wifi size={12} />{statusLabel}</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{ label: 'Environment', value: 'Production' }, { label: 'Last Sync', value: '2 min ago' }, { label: 'Next Scheduled Sync', value: 'In 13 min' }, { label: 'Sync Frequency', value: 'Every 15 min' }].map((item) => <div key={item.label} className="p-3 rounded-lg bg-muted/40 border border-border"><p className="text-[10px] text-muted-foreground">{item.label}</p><p className="text-[12px] font-semibold text-foreground mt-1">{item.value}</p></div>)}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[{ label: 'Successful Syncs', value: '1,284', trend: '+12.4%', icon: CheckCircle, color: 'text-green-600' }, { label: 'Failed Syncs', value: '23', trend: 'View errors', icon: XCircle, color: 'text-red-500' }, { label: 'Avg Sync Time', value: '143ms', trend: '-8ms', icon: Activity, color: 'text-primary' }, { label: 'Records Processed', value: '1,307', trend: '+9.8%', icon: TrendingUp, color: 'text-primary' }].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-xl border border-border bg-card p-3.5"><div className="flex items-center justify-between"><Icon size={16} className={metric.color} /><span className={`text-[10px] font-semibold ${metric.label === 'Failed Syncs' ? 'text-red-600' : 'text-green-600'}`}>{metric.trend}</span></div><p className="text-[21px] font-bold text-foreground mt-2">{metric.value}</p><p className="text-[10px] text-muted-foreground">{metric.label}</p></div>; })}</div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><LineChartIcon size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Sync volume</p></div><span className="text-[10px] text-muted-foreground">Today</span></div><ResponsiveContainer width="100%" height={220}><LineChart data={VOLUME_DATA} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="time" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="records" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-2 mb-3"><PieChartIcon size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Sync outcomes</p></div><div className="flex items-center justify-center gap-5"><ResponsiveContainer width={170} height={170}><PieChart><Pie data={OUTCOME_DATA} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>{OUTCOME_DATA.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="space-y-3">{OUTCOME_DATA.map((item) => <div key={item.name}><div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div><p className="text-[17px] font-bold text-foreground">{item.value.toLocaleString()}</p></div>)}</div></div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
        <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><BarChart3 size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Records by entity</p></div><span className="text-[10px] text-muted-foreground">Last 24 hours</span></div><ResponsiveContainer width="100%" height={190}><BarChart data={ENTITY_DATA} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="entity" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="records" fill="#14B8A6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><AlertTriangle size={15} className="text-yellow-600" /><p className="text-[13px] font-semibold text-foreground">Errors &amp; alerts</p></div><button className="text-[11px] font-semibold text-primary hover:underline">View Full Logs</button></div><div className="space-y-2">{EVENT_LOGS.filter((event) => event.status === 'error').slice(0, 3).map((event) => <div key={event.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50/60 border border-red-100"><XCircle size={13} className="text-red-500 mt-0.5" /><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-foreground">{event.detail}</p><p className="text-[10px] text-muted-foreground mt-0.5">{event.time} · {event.code}</p></div></div>)}</div><label className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><Bell size={13} />Enable notifications</span><input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="w-4 h-4 accent-primary" /></label></div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2"><ListFilter size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Activity timeline</p></div><div className="flex items-center gap-1">{(['all', 'success', 'error', 'warning'] as const).map((filter) => <button key={filter} onClick={() => setEventFilter(filter)} className={`h-7 px-2.5 text-[10px] font-semibold rounded-full border capitalize ${eventFilter === filter ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}>{filter}</button>)}</div></div><div className="divide-y divide-border">{events.map((event) => <div key={event.id} className="flex items-center gap-3 py-2.5"><div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">{statusIcon(event.status)}</div><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-foreground">{event.event}</p><p className="text-[10px] text-muted-foreground truncate">{event.detail} · <span className="font-mono">{event.code}</span></p></div><span className="text-[10px] text-muted-foreground font-mono">{event.time}</span></div>)}{events.length === 0 && <p className="py-6 text-center text-[11px] text-muted-foreground">No events match this filter.</p>}</div></div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1"><div className="flex items-center gap-2"><Settings2 size={13} className="text-muted-foreground" /><Link href="/erp-integration-wizard"><button className="h-8 px-3 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5">Reconfigure</button></Link></div><p className="text-[10px] text-muted-foreground">Last health check: 2 minutes ago</p></div>
    </div>
  );
}
