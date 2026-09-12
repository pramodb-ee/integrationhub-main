'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Plus, RefreshCw, Trash2, LockKeyhole, ChevronDown, ChevronUp, GitBranch, Tag, UserCheck } from 'lucide-react';
import ConnectorIcon from '@/components/ui/ConnectorIcon';

const FORMS = ['Course Enquiry — LinkedIn Lead Gen', 'MBA Admissions — LinkedIn Lead Gen'];
const CRM = [
  'FirstName',
  'LastName',
  'Email',
  'MobileNumber',
  'Company',
  'Course',
  'LeadSource',
  'LeadCampaign',
  'LeadChannel',
  'Remarks',
];
const SAMPLE = {
  firstName: 'Ananya',
  lastName: 'Gupta',
  emailAddress: 'ananya.gupta@example.com',
  phoneNumber: '+919812345670',
  companyName: 'Example Education',
  course: 'MBA',
};
const ALIASES: Record<string, string> = {
  firstName: 'FirstName',
  lastName: 'LastName',
  emailAddress: 'Email',
  phoneNumber: 'MobileNumber',
  companyName: 'Company',
  course: 'Course',
};
type Mapping = { id: string; source: string; target: string };
type Static = { id: string; target: string; value: string };
type Lead = { id: string; fields: Record<string, string>; date: string; added: boolean };
const btn =
  'inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed';
const primary = `${btn} !bg-primary !border-primary !text-white`;
const input =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-xs disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const collapsible = title === 'Field Mapping' || title === 'Static Fields';
  const Icon = title === 'Field Mapping' ? GitBranch : title === 'Static Fields' ? Tag : UserCheck;
  const subtitle = title === 'Field Mapping' ? 'Map source LinkedIn fields to CRM destination fields' : title === 'Static Fields' ? 'Add fixed values to your CRM fields' : 'Fetch a sample lead, then add it to CRM or discard it.';
  if (collapsible) return <section className="overflow-visible rounded-xl border border-border bg-card"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 rounded-t-xl px-5 py-4 text-left hover:bg-muted/30"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={15} /></span><span className="flex-1"><span className="block text-[13px] font-semibold">{title}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{subtitle}</span></span>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{open && <div className="space-y-4 border-t border-border px-5 py-5">{children}</div>}</section>;
  return (
    <section className="card-base space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={16} /></span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p></div></div>{action}</div>
      {children}
    </section>
  );
}

export default function LinkedInIntegrationFlow() {
  const [connected, setConnected] = useSetupState('linkedin', 'LinkedInIntegrationFlow.connected', false);
  const [form, setForm] = useSetupState('linkedin', 'LinkedInIntegrationFlow.form', FORMS[0]);
  const [payload, setPayload] = useSetupState<Record<string, string> | null>('linkedin', 'LinkedInIntegrationFlow.payload', null);
  const [mappings, setMappings] = useSetupState<Mapping[]>('linkedin', 'LinkedInIntegrationFlow.mappings', []);
  const [statics, setStatics] = useSetupState<Static[]>('linkedin', 'LinkedInIntegrationFlow.statics', []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [active, setActive] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const targets = [...mappings.map((m) => m.target), ...statics.map((s) => s.target)];
  const issues = !payload
    ? ['Fetch a form request first.']
    : [
        ...mappings
          .filter((m) => !m.source || !m.target)
          .map(() => 'Complete every field mapping.'),
        ...statics
          .filter((s) => !s.target || !s.value.trim())
          .map(() => 'Complete each static CRM field and value.'),
        ...['FirstName', 'Email', 'MobileNumber']
          .filter((f) => !targets.includes(f))
          .map((f) => `${f} is required.`),
        ...(new Set(targets).size !== targets.length
          ? ['CRM destination fields must be unique.']
          : []),
      ];
  const changed = () => {
    setLeads([]);
    setError('');
    setNotice('');
  };
  const fetchRequest = () => {
    if (!connected || active) return;
    const data = { ...SAMPLE, course: form === FORMS[1] ? 'MBA' : 'Commerce' };
    setPayload(data);
    setMappings(
      Object.keys(data).map((source) => ({
        id: crypto.randomUUID(),
        source,
        target: ALIASES[source] ?? '',
      }))
    );
    setStatics([]);
    changed();
    setNotice('Lead Gen Form request fetched successfully (sample data).');
  };
  const fetchLead = () => {
    if (active || !connected || !payload || issues.length) return;
    const fields = Object.fromEntries([
      ...mappings.map((m) => [m.target, payload[m.source] ?? '']),
      ...statics.map((s) => [s.target, s.value]),
    ]);
    if (
      !fields.FirstName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.Email) ||
      !/^\+?[\d ()-]+$/.test(fields.MobileNumber) ||
      !/^\d{10,15}$/.test(fields.MobileNumber.replace(/\D/g, ''))
    ) {
      setError('Mapped name, email or mobile value is invalid. Review the mapping before testing.');
      return;
    }
    setLeads((rows) => [
      {
        id: `LI-DEMO-${crypto.randomUUID()}`,
        fields,
        date: new Date().toLocaleString(),
        added: false,
      },
      ...rows,
    ]);
    setError('');
    setNotice('Test lead fetched successfully (demo).');
  };
  const canActivate = connected && !!payload && !issues.length && leads.some((l) => l.added);
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ConnectorIcon type="linkedin" size={40} />
          <div>
            <h1 className="text-xl font-semibold">LinkedIn Integration</h1>
            <p className="text-xs text-muted-foreground">
              Connect LinkedIn Lead Gen Forms to your CRM
            </p>
          </div>
        </div>
        <Link href="/" className={btn}>? Back to Integration Center</Link>
      </header>
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-4 text-[13px] font-semibold">LinkedIn Connection</h2>
        <div className="space-y-4 p-4"><p className="text-xs text-muted-foreground">Connect your LinkedIn account for Lead Gen Forms. Authorize access to your account and map leads to CRM.</p>
          {connected ? <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4"><CheckCircle2 size={20} className="shrink-0 text-green-600" /><div className="flex-1"><p className="text-[13px] font-semibold text-green-800">LinkedIn Connected Successfully</p><p className="mt-1 text-xs text-green-700">Your demo LinkedIn account is connected. Select a lead form to continue.</p></div><button className={`${btn} !border-green-300 !text-green-700`} disabled={active} onClick={() => setNotice('LinkedIn account reconnected (demo).')}><RefreshCw size={12} />Re-Connect</button></div> : <div className="flex flex-col items-center py-3 text-center"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-[#0A66C2]">in</span><h3 className="text-sm font-semibold">Connect your LinkedIn Account</h3><p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">Authorize access to your LinkedIn account and Lead Gen Forms.</p><button className="mt-4 inline-flex h-10 items-center gap-3 rounded-xl bg-[#0A66C2] px-6 text-xs font-semibold text-white hover:bg-[#004182]" onClick={() => { setConnected(true); setNotice('Connected Successfully (demo).'); }}><span className="font-bold">in</span>Connect LinkedIn Account</button></div>}
        </div>
      </section>
      <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
        Demo integration — sample LinkedIn account, forms and leads. Live LinkedIn authentication
        and CRM delivery are not connected.
      </p>
      {active && (
        <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <LockKeyhole size={16} />
          Integration Active (demo). Deactivate Integration to edit fields.
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700"
        >
          <CheckCircle2 size={15} />
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-600"
        >
          {error}
        </p>
      )}
      {connected && (
        <Section title="LinkedIn Lead Gen Form">
          <label className="block space-y-2 text-xs">
            LinkedIn Form
            <select
              className={input}
              value={form}
              disabled={active}
              onChange={(e) => {
                setForm(e.target.value);
                setPayload(null);
                setMappings([]);
                setStatics([]);
                changed();
              }}
            >
              {FORMS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <button className={primary} disabled={active} onClick={fetchRequest}>
            <RefreshCw size={14} />
            Fetch Request
          </button>
          {payload ? (
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <h3 className="bg-slate-900 p-3 text-xs font-semibold text-white">
                Lead Gen Form Fields & Values — Sample Data
              </h3>
              <pre
                tabIndex={0}
                className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-green-300"
              >
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Fetch a request to detect fields and auto-map them to CRM.
            </p>
          )}
        </Section>
      )}
      <Section title="Field Mapping">
        <p className="text-xs text-muted-foreground">
          Auto-mapped from the fetched request. FirstName, Email and MobileNumber are required.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-xs">
            <thead className="bg-muted">
              <tr>
                {['LinkedIn Field', 'Sample Value', 'CRM Field', 'Actions'].map((h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-2">
                    <select
                      aria-label="LinkedIn source field"
                      className={input}
                      value={m.source}
                      disabled={active}
                      onChange={(e) => {
                        setMappings(
                          mappings.map((r) =>
                            r.id === m.id ? { ...r, source: e.target.value } : r
                          )
                        );
                        changed();
                      }}
                    >
                      <option value="">Select field</option>
                      {Object.keys(payload ?? {}).map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">{payload?.[m.source] ?? '—'}</td>
                  <td className="p-2">
                    <select
                      aria-label={`CRM field for ${m.source || 'new row'}`}
                      className={input}
                      value={m.target}
                      disabled={active}
                      onChange={(e) => {
                        setMappings(
                          mappings.map((r) =>
                            r.id === m.id ? { ...r, target: e.target.value } : r
                          )
                        );
                        changed();
                      }}
                    >
                      <option value="">Select CRM field</option>
                      {CRM.map((f) => (
                        <option key={f} disabled={f !== m.target && targets.includes(f)}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      className={btn}
                      aria-label={`Remove ${m.source} mapping`}
                      disabled={active}
                      onClick={() => {
                        setMappings(mappings.filter((r) => r.id !== m.id));
                        changed();
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!payload && <p className="text-xs text-muted-foreground">No request fetched yet.</p>}
        <button
          className={btn}
          disabled={active || !payload}
          onClick={() => {
            setMappings([...mappings, { id: crypto.randomUUID(), source: '', target: '' }]);
            changed();
          }}
        >
          <Plus size={13} />
          Add Mapping
        </button>
        {payload && issues.length > 0 && (
          <p className="text-xs text-red-600">{[...new Set(issues)].join(' ')}</p>
        )}
      </Section>
      <Section title="Static Fields">
        <p className="text-xs text-muted-foreground">Append fixed CRM values to each lead.</p>
        {statics.map((s) => (
          <div key={s.id} className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <select
              aria-label="Static CRM field"
              className={input}
              disabled={active}
              value={s.target}
              onChange={(e) => {
                setStatics(
                  statics.map((r) => (r.id === s.id ? { ...r, target: e.target.value } : r))
                );
                changed();
              }}
            >
              <option value="">Select CRM field</option>
              {CRM.map((f) => (
                <option key={f} disabled={f !== s.target && targets.includes(f)}>
                  {f}
                </option>
              ))}
            </select>
            <input
              aria-label={`Static value for ${s.target || 'new field'}`}
              className={input}
              disabled={active}
              value={s.value}
              placeholder="Static value"
              onChange={(e) => {
                setStatics(
                  statics.map((r) => (r.id === s.id ? { ...r, value: e.target.value } : r))
                );
                changed();
              }}
            />
            <button
              className={btn}
              aria-label="Remove static field"
              disabled={active}
              onClick={() => {
                setStatics(statics.filter((r) => r.id !== s.id));
                changed();
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          className={btn}
          disabled={active || !payload || targets.length >= CRM.length}
          onClick={() => {
            setStatics([...statics, { id: crypto.randomUUID(), target: '', value: '' }]);
            changed();
          }}
        >
          <Plus size={13} />
          Add Static Field
        </button>
      </Section>
      <Section title="Fetch Test Lead" action={<button
            className={primary}
            disabled={active || !connected || issues.length > 0}
            onClick={fetchLead}
          >
            <RefreshCw size={14} />
            Fetch Test Lead
          </button>}>

        {!leads.length ? (
          <p className="rounded border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            No test leads fetched yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-muted">
                <tr>
                  {['Lead ID', 'Name', 'Email', 'Mobile', 'Received At', 'Status', 'Actions'].map(
                    (h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-2">{l.id}</td>
                    <td className="p-2">
                      {l.fields.FirstName} {l.fields.LastName}
                    </td>
                    <td className="p-2">{l.fields.Email}</td>
                    <td className="p-2">{l.fields.MobileNumber}</td>
                    <td className="p-2">{l.date}</td>
                    <td className={`p-2 ${l.added ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {l.added ? 'Added' : 'Pending'}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          className={btn}
                          disabled={active || l.added}
                          onClick={() => {
                            setLeads(leads.map((r) => (r.id === l.id ? { ...r, added: true } : r)));
                            setNotice('Lead added to demo CRM.');
                          }}
                        >
                          Add to CRM
                        </button>
                        <button
                          className={btn}
                          disabled={active}
                          aria-label={`Delete lead ${l.id}`}
                          onClick={() => setLeads(leads.filter((r) => r.id !== l.id))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer">Transformed lead details</summary>
              <pre className="max-h-72 overflow-auto rounded bg-slate-950 p-3 text-green-300">
                {JSON.stringify(
                  leads.map((l) => l.fields),
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </Section>
      <footer className="flex items-center justify-between border-t border-border pt-4">
        <Link href="/" className={btn}>
          Back to Integration Center
        </Link>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${active ? 'text-green-600' : 'text-muted-foreground'}`}>
            {active ? 'Active' : 'Inactive'}
          </span>
          <button
            className={active ? btn : primary}
            disabled={!active && !canActivate}
            onClick={() => {
              if (active) {
                setActive(false);
                setNotice('Integration deactivated. Fields are editable.');
              } else if (canActivate) {
                setActive(true);
                setNotice('LinkedIn integration activated successfully (demo).');
              }
            }}
          >
            {active ? 'Deactivate Integration' : 'Activate Integration'}
          </button>
        </div>
      </footer>
    </div>
  );
}
