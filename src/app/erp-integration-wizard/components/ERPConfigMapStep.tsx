'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Terminal, Code2, GitBranch, Tag, Hash, Settings2,
  ChevronDown, ChevronUp, CheckCircle, Loader2, RefreshCw,
  Plus, Trash2, Wand2, RotateCcw, Copy, Check, AlertTriangle, Info, X,
  Search, Filter, Save, ArrowRight, Layers, Download, Upload
} from 'lucide-react';
import { ERPId, ERP_MAP, CRM_DESTINATION_FIELDS, FIELD_TYPE_FORMATS, CRMFieldType } from './erpRegistry';
import { downloadDefaultValuesTemplate, parseDefaultValuesWorkbook } from './defaultValuesWorkbook';

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

const getCRMFieldType = (fieldKey: string): string =>
  CRM_DESTINATION_FIELDS.find((field) => field.key === fieldKey)?.type || 'Type unavailable';

const DATE_FIELD_TYPES: CRMFieldType[] = ['Date', 'DateTime'];

const getFormatOptions = (fieldKey: string): string[] => {
  const type = getCRMFieldType(fieldKey);
  return DATE_FIELD_TYPES.includes(type as CRMFieldType) ? FIELD_TYPE_FORMATS[type] || [] : [];
};

// ─── Default Values: entities ─────────────────────────────────────────────────

const DEFAULT_ENTITIES = ['Entity 1', 'Entity 2', 'Entity 3', 'Entity 4'] as const;

const ENTITY_OPTIONS: Record<string, string[]> = {
  'Entity 1': ['MSc Mathematics', 'Need Counselling', 'PG Diploma in Computer Application', 'PG Diploma in Accounts & Finance', 'PG Diploma in Administration & Public Policy'],
  'Entity 2': ['1100', '1102', '1101', '1098', '1099'],
  'Entity 3': ['PG Diploma in Chemical Sciences', 'PG Diploma in Physical Sciences', 'PG Diploma in Mathematics', 'PG Diploma in Economics', 'Electronics Engineering (VLSI)', 'Cyber Security'],
  'Entity 4': ['B.Tech ME-Lateral Entry', 'B.Sc', 'M.A. Economics', 'B. Pharma', 'M.A. Hindi', 'Diploma EE-Lateral Entry', 'PhD Agriculture', 'M.Sc Biotechnology', 'PGDLAN', 'B.Sc Defense Strategic Studies'],
};

// Pool of additional fields offered from the "Add Field" dropdown. Extend this
// array to support more fields in the future — each newly added field gets the
// exact same side-panel, search, status filter, and save behaviour as Entity 1–4.
const ADDITIONAL_FIELD_POOL: { name: string; options: string[] }[] = [
  { name: 'Lead Channel', options: ['Organic', 'Paid Ads', 'Referral', 'Partner Network', 'Direct', 'Event / Webinar'] },
  { name: 'Lead Source', options: ['Website Form', 'Facebook', 'Google Ads', 'JustDial', 'Walk-in', 'Cold Call'] },
  { name: 'Lead Campaign', options: ['Diwali Admissions 2026', 'New Year Enrollment Drive', 'Summer Batch Promo', 'Referral Bonus Campaign'] },
  { name: 'Lead Medium', options: ['Email', 'SMS', 'WhatsApp', 'Social Media', 'Phone Call', 'Print Ad'] },
];

const ENTITY_ICONS = [Layers, Hash, Tag, Settings2];

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

// Consistent Data Type coloring — reused everywhere a Data Type is shown
// (Field Mapping rows, Static Fields rows, Fields Format Mapping badges).
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
    <div className="rounded-xl border border-border bg-card overflow-visible">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
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
      {open && <div className="border-t border-border px-5 py-5 rounded-b-xl">{children}</div>}
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
  const staticFieldRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const [focusedStaticFieldId, setFocusedStaticFieldId] = useState<string | null>(null);

  // Card 5: Format Mapping
  const [formatMappings, setFormatMappings] = useState<FormatMapping[]>([]);

  // Card 6: Default Values
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [entityOptionsMap, setEntityOptionsMap] = useState<Record<string, string[]>>({ ...ENTITY_OPTIONS });
  const [defaultEntity, setDefaultEntity] = useState<string>('Entity 1');
  const [defaultDrawerOpen, setDefaultDrawerOpen] = useState(false);
  const [defaultSearch, setDefaultSearch] = useState('');
  const [defaultStatusFilter, setDefaultStatusFilter] = useState<'All' | 'Configured' | 'Not Configured'>('All');
  const [defaultUploadMessage, setDefaultUploadMessage] = useState<string | null>(null);
  const [entityOptionValues, setEntityOptionValues] = useState<Record<string, Record<string, string>>>({
    'Entity 1': {},
    'Entity 2': {},
    'Entity 3': {},
    'Entity 4': {},
  });
  const [draftEntityOptionValues, setDraftEntityOptionValues] = useState<Record<string, string>>({});
  const [addFieldMenuOpen, setAddFieldMenuOpen] = useState(false);
  const addFieldMenuRef = useRef<HTMLDivElement>(null);
  const defaultFileInputRef = useRef<HTMLInputElement>(null);

  const entities = useMemo(() => [...DEFAULT_ENTITIES, ...customFields], [customFields]);

  useEffect(() => {
    if (!addFieldMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (addFieldMenuRef.current?.contains(event.target as Node)) return;
      setAddFieldMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [addFieldMenuOpen]);

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

  // API/request fields already consumed — either mapped (auto/manual) in
  // Field Mapping or used by a Static Field row. Shared across both sections
  // so the same field can never be configured twice.
  const usedSourceFields = useMemo(
    () => new Set([...mappings.map((m) => m.sourceField), ...staticFields.map((sf) => sf.sourceField)].filter(Boolean)),
    [mappings, staticFields],
  );

  const sourceFieldOptionsFor = (currentValue: string) => {
    const options = sourceFields.filter((f) => f === currentValue || !usedSourceFields.has(f));
    return currentValue && !options.includes(currentValue) ? [currentValue, ...options] : options;
  };

  // Best-guess CRM data type for a raw API field, using the same alias
  // matching Auto Map uses — shown (and colored) as that field's Data Type.
  const detectDataType = (field: string): string => {
    if (!field) return '';
    const suggestion = autoMapFields([field], CRM_DESTINATION_FIELDS)[0];
    return suggestion?.destinationField ? getCRMFieldType(suggestion.destinationField) : 'String';
  };

  const handleAutoMap = useCallback(() => {
    const result = autoMapFields(sourceFields, CRM_DESTINATION_FIELDS);
    setMappings(result.filter((mapping) => mapping.status === 'Auto'));
    setFocusedMappingId(null);
  }, [sourceFields]);

  const handleResetMapping = () => {
    setMappings([]);
    setFocusedMappingId(null);
  };

  const handleAddMappingRow = () => {
    const newMapping: FieldMapping = {
      id: `map-manual-${Date.now()}`,
      sourceField: '',
      destinationField: '',
      dataType: '',
      status: 'Manual',
    };
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
      }
      return updated;
    }));
  };

  const formatFields = CRM_DESTINATION_FIELDS.filter((field) => DATE_FIELD_TYPES.includes(field.type));

  // ── Default Values ────────────────────────────────────────────────────────

  const currentEntityOptions = entityOptionsMap[defaultEntity] || [];
  const visibleEntityOptions = currentEntityOptions.filter((fieldName) => {
    const matchesSearch = fieldName.toLowerCase().includes(defaultSearch.toLowerCase());
    const isConfigured = Boolean(draftEntityOptionValues[fieldName]?.trim());
    const matchesStatus = defaultStatusFilter === 'All'
      || (defaultStatusFilter === 'Configured' && isConfigured)
      || (defaultStatusFilter === 'Not Configured' && !isConfigured);
    return matchesSearch && matchesStatus;
  });

  const openDefaultDrawer = (entity: string) => {
    setDefaultEntity(entity);
    setDraftEntityOptionValues(entityOptionValues[entity] || {});
    setDefaultSearch('');
    setDefaultStatusFilter('All');
    setDefaultDrawerOpen(true);
  };
  const clearAllDefaults = () => setDraftEntityOptionValues({});
  const saveDefaultChanges = () => {
    setEntityOptionValues((prev) => ({ ...prev, [defaultEntity]: draftEntityOptionValues }));
    setDefaultDrawerOpen(false);
  };
  const handleDefaultValuesUpload = async (file: File) => {
    try {
      const uploadedRows = await parseDefaultValuesWorkbook(file);
      if (uploadedRows.length === 0) throw new Error('No default values were found in the uploaded file.');
      const uploadedNames = uploadedRows.map((row) => row.fieldName);
      setEntityOptionsMap((prev) => ({
        ...prev,
        [defaultEntity]: Array.from(new Set([...(prev[defaultEntity] || []), ...uploadedNames])),
      }));
      const uploadedValues = uploadedRows.reduce<Record<string, string>>((values, row) => {
        values[row.fieldName] = row.defaultValue;
        return values;
      }, {});
      setDraftEntityOptionValues((prev) => ({ ...prev, ...uploadedValues }));
      setDefaultUploadMessage(`${uploadedRows.length} value${uploadedRows.length === 1 ? '' : 's'} uploaded.`);
    } catch (error) {
      setDefaultUploadMessage(error instanceof Error ? error.message : 'Unable to read this workbook.');
    }
  };
  const configuredEntityOptionCount = (entity: string) => {
    const values = defaultDrawerOpen && defaultEntity === entity ? draftEntityOptionValues : (entityOptionValues[entity] || {});
    return (entityOptionsMap[entity] || []).filter((fieldName) => Boolean(values[fieldName]?.trim())).length;
  };

  const availableAdditionalFields = ADDITIONAL_FIELD_POOL.filter((field) => !entities.includes(field.name));

  const addCustomField = (fieldName: string) => {
    const field = ADDITIONAL_FIELD_POOL.find((candidate) => candidate.name === fieldName);
    if (!field) return;
    setCustomFields((prev) => [...prev, field.name]);
    setEntityOptionsMap((prev) => ({ ...prev, [field.name]: field.options }));
    setEntityOptionValues((prev) => ({ ...prev, [field.name]: {} }));
    setAddFieldMenuOpen(false);
  };

  const removeCustomField = (fieldName: string) => {
    setCustomFields((prev) => prev.filter((name) => name !== fieldName));
    setEntityOptionsMap((prev) => { const next = { ...prev }; delete next[fieldName]; return next; });
    setEntityOptionValues((prev) => { const next = { ...prev }; delete next[fieldName]; return next; });
    if (defaultEntity === fieldName) { setDefaultDrawerOpen(false); setDefaultEntity('Entity 1'); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const autoCount = mappings.filter((m) => m.status === 'Auto').length;
  const reviewCount = mappings.filter((m) => m.status === 'Needs Review').length;
  const unmappedCount = mappings.filter((m) => m.status === 'Unmapped').length;

  const totalDefaultValueCount = useMemo(
    () => entities.reduce((sum, entity) => sum + configuredEntityOptionCount(entity), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entities, entityOptionValues, draftEntityOptionValues, defaultDrawerOpen, defaultEntity, entityOptionsMap],
  );

  useEffect(() => {
    onConfigurationChange?.({
      curlConfigured: curlValid === true,
      mappingCount: mappings.filter((mapping) => mapping.sourceField && mapping.destinationField).length,
      staticFieldCount: staticFields.length,
      formatMappingCount: formatMappings.filter((mapping) => mapping.crmField).length,
      defaultValueCount: totalDefaultValueCount,
    });
  }, [curlValid, mappings, staticFields, formatMappings, totalDefaultValueCount, onConfigurationChange]);

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
              <p className="text-[11px] text-muted-foreground mb-4">Click &quot;Auto Map&quot; to automatically match {erp?.name} fields, or add a mapping manually.</p>
              <button
                onClick={handleAddMappingRow}
                className="flex items-center gap-1.5 h-8 px-3 mx-auto text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all"
              >
                <Plus size={11} />
                Add Field Mapping
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
                  );
                })}
                {visibleMappings.length === 0 && <p className="px-4 py-5 text-center text-[11px] text-muted-foreground">No fields match this status.</p>}
              </div>
              <div className="flex justify-end border-t border-border px-4 py-3">
                <button
                  onClick={handleAddMappingRow}
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
          {staticFields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
              <Tag size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-foreground mb-1">No static fields yet</p>
              <p className="text-[11px] text-muted-foreground mb-4">Pick an unmapped API field and give it a fixed value applied to every synced record.</p>
              <button
                onClick={handleAddStaticFieldRow}
                className="flex items-center gap-1.5 h-8 px-3 mx-auto text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all"
              >
                <Plus size={11} />
                Add Static Field
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
                <button
                  onClick={handleAddStaticFieldRow}
                  className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all"
                >
                  <Plus size={11} />
                  Add Static Field
                </button>
              </div>
            </div>
          )}
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
                      <DataTypeBadge type={fm.detectedType} />
                      <input
                        list={`format-options-${fm.id}`}
                        value={fm.selectedFormat}
                        onChange={(e) => updateFormatMapping(fm.id, { selectedFormat: e.target.value })}
                        placeholder="Select or type format..."
                        disabled={!fm.detectedType}
                        className="w-full h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <datalist id={`format-options-${fm.id}`}>
                        {getFormatOptions(fm.crmField).map((fmt) => (
                          <option key={`fmt-opt-${fmt}`} value={fmt} />
                        ))}
                      </datalist>
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
          badge={totalDefaultValueCount > 0 ? (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">{totalDefaultValueCount} configured</span>
          ) : undefined}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 mb-1">
              <Info size={12} className="text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">Default values are applied <strong>only</strong> when the source field is empty or null. They do not override existing values.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {entities.map((entity, index) => {
                const Icon = ENTITY_ICONS[index % ENTITY_ICONS.length];
                const configuredCount = configuredEntityOptionCount(entity);
                const isCustom = customFields.includes(entity);
                return (
                  <button
                    key={entity}
                    type="button"
                    onClick={() => openDefaultDrawer(entity)}
                    className="relative text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
                  >
                    {isCustom && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); removeCustomField(entity); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeCustomField(entity); } }}
                        className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label={`Remove ${entity}`}
                      >
                        <X size={12} />
                      </span>
                    )}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{entity}</p>
                        <p className="text-[10px] text-muted-foreground">5 values</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${configuredCount > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {configuredCount} Configured
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Configure <ArrowRight size={11} />
                      </span>
                    </div>
                  </button>
                );
              })}

              <div ref={addFieldMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAddFieldMenuOpen((v) => !v)}
                  className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all p-4 min-h-[104px]"
                >
                  <Plus size={18} />
                  <span className="text-[12px] font-semibold">Add Field</span>
                </button>
                {addFieldMenuOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-lg py-1.5 max-h-64 overflow-y-auto">
                    {availableAdditionalFields.length === 0 ? (
                      <p className="px-3 py-3 text-[11px] text-muted-foreground text-center">All additional fields have been added.</p>
                    ) : availableAdditionalFields.map((field) => (
                      <button
                        key={field.name}
                        type="button"
                        onClick={() => addCustomField(field.name)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {field.name}
                        <Plus size={12} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {defaultDrawerOpen && (
              <div className="fixed inset-0 z-50 bg-black/30" role="dialog" aria-modal="true" aria-label={`${defaultEntity} default values`}>
                <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-card shadow-2xl flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Default values</p>
                      <h3 className="text-[17px] font-bold text-foreground mt-1">{defaultEntity}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Set fallbacks for empty or null source values.</p>
                    </div>
                    <button onClick={() => setDefaultDrawerOpen(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"><X size={17} /></button>
                  </div>
                  <div className="px-6 py-3 border-b border-border flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 w-full rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground">Bulk Upload</p>
                        <p className="text-[10px] text-muted-foreground">Add Field Name and Default Value rows to {defaultEntity}.</p>
                      </div>
                      <input
                        ref={defaultFileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleDefaultValuesUpload(file);
                          event.target.value = '';
                        }}
                      />
                      <button type="button" onClick={downloadDefaultValuesTemplate} title="Download Excel template" className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted">
                        <Download size={14} />
                      </button>
                      <button type="button" onClick={() => defaultFileInputRef.current?.click()} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-card border border-border rounded-lg hover:bg-muted">
                        <Upload size={13} />Excel Upload
                      </button>
                    </div>
                    {defaultUploadMessage && <p className="w-full text-[11px] text-primary">{defaultUploadMessage}</p>}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search size={14} className="absolute left-2.5 top-2 text-muted-foreground" />
                      <input value={defaultSearch} onChange={(e) => setDefaultSearch(e.target.value)} placeholder="Search fields" className="w-full h-8 pl-8 pr-2 text-[11px] bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="relative">
                      <Filter size={13} className="absolute left-2.5 top-2 text-muted-foreground" />
                      <select value={defaultStatusFilter} onChange={(e) => setDefaultStatusFilter(e.target.value as 'All' | 'Configured' | 'Not Configured')} className="h-8 pl-7 pr-7 text-[11px] bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30">
                        <option value="All">All Status</option>
                        <option value="Configured">Configured</option>
                        <option value="Not Configured">Not Configured</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="grid grid-cols-[minmax(180px,1fr)_32px_minmax(210px,1fr)_110px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Field Name</p>
                        <span />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Default Value</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</p>
                      </div>
                      <div className="divide-y divide-border">
                        {visibleEntityOptions.map((fieldName) => {
                          const value = draftEntityOptionValues[fieldName] || '';
                          const isConfigured = Boolean(value.trim());
                          return (
                            <div key={fieldName} className="grid grid-cols-[minmax(180px,1fr)_32px_minmax(210px,1fr)_110px] gap-3 px-4 py-2.5 items-center hover:bg-muted/20">
                              <p className="text-[12px] font-medium text-foreground truncate">{fieldName}</p>
                              <ArrowRight size={14} className="mx-auto text-primary" aria-hidden="true" />
                              <input type="text" value={value} onChange={(e) => setDraftEntityOptionValues((prev) => ({ ...prev, [fieldName]: e.target.value }))} placeholder="Enter default value" className="w-full h-8 px-2.5 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30" />
                              <span className={`text-[10px] font-semibold ${isConfigured ? 'text-green-600' : 'text-muted-foreground'}`}>{isConfigured ? 'Configured' : 'Not Configured'}</span>
                            </div>
                          );
                        })}
                        {visibleEntityOptions.length === 0 && <p className="px-4 py-8 text-center text-[11px] text-muted-foreground">No fields match the selected search &amp; filter.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <button onClick={clearAllDefaults} className="text-[11px] font-semibold text-red-600 hover:text-red-700">Clear All</button>
                    <div className="flex gap-2">
                      <button onClick={() => setDefaultDrawerOpen(false)} className="h-8 px-3 text-[11px] font-medium border border-border rounded-lg hover:bg-muted">Cancel</button>
                      <button onClick={saveDefaultChanges} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90"><Save size={12} /> Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleCard>

      </div>
    </div>
  );
}
