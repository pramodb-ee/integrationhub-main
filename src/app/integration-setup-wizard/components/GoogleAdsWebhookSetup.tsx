'use client';
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

/** The CRM endpoint must link the selected asset server-side using stored OAuth credentials. */
export default function GoogleAdsWebhookSetup({ connected, account, campaign, form }: { connected: boolean; account: string; campaign: string; form: string }) {
  const [state, setState] = useState<'idle' | 'linking' | 'linked' | 'error'>('idle');
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [demo, setDemo] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { controller.current?.abort(); setState('idle'); setPayload(null); setError(''); return () => controller.current?.abort(); }, [connected, account, campaign, form]);
  const link = async () => {
    if (!connected || state === 'linking') return;
    setError(''); setPayload(null);
    const endpoint = process.env.NEXT_PUBLIC_GOOGLE_ADS_LINK_ENDPOINT || '/api/google-ads/link';
    if (!endpoint) { setState('error'); setError('Google Ads linking service is not configured. Connect the CRM backend to push the webhook URL and key to the selected lead form.'); return; }
    setState('linking'); const request = new AbortController(); controller.current = request;
    const timeout = setTimeout(() => request.abort(), 30000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account, campaign, form, webhookUrl: process.env.NEXT_PUBLIC_GOOGLE_ADS_WEBHOOK_URL || 'https://crm.example.com/webhooks/google-ads', webhookKey: 'demo_google_ads_webhook_key' }), signal: request.signal });
      const result = await response.json();
      if (request.signal.aborted) return;
      if (!response.ok || result?.linked !== true) throw new Error(typeof result?.message === 'string' ? result.message : 'Webhook could not be linked. Please try again.');
      setState('linked');
      setDemo(result.demo === true);
      if (result.samplePayload && typeof result.samplePayload === 'object' && !Array.isArray(result.samplePayload)) setPayload(result.samplePayload);
    } catch (e) {
      if (controller.current !== request) return;
      setState('error'); setError(request.signal.aborted ? 'Link request timed out. Please try again.' : e instanceof Error ? e.message : 'Unable to link webhook.');
    } finally { clearTimeout(timeout); }
  };
  return <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2"><label className="block text-xs text-muted-foreground">Webhook URL<input readOnly value={process.env.NEXT_PUBLIC_GOOGLE_ADS_WEBHOOK_URL || 'https://crm.example.com/webhooks/google-ads'} className="mt-2 h-9 w-full rounded-md border border-border bg-muted/40 px-3 text-xs" /></label><label className="block text-xs text-muted-foreground">Webhook Key<input readOnly type="password" value="demo_google_ads_webhook_key" aria-label="Webhook Key" className="mt-2 h-9 w-full rounded-md border border-border bg-muted/40 px-3 text-xs" /></label></div>
    {!process.env.NEXT_PUBLIC_GOOGLE_ADS_LINK_ENDPOINT && <p className="text-xs text-muted-foreground">Demo CRM linking — uses a dummy response and sample payload.</p>}
    <button onClick={link} disabled={!connected || state === 'linking' || state === 'linked'} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">{state === 'linking' ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}{state === 'linking' ? 'Linking...' : 'Link to Google Ads'}</button>
    {state === 'linked' && <p role="status" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700"><CheckCircle2 size={16} />Webhook linked successfully to Google Ads Lead Form Extension{demo ? ' (demo)' : ''}.</p>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <section className="overflow-hidden rounded-lg border border-border"><h3 className="border-b border-border px-4 py-3 text-sm font-semibold">Sample Payload Received</h3>{payload ? <pre tabIndex={0} className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-emerald-300">{JSON.stringify(payload, null, 2)}</pre> : <p className="p-4 text-xs text-muted-foreground">{state === 'linked' ? 'Webhook linked. No sample payload has been received from Google Ads yet.' : 'Link the webhook to receive a sample payload from Google Ads.'}</p>}</section>
  </div>;
}
