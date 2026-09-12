'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Mail, Phone, Plus, RefreshCw, Trash2, UserCheck } from 'lucide-react';
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

type TestLeadRow = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  receivedAtISO: string;
  receivedAt: string;
  addedToCrm: boolean;
  fields: Record<string, unknown>;
  response: Record<string, unknown>;
  curl: string;
};

const button = 'inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border border-border hover:bg-muted';
const jsonClass = 'p-4 rounded-lg bg-slate-950 text-slate-200 text-[12px] overflow-x-auto whitespace-pre-wrap break-all';

function LeadStatusPill({ added }: { added: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border w-fit ${added ? 'bg-success-bg text-success border-success-border' : 'bg-muted text-muted-foreground border-border'}`}>
      {added && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {added ? 'Added' : 'Pending'}
    </span>
  );
}

export default function ApiPreviewStep({ integrationId, integrationName, payload, mapping, onValidationChange, checkCapture, recordCapture }: Props) {
  const [view, setView] = useState<'sample' | 'raw'>('sample');
  const [testLeads, setTestLeads] = useState<TestLeadRow[]>([]);
  const [fetchingLead, setFetchingLead] = useState(false);
  const [failure, setFailure] = useState<Record<string, unknown> | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const output = mappedPayload(payload, mapping);
  const json = JSON.stringify(output, null, 2);

  useEffect(() => {
    try {
      const loaded = readDummyLeads().filter((lead) => lead.integrationId === integrationId).map((lead) => ({
        id: lead.id,
        name: String(lead.fields.lead_name ?? lead.fields.name ?? 'Test Lead'),
        email: String(lead.fields.email ?? ''),
        mobile: String(lead.fields.mobile ?? lead.fields.phone ?? ''),
        receivedAtISO: lead.createdAt,
        receivedAt: new Date(lead.createdAt).toLocaleString(),
        addedToCrm: true,
        fields: lead.fields,
        response: lead.response,
        curl: lead.curl,
      }));
      setTestLeads(loaded);
    } catch (error) { setFailure({ status: 'failed', reason: error instanceof Error ? error.message : 'Cannot read dummy CRM.' }); }
  }, [integrationId]);

  const fetchTestLead = () => {
    setSuccess(false);
    setFailure(null);
    const errors = mappingErrors(mapping);
    if (!Object.keys(output).length) errors.push('No fields are mapped.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(output.email ?? ''))) errors.push('A valid email is required.');
    if (String(output.mobile ?? output.phone ?? '').replace(/\D/g, '').length < 10) errors.push('A valid mobile or phone number is required.');
    const capError = checkCapture(output);
    if (capError) errors.push(capError);
    if (errors.length) { setFailure({ status: 'failed', statusCode: capError ? 429 : 422, reason: errors.join(' '), errors }); return; }

    setFetchingLead(true);
    setTimeout(() => {
      const id = `TEST-${crypto.randomUUID()}`;
      const response = { status: 'success', statusCode: 201, leadId: id, fields: output };
      const escapedJson = JSON.stringify(output).replace(/'/g, `'"'"'`);
      const curl = `curl -X POST 'https://dummy-crm.example/api/leads' -H 'Content-Type: application/json' --data '${escapedJson}'`;
      recordCapture(output);
      const now = new Date();
      const row: TestLeadRow = {
        id,
        name: String(output.lead_name ?? output.name ?? 'Test Lead'),
        email: String(output.email ?? ''),
        mobile: String(output.mobile ?? output.phone ?? ''),
        receivedAtISO: now.toISOString(),
        receivedAt: now.toLocaleString(),
        addedToCrm: false,
        fields: output,
        response,
        curl,
      };
      setTestLeads((prev) => [row, ...prev]);
      setFetchingLead(false);
      setSuccess(true);
    }, 700);
  };

  const addLeadToCrm = (id: string) => {
    const row = testLeads.find((item) => item.id === id);
    if (!row || row.addedToCrm) return;
    try {
      const lead: DummyLead = { id: row.id, integrationId, fields: row.fields, createdAt: row.receivedAtISO, response: row.response, curl: row.curl };
      saveDummyLead(lead);
      setTestLeads((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, addedToCrm: true } : item));
        onValidationChange(next.some((item) => item.addedToCrm));
        return next;
      });
    } catch (error) { setFailure({ status: 'failed', reason: error instanceof Error ? error.message : 'Could not save the test lead.' }); }
  };

  const deleteLead = (id: string) => {
    const row = testLeads.find((item) => item.id === id);
    if (row?.addedToCrm) {
      try { deleteDummyLead(id); } catch (error) { setFailure({ status: 'failed', reason: error instanceof Error ? error.message : 'Could not delete the lead.' }); return; }
    }
    setTestLeads((prev) => {
      const next = prev.filter((item) => item.id !== id);
      onValidationChange(next.some((item) => item.addedToCrm));
      return next;
    });
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
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"><UserCheck size={16} /></div>
          <div>
            <h3 className="text-[13px] font-semibold">Test Lead</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Fetch a sample lead from your mapped payload, then add it to CRM or discard it.</p>
          </div>
        </div>
        <button className={`${button} bg-primary text-white`} onClick={fetchTestLead} disabled={fetchingLead}>
          {fetchingLead ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {fetchingLead ? 'Fetching...' : 'Fetch Test Lead'}
        </button>
      </div>
      {success && <p role="status" className="text-[12px] text-success bg-success-bg p-3 rounded-lg">Test lead created successfully. Add it to CRM to continue to Publish, or discard it.</p>}
      {failure && <div role="alert"><p className="text-[12px] font-semibold text-danger mb-2">Response Payload</p><pre className={jsonClass}>{JSON.stringify(failure, null, 2)}</pre></div>}
      {testLeads.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No test leads fetched yet.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.2fr_1.4fr_1.2fr_1.3fr_110px_190px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Name</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Email</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Mobile</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Received At</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground text-right">Actions</span>
              </div>
              <div className="divide-y divide-border">
                {testLeads.map((lead) => (
                  <div key={lead.id} className="grid grid-cols-[1.2fr_1.4fr_1.2fr_1.3fr_110px_190px] gap-3 px-4 py-2.5 items-center hover:bg-muted/20 transition-colors">
                    <span className="text-[12px] font-medium text-foreground truncate">{lead.name}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate"><Mail size={11} className="flex-shrink-0" />{lead.email}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate"><Phone size={11} className="flex-shrink-0" />{lead.mobile}</span>
                    <span className="text-[11px] text-muted-foreground font-mono truncate">{lead.receivedAt}</span>
                    <LeadStatusPill added={lead.addedToCrm} />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => addLeadToCrm(lead.id)}
                        disabled={lead.addedToCrm}
                        className="flex items-center gap-1 h-7 px-3 text-[10px] font-semibold rounded-md bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
                      >
                        <Plus size={11} />{lead.addedToCrm ? 'Added' : 'Add'}
                      </button>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-semibold rounded-md bg-danger-bg text-danger hover:bg-danger-bg/70 transition-colors"
                      >
                        <Trash2 size={11} />Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  </div>;
}
