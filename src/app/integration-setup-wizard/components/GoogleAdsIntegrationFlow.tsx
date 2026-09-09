'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Check, CheckCircle2, ChevronRight, Clipboard, ExternalLink,
  Plus, RefreshCw, RotateCcw, ShieldCheck, Trash2,
} from 'lucide-react';

const STEPS = [
  'Create & Connect', 'Lead Form', 'Webhook Setup', 'Field Mapping',
  'Default Values', 'Configure Trigger', 'Google Authorization',
  'Test & Verify', 'Summary & Activate',
];

const CRM_FIELDS = ['First Name / Name', 'Mobile Number', 'Email', 'Pin Code', 'Course', 'City', 'Lead Source', 'Lead Campaign'];
const INITIAL_MAPPINGS = [
  { source: 'FULL_NAME', sample: 'Rahul Sharma', crm: 'First Name / Name' },
  { source: 'PHONE_NUMBER', sample: '9876543210', crm: 'Mobile Number' },
  { source: 'EMAIL', sample: 'rahul@gmail.com', crm: 'Email' },
  { source: 'POSTAL_CODE', sample: '411001', crm: 'Pin Code' },
  { source: 'COURSE', sample: 'BCA', crm: 'Course' },
  { source: 'CITY', sample: 'Pune', crm: 'City' },
];

export default function GoogleAdsIntegrationFlow() {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [tested, setTested] = useState(false);
  const [activated, setActivated] = useState(false);
  const [mappings, setMappings] = useState(INITIAL_MAPPINGS);
  const [defaults, setDefaults] = useState({ channel: 'Online', source: 'Google Ads', campaign: 'Main Campaign', medium: 'Paid Search' });

  const selectedFields = useMemo(() => mappings.map((row) => row.crm).filter(Boolean), [mappings]);
  const updateMapping = (index: number, crm: string) => setMappings((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, crm } : row));
  const addMapping = () => setMappings((rows) => [...rows, { source: 'NEW_FIELD', sample: 'Sample value', crm: '' }]);
  const canNext = step === 0 ? connected : step === 6 ? authorized : step === 7 ? tested : true;

  if (activated) return <ActivatedMonitor />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:bg-muted"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="text-[20px] font-semibold text-foreground">Google Ads Lead Form Extension</h1>
            <p className="text-[12px] text-muted-foreground">Step {step + 1} of 9 — {STEPS[step]}</p>
          </div>
        </div>
        <Link href="/" className="rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted">Back to Integration Center</Link>
      </div>

      <div className="card-base overflow-x-auto px-4 py-3">
        <div className="flex min-w-[920px] items-start">
          {STEPS.map((label, index) => (
            <React.Fragment key={label}>
              <div className="w-[92px] text-center">
                <div className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${index <= step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {index < step ? <Check size={12} /> : index + 1}
                </div>
                <p className={`mt-1 text-[9px] font-medium ${index === step ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
              </div>
              {index < STEPS.length - 1 && <div className={`mt-3 h-px flex-1 ${index < step ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card-base min-h-[450px] p-6">
        <StepContent step={step} connected={connected} setConnected={setConnected} authorized={authorized} setAuthorized={setAuthorized} tested={tested} setTested={setTested} mappings={mappings} selectedFields={selectedFields} updateMapping={updateMapping} addMapping={addMapping} defaults={defaults} setDefaults={setDefaults} />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-[12px] font-medium disabled:opacity-40"><ArrowLeft size={14} />Back</button>
        {step === 8 ? (
          <button onClick={() => setActivated(true)} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-[12px] font-semibold text-white hover:bg-primary/90">Activate Integration<CheckCircle2 size={14} /></button>
        ) : (
          <button onClick={() => canNext && setStep((value) => value + 1)} disabled={!canNext} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">Next: {STEPS[step + 1]}<ChevronRight size={14} /></button>
        )}
      </div>
    </div>
  );
}

type StepProps = {
  step: number; connected: boolean; setConnected: (value: boolean) => void;
  authorized: boolean; setAuthorized: (value: boolean) => void;
  tested: boolean; setTested: (value: boolean) => void;
  mappings: typeof INITIAL_MAPPINGS; selectedFields: string[];
  updateMapping: (index: number, value: string) => void; addMapping: () => void;
  defaults: Record<string, string>; setDefaults: React.Dispatch<React.SetStateAction<{ channel: string; source: string; campaign: string; medium: string }>>;
};

function StepContent(props: StepProps) {
  const { step } = props;
  if (step === 0) return <CreateConnect {...props} />;
  if (step === 1) return <LeadForm />;
  if (step === 2) return <WebhookSetup />;
  if (step === 3) return <FieldMapping {...props} />;
  if (step === 4) return <DefaultValues {...props} />;
  if (step === 5) return <ConfigureTrigger />;
  if (step === 6) return <Authorization {...props} />;
  if (step === 7) return <TestVerify {...props} />;
  return <Summary mappings={props.mappings} authorized={props.authorized} />;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div className="mb-5"><h2 className="text-[17px] font-semibold text-foreground">{title}</h2><p className="mt-1 text-[12px] text-muted-foreground">{description}</p></div>;
}

function CreateConnect({ connected, setConnected }: StepProps) {
  return <><SectionTitle title="Create Integration & Connect Google Ads" description="Enter integration details and connect the Google Ads account used for this lead form." />
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 border-r-0 border-border lg:border-r lg:pr-6">
        <Input label="Integration Name" value="Google Ads Lead Form - Main Campaign" />
        <Select label="Client / Client Alias" value="ABC Enterprises (ABC001)" options={['ABC Enterprises (ABC001)', 'XYZ Ventures (XYZ002)']} />
        <Input label="EESource" value="13" disabled />
        <Select label="Status" value="Draft" options={['Draft', 'Active']} />
      </div>
      <div>
        <h3 className="text-[13px] font-semibold">Connect Google Ads Account</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">The account must have access to the selected Ads account and lead form.</p>
        <button onClick={() => setConnected(true)} className="mt-4 flex items-center gap-2 rounded-md border border-primary/30 bg-card px-4 py-2 text-[12px] font-semibold text-primary"><span className="text-base font-bold">G</span>Connect Google Ads Account</button>
        {connected && <div className="mt-3 flex items-center justify-between rounded-lg border border-success-border bg-success-bg p-3 text-[12px]"><span>G &nbsp; john.doe@gmail.com</span><Status text="Connected" /></div>}
        <p className="mt-5 text-[11px] font-semibold">Available Ads Accounts</p>
        {['ABC Marketing (123-456-7890)', 'XYZ Campaigns (987-654-3210)', 'Global Ads (555-444-3333)'].map((name, index) => <label key={name} className="mt-2 flex items-center gap-2 rounded-md border border-border p-3 text-[12px]"><input type="radio" name="ads-account" defaultChecked={index === 0} />{name}{index === 0 && <span className="ml-auto text-success">Selected</span>}</label>)}
      </div>
    </div></>;
}

function LeadForm() {
  return <><SectionTitle title="Select Google Ads Lead Form" description="Choose the campaign and lead form extension that will send leads to your CRM." /><div className="grid max-w-3xl gap-4 md:grid-cols-2"><Select label="Ads Account" value="ABC Marketing (123-456-7890)" options={['ABC Marketing (123-456-7890)']} /><Select label="Campaign" value="Main Search Campaign" options={['Main Search Campaign', 'Brand Campaign', 'Remarketing Campaign']} /><Select label="Lead Form Extension" value="Course Enquiry Form" options={['Course Enquiry Form', 'Demo Request Form']} /><Input label="Form Resource ID" value="LF-9081734" disabled /></div></>;
}

function WebhookSetup() {
  const copy = (value: string) => navigator.clipboard?.writeText(value);
  return <><SectionTitle title="Webhook Setup" description="Add this generated webhook URL and key to your Google Ads Lead Form Extension." /><div className="max-w-4xl space-y-4"><CopyField label="Webhook URL" value="https://webhookapi.extragedge.com/responses?clientalias=ABC001" onCopy={copy} /><Input label="Client Alias" value="ABC001" disabled /><CopyField label="Webhook Key" value="••••••••••••••••••••••••" onCopy={() => copy('gads_ABCD1234_secure_key')} /><Input label="EESource" value="13" disabled /><div><p className="mb-1 text-[11px] font-medium">Status</p><span className="rounded-full bg-warning-bg px-2 py-1 text-[10px] font-semibold text-warning">Not Configured</span></div><div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] text-primary">Add this Webhook URL and key in your Google Ads Lead Form Extension.</div></div></>;
}

function FieldMapping({ mappings, selectedFields, updateMapping, addMapping }: StepProps) {
  return <><SectionTitle title="Field Mapping" description="Map Google form fields to CRM fields. Default mappings are applied automatically and can be edited." />
    <div className="mb-4 flex justify-end gap-2"><button className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-[11px]"><RotateCcw size={12} />Reset Mapping</button><button onClick={addMapping} className="flex items-center gap-1 rounded-md border border-primary/30 px-3 py-2 text-[11px] font-medium text-primary"><Plus size={12} />Add Field Mapping</button></div>
    <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-left text-[11px]"><thead className="bg-muted/70 text-muted-foreground"><tr><th className="px-4 py-3">GOOGLE SOURCE FIELD</th><th className="px-4 py-3">SAMPLE VALUE</th><th className="px-4 py-3">CRM FIELD</th><th className="px-4 py-3">STATUS</th><th className="w-10" /></tr></thead><tbody>{mappings.map((row, index) => <tr key={`${row.source}-${index}`} className="border-t border-border"><td className="px-4 py-3 font-semibold">{row.source}</td><td className="px-4 py-3 text-muted-foreground">{row.sample}</td><td className="px-4 py-2"><select value={row.crm} onChange={(event) => updateMapping(index, event.target.value)} className="h-8 w-full rounded-md border border-border bg-card px-2"><option value="">Select CRM field</option>{CRM_FIELDS.map((field) => <option key={field} value={field} disabled={field !== row.crm && selectedFields.includes(field)}>{field}</option>)}</select></td><td className="px-4 py-3"><Status text={row.crm ? 'Auto Mapped' : 'Needs Review'} warning={!row.crm} /></td><td>{index >= INITIAL_MAPPINGS.length && <Trash2 size={13} className="text-danger" />}</td></tr>)}</tbody></table></div></>;
}

function DefaultValues({ defaults, setDefaults }: StepProps) {
  const fields = [['channel', 'Lead Channel'], ['source', 'Lead Source'], ['campaign', 'Lead Campaign'], ['medium', 'Lead Medium']] as const;
  return <><SectionTitle title="Default Values" description="Configure fallback values for CRM fields when the incoming source value is empty." /><div className="grid max-w-4xl gap-4 md:grid-cols-2">{fields.map(([key, label]) => <Select key={key} label={label} value={defaults[key]} options={key === 'channel' ? ['Online', 'Offline'] : key === 'source' ? ['Google Ads', 'Website'] : key === 'medium' ? ['Paid Search', 'Display', 'Video'] : ['Main Campaign', 'Brand Campaign']} onChange={(value) => setDefaults((state) => ({ ...state, [key]: value }))} />)}</div></>;
}

function ConfigureTrigger() {
  return <><SectionTitle title="Configure Trigger" description="Set the trigger that processes new form submissions." /><div className="max-w-4xl overflow-hidden rounded-lg border border-border text-[12px]"><InfoRow label="Event Source" value="Google Ads Lead Form" /><InfoRow label="Event Type" value="On Form Submit" /><InfoRow label="Action" value="Create Lead in CRM" /><InfoRow label="Status" value={<Status text="Configured" />} /></div><button className="mt-4 flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-[11px] font-medium text-primary"><ExternalLink size={12} />Edit Trigger</button></>;
}

function Authorization({ authorized, setAuthorized }: StepProps) {
  return <><SectionTitle title="Google Authorization" description="Grant required permissions to access your Google account and lead form data." /><div className="grid gap-5 lg:grid-cols-2"><div><div className="rounded-lg border border-border p-4 text-[12px]">G &nbsp; john.doe@gmail.com <Status text="Connected" /></div><p className="mt-4 text-[11px] font-semibold">Required Permissions</p><ul className="mt-2 space-y-2 text-[11px] text-muted-foreground"><li>• View and manage Google Ads lead forms</li><li>• Read campaign and form responses</li><li>• Access selected account metadata</li></ul><button onClick={() => setAuthorized(true)} className="mt-5 rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-white">Authorize Google Account</button></div><div className={`flex min-h-52 flex-col items-center justify-center rounded-lg border ${authorized ? 'border-success-border bg-success-bg' : 'border-border bg-muted/20'}`}><ShieldCheck size={44} className={authorized ? 'text-success' : 'text-muted-foreground'} /><p className="mt-3 text-[14px] font-semibold">{authorized ? 'Authorized' : 'Authorization Required'}</p><p className="mt-1 text-[11px] text-muted-foreground">{authorized ? 'Google account has been authorized successfully.' : 'Authorize the account to continue.'}</p></div></div></>;
}

function TestVerify({ tested, setTested }: StepProps) {
  const checks = ['Google Account', 'Lead Form', 'Fields', 'Field Mapping', 'Default Values', 'Trigger', 'CRM Connection', 'Test Lead'];
  return <><SectionTitle title="Test & Verify" description="Validate the complete integration before activation." /><div className="max-w-4xl overflow-hidden rounded-lg border border-border">{checks.map((item, index) => <div key={item} className="flex items-center justify-between border-b border-border px-4 py-3 text-[12px] last:border-0"><span className="flex items-center gap-2"><CheckCircle2 size={14} className={tested || index < 7 ? 'text-success' : 'text-muted-foreground'} />{item}</span><Status text={tested || index < 7 ? (item === 'Test Lead' ? 'Added Successfully' : 'Connected') : 'Pending'} warning={!tested && index === 7} /></div>)}</div><button onClick={() => setTested(true)} className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-white"><RefreshCw size={13} />Run Test Lead</button></>;
}

function Summary({ mappings, authorized }: { mappings: typeof INITIAL_MAPPINGS; authorized: boolean }) {
  return <><SectionTitle title="Summary & Activate" description="Review the Google Ads integration configuration before activation." /><div className="max-w-4xl overflow-hidden rounded-lg border border-border text-[12px]"><InfoRow label="Integration Name" value="Google Ads Lead Form - Main Campaign" /><InfoRow label="Google Account" value="john.doe@gmail.com" /><InfoRow label="Ads Account" value="ABC Marketing" /><InfoRow label="Selected Fields" value={`${mappings.length}`} /><InfoRow label="Field Mapping" value={`${mappings.filter((row) => row.crm).length} / ${mappings.length}`} /><InfoRow label="Default Values" value="4 / 4" /><InfoRow label="Trigger Status" value={<Status text="Active" />} /><InfoRow label="Authorization Status" value={<Status text={authorized ? 'Authorized' : 'Pending'} warning={!authorized} />} /><InfoRow label="Test Lead" value={<Status text="Success" />} /></div></>;
}

function ActivatedMonitor() {
  return <div className="space-y-5"><div className="rounded-lg border border-success-border bg-success-bg p-5 text-center"><CheckCircle2 className="mx-auto text-success" size={34} /><h2 className="mt-2 text-[16px] font-semibold text-success">Integration Activated!</h2><p className="mt-1 text-[12px] text-muted-foreground">Your Google Ads Lead Form integration has been activated successfully.</p></div><div className="card-base p-6"><SectionTitle title="Post-Activation Monitoring" description="Live performance of this Google Ads integration." /><div className="grid gap-3 sm:grid-cols-3"><Metric label="Total Leads Received" value="1,250" /><Metric label="Successful Leads" value="1,230" /><Metric label="Failed Leads" value="20" /></div></div><Link href="/" className="inline-flex rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-white">Back to Integration Center</Link></div>;
}

function Input({ label, value, disabled = false }: { label: string; value: string; disabled?: boolean }) { return <label className="block text-[11px] font-medium">{label}<input defaultValue={value} disabled={disabled} className="mt-1.5 h-9 w-full rounded-md border border-border bg-muted/40 px-3 text-[12px] disabled:text-muted-foreground" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange?: (value: string) => void }) { return <label className="block text-[11px] font-medium">{label}<select value={value} onChange={(event) => onChange?.(event.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-[12px]">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) { return <div><p className="mb-1.5 text-[11px] font-medium">{label}</p><div className="flex gap-2"><div className="flex h-9 flex-1 items-center rounded-md border border-border bg-muted/40 px-3 text-[11px] text-muted-foreground">{value}</div><button onClick={() => onCopy(value)} className="flex items-center gap-1 rounded-md border border-primary/30 px-3 text-[11px] text-primary"><Clipboard size={12} />Copy</button></div></div>; }
function Status({ text, warning = false }: { text: string; warning?: boolean }) { return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${warning ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success'}`}>{text}</span>; }
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid grid-cols-[180px_1fr] border-b border-border last:border-0"><div className="bg-muted/40 px-4 py-3 font-medium text-muted-foreground">{label}</div><div className="px-4 py-3">{value}</div></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border p-4"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-[22px] font-semibold">{value}</p></div>; }
