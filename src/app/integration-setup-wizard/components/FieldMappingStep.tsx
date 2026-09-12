'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useState, useRef, useEffect } from 'react';
import { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { mappingErrors, fieldValueError, mappedPayload } from './apiMapping';
import {
  Plus, Trash2, AlertCircle, ChevronDown, GitBranch,
  RotateCcw, Eye, CheckCircle, Tag, Hash, Layers, X, AlertTriangle, Edit2, Save,
  XCircle, ArrowRight,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

type Operation = 'add' | 'update' | 'append';

type DataType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'array' | 'object';

export interface FieldMapping {
  id: string;
  dataType: DataType;
  sourceField: string;
  destinationField: string;
  operations: Operation[];
  transform: string;
  required: boolean;
  enabled: boolean;
  isStatic?: boolean;
  staticValue?: string;
  validationStatus?: 'idle' | 'valid' | 'invalid';
  validationMessage?: string;
}

interface CappingSubField {
  id: string;
  label: string;
  value: string;
}

interface CappingField {
  key: string;
  label: string;
  enabled: boolean;
  selectedOption: string;
  subDropdownValue: string;
  subFields: CappingSubField[];
}

export interface CappingConfig {
  enabled: boolean;
  scope: 'primary_source' | 'request';
  requestLimit: number;
  windowHours: number;
  fields: CappingField[];
  showEndMessage: boolean;
}

interface SavedCapping {
  id: string;
  scope: 'primary_source' | 'request';
  requestLimit: number;
  windowHours: number;
  enabledFields: Array<{ label: string; option: string; subValue: string }>;
  createdAt: string;
}

/* ─────────────────────────── Static data ─────────────────────────── */

const sourceFieldsByType: Partial<Record<ConnectorType, string[]>> = {
  facebook: ['full_name', 'email', 'phone_number', 'city', 'state', 'zip_code', 'ad_id', 'ad_name', 'adset_id', 'campaign_id', 'form_id', 'created_time'],
  'google-ads': ['first_name', 'last_name', 'email', 'phone', 'zip_code', 'campaign_id', 'campaign_name', 'ad_group_id', 'keyword', 'gclid', 'conversion_action'],
  'google-forms': ['name', 'email_address', 'phone', 'message', 'timestamp', 'form_response_id'],
  ivr: ['caller_number', 'caller_name', 'call_duration', 'call_time', 'agent_id', 'ivr_input', 'virtual_number', 'recording_url', 'disposition'],
  zapier: ['name', 'email', 'phone', 'source', 'campaign', 'custom_field_1', 'custom_field_2', 'timestamp'],
  api: ['id', 'name', 'email', 'phone', 'source', 'created_at', 'metadata'],
  justdial: ['name', 'mobile', 'email', 'city', 'category', 'listing_name', 'query_date', 'response_id'],
  linkedin: ['firstName', 'lastName', 'emailAddress', 'phoneNumber', 'company', 'jobTitle', 'formId', 'campaignId', 'submittedAt'],
  'erp-crm': ['lead_id', 'first_name', 'last_name', 'email', 'phone', 'company', 'status', 'source', 'owner_id', 'created_date', 'last_modified'],
};

export const destinationFields = [
  'lead_name', 'email', 'mobile', 'phone', 'city', 'state', 'pincode',
  'source', 'campaign_name', 'ad_name', 'ad_id', 'keyword',
  'notes', 'lead_score', 'assigned_to', 'created_at', 'raw_data',
  'lead_status', 'lead_source', 'lead_channel', 'lead_campaign', 'lead_medium', 'course',
];

// Fields that require the Operations dropdown
const OPERATION_FIELDS = [
  'Entity1', 'Entity2', 'Entity3', 'Entity4',
  'lead_source', 'lead_channel', 'lead_campaign', 'lead_medium',
];

// Fields that are required (shown with red "Required" indicator)
const REQUIRED_DESTINATION_FIELDS = ['email', 'mobile', 'lead_status'];

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
];

const transforms = [
  { value: 'none', label: 'No Transform' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'phone_normalize', label: 'Normalize Phone (+91)' },
  { value: 'date_iso', label: 'Date → ISO 8601' },
  { value: 'concat_name', label: 'Concat First+Last Name' },
];

const STATIC_FIELD_PRESETS = [
  { key: 'campaign_id', label: 'Campaign ID', defaultVal: 'CAMP_2026_Q3' },
  { key: 'source_tag', label: 'Source Tag', defaultVal: 'facebook_lead' },
  { key: 'environment', label: 'Environment', defaultVal: 'production' },
  { key: 'custom', label: 'Custom Field', defaultVal: '' },
];

const VERSIONS = [
  { id: 'v3', label: 'V3.0', date: 'Sep 2, 2026', note: 'Added capping + multi-select operations', active: true },
  { id: 'v2', label: 'V2.0', date: 'Aug 28, 2026', note: 'Added Append operation support', active: false },
  { id: 'v1', label: 'V1.0', date: 'Aug 12, 2026', note: 'Initial field mapping', active: false },
];

const CAPPING_FIELDS_CONFIG: CappingField[] = [
  { key: 'lead_channel', label: 'Lead Channel', enabled: false, selectedOption: '', subDropdownValue: '', subFields: [{ id: 'lc-1', label: 'Sub-Channel', value: '' }] },
  { key: 'lead_source', label: 'Lead Source', enabled: false, selectedOption: '', subDropdownValue: '', subFields: [{ id: 'ls-1', label: 'Sub-Source', value: '' }] },
  { key: 'lead_campaign', label: 'Lead Campaign', enabled: false, selectedOption: '', subDropdownValue: '', subFields: [{ id: 'lcmp-1', label: 'Sub-Campaign', value: '' }] },
  { key: 'lead_medium', label: 'Lead Medium', enabled: false, selectedOption: '', subDropdownValue: '', subFields: [{ id: 'lm-1', label: 'Sub-Medium', value: '' }] },
];

const CAPPING_PARENT_OPTIONS: Record<string, string[]> = {
  lead_channel: ['Online', 'Offline', 'Referral', 'Direct'],
  lead_source: ['Facebook', 'Google Ads', 'JustDial', 'LinkedIn', 'Organic'],
  lead_campaign: ['Brand Awareness Q3', 'Lead Gen 2026', 'Retargeting', 'Custom'],
  lead_medium: ['CPC', 'CPM', 'Email', 'Social', 'Organic'],
};

const CAPPING_SUB_OPTIONS: Record<string, Record<string, string[]>> = {
  lead_channel: { Online: ['Web', 'Mobile App', 'Social Media', 'Email'], Offline: ['Print', 'TV', 'Radio', 'Events'], Referral: ['Partner Referral', 'Customer Referral', 'Affiliate'], Direct: ['Direct Visit', 'Walk-in', 'Phone Call'] },
  lead_source: { Facebook: ['Facebook Lead Ads', 'Facebook Messenger', 'Facebook Marketplace'], 'Google Ads': ['Search Ads', 'Display Ads', 'YouTube Ads', 'Shopping Ads'], JustDial: ['JD Premium', 'JD Standard', 'JD Basic'], LinkedIn: ['LinkedIn InMail', 'LinkedIn Lead Gen', 'LinkedIn Sponsored'], Organic: ['SEO', 'Blog', 'Social Organic'] },
  lead_campaign: { 'Brand Awareness Q3': ['Campaign A', 'Campaign B', 'Campaign C'], 'Lead Gen 2026': ['Phase 1', 'Phase 2', 'Phase 3'], Retargeting: ['Retarget - 7 Days', 'Retarget - 30 Days', 'Retarget - 90 Days'], Custom: ['Custom Campaign 1', 'Custom Campaign 2'] },
  lead_medium: { CPC: ['Google CPC', 'Facebook CPC', 'LinkedIn CPC'], CPM: ['Display CPM', 'Video CPM'], Email: ['Newsletter', 'Drip Campaign', 'Transactional'], Social: ['Organic Social', 'Paid Social'], Organic: ['SEO Organic', 'Direct Organic'] },
};

/* ─────────────────────────── Helpers ─────────────────────────── */

const inferDataType = (fieldName: string): DataType => {
  if (fieldName.includes('email') || fieldName === 'emailAddress') return 'email';
  if (fieldName.includes('phone') || fieldName.includes('mobile') || fieldName.includes('number') || fieldName === 'caller_number') return 'phone';
  if (fieldName.includes('date') || fieldName.includes('time') || fieldName === 'created_at' || fieldName === 'submittedAt') return 'date';
  if (fieldName.includes('id') || fieldName.includes('score') || fieldName.includes('duration') || fieldName.includes('limit')) return 'number';
  return 'string';
};

const getDefaultMappings = (type: ConnectorType): FieldMapping[] => {
  const srcFields = sourceFieldsByType[type] ?? ['name', 'email', 'phone'];
  const defaults: Array<[string, string, boolean]> = [
    [srcFields[0] ?? 'name', 'lead_name', false],
    [srcFields.find((f) => f.includes('email') || f === 'emailAddress') ?? srcFields[1] ?? 'email', 'email', true],
    [srcFields.find((f) => f.includes('phone') || f.includes('mobile') || f.includes('number') || f === 'caller_number') ?? srcFields[2] ?? 'phone', 'mobile', true],
    [srcFields.find((f) => f.includes('city')) ?? srcFields[3] ?? 'city', 'city', false],
    [srcFields.find((f) => f.includes('campaign')) ?? srcFields[4] ?? 'source', 'lead_source', false],
  ];
  return defaults.map(([src, dst, req], i) => ({
    id: `map-${i + 1}`,
    dataType: inferDataType(src),
    sourceField: src,
    destinationField: dst,
    operations: ['add'] as Operation[],
    transform: 'none',
    required: req,
    enabled: true,
    validationStatus: 'idle' as const,
  }));
};

const isOperationField = (destField: string): boolean => {
  return OPERATION_FIELDS.some((f) => destField.includes(f) || destField === f);
};

const isRequiredDestField = (destField: string): boolean => {
  return REQUIRED_DESTINATION_FIELDS.includes(destField);
};

/* ─────────────────────────── Sub-components ─────────────────────────── */

function OperationDropdown({ operations, onChange }: { operations: Operation[]; onChange: (ops: Operation[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const opts: { value: Operation; label: string; color: string; bg: string }[] = [
    { value: 'add', label: 'Add', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { value: 'update', label: 'Update', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { value: 'append', label: 'Append', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ];

  const toggle = (op: Operation) => {
    if (operations.includes(op)) {
      if (operations.length === 1) return;
      onChange(operations.filter((o) => o !== op));
    } else {
      onChange([...operations, op]);
    }
  };

  const displayLabel = operations.length === 1
    ? opts.find((o) => o.value === operations[0])?.label ?? 'Select'
    : `${operations.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-7 pl-2.5 pr-6 text-[11px] bg-muted border border-border rounded flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className="text-foreground font-medium truncate">{displayLabel}</span>
        <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1">
          {opts.map((opt) => {
            const active = operations.includes(opt.value);
            return (
              <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${active ? opt.bg : ''}`}>
                <input type="checkbox" checked={active} onChange={() => toggle(opt.value)} className="w-3.5 h-3.5 rounded accent-primary cursor-pointer" />
                <span className={`text-[12px] font-medium ${active ? opt.color : 'text-foreground'}`}>{opt.label}</span>
                {active && <CheckCircle size={10} className={`ml-auto ${opt.color}`} />}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FieldToggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${enabled ? 'bg-[#cf5830]' : 'bg-gray-300'}`}
    >
      <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */

interface FieldMappingStepProps {
  connectorType: ConnectorType;
  requestPayload?: Record<string, unknown>;
  initialState?: ApiMappingState;
  onStateChange?: (state: ApiMappingState) => void;
}

export interface ApiMappingState {
  mappings: FieldMapping[];
  staticFields: Array<{ id: string; key: string; label: string; value: string }>;
  capping: CappingConfig;
}

export default function FieldMappingStep({ connectorType, requestPayload, initialState, onStateChange }: FieldMappingStepProps) {
  const pendingFocus = useRef<string | null>(null);
  const sourceSelects = useRef<Record<string, HTMLSelectElement | null>>({});
  const [mappings, setMappings] = useSetupState<FieldMapping[]>('api', 'FieldMappingStep.mappings', () => initialState?.mappings ?? (requestPayload ? Object.keys(requestPayload).map((sourceField, index) => {
    const aliases: Record<string, string> = { name: 'lead_name', full_name: 'lead_name', phone: 'mobile', phone_number: 'mobile', email_address: 'email', status: 'lead_status' };
    const destinationField = aliases[sourceField] ?? (destinationFields.includes(sourceField) ? sourceField : '');
    return { id: `map-${index}`, sourceField, destinationField, dataType: inferDataType(sourceField), operations: ['add'], transform: 'none', required: isRequiredDestField(destinationField), enabled: true, validationStatus: 'idle' } as FieldMapping;
  }).map((mapping, index, all) => all.slice(0, index).some((other) => other.destinationField === mapping.destinationField) ? { ...mapping, destinationField: '' } : mapping) : getDefaultMappings(connectorType)));
  const [activeTab, setActiveTab] = useState<'fields' | 'static' | 'capping' | 'versions'>('fields');
  const [staticError, setStaticError] = useState('');

  // Versioning
  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [compareVersion, setCompareVersion] = useState('v2');
  const [showCompare, setShowCompare] = useState(false);

  // Capping
  const [capping, setCapping] = useSetupState<CappingConfig>('api', 'FieldMappingStep.capping', initialState?.capping ?? {
    enabled: false,
    scope: 'primary_source',
    requestLimit: 100,
    windowHours: 24,
    fields: CAPPING_FIELDS_CONFIG.map((f) => ({ ...f, subFields: f.subFields.map((sf) => ({ ...sf })) })),
    showEndMessage: false,
  });
  const [showCappingEndMsg, setShowCappingEndMsg] = useState(false);
  const [savedCappings, setSavedCappings] = useState<SavedCapping[]>([]);
  const [editingCappingId, setEditingCappingId] = useState<string | null>(null);
  const [previewCapping, setPreviewCapping] = useState<SavedCapping | null>(null);

  // Static fields
  const [staticFields, setStaticFields] = useSetupState<ApiMappingState['staticFields']>('api', 'FieldMappingStep.staticFields', initialState?.staticFields ?? []);

  useEffect(() => { onStateChange?.({ mappings, staticFields, capping }); }, [mappings, staticFields, capping, onStateChange]);

  const [testLeadLoading, setTestLeadLoading] = useState(false);
  const [testLeadResult, setTestLeadResult] = useState<'idle' | 'success' | 'failure'>('idle');
  const [testLeadError, setTestLeadError] = useState('');

  const srcFields = requestPayload ? Object.keys(requestPayload) : sourceFieldsByType[connectorType] ?? ['name', 'email', 'phone', 'source'];

  /* ── Mapping helpers ── */
  const addMapping = () => {
    const newId = `map-${mappings.length + 1}-${Date.now()}`;
    pendingFocus.current = newId;
    setMappings((prev) => [
      ...prev,
      { id: newId, dataType: 'string', sourceField: '', destinationField: '', operations: ['add'], transform: 'none', required: false, enabled: true, validationStatus: 'idle' },
    ]);
  };

  useEffect(() => {
    if (!pendingFocus.current) return;
    const select = sourceSelects.current[pendingFocus.current];
    if (select) { select.focus(); select.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); pendingFocus.current = null; }
  }, [mappings]);

  const removeMapping = (id: string) => setMappings((prev) => prev.filter((m) => m.id !== id));

  const updateMapping = <K extends keyof FieldMapping>(id: string, field: K, value: FieldMapping[K]) => {
    if ((field === 'sourceField' || field === 'destinationField') && value && mappings.some((row) => row.id !== id && row[field] === value)) return;
    setMappings((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: value };
      // Auto-update required flag when destination changes
      if (field === 'destinationField') {
        updated.required = isRequiredDestField(value as string);
        updated.dataType = inferDataType(value as string);
        updated.validationStatus = 'idle';
      }
      return updated;
    }));
  };

  /* ── Inline validation ── */
  const validateField = (id: string) => {
    const mapping = mappings.find((m) => m.id === id);
    if (!mapping) return;
    setMappings((prev) => prev.map((m) => m.id === id ? { ...m, validationStatus: 'idle' } : m));
    setTimeout(() => {
      let valid = true;
      let errorMsg = '';

      if (!mapping.sourceField || !mapping.destinationField) {
        valid = false;
        errorMsg = 'Field mapping is incomplete';
      } else if (mapping.destinationField === 'email' || mapping.dataType === 'email') {
        const emailLike = mapping.sourceField.includes('email') || mapping.sourceField.includes('mail');
        if (!emailLike) { valid = false; errorMsg = 'Email is not valid'; }
      } else if (mapping.destinationField === 'mobile' || mapping.destinationField === 'phone' || mapping.dataType === 'phone') {
        const phoneLike = mapping.sourceField.includes('phone') || mapping.sourceField.includes('mobile') || mapping.sourceField.includes('number') || mapping.sourceField.includes('caller');
        if (!phoneLike) { valid = false; errorMsg = 'Mobile Number is wrong'; }
      }

      setMappings((prev) => prev.map((m) =>
        m.id === id
          ? { ...m, validationStatus: valid ? 'valid' : 'invalid', validationMessage: valid ? 'Valid' : errorMsg }
          : m
      ));
    }, 400);
  };

  /* ── Test Lead ── */
  const handleTestLead = () => {
    setTestLeadLoading(true);
    setTestLeadResult('idle');
    setTestLeadError('');
    // Simulate test lead fetch
    setTimeout(() => {
      setTestLeadLoading(false);
      // Simulate success (70% chance) or failure for demo
      const requiredMapped = mappings.filter((m) => m.required && m.destinationField).length;
      const totalRequired = mappings.filter((m) => m.required).length;
      if (requiredMapped >= totalRequired) {
        setTestLeadResult('success');
      } else {
        setTestLeadResult('failure');
        setTestLeadError(`Validation failed: ${totalRequired - requiredMapped} required field(s) not mapped. Please map Email, Mobile Number, and Lead Status before testing.`);
      }
    }, 1800);
  };

  /* ── Static field helpers ── */
  const addStaticField = (preset: typeof STATIC_FIELD_PRESETS[0]) => {
    if (preset.key && (mappings.some((row) => row.destinationField === preset.key) || staticFields.some((row) => row.key === preset.key))) { setStaticError('This destination field is already mapped.'); return; }
    setStaticError('');
    setStaticFields((prev) => [...prev, { id: crypto.randomUUID(), key: preset.key, label: preset.label, value: preset.defaultVal }]);
  };
  const removeStaticField = (id: string) => setStaticFields((prev) => prev.filter((f) => f.id !== id));

  /* ── Capping helpers ── */
  const updateCappingField = (key: string, updates: Partial<CappingField>) => {
    setCapping((prev) => ({ ...prev, fields: prev.fields.map((f) => (f.key === key ? { ...f, ...updates } : f)) }));
  };

  const resetCappingForm = () => {
    setCapping({ enabled: false, scope: 'primary_source', requestLimit: 100, windowHours: 24, fields: CAPPING_FIELDS_CONFIG.map((f) => ({ ...f, subFields: f.subFields.map((sf) => ({ ...sf })) })), showEndMessage: false });
  };

  const saveCapping = () => {
    const enabledFields = capping.fields.filter((f) => f.enabled && f.selectedOption).map((f) => ({ label: f.label, option: f.selectedOption, subValue: f.subDropdownValue }));
    const newCapping: SavedCapping = {
      id: editingCappingId ?? `cap-${Date.now()}`,
      scope: capping.scope,
      requestLimit: capping.requestLimit,
      windowHours: capping.windowHours,
      enabledFields,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    if (editingCappingId) {
      setSavedCappings((prev) => prev.map((c) => c.id === editingCappingId ? newCapping : c));
      setEditingCappingId(null);
    } else {
      setSavedCappings((prev) => [...prev, newCapping]);
    }
    if (!requestPayload) resetCappingForm();
  };

  const editCapping = (cap: SavedCapping) => {
    setEditingCappingId(cap.id);
    setCapping((prev) => ({ ...prev, enabled: true, scope: cap.scope, requestLimit: cap.requestLimit, windowHours: cap.windowHours }));
  };

  const removeSavedCapping = (id: string) => {
    setSavedCappings((prev) => prev.filter((c) => c.id !== id));
    if (requestPayload) setCapping((prev) => ({ ...prev, enabled: false }));
  };

  /* ── Progress ── */
  const requiredMapped = mappings.filter((m) => m.required && m.destinationField).length;
  const totalRequired = mappings.filter((m) => m.required).length;

  /* ─────────────────────────── Render ─────────────────────────── */
  return (
    <div>
      {connectorType === 'api' && mappingErrors({ mappings, staticFields, capping }, requestPayload).length > 0 && <div role="alert" className="mb-4 p-3 text-[12px] text-danger bg-danger-bg rounded-lg">{mappingErrors({ mappings, staticFields, capping }, requestPayload).join(' ')}</div>}
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Field Mapping</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Map source fields from {getConnectorLabel(connectorType)} to your destination schema.
            </p>
          </div>
          {/* Version selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium">Version:</span>
            <div className="relative">
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="h-7 pl-2.5 pr-7 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none font-semibold"
              >
                {VERSIONS.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}{v.active ? ' (Current)' : ''}</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {VERSIONS.find((v) => v.id === selectedVersion)?.active && (
              <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-medium">Latest</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-foreground">Mapping Progress</span>
            <span className="text-[11px] text-muted-foreground">{requiredMapped}/{totalRequired} required fields mapped</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: totalRequired > 0 ? `${(requiredMapped / totalRequired) * 100}%` : '0%' }} />
          </div>
        </div>
        <span className={`text-[12px] font-semibold ${requiredMapped === totalRequired ? 'text-success' : 'text-warning'}`}>
          {requiredMapped === totalRequired ? '✓ Complete' : 'Incomplete'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto">
        {([
          { id: 'fields', label: 'Field Mapping', icon: Layers },
          { id: 'static', label: `Static Fields${staticFields.length > 0 ? ` (${staticFields.length})` : ''}`, icon: Tag },
          { id: 'capping', label: `Capping${savedCappings.length > 0 ? ` (${savedCappings.length})` : ''}`, icon: Hash },
          { id: 'versions', label: 'Versions', icon: GitBranch },
        ] as const).map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={`fmtab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════ FIELD MAPPING TAB ══════════════ */}
      {activeTab === 'fields' && (
        <>
          {connectorType === 'api' ? <div className="overflow-x-auto rounded-lg border border-border mb-4">
            <table className="w-full min-w-[950px] text-left text-[12px]">
              <thead className="bg-muted/40 text-muted-foreground"><tr>{['Data Type', 'Source Field (API)', '', 'Target Field (CRM)', 'Validation', 'Actions'].map((label, i) => <th key={i} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead>
              <tbody>{mappings.map((mapping) => {
                const required = isRequiredDestField(mapping.destinationField);
                const value = requestPayload ? mappedPayload(requestPayload, { mappings: [mapping], staticFields: [], capping })[mapping.destinationField] : undefined;
                const issue = !mapping.sourceField || !mapping.destinationField ? 'Select source and target fields' : requestPayload ? fieldValueError(mapping.destinationField, value) : null;
                const label = (field: string) => ({ email: 'Email', mobile: 'Mobile', lead_status: 'Status' }[field] ?? field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
                return <tr key={mapping.id} className="border-t border-border">
                  <td className="px-3 py-2"><span className={`rounded-sm border px-2 py-0.5 text-[11px] ${mapping.dataType === 'email' ? 'border-cyan-200 bg-cyan-50 text-cyan-600' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>{DATA_TYPES.find((d) => d.value === mapping.dataType)?.label}</span></td>
                  <td className="px-3 py-2"><select ref={(el) => { sourceSelects.current[mapping.id] = el; }} aria-label="Source field" value={mapping.sourceField} onChange={(e) => updateMapping(mapping.id, 'sourceField', e.target.value)} className="h-8 w-full rounded-md border border-border bg-card px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"><option value="">Select source field</option>{srcFields.map((field) => <option key={field} disabled={mappings.some((other) => other.id !== mapping.id && other.sourceField === field)}>{field}</option>)}</select></td>
                  <td><ArrowRight size={17} className="text-blue-500" /></td>
                  <td className="px-3 py-2"><div className="relative"><select aria-label="Target field (CRM)" aria-required={required} value={mapping.destinationField} onChange={(e) => updateMapping(mapping.id, 'destinationField', e.target.value)} className={`h-8 w-full rounded-md border border-border bg-card px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 ${required ? 'pr-24' : ''}`}><option value="">Select target field</option>{destinationFields.map((field) => <option key={field} value={field} disabled={mappings.some((other) => other.id !== mapping.id && other.destinationField === field) || staticFields.some((f) => f.key === field)}>{label(field)}</option>)}</select>{required && <span className="pointer-events-none absolute right-6 top-1.5 rounded-sm border border-red-200 bg-red-50 px-1.5 text-[10px] text-red-500">Required</span>}</div></td>
                  <td className="px-3 py-2"><span aria-live="polite" className={issue ? 'inline-flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-500' : 'text-emerald-600 text-[11px]'}>{issue ? <><X size={11} />{issue}</> : <span className="inline-flex items-center gap-1"><CheckCircle size={12} />Valid</span>}</span></td>
                  <td className="px-3 py-2"><button type="button" aria-label={`Delete ${mapping.sourceField || 'empty'} mapping`} onClick={() => removeMapping(mapping.id)} className="rounded p-2 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></td>
                </tr>;
              })}</tbody>
            </table>
          </div> : <>
          {/* Column headers */}
          <div className="grid gap-2 mb-2 px-2" style={{ gridTemplateColumns: '90px 1fr 1fr 80px 110px 32px' }}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Data Type</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Source Field ({requestPayload ? 'API' : 'SAP ERP'})</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Destination Field (CRM)</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Validation</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Operations</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Action</p>
          </div>

          <div className="space-y-1.5 mb-4">
            {mappings.map((mapping) => {
              const showOps = isOperationField(mapping.destinationField);
              const isRequired = isRequiredDestField(mapping.destinationField);

              return (
                <div
                  key={mapping.id}
                  className={`grid gap-2 items-center p-2 rounded-lg border transition-colors ${
                    isRequired ? 'border-primary/20 bg-primary/3' : 'border-border bg-card'
                  }`}
                  style={{ gridTemplateColumns: '90px 1fr 1fr 80px 110px 32px' }}
                >
                  {/* Data Type */}
                  <div className="relative">
                    <select
                      value={mapping.dataType}
                      onChange={(e) => updateMapping(mapping.id, 'dataType', e.target.value as DataType)}
                      className="w-full h-7 pl-2 pr-5 text-[11px] bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    >
                      {DATA_TYPES.map((dt) => (
                        <option key={`dt-${mapping.id}-${dt.value}`} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Source Field */}
                  <div className="relative">
                    <select
                      value={mapping.sourceField}
                      onChange={(e) => { updateMapping(mapping.id, 'sourceField', e.target.value); }}
                      className="w-full h-7 pl-2 pr-5 text-[11px] bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">Select source field</option>
                      {srcFields.filter((field) => !mappings.some((other) => other.id !== mapping.id && other.sourceField === field)).map((f) => (
                        <option key={`src-${mapping.id}-${f}`} value={f}>{f}</option>
                      ))}
                    </select>
                    <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Destination Field */}
                  <div className="relative">
                    <select
                      value={mapping.destinationField}
                      onChange={(e) => updateMapping(mapping.id, 'destinationField', e.target.value)}
                      className="w-full h-7 pl-2 pr-5 text-[11px] bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">Select destination field</option>
                      {destinationFields.filter((field) => !mappings.some((other) => other.id !== mapping.id && other.destinationField === field) && !staticFields.some((item) => item.key === field)).map((f) => (
                        <option key={`dst-${mapping.id}-${f}`} value={f}>{f}</option>
                      ))}
                    </select>
                    <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    {isRequired && (
                      <span className="absolute -top-2 right-0 text-[9px] font-bold text-red-500">(Required)</span>
                    )}
                  </div>

                  {/* Validation */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => validateField(mapping.id)}
                      className="flex items-center gap-1 h-7 px-2 text-[10px] font-medium bg-muted border border-border rounded hover:bg-muted/80 transition-colors text-muted-foreground whitespace-nowrap"
                    >
                      {mapping.validationStatus === 'idle' && 'Check'}
                      {mapping.validationStatus === 'valid' && <><CheckCircle size={11} className="text-success" /> Valid</>}
                      {mapping.validationStatus === 'invalid' && <><XCircle size={11} className="text-danger" /> Error</>}
                    </button>
                    {mapping.validationStatus === 'invalid' && mapping.validationMessage && (
                      <span className="text-[9px] text-danger font-medium leading-tight">{mapping.validationMessage}</span>
                    )}
                    {mapping.validationStatus === 'valid' && (
                      <span className="text-[9px] text-success font-medium leading-tight">Valid</span>
                    )}
                  </div>

                  {/* Operations — only for specific fields */}
                  <div>
                    {showOps ? (
                      <OperationDropdown
                        operations={mapping.operations}
                        onChange={(ops) => updateMapping(mapping.id, 'operations', ops)}
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 italic pl-1">—</span>
                    )}
                  </div>

                  {/* Action — Delete */}
                  <button
                    onClick={() => removeMapping(mapping.id)}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger transition-colors"
                    title="Delete mapping"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          </>}
          {/* Add Mapping button only */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={addMapping}
              className="flex w-full items-center justify-center gap-1.5 h-8 px-4 text-[12px] font-medium text-muted-foreground border border-dashed border-border rounded-md hover:bg-muted transition-colors"
            >
              <Plus size={13} /> Add Mapping
            </button>
          </div>

          {requiredMapped < totalRequired && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-bg border border-warning-border mb-4">
              <AlertCircle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-warning">
                <span className="font-semibold">{totalRequired - requiredMapped} required field{totalRequired - requiredMapped > 1 ? 's' : ''} not mapped.</span>
                {' '}You must map all required fields (Email, Mobile Number, Lead Status) before proceeding.
              </p>
            </div>
          )}
        </>
      )}

      {/* ══════════════ STATIC FIELDS TAB ══════════════ */}
      {activeTab === 'static' && (
        <div className="space-y-4">
          {staticError && <p role="alert" className="text-[12px] text-danger">{staticError}</p>}
          <div className="p-3 rounded-lg bg-info-bg border border-info-border">
            <p className="text-[12px] text-info">
              <span className="font-semibold">Static fields</span> are fixed values injected into every lead record regardless of source data.
            </p>
          </div>
          <div>
            <button type="button" onClick={() => addStaticField({ key: '', label: 'Custom Field', defaultVal: '' })} className="flex items-center gap-1.5 h-8 px-3 mb-2 text-[12px] font-semibold bg-primary text-white rounded-md"><Plus size={13} />Add Static Mapping</button>
            <div className="flex flex-wrap gap-2">
              {STATIC_FIELD_PRESETS.map((preset) => (
                <button key={`sfp-${preset.key}`} onClick={() => addStaticField(preset)} className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
                  <Plus size={11} /> {preset.label}
                </button>
              ))}
            </div>
          </div>
          {staticFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-[13px]">No static fields added yet</p>
              <p className="text-[11px] mt-1">Click a preset above to add a static field</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staticFields.map((sf) => (
                <div key={sf.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                  <Tag size={13} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Destination Field (CRM)</p>
                      <input aria-label="Destination Field (CRM)" value={sf.key} onChange={(e) => { const key = e.target.value; if (key.trim() && (mappings.some((row) => row.destinationField === key.trim()) || staticFields.some((row) => row.id !== sf.id && row.key.trim() === key.trim()))) { setStaticError('This destination field is already mapped.'); return; } setStaticError(''); setStaticFields((prev) => prev.map((f) => f.id === sf.id ? { ...f, key } : f)); }} className="w-full h-7 px-2 text-[12px] bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Static Value</p>
                      <input value={sf.value} onChange={(e) => setStaticFields((prev) => prev.map((f) => f.id === sf.id ? { ...f, value: e.target.value } : f))} className="w-full h-7 px-2 text-[12px] bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Enter static value..." />
                    </div>
                  </div>
                  <button onClick={() => removeStaticField(sf.id)} className="p-1.5 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ CAPPING TAB ══════════════ */}
      {activeTab === 'capping' && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-warning-bg border border-warning-border">
            <p className="text-[12px] text-warning">
              <span className="font-semibold">Capping</span> restricts new lead requests once the limit is reached. Existing leads continue processing; only new requests are blocked.
            </p>
          </div>

          {savedCappings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-foreground">Saved Cappings ({savedCappings.length})</p>
              {savedCappings.map((cap, idx) => (
                <div key={cap.id} className="p-3 rounded-lg border border-primary/25 bg-primary/3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-primary">Capping #{idx + 1}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{cap.scope === 'primary_source' ? 'Primary Source' : 'Request Level'}</span>
                        <span className="text-[10px] text-muted-foreground">{cap.createdAt}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>Limit: <span className="font-semibold text-foreground">{cap.requestLimit} / {cap.windowHours === 1 ? '1 Hour' : '1 Day'}</span></span>
                        {cap.enabledFields.map((ef, i) => (
                          <span key={i}>{ef.label}: <span className="font-semibold text-foreground">{ef.option}{ef.subValue ? ` → ${ef.subValue}` : ''}</span></span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setPreviewCapping(cap)} className="flex items-center gap-1 h-6 px-2 text-[10px] font-medium bg-warning-bg text-warning border border-warning-border rounded hover:opacity-80 transition-opacity"><Eye size={10} /> Preview</button>
                      <button onClick={() => editCapping(cap)} className="flex items-center gap-1 h-6 px-2 text-[10px] font-medium bg-card border border-border rounded hover:bg-muted transition-colors text-muted-foreground"><Edit2 size={10} /> Edit</button>
                      <button onClick={() => removeSavedCapping(cap.id)} className="flex items-center justify-center w-6 h-6 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger transition-colors"><X size={11} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">{editingCappingId ? 'Edit Capping' : 'Enable Capping'}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{editingCappingId ? 'Modify the selected capping configuration' : 'Configure a new capping rule for this integration'}</p>
              </div>
              <FieldToggle label="Enable Capping" enabled={capping.enabled} onChange={(v) => setCapping((prev) => ({ ...prev, enabled: v }))} />
            </div>

            {capping.enabled && (
              <div className="mt-4 space-y-5 border-t border-border pt-4">
                <div>
                  <p className="text-[12px] font-semibold text-foreground mb-2">Scope</p>
                  <div className="flex gap-3">
                    {[
                      { value: 'primary_source', label: 'Primary Source Level', desc: 'Cap applies to the primary lead source' },
                      { value: 'request', label: 'Request Level', desc: 'Cap applies per individual request' },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setCapping((prev) => ({ ...prev, scope: opt.value as CappingConfig['scope'] }))} className={`flex-1 p-3 rounded-lg border text-left transition-all ${capping.scope === opt.value ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${capping.scope === opt.value ? 'border-primary' : 'border-muted-foreground/40'}`}>
                            {capping.scope === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </div>
                          <span className={`text-[12px] font-semibold ${capping.scope === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  <div>
                  <p className="text-[12px] font-medium text-foreground mb-1.5">Request Limit</p>
                  <input type="number" value={capping.requestLimit} onChange={(e) => setCapping((prev) => ({ ...prev, requestLimit: Number(e.target.value) }))} className="w-full h-8 px-3 text-[12px] bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" min={1} />
                  </div>
                  <label className="block text-[12px] font-medium text-foreground">Capping Period
                    <select value={capping.windowHours} onChange={(e) => setCapping((prev) => ({ ...prev, windowHours: Number(e.target.value) }))} className="w-full h-8 px-3 mt-1.5 bg-muted border border-border rounded-md">
                      <option value={24}>1 Day</option><option value={1}>1 Hour</option>
                    </select>
                  </label>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[12px] font-semibold text-foreground">Capping Fields</p>
                    <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">OR Condition</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">Enable one or more fields — capping triggers when ANY enabled condition is met.</p>
                  <div className="space-y-2">
                    {capping.fields.map((cf) => {
                      const parentOptions = CAPPING_PARENT_OPTIONS[cf.key] ?? [];
                      const subOptions = cf.selectedOption ? (CAPPING_SUB_OPTIONS[cf.key]?.[cf.selectedOption] ?? []) : [];
                      return (
                        <div key={cf.key} className={`rounded-lg border transition-all ${cf.enabled ? 'border-primary/30 bg-primary/3' : 'border-border bg-card'}`}>
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-[12px] font-semibold text-foreground">{cf.label}</span>
                            <FieldToggle label={cf.label} enabled={cf.enabled} onChange={(v) => updateCappingField(cf.key, { enabled: v, selectedOption: '', subDropdownValue: '' })} />
                          </div>
                          {cf.enabled && (
                            <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1">{cf.label} Option</p>
                                <div className="relative">
                                  <select value={cf.selectedOption} onChange={(e) => updateCappingField(cf.key, { selectedOption: e.target.value, subDropdownValue: '' })} className="w-full h-7 pl-2.5 pr-7 text-[12px] bg-muted border border-border rounded-md focus:outline-none appearance-none">
                                    <option value="">Select {cf.label}...</option>
                                    {parentOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                              </div>
                              {cf.selectedOption && subOptions.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-1">{cf.subFields[0]?.label ?? `Sub-${cf.label}`}</p>
                                  <div className="relative">
                                    <select value={cf.subDropdownValue} onChange={(e) => updateCappingField(cf.key, { subDropdownValue: e.target.value })} className="w-full h-7 pl-2.5 pr-7 text-[12px] bg-muted border border-border rounded-md focus:outline-none appearance-none">
                                      <option value="">Select {cf.subFields[0]?.label ?? 'sub-option'}...</option>
                                      {subOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] font-semibold text-foreground mb-1">End Behavior</p>
                  <p className="text-[11px] text-muted-foreground mb-2">Once {capping.requestLimit} requests are received, new requests will be blocked.</p>
                  <button type="button" onClick={() => setShowCappingEndMsg(true)} className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium bg-warning-bg text-warning border border-warning-border rounded-md hover:opacity-80 transition-opacity">
                    <AlertTriangle size={11} /> Preview End Message
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={saveCapping} className="flex items-center gap-1.5 h-8 px-4 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                    <Save size={13} /> {editingCappingId ? 'Update Capping' : 'Save Capping'}
                  </button>
                  {editingCappingId && (
                    <button type="button" onClick={() => { setEditingCappingId(null); resetCappingForm(); }} className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
                      <X size={12} /> Cancel Edit
                    </button>
                  )}
                  <p className="text-[11px] text-muted-foreground ml-auto">{savedCappings.length} capping{savedCappings.length !== 1 ? 's' : ''} saved</p>
                </div>
              </div>
            )}
          </div>

          {showCappingEndMsg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Capping Limit Reached</p>
                    <p className="text-[12px] text-muted-foreground mt-1">The request cap of <span className="font-semibold text-foreground">{capping.requestLimit}</span> has been reached.</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-warning-bg border border-warning-border mb-4">
                  <p className="text-[12px] text-warning font-medium">"Do you want to continue with existing requests? No new requests will be considered."</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowCappingEndMsg(false)} className="h-8 px-4 text-[12px] font-medium bg-muted border border-border rounded-md hover:bg-muted/80 transition-colors text-foreground">Cancel</button>
                  <button onClick={() => setShowCappingEndMsg(false)} className="h-8 px-4 text-[12px] font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">Continue with Existing</button>
                </div>
              </div>
            </div>
          )}

          {previewCapping && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Capping End Message Preview</p>
                    <p className="text-[12px] text-muted-foreground mt-1">Limit: <span className="font-semibold text-foreground">{previewCapping.requestLimit}</span> · {previewCapping.scope === 'primary_source' ? 'Primary Source Level' : 'Request Level'}</p>
                    {previewCapping.enabledFields.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {previewCapping.enabledFields.map((ef, i) => (
                          <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{ef.label}: {ef.option}{ef.subValue ? ` → ${ef.subValue}` : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-warning-bg border border-warning-border mb-4">
                  <p className="text-[12px] text-warning font-medium">"Do you want to continue with existing requests? No new requests will be considered."</p>
                </div>
                <button onClick={() => setPreviewCapping(null)} className="w-full h-8 text-[12px] font-medium bg-muted border border-border rounded-md hover:bg-muted/80 transition-colors text-foreground">Close</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ VERSIONS TAB ══════════════ */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">Mapping Versions</p>
            <button onClick={() => setShowCompare(!showCompare)} className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
              <Eye size={11} /> {showCompare ? 'Hide Comparison' : 'Compare Versions'}
            </button>
          </div>

          {showCompare && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[12px] font-semibold text-foreground mb-3">Side-by-Side Comparison</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)} className="w-full h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                    {VERSIONS.map((v) => <option key={v.id} value={v.id}>{v.label}{v.active ? ' (Current)' : ''}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">vs</span>
                <div className="relative flex-1">
                  <select value={compareVersion} onChange={(e) => setCompareVersion(e.target.value)} className="w-full h-7 pl-2.5 pr-6 text-[11px] bg-card border border-border rounded-md focus:outline-none appearance-none">
                    {VERSIONS.map((v) => <option key={v.id} value={v.id}>{v.label}{v.active ? ' (Current)' : ''}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[selectedVersion, compareVersion].map((vid) => {
                  const ver = VERSIONS.find((v) => v.id === vid);
                  return (
                    <div key={`vcmp-${vid}`} className={`p-3 rounded-lg border ${ver?.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <GitBranch size={12} className={ver?.active ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={`text-[12px] font-semibold ${ver?.active ? 'text-primary' : 'text-foreground'}`}>{ver?.label}</span>
                        {ver?.active && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full">Current</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">{ver?.date}</p>
                      <p className="text-[11px] text-foreground">{ver?.note}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-foreground">Differences</p>
                {selectedVersion !== compareVersion ? (
                  <>
                    <div className="flex items-start gap-2 p-2 rounded bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-600 mt-0.5">+</span>
                      <p className="text-[11px] text-emerald-700">{VERSIONS.find((v) => v.id === selectedVersion)?.note}</p>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded bg-red-50 border border-red-200">
                      <span className="text-[10px] font-bold text-red-500 mt-0.5">−</span>
                      <p className="text-[11px] text-red-600">{VERSIONS.find((v) => v.id === compareVersion)?.note}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">Select two different versions to see differences.</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {VERSIONS.map((ver) => (
              <div key={ver.id} className={`p-4 rounded-lg border ${ver.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className={ver.active ? 'text-primary' : 'text-muted-foreground'} />
                    <span className={`text-[13px] font-semibold ${ver.active ? 'text-primary' : 'text-foreground'}`}>{ver.label}</span>
                    {ver.active && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Current · Only this version can be published</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{ver.date}</span>
                    {!ver.active && (
                      <button className="flex items-center gap-1 h-6 px-2 text-[10px] font-medium bg-card border border-border rounded hover:bg-muted transition-colors text-muted-foreground">
                        <RotateCcw size={10} /> Rollback
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 ml-6">{ver.note}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-info-bg border border-info-border">
            <p className="text-[11px] text-info">
              <span className="font-semibold">Note:</span> Only the latest version (V3.0) can be published. Use Rollback to restore an earlier version as the new current.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
