'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useState } from 'react';
import { Clock, Zap, Calendar, CheckCircle, Bell, Database, Mail, GitBranch, Plus, ChevronDown, Lock, Trash2 } from 'lucide-react';

export type SyncFrequency = 'realtime' | '5min' | '15min' | '30min' | 'hourly' | 'daily' | 'custom';

export interface ScheduleConfig {
  frequency: SyncFrequency | '';
  customCron: string;
  syncHistorical: boolean;
  errorNotifications: boolean;
  emailAlerts: string;
  conditions: Condition[];
}

type ConditionOperator = 'is equal to' | 'is not equal to' | 'is' | 'include' | 'exclude';

interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator | '';
  values: string[];
}

const CONDITION_FIELDS = [
  { value: 'status', label: 'Status', values: ['New', 'Open', 'Qualified', 'Converted', 'Closed'] },
  { value: 'lead_source', label: 'Lead Source', values: ['Website', 'Referral', 'Campaign', 'Partner', 'Import'] },
  { value: 'company_name', label: 'Company Name', values: ['Acme Inc.', 'Globex', 'Initech'] },
  { value: 'lead_score', label: 'Lead Score', values: ['High', 'Medium', 'Low'] },
  { value: 'country', label: 'Country', values: ['United States', 'United Kingdom', 'India', 'Australia'] },
];

const CONDITION_OPERATORS: ConditionOperator[] = ['is equal to', 'is not equal to', 'is', 'include', 'exclude'];

interface ERPScheduleStepProps {
  onScheduleChange: (config: ScheduleConfig) => void;
}

const FREQUENCY_OPTIONS: { id: SyncFrequency; label: string; desc: string; badge?: string }[] = [
  { id: 'realtime', label: 'Real-time', desc: 'Instant sync on every event', badge: 'Recommended' },
  { id: '5min', label: 'Every 5 min', desc: 'Near real-time batch' },
  { id: '15min', label: 'Every 15 min', desc: 'Frequent sync' },
  { id: '30min', label: 'Every 30 min', desc: 'Balanced performance' },
  { id: 'hourly', label: 'Hourly', desc: 'Low-frequency sync' },
  { id: 'daily', label: 'Daily', desc: 'Overnight batch sync' },
  { id: 'custom', label: 'Custom', desc: 'Define your own schedule' },
];

function ConditionValueSelect({ condition, options, onChange }: { condition: Condition; options: string[]; onChange: (values: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const toggleValue = (value: string) => onChange(condition.values.includes(value) ? condition.values.filter((item) => item !== value) : [...condition.values, value]);

  return (
    <div className="relative min-w-0">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center justify-between w-full h-9 px-3 text-[12px] text-left bg-card border border-border rounded-lg hover:border-primary/50">
        <span className={condition.values.length ? 'text-foreground truncate' : 'text-muted-foreground truncate'}>{condition.values.length ? `${condition.values.length} value${condition.values.length === 1 ? '' : 's'} selected` : 'Select values...'}</span>
        <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
      </button>
      {open && <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg">{options.map((option) => <label key={option} className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted cursor-pointer"><input type="checkbox" checked={condition.values.includes(option)} onChange={() => toggleValue(option)} className="h-3.5 w-3.5 accent-primary" />{option}</label>)}</div>}
    </div>
  );
}

export default function ERPScheduleStep({ onScheduleChange }: ERPScheduleStepProps) {
  const [conditionConnectors, setConditionConnectors] = useState<('AND' | 'OR')[]>([]);
  const [config, setConfig] = useSetupState<ScheduleConfig>('erp-crm', 'ERPScheduleStep.config', {
    frequency: '',
    customCron: '',
    syncHistorical: false,
    errorNotifications: true,
    emailAlerts: '',
    conditions: [{ id: 'condition-1', field: '', operator: '', values: [] }],
  });

  const update = (updates: Partial<ScheduleConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    onScheduleChange(next);
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    update({ conditions: config.conditions.map((condition) => condition.id === id ? { ...condition, ...updates, ...(updates.field ? { operator: '', values: [] } : {}) } : condition) });
  };

  const addCondition = () => {
    setConditionConnectors((connectors) => [...connectors, 'AND']);
    update({ conditions: [...config.conditions, { id: `condition-${Date.now()}`, field: '', operator: '', values: [] }] });
  };

  const removeCondition = (id: string) => {
    if (config.conditions.length === 1) return;
    const index = config.conditions.findIndex((condition) => condition.id === id);
    setConditionConnectors((connectors) => connectors.filter((_, connectorIndex) => connectorIndex !== Math.max(0, index - 1)));
    update({ conditions: config.conditions.filter((condition) => condition.id !== id) });
  };

  const setConnector = (index: number, connector: 'AND' | 'OR') => {
    setConditionConnectors((connectors) => connectors.map((value, connectorIndex) => connectorIndex === index ? connector : value));
  };


  const activeConditions = config.conditions.filter((condition) => condition.field && condition.operator && condition.values.length > 0);
  const isConditionValid = activeConditions.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-primary" />
          <h2 className="text-[18px] font-bold text-foreground">Schedule Sync</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Choose how often to sync data from your ERP to the CRM.
        </p>
      </div>

      {/* Conditional workflow */}
      <div className="mb-6 space-y-3">
        <section className="rounded-xl border border-orange-200 bg-orange-50/70 overflow-visible">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-orange-200">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700"><GitBranch size={15} /></div><div><p className="text-[13px] font-semibold text-orange-950">Conditions</p><p className="text-[11px] text-orange-800/70">IF an incoming record matches these conditions.</p></div></div>
            <span className="text-[10px] font-medium text-orange-800">{activeConditions.length} active condition{activeConditions.length === 1 ? '' : 's'}</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-[12px] font-semibold text-foreground">IF</p><p className="text-[10px] text-muted-foreground">Choose a field, operator, and one or more values.</p></div>
              <span className="text-[10px] font-medium text-muted-foreground">{activeConditions.length} active condition{activeConditions.length === 1 ? '' : 's'}</span>
            </div>
            <div className="space-y-2">
              {config.conditions.map((condition, index) => {
                const field = CONDITION_FIELDS.find((item) => item.value === condition.field);
                return (
                  <React.Fragment key={condition.id}>
                    {index > 0 && <div className="flex items-center gap-3 py-1"><div className="h-px flex-1 bg-border" /><div className="flex rounded-lg border border-border bg-muted/30 p-0.5"><button type="button" onClick={() => setConnector(index - 1, 'AND')} className={`px-3 py-1 text-[10px] font-semibold rounded-md ${conditionConnectors[index - 1] !== 'OR' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>AND</button><button type="button" onClick={() => setConnector(index - 1, 'OR')} className={`px-3 py-1 text-[10px] font-semibold rounded-md ${conditionConnectors[index - 1] === 'OR' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>OR</button></div><div className="h-px flex-1 bg-border" /></div>}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center p-3 ml-3 rounded-lg border border-orange-200 bg-white/80">
                      <select value={condition.field} onChange={(event) => updateCondition(condition.id, { field: event.target.value })} className="h-9 px-3 text-[12px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Select field...</option>
                        {CONDITION_FIELDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                      <select value={condition.operator} disabled={!condition.field} onChange={(event) => updateCondition(condition.id, { operator: event.target.value as ConditionOperator, values: [] })} className="h-9 px-3 text-[12px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
                        <option value="">Select operator...</option>
                        {CONDITION_OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                      </select>
                      <ConditionValueSelect condition={condition} options={field?.values || []} onChange={(values) => updateCondition(condition.id, { values })} />
                      <button type="button" onClick={() => removeCondition(condition.id)} disabled={config.conditions.length === 1} aria-label="Remove condition" className="h-9 flex items-center justify-center text-muted-foreground hover:text-red-500 disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <button type="button" onClick={addCondition} className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-orange-800 hover:text-orange-950"><Plus size={13} /> Add Subgroup</button>
          </div>
        </section>

        <section className={`rounded-xl border overflow-hidden transition-colors ${isConditionValid ? 'border-blue-200 bg-blue-50/70' : 'border-dashed border-blue-200 bg-blue-50/40 opacity-70'}`}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-blue-200">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700"><Clock size={15} /></div><div><p className="text-[13px] font-semibold text-blue-950">Sync Settings</p><p className="text-[11px] text-blue-800/70">THEN configure how matching records are synchronized.</p></div></div>
            {!isConditionValid && <Lock size={14} className="text-blue-700/60" />}
          </div>
          <div className="p-4">
            <div className="mt-0 border-t-0 pt-0">
              <p className="mb-3 text-[12px] font-semibold text-blue-950">Sync Frequency</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {FREQUENCY_OPTIONS.map((opt) => {
                  const isSelected = config.frequency === opt.id;
                  return <button type="button" key={`freq-${opt.id}`} disabled={!isConditionValid} onClick={() => update({ frequency: opt.id })} className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all disabled:cursor-not-allowed ${isSelected ? 'border-blue-600 bg-white shadow-sm' : 'border-blue-200 bg-white/60 hover:border-blue-400 disabled:hover:border-blue-200'}`}>
                    {opt.badge && <span className="absolute right-2 top-2 rounded-full border border-green-200 bg-green-100 px-1.5 py-0.5 text-[8px] font-bold text-green-700">{opt.badge}</span>}
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-blue-50'}`}>{opt.id === 'realtime' ? <Zap size={13} className="text-blue-700" /> : <Calendar size={13} className="text-blue-700" />}</div>
                    <p className={`text-[12px] font-semibold ${isSelected ? 'text-blue-700' : 'text-blue-950'}`}>{opt.label}</p><p className="text-[10px] leading-tight text-blue-800/70">{opt.desc}</p>
                    {isSelected && <CheckCircle size={12} className="absolute bottom-2 right-2 text-blue-600" />}
                  </button>;
                })}
              </div>
              {config.frequency === 'custom' && <div className="mt-3 rounded-xl border border-blue-200 bg-white/60 p-4"><label className="mb-1 block text-[12px] font-semibold text-blue-950">Custom Cron Expression</label><p className="mb-2 text-[10px] text-blue-800/70">e.g. <code className="rounded bg-blue-100 px-1">0 */2 * * *</code> for every 2 hours</p><input type="text" disabled={!isConditionValid} placeholder="0 */2 * * *" value={config.customCron} onChange={(e) => update({ customCron: e.target.value })} className="h-9 w-full rounded-lg border border-blue-200 bg-white px-3 font-mono text-[13px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed" /></div>}
            </div>

            <div className="mt-5 border-t border-blue-200 pt-4">
              <p className="mb-3 text-[12px] font-semibold text-blue-950">Advanced Options</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white/60 p-3.5"><div className="flex-1"><div className="flex items-center gap-2"><Database size={14} className="text-blue-700" /><p className="text-[13px] font-semibold text-blue-950">Sync Historical Data</p></div><p className="ml-5 mt-0.5 text-[11px] text-blue-800/70">Import existing records from ERP on first sync.</p></div><button type="button" disabled={!isConditionValid} onClick={() => update({ syncHistorical: !config.syncHistorical })} className={`relative mt-0.5 h-5 w-10 flex-shrink-0 rounded-full transition-all disabled:cursor-not-allowed ${config.syncHistorical ? 'bg-blue-600' : 'bg-blue-200'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${config.syncHistorical ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white/60 p-3.5"><div className="flex-1"><div className="flex items-center gap-2"><Bell size={14} className="text-blue-700" /><p className="text-[13px] font-semibold text-blue-950">Enable Error Notifications</p></div><p className="ml-5 mt-0.5 text-[11px] text-blue-800/70">Receive alerts when sync errors occur.</p></div><button type="button" disabled={!isConditionValid} onClick={() => update({ errorNotifications: !config.errorNotifications })} className={`relative mt-0.5 h-5 w-10 flex-shrink-0 rounded-full transition-all disabled:cursor-not-allowed ${config.errorNotifications ? 'bg-blue-600' : 'bg-blue-200'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${config.errorNotifications ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
                {config.errorNotifications && <div className="rounded-xl border border-blue-200 bg-white/60 p-3.5"><div className="mb-2 flex items-center gap-2"><Mail size={13} className="text-blue-700" /><p className="text-[12px] font-semibold text-blue-950">Email Alert Recipients</p></div><input type="text" disabled={!isConditionValid} placeholder="admin@company.com, devops@company.com" value={config.emailAlerts} onChange={(e) => update({ emailAlerts: e.target.value })} className="h-9 w-full rounded-lg border border-blue-200 bg-white px-3 text-[13px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed" />{config.emailAlerts && <div className="mt-2 flex flex-wrap gap-1.5">{config.emailAlerts.split(',').filter((email) => email.trim()).map((email, index) => <span key={`email-${index}`} className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">{email.trim()}</span>)}</div>}</div>}
              </div>
            </div>
          </div>
          </section>
      </div>

      {/* Legacy Advanced Options render path retained for state compatibility. */}
      {false && <div className="mb-6">
        <label className="block text-[12px] font-semibold text-foreground mb-3 uppercase tracking-wide">Advanced Options</label>
        <div className="space-y-3">
          {/* Sync Historical */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-muted-foreground" />
                <p className="text-[13px] font-semibold text-foreground">Sync Historical Data</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">Import existing records from ERP on first sync. May take longer for large datasets.</p>
            </div>
            <button
              onClick={() => update({ syncHistorical: !config.syncHistorical })}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 mt-0.5 ${config.syncHistorical ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${config.syncHistorical ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Error Notifications */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-muted-foreground" />
                <p className="text-[13px] font-semibold text-foreground">Error Notifications</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">Receive alerts when sync errors occur. Recommended for production.</p>
            </div>
            <button
              onClick={() => update({ errorNotifications: !config.errorNotifications })}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 mt-0.5 ${config.errorNotifications ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${config.errorNotifications ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Email Alerts */}
          {config.errorNotifications && (
            <div className="p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={13} className="text-primary" />
                <p className="text-[12px] font-semibold text-foreground">Email Alert Recipients</p>
              </div>
              <input
                type="text"
                placeholder="admin@company.com, devops@company.com"
                value={config.emailAlerts}
                onChange={(e) => update({ emailAlerts: e.target.value })}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {config.emailAlerts && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {config.emailAlerts.split(',').filter((e) => e.trim()).map((email, i) => (
                    <span key={`email-${i}`} className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      <Mail size={9} />
                      {email.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      }

      {/* Summary Preview */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border">
        <p className="text-[11px] font-semibold text-foreground mb-2">Schedule Summary</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            {config.frequency === 'realtime' ? '⚡ Real-time sync' : `🕐 ${FREQUENCY_OPTIONS.find((f) => f.id === config.frequency)?.label}`}
          </span>
          {config.syncHistorical && (
            <span className="text-[10px] font-medium text-foreground bg-muted border border-border px-2 py-0.5 rounded-full">📦 Historical sync</span>
          )}
          {config.errorNotifications && (
            <span className="text-[10px] font-medium text-foreground bg-muted border border-border px-2 py-0.5 rounded-full">🔔 Notifications on</span>
          )}
        </div>
      </div>
    </div>
  );
}
