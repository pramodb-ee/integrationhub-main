'use client';
import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useState } from 'react';
import CollapsibleCard from './JustDialCollapsibleCard';
import { Code2 } from 'lucide-react';
import {
  JUSTDIAL_URL_EXAMPLE,

  JDRequest,
  mapJustDial,
  parseJustDialRequest,
} from './justDialRequest';

function JsonBox({ title, value }: { title: string; value: unknown }) {
  const json = JSON.stringify(value, null, 2);
  const tokens = json.split(
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\b\d+(?:\.\d+)?\b)/g
  );
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        {title}
      </h3>
      <pre
        tabIndex={0}
        aria-label={title}
        className="h-96 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-300"
      >
        <code>
          {tokens.map((token, i) => (
            <span
              key={i}
              className={
                /^".*:\s*$/.test(token)
                  ? 'text-sky-300'
                  : token.startsWith('"')
                    ? 'text-emerald-300'
                    : /^(true|false|null)$/.test(token)
                      ? 'text-violet-300'
                      : /^-?\d/.test(token)
                        ? 'text-amber-300'
                        : ''
              }
            >
              {token}
            </span>
          ))}
        </code>
      </pre>
    </section>
  );
}
type Log = {
  id: string;
  timestamp: string;
  method: string;
  status: string;
  reason: string;
  raw: Record<string, unknown> | null;
  queued: ReturnType<typeof mapJustDial> | null;
};
export default function JustDialRequestPanel({
  onParsed,
  integrationName,
  onNameChange,
}: {
  onParsed: (request: JDRequest | null) => void;
  integrationName: string;
  onNameChange: (value: string) => void;
}) {
  const [text, setText] = useSetupState('justdial', 'JustDialRequestPanel.text', JUSTDIAL_URL_EXAMPLE);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selected, setSelected] = useState<Log | null>(null);
  const parse = () => {
    let result: JDRequest | null = null;
    let queued: ReturnType<typeof mapJustDial> | null = null;
    let reason = '';
    try {
      result = parseJustDialRequest(text);
      queued = mapJustDial(result.fields);
      reason = queued.FailedMessage;
    } catch (e) {
      reason = e instanceof Error ? e.message : 'Request parsing failed.';
    }
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      method: result?.method ?? '—',
      status: reason ? 'Failure' : 'Success',
      reason,
      raw: result?.fields ?? null,
      queued,
    };
    setLogs((rows) => [entry, ...rows].slice(0, 100));
    setSelected(entry);
    onParsed(result);
  };
  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <label className="block w-full text-xs font-medium">Integration Name<input value={integrationName} onChange={(e) => onNameChange(e.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></label>
      </section>
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">API Request</h2>
        <p className="text-xs text-muted-foreground">
          Paste a request URL, cURL, raw HTTP or JSON. Requests are parsed locally, never executed. Logs cover this
          session’s last 100 parsing attempts; this screen does not listen for live webhooks.
        </p>
        <textarea
          aria-label="JustDial HTTP request"
          rows={9}
          spellCheck={false}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSelected(null);
            onParsed(null);
          }}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-5 text-green-300"
        />
        <div className="flex gap-2">
          <button
            className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            disabled={!text.trim()}
            onClick={parse}
          >
            Parse Request
          </button>
          <button
            className="rounded border border-border px-3 py-2 text-xs"
            onClick={() => {
              setText(JUSTDIAL_URL_EXAMPLE);
              setSelected(null);
              onParsed(null);
            }}
          >
            Load Example
          </button>
        </div>
      </section>
      <CollapsibleCard title="Parsed Request" subtitle="Raw JustDial request and mapped CRM payload" icon={<Code2 size={15} />} defaultOpen>
        {selected && (
          <p
            role="status"
            className={`text-xs ${selected.status === 'Success' ? 'text-green-600' : 'text-red-600'}`}
          >
            {selected.status === 'Success'
              ? 'Request parsed and mapped successfully. CRM delivery has not been attempted.'
              : selected.reason}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <JsonBox title="HttpRequestJson" value={selected?.raw ?? {}} />
          <JsonBox title="QueuedRequestJson" value={selected?.queued ?? {}} />
        </div>
      </CollapsibleCard>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Request Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted">
              <tr>
                {['Request Timestamp (UTC)', 'Method', 'Status', 'Error Reason', 'Request'].map(
                  (h) => (
                    <th key={h} className="p-2">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="p-2">{log.timestamp}</td>
                  <td className="p-2">{log.method}</td>
                  <td
                    className={`p-2 ${log.status === 'Success' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {log.status}
                  </td>
                  <td className="p-2">{log.reason || '—'}</td>
                  <td className="p-2">
                    <button className="text-primary underline" onClick={() => setSelected(log)}>
                      View JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!logs.length && (
            <p className="py-5 text-center text-xs text-muted-foreground">
              No requests parsed yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
