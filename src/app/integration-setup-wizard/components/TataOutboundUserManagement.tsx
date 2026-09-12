'use client';

import OverlayPortal from '@/components/ui/OverlayPortal';
import { SetupEditContext, useSetupState } from '@/app/components/integrationSetupStore';
import type { ConnectorType } from '@/components/ui/ConnectorIcon';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Modal from '@/components/ui/Modal';
import TataCallLogsPanel from './TataCallLogsPanel';
import * as XLSX from 'xlsx';
import {
  CheckCircle2, Copy, Download, Edit2, History, MoreHorizontal, Pause, Phone, PhoneCall, Play, Plus,
  Trash2, Upload, UserPlus, X, XCircle,
} from 'lucide-react';

// Columns of the bulk-upload Excel/CSV template — mirrors every field in the Add/Edit Outbound User panel.
const TEMPLATE_HEADERS = [
  'UserName', 'UserId', 'Email', 'CallForwardNumber', 'IsActive', 'AgentId', 'CampaignName', 'Setting',
  'Mapping', 'HttpClientHeaders', 'HttpMethod', 'CountryCode', 'orderid', 'retrydelta', 'callretries', 'Baseurl',
  'IsExtension', 'EmpId',
] as const;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => { row[header] = cells[index] ?? ''; });
    return row;
  });
}

// Technical / API fields shown below the core identity fields in the Add Outbound User panel.
const REMAINING_FIELDS = [
  ['httpMethod', 'HttpMethod', 'e.g. POST'],
  ['setting', 'Setting', 'Enter setting'], ['mapping', 'Mapping', 'Enter mapping details'], ['httpClientHeaders', 'HttpClientHeaders', 'e.g. Content-Type: application/json'],
] as const;

// Directory of known employees — selecting a name auto-fills their known details.
const DIRECTORY_USERS = [
  { name: 'Priya Sharma',  userId: 'U1001', mobile: '+91 9876543210', email: 'priya.sharma@company.com',  empId: '081818881001' },
  { name: 'Rahul Verma',   userId: 'U1002', mobile: '+91 9823456712', email: 'rahul.verma@company.com',   empId: '081818881002' },
  { name: 'Kavya Iyer',    userId: 'U1003', mobile: '+91 9765432109', email: 'kavya.iyer@company.com',    empId: '081818881003' },
  { name: 'Sneha Patel',   userId: 'U1004', mobile: '+91 9654321098', email: 'sneha.patel@company.com',   empId: '081818881004' },
  { name: 'Meera Nair',    userId: 'U1005', mobile: '+91 9543210987', email: 'meera.nair@company.com',    empId: '081818881005' },
] as const;

const CALL_FAILURE_REASONS = [
  'No answer within 30 seconds',
  'Agent extension not reachable',
  'Invalid or unreachable Call Forward Number',
  'Call queue timeout — no available line',
];

type User = { name: string; mobile: string; email: string; extension: string; status: 'Active' | 'Inactive'; extra?: Record<string, string> };
type ConfirmAction = { action: 'Delete' | 'Deactivate' | 'Activate'; index: number } | null;
type Notice = { title: string; detail: string } | null;
type TestCallResponse = { callId: string; to: string; agent: string; status: string; duration?: string; reason?: string; timestamp: string };
type TestCallResult = { index: number; outcome: 'success' | 'failed'; response: TestCallResponse } | null;

const DEFAULT_OUTBOUND_USERS: User[] = [
  { name: 'Priya Sharma', mobile: '+91 9876543210', email: 'priya.sharma@company.com', extension: '081818881001', status: 'Active', extra: { userId: 'U1001', agentId: 'AGT-101', campaignName: 'Inbound Sales Line' } },
  { name: 'Rahul Verma', mobile: '+91 9823456712', email: 'rahul.verma@company.com', extension: '081818881002', status: 'Active', extra: { userId: 'U1002', agentId: 'AGT-102', campaignName: 'Missed Call Follow-up' } },
  { name: 'Kavya Iyer', mobile: '+91 9765432109', email: 'kavya.iyer@company.com', extension: 'Not created', status: 'Inactive', extra: { userId: 'U1003', agentId: 'AGT-103', campaignName: 'Click-to-Call Campaign' } },
];
const OUTBOUND_USERS_STORAGE_KEY = 'integrationhub-tata-outbound-users';

const inputClass = 'w-full h-9 px-3 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
const labelClass = 'block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide';

const AVATAR_COLORS = ['#2563eb', '#0d9488', '#7c3aed', '#d97706', '#dc2626', '#16a34a', '#0891b2', '#c026d3'];
function avatarColor(name: string) {
  const sum = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
}

function Toggle({ value, onChange, labels = ['NO', 'YES'] }: { value: boolean; onChange: (value: boolean) => void; labels?: [string, string] }) {
  return <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"><button type="button" onClick={() => onChange(false)} className={`h-7 px-3 text-[11px] font-semibold rounded-md ${!value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{labels[0]}</button><button type="button" onClick={() => onChange(true)} className={`h-7 px-3 text-[11px] font-semibold rounded-md ${value ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{labels[1]}</button></div>;
}

interface TataOutboundUserManagementProps {
  connectorType?: ConnectorType;
  onTestCallSuccess?: () => void;
}

export default function TataOutboundUserManagement({ onTestCallSuccess, connectorType = 'tata' }: TataOutboundUserManagementProps) {
  const outboundFields: ReadonlyArray<readonly [string, string, string]> = [
    ...REMAINING_FIELDS.filter(([key]) => connectorType !== 'mcube' || !['httpMethod', 'mapping', 'httpClientHeaders'].includes(key)),
    ...(connectorType === 'exotel' ? [['baseurl', 'BaseUrl', 'https://api.example.com'] as const] : []),
    ...(connectorType === 'knowlarity' ? [['countryCode', 'CountryCode', 'e.g. +91'] as const] : []),
  ];
  const editContext = React.useContext(SetupEditContext);
  const [users, setUsers] = useSetupState<User[]>(connectorType, 'TataOutboundUserManagement.users', DEFAULT_OUTBOUND_USERS);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const openMenu = (index: number, target: HTMLElement) => {
    if (menu === index) { setMenu(null); setMenuPos(null); return; }
    const rect = target.getBoundingClientRect();
    const menuWidth = 176; // w-44
    const menuHeight = 208; // approx height of the 5-item + divider menu
    let top = Math.min(Math.max(8, rect.top - 8), window.innerHeight - menuHeight - 8);
    let left = rect.left - menuWidth - 6;
    if (left < 8) left = Math.min(window.innerWidth - menuWidth - 8, rect.right + 6);
    setMenuPos({ top, left });
    setMenu(index);
  };
  const closeMenu = () => { setMenu(null); setMenuPos(null); };
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [bulkNotice, setBulkNotice] = useState<Notice>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ empId: '081818881818' });
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState<'Active' | 'Inactive'>('Active');
  const [extension, setExtension] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Test Call state
  const [testCallingIndex, setTestCallingIndex] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<TestCallResult>(null);

  // View Call Logs — per-user side panel
  const [callLogsUser, setCallLogsUser] = useState<User | null>(null);

  // Bulk upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editContext) { setUsersLoaded(true); return; }
    try {
      const saved = localStorage.getItem(`${OUTBOUND_USERS_STORAGE_KEY}:${connectorType}`);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setUsers(parsed as User[]);
      }
    } catch {
      // Keep the default user list if browser storage is unavailable or invalid.
    } finally {
      setUsersLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!usersLoaded || editContext) return;
    try { localStorage.setItem(`${OUTBOUND_USERS_STORAGE_KEY}:${connectorType}`, JSON.stringify(users)); } catch { /* Browser storage can be unavailable. */ }
  }, [users, usersLoaded]);

  const reset = () => { setForm({ empId: '081818881818' }); setName(''); setMobile(''); setEmail(''); setActive('Active'); setExtension(false); setValidationMessage(''); };
  const openAddPanel = () => { setEditingIndex(null); reset(); setOpen(true); };
  const openEditPanel = (index: number) => {
    const user = users[index];
    if (!user) return;
    const hasExtension = user.extension !== 'Not created';
    setEditingIndex(index);
    setName(user.name);
    setMobile(user.mobile);
    setEmail(user.email);
    setActive(user.status);
    setExtension(hasExtension);
    setForm({ empId: hasExtension ? user.extension : '081818881818', ...(user.extra || {}) });
    setValidationMessage('');
    setOpen(true);
    closeMenu();
  };
  const closePanel = () => { setOpen(false); setEditingIndex(null); setBulkNotice(null); };
  const submit = () => {
    if (!name.trim() || !mobile.trim() || !email.trim()) {
      setValidationMessage('Name, Call Forward Number, and Email are required.');
      return;
    }
    const extra = { ...form };
    if (editingIndex !== null) {
      setUsers((current) => current.map((user, index) => index === editingIndex
        ? { name, mobile, email, extension: extension ? form.empId : 'Not created', status: active, extra }
        : user));
      setOpen(false); setEditingIndex(null); reset();
      setNotice({ title: 'Outbound User Updated Successfully', detail: `${name}'s details have been updated.` });
      setTimeout(() => setNotice(null), 2500);
    } else {
      setUsers((current) => [{ name, mobile, email, extension: extension ? form.empId : 'Not created', status: active, extra }, ...current]);
      setOpen(false); reset();
      setNotice({ title: 'Outbound User Added Successfully', detail: `${name} has been added to outbound users.` });
      setTimeout(() => setNotice(null), 2500);
    }
  };
  const updateField = (key: string, value: string) => { setForm((current) => ({ ...current, [key]: value })); setValidationMessage(''); };
  const handleUserNameSelect = (selectedName: string) => {
    setName(selectedName);
    setValidationMessage('');
    const match = DIRECTORY_USERS.find((directoryUser) => directoryUser.name === selectedName);
    if (match) {
      setMobile(match.mobile);
      setEmail(match.email);
      setForm((current) => ({ ...current, userName: match.name, userId: match.userId, empId: match.empId }));
    } else {
      setForm((current) => ({ ...current, userName: '' }));
    }
  };
  const applyConfirm = () => { if (!confirm) return; setUsers((current) => confirm.action === 'Delete' ? current.filter((_, index) => index !== confirm.index) : current.map((user, index) => index === confirm.index ? { ...user, status: confirm.action === 'Activate' ? 'Active' : 'Inactive' } : user)); setConfirm(null); closeMenu(); };

  const runTestCall = (index: number) => {
    const user = users[index];
    if (!user) return;
    setTestCallingIndex(index);
    setTimeout(() => {
      const succeeded = Math.random() > 0.3;
      const callId = `CALL-${Math.floor(Math.random() * 900000 + 100000)}`;
      const timestamp = new Date().toLocaleString();
      if (succeeded) {
        const duration = `00:00:${String(Math.floor(Math.random() * 40 + 8)).padStart(2, '0')}`;
        setTestResult({ index, outcome: 'success', response: { callId, to: user.mobile, agent: user.name, status: 'Connected', duration, timestamp } });
        onTestCallSuccess?.();
      } else {
        const reason = CALL_FAILURE_REASONS[Math.floor(Math.random() * CALL_FAILURE_REASONS.length)];
        setTestResult({ index, outcome: 'failed', response: { callId, to: user.mobile, agent: user.name, status: 'Not Connected', reason, timestamp } });
      }
      setTestCallingIndex(null);
    }, 1400);
  };

  const handleDownloadTemplate = () => {
    const header = TEMPLATE_HEADERS.join(',');
    const example = 'Priya Sharma,U1001,priya.sharma@company.com,+91 9876543210,Active,AGT-101,Diwali Campaign,Default,,Content-Type: application/json,POST,+91,ORD-1,30,3,https://api.example.com,YES,081818881001';
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'outbound-users-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      let rows: Record<string, string>[] = [];
      try {
        if (/\.csv$/i.test(file.name)) {
          rows = parseCsv(new TextDecoder().decode(reader.result as ArrayBuffer));
        } else {
          const workbook = XLSX.read(reader.result, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = firstSheet ? XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' }) : [];
        }
      } catch {
        setValidationMessage('The uploaded file could not be read. Use the provided Excel/CSV template and try again.');
        return;
      }
      const newUsers: User[] = rows
        .filter((row) => (row.UserName || '').trim())
        .map((row) => {
          const isExtension = /^y/i.test(row.IsExtension || '');
          const empId = (row.EmpId || '').trim() || '081818881818';
          return {
            name: row.UserName.trim(),
            mobile: (row.CallForwardNumber || '').trim(),
            email: (row.Email || '').trim(),
            extension: isExtension ? empId : 'Not created',
            status: /^inactive/i.test(row.IsActive || '') ? 'Inactive' : 'Active',
            extra: {
              userId: row.UserId || '',
              agentId: row.AgentId || '',
              campaignName: row.CampaignName || '',
              setting: row.Setting || '',
              mapping: row.Mapping || '',
              httpClientHeaders: row.HttpClientHeaders || '',
              httpMethod: row.HttpMethod || '',
              countryCode: row.CountryCode || '',
              orderid: row.orderid || '',
              retrydelta: row.retrydelta || '',
              callretries: row.callretries || '',
              baseurl: row.Baseurl || '',
              empId,
            },
          };
        });
      if (newUsers.length === 0) {
        setValidationMessage('No valid rows found in the uploaded file — make sure UserName is filled in for each row.');
        return;
      }
      setUsers((current) => [...newUsers, ...current]);
      setBulkNotice({ title: 'Bulk Upload Complete', detail: `${newUsers.length} outbound user${newUsers.length === 1 ? '' : 's'} added successfully.` });
      setTimeout(() => setBulkNotice(null), 2000);
    };
    reader.onerror = () => setValidationMessage('The uploaded file could not be read. Please try again.');
    reader.readAsArrayBuffer(file);
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold text-foreground">User Management</p><p className="text-[11px] text-muted-foreground mt-0.5">Add outbound IVR users and verify each one with a test call before continuing.</p></div><button type="button" onClick={openAddPanel} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm"><Plus size={13} />Add Outbound User</button></div>
    {notice && (
      <div className="flex items-start gap-2.5 rounded-lg border border-success-border bg-success-bg px-4 py-3">
        <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-bold text-success">{notice.title}</p>
          <p className="text-[11px] text-success/80 mt-0.5">{notice.detail}</p>
        </div>
      </div>
    )}
    <div className="card-base overflow-x-auto rounded-xl">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[1.2fr_1.1fr_1.3fr_1fr_100px_150px] gap-3 px-4 py-3 bg-muted/50 border-b border-border">
          <span className={labelClass}>User Name</span>
          <span className={labelClass}>Call Forward Number</span>
          <span className={labelClass}>Email</span>
          <span className={labelClass}>Agent Extension</span>
          <span className={labelClass}>Status</span>
          <span className={`${labelClass} text-center`}>Actions</span>
        </div>
        <div className="divide-y divide-border">
          {users.map((user, index) => {
            const hasExtension = user.extension !== 'Not created';
            const isTesting = testCallingIndex === index;
            return (
              <div key={`${user.email}-${index}`} className="grid grid-cols-[1.2fr_1.1fr_1.3fr_1fr_100px_150px] gap-3 px-4 py-3.5 items-center transition-colors hover:bg-muted/30">
                <button
                  type="button"
                  onClick={() => openEditPanel(index)}
                  title="Edit this user"
                  className="flex items-center gap-2.5 min-w-0 text-left group"
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: avatarColor(user.name) }}
                  >
                    {initials(user.name)}
                  </span>
                  <span className="text-[12px] font-semibold text-foreground truncate group-hover:text-primary group-hover:underline">{user.name}</span>
                </button>
                <span className="text-[12px] text-muted-foreground font-tabular truncate">{user.mobile}</span>
                <span className="text-[12px] text-muted-foreground truncate">{user.email}</span>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                    hasExtension ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                  }`}
                  title={hasExtension ? `Extension ID: ${user.extension}` : 'No agent extension created'}
                >
                  {hasExtension ? 'YES' : 'NO'}
                </span>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold border ${
                  user.status === 'Active' ? 'bg-success-bg text-success border-success-border' : 'bg-danger-bg text-danger border-danger-border'
                }`}>
                  {user.status === 'Active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {user.status}
                </span>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => runTestCall(index)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 h-7 px-2.5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Place a test call to this user"
                  >
                    <Phone size={11} className={isTesting ? 'animate-pulse' : ''} />
                    {isTesting ? 'Calling…' : 'Test Call'}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => openMenu(index, event.currentTarget)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                    title="More options"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <p className="px-4 py-10 text-center text-[12px] text-muted-foreground">No outbound users added yet. Click &ldquo;Add Outbound User&rdquo; to create one.</p>}
        </div>
      </div>
    </div>
    {menu !== null && menuPos && users[menu] && createPortal(<>
      <div className="fixed inset-0 z-40" onClick={closeMenu} />
      <div style={{ top: menuPos.top, left: menuPos.left }} className="fixed z-50 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
        <button type="button" onClick={() => openEditPanel(menu)} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] text-foreground hover:bg-muted transition-colors">
          <Edit2 size={12} className="text-muted-foreground" />Edit User
        </button>
        <button
          type="button"
          onClick={() => { setConfirm({ action: users[menu].status === 'Active' ? 'Deactivate' : 'Activate', index: menu }); closeMenu(); }}
          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] text-foreground hover:bg-muted transition-colors"
        >
          {users[menu].status === 'Active' ? <Pause size={12} className="text-muted-foreground" /> : <Play size={12} className="text-muted-foreground" />}
          {users[menu].status === 'Active' ? 'Deactivate User' : 'Activate User'}
        </button>
        <button
          type="button"
          onClick={() => { const source = users[menu]; setUsers((current) => [{ ...source, name: `${source.name} (Copy)`, email: `copy-${source.email}` }, ...current]); closeMenu(); }}
          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] text-foreground hover:bg-muted transition-colors"
        >
          <Copy size={12} className="text-muted-foreground" />Duplicate User
        </button>
        <button
          type="button"
          onClick={() => { setCallLogsUser(users[menu]); closeMenu(); }}
          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] text-foreground hover:bg-muted transition-colors"
        >
          <History size={12} className="text-muted-foreground" />View Call Logs
        </button>
        <hr className="my-1 border-border" />
        <button
          type="button"
          onClick={() => { setConfirm({ action: 'Delete', index: menu }); closeMenu(); }}
          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] text-danger hover:bg-danger-bg transition-colors"
        >
          <Trash2 size={12} />Delete User
        </button>
      </div>
    </>, document.body)}
    {open && (
      <OverlayPortal><div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePanel} />
        <div className="relative w-full sm:max-w-3xl bg-card h-full shadow-2xl border-l border-border flex flex-col fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-orange-50 dark:bg-orange-950/20 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <UserPlus size={16} className="text-primary" />
              </div>
              <h2 className="text-[16px] font-bold text-foreground">{editingIndex !== null ? 'Edit Outbound User' : 'Add Outbound User'}</h2>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {bulkNotice && (
              <div role="status" className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[12px] font-bold text-emerald-700">{bulkNotice.title}</p>
                  <p className="mt-0.5 text-[11px] text-emerald-800">{bulkNotice.detail}</p>
                </div>
              </div>
            )}
            {editingIndex === null && (
              <div className="mb-5 p-3.5 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">Bulk Upload</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Add multiple outbound users at once via Excel/CSV.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleBulkFile(file);
                        event.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      title="Download Excel Template"
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-card border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
                    >
                      <Upload size={13} />Excel Upload
                    </button>
                  </div>
                </div>
              </div>
            )}
            {validationMessage && <p className="mb-4 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-[11px] text-danger">{validationMessage}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* UserName dropdown — always first, mandatory */}
              <label className="block sm:col-span-1">
                <span className="block text-[12px] font-semibold text-foreground mb-1">User Name <span className="text-danger">*</span></span>
                <select value={name} onChange={(event) => handleUserNameSelect(event.target.value)} className={inputClass}>
                  <option value="">Select user name</option>
                  {DIRECTORY_USERS.map((directoryUser) => <option key={directoryUser.userId} value={directoryUser.name}>{directoryUser.name}</option>)}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">Auto-fills Call Forward Number, Email, and UserId.</p>
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-foreground mb-1">Email <span className="text-danger">*</span></span>
                <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setValidationMessage(''); }} placeholder="name@example.com" className={inputClass} />
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-foreground mb-1">UserId</span>
                <input value={form.userId || ''} onChange={(event) => updateField('userId', event.target.value)} placeholder="Auto-filled from User Name" className={inputClass} />
              </label>
              <label className="block">
                <span className="block text-[12px] font-semibold text-foreground mb-1">Call Forward Number <span className="text-danger">*</span></span>
                <input value={mobile} onChange={(event) => { setMobile(event.target.value); setValidationMessage(''); }} placeholder="e.g. +91 9876543210" className={inputClass} />
              </label>

              {/* IsActive toggle — defaults to Active */}
              <div className="sm:col-span-3 flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[12px] font-semibold text-foreground">IsActive</span>
                <Toggle value={active === 'Active'} onChange={(value) => setActive(value ? 'Active' : 'Inactive')} labels={['Inactive', 'Active']} />
              </div>

              {/* Technical / API fields */}
              {outboundFields.map(([key, fieldName, placeholder]) => key === 'httpMethod' ? (
                <label key={key} className="block">
                  <span className="block text-[12px] font-semibold text-foreground mb-1">{fieldName}</span>
                  <select value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)} className={inputClass}>
                    <option value="">Select HTTP method</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </label>
              ) : (
                <label key={key} className="block">
                  <span className="block text-[12px] font-semibold text-foreground mb-1">{fieldName}</span>
                  <input value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)} placeholder={placeholder} className={inputClass} />
                </label>
              ))}

              {/* IS Extension toggle — progressive disclosure of EmpId */}
              {connectorType !== 'mcube' && <>
              <div className="sm:col-span-3 flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                <div>
                  <span className="block text-[12px] font-semibold text-foreground">IS Extension</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">Create an agent extension for this user?</span>
                </div>
                <Toggle value={extension} onChange={setExtension} labels={['NO', 'YES']} />
              </div>
              {extension && (
                <label className="block">
                  <span className="block text-[12px] font-semibold text-foreground mb-1">EmpId</span>
                  <input value={form.empId} onChange={(event) => updateField('empId', event.target.value)} placeholder="081818881818" className={inputClass} />
                </label>
              )}
              </>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
            <button type="button" onClick={reset} className="h-9 px-5 text-[12px] font-semibold border border-border rounded-lg hover:bg-muted transition-colors">Clear</button>
            <button type="button" onClick={submit} className="h-9 px-5 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm">Save</button>
          </div>
        </div>
      </div></OverlayPortal>
    )}
    {confirm && <Modal open={true} onClose={() => setConfirm(null)} title={`${confirm.action} User`} size="sm" footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirm(null)} className="h-8 px-3 text-[11px] border border-border rounded-lg">Cancel</button><button type="button" onClick={applyConfirm} className="h-8 px-3 text-[11px] font-semibold bg-danger text-white rounded-lg">Confirm</button></div>}><p className="text-[12px] text-muted-foreground">Are you sure you want to {confirm.action.toLowerCase()} this user?</p></Modal>}

    {/* Test Call result popup */}
    {testResult && (
      <Modal
        open={true}
        onClose={() => setTestResult(null)}
        title="Test Call Result"
        subtitle={users[testResult.index] ? `${users[testResult.index].name} — ${users[testResult.index].mobile}` : undefined}
        size="sm"
        footer={<div className="flex justify-end"><button type="button" onClick={() => setTestResult(null)} className="h-8 px-4 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">Close</button></div>}
      >
        <div className="space-y-4">
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${testResult.outcome === 'success' ? 'bg-success-bg border-success-border' : 'bg-danger-bg border-danger-border'}`}>
            {testResult.outcome === 'success' ? <PhoneCall size={20} className="text-success flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />}
            <div>
              <p className={`text-[15px] font-bold ${testResult.outcome === 'success' ? 'text-success' : 'text-danger'}`}>
                {testResult.outcome === 'success' ? 'Success' : 'Failed'}
              </p>
              <p className={`text-[12px] mt-0.5 ${testResult.outcome === 'success' ? 'text-success/80' : 'text-danger/80'}`}>
                {testResult.outcome === 'success'
                  ? `Test call connected successfully to ${testResult.response.agent}.`
                  : `Unable to connect the test call to ${testResult.response.agent}.`}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/50 px-3 py-1.5 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Response</p>
            </div>
            <div className="divide-y divide-border">
              {[
                ['Call ID', testResult.response.callId],
                ['To', testResult.response.to],
                ['Agent', testResult.response.agent],
                ['Status', testResult.response.status],
                ...(testResult.response.duration ? [['Duration', testResult.response.duration]] : []),
                ...(testResult.response.reason ? [['Failure Reason', testResult.response.reason]] : []),
                ['Timestamp', testResult.response.timestamp],
              ].map(([lbl, value]) => (
                <div key={lbl} className="flex items-start gap-3 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground font-medium w-24 flex-shrink-0">{lbl}</span>
                  <span className={`text-[11px] font-mono flex-1 ${lbl === 'Failure Reason' ? 'text-danger' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    )}

    {/* View Call Logs — per-user side panel */}
    <TataCallLogsPanel
      open={callLogsUser !== null}
      onClose={() => setCallLogsUser(null)}
      user={callLogsUser ? { name: callLogsUser.name, mobile: callLogsUser.mobile } : null}
    />
  </div>;
}
