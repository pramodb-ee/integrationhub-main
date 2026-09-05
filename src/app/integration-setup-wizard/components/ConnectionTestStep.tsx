'use client';

import React, { useState, useEffect } from 'react';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { CheckCircle, XCircle, Loader2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldCheck, Copy, Check } from 'lucide-react';

const DEFAULT_ENDPOINT = 'https://eeintegration-test.azurewebsites.net/api/integration/gwDncuWvQEeseNvV';

interface ValidationResult {
  id: string;
  check: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  detail?: string;
}

const getValidationChecks = (type: ConnectorType): ValidationResult[] => {
  const base: ValidationResult[] = [
    { id: 'val-auth', check: 'Authentication', status: 'pending', message: 'Verifying credentials...', detail: 'Sending auth request to provider endpoint' },
    { id: 'val-perm', check: 'Permissions', status: 'pending', message: 'Checking required permissions...', detail: 'Validating scopes and access levels' },
    { id: 'val-conn', check: 'Connectivity', status: 'pending', message: 'Testing endpoint reachability...', detail: 'Pinging provider API endpoint' },
    { id: 'val-rate', check: 'Rate Limits', status: 'pending', message: 'Checking API quota...', detail: 'Verifying available API call budget' },
  ];

  const typeSpecific: Partial<Record<ConnectorType, ValidationResult[]>> = {
    facebook: [
      { id: 'val-page', check: 'Page Access', status: 'pending', message: 'Validating Page ID access...', detail: 'Confirming page_id has leads_retrieval scope' },
      { id: 'val-form', check: 'Lead Form', status: 'pending', message: 'Fetching lead form metadata...', detail: 'Checking form exists and is active' },
      { id: 'val-webhook', check: 'Webhook Registration', status: 'pending', message: 'Registering webhook endpoint...', detail: 'Subscribing to leadgen events on the page' },
    ],
    ivr: [
      { id: 'val-vendor', check: 'Vendor Endpoint', status: 'pending', message: 'Pinging IVR vendor API...', detail: 'Checking vendor system availability' },
      { id: 'val-number', check: 'Virtual Number', status: 'pending', message: 'Validating DID number...', detail: 'Confirming number is active and routed' },
    ],
    tata: [
      { id: 'val-calls', check: 'Call Flows', status: 'pending', message: 'Testing incoming and outgoing call flows...', detail: 'Validating configured number and call permissions' },
      { id: 'val-webhook', check: 'Webhook', status: 'pending', message: 'Testing webhook delivery...', detail: 'Sending a signed test event to the configured webhook' },
    ],
    exotel: [
      { id: 'val-calls', check: 'Call Flows', status: 'pending', message: 'Testing Exotel call flows...', detail: 'Validating app and virtual number configuration' },
      { id: 'val-webhook', check: 'Webhook', status: 'pending', message: 'Testing webhook delivery...', detail: 'Sending a test call event to the configured webhook' },
    ],
    knowlarity: [
      { id: 'val-calls', check: 'Call Flows', status: 'pending', message: 'Testing Knowlarity call flows...', detail: 'Validating SID, number, and IVR permissions' },
      { id: 'val-webhook', check: 'Webhook', status: 'pending', message: 'Testing webhook delivery...', detail: 'Sending a test event to the configured webhook' },
    ],
    api: [
      { id: 'val-endpoint', check: 'Endpoint Response', status: 'pending', message: 'Sending test request...', detail: 'Expecting 2xx response from configured endpoint' },
      { id: 'val-schema', check: 'Response Schema', status: 'pending', message: 'Validating response structure...', detail: 'Checking response matches expected field schema' },
    ],
    'erp-crm': [
      { id: 'val-instance', check: 'Instance URL', status: 'pending', message: 'Connecting to ERP instance...', detail: 'Verifying instance is reachable' },
      { id: 'val-oauth', check: 'OAuth Flow', status: 'pending', message: 'Validating OAuth tokens...', detail: 'Checking access token and refresh token validity' },
      { id: 'val-sync', check: 'Sync Test', status: 'pending', message: 'Running test sync...', detail: 'Fetching 1 record to validate field access' },
    ],
  };

  return [...base, ...(typeSpecific[type] ?? [])];
};

interface ConnectionTestStepProps {
  connectorType: ConnectorType;
  integrationName: string;
  onTestComplete: (passed: boolean) => void;
}

export default function ConnectionTestStep({ connectorType, integrationName, onTestComplete }: ConnectionTestStepProps) {
  const [checks, setChecks] = useState<ValidationResult[]>(() => getValidationChecks(connectorType));
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [copied, setCopied] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(DEFAULT_ENDPOINT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Backend integration point: replace with actual POST /api/integrations/validate
  const runValidation = () => {
    setRunning(true);
    setDone(false);
    setValidationStatus('running');
    const initialChecks = getValidationChecks(connectorType);
    setChecks(initialChecks);

    const outcomes: Array<'passed' | 'failed' | 'warning'> = [
      'passed', 'passed', 'passed', 'passed', 'passed', 'passed', 'warning', 'passed'
    ];

    initialChecks.forEach((check, idx) => {
      setTimeout(() => {
        setChecks((prev) =>
          prev.map((c) =>
            c.id === check.id ? { ...c, status: 'running' } : c
          )
        );
        setTimeout(() => {
          const outcome = outcomes[idx % outcomes.length];
          const messages: Record<string, string> = {
            passed: `${check.check} validated successfully`,
            warning: `${check.check} passed with warnings — review recommended`,
            failed: `${check.check} failed — check credentials`,
          };
          setChecks((prev) =>
            prev.map((c) =>
              c.id === check.id
                ? { ...c, status: outcome, message: messages[outcome] }
                : c
            )
          );
          if (idx === initialChecks.length - 1) {
            setRunning(false);
            setDone(true);
            const allPassed = outcomes.slice(0, initialChecks.length).every((o) => o !== 'failed');
            setValidationStatus(allPassed ? 'success' : 'failed');
            onTestComplete(allPassed);
          }
        }, 600 + idx * 100);
      }, idx * 800);
    });
  };

  useEffect(() => {
    runValidation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;

  const statusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle size={16} className="text-success flex-shrink-0" />;
      case 'failed': return <XCircle size={16} className="text-danger flex-shrink-0" />;
      case 'warning': return <AlertTriangle size={16} className="text-warning flex-shrink-0" />;
      case 'running': return <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />;
    }
  };

  return (
    <div>
      {/* Step header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-primary" />
          <h2 className="text-[16px] font-semibold text-foreground">Validate Connection</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Running a connection check to verify your credentials and endpoint reachability before proceeding.
        </p>
      </div>

      {/* API Endpoint URL */}
      <div className="mb-5 p-3 rounded-lg border border-border bg-muted/40">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">API Endpoint URL</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-card border border-border rounded-md px-3 py-2">
            <p className="text-[12px] font-mono text-foreground truncate">{DEFAULT_ENDPOINT}</p>
          </div>
          <button
            onClick={handleCopyEndpoint}
            className={`flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-md border transition-all flex-shrink-0 ${
              copied
                ? 'bg-success-bg border-success-border text-success' :'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Connector info bar */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-lg border border-border">
        <ConnectorIcon type={connectorType} size={40} />
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-foreground">Validating: {integrationName}</p>
          <p className="text-[11px] text-muted-foreground">Running {checks.length} connection checks for {getConnectorLabel(connectorType)}</p>
        </div>
        {done && (
          <button
            onClick={runValidation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors"
          >
            <RefreshCw size={12} /> Re-validate
          </button>
        )}
      </div>

      {/* Inline success/failure banner */}
      {done && (
        <div className={`flex items-center gap-3 mb-5 p-3.5 rounded-lg border ${
          validationStatus === 'success' ?'bg-success-bg border-success-border' :'bg-danger-bg border-danger-border'
        }`}>
          {validationStatus === 'success' ? (
            <>
              <CheckCircle size={20} className="text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-success">Connection Validated Successfully</p>
                <p className="text-[11px] text-success/80 mt-0.5">
                  All checks passed — your integration is ready to proceed to field mapping.
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle size={20} className="text-danger flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-danger">Connection Validation Failed</p>
                <p className="text-[11px] text-danger/80 mt-0.5">
                  One or more checks failed. Review the errors below and re-validate.
                </p>
              </div>
            </>
          )}
          <div className="flex items-center gap-3 text-[11px] font-medium flex-shrink-0">
            <span className="text-success">{passedCount} passed</span>
            {warningCount > 0 && <span className="text-warning">{warningCount} warning</span>}
            {failedCount > 0 && <span className="text-danger">{failedCount} failed</span>}
          </div>
        </div>
      )}

      {/* Check list */}
      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`rounded-lg border transition-all ${
              check.status === 'passed' ? 'border-success-border bg-success-bg/30'
              : check.status === 'failed' ? 'border-danger-border bg-danger-bg/30'
              : check.status === 'warning' ? 'border-warning-border bg-warning-bg/30'
              : check.status === 'running'? 'border-primary/30 bg-primary/5' :'border-border bg-card'
            }`}
          >
            <button
              className="flex items-center gap-3 w-full px-4 py-3 text-left"
              onClick={() => setExpandedId(expandedId === check.id ? null : check.id)}
            >
              {statusIcon(check.status)}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{check.check}</p>
                <p className="text-[11px] text-muted-foreground">{check.message}</p>
              </div>
              {check.status !== 'pending' && check.status !== 'running' && (
                expandedId === check.id
                  ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" />
                  : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
              )}
            </button>
            {expandedId === check.id && check.detail && (
              <div className="px-4 pb-3 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground mt-2 font-mono bg-muted rounded px-2 py-1.5">
                  {check.detail}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {running && (
        <div className="flex items-center gap-2 mt-4 text-[12px] text-muted-foreground">
          <Loader2 size={13} className="animate-spin text-primary" />
          Running connection validation — this may take a few seconds...
        </div>
      )}

      {/* Validate Connection button (manual trigger when idle/done) */}
      {done && (
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Industry standard: Validate before proceeding to field mapping.
          </p>
          <button
            onClick={runValidation}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ShieldCheck size={13} />
            Validate Connection
          </button>
        </div>
      )}
    </div>
  );
}