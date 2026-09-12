'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import CollapsibleCard from './JustDialCollapsibleCard';
import JustDialRequestPanel from './JustDialRequestPanel';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronUp, Code2,
  Copy, GitBranch, Hash, Info, Loader2, Mail, Phone, Plus, RefreshCw, RotateCcw, Tag, Terminal,
  Trash2, UserCheck, Wand2, XCircle,
} from 'lucide-react';
import { addActivatedIntegration, removeActivatedIntegration } from '@/app/components/activatedIntegrationsStore';
import type { Integration } from '@/app/components/IntegrationTable';
import ConnectorIcon from '@/components/ui/ConnectorIcon';
import { CRM_DESTINATION_FIELDS, FIELD_TYPE_FORMATS, CRMFieldType } from '@/app/erp-integration-wizard/components/erpRegistry';

// ─── JustDial source fields & sample CURL (equivalent of an ERP's registry entry) ──────────

const JUSTDIAL_SOURCE_FIELDS = [
  'name', 'mobile', 'email', 'city', 'area', 'pincode', 'company_name',
  'category', 'enquiry_id', 'enquiry_date', 'source_id', 'created_at',
];

const JUSTDIAL_DEFAULT_CURL = `curl -X GET "https://api.justdial.com/v2/leads?client_id=JD-48213" \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: application/json"`;

const TEST_LEAD_POOL = [
  { name: 'Sunita Deshmukh', email: 'sunita.deshmukh@gmail.com', mobile: '+91 90210 45678' },
  { name: 'Vikram Nair', email: 'vikram.nair@gmail.com', mobile: '+91 98600 11223' },
  { name: 'Priya Menon', email: 'priya.menon@gmail.com', mobile: '+91 97654 32109' },
];

// ─── Types (mirrors ERPConfigMapStep) ──────────────────────────────────────────

type MappingStatus = 'Auto' | 'Manual' | 'Needs Review' | 'Unmapped';

interface FieldMapping {
  id: string;
  sourceField: string;
  destinationField: string;
  dataType: string;
  status: MappingStatus;
}

interface StaticField {
  id: string;
  sourceField: string;
  dataType: string;
  value: string;
}

interface FormatMapping {
  id: string;
  crmField: string;
  detectedType: string;
  selectedFormat: string;
}

interface ParsedRequest {
  method: string;
  url: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}

type TestLead = { id: string; name: string; email: string; mobile: string; receivedAt: string; addedToCrm: boolean };

const getCRMFieldType = (fieldKey: string): string =>
  CRM_DESTINATION_FIELDS.find((field) => field.key === fieldKey)?.type || 'Type unavailable';

const DATE_FIELD_TYPES: CRMFieldType[] = ['Date', 'DateTime'];

const getFormatOptions = (fieldKey: string): string[] => {
  const type = getCRMFieldType(fieldKey);
  return DATE_FIELD_TYPES.includes(type as CRMFieldType) ? FIELD_TYPE_FORMATS[type] || [] : [];
};

// ─── Helpers (mirrors ERPConfigMapStep) ────────────────────────────────────────

function parseCurl(curl: string): ParsedRequest | null {
  try {
    const methodMatch = curl.match(/-X\s+([A-Z]+)/);
    const method = methodMatch ? methodMatch[1] : 'GET';

    const urlMatch = curl.match(/"(https?:\/\/[^"]+)"/);
    if (!urlMatch) return null;
    const fullUrl = urlMatch[1];

    let url = fullUrl;
    const queryParams: Record<string, string> = {};
    if (fullUrl.includes('?')) {
      const [base, qs] = fullUrl.split('?');
      url = base;
      qs.split('&').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    const headers: Record<string, string> = {};
    const headerMatches = curl.matchAll(/-H\s+"([^:]+):\s*([^"]+)"/g);
    for (const m of headerMatches) {
      headers[m[1].trim()] = m[2].trim();
    }

    const bodyMatch = curl.match(/-d\s+'([^']+)'/);
    const body = bodyMatch ? bodyMatch[1] : '';

    return { method, url, queryParams, headers, body };
  } catch {
    return null;
  }
}

function autoMapFields(sourceFields: string[], destFields: typeof CRM_DESTINATION_FIELDS): FieldMapping[] {
  const normalize = (s: string) => s.toLowerCase().replace(/[_\-\s.]/g, '');
  const mappings: FieldMapping[] = [];

  const destMap = new Map(destFields.map((d) => [normalize(d.key), d.key]));
  const destLabelMap = new Map(destFields.map((d) => [normalize(d.label), d.key]));

  for (const src of sourceFields) {
    const normSrc = normalize(src);
    let destKey = destMap.get(normSrc) || destLabelMap.get(normSrc);
    let status: MappingStatus = 'Unmapped';

    if (!destKey) {
      const aliases: Record<string, string> = {
        leadid: 'notes', enquiryid: 'notes', date: 'created_at',
        email: 'email', emailaddress: 'email', emailaddress1: 'email', mail: 'email',
        phone: 'phone', telephone: 'phone', telephone1: 'phone',
        mobile: 'mobile', mobilephone: 'mobile', cellphone: 'mobile',
        firstname: 'lead_name', first_name: 'lead_name', name: 'lead_name', fullname: 'lead_name',
        company: 'company_name', companyname: 'company_name', accountname: 'company_name', partner_name: 'company_name',
        city: 'city', state: 'state', region: 'state',
        source: 'source', leadsource: 'source', leadsourcecode: 'source', source_id: 'source',
        status: 'status', statecode: 'status', lead_status: 'status',
        createdat: 'created_at', createdon: 'created_at', create_date: 'created_at', datecreated: 'created_at',
        campaign: 'campaign_name', campaign_id: 'campaign_name', campaignname: 'campaign_name',
        owner: 'assigned_to', ownerid: 'assigned_to', assignedto: 'assigned_to', user_id: 'assigned_to',
        pincode: 'pincode', postalcode: 'pincode', zip: 'pincode',
      };
      destKey = aliases[normSrc];
      if (destKey) status = 'Auto';

    } else {
      status = 'Auto';
    }

    if (destKey && (!destFields.some((field) => field.key === destKey) || mappings.some((row) => row.destinationField === destKey))) { destKey = undefined; status = 'Unmapped'; }
    mappings.push({
      id: `map-${src}`,
      sourceField: src,
      destinationField: destKey || '',
      dataType: getCRMFieldType(destKey || ''),
      status: destKey ? status : 'Unmapped',
    });
  }

  return mappings;
}

const STATUS_STYLES: Record<MappingStatus, string> = {
  Auto: 'bg-green-50 text-green-700 border-green-200',
  Manual: 'bg-blue-50 text-blue-700 border-blue-200',
  'Needs Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Unmapped: 'bg-gray-100 text-gray-500 border-gray-200',
};

const DATA_TYPE_STYLES: Record<string, string> = {
  String: 'bg-slate-100 text-slate-700 border-slate-200',
  Number: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Boolean: 'bg-teal-50 text-teal-700 border-teal-200',
  Date: 'bg-amber-50 text-amber-700 border-amber-200',
  DateTime: 'bg-orange-50 text-orange-700 border-orange-200',
  Email: 'bg-sky-50 text-sky-700 border-sky-200',
  Mobile: 'bg-pink-50 text-pink-700 border-pink-200',
  Picklist: 'bg-violet-50 text-violet-700 border-violet-200',
  'Multi-select': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
};

function DataTypeBadge({ type }: { type: string }) {
  const classes = DATA_TYPE_STYLES[type] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex w-fit items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${classes}`}>
      {type || '—'}
    </span>
  );
}

// ─── Collapsible Card (mirrors ERPConfigMapStep) ───────────────────────────────


const btnBase = 'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnGhost = `${btnBase} bg-card border border-border text-foreground hover:bg-muted`;
const btnPrimary = `${btnBase} bg-primary text-white hover:bg-primary/90`;
const btnDanger = `${btnBase} bg-danger-bg border border-danger-border text-danger hover:bg-danger-bg/70`;
const fieldInput = 'w-full h-9 px-3 text-[12px] bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

function SectionCard({
  icon, title, subtitle, action, children,
}: {
  icon: React.ReactNode;
  title: string;
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

function LeadStatusPill({ added }: { added: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border w-fit ${added ? 'bg-success-bg text-success border-success-border' : 'bg-muted text-muted-foreground border-border'}`}>
      {added && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {added ? 'Added' : 'Pending'}
    </span>
  );
}

export default function JustDialIntegrationFlow() {
  const [integrationName, setIntegrationName] = useSetupState('justdial', 'JustDialIntegrationFlow.integrationName', 'JustDial Business Listing - Leads');

  // Card 1: API Request (CURL)
  const [curl, setCurl] = useState(JUSTDIAL_DEFAULT_CURL);
  const [curlValidating, setCurlValidating] = useState(false);
  const [curlValid, setCurlValid] = useState<boolean | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);

  // Card 2: Parsed Request
  const [parsed, setParsed] = useSetupState<ParsedRequest | null>('justdial', 'JustDialIntegrationFlow.parsed', null);

  // Card 3: Field Mapping
  const [mappings, setMappings] = useSetupState<FieldMapping[]>('justdial', 'JustDialIntegrationFlow.mappings', []);
  const [statusFilter, setStatusFilter] = useState<'All' | MappingStatus>('All');
  const mappingFieldRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const [focusedMappingId, setFocusedMappingId] = useState<string | null>(null);

  // Card 4: Static Fields
  const [staticFields, setStaticFields] = useSetupState<StaticField[]>('justdial', 'JustDialIntegrationFlow.staticFields', []);
  const staticFieldRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const [focusedStaticFieldId, setFocusedStaticFieldId] = useState<string | null>(null);

  // Card 5: Fields Format Mapping
  const [formatMappings, setFormatMappings] = useState<FormatMapping[]>([]);

  // Test Lead
  const [fetchingLead, setFetchingLead] = useState(false);
  const [testLeads, setTestLeads] = useState<TestLead[]>([]);

  const [savedMapping, setSavedMapping] = useSetupState('justdial', 'JustDialIntegrationFlow.savedMapping', '');
  const [testedMapping, setTestedMapping] = useState('');
  const currentConfig = JSON.stringify({ parsed, mappings, staticFields });
  const latestConfig = useRef(currentConfig);
  latestConfig.current = currentConfig;
  const mappingComplete = curlValid === true && mappings.length > 0 && mappings.every((m) => m.sourceField && m.destinationField) && new Set(mappings.map((m) => m.destinationField)).size === mappings.length;
  const mappingSaved = mappingComplete && savedMapping === currentConfig;
  const [activated, setActivated] = useState(false);
  const [activatedId, setActivatedId] = useState<string | null>(null);

  // ── CURL Actions ──────────────────────────────────────────────────────────

  const handleValidateCurl = () => {
    setCurlValidating(true);
    setCurlValid(null);
    setTimeout(() => {
      const isValid = curl.trim().startsWith('curl') && curl.includes('http');
      setCurlValid(isValid);
      setCurlValidating(false);
      if (isValid) {
        const p = parseCurl(curl);
        setParsed(p);
        handleAutoMap();
        toast.success('CURL command validated successfully.');
      } else {
        toast.error('CURL command is invalid. Check the URL and try again.');
      }
    }, 1200);
  };

  const handleRebuildCurl = () => {
    if (!parsed) return;
    const headers = Object.entries(parsed.headers).map(([k, v]) => `  -H "${k}: ${v}"`).join(' \\\n');
    const qs = Object.keys(parsed.queryParams).length
      ? '?' + Object.entries(parsed.queryParams).map(([k, v]) => `${k}=${v}`).join('&')
      : '';
    const rebuilt = `curl -X ${parsed.method} "${parsed.url}${qs}" \\\n${headers}${parsed.body ? ` \\\n  -d '${parsed.body}'` : ''}`;
    setCurl(rebuilt);
  };

  const handleCopyCurl = () => {
    navigator.clipboard?.writeText(curl).catch(() => {});
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  // ── Field Mapping Actions ─────────────────────────────────────────────────

  const usedSourceFields = useMemo(
    () => new Set([...mappings.map((m) => m.sourceField), ...staticFields.map((sf) => sf.sourceField)].filter(Boolean)),
    [mappings, staticFields],
  );

  const sourceFieldOptionsFor = (currentValue: string) => {
    const options = (parsed && 'fields' in parsed ? Object.keys(parsed.fields as Record<string, unknown>) : JUSTDIAL_SOURCE_FIELDS).filter((f) => f === currentValue || !usedSourceFields.has(f));
    return currentValue && !options.includes(currentValue) ? [currentValue, ...options] : options;
  };

  const detectDataType = (field: string): string => {
    if (!field) return '';
    const suggestion = autoMapFields([field], CRM_DESTINATION_FIELDS)[0];
    return suggestion?.destinationField ? getCRMFieldType(suggestion.destinationField) : 'String';
  };

  const handleAutoMap = () => {
    const result = autoMapFields(parsed && 'fields' in parsed ? Object.keys(parsed.fields as Record<string, unknown>) : JUSTDIAL_SOURCE_FIELDS, CRM_DESTINATION_FIELDS);
    setMappings(result.filter((row) => row.status === 'Auto'));
    setFocusedMappingId(null);
  };

  const handleResetMapping = () => {
    setMappings([]);
    setFocusedMappingId(null);
  };

  const handleAddMappingRow = () => {
    const newMapping: FieldMapping = { id: `map-manual-${Date.now()}`, sourceField: '', destinationField: '', dataType: '', status: 'Manual' };
    setStatusFilter('All');
    setFocusedMappingId(newMapping.id);
    setMappings((prev) => [...prev, newMapping]);
  };

  useEffect(() => {
    if (focusedMappingId) mappingFieldRefs.current[focusedMappingId]?.focus();
  }, [focusedMappingId, mappings]);

  const updateMapping = (id: string, updates: Partial<FieldMapping>) => {
    setMappings((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const updated = { ...m, ...updates, status: updates.status || 'Manual' };
      if (updates.destinationField !== undefined) updated.dataType = getCRMFieldType(updated.destinationField);
      return updated;
    }));
  };

  const removeMapping = (id: string) => setMappings((prev) => prev.filter((m) => m.id !== id));

  // ── Static Fields ─────────────────────────────────────────────────────────

  const handleAddStaticFieldRow = () => {
    const newField: StaticField = { id: `sf-${Date.now()}`, sourceField: '', dataType: '', value: '' };
    setFocusedStaticFieldId(newField.id);
    setStaticFields((prev) => [...prev, newField]);
  };

  const updateStaticField = (id: string, updates: Partial<StaticField>) => {
    setStaticFields((prev) => prev.map((sf) => {
      if (sf.id !== id) return sf;
      const updated = { ...sf, ...updates };
      if (updates.sourceField !== undefined) updated.dataType = detectDataType(updated.sourceField);
      return updated;
    }));
  };

  const removeStaticField = (id: string) => setStaticFields((prev) => prev.filter((sf) => sf.id !== id));

  useEffect(() => {
    if (focusedStaticFieldId) staticFieldRefs.current[focusedStaticFieldId]?.focus();
  }, [focusedStaticFieldId, staticFields]);

  const visibleMappings = mappings.filter((mapping) => statusFilter === 'All' || mapping.status === statusFilter);
  const validationMessage = (mapping: FieldMapping) => {
    if (!mapping.destinationField) return 'CRM field is required';
    if (mapping.status === 'Needs Review') return `${mapping.sourceField} needs review`;
    if (mapping.destinationField === 'email' && !mapping.sourceField.toLowerCase().includes('mail')) return 'Email is not valid';
    if (mapping.destinationField === 'mobile' && !mapping.sourceField.toLowerCase().includes('mobile')) return 'Mobile Number is wrong';
    return '';
  };

  // ── Format Mapping ────────────────────────────────────────────────────────

  const handleAddFormatMapping = () => {
    setFormatMappings((prev) => [...prev, { id: `fm-${Date.now()}`, crmField: '', detectedType: '', selectedFormat: '' }]);
  };

  const updateFormatMapping = (id: string, updates: Partial<FormatMapping>) => {
    setFormatMappings((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      if (updates.crmField) {
        updated.detectedType = getCRMFieldType(updates.crmField);
        updated.selectedFormat = '';
      }
      return updated;
    }));
  };

  const formatFields = CRM_DESTINATION_FIELDS.filter((field) => DATE_FIELD_TYPES.includes(field.type));

  const autoCount = mappings.filter((m) => m.status === 'Auto').length;
  const reviewCount = mappings.filter((m) => m.status === 'Needs Review').length;
  const unmappedCount = mappings.filter((m) => m.status === 'Unmapped').length;

  // ── Test Lead ──────────────────────────────────────────────────────────────

  const fetchTestLead = () => {
    if (!mappingSaved || fetchingLead) return;
    const snapshot = currentConfig;
    setFetchingLead(true);
    setTimeout(() => {
      if (latestConfig.current !== snapshot) { setFetchingLead(false); return; }
      setTestedMapping(snapshot);
      const pick = TEST_LEAD_POOL[testLeads.length % TEST_LEAD_POOL.length];
      const lead: TestLead = {
        id: `jd-lead-${Date.now()}`,
        name: pick.name,
        email: pick.email,
        mobile: pick.mobile,
        receivedAt: new Date().toLocaleString(),
        addedToCrm: false,
      };
      setTestLeads((prev) => [lead, ...prev]);
      setFetchingLead(false);
      toast.success('Test lead fetched using your CURL request.');
    }, 1000);
  };
  const addLeadToCrm = (id: string) => {
    setTestLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, addedToCrm: true } : lead)));
    toast.success('Lead added to CRM.');
  };
  const deleteLead = (id: string) => {
    setTestLeads((prev) => prev.filter((lead) => lead.id !== id));
    toast('Test lead deleted.');
  };

  // ── Activate / Deactivate ────────────────────────────────────────────────

  const canActivate = mappingSaved && testedMapping === currentConfig && testLeads.length > 0;

  const activate = () => {
    if (!canActivate) return;
    const id = `int-justdial-${Date.now()}`;
    const row: Integration = {
      id,
      name: integrationName.trim() || 'JustDial Business Listing - Leads',
      type: 'justdial',
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
    setActivatedId(id);
    setActivated(true);
    toast.success('JustDial integration activated.');
  };

  const deactivate = () => {
    if (activatedId) removeActivatedIntegration(activatedId);
    setActivatedId(null);
    setActivated(false);
    toast('JustDial integration deactivated.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ConnectorIcon type="justdial" size={36} />
          <div>
            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">JustDial Integration</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step 1 of 1 — Configure &amp; Map</p>
          </div>
        </div>
        <Link href="/">
          <button className={btnGhost}><ChevronLeft size={13} />Back to Integration Center</button>
        </Link>
      </div>

      {activated && (
        <div className="flex items-center gap-3 rounded-lg border border-success-border bg-success-bg px-4 py-3.5">
          <CheckCircle2 size={20} className="text-success flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-success">Integration Activated</p>
            <p className="text-[11px] text-success/80 mt-0.5">This JustDial integration is now live and syncing leads to CRM (demo).</p>
          </div>
          <Link href="/">
            <button className={btnGhost}>Back to Integration Center</button>
          </Link>
        </div>
      )}



      {/* ── Configure & Map ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-[16px] font-bold text-foreground mb-1">Configure &amp; Map</h2>
        <p className="text-[12px] text-muted-foreground mb-3">Configure your API request and map JustDial fields to CRM fields. Expand each section to configure.</p>

        <div className="space-y-3">
          {/* Card 1: API Request */}
          <JustDialRequestPanel integrationName={integrationName} onNameChange={setIntegrationName} onParsed={(request) => { setParsed(request); setCurlValid(!!request); setMappings(request ? autoMapFields(Object.keys(request.fields), CRM_DESTINATION_FIELDS).filter((row) => row.status === 'Auto') : []); }} />

          {/* Card 2: Parsed Request */}


          {/* Card 3: Field Mapping */}
          <CollapsibleCard defaultOpen
            title="Field Mapping"
            subtitle="Map source JustDial fields to CRM destination fields"
            icon={<GitBranch size={15} />}
            badge={mappings.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">{autoCount} Auto</span>
                {reviewCount > 0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">{reviewCount} Review</span>}
                {unmappedCount > 0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">{unmappedCount} Unmapped</span>}
              </div>
            ) : undefined}>
            <div className="flex items-center justify-end gap-2 mb-4 flex-wrap">
              <button disabled={!mappingComplete || fetchingLead} onClick={() => { setSavedMapping(currentConfig); setTestedMapping(''); setTestLeads([]); toast.success('Field mapping saved. You can now fetch a test lead.'); }} className={btnPrimary}>{mappingSaved ? 'Mapping Saved' : 'Save Mapping'}</button>
              <button onClick={handleAutoMap} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">
                <Wand2 size={11} />Auto Map
              </button>
              <button
                onClick={handleResetMapping}
                disabled={mappings.length === 0}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-40"
              >
                <RotateCcw size={11} />Reset Mapping
              </button>
            </div>

            {mappings.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                <Wand2 size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-foreground mb-1">No mappings yet</p>
                <p className="text-[11px] text-muted-foreground mb-4">Click &quot;Auto Map&quot; to automatically match JustDial fields, or add a mapping manually.</p>
                <button onClick={handleAddMappingRow} className="flex items-center gap-1.5 h-8 px-3 mx-auto text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all">
                  <Plus size={11} />Add Field Mapping
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-[80px_minmax(0,1fr)_20px_minmax(0,1fr)_144px_100px_24px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border items-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Data Type</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Source Field</p>
                  <span aria-hidden="true" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CRM Destination</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Validation</p>
                  <label className="flex flex-col gap-1 text-[9px] font-semibold text-muted-foreground" htmlFor="jd-mapping-status-filter">
                    <select
                      id="jd-mapping-status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'All' | MappingStatus)}
                      className="h-7 w-full px-2 text-[10px] font-semibold text-foreground bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="All">All Status</option>
                      <option value="Auto">Auto</option>
                      <option value="Manual">Manual</option>
                      <option value="Needs Review">Need Review</option>
                      <option value="Unmapped">Unmapped</option>
                    </select>
                  </label>
                  <p></p>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {visibleMappings.map((m) => (
                    <div key={m.id} className="grid grid-cols-[80px_minmax(0,1fr)_20px_minmax(0,1fr)_144px_100px_24px] gap-3 px-4 py-2 items-center hover:bg-muted/20 group">
                      <DataTypeBadge type={m.dataType} />
                      <select
                        ref={(element) => { mappingFieldRefs.current[m.id] = element; }}
                        value={m.sourceField}
                        onChange={(e) => updateMapping(m.id, { sourceField: e.target.value })}
                        className="min-w-0 h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Select source...</option>
                        {sourceFieldOptionsFor(m.sourceField).map((f) => <option key={`src-${f}`} value={f}>{f}</option>)}
                      </select>
                      <ArrowRight size={13} className="mx-auto text-muted-foreground/60" aria-hidden="true" />
                      <select
                        value={m.destinationField}
                        onChange={(e) => updateMapping(m.id, { destinationField: e.target.value })}
                        className="min-w-0 h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Select CRM field...</option>
                        {CRM_DESTINATION_FIELDS.map((f) => <option key={`dst-${f.key}`} value={f.key}>{f.label}</option>)}
                      </select>
                      <span className={`text-[10px] ${validationMessage(m) ? 'text-red-600' : 'text-green-600'}`}>
                        {validationMessage(m) || 'Valid'}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border text-center ${STATUS_STYLES[m.status]}`}>
                        {m.status === 'Needs Review' ? 'Need Review' : m.status}
                      </span>
                      <button onClick={() => removeMapping(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {visibleMappings.length === 0 && <p className="px-4 py-5 text-center text-[11px] text-muted-foreground">No fields match this status.</p>}
                </div>
                <div className="flex justify-end border-t border-border px-4 py-3">
                  <button onClick={handleAddMappingRow} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all">
                    <Plus size={11} />Add Field Mapping
                  </button>
                </div>
              </div>
            )}
          </CollapsibleCard>

          {/* Card 4: Static Fields */}
          <CollapsibleCard
            title="Static Fields"
            subtitle="Fields with fixed values applied to every synced record"
            icon={<Tag size={15} />}
            badge={staticFields.length > 0 ? (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">{staticFields.length} field{staticFields.length !== 1 ? 's' : ''}</span>
            ) : undefined}
          >
            {staticFields.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                <Tag size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-foreground mb-1">No static fields yet</p>
                <p className="text-[11px] text-muted-foreground mb-4">Pick an unmapped API field and give it a fixed value applied to every synced record.</p>
                <button onClick={handleAddStaticFieldRow} className="flex items-center gap-1.5 h-8 px-3 mx-auto text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all">
                  <Plus size={11} />Add Static Field
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-[100px_1fr_1fr_28px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Data Type</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Name</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Value</p>
                  <p></p>
                </div>
                <div className="divide-y divide-border">
                  {staticFields.map((sf) => (
                    <div key={sf.id} className="grid grid-cols-[100px_1fr_1fr_28px] gap-2 px-4 py-2 items-center group">
                      <DataTypeBadge type={sf.dataType} />
                      <select
                        ref={(element) => { staticFieldRefs.current[sf.id] = element; }}
                        value={sf.sourceField}
                        onChange={(e) => updateStaticField(sf.id, { sourceField: e.target.value })}
                        className="min-w-0 h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Select API field...</option>
                        {sourceFieldOptionsFor(sf.sourceField).map((f) => <option key={`sf-opt-${f}`} value={f}>{f}</option>)}
                      </select>
                      <input
                        type="text"
                        value={sf.value}
                        onChange={(e) => updateStaticField(sf.id, { value: e.target.value })}
                        placeholder="Enter fixed value"
                        className="w-full h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      />
                      <button onClick={() => removeStaticField(sf.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end border-t border-border px-4 py-3">
                  <button onClick={handleAddStaticFieldRow} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all">
                    <Plus size={11} />Add Static Field
                  </button>
                </div>
              </div>
            )}
          </CollapsibleCard>

          {/* Card 5: Fields Format Mapping */}

        </div>
      </div>

      {/* ── Test Lead ─────────────────────────────────────────────────────── */}
      <SectionCard
        icon={<UserCheck size={16} />}
        title="Test Lead"
        subtitle="Fetch a sample lead using your validated CURL request, then add it to CRM or discard it."
        action={
          <button onClick={fetchTestLead} disabled={fetchingLead || !mappingSaved} className={btnPrimary}>
            {fetchingLead ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {fetchingLead ? 'Fetching...' : 'Fetch Test Lead'}
          </button>
        }
      >
        {!mappingSaved && <p className="text-[12px] text-muted-foreground">Parse your request and save Field Mapping before fetching a test lead.</p>}
        {curlValid === true && testLeads.length === 0 && (
          <p className="text-[12px] text-muted-foreground">No test leads fetched yet.</p>
        )}
        {testLeads.length > 0 && (
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

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-border pt-4">
        {activated ? (
          <button onClick={deactivate} className={btnDanger}>
            <XCircle size={14} />Deactivate Integration
          </button>
        ) : (
          <button onClick={activate} disabled={!canActivate} className={btnPrimary}>
            <CheckCircle2 size={14} />Activate Integration
          </button>
        )}
      </div>
    </div>
  );
}
