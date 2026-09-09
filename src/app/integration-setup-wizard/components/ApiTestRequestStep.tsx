'use client';

import React, { useState } from 'react';
import {
  Check, ChevronRight, Copy, GitBranch, Link2, Loader2, RefreshCw, Trash2, X,
} from 'lucide-react';

interface TestRequestPayload {
  name: string;
  email: string;
  phone: string;
  course: string;
  city: string;
  source: string;
  status?: string;
}

interface TestRequest {
  id: string;
  requestType: string;
  method: 'POST' | 'GET';
  status: 'Success' | 'Pending';
  timestamp: string;
  created: string;
  payload: TestRequestPayload;
}

const REQUEST_TYPES = ['Lead Capture', 'Webhook Test', 'Form Submission'];

const SAMPLE_PAYLOADS: TestRequestPayload[] = [
  { name: 'Ananya Gupta', email: 'ananya.gupta@example.com', phone: '+91 9812345670', course: 'MBA', city: 'Pune', source: 'Website Form' },
  { name: 'Rohit Malhotra', email: 'rohit.malhotra@example.com', phone: '+91 9823456781', course: 'B.Tech CSE', city: 'Bengaluru', source: 'Landing Page' },
  { name: 'Simran Kaur', email: 'simran.kaur@example.com', phone: '+91 9834567892', course: 'BBA', city: 'Delhi', source: 'Referral' },
];

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 16; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function buildRequest(payload: TestRequestPayload, requestType: string, minutesAgo: number): TestRequest {
  const now = new Date(Date.now() - minutesAgo * 60000);
  return {
    id: `REQ-${crypto.randomUUID()}`,
    requestType,
    method: 'POST',
    status: 'Success',
    timestamp: now.toLocaleString(),
    created: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    payload: { ...payload, status: payload.status ?? 'New' },
  };
}

function buildSeedRequests(): TestRequest[] {
  return [
    buildRequest(SAMPLE_PAYLOADS[0], 'Lead Capture', 4),
    buildRequest(SAMPLE_PAYLOADS[1], 'Webhook Test', 42),
  ];
}

interface ApiTestRequestStepProps {
  integrationName?: string;
  isNewIntegration?: boolean;
  onFieldMappingCreated: (payload: Record<string, unknown>) => void;
  onCaptureRequest?: (payload: Record<string, unknown>) => string | null;
}

export default function ApiTestRequestStep({ integrationName, isNewIntegration = false, onFieldMappingCreated, onCaptureRequest }: ApiTestRequestStepProps) {
  const [endpoint] = useState(() => `https://eeintegration-test.azurewebsites.net/api/integration/${generateToken()}`);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<TestRequest[]>(() => isNewIntegration ? [] : buildSeedRequests());
  const [mappingPanel, setMappingPanel] = useState<TestRequest | null>(null);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const handleCopy = async () => {
    try {
      setCopyError('');
      await navigator.clipboard.writeText(endpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError('Unable to copy URL. Select the URL and copy it manually.');
    }
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setFetchError('');
    setTimeout(() => {
      // Simulate the next incoming request until the integration API is connected.
      const request = buildRequest(SAMPLE_PAYLOADS[requests.length % SAMPLE_PAYLOADS.length], REQUEST_TYPES[requests.length % REQUEST_TYPES.length], 0);
      const error = onCaptureRequest?.({ ...request.payload });
      if (error) setFetchError(error);
      else setRequests((current) => [request, ...current]);
      setRefreshing(false);
    }, 700);
  };

  const deleteRequest = (id: string) => setRequests((current) => current.filter((request) => request.id !== id));

  const handleCreateNew = () => {
    if (!mappingPanel || creating) return;
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setMappingPanel(null);
      onFieldMappingCreated({ ...mappingPanel.payload });
    }, 500);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold text-foreground">Test Request</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{integrationName ? `${integrationName} — ` : ''}Send a sample request to your integration endpoint to verify it&rsquo;s reachable.</p>
      </div>

      <div className="card-base overflow-hidden rounded-lg pb-5 space-y-4">
        <h2 className="border-b border-border px-4 py-4 text-[15px] font-medium text-muted-foreground">Integration Endpoint URL</h2>
        <div className="flex items-center gap-2 px-4">
          <div className="min-w-0 flex-1 min-h-10 px-3 py-2 flex items-center bg-[#f5f5f5] rounded overflow-x-auto">
            <code className="text-[11px] text-rose-500 bg-[#ededed] border border-[#d1d1d1] rounded-sm px-1 py-0.5 font-mono whitespace-nowrap select-all">{endpoint}</code>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 h-10 px-3.5 text-[12px] font-semibold rounded-lg border transition-colors flex-shrink-0 ${
              copied ? 'bg-success-bg text-success border-success-border' : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy URL'}
          </button>
        </div>
        {copyError && <p role="alert" className="px-4 text-xs text-danger">{copyError}</p>}
        <p className="px-4 text-[11px] text-muted-foreground/60 leading-relaxed">
          Use this URL to send test requests to your integration. Copy the URL and use it in your API client or webhook configuration.
        </p>
      </div>

      <div className="space-y-2.5">
        {fetchError && <p role="alert" className="text-[12px] text-danger bg-danger-bg p-3 rounded-lg">{fetchError}</p>}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Test Requests</span>
          {requests.length > 0 && <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
            className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>}
        </div>

        {requests.length === 0 ? (
          <div className="card-base rounded-xl px-4 py-10 text-center">
            <p className="text-[12px] text-muted-foreground">Send a test request to your integration endpoint, then fetch it here.</p>
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-1.5 h-9 px-4 mt-4 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
              {refreshing && <Loader2 size={13} className="animate-spin" />}
              {refreshing ? 'Fetching…' : 'Fetch Test Request'}
            </button>
          </div>
        ) : (
          <div className="card-base overflow-x-auto rounded-xl">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.3fr_1fr_1.2fr] gap-3 px-4 py-3 bg-muted/50 border-b border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Request Type</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">API Method</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Request Timestamp</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Created</span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Action</span>
              </div>
              <div className="divide-y divide-border">
                {requests.map((request) => (
                  <div key={request.id} className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.3fr_1fr_1.2fr] gap-3 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors">
                    <span className="text-[12px] font-semibold text-foreground truncate">{request.requestType}</span>
                    <span className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">{request.method}</span>
                    <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold bg-success-bg text-success border border-success-border">
                      <Check size={11} />{request.status}
                    </span>
                    <span className="text-[12px] text-muted-foreground font-tabular truncate">{request.timestamp}</span>
                    <span className="text-[12px] text-muted-foreground font-tabular truncate">{request.created}</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMappingPanel(request)}
                        className="flex items-center gap-1.5 h-7 px-2.5 text-[10px] font-semibold rounded-md bg-primary text-white hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
                      >
                        <GitBranch size={11} />Fetch Mapping
                      </button>
                      <button type="button" onClick={() => deleteRequest(request.id)} title="Delete" className="p-1.5 rounded-md hover:bg-danger-bg text-danger transition-colors flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Field Mapping — side panel */}
      {mappingPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !creating && setMappingPanel(null)} />
          <div className="relative w-full sm:max-w-lg bg-card h-full shadow-2xl border-l border-border flex flex-col fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-orange-50 dark:bg-orange-950/20 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Link2 size={16} className="text-primary" />
                </div>
                <h2 className="text-[16px] font-bold text-foreground">Load Field Mapping from Test Request</h2>
              </div>
              <button type="button" onClick={() => !creating && setMappingPanel(null)} className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground transition-colors" aria-label="Close panel">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                This will create new field mappings based on the test request data:
              </p>
              <div className="rounded-lg border border-border bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">Request Payload</span>
                  <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">{mappingPanel.status}</span>
                </div>
                <pre className="p-4 text-[12px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify({
                    requestId: mappingPanel.id,
                    requestType: mappingPanel.requestType,
                    method: mappingPanel.method,
                    status: mappingPanel.status,
                    timestamp: mappingPanel.timestamp,
                    data: mappingPanel.payload,
                  }, null, 2)}
                </pre>
              </div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground">Options:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong className="font-semibold text-foreground">Create New:</strong> Reset existing mappings and start fresh with this test request data</li>
                  <li><strong className="font-semibold text-foreground">Cancel:</strong> Close this dialog without making changes</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
              <button type="button" onClick={() => setMappingPanel(null)} disabled={creating} className="h-9 px-5 text-[12px] font-semibold border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleCreateNew} disabled={creating} className="flex items-center gap-2 h-9 px-5 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70">
                {creating ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                {creating ? 'Creating…' : 'Create New'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
