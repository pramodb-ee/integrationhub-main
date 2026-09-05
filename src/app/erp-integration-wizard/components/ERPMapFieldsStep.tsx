'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, Plus, Trash2, ChevronDown, Tag, Hash, CheckCircle, X } from 'lucide-react';
import { ERPSystem } from './ERPSelectStep';

type Operation = 'add' | 'update' | 'append';

interface FieldMapping {
  id: string;
  sourceField: string;
  destinationField: string;
  operations: Operation[];
  mandatory: boolean;
  isStatic?: boolean;
  staticValue?: string;
}

const ERP_SOURCE_FIELDS: Record<ERPSystem, string[]> = {
  'sap-s4hana': ['BusinessPartner', 'FirstName', 'LastName', 'EmailAddress', 'PhoneNumber', 'CompanyCode', 'SalesOrg', 'CustomerGroup', 'Country', 'Region', 'PostalCode', 'CreatedAt'],
  'oracle-netsuite': ['entityId', 'firstName', 'lastName', 'email', 'phone', 'company', 'subsidiary', 'salesRep', 'leadSource', 'status', 'dateCreated'],
  'ms-dynamics-365': ['contactid', 'firstname', 'lastname', 'emailaddress1', 'mobilephone', 'telephone1', 'accountid', 'ownerid', 'leadsourcecode', 'statecode', 'createdon'],
  'odoo': ['id', 'name', 'email', 'phone', 'mobile', 'partner_name', 'user_id', 'team_id', 'source_id', 'medium_id', 'campaign_id', 'create_date'],
  'tallyprime': ['LedgerName', 'Email', 'Phone', 'Address', 'City', 'State', 'PinCode', 'GSTNumber', 'OpeningBalance', 'Date'],
  'zoho-erp': ['Contact_Id', 'First_Name', 'Last_Name', 'Email', 'Phone', 'Mobile', 'Account_Name', 'Lead_Source', 'Lead_Status', 'Owner', 'Created_Time'],
  'custom-erp': ['id', 'name', 'email', 'phone', 'company', 'source', 'status', 'owner', 'created_at', 'custom_field_1', 'custom_field_2'],
};

const DESTINATION_FIELDS = [
  'lead_name', 'email', 'mobile', 'phone', 'city', 'state', 'pincode',
  'company_name', 'source', 'campaign_name', 'lead_score', 'assigned_to',
  'notes', 'status', 'created_at', 'custom_1', 'custom_2',
];

const STATIC_PRESETS = [
  { key: 'campaign_id', label: 'Campaign ID', defaultVal: 'CAMP_2026_Q3' },
  { key: 'source_tag', label: 'Source Tag', defaultVal: 'erp_sync' },
  { key: 'environment', label: 'Environment', defaultVal: 'production' },
];

const OPERATIONS: { id: Operation; label: string }[] = [
  { id: 'add', label: 'Add' },
  { id: 'update', label: 'Update' },
  { id: 'append', label: 'Append' },
];

function OperationDropdown({
  selected,
  onChange,
}: {
  selected: Operation[];
  onChange: (ops: Operation[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (op: Operation) => {
    onChange(selected.includes(op) ? selected.filter((o) => o !== op) : [...selected, op]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 h-7 px-2 text-[11px] bg-card border border-border rounded-md hover:border-primary/50 transition-all min-w-[90px]"
      >
        <span className="flex-1 text-left truncate">
          {selected.length === 0 ? 'Select...' : selected.map((o) => o.charAt(0).toUpperCase() + o.slice(1)).join(', ')}
        </span>
        <ChevronDown size={11} className="text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1">
          {OPERATIONS.map((op) => (
            <label
              key={`op-${op.id}`}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(op.id)}
                onChange={() => toggle(op.id)}
                className="w-3 h-3 accent-primary"
              />
              <span className="text-[12px] text-foreground">{op.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface ERPMapFieldsStepProps {
  erpSystem: ERPSystem;
}

export default function ERPMapFieldsStep({ erpSystem }: ERPMapFieldsStepProps) {
  const sourceFields = ERP_SOURCE_FIELDS[erpSystem] || ERP_SOURCE_FIELDS['custom-erp'];

  const [mappings, setMappings] = useState<FieldMapping[]>([
    { id: 'map-1', sourceField: sourceFields[0] || '', destinationField: 'lead_name', operations: ['add'], mandatory: true },
    { id: 'map-2', sourceField: sourceFields[2] || '', destinationField: 'email', operations: ['add', 'update'], mandatory: true },
    { id: 'map-3', sourceField: sourceFields[3] || '', destinationField: 'mobile', operations: ['add'], mandatory: false },
  ]);

  const [staticFields, setStaticFields] = useState<{ id: string; key: string; label: string; value: string }[]>([]);
  const [showStaticForm, setShowStaticForm] = useState(false);
  const [newStaticKey, setNewStaticKey] = useState('campaign_id');
  const [newStaticValue, setNewStaticValue] = useState('CAMP_2026_Q3');

  const addMapping = () => {
    setMappings((prev) => [
      ...prev,
      { id: `map-${Date.now()}`, sourceField: '', destinationField: '', operations: ['add'], mandatory: false },
    ]);
  };

  const removeMapping = (id: string) => {
    setMappings((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<FieldMapping>) => {
    setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const addStaticField = () => {
    const preset = STATIC_PRESETS.find((p) => p.key === newStaticKey);
    setStaticFields((prev) => [
      ...prev,
      { id: `sf-${Date.now()}`, key: newStaticKey, label: preset?.label || newStaticKey, value: newStaticValue },
    ]);
    setShowStaticForm(false);
    setNewStaticKey('campaign_id');
    setNewStaticValue('CAMP_2026_Q3');
  };

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={18} className="text-primary" />
          <h2 className="text-[16px] font-semibold text-foreground">Map Data &amp; Fields</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Map source ERP fields to destination CRM fields. Select operations and mark mandatory fields.
        </p>
      </div>

      {/* Mapping Table */}
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_120px_80px] gap-2 px-3 py-2 bg-muted/50 border-b border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Source Field</p>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Destination Field</p>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Operation</p>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Mandatory</p>
        </div>

        {/* Mapping Rows */}
        <div className="divide-y divide-border">
          {mappings.map((mapping) => (
            <div key={mapping.id} className="grid grid-cols-[1fr_1fr_120px_80px] gap-2 px-3 py-2 items-center hover:bg-muted/20 transition-colors group">
              {/* Source Field */}
              <select
                value={mapping.sourceField}
                onChange={(e) => updateMapping(mapping.id, { sourceField: e.target.value })}
                className="h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">Select source...</option>
                {sourceFields.map((f) => (
                  <option key={`src-${f}`} value={f}>{f}</option>
                ))}
              </select>

              {/* Destination Field */}
              <select
                value={mapping.destinationField}
                onChange={(e) => updateMapping(mapping.id, { destinationField: e.target.value })}
                className="h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">Select destination...</option>
                {DESTINATION_FIELDS.map((f) => (
                  <option key={`dst-${f}`} value={f}>{f}</option>
                ))}
              </select>

              {/* Operation Multi-select */}
              <OperationDropdown
                selected={mapping.operations}
                onChange={(ops) => updateMapping(mapping.id, { operations: ops })}
              />

              {/* Mandatory Toggle + Delete */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => updateMapping(mapping.id, { mandatory: !mapping.mandatory })}
                  className={`w-9 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 ${
                    mapping.mandatory ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      mapping.mandatory ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
                <button
                  onClick={() => removeMapping(mapping.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Mapping Button */}
      <button
        onClick={addMapping}
        className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 mb-5 transition-colors"
      >
        <Plus size={13} />
        Add Field Mapping
      </button>

      {/* Static Fields Section */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-primary" />
            <h3 className="text-[13px] font-semibold text-foreground">Static Fields</h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Campaign ID, Source Tag, etc.</span>
          </div>
          <button
            onClick={() => setShowStaticForm((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={12} />
            Add Static Field
          </button>
        </div>

        {staticFields.length > 0 && (
          <div className="space-y-2 mb-3">
            {staticFields.map((sf) => (
              <div key={sf.id} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border border-border">
                <Hash size={12} className="text-muted-foreground flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-foreground">{sf.label}</span>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <span className="text-[11px] text-primary font-mono bg-primary/5 px-1.5 py-0.5 rounded">{sf.value}</span>
                </div>
                <button
                  onClick={() => setStaticFields((prev) => prev.filter((s) => s.id !== sf.id))}
                  className="text-muted-foreground hover:text-danger transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showStaticForm && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Field Type</label>
                <select
                  value={newStaticKey}
                  onChange={(e) => {
                    setNewStaticKey(e.target.value);
                    const preset = STATIC_PRESETS.find((p) => p.key === e.target.value);
                    if (preset) setNewStaticValue(preset.defaultVal);
                  }}
                  className="w-full h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {STATIC_PRESETS.map((p) => (
                    <option key={`sp-${p.key}`} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Value</label>
                <input
                  type="text"
                  value={newStaticValue}
                  onChange={(e) => setNewStaticValue(e.target.value)}
                  className="w-full h-7 px-2 text-[11px] bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Enter static value"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addStaticField}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <CheckCircle size={11} />
                Add
              </button>
              <button
                onClick={() => setShowStaticForm(false)}
                className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {staticFields.length === 0 && !showStaticForm && (
          <p className="text-[11px] text-muted-foreground">No static fields added. Use static fields for Campaign ID, Source Tag, or fixed values.</p>
        )}
      </div>

      <div className="p-3 bg-muted/30 rounded-lg border border-border">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{mappings.filter((m) => m.sourceField && m.destinationField).length}</span> field mappings configured
          {staticFields.length > 0 && <> · <span className="font-semibold text-foreground">{staticFields.length}</span> static fields</>}
          {' '}· <span className="font-semibold text-foreground">{mappings.filter((m) => m.mandatory).length}</span> mandatory
        </p>
      </div>
    </div>
  );
}
