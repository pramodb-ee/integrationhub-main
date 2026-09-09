'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Eye, Trash2, X, FlaskConical } from 'lucide-react';
import type { ApiMappingState } from './FieldMappingStep';
import { deleteDummyLead, mappedPayload, mappingErrors, readDummyLeads, saveDummyLead, type DummyLead } from './apiMapping';

interface Props {
  integrationId: string;
  integrationName: string;
  payload: Record<string, unknown>;
  mapping: ApiMappingState;
  onValidationChange: (valid: boolean) => void;
  checkCapture: (payload: Record<string, unknown>) => string | null;
  recordCapture: (payload: Record<string, unknown>) => void;
}

const button = 'inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border border-border hover:bg-muted';
const jsonClass = 'p-4 rounded-lg bg-slate-950 text-slate-200 text-[12px] overflow-x-auto whitespace-pre-wrap break-all';

export default function ApiPreviewStep({ integrationId, integrationName, payload, mapping, onValidationChange, checkCapture, recordCapture }: Props) {
  const [view, setView] = useState<'sample' | 'raw'>('sample');
  const [leads, setLeads] = useState<DummyLead[]>([]);
  const [details, setDetails] = useState<DummyLead | null>(null);
  const [failure, setFailure] = useState<Record<string, unknown> | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const output = mappedPayload(payload, mapping);
  const json = JSON.stringify(output, null, 2);

  useEffect(() => {
    try { setLeads(readDummyLeads().filter((lead) => lead.integrationId === integrationId)); }
    catch (error) { setFailure({ status: 'failed', reason: error instanceof Error ? error.message : 'Cannot read dummy CRM.' }); }
  }, [integrationId]);

  const testLead = () => {
    onValidationChange(false);
    setSuccess(false);
    setFailure(null);
    const errors = mappingErrors(mapping);
    if (!Object.keys(output).length) errors.push('No fields are mapped.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(output.email ?? ''))) errors.push('A valid email is required.');
    if (String(output.mobile ?? output.phone ?? '').replace(/\D/g, '').length < 10) errors.push('A valid mobile or phone number is required.');
    const capError = checkCapture(output);
    if (capError) errors.push(capError);
    if (errors.length) { setFailure({ status: 'failed', statusCode: capError ? 429 : 422, reason: errors.join(' '), errors }); return; }
    try {
      const id = `TEST-${crypto.randomUUID()}`;
      const response = { status: 'success', statusCode: 201, leadId: id, fields: output };
      const escapedJson = JSON.stringify(output).replace(/'/g, `'"'"'`);
      const lead: DummyLead = { id, integrationId, fields: output, createdAt: new Date().toISOString(), response, curl: `curl -X POST 'https://dummy-crm.example/api/leads' -H 'Content-Type: application/json' --data '${escapedJson}'` };
      saveDummyLead(lead);
      recordCapture(output);
      setLeads(readDummyLeads().filter((item) => item.integrationId === integrationId));
      setSuccess(true);
      onValidationChange(true);
    } catch (error) { setFailure({ status: 'failed', statusCode: 500, reason: error instanceof Error ? error.message : 'Could not save the test lead.' }); }
  };

  const removeLead = (id: string) => {
    try {
      deleteDummyLead(id);
      setLeads(readDummyLeads().filter((lead) => lead.integrationId === integrationId));
      if (details?.id === id) setDetails(null);
      setSuccess(false);
      onValidationChange(false);
    } catch (error) { setFailure({ status: 'failed', reason: error instanceof Error ? error.message : 'Could not delete the lead.' }); }
  };

  return <div className="space-y-5">
    <div><h2 className="text-[16px] font-semibold">Preview — {integrationName}</h2><p className="text-[12px] text-muted-foreground mt-1">Review the selected request and the JSON generated from your field and static mappings.</p></div>
    <div className="flex gap-2">
      <button className={`${button} ${view === 'sample' ? 'bg-primary text-white' : ''}`} onClick={() => setView('sample')}>Sample Payload</button>
      <button className={`${button} ${view === 'raw' ? 'bg-primary text-white' : ''}`} onClick={() => setView('raw')}>Raw JSON</button>
      <button className={`${button} ml-auto`} onClick={async () => { try { await navigator.clipboard.writeText(json); setCopied(true); setCopyError(''); } catch { setCopyError('Could not copy. Select and copy the Raw JSON manually.'); } }}><Copy size={13} />{copied ? 'Copied' : 'Copy JSON'}</button>
    </div>
    {copyError && <p role="alert" className="text-[12px] text-danger">{copyError}</p>}
    {view === 'raw' ? <pre className={jsonClass}>{json}</pre> : <div className="border border-border rounded-lg divide-y divide-border">{Object.entries(payload).map(([key, value]) => <div key={key} className="grid grid-cols-2 gap-3 p-3 text-[12px]"><span className="font-semibold text-primary">{key}</span><span className="break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span></div>)}</div>}
    <section className="border-t border-border pt-5 space-y-3">
      <div className="flex justify-between items-center gap-3"><div><h3 className="text-[13px] font-semibold">Test Lead Verification</h3><p className="text-[11px] text-muted-foreground mt-1">Dummy CRM mode — test leads are stored in this browser.</p></div><button className={`${button} bg-primary text-white`} onClick={testLead}><FlaskConical size={14} />Test Lead</button></div>
      {success && <p role="status" className="text-[12px] text-success bg-success-bg p-3 rounded-lg">Test lead successful. You can continue to Publish.</p>}
      {failure && <div role="alert"><p className="text-[12px] font-semibold text-danger mb-2">Response Payload</p><pre className={jsonClass}>{JSON.stringify(failure, null, 2)}</pre></div>}
      {leads.length > 0 && <div className="overflow-x-auto border border-border rounded-lg"><table className="w-full text-left text-[12px]"><caption className="text-left p-3 font-semibold">Dummy CRM Lead List</caption><thead className="bg-muted"><tr>{['Lead Name', 'Email', 'Mobile', 'Created', 'Actions'].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-t border-border"><td className="p-3">{String(lead.fields.lead_name ?? lead.fields.name ?? 'Test Lead')}</td><td className="p-3">{String(lead.fields.email ?? '')}</td><td className="p-3">{String(lead.fields.mobile ?? lead.fields.phone ?? '')}</td><td className="p-3">{new Date(lead.createdAt).toLocaleString()}</td><td className="p-3"><div className="flex gap-2 whitespace-nowrap"><button className={button} onClick={() => setDetails(lead)}><Eye size={12} />Lead Details</button><button className={`${button} text-danger`} onClick={() => removeLead(lead.id)}><Trash2 size={12} />Delete Lead</button></div></td></tr>)}</tbody></table></div>}
    </section>
    {details && <div role="dialog" aria-modal="true" aria-label="Lead Details" className="fixed inset-0 z-50 flex justify-end"><div className="absolute inset-0 bg-black/40" onClick={() => setDetails(null)} /><div className="relative w-full sm:max-w-xl bg-card p-6 overflow-y-auto shadow-xl space-y-4"><div className="flex items-center justify-between"><h3 className="font-semibold">Lead Details</h3><button aria-label="Close lead details" onClick={() => setDetails(null)}><X size={18} /></button></div><p className="text-[11px] text-muted-foreground break-all">{details.id}</p><h4 className="text-[13px] font-semibold">cURL (dummy CRM example)</h4><pre className={jsonClass}>{details.curl}</pre><h4 className="text-[13px] font-semibold">Response</h4><pre className={jsonClass}>{JSON.stringify(details.response, null, 2)}</pre></div></div>}
  </div>;
}
