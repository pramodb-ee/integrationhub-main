'use client';

import React, { useState } from 'react';
import {
  CheckCircle, Server, Zap, Calendar, Shield, ArrowRight,
  LayoutDashboard, Activity, Terminal, GitBranch, Tag, Hash, Settings2, Clock,
  TestTube2, ChevronDown, ChevronUp, Loader2, XCircle
} from 'lucide-react';
import { ERPId, ERP_MAP, AuthType, Environment } from './erpRegistry';
import { ScheduleConfig } from './ERPScheduleStep';
import Link from 'next/link';

interface ERPSummaryStepProps {
  erpId: ERPId;
  environment: Environment;
  authType: AuthType | null;
  scheduleConfig: ScheduleConfig | null;
  curlConfigured: boolean;
  mappingCount: number;
  staticFieldCount: number;
  formatMappingCount: number;
  defaultValueCount: number;
  canActivate: boolean;
  onActivate: () => void;
  onGoToMonitor: () => void;
}

const AUTH_LABELS: Record<AuthType, string> = {
  'auth-key': 'Auth Key',
  'api-key': 'API Key',
  'username-password': 'Username / Password',
  'none': 'No Authentication',
};

const FREQ_LABELS: Record<string, string> = {
  realtime: 'Real-time',
  '5min': 'Every 5 min',
  '15min': 'Every 15 min',
  '30min': 'Every 30 min',
  hourly: 'Hourly',
  daily: 'Daily',
  custom: 'Custom',
};

export default function ERPSummaryStep({
  erpId, environment, authType, scheduleConfig,
  curlConfigured, mappingCount, staticFieldCount, formatMappingCount, defaultValueCount,
  onActivate, onGoToMonitor, canActivate,
}: ERPSummaryStepProps) {
  const erp = ERP_MAP[erpId];
  const testEndpoint = erp?.defaultCurl.match(/https?:\/\/[^" ]+/)?.[0] || 'https://api.example.com/leads';
  const [activated, setActivated] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [testDetailsOpen, setTestDetailsOpen] = useState(false);

  const handleActivate = () => {
    if (!canActivate || testState !== 'success') return;
    setActivated(true);
    onActivate();
    setTimeout(() => onGoToMonitor(), 1500);
  };

  const testLead = () => {
    setTestState('running');
    setTestDetailsOpen(true);
    window.setTimeout(() => setTestState('success'), 900);
  };

  const summaryRows = [
    {
      id: 'sr-erp',
      label: 'ERP System',
      value: erp?.name || erpId,
      icon: <div className={`w-5 h-5 rounded ${erp?.iconBg || 'bg-gray-100'} flex items-center justify-center text-[8px] font-bold text-gray-700`}>{erp?.iconText}</div>,
    },
    {
      id: 'sr-env',
      label: 'Environment',
      value: environment.charAt(0).toUpperCase() + environment.slice(1),
      icon: <Server size={14} className={environment === 'production' ? 'text-green-600' : 'text-yellow-600'} />,
      badge: environment === 'production' ? 'Live' : 'Sandbox',
      badgeClass: environment === 'production' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    {
      id: 'sr-auth',
      label: 'Authentication',
      value: authType ? AUTH_LABELS[authType] : 'None',
      icon: <Shield size={14} className="text-muted-foreground" />,
    },
    {
      id: 'sr-curl',
      label: 'API Request (CURL)',
      value: curlConfigured ? 'Configured' : 'None',
      icon: <Terminal size={14} className={curlConfigured ? 'text-green-600' : 'text-muted-foreground'} />,
      badge: curlConfigured ? 'Ready' : undefined,
      badgeClass: curlConfigured ? 'bg-green-50 text-green-700 border-green-200' : undefined,
    },
    {
      id: 'sr-mapping',
      label: 'Field Mappings',
      value: mappingCount > 0 ? `${mappingCount} field${mappingCount !== 1 ? 's' : ''} mapped` : 'None',
      icon: <GitBranch size={14} className="text-primary" />,
    },
    {
      id: 'sr-static',
      label: 'Static Fields',
      value: staticFieldCount > 0 ? `${staticFieldCount} field${staticFieldCount !== 1 ? 's' : ''}` : 'None',
      icon: <Tag size={14} className="text-muted-foreground" />,
    },
    {
      id: 'sr-format',
      label: 'Format Mappings',
      value: formatMappingCount > 0 ? `${formatMappingCount} format${formatMappingCount !== 1 ? 's' : ''}` : 'None',
      icon: <Hash size={14} className="text-muted-foreground" />,
    },
    {
      id: 'sr-defaults',
      label: 'Default Values',
      value: defaultValueCount > 0 ? `${defaultValueCount} default${defaultValueCount !== 1 ? 's' : ''}` : 'None',
      icon: <Settings2 size={14} className="text-muted-foreground" />,
    },
    {
      id: 'sr-schedule',
      label: 'Sync Schedule',
      value: scheduleConfig?.frequency ? FREQ_LABELS[scheduleConfig.frequency] || scheduleConfig.frequency : 'Not selected',
      icon: scheduleConfig?.frequency === 'realtime' ? <Zap size={14} className="text-primary" /> : <Calendar size={14} className="text-muted-foreground" />,
    },
  ];

  if (activated) {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-[22px] font-bold text-foreground mb-2">Integration Activated!</h2>
        <p className="text-[14px] text-muted-foreground mb-1">
          <span className="font-semibold text-foreground">{erp?.name}</span> integration is now live.
        </p>
        <p className="text-[12px] text-muted-foreground">Redirecting to Monitor...</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-primary" />
          <h2 className="text-[18px] font-bold text-foreground">Integration Summary</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Review your configuration before activating the integration.
        </p>
      </div>

      {/* Summary Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-muted/40 border-b border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Configuration Overview</p>
        </div>
        <div className="divide-y divide-border">
          {summaryRows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-5 flex-shrink-0">{row.icon}</div>
              <p className="text-[12px] text-muted-foreground w-36 flex-shrink-0">{row.label}</p>
              <p className="text-[13px] font-semibold text-foreground flex-1">{row.value}</p>
              {row.badge && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${row.badgeClass}`}>
                  {row.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold text-foreground uppercase tracking-wide">Test Lead</p>
            <p className="text-[11px] text-muted-foreground mt-1">Push a sample lead through the configured integration before activation.</p>
          </div>
          <button onClick={testLead} disabled={!canActivate || testState === 'running'} className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
            {testState === 'running' ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
            {testState === 'running' ? 'Testing...' : 'Test Lead'}
          </button>
        </div>
        {!canActivate && <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Complete at least one field mapping or API request and select a sync frequency before testing.</p>}
        {testState === 'success' && <div className="mt-3 flex items-center gap-2 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"><CheckCircle size={14} />Lead has been successfully pushed</div>}
        {testState === 'failed' && <div className="mt-3 flex items-center gap-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><XCircle size={14} />Lead test failed. Verify authentication, mapping, and API configuration.</div>}
        {testState !== 'idle' && testState !== 'running' && <div className="mt-3 border border-border rounded-lg overflow-hidden"><button onClick={() => setTestDetailsOpen((open) => !open)} className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-foreground bg-muted/30 hover:bg-muted/50"><span>Test request details</span>{testDetailsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>{testDetailsOpen && <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 bg-gray-950 text-green-300"><div><p className="text-[9px] uppercase tracking-wide text-gray-400 mb-1">Generated CURL</p><pre className="text-[10px] whitespace-pre-wrap break-all">{`curl -X POST "${testEndpoint}" -H "Content-Type: application/json"`}</pre></div><div><p className="text-[9px] uppercase tracking-wide text-gray-400 mb-1">Request Payload</p><pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify({ firstName: 'Test', lastName: 'Lead', email: 'test.lead@example.com', source: 'ERP Integration Test' }, null, 2)}</pre></div><div><p className="text-[9px] uppercase tracking-wide text-gray-400 mb-1">Response Payload</p><pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify({ success: true, id: 'test-lead-001', message: 'Lead has been successfully pushed' }, null, 2)}</pre></div></div>}</div>}
      </div>

      {/* What happens next */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <p className="text-[12px] font-bold text-foreground uppercase tracking-wide mb-3">What happens after activation?</p>
        <div className="space-y-2.5">
          {[
            { id: 'wn-1', text: 'ERP-to-CRM data sync starts immediately on the configured schedule.' },
            { id: 'wn-2', text: 'Field mappings and static fields are applied to every incoming ERP record.' },
            { id: 'wn-3', text: 'Format mappings and default values are enforced consistently across every record.' },
            { id: 'wn-4', text: 'Historical ERP records are imported into the CRM when historical sync is enabled.' },
            { id: 'wn-5', text: 'Error notifications and alerts trigger automatically when a sync fails.' },
            { id: 'wn-6', text: 'The Monitor dashboard provides real-time sync health, logs, and performance metrics.' },
          ].map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <ArrowRight size={12} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-border">
        <button
          onClick={handleActivate}
          disabled={!canActivate || testState !== 'success' || activated}
          title={!canActivate ? 'Complete required setup before activation' : testState !== 'success' ? 'Run Test Lead successfully before activation' : undefined}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={15} />
          Activate Integration
        </button>
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-[13px] font-medium text-foreground rounded-xl hover:bg-muted active:scale-95 transition-all">
            <LayoutDashboard size={14} />
            Dashboard
          </button>
        </Link>
        <Link href="/integration-monitoring">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-[13px] font-medium text-foreground rounded-xl hover:bg-muted active:scale-95 transition-all">
            <Activity size={14} />
            Monitoring
          </button>
        </Link>
      </div>
    </div>
  );
}
