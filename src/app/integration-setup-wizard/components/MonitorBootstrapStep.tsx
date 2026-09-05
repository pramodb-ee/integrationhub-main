'use client';

import React, { useState } from 'react';
import { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import ConnectorIcon from '@/components/ui/ConnectorIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import IntegrationCatalogModal from '@/app/components/IntegrationCatalogModal';
import Link from 'next/link';
import {
  Activity, CheckCircle, ExternalLink, RefreshCw, Bell, BarChart3, Plus,
  Loader2, X, Mail, AlertTriangle, ChevronDown,
} from 'lucide-react';

interface MonitorBootstrapStepProps {
  connectorType: ConnectorType;
  integrationName: string;
}

/* ─── Alert Config Modal ─────────────────────────────────────────────────── */
interface AlertConfigModalProps {
  open: boolean;
  onClose: () => void;
  integrationName: string;
}

function AlertConfigModal({ open, onClose, integrationName }: AlertConfigModalProps) {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [threshold, setThreshold] = useState('1');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(onClose, 1400);
    }, 1200);
  };

  const canSave = (emailEnabled && email.trim()) || (slackEnabled && slackWebhook.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning-bg border border-warning-border flex items-center justify-center">
              <Bell size={15} className="text-warning" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Configure Failure Alerts</p>
              <p className="text-[11px] text-muted-foreground">{integrationName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-success-bg border border-success-border flex items-center justify-center">
              <CheckCircle size={24} className="text-success" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Alerts Configured!</p>
            <p className="text-[12px] text-muted-foreground text-center px-6">
              You&apos;ll be notified when <span className="font-semibold">{integrationName}</span> fails.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-bg border border-warning-border">
              <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-warning leading-relaxed">
                Alerts fire when this integration fails to process an event or exceeds the error threshold.
              </p>
            </div>

            {/* Email */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">Email Alerts</span>
                </div>
                <button
                  onClick={() => setEmailEnabled((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${emailEnabled ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${emailEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {emailEnabled && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alerts@yourcompany.com"
                  className="w-full h-8 px-3 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              )}
            </div>

            {/* Slack */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">Slack Alerts</span>
                </div>
                <button
                  onClick={() => setSlackEnabled((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${slackEnabled ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${slackEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {slackEnabled && (
                <input
                  type="url"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full h-8 px-3 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              )}
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1.5">Alert after how many failures?</label>
              <div className="relative">
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                >
                  <option value="1">1 failure (immediate)</option>
                  <option value="3">3 consecutive failures</option>
                  <option value="5">5 consecutive failures</option>
                  <option value="10">10 failures in 1 hour</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : <><Bell size={12} /> Save Alerts</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function MonitorBootstrapStep({ connectorType, integrationName }: MonitorBootstrapStepProps) {
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testVerified, setTestVerified] = useState(false);

  const quickStats = [
    { id: 'ms-events', label: 'Events Received', value: '0', unit: 'since publish' },
    { id: 'ms-success', label: 'Success Rate', value: '—', unit: 'awaiting data' },
    { id: 'ms-latency', label: 'Avg Latency', value: '—', unit: 'awaiting data' },
    { id: 'ms-errors', label: 'Errors', value: '0', unit: 'clean start' },
  ];

  const handleSendTest = () => {
    setTestRunning(true);
    setTestVerified(false);
    setTimeout(() => {
      setTestRunning(false);
      setTestVerified(true);
    }, 2000);
  };

  const nextSteps = [
    {
      id: 'ns-monitor',
      icon: Activity,
      label: 'Open Monitoring Dashboard',
      desc: 'Track real-time events, health, and logs',
      cta: 'Open Monitor',
      disabled: false,
      isLink: true,
      href: '/integration-monitoring',
      onClick: undefined as (() => void) | undefined,
    },
    {
      id: 'ns-alert',
      icon: Bell,
      label: 'Configure Failure Alerts',
      desc: 'Get notified via email/Slack when events fail',
      cta: 'Set Alerts',
      disabled: false,
      isLink: false,
      href: undefined,
      onClick: () => setAlertModalOpen(true),
    },
    {
      id: 'ns-test',
      icon: RefreshCw,
      label: 'Send a Test Event',
      desc: testVerified
        ? '✓ Test Event Retrieved – End-to-End Verified'
        : 'Verify end-to-end data flow with a sample lead',
      cta: testRunning ? 'Running…' : testVerified ? 'Re-run Test' : 'Send Test',
      disabled: testRunning,
      isLink: false,
      href: undefined,
      onClick: handleSendTest,
    },
    {
      id: 'ns-analytics',
      icon: BarChart3,
      label: 'View Analytics',
      desc: 'Available once sufficient event data is collected',
      cta: 'View Analytics',
      disabled: true,
      isLink: false,
      href: undefined,
      onClick: undefined,
    },
  ];

  return (
    <div>
      {/* Modals */}
      <AlertConfigModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        integrationName={integrationName}
      />
      <IntegrationCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />

      <div className="flex flex-col items-center text-center mb-6 pt-4">
        <div className="w-16 h-16 rounded-full bg-success-bg border-2 border-success flex items-center justify-center mb-3">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-[20px] font-bold text-foreground mb-1">Integration is Live!</h2>
        <p className="text-[13px] text-muted-foreground max-w-md">
          <span className="font-semibold text-foreground">{integrationName}</span> is published and actively monitoring.
          Here&apos;s your integration overview.
        </p>
      </div>

      {/* Integration card */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-success-border bg-success-bg/20 shadow-card">
        <ConnectorIcon type={connectorType} size={48} />
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-foreground">{integrationName}</p>
          <p className="text-[12px] text-muted-foreground">{getConnectorLabel(connectorType)} Integration</p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status="active" size="sm" />
            <div className="flex items-center gap-1 text-[11px] text-success">
              <div className="pulse-dot w-1.5 h-1.5" />
              Live — accepting events
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Published</p>
          <p className="text-[12px] font-semibold text-foreground">Just now</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {quickStats.map((stat) => (
          <div key={stat.id} className="card-base p-3 text-center">
            <p className="text-[22px] font-bold text-foreground font-tabular">{stat.value}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Test verified banner */}
      {testVerified && (
        <div className="flex items-center gap-2.5 mb-4 p-3 rounded-lg border border-success-border bg-success-bg">
          <CheckCircle size={15} className="text-success flex-shrink-0" />
          <p className="text-[13px] font-semibold text-success">Test Event Retrieved – End-to-End Verified</p>
        </div>
      )}

      {/* Next steps */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-foreground mb-3">Recommended Next Steps</h3>
        <div className="space-y-2">
          {nextSteps.map((step) => {
            const StepIcon = step.icon;
            const ctaButton = (
              <button
                onClick={step.onClick}
                disabled={step.disabled || testRunning && step.id === 'ns-test'}
                className={`flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  step.disabled
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : 'text-primary hover:underline'
                }`}
              >
                {step.id === 'ns-test' && testRunning ? (
                  <><Loader2 size={10} className="animate-spin" /> {step.cta}</>
                ) : (
                  <>{step.cta} {!step.disabled && <ExternalLink size={10} />}</>
                )}
              </button>
            );

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  step.disabled
                    ? 'border-border bg-muted/20 opacity-60' :'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.disabled ? 'bg-muted' : 'bg-primary/10'}`}>
                  <StepIcon size={14} className={step.disabled ? 'text-muted-foreground' : 'text-primary'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-foreground">{step.label}</p>
                    {step.disabled && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Disabled
                      </span>
                    )}
                    {step.id === 'ns-test' && testVerified && (
                      <span className="text-[10px] font-medium text-success bg-success-bg px-1.5 py-0.5 rounded border border-success-border">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] ${step.id === 'ns-test' && testVerified ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                    {step.desc}
                  </p>
                </div>
                {step.isLink && step.href ? (
                  <Link href={step.href}>
                    <button className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline whitespace-nowrap">
                      {step.cta} <ExternalLink size={10} />
                    </button>
                  </Link>
                ) : ctaButton}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Link href="/integration-monitoring">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
            <Activity size={14} />
            Open Monitoring
          </button>
        </Link>
        <Link href="/">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-[13px] font-medium rounded-lg hover:bg-muted active:scale-95 transition-all">
            Back to Center
          </button>
        </Link>
        <button
          onClick={() => setCatalogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          <Plus size={12} />
          Add Another Integration
        </button>
      </div>
    </div>
  );
}