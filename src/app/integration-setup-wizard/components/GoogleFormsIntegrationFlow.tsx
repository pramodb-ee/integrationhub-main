'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import ConnectorIcon from '@/components/ui/ConnectorIcon';
import WizardStepper from './WizardStepper';
import { addActivatedIntegration, removeActivatedIntegration } from '@/app/components/activatedIntegrationsStore';
import type { Integration } from '@/app/components/IntegrationTable';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  FileSpreadsheet,
  Info,
  Link2,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
  Zap,
} from 'lucide-react';

// ─── Google "G" logo — the standard multi-colour mark used on Sign in with Google buttons ──
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

const STEPS = ['Account, Spreadsheet & Mapping', 'Trigger, Authorization & Publish'];
const STEP_DESCRIPTIONS = ['Connect & map fields', 'Authorize & activate'];

const FIELDS = ['Email', 'First Name', 'Last Name', 'Mobile Number', 'Course', 'City'];
const SAMPLES: Record<string, string> = {
  Email: 'abc@gmail.com',
  'First Name': 'Rahul',
  'Last Name': 'Sharma',
  'Mobile Number': '9876543210',
  Course: 'BCA',
  City: 'Pune',
};
const REQUIRED_FIELDS = ['Email', 'First Name', 'Mobile Number'];

const LINKED_SHEETS = [
  { name: 'Student Admission Form', url: 'https://docs.google.com/spreadsheets/d/1AbCStudentAdm/edit' },
  { name: 'Demo Form Responses', url: 'https://docs.google.com/spreadsheets/d/1DefDemoResp/edit' },
  { name: 'Lead Generation Form', url: 'https://docs.google.com/spreadsheets/d/1GhiLeadGen/edit' },
];

const STATIC_FIELD_POOL = ['Lead Channel', 'Lead Source', 'Lead Campaign', 'Lead Medium'];

const TEST_LEAD_POOL = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', mobile: '+91 98765 43210' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', mobile: '+91 91234 56780' },
  { name: 'Karthik Rao', email: 'karthik.rao@gmail.com', mobile: '+91 99887 76655' },
  { name: 'Priya Menon', email: 'priya.menon@gmail.com', mobile: '+91 97170 88342' },
];

type FieldMapping = { id: string; source: string; crm: string };
type StaticField = { id: string; field: string; value: string };
type TestLead = { id: string; name: string; email: string; mobile: string; receivedAt: string; addedToCrm: boolean };

const initialMappings = (): FieldMapping[] => FIELDS.map((source) => ({ id: `map-${source}`, source, crm: source }));

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
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
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

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const classes =
    tone === 'success'
      ? 'bg-success-bg text-success border-success-border'
      : tone === 'warning'
        ? 'bg-warning-bg text-warning border-warning-border'
        : tone === 'danger'
          ? 'bg-danger-bg text-danger border-danger-border'
          : 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${classes}`}>
      {tone === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const btnBase = 'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnGhost = `${btnBase} bg-card border border-border text-foreground hover:bg-muted`;
const btnPrimary = `${btnBase} bg-primary text-white hover:bg-primary/90`;
const fieldInput = 'w-full h-9 px-3 text-[12px] bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

export default function GoogleFormsIntegrationFlow() {
  const [step, setStep] = useState(0);

  const [integrationName, setIntegrationName] = useSetupState(
    'google-forms',
    'GoogleFormsIntegrationFlow.integrationName',
    '',
  );

  // Connect Google Account
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useSetupState('google-forms', 'GoogleFormsIntegrationFlow.connected', false);
  const googleAccountEmail = 'admissions.team@gmail.com';

  // Select Spreadsheet
  const [sheetLinkInput, setSheetLinkInput] = useSetupState('google-forms', 'GoogleFormsIntegrationFlow.sheetLinkInput', '');
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useSetupState<{ name: string; url: string } | null>('google-forms', 'GoogleFormsIntegrationFlow.sheet', null);

  // Field Mapping
  const [mappings, setMappings] = useSetupState<FieldMapping[]>('google-forms', 'GoogleFormsIntegrationFlow.mappings', initialMappings);

  // Static Field Mapping
  const [staticFields, setStaticFields] = useSetupState<StaticField[]>('google-forms', 'GoogleFormsIntegrationFlow.staticFields', []);

  // Trigger & Authorization
  const [configuringTrigger, setConfiguringTrigger] = useState(false);
  const [trigger, setTrigger] = useSetupState('google-forms', 'GoogleFormsIntegrationFlow.trigger', false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorized, setAuthorized] = useSetupState('google-forms', 'GoogleFormsIntegrationFlow.authorized', false);

  // Test Lead
  const [fetchingLead, setFetchingLead] = useState(false);
  const [testLeads, setTestLeads] = useState<TestLead[]>([]);

  const [activated, setActivated] = useState(false);
  const [activatedId, setActivatedId] = useState<string | null>(null);

  const usedCrmFields = useMemo(() => new Set(mappings.map((m) => m.crm).filter(Boolean)), [mappings]);
  const mappingValid =
    REQUIRED_FIELDS.every((field) => mappings.some((row) => row.crm === field)) &&
    mappings.every((row) => row.source && row.crm) &&
    new Set(mappings.map((row) => row.crm)).size === mappings.length;

  const availableStaticFields = STATIC_FIELD_POOL.filter((field) => !staticFields.some((sf) => sf.field === field));

  const canProceedStep0 = !!integrationName.trim() && connected && !!sheet && mappingValid;
  const canActivate = trigger && authorized && testLeads.some((lead) => lead.addedToCrm);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      toast.success('Google account connected.');
    }, 900);
  };

  const linkSheet = (name: string, url: string) => {
    setSheet({ name, url });
    setMappings(initialMappings());
    setSheetLinkInput('');
    toast.success(`Spreadsheet linked: ${name}`);
  };

  const handleLinkByUrl = () => {
    const value = sheetLinkInput.trim();
    if (!value) return;
    if (!value.includes('docs.google.com/spreadsheets')) {
      toast.error('Enter a valid Google Sheets link (docs.google.com/spreadsheets/...).');
      return;
    }
    const idFragment = value.split('/d/')[1]?.split('/')[0]?.slice(0, 6) || 'Sheet';
    linkSheet(`Linked Spreadsheet (${idFragment})`, value);
  };

  const filteredSheets = LINKED_SHEETS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const updateMapping = (id: string, crm: string) => {
    setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, crm } : m)));
  };
  const addMappingRow = () => {
    const source = FIELDS.find((f) => !mappings.some((m) => m.source === f)) || '';
    setMappings((prev) => [...prev, { id: `map-manual-${Date.now()}`, source, crm: '' }]);
  };
  const removeMapping = (id: string) => setMappings((prev) => prev.filter((m) => m.id !== id));
  const resetMapping = () => setMappings(initialMappings());

  const addStaticField = () => {
    const field = availableStaticFields[0];
    if (!field) return;
    setStaticFields((prev) => [...prev, { id: `sf-${Date.now()}`, field, value: '' }]);
  };
  const updateStaticField = (id: string, updates: Partial<StaticField>) => {
    setStaticFields((prev) => prev.map((sf) => (sf.id === id ? { ...sf, ...updates } : sf)));
  };
  const removeStaticField = (id: string) => setStaticFields((prev) => prev.filter((sf) => sf.id !== id));

  const configureTrigger = () => {
    setConfiguringTrigger(true);
    setTimeout(() => {
      setConfiguringTrigger(false);
      setTrigger(true);
      toast.success('On Form Submit trigger configured successfully.');
    }, 900);
  };

  const authorize = () => {
    setAuthorizing(true);
    setTimeout(() => {
      setAuthorizing(false);
      setAuthorized(true);
      toast.success('Google account authorized for this integration.');
    }, 900);
  };

  const fetchTestLead = () => {
    setFetchingLead(true);
    setTimeout(() => {
      const pick = TEST_LEAD_POOL[testLeads.length % TEST_LEAD_POOL.length];
      const lead: TestLead = {
        id: `gform-lead-${Date.now()}`,
        name: pick.name,
        email: pick.email,
        mobile: pick.mobile,
        receivedAt: new Date().toLocaleString(),
        addedToCrm: false,
      };
      setTestLeads((prev) => [lead, ...prev]);
      setFetchingLead(false);
      toast.success('Test lead fetched from your Google Form response sheet.');
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

  const activate = () => {
    const row: Integration = {
      id: `int-gform-${Date.now()}`,
      name: integrationName.trim(),
      type: 'google-forms',
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
    setActivatedId(row.id);
    toast.success('Google Form integration activated.');
  };

  const deactivate = () => {
    if (activatedId) removeActivatedIntegration(activatedId);
    setActivated(false);
    setActivatedId(null);
    toast('Google Form integration deactivated.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ConnectorIcon type="google-forms" size={36} />
          <div>
            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">Google Form Integration</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step {step + 1} of 2 — {STEPS[step]}</p>
          </div>
        </div>
        <Link href="/">
          <button className={btnGhost}>
            <ChevronLeft size={13} />Back to Integration Center
          </button>
        </Link>
      </div>

      {/* Demo mode notice */}
      <div className="flex items-center gap-2.5 rounded-lg border border-info-border bg-info-bg px-4 py-3 text-[12px] text-info">
        <Info size={15} className="flex-shrink-0" />
        Demo mode — sample Google account, spreadsheets and CRM leads. Live OAuth and CRM services are not connected.
      </div>

      {/* Step indicator */}
      <WizardStepper currentStep={step} labels={STEPS} descriptions={STEP_DESCRIPTIONS} />

      {activated && (
        <div className="flex items-center gap-3 rounded-lg border border-success-border bg-success-bg px-4 py-3.5">
          <CheckCircle2 size={20} className="text-success flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-success">Integration Activated</p>
            <p className="text-[11px] text-success/80 mt-0.5">This Google Form integration is now live and syncing leads to CRM (demo).</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={btnGhost} onClick={deactivate}>Deactivate Integration</button>
            <Link href="/">
              <button className={btnGhost}>Back to Integration Center</button>
            </Link>
          </div>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-foreground">
              Integration Name <span className="text-danger">*</span>
            </span>
            <span className="mb-2 block text-[11px] text-muted-foreground">
              A descriptive name to identify this integration in the center
            </span>
            <input
              type="text"
              value={integrationName}
              onChange={(event) => setIntegrationName(event.target.value)}
              placeholder="e.g. Google Forms Integration"
              aria-required="true"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {/* Connect Google Account */}
          <SectionCard
            icon={<GoogleLogo size={18} />}
            title="Connect Google Account"
            subtitle="Connect the Google account used for this integration."
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0">
                  <GoogleLogo size={18} />
                </div>
                {connected ? (
                  <>
                    <span className="text-[13px] font-medium text-foreground">{googleAccountEmail}</span>
                    <Pill tone="success">Connected</Pill>
                  </>
                ) : (
                  <Pill tone="warning">Disconnected</Pill>
                )}
              </div>
              <button className={connected ? btnGhost : btnPrimary} onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 size={13} className="animate-spin" /> : <GoogleLogo size={13} />}
                {connecting ? 'Connecting...' : connected ? 'Reconnect' : 'Connect Google Account'}
              </button>
            </div>
            <p className="flex items-start gap-2 rounded-lg bg-info-bg px-3 py-2.5 text-[11px] text-info">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              The account must have sufficient access to the Form and linked Spreadsheet.
            </p>
          </SectionCard>

          {/* Select Spreadsheet */}
          <SectionCard
            icon={<FileSpreadsheet size={16} />}
            title="Select Spreadsheet"
            subtitle="Paste a spreadsheet link, or choose one already linked to your Google Forms. Columns and sample data are detected automatically."
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={sheetLinkInput}
                  onChange={(e) => setSheetLinkInput(e.target.value)}
                  disabled={!connected}
                  placeholder="Paste Google Sheets link — https://docs.google.com/spreadsheets/d/..."
                  className={`${fieldInput} pl-9`}
                />
              </div>
              <button className={btnPrimary} disabled={!connected || !sheetLinkInput.trim()} onClick={handleLinkByUrl}>
                <Link2 size={13} />Link
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">or choose a linked sheet</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    aria-label="Search spreadsheet"
                    placeholder="Search spreadsheet..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={!connected}
                    className={`${fieldInput} pl-9`}
                  />
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {filteredSheets.map((s) => (
                    <label
                      key={s.name}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[12px] transition-colors ${
                        sheet?.name === s.name ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/40'
                      } ${!connected ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <input
                        type="radio"
                        name="spreadsheet"
                        disabled={!connected}
                        checked={sheet?.name === s.name}
                        onChange={() => linkSheet(s.name, s.url)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.url}</p>
                      </div>
                      <FileSpreadsheet size={14} className="text-success flex-shrink-0" />
                    </label>
                  ))}
                  {filteredSheets.length === 0 && <p className="p-4 text-[12px] text-muted-foreground">No spreadsheets match your search.</p>}
                </div>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <h3 className="mb-2 text-[11px] font-semibold text-foreground uppercase tracking-wide">Detected Columns &amp; Sample Data</h3>
                {!sheet ? (
                  <p className="text-[11px] text-muted-foreground">Connect your account and link a spreadsheet.</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 font-semibold text-muted-foreground">Header</th>
                          <th className="p-2 font-semibold text-muted-foreground">Sample</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="p-2 text-foreground">Timestamp</td>
                          <td className="p-2 text-muted-foreground font-mono">06/09/2026 15:20</td>
                        </tr>
                        {FIELDS.map((field) => (
                          <tr key={field}>
                            <td className="p-2 text-foreground">{field}</td>
                            <td className="p-2 text-muted-foreground font-mono">{SAMPLES[field]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Field Mapping */}
          <SectionCard
            icon={<Sparkles size={16} />}
            title="Field Mapping"
            subtitle="Auto-detected fields, mapped to your CRM. Email, First Name and Mobile Number are required."
            action={
              <div className="flex gap-2">
                <button className={btnGhost} onClick={resetMapping} disabled={!sheet}>
                  <RotateCcw size={12} />Reset Mapping
                </button>
                <button className={btnGhost} onClick={addMappingRow} disabled={!sheet || mappings.length >= FIELDS.length}>
                  <Plus size={12} />Add Field Mapping
                </button>
              </div>
            }
          >
            {!sheet ? (
              <p className="text-[12px] text-muted-foreground">Link a spreadsheet to detect fields for mapping.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Source Field</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Sample</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CRM Field</p>
                  <span />
                </div>
                <div className="divide-y divide-border">
                  {mappings.map((row) => (
                    <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-3 px-4 py-2.5 items-center group">
                      <span className="text-[12px] text-foreground truncate">{row.source || '—'}</span>
                      <span className="text-[12px] text-muted-foreground font-mono truncate">{row.source ? SAMPLES[row.source] : '—'}</span>
                      <select
                        aria-label={`CRM field for ${row.source}`}
                        className={fieldInput}
                        value={row.crm}
                        onChange={(e) => updateMapping(row.id, e.target.value)}
                      >
                        <option value="">Select CRM field</option>
                        {FIELDS.map((f) => (
                          <option key={f} value={f} disabled={usedCrmFields.has(f) && row.crm !== f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeMapping(row.id)}
                        aria-label={`Remove ${row.source} mapping`}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sheet && !mappingValid && (
              <p className="text-[11px] text-warning">Map Email, First Name and Mobile Number to a unique CRM field to continue.</p>
            )}
          </SectionCard>

          {/* Static Field Mapping */}
          <SectionCard
            icon={<Tag size={16} />}
            title="Static Field Mapping"
            subtitle="CRM attributes set to a fixed value on every lead captured from this form."
            action={
              <button className={btnGhost} onClick={addStaticField} disabled={!sheet || availableStaticFields.length === 0}>
                <Plus size={12} />Add Static Field
              </button>
            }
          >
            {staticFields.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No static fields yet. Add one to apply a fixed value, e.g. Lead Source = Google Form.</p>
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
                      <select
                        className={fieldInput}
                        value={sf.field}
                        onChange={(e) => updateStaticField(sf.id, { field: e.target.value })}
                      >
                        {[sf.field, ...availableStaticFields].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={sf.value}
                        onChange={(e) => updateStaticField(sf.id, { value: e.target.value })}
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
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard icon={<Zap size={16} />} title="Configure Trigger" subtitle="Fires the sync whenever a new form response arrives.">
              <div className="space-y-2.5 text-[12px]">
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Event Source</span>
                  <span className="font-medium text-foreground">Google Spreadsheet</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Event Type</span>
                  <span className="font-medium text-foreground">On Form Submit</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-muted-foreground">Action</span>
                  <span className="font-medium text-foreground">Create Lead in CRM</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[12px] text-muted-foreground">Trigger Status</span>
                <Pill tone={trigger ? 'success' : 'warning'}>{trigger ? 'Configured' : 'Not Configured'}</Pill>
              </div>
              <button className={btnPrimary} onClick={configureTrigger} disabled={configuringTrigger}>
                {configuringTrigger ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {trigger ? 'Reconfigure Trigger' : 'Configure Trigger'}
              </button>
            </SectionCard>

            <SectionCard icon={<ShieldCheck size={16} />} title="Google Authorization" subtitle="Grant permission to read Form/Sheet data and create CRM leads.">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                <span className="text-[12px] font-medium text-foreground">{googleAccountEmail}</span>
                <Pill tone={connected ? 'success' : 'danger'}>{connected ? 'Connected' : 'Disconnected'}</Pill>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[12px] text-muted-foreground">Authorization Status</span>
                <Pill tone={authorized ? 'success' : 'warning'}>{authorized ? 'Authorized' : 'Not Authorized'}</Pill>
              </div>
              <button className={btnPrimary} onClick={authorize} disabled={authorizing || authorized}>
                {authorizing ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                {authorized ? 'Authorized' : authorizing ? 'Authorizing...' : 'Authorize Google Account'}
              </button>
            </SectionCard>
          </div>

          <SectionCard
            icon={<UserCheck size={16} />}
            title="Test Lead"
            subtitle="Fetch a sample lead from your Google Form responses, then add it to CRM or discard it."
            action={
              <button className={btnPrimary} onClick={fetchTestLead} disabled={fetchingLead || !trigger || !authorized}>
                {fetchingLead ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {fetchingLead ? 'Fetching...' : 'Fetch Test Lead'}
              </button>
            }
          >
            {(!trigger || !authorized) && (
              <p className="text-[11px] text-warning">Configure the trigger and authorize your Google account before fetching a test lead.</p>
            )}
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
                          <Pill tone={lead.addedToCrm ? 'success' : 'neutral'}>{lead.addedToCrm ? 'Added' : 'Pending'}</Pill>
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
      )}

      {/* Footer nav */}
      {!activated && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button className={btnGhost} disabled={step === 0} onClick={() => setStep(0)}>
            <ChevronLeft size={13} />Back
          </button>
          {step === 0 ? (
            <button className={btnPrimary} disabled={!canProceedStep0} onClick={() => setStep(1)}>
              Next: {STEPS[1]}<ArrowRight size={13} />
            </button>
          ) : (
            <button className={btnPrimary} disabled={!canActivate} onClick={activate}>
              <CheckCircle2 size={14} />Activate Integration
            </button>
          )}
        </div>
      )}
    </div>
  );
}
