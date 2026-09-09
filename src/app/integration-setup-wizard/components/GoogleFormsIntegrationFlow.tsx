'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import ConnectorIcon from '@/components/ui/ConnectorIcon';

const STEPS = [
  'Account & Spreadsheet',
  'Mapping & Defaults',
  'Trigger & Authorization',
  'Test & Verify',
  'Activate & Monitor',
];
const FIELDS = ['Email', 'First Name', 'Last Name', 'Mobile Number', 'Course', 'City'];
const SAMPLES = ['abc@gmail.com', 'Rahul', 'Sharma', '9876543210', 'BCA', 'Pune'];
const SHEETS = ['Student Admission Form', 'Demo Form Responses', 'Lead Generation Form'];
const DEFAULT_FIELDS = ['Lead Channel', 'Lead Source', 'Lead Campaign', 'Lead Medium'];
const SCENARIOS = [
  'Normal operation',
  'Google account disconnected',
  'Spreadsheet access denied',
  'No columns detected',
  'Required CRM field unmapped',
  'Trigger creation failed',
  'Authorization denied',
  'CRM lead creation failed',
  'Duplicate lead',
];
type Mapping = { source: string; crm: string; reviewed: boolean };
type Lead = {
  id: string;
  name: string;
  email: string;
  status: string;
  date: string;
  reason: string;
};
const initialMappings = (): Mapping[] =>
  FIELDS.map((source) => ({ source, crm: source, reviewed: source !== 'City' }));
const button =
  'inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40';
const primary = `${button} !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700`;
const input =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300';

function Badge({
  children,
  tone = 'success',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'warning' | 'error';
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${tone === 'success' ? 'bg-emerald-50 text-emerald-700' : tone === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-xs font-medium text-slate-600">
      <span>{label}</span>
      <select
        className={input}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function GoogleFormsIntegrationFlow() {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState(false);
  const [sheet, setSheet] = useState('');
  const [search, setSearch] = useState('');
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [entity, setEntity] = useState(0);
  const [defaults, setDefaults] = useState<Record<string, string>[]>([{}, {}, {}, {}]);
  const [defaultField, setDefaultField] = useState('Lead Source');
  const [trigger, setTrigger] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [tested, setTested] = useState(false);
  const [active, setActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [scenario, setScenario] = useState('Normal operation');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('Google Form Integration - Main');
  const [config, setConfig] = useState({
    source: 'Google Form',
    name: 'Google Forms',
    type: 'Online',
    channel: 'Online',
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastSync, setLastSync] = useState('Never');
  const [page, setPage] = useState(1);
  const mappingValid =
    ['Email', 'First Name', 'Mobile Number'].every((field) =>
      mappings.some((row) => row.crm === field)
    ) &&
    mappings.every((row) => row.crm && row.reviewed) &&
    new Set(mappings.map((row) => row.crm)).size === mappings.length;
  const invalidate = () => {
    setTested(false);
    setError('');
    setNotice('');
  };
  const fail = (message: string) => {
    setError(message);
    setNotice('');
    setTested(false);
  };
  const changeScenario = (value: string) => {
    setScenario(value);
    invalidate();
    if (value !== 'Normal operation')
      setError(
        value === 'Spreadsheet access denied'
          ? "You don't have permission to access this spreadsheet."
          : `${value}. Clear the demo issue and retry the affected action.`
      );
    if (value === 'Google account disconnected') {
      setConnected(false);
      setAuthorized(false);
    }
    if (value === 'Trigger creation failed') setTrigger(false);
    if (value === 'Authorization denied') setAuthorized(false);
  };
  const connect = () => {
    setConnected(true);
    setScenario('Normal operation');
    invalidate();
    setNotice('Demo Google account connected.');
  };
  const configureTrigger = () => {
    if (scenario === 'Trigger creation failed')
      return fail('Trigger creation failed. Please retry configuring the trigger.');
    setTrigger(true);
    invalidate();
    setNotice('On Form Submit trigger configured successfully.');
  };
  const authorize = () => {
    if (!connected) return fail('Google account disconnected. Reconnect your account.');
    if (scenario === 'Authorization denied')
      return fail('Authorization denied. Grant Google permissions and try again.');
    setAuthorized(true);
    invalidate();
    setNotice('Google account authorized for this demo integration.');
  };
  const validations = [
    ['Google Account', connected, 'Connected'],
    ['Spreadsheet', !!sheet && scenario !== 'Spreadsheet access denied', 'Connected'],
    ['Fields', !!sheet && scenario !== 'No columns detected', 'Detected'],
    ['Field Mapping', mappingValid && scenario !== 'Required CRM field unmapped', 'Valid'],
    [
      'Default Values',
      true,
      defaults.some((d) => Object.keys(d).length) ? 'Configured' : 'Optional — not configured',
    ],
    ['Trigger', trigger, 'Active'],
    ['Google Authorization', authorized, 'Authorized'],
    ['CRM Connection', scenario !== 'CRM lead creation failed', 'Connected (demo)'],
  ] as const;
  const recordLead = (status: string, reason = '') => {
    const id = `DEMO-LEAD-${Date.now()}`;
    const date = new Date().toLocaleString();
    setLeads((rows) => [
      { id, name: 'Rahul Sharma', email: 'abc@gmail.com', status, date, reason },
      ...rows,
    ]);
    setLastSync(date);
    setPage(1);
    return id;
  };
  const verify = () => {
    setError('');
    const failed = validations.find((row) => !row[1]);
    if (failed) {
      if (scenario === 'CRM lead creation failed') recordLead('Failed', 'CRM lead creation failed');
      return fail(
        `${failed[0]} validation failed. ${scenario === 'Normal operation' ? 'Complete the configuration before continuing.' : scenario + '.'}`
      );
    }
    if (scenario === 'Duplicate lead') {
      recordLead('Duplicate', 'Existing CRM duplicate rule: skip matching email');
      return fail(
        'Duplicate lead detected. Existing CRM duplicate rule applied: skipped matching email; result logged.'
      );
    }
    const id = recordLead('Success');
    setTested(true);
    setNotice(`Test lead created successfully! Lead ID: ${id} (demo)`);
  };
  const recover = () => {
    setScenario('Normal operation');
    setError('');
    setNotice('Demo issue cleared. Retry the failed action to verify recovery.');
  };
  const canNext =
    step === 0
      ? connected &&
        !!sheet &&
        !['Spreadsheet access denied', 'No columns detected'].includes(scenario)
      : step === 1
        ? mappingValid && scenario !== 'Required CRM field unmapped'
        : step === 2
          ? connected && trigger && authorized
          : tested;

  return (
    <div className="space-y-5 text-slate-700">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to Integration Center" className={button}>
            <ArrowLeft size={16} />
          </Link>
          <ConnectorIcon type="google-forms" size={36} />
          <div>
            <h1 className="text-xl font-semibold">Google Form Integration</h1>
            <p className="text-xs text-slate-500">
              Step {step + 1} of 5 · {STEPS[step]}
            </p>
          </div>
        </div>
        <Link href="/" className={button}>
          Back to Integration Center
        </Link>
      </header>
      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
        <Info size={16} className="shrink-0" />
        Demo mode — sample Google account, spreadsheets and CRM leads. Live OAuth and CRM services
        are not connected.
      </div>
      <nav
        aria-label="Integration setup progress"
        className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-5"
      >
        {STEPS.map((label, index) => (
          <button
            key={label}
            disabled={active || index > step}
            onClick={() => {
              setStep(index);
              setNotice('');
            }}
            aria-current={index === step ? 'step' : undefined}
            className={`flex items-center gap-2 text-left text-xs ${index === step ? 'font-semibold text-blue-600' : 'text-slate-500'} disabled:cursor-default`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${index <= step ? 'bg-blue-600 text-white' : 'border border-slate-200'}`}
            >
              {index < step ? <Check size={14} /> : index + 1}
            </span>
            {label}
          </button>
        ))}
      </nav>
      <details className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
        <summary className="cursor-pointer font-medium">Demo scenarios · {scenario}</summary>
        <div className="mt-3 max-w-md">
          <Select
            label="Exercise screenshot error and recovery scenarios"
            value={scenario}
            options={SCENARIOS}
            onChange={changeScenario}
          />
        </div>
      </details>
      {error && (
        <div role="alert" className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-red-600">
            <AlertTriangle size={20} />
            {scenario === 'Spreadsheet access denied'
              ? 'Access Denied'
              : 'Integration needs attention'}
          </div>
          <p className="text-sm text-red-700">{error}</p>
          <button
            className={primary}
            onClick={scenario === 'Google account disconnected' ? connect : recover}
          >
            {scenario === 'Spreadsheet access denied'
              ? 'Grant Permission'
              : scenario === 'Google account disconnected'
                ? 'Reconnect'
                : 'Try Again'}
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-5">
          <Panel title="Connect Google Account">
            <p className="text-xs text-slate-500">
              Connect the Google account used for this integration.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600" aria-label="Google">
                  G
                </span>
                {connected ? (
                  <>
                    <span className="text-sm">john.doe@gmail.com</span>
                    <Badge>Connected</Badge>
                  </>
                ) : (
                  <Badge tone="warning">Disconnected</Badge>
                )}
              </div>
              <button className={button} onClick={connect}>
                {connected ? 'Reconnect' : 'Connect Google Account'}
              </button>
            </div>
            <p className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-xs text-blue-600">
              <Info size={15} />
              The account must have sufficient access to the Form and linked Spreadsheet.
            </p>
          </Panel>
          <Panel title="Select Spreadsheet">
            <p className="text-xs text-slate-500">
              Choose the spreadsheet linked to your Google Form. Response sheet columns and sample
              data are detected automatically.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="relative block">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    aria-label="Search spreadsheet"
                    placeholder="Search spreadsheet..."
                    className={`${input} pl-9`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                {SHEETS.filter((s) => s.toLowerCase().includes(search.toLowerCase())).map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-xs ${sheet === s ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}
                  >
                    <input
                      type="radio"
                      name="spreadsheet"
                      disabled={!connected}
                      checked={sheet === s}
                      onChange={() => {
                        setSheet(s);
                        setMappings(initialMappings());
                        setTrigger(false);
                        invalidate();
                        if (scenario === 'Spreadsheet access denied')
                          fail("You don't have permission to access this spreadsheet.");
                        if (scenario === 'No columns detected')
                          fail(
                            'No columns detected. Add a header row to the linked response sheet and retry.'
                          );
                      }}
                    />
                    {s}
                    <FileSpreadsheet size={14} className="ml-auto text-blue-500" />
                  </label>
                ))}
                {!SHEETS.some((s) => s.toLowerCase().includes(search.toLowerCase())) && (
                  <p className="p-4 text-sm">No spreadsheets match your search.</p>
                )}
              </div>
              <div className="rounded-md border p-3">
                <h3 className="mb-2 text-xs font-semibold">Detected Columns & Sample Data</h3>
                {!sheet || !connected ? (
                  <p className="text-xs text-slate-400">
                    Connect your account and select a spreadsheet.
                  </p>
                ) : ['Spreadsheet access denied', 'No columns detected'].includes(scenario) ? (
                  <p className="text-xs text-red-600">{scenario}</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2">Header</th>
                        <th>Sample</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Timestamp', ...FIELDS].map((field, i) => (
                        <tr key={field} className="border-t">
                          <td className="p-2">{field}</td>
                          <td>{i === 0 ? '06/09/2026 15:20' : SAMPLES[i - 1]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Panel title="Field Mapping">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Auto-detect and auto-map fields. Review all mappings. Email, First Name and Mobile
                Number are required.
              </p>
              <div className="flex gap-2">
                <button
                  className={button}
                  onClick={() => {
                    setMappings(initialMappings());
                    invalidate();
                  }}
                >
                  <RotateCcw size={14} />
                  Reset Mapping
                </button>
                <button
                  className={button}
                  disabled={mappings.length >= FIELDS.length}
                  onClick={() => {
                    const source = FIELDS.find((f) => !mappings.some((m) => m.source === f));
                    if (source) setMappings([...mappings, { source, crm: '', reviewed: false }]);
                    invalidate();
                  }}
                >
                  <Plus size={14} />
                  Add Field Mapping
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Source Field', 'Sample', 'CRM Field', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((row, index) => (
                    <tr key={row.source} className="border-t">
                      <td className="p-3">{row.source}</td>
                      <td className="p-3">{SAMPLES[FIELDS.indexOf(row.source)]}</td>
                      <td className="p-3">
                        <select
                          aria-label={`CRM field for ${row.source}`}
                          className={input}
                          value={row.crm}
                          onChange={(e) => {
                            setMappings(
                              mappings.map((r, i) =>
                                i === index ? { ...r, crm: e.target.value, reviewed: true } : r
                              )
                            );
                            invalidate();
                          }}
                        >
                          <option value="">Select CRM field</option>
                          {FIELDS.map((f) => (
                            <option
                              key={f}
                              disabled={mappings.some((r, i) => i !== index && r.crm === f)}
                            >
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Badge tone={row.crm && row.reviewed ? 'success' : 'warning'}>
                          {!row.crm ? 'Unmapped' : row.reviewed ? 'Auto Mapped' : 'Needs Review'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {!row.reviewed && (
                            <button
                              className={button}
                              onClick={() => {
                                setMappings(
                                  mappings.map((r, i) =>
                                    i === index ? { ...r, reviewed: true } : r
                                  )
                                );
                                invalidate();
                              }}
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            className={button}
                            aria-label={`Remove ${row.source} mapping`}
                            onClick={() => {
                              setMappings(mappings.filter((_, i) => i !== index));
                              invalidate();
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!mappingValid && (
              <p className="text-xs text-amber-700">
                Map required CRM fields and confirm mappings marked Needs Review to continue.
              </p>
            )}
          </Panel>
          <Panel title="Default Values">
            <p className="text-xs text-slate-500">
              These values are used only when the incoming source value is empty or null.
            </p>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((e) => (
                <button
                  key={e}
                  className={entity === e ? primary : button}
                  onClick={() => setEntity(e)}
                >
                  Entity {e + 1}
                </button>
              ))}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <Select
                  label="Add Field"
                  value={defaultField}
                  options={DEFAULT_FIELDS}
                  onChange={setDefaultField}
                />
                <button
                  className={button}
                  disabled={defaultField in defaults[entity]}
                  onClick={() => {
                    setDefaults(
                      defaults.map((d, i) => (i === entity ? { ...d, [defaultField]: '' } : d))
                    );
                    invalidate();
                  }}
                >
                  <Plus size={14} />
                  Add Field
                </button>
                <Badge tone={Object.values(defaults[entity]).some(Boolean) ? 'success' : 'warning'}>
                  {Object.values(defaults[entity]).some(Boolean) ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
              <div className="space-y-3">
                {Object.entries(defaults[entity]).map(([field, value]) => (
                  <div key={field} className="flex items-end gap-2">
                    <label className="flex-1 space-y-1 text-xs">
                      {field}
                      <input
                        className={input}
                        placeholder={`Enter ${field.toLowerCase()}`}
                        value={value}
                        onChange={(e) => {
                          setDefaults(
                            defaults.map((d, i) =>
                              i === entity ? { ...d, [field]: e.target.value } : d
                            )
                          );
                          invalidate();
                        }}
                      />
                    </label>
                    <button
                      className={button}
                      aria-label={`Remove default ${field}`}
                      onClick={() => {
                        setDefaults(
                          defaults.map((d, i) => {
                            if (i !== entity) return d;
                            const next = { ...d };
                            delete next[field];
                            return next;
                          })
                        );
                        invalidate();
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Configure Trigger">
            <Select
              label="Event Source"
              value="Google Spreadsheet"
              options={['Google Spreadsheet']}
            />
            <Select label="Event Type" value="On Form Submit" options={['On Form Submit']} />
            <Select label="Action" value="Create Lead in CRM" options={['Create Lead in CRM']} />
            <div className="flex items-center justify-between">
              <span className="text-xs">Trigger Status</span>
              <Badge tone={trigger ? 'success' : 'warning'}>
                {trigger ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            <button className={primary} onClick={configureTrigger}>
              <RefreshCw size={14} />
              {trigger ? 'Reconfigure Trigger' : 'Configure Trigger'}
            </button>
          </Panel>
          <Panel title="Google Authorization">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <span className="text-sm">john.doe@gmail.com</span>
              <Badge tone={connected ? 'success' : 'error'}>
                {connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <p className="text-xs leading-6 text-slate-500">
              Google permissions are required to access your Form and Spreadsheet data, and to
              create leads in CRM.
            </p>
            <button className={primary} onClick={connected ? authorize : connect}>
              <ShieldCheck size={16} />
              {connected ? 'Authorize Google Account' : 'Reconnect'}
            </button>
            {authorized && (
              <div>
                <Badge>Authorized</Badge>
              </div>
            )}
          </Panel>
        </div>
      )}

      {step === 3 && (
        <Panel title="Test & Verify">
          <p className="text-xs text-slate-500">
            Validate the complete integration before activation and create a demo test lead.
          </p>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Validation</th>
                <th>Expected Result</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {validations.map(([label, valid, expected]) => (
                <tr key={label} className="border-t">
                  <td className="p-3">{label}</td>
                  <td>{expected}</td>
                  <td>
                    <Badge tone={!valid ? 'error' : tested ? 'success' : 'warning'}>
                      {!valid ? 'Failed' : tested ? 'Success' : 'Ready'}
                    </Badge>
                  </td>
                </tr>
              ))}
              <tr className="border-t">
                <td className="p-3">Test Lead</td>
                <td>Created Successfully</td>
                <td>
                  <Badge tone={tested ? 'success' : 'warning'}>
                    {tested ? 'Success' : 'Not Tested'}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
          <button className={primary} onClick={verify}>
            <CheckCircle2 size={15} />
            {tested ? 'Run Test Again' : 'Test & Create Lead'}
          </button>
        </Panel>
      )}

      {step === 4 && (
        <div className="space-y-5">
          {success ? (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 py-10 text-center"
            >
              <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
              <h2 className="font-semibold">Integration Activated</h2>
              <p className="my-3 text-sm">
                Google Form integration has been activated successfully in demo mode.
              </p>
              <button className={primary} onClick={() => setSuccess(false)}>
                View Integration
              </button>
            </div>
          ) : active ? (
            <Panel title="Monitoring — Integration Status">
              <div className="flex gap-3 border-b pb-3">
                {['Overview', 'Recent Leads', 'Lead Data'].map((t) => (
                  <button
                    className={tab === t ? primary : button}
                    key={t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Integration Status{' '}
                  <Badge tone={scenario === 'Normal operation' && connected ? 'success' : 'error'}>
                    {scenario === 'Normal operation' && connected ? 'Active' : 'Failed'}
                  </Badge>
                </span>
                <button className={button} onClick={connected ? verify : connect}>
                  <RefreshCw size={14} />
                  {connected ? 'Sync Demo Response' : 'Reconnect'}
                </button>
              </div>
              {tab === 'Overview' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Total Leads Received', leads.length],
                      ['Successful Leads', leads.filter((l) => l.status === 'Success').length],
                      ['Failed Leads', leads.filter((l) => l.status === 'Failed').length],
                    ].map(([label, count]) => (
                      <div key={label} className="rounded-md border bg-slate-50 p-4">
                        <p className="text-xs">{label}</p>
                        <p className="mt-2 text-xl font-semibold">{count}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs">
                    Last Lead Received: {leads[0]?.date ?? 'Never'} · Last Sync: {lastSync}
                  </p>
                </>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Lead ID', 'Name', 'Email', 'Source', 'Status', 'Created On', 'Reason'].map(
                        (h) => (
                          <th key={h} className="p-2">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice((page - 1) * 5, page * 5).map((lead) => (
                      <tr key={lead.id} className="border-t">
                        <td className="p-2">{lead.id}</td>
                        <td>{lead.name}</td>
                        <td>{lead.email}</td>
                        <td>{config.source}</td>
                        <td>
                          <Badge
                            tone={
                              lead.status === 'Success'
                                ? 'success'
                                : lead.status === 'Duplicate'
                                  ? 'warning'
                                  : 'error'
                            }
                          >
                            {lead.status}
                          </Badge>
                        </td>
                        <td>{lead.date}</td>
                        <td>{lead.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-3 text-xs">
                <button className={button} disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                Page {page} of {Math.max(1, Math.ceil(leads.length / 5))}
                <button
                  className={button}
                  disabled={page * 5 >= leads.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </Panel>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="Integration Summary">
                  <label className="block space-y-2 text-xs">
                    Integration Name
                    <input
                      className={input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      [
                        'Google Account',
                        connected ? 'john.doe@gmail.com (Connected)' : 'Disconnected',
                      ],
                      ['Spreadsheet', sheet],
                      ['Detected Fields', '6'],
                      [
                        'Field Mapping',
                        `${mappings.length} mapped; ${mappings.filter((r) => !r.reviewed).length} need review`,
                      ],
                      [
                        'Default Values',
                        `${defaults.filter((d) => Object.values(d).some(Boolean)).length} entities configured`,
                      ],
                      ['Trigger', trigger ? 'Active' : 'Not Configured'],
                      ['Authorization', authorized ? 'Authorized' : 'Not Authorized'],
                      ['EESource', '13 (System Defined)'],
                    ].map(([label, value]) => (
                      <React.Fragment key={label}>
                        <dt className="text-slate-500">{label}</dt>
                        <dd>{value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </Panel>
                <Panel title="Lead Creation Configuration">
                  <Select
                    label="Integration Type"
                    value="Google Form Integration"
                    options={['Google Form Integration']}
                    disabled
                  />
                  {(['source', 'name', 'type', 'channel'] as const).map((key) => (
                    <Select
                      key={key}
                      label={`Lead ${key[0].toUpperCase() + key.slice(1)}`}
                      value={config[key]}
                      options={
                        key === 'source'
                          ? ['Google Form', 'Website', 'Campaign']
                          : key === 'name'
                            ? ['Google Forms', 'Student Admission', 'Lead Generation']
                            : ['Online', 'Offline']
                      }
                      onChange={(value) => {
                        setConfig({ ...config, [key]: value });
                        invalidate();
                      }}
                    />
                  ))}
                  <Select
                    label="EESource"
                    value="13 (System Defined)"
                    options={['13 (System Defined)']}
                    disabled
                  />
                  <button
                    className={button}
                    onClick={() => {
                      setNotice(
                        'Lead configuration saved for this session. Run verification after changes.'
                      );
                    }}
                  >
                    Save
                  </button>
                </Panel>
              </div>
              {!tested && (
                <button className={button} onClick={() => setStep(3)}>
                  Return to Test & Verify
                </button>
              )}
            </>
          )}
        </div>
      )}
      {!active && (
        <footer className="flex items-center justify-between border-t pt-4">
          <button
            className={button}
            disabled={step === 0}
            onClick={() => {
              setStep(step - 1);
              setNotice('');
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          {step < 4 ? (
            <button
              className={primary}
              disabled={!canNext}
              onClick={() => {
                setStep(step + 1);
                setNotice('');
              }}
            >
              Next
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className={primary}
              disabled={!tested || !name.trim() || !validations.every((v) => v[1])}
              onClick={() => {
                setActive(true);
                setSuccess(true);
                setNotice('');
              }}
            >
              <CheckCircle2 size={15} />
              Activate Integration
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
