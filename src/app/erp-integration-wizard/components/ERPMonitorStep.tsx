'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, BarChart3, Bell, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Download,
  Edit2, LineChart as LineChartIcon, Loader2, PauseCircle,
  PieChart as PieChartIcon, RefreshCw, Search, Square, CheckSquare, TrendingUp, Wifi, X, XCircle,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ERPId, ERP_MAP } from './erpRegistry';
import Modal from '@/components/ui/Modal';

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
const OUTCOME_DATA = [{ name: 'Successful', value: 1284, color: 'var(--success)' }, { name: 'Failed', value: 23, color: 'var(--danger)' }];

/* ─── Lead push log ──────────────────────────────────────────────────────── */
type PushStatus = 'pushed' | 'not_pushed' | 'error';

interface LeadLog {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  attemptedAt: string;
  status: PushStatus;
  rootCause?: string;
  requestCurl: string;
  responseStatus: number;
  responseBody: string;
}

const SOURCES = ['Microsoft Dynamics 365', 'SAP S/4 HANA', 'Oracle NetSuite', 'Salesforce', 'HubSpot', 'Zoho ERP'];

function buildCurl(instanceUrl: string, lead: { FirstName: string; LastName: string; Email: string; Phone: string; LeadSource: string; Company: string }) {
  return `curl -X POST "${instanceUrl}/services/data/v58.0/sobjects/Lead" \\
  -H "Authorization: Bearer {access_token}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(lead, null, 2)}'`;
}

interface LeadSeed {
  name: string; email: string; phone: string; source: string; company: string;
  attemptedAt: string; status: PushStatus; rootCause?: string;
  responseStatus: number; responseBody: string;
}

const LEAD_SEEDS: LeadSeed[] = [
  { name: 'Ananya Rao', email: 'ananya.rao@gmail.com', phone: '+91 98450 12233', source: 'Salesforce', company: 'Self-employed', attemptedAt: '09:42:15', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbCzEAK', success: true, errors: [] }, null, 2) },
  { name: 'Vikram Shah', email: '', phone: '+91 90040 55211', source: 'Microsoft Dynamics 365', company: 'Shah Traders', attemptedAt: '09:41:30', status: 'error', rootCause: 'Required field missing: Email', responseStatus: 400, responseBody: JSON.stringify([{ message: 'Required fields are missing: [Email]', errorCode: 'REQUIRED_FIELD_MISSING', fields: ['Email'] }], null, 2) },
  { name: 'Priya Menon', email: 'priya.menon@outlook.com', phone: '+91 97170 88342', source: 'HubSpot', company: 'Menon Consulting', attemptedAt: '09:40:55', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbD1EAK', success: true, errors: [] }, null, 2) },
  { name: 'Karthik Iyer', email: 'karthik.iyer@bizmail.com', phone: '+91 99010 22114', source: 'Oracle NetSuite', company: 'Iyer & Co', attemptedAt: '09:39:12', status: 'not_pushed', rootCause: 'Waiting in sync queue — retries in next scheduled run', responseStatus: 0, responseBody: '— not yet sent —' },
  { name: 'Fatima Sheikh', email: 'fatima.sheikh@gmail.com', phone: '+91 98220 77654', source: 'Zoho ERP', company: 'Self-employed', attemptedAt: '09:38:22', status: 'error', rootCause: 'ERP API timed out after 30 seconds', responseStatus: 504, responseBody: JSON.stringify([{ message: 'The request timed out. Try again later.', errorCode: 'REQUEST_TIMEOUT' }], null, 2) },
  { name: 'Rohan Deshmukh', email: 'rohan.d@corpmail.com', phone: '+91 96650 33298', source: 'SAP S/4 HANA', company: 'Deshmukh Industries', attemptedAt: '09:37:44', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbD8EAK', success: true, errors: [] }, null, 2) },
  { name: 'Neha Gupta', email: 'neha.gupta@gmail.com', phone: 'invalid-number', source: 'Salesforce', company: 'Gupta Retail', attemptedAt: '09:36:05', status: 'error', rootCause: 'Invalid value for field: Phone ("invalid-number" is not a valid phone number)', responseStatus: 400, responseBody: JSON.stringify([{ message: 'Phone: invalid phone number: invalid-number', errorCode: 'INVALID_FIELD', fields: ['Phone'] }], null, 2) },
  { name: 'Arjun Nair', email: 'arjun.nair@gmail.com', phone: '+91 90350 44112', source: 'HubSpot', company: 'Nair Enterprises', attemptedAt: '09:35:18', status: 'not_pushed', rootCause: 'Waiting in sync queue — retries in next scheduled run', responseStatus: 0, responseBody: '— not yet sent —' },
  { name: 'Simran Kaur', email: 'simran.kaur@gmail.com', phone: '+91 98980 66771', source: 'Microsoft Dynamics 365', company: 'Self-employed', attemptedAt: '09:34:02', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDFEAK', success: true, errors: [] }, null, 2) },
  { name: 'Deepak Verma', email: 'deepak.verma@corpmail.com', phone: '+91 99870 11223', source: 'Oracle NetSuite', company: 'Verma Logistics', attemptedAt: '09:33:40', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDGEAK', success: true, errors: [] }, null, 2) },
  { name: 'Ritu Chawla', email: 'ritu.chawla@gmail.com', phone: '+91 98110 44556', source: 'Zoho ERP', company: 'Chawla Interiors', attemptedAt: '09:32:58', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDHEAK', success: true, errors: [] }, null, 2) },
  { name: 'Manoj Pillai', email: '', phone: '+91 90080 22337', source: 'SAP S/4 HANA', company: 'Pillai Exports', attemptedAt: '09:31:20', status: 'error', rootCause: 'Required field missing: Email', responseStatus: 400, responseBody: JSON.stringify([{ message: 'Required fields are missing: [Email]', errorCode: 'REQUIRED_FIELD_MISSING', fields: ['Email'] }], null, 2) },
  { name: 'Sneha Kulkarni', email: 'sneha.k@gmail.com', phone: '+91 97640 33221', source: 'Salesforce', company: 'Kulkarni & Sons', attemptedAt: '09:30:05', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDIEAK', success: true, errors: [] }, null, 2) },
  { name: 'Aditya Bhatt', email: 'aditya.bhatt@bizmail.com', phone: '+91 96330 55009', source: 'HubSpot', company: 'Bhatt Realty', attemptedAt: '09:28:47', status: 'not_pushed', rootCause: 'Waiting in sync queue — retries in next scheduled run', responseStatus: 0, responseBody: '— not yet sent —' },
  { name: 'Pooja Reddy', email: 'pooja.reddy@gmail.com', phone: '+91 90420 66118', source: 'Microsoft Dynamics 365', company: 'Reddy Textiles', attemptedAt: '09:27:12', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDJEAK', success: true, errors: [] }, null, 2) },
  { name: 'Suresh Kumar', email: 'suresh.kumar@gmail.com', phone: 'invalid-number', source: 'Oracle NetSuite', company: 'Kumar Hardware', attemptedAt: '09:26:03', status: 'error', rootCause: 'Invalid value for field: Phone ("invalid-number" is not a valid phone number)', responseStatus: 400, responseBody: JSON.stringify([{ message: 'Phone: invalid phone number: invalid-number', errorCode: 'INVALID_FIELD', fields: ['Phone'] }], null, 2) },
  { name: 'Divya Krishnan', email: 'divya.k@outlook.com', phone: '+91 98760 12987', source: 'Zoho ERP', company: 'Krishnan Foods', attemptedAt: '09:24:55', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDKEAK', success: true, errors: [] }, null, 2) },
  { name: 'Amitabh Joshi', email: 'amitabh.joshi@corpmail.com', phone: '+91 99500 44778', source: 'SAP S/4 HANA', company: 'Joshi Motors', attemptedAt: '09:23:38', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDLEAK', success: true, errors: [] }, null, 2) },
  { name: 'Kavya Menon', email: 'kavya.menon@gmail.com', phone: '+91 90910 22665', source: 'Salesforce', company: 'Menon Designs', attemptedAt: '09:22:14', status: 'not_pushed', rootCause: 'Waiting in sync queue — retries in next scheduled run', responseStatus: 0, responseBody: '— not yet sent —' },
  { name: 'Rahul Malhotra', email: 'rahul.m@bizmail.com', phone: '+91 98230 55443', source: 'HubSpot', company: 'Malhotra Autos', attemptedAt: '09:21:02', status: 'error', rootCause: 'ERP API timed out after 30 seconds', responseStatus: 504, responseBody: JSON.stringify([{ message: 'The request timed out. Try again later.', errorCode: 'REQUEST_TIMEOUT' }], null, 2) },
  { name: 'Meera Pandey', email: 'meera.pandey@gmail.com', phone: '+91 97010 66332', source: 'Microsoft Dynamics 365', company: 'Pandey Textiles', attemptedAt: '09:19:47', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDMEAK', success: true, errors: [] }, null, 2) },
  { name: 'Yash Trivedi', email: 'yash.trivedi@gmail.com', phone: '+91 98880 11774', source: 'Oracle NetSuite', company: 'Trivedi Traders', attemptedAt: '09:18:29', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDNEAK', success: true, errors: [] }, null, 2) },
  { name: 'Ishita Bose', email: '', phone: '+91 90650 22119', source: 'Zoho ERP', company: 'Bose Consultants', attemptedAt: '09:17:10', status: 'error', rootCause: 'Required field missing: Email', responseStatus: 400, responseBody: JSON.stringify([{ message: 'Required fields are missing: [Email]', errorCode: 'REQUIRED_FIELD_MISSING', fields: ['Email'] }], null, 2) },
  { name: 'Nikhil Saxena', email: 'nikhil.saxena@gmail.com', phone: '+91 99340 77556', source: 'SAP S/4 HANA', company: 'Saxena Pharma', attemptedAt: '09:15:52', status: 'pushed', responseStatus: 201, responseBody: JSON.stringify({ id: '00Q5f000003AbDOEAK', success: true, errors: [] }, null, 2) },
];

const MOCK_LEADS: LeadLog[] = LEAD_SEEDS.map((seed, index) => {
  const [FirstName, ...rest] = seed.name.split(' ');
  const LastName = rest.join(' ') || FirstName;
  return {
    id: `lead-${1001 + index}`,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    source: seed.source,
    attemptedAt: seed.attemptedAt,
    status: seed.status,
    rootCause: seed.rootCause,
    responseStatus: seed.responseStatus,
    responseBody: seed.responseBody,
    requestCurl: buildCurl('https://your-org.salesforce.com', { FirstName, LastName, Email: seed.email, Phone: seed.phone, LeadSource: seed.source, Company: seed.company }),
  };
});

const STATUS_META: Record<PushStatus, { label: string; classes: string; icon: React.ElementType }> = {
  pushed: { label: 'Pushed', classes: 'bg-success-bg text-success border-success-border', icon: CheckCircle },
  error: { label: 'Error', classes: 'bg-danger-bg text-danger border-danger-border', icon: XCircle },
  not_pushed: { label: 'Not Pushed', classes: 'bg-warning-bg text-warning border-warning-border', icon: AlertTriangle },
};

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(code); toast.success(`${label} copied`); }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Copy size={11} /> Copy
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono leading-relaxed text-foreground bg-card overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );
}

export default function ERPMonitorStep({ erpId, onBack }: ERPMonitorStepProps) {
  const erp = ERP_MAP[erpId];
  const [notifications, setNotifications] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const statusLabel = disabled ? 'Disconnected' : 'Connected';

  /* ── Lead sync log state ── */
  const logSectionRef = useRef<HTMLDivElement>(null);
  const [leads, setLeads] = useState<LeadLog[]>(MOCK_LEADS);
  const [leadSearch, setLeadSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PushStatus>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rePushing, setRePushing] = useState<Set<string>>(new Set());
  const [editingLead, setEditingLead] = useState<LeadLog | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', email: '', phone: '' });

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const matchSearch = !leadSearch.trim() || lead.name.toLowerCase().includes(leadSearch.toLowerCase()) || lead.email.toLowerCase().includes(leadSearch.toLowerCase());
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  }), [leads, leadSearch, statusFilter, sourceFilter]);

  /* ── Pagination ── */
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [leadSearch, statusFilter, sourceFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginatedLeads = useMemo(
    () => filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLeads, page],
  );
  const rangeStart = filteredLeads.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredLeads.length);

  const eligibleSelectedCount = useMemo(
    () => leads.filter((lead) => selected.has(lead.id) && lead.status !== 'pushed').length,
    [leads, selected],
  );
  const allVisibleSelected = filteredLeads.length > 0 && filteredLeads.every((lead) => selected.has(lead.id));

  const toggleSelectAll = () => {
    setSelected((current) => {
      if (allVisibleSelected) return new Set();
      return new Set(filteredLeads.map((lead) => lead.id));
    });
  };
  const toggleSelectLead = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const rePushLead = (id: string) => {
    setRePushing((current) => new Set(current).add(id));
    setTimeout(() => {
      setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status: 'pushed', rootCause: undefined, responseStatus: 201, responseBody: JSON.stringify({ id: `00Q5f000003${Math.floor(Math.random() * 9000 + 1000)}EAK`, success: true, errors: [] }, null, 2) } : lead));
      setRePushing((current) => { const next = new Set(current); next.delete(id); return next; });
      toast.success('Lead re-pushed successfully');
    }, 1100);
  };

  const bulkRePush = () => {
    const targets = leads.filter((lead) => selected.has(lead.id) && lead.status !== 'pushed').map((lead) => lead.id);
    if (targets.length === 0) return;
    setRePushing((current) => new Set([...current, ...targets]));
    setTimeout(() => {
      setLeads((current) => current.map((lead) => targets.includes(lead.id) ? { ...lead, status: 'pushed', rootCause: undefined, responseStatus: 201, responseBody: JSON.stringify({ id: `00Q5f000003${Math.floor(Math.random() * 9000 + 1000)}EAK`, success: true, errors: [] }, null, 2) } : lead));
      setRePushing((current) => { const next = new Set(current); targets.forEach((id) => next.delete(id)); return next; });
      setSelected(new Set());
      toast.success(`${targets.length} lead${targets.length > 1 ? 's' : ''} re-pushed successfully`);
    }, 1300);
  };

  const openEdit = (lead: LeadLog) => {
    setEditingLead(lead);
    setEditDraft({ name: lead.name, email: lead.email, phone: lead.phone });
  };
  const saveEdit = () => {
    if (!editingLead) return;
    setLeads((current) => current.map((lead) => lead.id === editingLead.id ? { ...lead, name: editDraft.name, email: editDraft.email, phone: editDraft.phone } : lead));
    setEditingLead(null);
    toast.success('Lead updated');
  };

  const scrollToLogs = () => {
    setStatusFilter('error');
    logSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${erp?.iconBg || 'bg-muted'} flex items-center justify-center text-[11px] font-bold text-foreground`}>{erp?.iconText}</div>
          <div><div className="flex items-center gap-2"><h2 className="text-[19px] font-bold text-foreground">Monitor</h2><span className="flex items-center gap-1 text-[10px] font-semibold text-success"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Live health</span></div><p className="text-[12px] text-muted-foreground mt-0.5">Post-activation health, sync performance, and operational controls for {erp?.name}.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDisabled((value) => !value)} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors"><PauseCircle size={12} /> {disabled ? 'Enable Integration' : 'Disable Integration'}</button>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Integration status</p><p className="text-[15px] font-semibold text-foreground mt-1">{erp?.name} ERP sync</p></div><span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${disabled ? 'text-danger bg-danger-bg border-danger-border' : 'text-success bg-success-bg border-success-border'}`}><Wifi size={12} />{statusLabel}</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{ label: 'Environment', value: 'Production' }, { label: 'Last Sync', value: '2 min ago' }, { label: 'Next Scheduled Sync', value: 'In 13 min' }, { label: 'Sync Frequency', value: 'Every 15 min' }].map((item) => <div key={item.label} className="p-3 rounded-lg bg-muted/40 border border-border"><p className="text-[10px] text-muted-foreground">{item.label}</p><p className="text-[12px] font-semibold text-foreground mt-1">{item.value}</p></div>)}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[{ label: 'Successful Syncs', value: '1,284', trend: '+12.4%', icon: CheckCircle, color: 'text-success' }, { label: 'Failed Syncs', value: '23', trend: 'View errors', icon: XCircle, color: 'text-danger' }, { label: 'Avg Sync Time', value: '143ms', trend: '-8ms', icon: Activity, color: 'text-primary' }, { label: 'Records Processed', value: '1,307', trend: '+9.8%', icon: TrendingUp, color: 'text-primary' }].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="card-base p-3.5"><div className="flex items-center justify-between"><Icon size={16} className={metric.color} /><span className={`text-[10px] font-semibold ${metric.label === 'Failed Syncs' ? 'text-danger' : 'text-success'}`}>{metric.trend}</span></div><p className="text-[21px] font-bold text-foreground mt-2">{metric.value}</p><p className="text-[10px] text-muted-foreground">{metric.label}</p></div>; })}</div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <div className="card-base p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><LineChartIcon size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Sync volume</p></div><span className="text-[10px] text-muted-foreground">Today</span></div><ResponsiveContainer width="100%" height={220}><LineChart data={VOLUME_DATA} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} /><YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} /><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} /><Line type="monotone" dataKey="records" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        <div className="card-base p-4"><div className="flex items-center gap-2 mb-3"><PieChartIcon size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Sync outcomes</p></div><div className="flex items-center justify-center gap-5"><ResponsiveContainer width={170} height={170}><PieChart><Pie data={OUTCOME_DATA} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>{OUTCOME_DATA.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="space-y-3">{OUTCOME_DATA.map((item) => <div key={item.name}><div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div><p className="text-[17px] font-bold text-foreground">{item.value.toLocaleString()}</p></div>)}</div></div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
        <div className="card-base p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><BarChart3 size={15} className="text-primary" /><p className="text-[13px] font-semibold text-foreground">Records by entity</p></div><span className="text-[10px] text-muted-foreground">Last 24 hours</span></div><ResponsiveContainer width="100%" height={190}><BarChart data={ENTITY_DATA} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="entity" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} /><YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} /><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} /><Bar dataKey="records" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="card-base p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><AlertTriangle size={15} className="text-warning" /><p className="text-[13px] font-semibold text-foreground">Errors &amp; alerts</p></div><button onClick={scrollToLogs} className="text-[11px] font-semibold text-primary hover:underline">View Full Logs</button></div><div className="space-y-2">{EVENT_LOGS.filter((event) => event.status === 'error').slice(0, 3).map((event) => <div key={event.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-danger-bg/60 border border-danger-border"><XCircle size={13} className="text-danger mt-0.5" /><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-foreground">{event.detail}</p><p className="text-[10px] text-muted-foreground mt-0.5">{event.time} · {event.code}</p></div></div>)}</div><label className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><Bell size={13} />Enable notifications</span><input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="w-4 h-4 accent-primary" /></label></div>
      </div>

      {/* ── Lead Sync Log ── */}
      <div ref={logSectionRef} className="card-base overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Lead Sync Log</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Every lead sent to {erp?.name} — review push status, inspect the request &amp; response, and re-push failed leads.</p>
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
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder="Search name or email"
                className="h-8 pl-8 pr-3 w-52 text-[12px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | PushStatus)} className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border appearance-none focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All Status</option>
                <option value="pushed">Pushed</option>
                <option value="not_pushed">Not Pushed</option>
                <option value="error">Error</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-8 pl-3 pr-7 text-[12px] bg-muted rounded-md border border-border appearance-none focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All Sources</option>
                {SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {(leadSearch || statusFilter !== 'all' || sourceFilter !== 'all') && (
              <button onClick={() => { setLeadSearch(''); setStatusFilter('all'); setSourceFilter('all'); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <X size={11} /> Clear filters
              </button>
            )}
            {eligibleSelectedCount > 0 && (
              <button
                onClick={bulkRePush}
                className="flex items-center gap-1.5 h-8 px-3 ml-auto text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw size={12} /> Re-Push Selected ({eligibleSelectedCount})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[28px_92px_1.2fr_0.9fr_0.8fr_1.2fr_110px] gap-3 px-4 py-2.5 bg-muted/40 border-b border-border items-center">
              <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                {allVisibleSelected ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lead ID</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lead</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Source</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Attempted</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status / Root Cause</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground text-center">Actions</span>
            </div>
            <div className="divide-y divide-border">
              {paginatedLeads.map((lead) => {
                const meta = STATUS_META[lead.status];
                const StatusIcon = meta.icon;
                const isOpen = expanded === lead.id;
                const isRePushing = rePushing.has(lead.id);
                return (
                  <div key={lead.id}>
                    <div className="grid grid-cols-[28px_92px_1.2fr_0.9fr_0.8fr_1.2fr_110px] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                      <button onClick={() => toggleSelectLead(lead.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        {selected.has(lead.id) ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
                      </button>
                      <span className="text-[11px] font-mono font-semibold text-foreground truncate" title={lead.id}>{lead.id}</span>
                      <button onClick={() => setExpanded(isOpen ? null : lead.id)} className="flex items-center gap-1.5 min-w-0 text-left">
                        {isOpen ? <ChevronUp size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />}
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold text-foreground truncate">{lead.name}</span>
                          <span className="block text-[10px] text-muted-foreground truncate">{lead.email || '— no email —'}</span>
                        </span>
                      </button>
                      <span className="text-[12px] text-muted-foreground truncate">{lead.source}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{lead.attemptedAt}</span>
                      <div className="min-w-0">
                        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${meta.classes}`}>
                          <StatusIcon size={11} />{meta.label}
                        </span>
                        {lead.rootCause && <p className="text-[10px] text-muted-foreground mt-1 truncate" title={lead.rootCause}>{lead.rootCause}</p>}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => openEdit(lead)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="Edit lead">
                          <Edit2 size={13} />
                        </button>
                        {lead.status !== 'pushed' && (
                          <button
                            type="button"
                            onClick={() => rePushLead(lead.id)}
                            disabled={isRePushing}
                            className="flex items-center gap-1 h-7 px-2 text-[10px] font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                            title="Re-push this lead"
                          >
                            {isRePushing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            {isRePushing ? '' : 'Re-Push'}
                          </button>
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 bg-muted/20 border-t border-border/60 space-y-3">
                        {lead.rootCause && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning-bg border border-warning-border">
                            <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-warning"><span className="font-semibold">Root cause:</span> {lead.rootCause}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <CodeBlock label="Request" code={lead.requestCurl} />
                          <CodeBlock label={`Response ${lead.responseStatus ? `(${lead.responseStatus})` : ''}`} code={lead.responseBody} />
                        </div>
                      </div>
                    )}
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

      <Modal
        open={editingLead !== null}
        onClose={() => setEditingLead(null)}
        title="Edit Lead"
        subtitle="Update the details before re-pushing this lead."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingLead(null)} className="h-8 px-3 text-[11px] font-medium border border-border rounded-lg hover:bg-muted">Cancel</button>
            <button type="button" onClick={saveEdit} className="h-8 px-4 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">Save Changes</button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-[12px] font-semibold text-foreground mb-1">Name</span>
            <input value={editDraft.name} onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} className="w-full h-9 px-3 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </label>
          <label className="block">
            <span className="block text-[12px] font-semibold text-foreground mb-1">Email</span>
            <input value={editDraft.email} onChange={(event) => setEditDraft((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" className="w-full h-9 px-3 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </label>
          <label className="block">
            <span className="block text-[12px] font-semibold text-foreground mb-1">Phone</span>
            <input value={editDraft.phone} onChange={(event) => setEditDraft((current) => ({ ...current, phone: event.target.value }))} className="w-full h-9 px-3 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </label>
        </div>
      </Modal>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button onClick={onBack} className="flex items-center gap-1.5 h-9 px-4 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={14} /> Back to Previous Step
        </button>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-muted-foreground">Last health check: 2 minutes ago</p>
        </div>
      </div>
    </div>
  );
}
