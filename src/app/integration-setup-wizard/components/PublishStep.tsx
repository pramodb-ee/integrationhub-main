'use client';

import React, { useState } from 'react';
import { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import ConnectorIcon from '@/components/ui/ConnectorIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import { CheckCircle, AlertTriangle, Zap, Shield, Clock, Globe, ChevronRight, Loader2, Webhook, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const IVR_CONNECTORS: ConnectorType[] = ['ivr', 'tata', 'exotel', 'knowlarity', 'twilio', 'ozonetel', 'myoperator', 'cloudtalk', 'ringcentral', 'ivr-custom'];

interface PublishStepProps {
  connectorType: ConnectorType;
  integrationName: string;
  onPublished: () => void;
  webhookConfigured?: boolean;
  onGoToPreview?: () => void;
}

export default function PublishStep({ connectorType, integrationName, onPublished, webhookConfigured = false, onGoToPreview }: PublishStepProps) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const isIVR = IVR_CONNECTORS.includes(connectorType);
  const webhookBlocked = isIVR && !webhookConfigured;

  const readinessChecks = [
    { id: 'pub-conn',    label: 'Connection Verified',       passed: true,              icon: CheckCircle },
    { id: 'pub-map',     label: 'Field Mapping Complete',    passed: true,              icon: CheckCircle },
    { id: 'pub-preview', label: 'Payload Previewed',         passed: true,              icon: CheckCircle },
    { id: 'pub-env',     label: 'Environment: Production',   passed: true,              icon: Globe },
    { id: 'pub-auth',    label: 'Auth Credentials Valid',    passed: true,              icon: Shield },
    { id: 'pub-rate',    label: 'Rate Limits Within Quota',  passed: true,              icon: Zap },
    ...(isIVR ? [{ id: 'pub-webhook', label: 'Webhook Configured & Tested', passed: webhookConfigured, icon: webhookConfigured ? CheckCircle : XCircle }] : []),
  ];

  // Backend integration point: replace with POST /api/integrations/publish
  const handlePublish = () => {
    if (webhookBlocked) return;
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      toast.success(`${integrationName} is now live!`, {
        description: `${getConnectorLabel(connectorType)} integration published successfully. Monitoring activated.`,
      });
      setTimeout(onPublished, 1500);
    }, 2200);
  };

  const isFacebook = connectorType === 'facebook';

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-success-bg border-2 border-success flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-[20px] font-bold text-foreground mb-2">{isFacebook ? 'Integration is Live!' : 'Integration Published!'}</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          {isFacebook ? (
            <>
              <span className="font-semibold text-foreground">{integrationName}</span> is published and actively monitoring.
              Here&apos;s your integration overview.
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{integrationName}</span> is now live and accepting data.
              Redirecting to Monitor...
            </>
          )}
        </p>
        <div className="flex items-center gap-2 mt-4 text-[12px] text-muted-foreground">
          <Loader2 size={13} className="animate-spin" /> Setting up monitoring...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[16px] font-semibold text-foreground">Ready to Publish</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Review the pre-publish checklist and go live. Once published, this integration will immediately begin accepting data.
        </p>
      </div>

      {/* Integration card */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-card shadow-card">
        <ConnectorIcon type={connectorType} size={48} />
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-foreground">{integrationName}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{getConnectorLabel(connectorType)} Integration</p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status="ready" size="sm" />
            <span className="text-[11px] text-muted-foreground">→ Will become</span>
            <StatusBadge status="active" size="sm" />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Environment</p>
          <span className="text-[12px] font-semibold text-success bg-success-bg border border-success-border rounded px-2 py-0.5">
            Production
          </span>
        </div>
      </div>

      {/* Webhook not configured blocking banner (IVR only) */}
      {webhookBlocked && (
        <div className="mb-6 p-4 rounded-xl border-2 border-warning bg-warning-bg flex items-start gap-3">
          <Webhook size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-warning mb-1">Webhook Not Configured — Publishing Blocked</p>
            <p className="text-[12px] text-warning/80 leading-relaxed mb-3">
              This is a Telephone/IVR integration. You must configure and test the webhook URL in your{' '}
              <span className="font-semibold">{getConnectorLabel(connectorType)}</span> platform before publishing.
              Publishing without webhook setup will result in no call data being captured.
            </p>
            {onGoToPreview && (
              <button
                onClick={onGoToPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-warning text-white text-[12px] font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all"
              >
                <Webhook size={12} />
                Go to Preview → Configure Webhook
              </button>
            )}
          </div>
        </div>
      )}

      {/* Readiness checklist */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-foreground mb-3">Pre-publish Checklist</h3>
        <div className="space-y-2">
          {readinessChecks.map((check) => {
            const CheckIcon = check.icon;
            return (
              <div
                key={check.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                  check.passed
                    ? 'border-success-border bg-success-bg/30' :'border-warning-border bg-warning-bg/30'
                }`}
              >
                <CheckIcon size={14} className={check.passed ? 'text-success flex-shrink-0' : 'text-warning flex-shrink-0'} />
                <span className="text-[13px] text-foreground">{check.label}</span>
                <span className={`ml-auto text-[11px] font-semibold ${check.passed ? 'text-success' : 'text-warning'}`}>
                  {check.passed ? '✓ Pass' : '✗ Required'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* What happens after publish */}
      <div className="mb-6 p-4 rounded-lg bg-info-bg border border-info-border">
        <p className="text-[12px] font-semibold text-info mb-2">What happens when you publish?</p>
        <div className="space-y-1.5">
          {[
            'Webhook endpoint becomes active and begins accepting events',
            'Field mapping is locked — changes require re-publishing',
            'Monitoring dashboard activates with real-time health tracking',
            'Alerts configured for failures and latency spikes',
          ].map((item, i) => (
            <div key={`pub-info-${i + 1}`} className="flex items-start gap-2">
              <ChevronRight size={12} className="text-info mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-info/80">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SLA warning */}
      <div className="flex items-start gap-2 mb-6 p-3 rounded-lg bg-warning-bg border border-warning-border">
        <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-warning">
          <span className="font-semibold">This action cannot be undone without downtime.</span>{' '}
          Unpublishing will interrupt live data flow. Ensure your team is informed before publishing.
        </p>
      </div>

      {/* Publish button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePublish}
          disabled={publishing || webhookBlocked}
          title={webhookBlocked ? 'Configure and test the webhook before publishing' : undefined}
          className="flex items-center gap-2 px-6 py-2.5 bg-success text-white text-[13px] font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          style={{ minWidth: '160px' }}
        >
          {publishing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Zap size={14} />
              Publish Integration
            </>
          )}
        </button>
        {webhookBlocked ? (
          <span className="text-[12px] text-warning font-medium flex items-center gap-1.5">
            <Webhook size={12} />
            Configure webhook first to enable publishing
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock size={11} />
            Typically goes live in under 30 seconds
          </div>
        )}
      </div>
    </div>
  );
}