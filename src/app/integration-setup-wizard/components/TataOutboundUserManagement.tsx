'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CheckCircle2, ChevronDown, Copy, Plus, XCircle } from 'lucide-react';

const FIELDS = [
  ['userId', 'UserId', 'Enter user ID'], ['agentId', 'AgentId', 'Enter agent ID'], ['campaignName', 'CampaignName', 'Enter campaign name'], ['userName', 'UserName', 'Enter user name'],
  ['setting', 'Setting', 'Enter setting'], ['mapping', 'Mapping', 'Enter mapping details'], ['httpClientHeaders', 'HttpClientHeaders', 'e.g. Content-Type: application/json'], ['httpMethod', 'HttpMethod', 'e.g. POST'],
  ['countryCode', 'CountryCode', 'e.g. +91'], ['orderid', 'orderid', 'Enter order ID'], ['retrydelta', 'retrydelta', 'Enter retry delay'], ['callretries', 'callretries', 'Enter retry count'], ['baseurl', 'Baseurl', 'https://api.example.com'],
] as const;

type User = { name: string; mobile: string; email: string; extension: string; status: 'Active' | 'Inactive' };
type ConfirmAction = { action: 'Delete' | 'Deactivate' | 'Activate'; index: number } | null;
const inputClass = 'w-full h-9 px-3 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
const labelClass = 'block text-[11px] font-semibold text-muted-foreground mb-1.5';

function Toggle({ value, onChange, labels = ['NO', 'YES'] }: { value: boolean; onChange: (value: boolean) => void; labels?: [string, string] }) {
  return <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"><button type="button" onClick={() => onChange(false)} className={`h-7 px-3 text-[11px] font-semibold rounded-md ${!value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{labels[0]}</button><button type="button" onClick={() => onChange(true)} className={`h-7 px-3 text-[11px] font-semibold rounded-md ${value ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{labels[1]}</button></div>;
}

export default function TataOutboundUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [notice, setNotice] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ empId: '081818881818' });
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState<'Active' | 'Inactive'>('Inactive');
  const [extension, setExtension] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const reset = () => { setForm({ empId: '081818881818' }); setName(''); setMobile(''); setEmail(''); setActive('Inactive'); setExtension(false); setValidationMessage(''); };
  const submit = () => {
    if (!name.trim() || !mobile.trim() || !email.trim()) {
      setValidationMessage('Name, Mobile Number, and Email are required.');
      return;
    }
    setUsers((current) => [...current, { name, mobile, email, extension: extension ? form.empId : 'Not created', status: active }]);
    setOpen(false); reset(); setNotice(true); setTimeout(() => setNotice(false), 2500);
  };
  const updateField = (key: string, value: string) => { setForm((current) => ({ ...current, [key]: value })); setValidationMessage(''); };
  const applyConfirm = () => { if (!confirm) return; setUsers((current) => confirm.action === 'Delete' ? current.filter((_, index) => index !== confirm.index) : current.map((user, index) => index === confirm.index ? { ...user, status: confirm.action === 'Activate' ? 'Active' : 'Inactive' } : user)); setConfirm(null); setMenu(null); };

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold text-foreground">User Management</p><p className="text-[11px] text-muted-foreground mt-0.5">Add and manage outbound IVR users.</p></div><button type="button" onClick={() => { reset(); setOpen(true); }} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90"><Plus size={13} />Add Outbound User</button></div>
    {notice && <div className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-[12px] font-semibold text-success">User Added</div>}
    <div className="rounded-xl border border-[#dbe7f5] bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] overflow-x-auto"><div className="min-w-[820px]"><div className="grid grid-cols-[1.1fr_1fr_1.2fr_1fr_100px_120px] gap-3 px-4 py-2.5 bg-[#f5f9ff] border-b border-[#dbe7f5]"><span className={`${labelClass} text-[#52708f]`}>Name</span><span className={`${labelClass} text-[#52708f]`}>Mobile Number</span><span className={`${labelClass} text-[#52708f]`}>Email</span><span className={`${labelClass} text-[#52708f]`}>Agent Extension</span><span className={`${labelClass} text-[#52708f]`}>Status</span><span className={`${labelClass} text-[#52708f]`}>Actions</span></div><div className="divide-y divide-[#e8f0f8]">{users.map((user, index) => <div key={`${user.email}-${index}`} className={`grid grid-cols-[1.1fr_1fr_1.2fr_1fr_100px_120px] gap-3 px-4 py-3 items-center transition-colors hover:bg-[#f7fbff] ${index % 2 === 1 ? 'bg-[#fcfdff]' : 'bg-white'}`}><span className="text-[11px] font-semibold text-[#17324d] truncate">{user.name}</span><span className="text-[11px] text-[#66809b] truncate">{user.mobile}</span><span className="text-[11px] text-[#66809b] truncate">{user.email}</span><span className="text-[11px] text-[#66809b] truncate">{user.extension}</span><span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${user.status === 'Active' ? 'bg-[#e9f8ef] text-[#16834b]' : 'bg-[#fff0f0] text-[#d04444]'}`}>{user.status === 'Active' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{user.status}</span><div className="relative"><button type="button" onClick={() => setMenu(menu === index ? null : index)} className="flex items-center justify-between gap-2 w-full h-7 px-2.5 text-[10px] text-[#66809b] border border-[#d6e3f0] rounded-md bg-white hover:border-[#8bb4df] hover:bg-[#f5f9ff] transition-colors"><span>Click here</span><ChevronDown size={12} /></button>{menu === index && <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-[#dbe7f5] bg-white shadow-lg p-1"><button type="button" className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-[#f1f7ff]">Edit User</button><button type="button" onClick={() => setConfirm({ action: 'Delete', index })} className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-[#fff3f3]">Delete User</button><button type="button" onClick={() => setConfirm({ action: user.status === 'Active' ? 'Deactivate' : 'Activate', index })} className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-[#f1f7ff]">{user.status === 'Active' ? 'Deactivate User' : 'Activate User'}</button><button type="button" onClick={() => { setUsers((current) => [...current, { ...user, name: `${user.name} (Copy)`, email: `copy-${user.email}` }]); setMenu(null); }} className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-[10px] hover:bg-[#f1f7ff]"><Copy size={11} />Duplicate User</button></div>}</div></div>)}{users.length === 0 && <p className="px-4 py-8 text-center text-[11px] text-[#66809b]">No outbound users added yet.</p>}</div></div></div>
    <Modal open={open} onClose={() => setOpen(false)} title="Outbound Configuration" subtitle="Create an outbound TATA IVR user." size="2xl" footer={<div className="flex justify-end gap-2"><button type="button" onClick={reset} className="h-8 px-3 text-[11px] font-medium border border-border rounded-lg hover:bg-muted">Clear</button><button type="button" onClick={submit} className="h-8 px-4 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">Add User</button></div>}>
      {validationMessage && <p className="mb-4 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-[11px] text-danger">{validationMessage}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{FIELDS.map(([key, fieldName, placeholder]) => key === 'httpMethod' ? <label key={key} className="block"><span className="block text-[12px] font-semibold text-foreground mb-1">{fieldName}</span><select value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)} className={inputClass}><option value="">Select HTTP method</option><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></select></label> : key === 'userName' ? <label key={key} className="block"><span className="block text-[12px] font-semibold text-foreground mb-1">Name *</span><input value={name} onChange={(event) => { setName(event.target.value); updateField(key, event.target.value); }} placeholder="Enter user name" className={inputClass} /></label> : <label key={key} className="block"><span className="block text-[12px] font-semibold text-foreground mb-1">{fieldName}</span><input value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)} placeholder={placeholder} className={inputClass} /></label>)}<label className="block"><span className="block text-[12px] font-semibold text-foreground mb-1">Mobile Number *</span><input value={mobile} onChange={(event) => { setMobile(event.target.value); setValidationMessage(''); }} placeholder="e.g. +91 9876543210" className={inputClass} /></label><label className="block"><span className="block text-[12px] font-semibold text-foreground mb-1">Email *</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setValidationMessage(''); }} placeholder="name@example.com" className={inputClass} /></label><div><span className="block text-[12px] font-semibold text-foreground mb-1">IsActive</span><div className="inline-flex rounded-lg border border-border bg-card p-0.5"><button type="button" onClick={() => setActive('Active')} className={`h-8 px-4 text-[11px] font-semibold rounded-md ${active === 'Active' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Active</button><button type="button" onClick={() => setActive('Inactive')} className={`h-8 px-4 text-[11px] font-semibold rounded-md ${active === 'Inactive' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Inactive</button></div></div><div><span className="block text-[12px] font-semibold text-foreground mb-1">IS Extension</span><Toggle value={extension} onChange={setExtension} labels={['NO', 'YES']} /></div>{extension && <label className="block"><span className="block text-[12px] font-semibold text-foreground mb-1">EmpId</span><input value={form.empId} onChange={(event) => updateField('empId', event.target.value)} placeholder="081818881818" className={inputClass} /></label>}</div>
    </Modal>
    {confirm && <Modal open={true} onClose={() => setConfirm(null)} title={`${confirm.action} User`} size="sm" footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirm(null)} className="h-8 px-3 text-[11px] border border-border rounded-lg">Cancel</button><button type="button" onClick={applyConfirm} className="h-8 px-3 text-[11px] font-semibold bg-danger text-white rounded-lg">Confirm</button></div>}><p className="text-[12px] text-muted-foreground">Are you sure you want to {confirm.action.toLowerCase()} this user?</p></Modal>}
  </div>;
}
