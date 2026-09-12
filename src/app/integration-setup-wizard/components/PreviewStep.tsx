'use client';

import React, { useState } from 'react';
import { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import ConnectorIcon from '@/components/ui/ConnectorIcon';
import { Copy, CheckCircle, Eye, Code, ArrowRight, Webhook, AlertTriangle, ExternalLink, ClipboardCheck, FlaskConical, Loader2, XCircle } from 'lucide-react';

// IVR connector types
const IVR_CONNECTORS: ConnectorType[] = ['ivr', 'tata', 'exotel', 'knowlarity', 'twilio', 'mcube', 'ozonetel', 'myoperator', 'cloudtalk', 'ringcentral', 'ivr-custom'];

// Provider-specific webhook instructions
const WEBHOOK_INSTRUCTIONS: Partial<Record<ConnectorType, { title: string; steps: string[]; docsUrl?: string; warningNote?: string }>> = {
  ozonetel: {
    title: 'Ozonetel Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Log in to your Ozonetel CloudAgent admin panel.',
      'Navigate to Settings → Webhooks → Inbound Webhook.',
      'Paste the Webhook URL in the "Endpoint URL" field.',
      'Set the event type to "Call Events" and save.',
      'Click "Test Webhook" to verify the connection.',
      'Once verified, publish the integration here.',
    ],
    docsUrl: 'https://ozonetel.com/docs/webhooks',
    warningNote: 'Do not publish this integration until you have pasted and configured the webhook URL in Ozonetel. If you do not paste and configure, do not publish.',
  },
  twilio: {
    title: 'Twilio Console Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Log in to your Twilio Console.',
      'Go to Phone Numbers → Manage → Active Numbers.',
      'Click your Twilio number and scroll to "Voice & Fax".',
      'Under "A Call Comes In", select "Webhook" and paste the URL.',
      'Set HTTP method to POST and save.',
      'Use Twilio\'s "Test Webhook" feature to verify before publishing.',
    ],
    docsUrl: 'https://www.twilio.com/docs/usage/webhooks',
    warningNote: 'Copy this webhook URL and configure it in Twilio Console under Webhooks before publishing. Publishing without configuration will result in missed call events.',
  },
  myoperator: {
    title: 'MyOperator Settings Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Log in to your MyOperator Dashboard.',
      'Navigate to Settings → API & Webhooks.',
      'Paste the Webhook URL in the "Webhook Endpoint" field.',
      'Select the events: Call Received, Call Answered, Call Missed.',
      'Click "Test Connection" to verify the webhook is reachable.',
      'Save settings, then publish the integration here.',
    ],
    docsUrl: 'https://myoperator.com/docs/api',
    warningNote: 'Paste this webhook URL in MyOperator settings and test the connection before publishing. Untested webhooks may cause data loss.',
  },
  cloudtalk: {
    title: 'CloudTalk Webhook Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Log in to your CloudTalk admin portal.',
      'Go to Settings → Integrations → Webhooks.',
      'Click "Add Webhook" and paste the URL.',
      'Select events: call.created, call.answered, call.ended.',
      'Enter your Webhook Signing Secret for verification.',
      'Send a test event and confirm receipt before publishing.',
    ],
    docsUrl: 'https://support.cloudtalk.io/hc/en-us/articles/webhooks',
    warningNote: 'Ensure the webhook signing secret matches and the test event is received before publishing.',
  },
  ringcentral: {
    title: 'RingCentral Developer Console Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Log in to the RingCentral Developer Console.',
      'Open your app and go to Settings → Webhooks.',
      'Click "Add Webhook Subscription" and paste the URL.',
      'Select event filters: telephony.sessions, call-log.',
      'RingCentral will send a validation request — ensure your endpoint responds.',
      'Verify the subscription is Active before publishing.',
    ],
    docsUrl: 'https://developers.ringcentral.com/guide/notifications/webhooks',
    warningNote: 'RingCentral requires webhook validation. Ensure your endpoint is live and responds to the validation request before publishing.',
  },
  ivr: {
    title: 'IVR Vendor Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Log in to your IVR vendor admin panel.',
      'Navigate to Webhook or Callback URL settings.',
      'Paste the Webhook URL as the inbound call event endpoint.',
      'Configure the auth token in the Authorization header.',
      'Send a test call or use the vendor\'s test feature.',
      'Confirm the event is received before publishing.',
    ],
    warningNote: 'Ensure the webhook is active and tested in your IVR platform before publishing. Publishing without webhook setup will result in no call data being captured.',
  },
  'ivr-custom': {
    title: 'Custom IVR / Internal System Configuration',
    steps: [
      'Copy the Webhook URL above.',
      'Configure your IVR system or internal telephony platform to POST call events to this URL.',
      'Include the Auth Token in the Authorization header of each request.',
      'Optionally whitelist your server IPs for added security.',
      'Send a test POST request with a sample payload.',
      'Verify the test event appears in the connection test logs.',
      'Once verified, publish the integration.',
    ],
    warningNote: 'Ensure your custom IVR system is configured to send events to this webhook URL before publishing.',
  },
};

const samplePayloads: Partial<Record<ConnectorType, Record<string, unknown>>> = {
  facebook: {
    lead_name: 'Ananya Krishnan',
    email: 'ananya.krishnan@gmail.com',
    mobile: '+91 98765 43210',
    city: 'Bangalore',
    campaign_name: 'Q3 Home Loan Lead Gen',
    ad_name: 'Home Loan - Interest Rate Focus',
    ad_id: '23851234567890',
    source: 'facebook',
    created_at: '2026-09-01T14:52:18Z',
    raw_data: { form_id: '987654321098765', page_id: '123456789012345' },
  },
  'google-ads': {
    lead_name: 'Vikram Nair',
    email: 'vikram.nair@outlook.com',
    mobile: '+91 87654 32109',
    city: 'Mumbai',
    campaign_name: 'Brand - Generic Keywords',
    keyword: 'best personal loan',
    source: 'google_ads',
    created_at: '2026-09-01T14:48:33Z',
  },
  ivr: {
    lead_name: 'Sunita Reddy',
    mobile: '+91 76543 21098',
    city: 'Hyderabad',
    source: 'ivr',
    notes: 'Call duration: 3m 42s | IVR input: 2 (interested in product)',
    created_at: '2026-09-01T14:41:07Z',
    raw_data: { agent_id: 'AGT-042', disposition: 'Interested', recording_url: 'https://ivr.vendor.com/rec/abc123' },
  },
  zapier: {
    lead_name: 'Rajesh Pillai',
    email: 'rajesh.pillai@company.com',
    mobile: '+91 65432 10987',
    source: 'zapier_hubspot',
    campaign_name: 'Inbound - Blog Traffic',
    created_at: '2026-09-01T13:55:44Z',
  },
  api: {
    lead_name: 'Deepa Menon',
    email: 'deepa.menon@startup.in',
    mobile: '+91 54321 09876',
    source: 'api_partner_portal',
    created_at: '2026-09-01T13:30:12Z',
    raw_data: { partner_id: 'PTR-0892', lead_score: 78 },
  },
};

const getPayload = (type: ConnectorType) => samplePayloads[type] ?? samplePayloads.api ?? {};

// Generate a deterministic webhook URL based on connector type and integration name
function generateWebhookUrl(connectorType: ConnectorType, integrationName: string): string {
  const slug = integrationName
    ? integrationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : connectorType;
  const token = `wh_${connectorType}_${slug}_a1b2c3d4e5f6`.substring(0, 40);
  return `https://integratio1807.builtwithrocket.new/api/webhooks/${connectorType}/${token}`;
}

interface PreviewStepProps {
  connectorType: ConnectorType;
  integrationName: string;
  onWebhookConfigured?: (configured: boolean) => void;
  webhookConfigured?: boolean;
  onValidationChange?: (validated: boolean) => void;
}

export default function PreviewStep({ connectorType, integrationName, onWebhookConfigured, webhookConfigured = false, onValidationChange }: PreviewStepProps) {
  const [view, setView] = useState<'formatted' | 'raw'>('formatted');
  const [copied, setCopied] = useState(false);
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);
  const [localWebhookConfigured, setLocalWebhookConfigured] = useState(webhookConfigured);

  // Test Lead Validation state
  const [testLeadLoading, setTestLeadLoading] = useState(false);
  const [testLeadResult, setTestLeadResult] = useState<'idle' | 'success' | 'failure'>('idle');
  const [testLeadError, setTestLeadError] = useState('');
  const [testLeadResponse, setTestLeadResponse] = useState<Record<string, unknown> | null>(null);

  const isIVR = IVR_CONNECTORS.includes(connectorType);
  const webhookUrl = isIVR ? generateWebhookUrl(connectorType, integrationName) : '';
  const webhookInstructions = isIVR ? (WEBHOOK_INSTRUCTIONS[connectorType] ?? WEBHOOK_INSTRUCTIONS['ivr']) : null;

  const payload = getPayload(connectorType);
  const jsonString = JSON.stringify(payload, null, 2);

  const copyPayload = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setWebhookUrlCopied(true);
      setTimeout(() => setWebhookUrlCopied(false), 2000);
    });
  };

  const handleMarkConfigured = () => {
    setLocalWebhookConfigured(true);
    onWebhookConfigured?.(true);
  };

  const handleMarkUnconfigured = () => {
    setLocalWebhookConfigured(false);
    onWebhookConfigured?.(false);
  };

  const handleTestLead = () => {
    setTestLeadLoading(true);
    setTestLeadResult('idle');
    setTestLeadError('');
    setTestLeadResponse(null);
    onValidationChange?.(false);
    setTimeout(() => {
      setTestLeadLoading(false);
      // Simulate: success for most connectors, failure demo for specific cases
      const success = Math.random() > 0.25;
      if (success) {
        setTestLeadResult('success');
        setTestLeadResponse({
          status: 'success',
          statusCode: 200,
          leadId: `lead_${Math.random().toString(36).slice(2, 8)}`,
          crmRecordId: `CRM-${Math.floor(Math.random() * 90000 + 10000)}`,
          syncedAt: new Date().toISOString(),
          fields: payload,
        });
        onValidationChange?.(true);
      } else {
        setTestLeadResult('failure');
        setTestLeadError('Validation failed: Required fields (Email, Mobile Number) could not be verified. Please check your field mapping and try again.');
        onValidationChange?.(false);
      }
    }, 1800);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[16px] font-semibold text-foreground">Preview Sample Payload</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          This is what a lead record will look like after mapping. Verify all fields are correct before publishing.
        </p>
      </div>

      {/* Integration summary */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-lg border border-border">
        <ConnectorIcon type={connectorType} size={40} />
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-foreground">{integrationName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{getConnectorLabel(connectorType)}</span>
            <ArrowRight size={10} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">IntegrationHub CRM</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-success bg-success-bg border border-success-border rounded-full px-2.5 py-1">
          <CheckCircle size={11} /> Mapping Valid
        </div>
      </div>

      {/* ── WEBHOOK URL SECTION (IVR only) ── */}
      {isIVR && (
        <div className={`mb-6 rounded-xl border-2 overflow-hidden ${localWebhookConfigured ? 'border-success' : 'border-warning'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 ${localWebhookConfigured ? 'bg-success-bg' : 'bg-warning-bg'}`}>
            <div className="flex items-center gap-2">
              <Webhook size={15} className={localWebhookConfigured ? 'text-success' : 'text-warning'} />
              <span className="text-[13px] font-semibold text-foreground">Webhook URL</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${localWebhookConfigured ? 'text-success bg-success-bg border-success-border' : 'text-warning bg-warning-bg border-warning-border'}`}>
                {localWebhookConfigured ? '✓ Configured' : '⚠ Setup Required'}
              </span>
            </div>
            {localWebhookConfigured && (
              <button
                onClick={handleMarkUnconfigured}
                className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Mark as not configured
              </button>
            )}
          </div>

          <div className="p-4 bg-card">
            {/* URL Preview + Copy */}
            <p className="text-[12px] text-muted-foreground mb-2">
              Copy this webhook URL and paste it into your <span className="font-semibold text-foreground">{getConnectorLabel(connectorType)}</span> platform to receive call events.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-muted rounded-lg border border-border font-mono text-[12px] text-foreground overflow-hidden">
                <Webhook size={12} className="text-primary flex-shrink-0" />
                <span className="truncate">{webhookUrl}</span>
              </div>
              <button
                onClick={copyWebhookUrl}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold border transition-all flex-shrink-0 ${
                  webhookUrlCopied
                    ? 'bg-success-bg border-success-border text-success' :'bg-primary text-white border-primary hover:bg-primary/90 active:scale-95'
                }`}
              >
                {webhookUrlCopied ? <CheckCircle size={13} /> : <Copy size={13} />}
                {webhookUrlCopied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>

            {/* Provider-specific warning note */}
            {webhookInstructions?.warningNote && (
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-warning-bg border border-warning-border">
                <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-warning leading-relaxed">{webhookInstructions.warningNote}</p>
              </div>
            )}

            {/* Step-by-step instructions */}
            {webhookInstructions && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-semibold text-foreground">{webhookInstructions.title}</p>
                  {webhookInstructions.docsUrl && (
                    <a
                      href={webhookInstructions.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      View Docs <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <ol className="space-y-1.5">
                  {webhookInstructions.steps.map((step, i) => (
                    <li key={`step-${i + 1}`} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[12px] text-foreground leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Additional best-practice notes */}
            <div className="mb-4 p-3 rounded-lg bg-info-bg border border-info-border">
              <p className="text-[11px] font-semibold text-info mb-1.5">Best Practice Checklist</p>
              <ul className="space-y-1">
                {[
                  'Ensure the webhook endpoint is active and reachable before publishing.',
                  'Test the webhook connection in the IVR platform before finalizing.',
                  'Do not publish until the webhook is configured and a test event is received.',
                ].map((note, i) => (
                  <li key={`note-${i + 1}`} className="flex items-start gap-1.5 text-[11px] text-info/80">
                    <span className="mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mark as configured CTA */}
            {!localWebhookConfigured ? (
              <button
                onClick={handleMarkConfigured}
                className="flex items-center gap-2 px-4 py-2 bg-success text-white text-[12px] font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm"
              >
                <ClipboardCheck size={13} />
                I have configured and tested the webhook
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-success-bg border border-success-border rounded-lg">
                <CheckCircle size={14} className="text-success" />
                <span className="text-[12px] font-semibold text-success">Webhook configured and ready — you may now publish.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('formatted')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${view === 'formatted' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
        >
          <Eye size={12} /> Formatted View
        </button>
        <button
          onClick={() => setView('raw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${view === 'raw' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
        >
          <Code size={12} /> Raw JSON
        </button>
        <button
          onClick={copyPayload}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-card border border-border hover:bg-muted transition-all"
        >
          {copied ? <CheckCircle size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>

      {view === 'formatted' ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sample Lead Record</p>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(payload).map(([key, value]) => (
              <div key={`prev-${key}`} className="flex items-start gap-4 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                <span className="text-[12px] font-semibold text-primary w-36 flex-shrink-0 font-tabular">{key}</span>
                <span className="text-[12px] text-foreground flex-1">
                  {typeof value === 'object' ? (
                    <span className="font-mono text-[11px] text-muted-foreground">{JSON.stringify(value)}</span>
                  ) : (
                    String(value)
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                  {typeof value === 'object' ? 'object' : typeof value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border border-border bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">application/json</span>
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </div>
          <pre className="p-4 text-[12px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
            {jsonString}
          </pre>
        </div>
      )}

      {/* Field count summary */}
      <div className="flex items-center gap-4 mt-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center">
          <p className="text-[18px] font-bold text-foreground font-tabular">{Object.keys(payload).length}</p>
          <p className="text-[10px] text-muted-foreground">Total Fields</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-[18px] font-bold text-success font-tabular">
            {Object.entries(payload).filter(([, v]) => v !== null && v !== '').length}
          </p>
          <p className="text-[10px] text-muted-foreground">Populated</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <p className="text-[18px] font-bold text-foreground font-tabular">0</p>
          <p className="text-[10px] text-muted-foreground">Unmapped</p>
        </div>
        <div className="ml-auto text-[12px] text-success font-semibold flex items-center gap-1.5">
          <CheckCircle size={13} /> All required fields present
        </div>
      </div>

      {/* Test Lead Validation */}
      <div className="mt-5 pt-5 border-t border-border">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-[13px] font-semibold text-foreground">Test Lead Validation</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Run an end-to-end test with sample data to verify the full integration flow before publishing.
            </p>
          </div>
          <button
            onClick={handleTestLead}
            disabled={testLeadLoading}
            className="flex items-center gap-2 h-9 px-5 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {testLeadLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Testing...</>
            ) : (
              <><FlaskConical size={14} /> Test Lead Validation</>
            )}
          </button>
        </div>

        {testLeadResult === 'success' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success-bg border border-success-border">
              <CheckCircle size={18} className="text-success flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-success">Lead Fetch Successfully</p>
                <p className="text-[11px] text-success/80 mt-0.5">End-to-end validation passed. Your integration is ready to publish.</p>
              </div>
            </div>
            {testLeadResponse && (
              <div className="rounded-lg border border-border bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">Response Payload</span>
                  <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">{String(testLeadResponse.statusCode)} OK</span>
                </div>
                <pre className="p-4 text-[12px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(testLeadResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {testLeadResult === 'failure' && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-danger-bg border border-danger-border">
            <XCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-danger">Validation Failed</p>
              <p className="text-[11px] text-danger/80 mt-0.5">{testLeadError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}