'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import GoogleAdsWebhookSetup from './GoogleAdsWebhookSetup';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, Clipboard, ExternalLink,
  Info, Loader2, Mail, Phone, Plus, RefreshCw, RotateCcw, ShieldCheck, Tag, Trash2, UserCheck,
} from 'lucide-react';
import { addActivatedIntegration } from '@/app/components/activatedIntegrationsStore';
import type { Integration } from '@/app/components/IntegrationTable';
import WizardStepper from './WizardStepper';

// ─── Google "G" logo — the standard multi-colour mark used on Sign in with Google buttons ──
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

const STEPS = ['Connect & Configure', 'Field Mapping', 'Authorization, Test & Publish'];
const STEP_DESCRIPTIONS = ['Account & webhook', 'Map & static values', 'Authorize & activate'];

const ADS_ACCOUNTS = ['ABC Marketing (123-456-7890)', 'XYZ Campaigns (987-654-3210)', 'Global Ads (555-444-3333)'];

const CRM_FIELDS = ['First Name / Name', 'Mobile Number', 'Email', 'Pin Code', 'Course', 'City', 'Lead Source', 'Lead Campaign'];
const INITIAL_MAPPINGS = [
  { source: 'FULL_NAME', sample: 'Rahul Sharma', crm: 'First Name / Name' },
  { source: 'PHONE_NUMBER', sample: '9876543210', crm: 'Mobile Number' },
  { source: 'EMAIL', sample: 'rahul@gmail.com', crm: 'Email' },
  { source: 'POSTAL_CODE', sample: '411001', crm: 'Pin Code' },
  { source: 'COURSE', sample: 'BCA', crm: 'Course' },
  { source: 'CITY', sample: 'Pune', crm: 'City' },
];

const STATIC_FIELD_POOL = ['Lead Channel', 'Lead Source', 'Lead Campaign', 'Lead Medium'];

const TEST_LEAD_POOL = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', mobile: '+91 98765 43210' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', mobile: '+91 91234 56780' },
  { name: 'Karthik Rao', email: 'karthik.rao@gmail.com', mobile: '+91 99887 76655' },
];

type StaticField = { id: string; field: string; value: string };
type TestLead = { id: string; name: string; email: string; mobile: string; receivedAt: string; addedToCrm: boolean };

const btnBase = 'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnGhost = `${btnBase} bg-card border border-border text-foreground hover:bg-muted`;
const btnPrimary = `${btnBase} bg-primary text-white hover:bg-primary/90`;
const fieldInput = 'w-full h-9 px-3 text-[12px] bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:text-muted-foreground disabled:bg-muted/40';
const fieldLabel = 'block text-[11px] font-medium text-muted-foreground mb-1.5';

export default function GoogleAdsIntegrationFlow() {
  const [step, setStep] = useState(0);
  const [integrationName, setIntegrationName] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.integrationName', 'Google Ads Lead Form - Main Campaign');
  const [connected, setConnected] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.connected', false);
  const [selectedAdsAccount, setSelectedAdsAccount] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.selectedAdsAccount', ADS_ACCOUNTS[0]);
  const [authorized, setAuthorized] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.authorized', false);
  const [testLeads, setTestLeads] = useState<TestLead[]>([]);
  const [activated, setActivated] = useState(false);
  const [mappings, setMappings] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.mappings', INITIAL_MAPPINGS);
  const [staticFields, setStaticFields] = useSetupState<StaticField[]>('google-ads', 'GoogleAdsIntegrationFlow.staticFields', []);

  const selectedFields = useMemo(() => mappings.map((row) => row.crm).filter(Boolean), [mappings]);
  const updateMapping = (index: number, crm: string) => setMappings((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, crm } : row)));
  const addMapping = () => setMappings((rows) => [...rows, { source: 'NEW_FIELD', sample: 'Sample value', crm: '' }]);
  const resetMapping = () => setMappings(INITIAL_MAPPINGS);
  const removeMapping = (index: number) => setMappings((rows) => rows.filter((_, rowIndex) => rowIndex !== index));

  const availableStaticFields = useMemo(() => STATIC_FIELD_POOL.filter((field) => !staticFields.some((sf) => sf.field === field)), [staticFields]);
  const addStaticField = () => {
    const field = availableStaticFields[0];
    if (!field) return;
    setStaticFields((prev) => [...prev, { id: `sf-${Date.now()}`, field, value: '' }]);
  };
  const updateStaticField = (id: string, updates: Partial<StaticField>) => setStaticFields((prev) => prev.map((sf) => (sf.id === id ? { ...sf, ...updates } : sf)));
  const removeStaticField = (id: string) => setStaticFields((prev) => prev.filter((sf) => sf.id !== id));

  const canNext = step === 0 ? connected : true;
  const canActivate = authorized && testLeads.some((lead) => lead.addedToCrm);

  const activate = () => {
    const row: Integration = {
      id: `int-gads-${Date.now()}`,
      name: integrationName.trim() || 'Google Ads Lead Form - Main Campaign',
      type: 'google-ads',
      status: 'active',
      lastSync: 'Just now',
      events24h: 0,
      successRate: 0,
      latencyMs: 0,
      owner: 'Pramod Bhujbal',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      environment: 'production',
      errorCount: 0,
    };
    addActivatedIntegration(row);
    setActivated(true);
    toast.success('Google Ads integration activated.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground tracking-tight">Google Ads Lead Form Extension</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
        <Link href="/">
          <button className={btnGhost}><ChevronLeft size={13} />Back to Integration Center</button>
        </Link>
      </div>

      {/* Step indicator */}
      <WizardStepper currentStep={step} labels={STEPS} descriptions={STEP_DESCRIPTIONS} />

      {activated && (
        <div className="flex items-center gap-3 rounded-lg border border-success-border bg-success-bg px-4 py-3.5">
          <CheckCircle2 size={20} className="text-success flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-success">Integration Activated</p>
            <p className="text-[11px] text-success/80 mt-0.5">This Google Ads integration is now live and syncing leads to CRM (demo).</p>
          </div>
          <Link href="/">
            <button className={btnGhost}>Back to Integration Center</button>
          </Link>
        </div>
      )}

      {step === 0 && (
        <StepConnectConfigure
          integrationName={integrationName}
          setIntegrationName={setIntegrationName}
          connected={connected}
          setConnected={setConnected}
          selectedAdsAccount={selectedAdsAccount}
          setSelectedAdsAccount={setSelectedAdsAccount}
        />
      )}
      {step === 1 && (
        <StepFieldMapping
          mappings={mappings}
          selectedFields={selectedFields}
          updateMapping={updateMapping}
          addMapping={addMapping}
          resetMapping={resetMapping}
          removeMapping={removeMapping}
          staticFields={staticFields}
          availableStaticFields={availableStaticFields}
          addStaticField={addStaticField}
          updateStaticField={updateStaticField}
          removeStaticField={removeStaticField}
        />
      )}
      {step === 2 && (
        <StepTriggerAuthTest
          authorized={authorized}
          setAuthorized={setAuthorized}
          testLeads={testLeads}
          setTestLeads={setTestLeads}
        />
      )}

      {/* Footer nav */}
      {!activated && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className={btnGhost}>
            <ChevronLeft size={13} />Back
          </button>
          {step === STEPS.length - 1 ? (
            <button onClick={activate} disabled={!canActivate} className={btnPrimary}>
              <CheckCircle2 size={14} />Activate Integration
            </button>
          ) : (
            <button onClick={() => canNext && setStep((value) => value + 1)} disabled={!canNext} className={btnPrimary}>
              Next: {STEPS[step + 1]}<ArrowRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared building blocks ──────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card-base p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">{icon}</div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, disabled = false }: { label: string; value: string; onChange?: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} className={fieldInput} readOnly={!onChange} />
    </label>
  );
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <select value={value} onChange={(event) => onChange?.(event.target.value)} className={fieldInput}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
function CopyField({ label, value, copyValue }: { label: string; value: string; copyValue: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div>
      <span className={fieldLabel}>{label}</span>
      <div className="flex gap-2">
        <div className="flex h-9 flex-1 items-center rounded-md border border-border bg-muted/40 px-3 text-[12px] text-muted-foreground truncate">{value}</div>
        <button onClick={handleCopy} className={copied ? `${btnBase} bg-success-bg border border-success-border text-success` : btnGhost}>
          {copied ? <Check size={12} /> : <Clipboard size={12} />}{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
function Status({ text, warning = false }: { text: string; warning?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${warning ? 'bg-warning-bg text-warning border-warning-border' : 'bg-success-bg text-success border-success-border'}`}>
      {!warning && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {text}
    </span>
  );
}
function LeadStatusPill({ added }: { added: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border w-fit ${added ? 'bg-success-bg text-success border-success-border' : 'bg-muted text-muted-foreground border-border'}`}>
      {added && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {added ? 'Added' : 'Pending'}
    </span>
  );
}

// ─── Step 1: Connect & Configure ─────────────────────────────────────────────

function StepConnectConfigure({
  integrationName, setIntegrationName, connected, setConnected, selectedAdsAccount, setSelectedAdsAccount,
}: {
  integrationName: string; setIntegrationName: (value: string) => void;
  connected: boolean; setConnected: (value: boolean) => void;
  selectedAdsAccount: string; setSelectedAdsAccount: (value: string) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [campaign, setCampaign] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.campaign', 'Main Search Campaign');
  const [form, setForm] = useSetupState('google-ads', 'GoogleAdsIntegrationFlow.form', 'Course Enquiry Form');

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
      toast.success(connected ? 'Google Ads account reconnected.' : 'Google Ads account connected.');
    }, 900);
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={<GoogleLogo size={16} />} title="Create Integration & Connect Google Ads" subtitle="Name your integration, then connect the Google Ads account used for this lead form.">
        <div className="w-full">
          <Input label="Integration Name" value={integrationName} onChange={setIntegrationName} />
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0"><GoogleLogo size={16} /></div>
              {connected ? (
                <>
                  <span className="text-[12px] font-medium text-foreground">john.doe@gmail.com</span>
                  <Status text="Connected" />
                </>
              ) : (
                <Status text="Disconnected" warning />
              )}
            </div>
            <button onClick={handleConnect} disabled={connecting} className={connected ? btnGhost : btnPrimary}>
              {connecting ? <Loader2 size={13} className="animate-spin" /> : <GoogleLogo size={13} />}
              {connecting ? 'Connecting...' : connected ? 'Reconnect' : 'Connect Google Ads Account'}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">The account must have access to the selected Ads account and lead form.</p>
        </div>

        <div>
          <p className={fieldLabel}>Available Ads Accounts</p>
          <div className="space-y-1.5">
            {ADS_ACCOUNTS.map((name) => (
              <label key={name} className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-[12px] cursor-pointer ${selectedAdsAccount === name ? 'border-primary/40 bg-primary/5' : 'border-border'} ${!connected ? 'opacity-50 pointer-events-none' : ''}`}>
                <input
                  type="radio"
                  name="ads-account"
                  disabled={!connected}
                  checked={selectedAdsAccount === name}
                  onChange={() => setSelectedAdsAccount(name)}
                />
                <span className="flex-1 truncate">{name}</span>
                {selectedAdsAccount === name && <span className="text-success text-[10px] font-semibold">Selected</span>}
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<Info size={16} />} title="Select Google Ads Lead Form" subtitle="Choose the campaign and lead form extension that will send leads to your CRM.">
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Ads Account" value={selectedAdsAccount} options={[selectedAdsAccount]} />
          <Select label="Campaign" value={campaign} onChange={setCampaign} options={['Main Search Campaign', 'Brand Campaign', 'Remarketing Campaign']} />
          <Select label="Lead Form Extension" value={form} onChange={setForm} options={['Course Enquiry Form', 'Demo Request Form']} />
        </div>
      </SectionCard>

      <SectionCard icon={<ExternalLink size={16} />} title="Webhook Setup" subtitle="Link the CRM webhook directly to your selected Google Ads Lead Form Extension."><GoogleAdsWebhookSetup connected={connected} account={selectedAdsAccount} campaign={campaign} form={form} /></SectionCard>
    </div>
  );
}

// ─── Step 2: Field Mapping & Static Values ───────────────────────────────────

function StepFieldMapping({
  mappings, selectedFields, updateMapping, addMapping, resetMapping, removeMapping,
  staticFields, availableStaticFields, addStaticField, updateStaticField, removeStaticField,
}: {
  mappings: typeof INITIAL_MAPPINGS; selectedFields: string[];
  updateMapping: (index: number, value: string) => void; addMapping: () => void; resetMapping: () => void; removeMapping: (index: number) => void;
  staticFields: StaticField[]; availableStaticFields: string[];
  addStaticField: () => void; updateStaticField: (id: string, updates: Partial<StaticField>) => void; removeStaticField: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionCard
        icon={<RefreshCw size={16} />}
        title="Field Mapping"
        subtitle="Map Google form fields to CRM fields. Default mappings are applied automatically and can be edited."
        action={
          <div className="flex gap-2">
            <button onClick={resetMapping} className={btnGhost}><RotateCcw size={12} />Reset Mapping</button>
            <button onClick={addMapping} className={btnGhost}><Plus size={12} />Add Field Mapping</button>
          </div>
        }
      >
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Google Source Field</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Sample Value</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CRM Field</p>
            <span />
          </div>
          <div className="divide-y divide-border">
            {mappings.map((row, index) => (
              <div key={`${row.source}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-3 px-4 py-2.5 items-center group">
                <span className="text-[12px] font-semibold text-foreground truncate">{row.source}</span>
                <span className="text-[12px] text-muted-foreground truncate">{row.sample}</span>
                <select value={row.crm} onChange={(event) => updateMapping(index, event.target.value)} className={fieldInput}>
                  <option value="">Select CRM field</option>
                  {CRM_FIELDS.map((field) => (
                    <option key={field} value={field} disabled={field !== row.crm && selectedFields.includes(field)}>{field}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeMapping(index)}
                  disabled={index < INITIAL_MAPPINGS.length}
                  aria-label={`Remove ${row.source} mapping`}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all disabled:opacity-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Tag size={16} />}
        title="Static Field Mapping"
        subtitle="CRM attributes set to a fixed value on every lead captured from this integration."
        action={
          <button onClick={addStaticField} disabled={availableStaticFields.length === 0} className={btnGhost}>
            <Plus size={12} />Add Static Field
          </button>
        }
      >
        {staticFields.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No static fields yet. Add one to apply a fixed value, e.g. Lead Source = Google Ads.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_36px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Static Value</p>
              <span />
            </div>
            <div className="divide-y divide-border">
              {staticFields.map((sf) => (
                <div key={sf.id} className="grid grid-cols-[1fr_1fr_36px] gap-3 px-4 py-2.5 items-center group">
                  <select className={fieldInput} value={sf.field} onChange={(event) => updateStaticField(sf.id, { field: event.target.value })}>
                    {[sf.field, ...availableStaticFields].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input
                    type="text"
                    value={sf.value}
                    onChange={(event) => updateStaticField(sf.id, { value: event.target.value })}
                    placeholder="Enter fixed value"
                    className={fieldInput}
                  />
                  <button
                    onClick={() => removeStaticField(sf.id)}
                    aria-label={`Remove ${sf.field} static value`}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Step 3: Trigger, Authorization & Test ───────────────────────────────────

function StepTriggerAuthTest({
  authorized, setAuthorized, testLeads, setTestLeads,
}: {
  authorized: boolean; setAuthorized: (value: boolean) => void;
  testLeads: TestLead[]; setTestLeads: React.Dispatch<React.SetStateAction<TestLead[]>>;
}) {
  const [fetchingLead, setFetchingLead] = useState(false);

  const handleAuthorize = () => {
    setAuthorized(true);
    toast.success('Google account authorized for this integration.');
  };
  const fetchTestLead = () => {
    setFetchingLead(true);
    setTimeout(() => {
      const pick = TEST_LEAD_POOL[testLeads.length % TEST_LEAD_POOL.length];
      const lead: TestLead = {
        id: `gads-lead-${Date.now()}`,
        name: pick.name,
        email: pick.email,
        mobile: pick.mobile,
        receivedAt: new Date().toLocaleString(),
        addedToCrm: false,
      };
      setTestLeads((prev) => [lead, ...prev]);
      setFetchingLead(false);
      toast.success('Test lead fetched from your Google Ads lead form.');
    }, 1100);
  };
  const addLeadToCrm = (id: string) => {
    setTestLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, addedToCrm: true } : lead)));
    toast.success('Lead added to CRM.');
  };
  const deleteLead = (id: string) => {
    setTestLeads((prev) => prev.filter((lead) => lead.id !== id));
    toast('Test lead deleted.');
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={<ShieldCheck size={16} />} title="Google Authorization" subtitle="Grant permission to access your Google account and lead form data.">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
          <span className="flex items-center gap-2 text-[12px] font-medium text-foreground"><GoogleLogo size={14} />john.doe@gmail.com</span>
          <Status text="Connected" />
        </div>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li>• View and manage Google Ads lead forms</li>
          <li>• Read campaign and form responses</li>
          <li>• Access selected account metadata</li>
        </ul>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] text-muted-foreground">Authorization Status</span>
          <Status text={authorized ? 'Authorized' : 'Not Authorized'} warning={!authorized} />
        </div>
        <button onClick={handleAuthorize} disabled={authorized} className={btnPrimary}>
          <ShieldCheck size={13} />{authorized ? 'Authorized' : 'Authorize Google Account'}
        </button>
      </SectionCard>

      <SectionCard
        icon={<UserCheck size={16} />}
        title="Test Lead"
        subtitle="Fetch a sample lead from your Google Ads Lead Form, then add it to CRM or discard it."
        action={
          <button onClick={fetchTestLead} disabled={fetchingLead} className={btnPrimary}>
            {fetchingLead ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {fetchingLead ? 'Fetching...' : 'Fetch Test Lead'}
          </button>
        }
      >
        {testLeads.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No test leads fetched yet.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[1.2fr_1.4fr_1.2fr_1.3fr_110px_190px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Name</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Email</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Mobile</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Received At</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground text-right">Actions</span>
                </div>
                <div className="divide-y divide-border">
                  {testLeads.map((lead) => (
                    <div key={lead.id} className="grid grid-cols-[1.2fr_1.4fr_1.2fr_1.3fr_110px_190px] gap-3 px-4 py-2.5 items-center hover:bg-muted/20 transition-colors">
                      <span className="text-[12px] font-medium text-foreground truncate">{lead.name}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate"><Mail size={11} className="flex-shrink-0" />{lead.email}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate"><Phone size={11} className="flex-shrink-0" />{lead.mobile}</span>
                      <span className="text-[11px] text-muted-foreground font-mono truncate">{lead.receivedAt}</span>
                      <LeadStatusPill added={lead.addedToCrm} />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => addLeadToCrm(lead.id)}
                          disabled={lead.addedToCrm}
                          className="flex items-center gap-1 h-7 px-3 text-[10px] font-semibold rounded-md bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
                        >
                          <Plus size={11} />{lead.addedToCrm ? 'Added' : 'Add'}
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-semibold rounded-md bg-danger-bg text-danger hover:bg-danger-bg/70 transition-colors"
                        >
                          <Trash2 size={11} />Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
