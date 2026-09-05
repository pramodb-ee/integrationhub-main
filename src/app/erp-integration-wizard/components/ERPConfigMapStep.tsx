'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Terminal, Code2, GitBranch, Tag, Hash, Settings2,
  ChevronDown, ChevronUp, CheckCircle, Loader2, RefreshCw,
  Plus, Trash2, Wand2, RotateCcw, Copy, Check, AlertTriangle, Info, X,
  Search, Filter, Calendar, Save, ArrowRight
} from 'lucide-react';
import { ERPId, ERP_MAP, CRM_DESTINATION_FIELDS, FIELD_TYPE_FORMATS, CRMFieldType, CRMFieldDefinition } from './erpRegistry';
import Modal from '@/components/ui/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  fieldName: string;
  dataType: string;
  value: string;
}

interface FormatMapping {
  id: string;
  crmField: string;
  detectedType: string;
  selectedFormat: string;
}

const getCRMFieldType = (fieldKey: string): string =>
  CRM_DESTINATION_FIELDS.find((field) => field.key === fieldKey)?.type || 'Type unavailable';

const DATE_FIELD_TYPES: CRMFieldType[] = ['Date', 'DateTime'];

const getFormatOptions = (fieldKey: string): string[] => {
  const type = getCRMFieldType(fieldKey);
  return DATE_FIELD_TYPES.includes(type as CRMFieldType) ? FIELD_TYPE_FORMATS[type] || [] : [];
};

interface DefaultValue {
  id: string;
  crmField: string;
  detectedType: string;
  defaultValue: string;
}

const DEFAULT_ENTITIES = ['Entity 1', 'Entity 2', 'Entity 3', 'Entity 4'] as const;
type DefaultEntity = typeof DEFAULT_ENTITIES[number];

const ENTITY_OPTIONS: Record<DefaultEntity, string[]> = {
  'Entity 1': ['MSc Mathematics', 'Need Counselling', 'PG Diploma in Computer Application', 'PG Diploma in Accounts & Finance', 'PG Diploma in Administration & Public Policy'],
  'Entity 2': ['1100', '1102', '1101', '1098', '1099'],
  'Entity 3': ['PG Diploma in Chemical Sciences', 'PG Diploma in Physical Sciences', 'PG Diploma in Mathematics', 'PG Diploma in Economics', 'Electronics Engineering (VLSI)', 'Cyber Security'],
  'Entity 4': ['B.Tech ME-Lateral Entry', 'B.Sc', 'M.A. Economics', 'B. Pharma', 'M.A. Hindi', 'Diploma EE-Lateral Entry', 'PhD Agriculture', 'M.Sc Biotechnology', 'PGDLAN', 'B.Sc Defense Strategic Studies'],
};

const getDefaultEntity = (field: CRMFieldDefinition): DefaultEntity => {
  const fieldIndex = CRM_DESTINATION_FIELDS.findIndex((candidate) => candidate.key === field.key);
  return DEFAULT_ENTITIES[Math.min(Math.floor(fieldIndex / Math.ceil(CRM_DESTINATION_FIELDS.length / DEFAULT_ENTITIES.length)), DEFAULT_ENTITIES.length - 1)];
};

const getDefaultControlType = (fieldType: string) => {
  switch (fieldType) {
    case 'Number': return 'number';
    case 'Date': return 'date';
    case 'DateTime': return 'datetime-local';
    default: return 'text';
  }
};

interface ParsedRequest {
  method: string;
  url: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      // Fuzzy matching
      const aliases: Record<string, string> = {
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
      else {
        // Partial match
        for (const [k, v] of destMap.entries()) {
          if (normSrc.includes(k) || k.includes(normSrc)) {
            destKey = v;
            status = 'Needs Review';
            break;
          }
        }
      }
    } else {
      status = 'Auto';
    }

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

// ─── Collapsible Card ─────────────────────────────────────────────────────────

function CollapsibleCard({
  id, title, subtitle, icon, defaultOpen = false, badge, children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-foreground">{title}</p>
            {badge}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="border-t border-border px-5 py-5">{children}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ERPConfigMapStepProps {
  erpId: ERPId;
  onConfigurationChange?: (configuration: {
    curlConfigured: boolean;
    mappingCount: number;
    staticFieldCount: number;
    formatMappingCount: number;
    defaultValueCount: number;
  }) => void;
}

export default function ERPConfigMapStep({ erpId, onConfigurationChange }: ERPConfigMapStepProps) {
  const erp = ERP_MAP[erpId];
  const sourceFields = erp?.sourceFields || [];

  // Card 1: CURL
  const [curl, setCurl] = useState(erp?.defaultCurl || '');
  const [curlValidating, setCurlValidating] = useState(false);
  const [curlValid, setCurlValid] = useState<boolean | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);

  // Card 2: Parsed
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);

  // Card 3: Field Mapping
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | MappingStatus>('All');
  const mappingFieldRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const [focusedMappingId, setFocusedMappingId] = useState<string | null>(null);

  // Card 4: Static Fields
  const [staticFields, setStaticFields] = useState<StaticField[]>([]);
  const [showStaticFieldForm, setShowStaticFieldForm] = useState(false);
  const [newStaticFields, setNewStaticFields] = useState<string[]>([]);
  const [newStaticValues, setNewStaticValues] = useState<Record<string, string>>({});

  // Card 5: Format Mapping
  const [formatMappings, setFormatMappings] = useState<FormatMapping[]>([]);

  // Card 6: Default Values
  const [defaultValues, setDefaultValues] = useState<DefaultValue[]>([]);
  const [defaultEntity, setDefaultEntity] = useState<DefaultEntity>('Entity 1');
  const [defaultDrawerOpen, setDefaultDrawerOpen] = useState(false);
  const [defaultSearch, setDefaultSearch] = useState('');
  const [configuredOnly, setConfiguredOnly] = useState(false);
  const [defaultFilter, setDefaultFilter] = useState<'All' | CRMFieldType>('All');
  const [draftDefaults, setDraftDefaults] = useState<Record<string, string>>({});
  const [entityOptionValues, setEntityOptionValues] = useState<Record<DefaultEntity, Record<string, string>>>({
    'Entity 1': {},
    'Entity 2': {},
    'Entity 3': {},
    'Entity 4': {},
  });
  const [draftEntityOptionValues, setDraftEntityOptionValues] = useState<Record<string, string>>({});

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
      }
    }, 1200);
  };

  const handleRebuildCurl = () => {
    if (!parsed) return;
    const headers = Object.entries(parsed.headers)
      .map(([k, v]) => `  -H "${k}: ${v}"`)
      .join(' \\\n');
    const qs = Object.keys(parsed.queryParams).length
      ? '?' + Object.entries(parsed.queryParams).map(([k, v]) => `${k}=${v}`).join('&')
      : '';
    const rebuilt = `curl -X ${parsed.method} "${parsed.url}${qs}" \\\n${headers}${parsed.body ? ` \\\n  -d '${parsed.body}'` : ''}`;
    setCurl(rebuilt);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curl).catch(() => {});
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  // ── Field Mapping Actions ─────────────────────────────────────────────────

  const handleAutoMap = useCallback(() => {
    const result = autoMapFields(sourceFields, CRM_DESTINATION_FIELDS);
    setMappings(result.filter((mapping) => mapping.status === 'Auto'));
    setFocusedMappingId(null);
  }, [sourceFields]);

  const handleResetMapping = () => {
    setMappings([]);
    setFocusedMappingId(null);
  };

  const handleAddMapping = () => {
    const existingIds = new Set(mappings.map((mapping) => mapping.id));
    const nextField = autoMapFields(sourceFields, CRM_DESTINATION_FIELDS)
      .find((mapping) => !existingIds.has(mapping.id) && mapping.status !== 'Auto');
    if (!nextField) return;
    setStatusFilter('All');
    setFocusedMappingId(nextField.id);
    setMappings((prev) => [...prev, nextField]);
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

  const handleAddStaticField = () => {
    if (newStaticFields.length === 0) return;
    setStaticFields((prev) => [
      ...prev,
      ...newStaticFields.map((fieldKey, index) => {
        const destination = CRM_DESTINATION_FIELDS.find((field) => field.key === fieldKey);
        return { id: `sf-${Date.now()}-${index}`, fieldName: destination?.label || fieldKey, dataType: destination?.type || 'Type unavailable', value: (newStaticValues[fieldKey] || '').trim() };
      }),
    ]);
    setNewStaticFields([]);
    setNewStaticValues({});
    setShowStaticFieldForm(false);
  };

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
    setFormatMappings((prev) => [
      ...prev,
      { id: `fm-${Date.now()}`, crmField: '', detectedType: '', selectedFormat: '' },
    ]);
  };

  const updateFormatMapping = (id: string, updates: Partial<FormatMapping>) => {
    setFormatMappings((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      if (updates.crmField) {
        updated.detectedType = getCRMFieldType(updates.crmField);
        updated.selectedFormat = '';
      } else if (updates.selectedFormat && !getFormatOptions(updated.crmField).includes(updates.selectedFormat)) {
        updated.selectedFormat = '';
      }
      return updated;
    }));
  };

  const formatFields = CRM_DESTINATION_FIELDS.filter((field) => DATE_FIELD_TYPES.includes(field.type));

  // ── Default Values ────────────────────────────────────────────────────────

  const entityFields = CRM_DESTINATION_FIELDS.filter((field) => getDefaultEntity(field) === defaultEntity);
  const visibleDefaultFields = entityFields.filter((field) => {
    const matchesSearch = `${field.label} ${field.key}`.toLowerCase().includes(defaultSearch.toLowerCase());
    const matchesType = defaultFilter === 'All' || field.type === defaultFilter;
    const isConfigured = Boolean(draftDefaults[field.key]?.trim());
    return matchesSearch && matchesType && (!configuredOnly || isConfigured);
  });
  const openDefaultDrawer = (entity: DefaultEntity) => {
    const values = defaultValues.reduce<Record<string, string>>((result, value) => {
      if (value.crmField) result[value.crmField] = value.defaultValue;
      return result;
    }, {});
    setDefaultEntity(entity);
    setDraftDefaults(values);
    setDraftEntityOptionValues(entityOptionValues[entity]);
    setDefaultSearch('');
    setDefaultFilter('All');
    setConfiguredOnly(false);
    setDefaultDrawerOpen(true);
  };
  const clearAllDefaults = () => {
    setDraftDefaults((prev) => {
      const next = { ...prev };
      entityFields.forEach((field) => delete next[field.key]);
      return next;
    });
    setDraftEntityOptionValues({});
  };
  const saveDefaultChanges = () => {
    setEntityOptionValues((prev) => ({ ...prev, [defaultEntity]: draftEntityOptionValues }));
    setDefaultValues(Object.entries(draftDefaults)
      .filter(([, value]) => value.trim())
      .map(([crmField, defaultValue]) => ({
        id: `dv-${crmField}`,
        crmField,
        detectedType: getCRMFieldType(crmField),
        defaultValue,
      })));
    setDefaultDrawerOpen(false);
  };
  const configuredEntityOptionCount = (entity: DefaultEntity) => {
    const values = defaultDrawerOpen && defaultEntity === entity ? draftEntityOptionValues : entityOptionValues[entity];
    return ENTITY_OPTIONS[entity].filter((fieldName) => Boolean(values[fieldName]?.trim())).length;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const autoCount = mappings.filter((m) => m.status === 'Auto').length;
  const reviewCount = mappings.filter((m) => m.status === 'Needs Review').length;
  const unmappedCount = mappings.filter((m) => m.status === 'Unmapped').length;

  useEffect(() => {
    onConfigurationChange?.({
      curlConfigured: curlValid === true,
      mappingCount: mappings.filter((mapping) => mapping.sourceField && mapping.destinationField).length,
      staticFieldCount: staticFields.length,
      formatMappingCount: formatMappings.filter((mapping) => mapping.crmField).length,
      defaultValueCount: defaultValues.filter((value) => value.crmField && value.defaultValue).length,
    });
  }, [curlValid, mappings, staticFields, formatMappings, defaultValues, onConfigurationChange]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-foreground mb-1">Configure &amp; Map</h2>
        <p className="text-[13px] text-muted-foreground">
          Configure your API request and map {erp?.name} fields to CRM fields. Expand each section to configure.
        </p>
      </div>

      <div className="space-y-3">

        {/* ── Card 1: API Request (CURL) ─────────────────────────────────── */}
        <CollapsibleCard
          id="card-curl"
          title="API Request"
          subtitle="CURL editor — primary API configuration method"
          icon={<Terminal size={15} />}
          defaultOpen={true}
          badge={curlValid === true ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Valid CURL</span>
          ) : curlValid === false ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">Invalid</span>
          ) : undefined}
        >
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={curl}
                onChange={(e) => { setCurl(e.target.value); setCurlValid(null); }}
                rows={6}
                spellCheck={false}
                className="w-full px-3 py-3 text-[12px] font-mono bg-gray-950 text-green-400 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y leading-relaxed"
                placeholder="curl -X GET &quot;https://your-api.com/endpoint&quot; \&#10;  -H &quot;Authorization: Bearer {token}&quot; \&#10;  -H &quot;Content-Type: application/json&quot;"
              />
            </div>
            {curlValid === false && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
                <p className="text-[11px] text-red-700">Invalid CURL — must start with &quot;curl&quot; and include a valid URL.</p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleValidateCurl}
                disabled={!curl.trim() || curlValidating}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {curlValidating ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                {curlValidating ? 'Validating...' : 'Validate CURL'}
              </button>
              <button
                onClick={handleRebuildCurl}
                disabled={!parsed}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-40"
              >
                <RefreshCw size={11} />
                Rebuild CURL from Fields
              </button>
              <button
                onClick={handleCopyCurl}
                disabled={!curl.trim()}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-40"
              >
                {curlCopied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                {curlCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </CollapsibleCard>

        {/* ── Card 2: Parsed Request ─────────────────────────────────────── */}
        <CollapsibleCard
          id="card-parsed"
          title="Parsed Request"
          subtitle="Auto-parsed HTTP method, URL, headers, query params and body"
          icon={<Code2 size={15} />}
          badge={parsed ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">Parsed</span>
          ) : undefined}
        >
          {!parsed ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border">
              <Info size={14} className="text-muted-foreground flex-shrink-0" />
              <p className="text-[12px] text-muted-foreground">Validate a CURL above to auto-parse the request details here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">HTTP Method</p>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${parsed.method === 'GET' ? 'bg-green-100 text-green-700' : parsed.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {parsed.method}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">URL</p>
                  <p className="text-[11px] font-mono text-foreground break-all">{parsed.url}</p>
                </div>
              </div>

              {Object.keys(parsed.queryParams).length > 0 && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Query Parameters</p>
                  <div className="space-y-1">
                    {Object.entries(parsed.queryParams).map(([k, v]) => (
                      <div key={`qp-${k}`} className="flex items-center gap-2 text-[11px]">
                        <span className="font-mono font-semibold text-primary">{k}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="font-mono text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(parsed.headers).length > 0 && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Headers</p>
                  <div className="space-y-1">
                    {Object.entries(parsed.headers).map(([k, v]) => (
                      <div key={`hdr-${k}`} className="flex items-start gap-2 text-[11px]">
                        <span className="font-mono font-semibold text-primary flex-shrink-0">{k}:</span>
                        <span className="font-mono text-foreground break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.body && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Body</p>
                  <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all">{parsed.body}</pre>
                </div>
              )}
            </div>
          )}
        </CollapsibleCard>

        {/* ── Card 3: Field Mapping ──────────────────────────────────────── */}
        <CollapsibleCard
          id="card-mapping"
          title="Field Mapping"
          subtitle="Map source ERP fields to CRM destination fields"
          icon={<GitBranch size={15} />}
          badge={mappings.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">{autoCount} Auto</span>
              {reviewCount > 0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">{reviewCount} Review</span>}
              {unmappedCount > 0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">{unmappedCount} Unmapped</span>}
            </div>
          ) : undefined}
        >
          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mb-4 flex-wrap">
            <button
              onClick={handleAutoMap}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              <Wand2 size={11} />
              Auto Map
            </button>
            <button
              onClick={handleResetMapping}
              disabled={mappings.length === 0}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-40"
            >
              <RotateCcw size={11} />
              Reset Mapping
            </button>
          </div>

          {mappings.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
              <Wand2 size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-foreground mb-1">No mappings yet</p>
              <p className="text-[11px] text-muted-foreground">Click &quot;Auto Map&quot; to automatically match {erp?.name} fields with CRM fields</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_144px_100px_24px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border items-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Data Type</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Source Field</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CRM Destination</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Validation</p>
                <label className="flex flex-col gap-1 text-[9px] font-semibold text-muted-foreground" htmlFor="mapping-status-filter">
                  <select
                    id="mapping-status-filter"
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
                {visibleMappings.map((m) => {
                  return (
                  <div key={m.id} className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_144px_100px_24px] gap-3 px-4 py-2 items-center hover:bg-muted/20 group">
                    <span className="text-[10px] font-semibold text-muted-foreground">{m.dataType}</span>
                    <select
                      ref={(element) => { mappingFieldRefs.current[m.id] = element; }}
                      value={m.sourceField}
                      onChange={(e) => updateMapping(m.id, { sourceField: e.target.value })}
                      className="min-w-0 h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="">Select source...</option>
                      {sourceFields.map((f) => <option key={`src-${f}`} value={f}>{f}</option>)}
                    </select>
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
                  );
                })}
                {visibleMappings.length === 0 && <p className="px-4 py-5 text-center text-[11px] text-muted-foreground">No fields match this status.</p>}
              </div>
              <div className="flex justify-end border-t border-border px-4 py-3">
                <button
                  onClick={handleAddMapping}
                  className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all"
                >
                  <Plus size={11} />
                  Add Field Mapping
                </button>
              </div>
            </div>
          )}
        </CollapsibleCard>

        {/* ── Card 4: Static Fields ──────────────────────────────────────── */}
        <CollapsibleCard
          id="card-static"
          title="Static Fields"
          subtitle="Fields with fixed values applied to every synced record"
          icon={<Tag size={15} />}
          badge={staticFields.length > 0 ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">{staticFields.length} field{staticFields.length !== 1 ? 's' : ''}</span>
          ) : undefined}
        >
          <div className="space-y-3">
            {staticFields.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden mb-3">
                <div className="grid grid-cols-[100px_1fr_1fr_28px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Data Type</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Name</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Value</p>
                  <p></p>
                </div>
                <div className="divide-y divide-border">
                  {staticFields.map((sf) => (
                    <div key={sf.id} className="grid grid-cols-[100px_1fr_1fr_28px] gap-2 px-4 py-2.5 items-center group">
                      <p className="text-[10px] font-semibold text-muted-foreground">{sf.dataType}</p>
                      <p className="text-[12px] font-medium text-foreground">{sf.fieldName}</p>
                      <p className="text-[12px] font-mono text-primary">{sf.value || '—'}</p>
                      <button onClick={() => setStaticFields((prev) => prev.filter((f) => f.id !== sf.id))} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowStaticFieldForm(true)}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
              >
                <Plus size={11} />
                Add Static Field
              </button>
            </div>
            <Modal
              open={showStaticFieldForm}
              onClose={() => setShowStaticFieldForm(false)}
              title="Add Static Field"
              subtitle="Select CRM fields and enter a default value for each one."
              size="lg"
              footer={(
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowStaticFieldForm(false)} className="h-8 px-3 text-[11px] font-medium border border-border rounded-lg hover:bg-muted">Cancel</button>
                  <button onClick={handleAddStaticField} disabled={newStaticFields.length === 0} title={newStaticFields.length === 0 ? 'Select one or more CRM fields' : undefined} className="h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">Add Field{newStaticFields.length > 1 ? ` (${newStaticFields.length})` : ''}</button>
                </div>
              )}
            >
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] gap-3 px-3 py-2.5 bg-muted/50 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CRM Field</p>
                  <span aria-hidden="true" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Value</p>
                </div>
                <div className="divide-y divide-border">
                  {CRM_DESTINATION_FIELDS.map((field) => {
                    const selected = newStaticFields.includes(field.key);
                    return (
                      <div key={`static-${field.key}`} className={`grid grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] gap-3 px-3 py-2 items-center transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                        <label className="flex min-w-0 items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => setNewStaticFields((prev) => selected ? prev.filter((key) => key !== field.key) : [...prev, field.key])}
                            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/30"
                          />
                          <span className="min-w-0 text-[11px] font-medium text-foreground truncate">{field.label}</span>
                        </label>
                        <ArrowRight size={14} className={`mx-auto ${selected ? 'text-primary' : 'text-muted-foreground/40'}`} aria-hidden="true" />
                        <input
                          type="text"
                          placeholder={selected ? 'Enter default value' : 'Select field first'}
                          value={newStaticValues[field.key] || ''}
                          onChange={(e) => setNewStaticValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          disabled={!selected}
                          className="w-full h-8 px-2.5 text-[12px] bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary disabled:bg-muted/40 disabled:text-muted-foreground"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Modal>
          </div>
        </CollapsibleCard>

        {/* ── Card 5: Fields Format Mapping ─────────────────────────────── */}
        <CollapsibleCard
          id="card-format"
          title="Fields Format Mapping"
          subtitle="Select CRM field, auto-detect type, then choose appropriate format"
          icon={<Hash size={15} />}
          badge={formatMappings.length > 0 ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-cyan-50 text-cyan-700 border-cyan-200">{formatMappings.length} format{formatMappings.length !== 1 ? 's' : ''}</span>
          ) : undefined}
        >
          <div className="space-y-3">
            {formatMappings.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden mb-3">
                <div className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">CRM Field</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Type</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Format</p>
                  <p></p>
                </div>
                <div className="divide-y divide-border">
                  {formatMappings.map((fm) => (
                    <div key={fm.id} className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 px-4 py-2 items-center group">
                      <select
                        value={fm.crmField}
                        onChange={(e) => updateFormatMapping(fm.id, { crmField: e.target.value })}
                        className="h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        <option value="">Select field...</option>
                        {formatFields.map((f) => <option key={`fmt-${f.key}`} value={f.key}>{f.label}</option>)}
                      </select>
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-center">
                        {fm.detectedType || '—'}
                      </span>
                      <select
                        value={fm.selectedFormat}
                        onChange={(e) => updateFormatMapping(fm.id, { selectedFormat: e.target.value })}
                        disabled={!fm.detectedType}
                        className="h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                      >
                        <option value="">Select format...</option>
                        {getFormatOptions(fm.crmField).map((fmt) => (
                          <option key={`fmt-opt-${fmt}`} value={fmt}>{fmt}</option>
                        ))}
                      </select>
                      <button onClick={() => setFormatMappings((prev) => prev.filter((f) => f.id !== fm.id))} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
            <button
              onClick={handleAddFormatMapping}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              <Plus size={11} />
              Add Format Mapping
            </button>
            </div>
          </div>
        </CollapsibleCard>

        {/* ── Card 6: Default Values ─────────────────────────────────────── */}
        <CollapsibleCard
          id="card-defaults"
          title="Default Values"
          subtitle="Fallback values used only when the source field is empty or null"
          icon={<Settings2 size={15} />}
          badge={defaultValues.length > 0 ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">{defaultValues.length} configured</span>
          ) : undefined}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 mb-3">
              <Info size={12} className="text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">Default values are applied <strong>only</strong> when the source field is empty or null. They do not override existing values.</p>
            </div>
            <div role="tablist" aria-label="CRM entities" className="flex flex-wrap border-b border-border">
              {DEFAULT_ENTITIES.map((entity) => (
                <button key={entity} role="tab" aria-selected={defaultEntity === entity} onClick={() => openDefaultDrawer(entity)} className={`flex-1 min-w-[150px] px-4 py-3 text-left border-b-2 transition-colors ${defaultEntity === entity ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/40'}`}>
                  <div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-foreground">{entity}</span><span className="text-[10px] text-muted-foreground">{ENTITY_OPTIONS[entity].length} fields</span></div>
                  <span className={`block text-[10px] mt-1 ${configuredEntityOptionCount(entity) > 0 ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>{configuredEntityOptionCount(entity)} Configured</span>
                </button>
              ))}
            </div>

            {defaultDrawerOpen && (
              <div className="fixed inset-0 z-50 bg-black/30" role="dialog" aria-modal="true" aria-label={`${defaultEntity} default values`}>
                <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-card shadow-2xl flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Default values</p><h3 className="text-[17px] font-bold text-foreground mt-1">{defaultEntity}</h3><p className="text-[11px] text-muted-foreground mt-0.5">Set fallbacks for empty or null source values.</p></div><button onClick={() => setDefaultDrawerOpen(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"><X size={17} /></button></div>
                  <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]"><Search size={14} className="absolute left-2.5 top-2 text-muted-foreground" /><input value={defaultSearch} onChange={(e) => setDefaultSearch(e.target.value)} placeholder="Search fields" className="w-full h-8 pl-8 pr-2 text-[11px] bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" /></div>
                    <div className="relative"><Filter size={13} className="absolute left-2.5 top-2 text-muted-foreground" /><select value={defaultFilter} onChange={(e) => setDefaultFilter(e.target.value as 'All' | CRMFieldType)} className="h-8 pl-7 pr-7 text-[11px] bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"><option value="All">All types</option>{Array.from(new Set(entityFields.map((field) => field.type))).map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
                    <label className="flex items-center gap-2 h-8 px-2.5 text-[11px] text-muted-foreground border border-border rounded-lg cursor-pointer hover:bg-muted/40"><input type="checkbox" checked={configuredOnly} onChange={(e) => setConfiguredOnly(e.target.checked)} className="accent-primary" />Configured Only</label>
                  </div>
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="rounded-xl border border-border overflow-hidden mb-4"><div className="grid grid-cols-[minmax(180px,1fr)_32px_minmax(210px,1fr)_110px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Name</p><span /><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Default Value</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</p></div><div className="divide-y divide-border">{ENTITY_OPTIONS[defaultEntity].map((fieldName) => { const value = draftEntityOptionValues[fieldName] || ''; const isConfigured = Boolean(value.trim()); return (<div key={fieldName} className="grid grid-cols-[minmax(180px,1fr)_32px_minmax(210px,1fr)_110px] gap-3 px-4 py-2.5 items-center hover:bg-muted/20"><p className="text-[12px] font-medium text-foreground truncate">{fieldName}</p><ArrowRight size={14} className="mx-auto text-primary" aria-hidden="true" /><input type="text" value={value} onChange={(e) => setDraftEntityOptionValues((prev) => ({ ...prev, [fieldName]: e.target.value }))} placeholder="Enter default value" className="w-full h-8 px-2.5 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30" /><span className={`text-[10px] font-semibold ${isConfigured ? 'text-green-600' : 'text-muted-foreground'}`}>{isConfigured ? 'Configured' : 'Not Configured'}</span></div>); })}</div></div>
                    <div className="hidden min-w-[620px] rounded-xl border border-border overflow-hidden"><div className="grid grid-cols-[minmax(180px,1fr)_100px_minmax(210px,1fr)_100px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Name</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Data Type</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Default Value</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</p></div>
                    <div className="divide-y divide-border">{visibleDefaultFields.map((field) => { const value = draftDefaults[field.key] || ''; const controlType = getDefaultControlType(field.type); const isConfigured = Boolean(value.trim()); const options = field.options || []; return (<div key={field.key} className="grid grid-cols-[minmax(180px,1fr)_100px_minmax(210px,1fr)_100px] gap-3 px-4 py-2.5 items-center hover:bg-muted/20"><div className="min-w-0"><p className="text-[12px] font-medium text-foreground truncate">{field.label}</p><p className="text-[10px] text-muted-foreground truncate">{field.key}</p></div><span className="text-[10px] font-semibold text-muted-foreground">{field.type}</span>{field.type === 'Boolean' ? (<button type="button" onClick={() => setDraftDefaults((prev) => ({ ...prev, [field.key]: value === 'true' ? 'false' : 'true' }))} className={`w-9 h-5 rounded-full relative transition-colors ${value === 'true' ? 'bg-primary' : 'bg-gray-300'}`} aria-label={`Set ${field.label}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${value === 'true' ? 'left-[18px]' : 'left-0.5'}`} /></button>) : field.type === 'Picklist' ? (<select value={value} onChange={(e) => setDraftDefaults((prev) => ({ ...prev, [field.key]: e.target.value }))} className="h-8 px-2 text-[11px] bg-card border border-border rounded-md"><option value="">Select value...</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>) : field.type === 'Multi-select' ? (<select multiple value={value ? value.split(',') : []} onChange={(e) => setDraftDefaults((prev) => ({ ...prev, [field.key]: Array.from(e.target.selectedOptions).map((option) => option.value).join(',') }))} className="h-12 px-2 text-[11px] bg-card border border-border rounded-md">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>) : (<div className="relative"><input type={controlType} value={value} onChange={(e) => setDraftDefaults((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder="Enter default value" className="w-full h-8 px-2.5 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30" />{(field.type === 'Date' || field.type === 'DateTime') && <Calendar size={13} className="absolute right-2 top-2 text-muted-foreground pointer-events-none" />}</div>)}<span className={`text-[10px] font-semibold ${isConfigured ? 'text-green-600' : 'text-muted-foreground'}`}>{isConfigured ? 'Configured' : 'Not configured'}</span></div>); })}{visibleDefaultFields.length === 0 && <p className="px-4 py-8 text-center text-[11px] text-muted-foreground">No fields match the selected filters.</p>}</div></div></div>
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border"><button onClick={clearAllDefaults} className="text-[11px] font-semibold text-red-600 hover:text-red-700">Clear All</button><div className="flex gap-2"><button onClick={() => setDefaultDrawerOpen(false)} className="h-8 px-3 text-[11px] font-medium border border-border rounded-lg hover:bg-muted">Cancel</button><button onClick={saveDefaultChanges} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90"><Save size={12} /> Save Changes</button></div></div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleCard>

      </div>
    </div>
  );
}
