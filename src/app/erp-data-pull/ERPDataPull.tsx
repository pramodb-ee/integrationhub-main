'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Code2, Download, Plus, RefreshCw, Save, Tag, Trash2, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import {
  CRM_FIELDS,
  INITIAL_MAPPINGS,
  Mapping,
  Row,
  SAMPLE,
  mappingErrors,
  parseRecords,
  transform,
} from './erpPull';

const btn =
  'inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40';
const primary = `${btn} !border-primary !bg-primary !text-white`;
const input =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const STORE = 'erp-data-pull-settings-v1';
type Config = { base: string; auth: string; endpoint: string; sync: string; direction: string };
type Log = {
  id: string;
  time: string;
  total: number;
  success: number;
  failed: number;
  status: string;
  reason: string;
  records: { raw: Row; crm: Row; error: string }[];
};
type Failed = { id: string; raw: Row; error: string };
type StaticField = { id: string; field: string; value: string };
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-base space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-xs font-medium">
      {label}
      <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
function Json({ title, value }: { title: string; value: unknown }) {
  const tokens = JSON.stringify(value, null, 2).split(
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|\b\d+\b)/g
  );
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-700">
      <h3 className="bg-slate-900 px-4 py-3 text-xs font-semibold text-white">{title}</h3>
      <pre
        tabIndex={0}
        aria-label={title}
        className="h-72 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-300"
      >
        <code>
          {tokens.map((t, i) => (
            <span
              key={i}
              className={
                t.endsWith(':')
                  ? 'text-sky-300'
                  : t.startsWith('"')
                    ? 'text-green-300'
                    : /^(true|false|null)$/.test(t)
                      ? 'text-purple-300'
                      : /^\d/.test(t)
                        ? 'text-amber-300'
                        : ''
              }
            >
              {t}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export default function ERPDataPull() {
  const [curl, setCurl] = useState(`curl -X GET "https://erp.example.com/api/students" \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json"`);
  const [parsedRequest, setParsedRequest] = useState<Record<string, unknown> | null>(null);
  const [config, setConfig] = useState<Config>({
    base: 'https://erp.example.com',
    auth: 'API Key',
    endpoint: '/api/students',
    sync: 'Hourly',
    direction: 'Pull',
  });
  const [secret, setSecret] = useState('');
  const [connected, setConnected] = useState(false);
  const [tested, setTested] = useState(false);
  const [active, setActive] = useState(false);
  const [mappings, setMappings] = useState<Mapping[]>(INITIAL_MAPPINGS);
  const [staticFields, setStaticFields] = useState<StaticField[]>([]);
  const [response, setResponse] = useState(JSON.stringify(SAMPLE, null, 2));
  const [raw, setRaw] = useState<Row[]>([]);
  const [parsed, setParsed] = useState<Row[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [failed, setFailed] = useState<Failed[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [sendTime, setSendTime] = useState('09:00');
  const [frequency, setFrequency] = useState('Daily');
  const [alertSaved, setAlertSaved] = useState(false);
  const nextFocus = useRef<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) ?? 'null');
      if (value?.config && Array.isArray(value.mappings)) {
        setConfig(value.config);
        setMappings(value.mappings);
        if (typeof value.curl === 'string') setCurl(value.curl);
        if (Array.isArray(value.staticFields)) setStaticFields(value.staticFields);
      }
      const alerts = JSON.parse(localStorage.getItem(`${STORE}-alerts`) ?? 'null');
      if (alerts && Array.isArray(alerts.recipients)) {
        setRecipients(alerts.recipients);
        setSendTime(alerts.sendTime);
        setFrequency(alerts.frequency);
        setAlertSaved(true);
      }
    } catch {
      setError('Saved settings could not be loaded. Configure the integration again.');
    }
  }, []);
  useEffect(() => {
    if (nextFocus.current) {
      refs.current[nextFocus.current]?.focus();
      nextFocus.current = null;
    }
  }, [mappings]);
  const invalidate = () => {
    setTested(false);
    setActive(false);
    setNotice('');
    setError('');
  };
  const changeConfig = (key: keyof Config, value: string) => {
    setConfig({ ...config, [key]: value });
    setConnected(false);
    invalidate();
  };
  const configError = () => {
    try {
      const base = new URL(config.base);
      if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password)
        return 'Enter an HTTP(S) ERP Base URL without embedded credentials.';
      if (!config.endpoint.trim()) return 'Endpoint URL is required.';
      const endpoint = new URL(config.endpoint, config.base);
      if (endpoint.origin !== base.origin) return 'Endpoint URL must belong to the ERP Base URL.';
    } catch {
      return 'Enter valid ERP Base and Endpoint URLs.';
    }
    if (config.direction !== 'Pull')
      return 'This integration supports Pull. Push and Bidirectional require a separate workflow.';
    return '';
  };
  const validate = (connect = false) => {
    const method = curl.match(/(?:-X|--request)\s+['"]?([A-Z]+)/i)?.[1]?.toUpperCase() || 'GET';
    const url = curl.match(/https?:\/\/[^\s'"\\]+/)?.[0];
    const headers = [...curl.matchAll(/(?:-H|--header)\s+['"]([^'"]+)['"]/gi)].map(
      (match) => match[1]
    );
    const issue = !curl.trim()
      ? 'Paste a CURL request.'
      : !url
        ? 'CURL must contain a valid HTTP(S) URL.'
        : '';
    setError(issue);
    if (!issue) {
      setParsedRequest({ method, url, headers });
      setConnected(true);
      setNotice('CURL validated successfully. Parsed Request and Pull Request are ready.');
    }
    return !issue;
  };
  const testConnection = () => {
    if (validate()) {
      setConnected(true);
      setNotice('Connection test successful (demo). No external ERP request was sent.');
    }
  };
  const run = (retry = false) => {
    setError('');
    setNotice('');
    if (!connected || configError()) {
      setError('Connect and validate the ERP API first.');
      return;
    }
    const issues = mappingErrors(mappings);
    if (issues.length) {
      setError(issues.join(' '));
      return;
    }
    try {
      const records = retry ? failed.map((f) => f.raw) : parseRecords(response);
      const staticValues = Object.fromEntries(
        staticFields
          .filter((field) => field.field.trim())
          .map((field) => [field.field.trim(), field.value])
      );
      const results = records.map((record) => {
        const transformed = transform(record, mappings);
        return { raw: record, ...transformed, crm: { ...transformed.crm, ...staticValues } };
      });
      const errors = results.filter((r) => r.error);
      setRaw(records);
      setParsed(results.map((r) => r.crm));
      const id = crypto.randomUUID();
      setLogs((all) => [
        {
          id,
          time: new Date().toISOString(),
          total: records.length,
          success: records.length - errors.length,
          failed: errors.length,
          status: errors.length ? 'Failure' : 'Success',
          reason: [...new Set(errors.map((r) => r.error))].join(' '),
          records: results,
        },
        ...all,
      ]);
      setFailed(errors.map((r, i) => ({ id: `${id}-${i}`, raw: r.raw, error: r.error })));
      setTested(records.length > 0 && !errors.length);
      setActive(false);
      if (errors.length)
        setError(
          `${errors.length} record(s) failed validation. Correct failed records below and retry.`
        );
      else
        setNotice(
          `${retry ? 'Retry' : 'Sample data pull'} successful: ${records.length} record(s) parsed for CRM (demo).`
        );
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'Data pull failed.';
      setTested(false);
      setActive(false);
      setRaw([]);
      setParsed([]);
      setError(reason);
      setLogs((all) => [
        {
          id: crypto.randomUUID(),
          time: new Date().toISOString(),
          total: 0,
          success: 0,
          failed: 0,
          status: 'Failure',
          reason,
          records: [],
        },
        ...all,
      ]);
    }
  };
  const save = () => {
    if (!tested || !connected || configError() || mappingErrors(mappings).length) {
      setError('Connect the ERP API and successfully pull sample data before saving.');
      return;
    }
    try {
      localStorage.setItem(STORE, JSON.stringify({ config, curl, mappings, staticFields }));
      setActive(true);
      setNotice('Integration saved and active in this demo session. Credentials are not stored.');
      setError('');
    } catch {
      setError('Unable to save integration settings. Browser storage is unavailable.');
    }
  };
  const addEmails = () => {
    const values = email.split(/[,;\s]+/).filter(Boolean);
    if (!values.length || values.some((v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
      setError('Enter valid email addresses separated by commas.');
      return;
    }
    setRecipients([...new Set([...recipients, ...values])]);
    setEmail('');
    setAlertSaved(false);
    setError('');
  };
  const saveAlerts = () => {
    if (!recipients.length || !sendTime || email.trim()) {
      setError('Add your email recipients and select a send time before saving.');
      return;
    }
    try {
      localStorage.setItem(`${STORE}-alerts`, JSON.stringify({ recipients, sendTime, frequency }));
      setAlertSaved(true);
      setError('');
      setNotice('Alert settings saved locally. Email delivery requires the backend scheduler.');
    } catch {
      setError('Could not save alert settings.');
    }
  };
  const downloadRecords = (log: Log, kind: 'success' | 'failed') => {
    const rows = log.records
      .filter((record) => (kind === 'failed' ? Boolean(record.error) : !record.error))
      .map((record) => (kind === 'failed' ? { ...record.raw, error: record.error } : record.crm));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `erp-${kind}-requests-${log.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const sourceFields = [...new Set([...SAMPLE.flatMap(Object.keys), ...raw.flatMap(Object.keys)])];
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ERP Data Pull Integration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect and pull data from your ERP system into ExtraaEdge CRM
          </p>
        </div>
      </header>
      <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
        Demo workflow · Sample data and local settings. Live ERP authentication, CRM delivery,
        scheduled sync and email sending require backend services.
      </p>
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          <CheckCircle2 size={16} />
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <Section
        title="API CURL Editor"
        subtitle="Paste the CURL request used to pull records from your ERP."
      >
        <textarea
          aria-label="ERP API CURL"
          rows={7}
          value={curl}
          onChange={(e) => {
            setCurl(e.target.value);
            setParsedRequest(null);
            setConnected(false);
            invalidate();
          }}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="grid items-end gap-4 md:grid-cols-[260px_1fr]">
          <Select
            label="Sync Frequency"
            value={config.sync}
            options={['Hourly', '3 Hours', 'Daily', 'Weekly']}
            onChange={(value) => changeConfig('sync', value)}
          />
          <button className={`${primary} w-fit`} onClick={() => validate()}>
            <CheckCircle2 size={14} />
            Validate CURL
          </button>
        </div>
      </Section>
      {parsedRequest && (
        <Section
          title="Parsed Request"
          subtitle="Auto-parsed HTTP method, URL and headers from the CURL request."
        >
          <Json title="Parsed CURL Request" value={parsedRequest} />
        </Section>
      )}
      {parsedRequest && (
        <Section
          title="Pull Request"
          subtitle="Fetch a sample ERP response using the validated CURL request."
        >
          <details>
            <summary className="cursor-pointer text-xs font-medium">
              Demo ERP response · edit to test success and failure
            </summary>
            <textarea
              aria-label="Demo ERP response JSON"
              rows={8}
              className={`${input} mt-3 font-mono text-xs`}
              value={response}
              onChange={(e) => {
                setResponse(e.target.value);
                invalidate();
                setRaw([]);
                setParsed([]);
              }}
            />
          </details>
          <button className={primary} disabled={!connected} onClick={() => run()}>
            <RefreshCw size={14} />
            Pull Request
          </button>
          <div className="grid gap-4 md:grid-cols-2">
            <Json title="ERP Response JSON" value={raw} />
            <Json title="Parsed CRM JSON" value={parsed} />
          </div>
        </Section>
      )}
      <Section
        title="Field Mapping"
        subtitle="Map the API response to CRM fields. LeadName and MobileNumber are required."
      >
        <div className="grid grid-cols-2 rounded-t-lg bg-muted p-3 text-xs font-semibold">
          <span>ERP Fields (from API response)</span>
          <span>CRM Fields (destination)</span>
        </div>
        <datalist id="erp-source-fields">
          {sourceFields.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
        {mappings.map((m) => (
          <div key={m.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
            <input
              aria-label="ERP Field name"
              list="erp-source-fields"
              ref={(el) => {
                refs.current[m.id] = el;
              }}
              className={input}
              value={m.source}
              onChange={(e) => {
                setMappings(
                  mappings.map((r) => (r.id === m.id ? { ...r, source: e.target.value } : r))
                );
                invalidate();
              }}
            />
            <select
              aria-label={`CRM field for ${m.source || 'new mapping'}`}
              className={input}
              value={m.target}
              onChange={(e) => {
                setMappings(
                  mappings.map((r) => (r.id === m.id ? { ...r, target: e.target.value } : r))
                );
                invalidate();
              }}
            >
              <option value="">Select CRM field</option>
              {CRM_FIELDS.map((f) => (
                <option key={f} disabled={mappings.some((r) => r.id !== m.id && r.target === f)}>
                  {f}
                </option>
              ))}
            </select>
            <button
              className={btn}
              aria-label={`Delete ${m.source || 'empty'} mapping`}
              onClick={() => {
                setMappings(mappings.filter((r) => r.id !== m.id));
                invalidate();
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          className={btn}
          onClick={() => {
            const id = crypto.randomUUID();
            nextFocus.current = id;
            setMappings([...mappings, { id, source: '', target: '' }]);
            invalidate();
          }}
        >
          <Plus size={14} />
          Add Row
        </button>
        {mappingErrors(mappings).length > 0 && (
          <p className="text-xs text-red-600">{mappingErrors(mappings).join(' ')}</p>
        )}
      </Section>
      {false && (
        <Section title="Sample Data Pull">
          <details>
            <summary className="cursor-pointer text-xs font-medium">
              Demo ERP response · edit to test success and failure
            </summary>
            <textarea
              aria-label="Demo ERP response JSON"
              rows={8}
              className={`${input} mt-3 font-mono text-xs`}
              value={response}
              onChange={(e) => {
                setResponse(e.target.value);
                invalidate();
                setRaw([]);
                setParsed([]);
              }}
            />
          </details>
          <button className={primary} disabled={!connected} onClick={() => run()}>
            <RefreshCw size={14} />
            Pull Sample Data
          </button>
          <div className="grid gap-4 md:grid-cols-2">
            <Json title="ERP Response JSON" value={raw} />
            <Json title="Parsed CRM JSON" value={parsed} />
          </div>
          {raw.length > 0 && (
            <p className={`text-xs ${tested ? 'text-green-600' : 'text-amber-600'}`}>
              {tested
                ? 'Sample pull successful — all records validated.'
                : 'Review validation failures in monitoring logs.'}
            </p>
          )}
        </Section>
      )}
      <Section
        title="Static Fields"
        subtitle="Fields with fixed values applied to every pulled record."
      >
        {staticFields.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
            <Tag size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="mb-1 text-[13px] font-semibold">No static fields yet</p>
            <p className="mb-4 text-[11px] text-muted-foreground">
              Add a field and fixed value applied to every synced record.
            </p>
            <button
              className={btn}
              onClick={() =>
                setStaticFields((current) => [
                  ...current,
                  { id: crypto.randomUUID(), field: '', value: '' },
                ])
              }
            >
              <Plus size={12} />
              Add Static Field
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_1fr_40px] bg-muted/50 p-3 text-[10px] font-semibold uppercase text-muted-foreground">
              <span>Field Name</span>
              <span>Field Value</span>
              <span />
            </div>
            {staticFields.map((field) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_1fr_40px] items-center gap-3 border-t border-border p-3"
              >
                <input
                  list="erp-source-fields"
                  value={field.field}
                  onChange={(e) =>
                    setStaticFields((current) =>
                      current.map((item) =>
                        item.id === field.id ? { ...item, field: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Select or enter field"
                  className={input}
                />
                <input
                  value={field.value}
                  onChange={(e) =>
                    setStaticFields((current) =>
                      current.map((item) =>
                        item.id === field.id ? { ...item, value: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Enter fixed value"
                  className={input}
                />
                <button
                  className={btn}
                  onClick={() =>
                    setStaticFields((current) => current.filter((item) => item.id !== field.id))
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="flex justify-end border-t border-border p-3">
              <button
                className={btn}
                onClick={() =>
                  setStaticFields((current) => [
                    ...current,
                    { id: crypto.randomUUID(), field: '', value: '' },
                  ])
                }
              >
                <Plus size={12} />
                Add Static Field
              </button>
            </div>
          </div>
        )}
      </Section>
      <Section title="Integration Monitoring" subtitle="Automatic retry interval: 15 minutes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className="bg-muted">
              <tr>
                {[
                  'Timestamp',
                  'Records Pulled',
                  'Success Count',
                  'Failed Count',
                  'Status',
                  'Action',
                ].map((h) => (
                  <th className="p-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="p-3">{log.time}</td>
                  <td className="p-3">{log.total}</td>
                  <td className="p-3 text-green-600">{log.success}</td>
                  <td className="p-3 text-red-600">{log.failed}</td>
                  <td className="p-3">{log.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className={btn}
                        disabled={!log.failed || !connected}
                        onClick={() => run(true)}
                      >
                        <RefreshCw size={12} />
                        Retry (15 min)
                      </button>
                      <button
                        className={btn}
                        disabled={!log.success}
                        onClick={() => downloadRecords(log, 'success')}
                      >
                        <Download size={12} />
                        Success
                      </button>
                      <button
                        className={btn}
                        disabled={!log.failed}
                        onClick={() => downloadRecords(log, 'failed')}
                      >
                        <Download size={12} />
                        Failed
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!logs.length && (
            <p className="p-6 text-center text-xs text-muted-foreground">No pull attempts yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button className={btn} disabled={!logs.length} onClick={() => setShowLogs(true)}>
            View Detailed Logs
          </button>
        </div>
        {failed.map((f) => (
          <div key={f.id} className="rounded border border-red-200 p-3">
            <p className="mb-2 text-xs text-red-600">{f.error}</p>
            <div className="grid gap-2 md:grid-cols-3">
              {Object.entries(f.raw).map(([key, value]) => (
                <label key={key} className="text-xs">
                  {key}
                  <input
                    className={input}
                    value={String(value ?? '')}
                    onChange={(e) =>
                      setFailed(
                        failed.map((r) =>
                          r.id === f.id ? { ...r, raw: { ...r.raw, [key]: e.target.value } } : r
                        )
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </Section>
      <Section title="Failure Alerts & Daily Summary">
        <label className="block text-xs">
          Email Recipients
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              className={input}
              placeholder="ops@example.com, manager@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAlertSaved(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmails();
                }
              }}
            />
            <button className={btn} onClick={addEmails}>
              <Plus size={14} />
              Add
            </button>
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          {recipients.map((r) => (
            <span
              key={r}
              className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
            >
              {r}
              <button
                aria-label={`Remove ${r}`}
                onClick={() => {
                  setRecipients(recipients.filter((v) => v !== r));
                  setAlertSaved(false);
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs">
            Send Time (local timezone)
            <input
              type="time"
              className={`${input} mt-2`}
              value={sendTime}
              onChange={(e) => {
                setSendTime(e.target.value);
                setAlertSaved(false);
              }}
            />
          </label>
          <Select
            label="Frequency"
            value={frequency}
            options={['Daily', 'Weekly']}
            onChange={(v) => {
              setFrequency(v);
              setAlertSaved(false);
            }}
          />
        </div>
        <button className={primary} onClick={saveAlerts}>
          Save Alert Settings
        </button>
        {alertSaved && <span className="ml-3 text-xs text-green-600">Saved</span>}
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-xs">
          <p className="font-semibold">Summary Email Preview</p>
          <p>To: {recipients.join(', ') || 'Add recipients above'}</p>
          <p>Subject: ERP Data Pull — {frequency} Summary</p>
          <p>
            Send at {sendTime} · {frequency} · {config.sync} sync
          </p>
          <p>
            Records pulled: {logs.reduce((n, l) => n + l.total, 0)} · Successful:{' '}
            {logs.reduce((n, l) => n + l.success, 0)} · Failed:{' '}
            {logs.reduce((n, l) => n + l.failed, 0)}
          </p>
          <p>
            {failed.length
              ? `${failed.length} records need attention. Review monitoring logs and retry failed records.`
              : 'No outstanding failed records in this demo session.'}
          </p>
        </div>
      </Section>
      <footer className="flex items-center justify-between border-t border-border py-4">
        <span
          className={`text-sm font-semibold ${active ? 'text-green-600' : 'text-muted-foreground'}`}
        >
          ● Integration {active ? 'Active' : 'Inactive'} {active && '(demo)'}
        </span>
        <div className="flex gap-2">
          <button className={primary} onClick={save}>
            <Save size={14} />
            Save Integration
          </button>
          <Link href="/" className={btn}>
            Cancel
          </Link>
        </div>
      </footer>
      <Modal
        open={showLogs}
        onClose={() => setShowLogs(false)}
        title="Detailed Pull Logs"
        size="2xl"
      >
        <div className="space-y-5">
          {logs.map((l) => (
            <div key={l.id}>
              <p className="mb-2 text-xs font-semibold">
                {l.time} · {l.status} · {l.reason || 'No errors'}
              </p>
              <Json title="Record results" value={l.records} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
