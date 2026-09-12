'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { addActivatedIntegration } from '@/app/components/activatedIntegrationsStore';
import type { Integration } from '@/app/components/IntegrationTable';

type Mapping = { source: string; target: string };
type Entry = {
  id: string;
  name: string;
  page: string;
  kind: 'forms' | 'pages';
  fetched: boolean;
  mapped: boolean;
  published: boolean;
  isDefault: boolean;
  mappings: Mapping[];
  statics: { target: string; value: string }[];
};
const PAGES = ['SKD University', 'My Business Page', 'Brand Awareness Page'];
const TESTING_TOOL_URL =
  'https://business.facebook.com/business/loginpage/?next=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Flead-ads-testing#';
type FetchedLead = {
  id: string;
  receivedAt: string;
  fields: Record<string, string>;
  added: boolean;
};
const FORM_NAMES = [
  "We're Hiring – Nursing Faculty!-copy",
  "We're Hiring – Nursing Faculty!",
  'Diploma in Education – Spl Edu (HI & ID) 05/08/2026',
  'B.Sc Agriculture (Hons.) 04/08/2026',
  'Computer Operator cum Marketing Executive Recruitment',
  'Telecallers/Counselors 23/07/2026',
  'B.Tech CS & IT 22/07/2026',
  'Commerce & Management 14/07/2026',
  'M.Sc. IT and CS 14/07/2026',
  'PGDCA 14/07/2026',
  'Integrated BCA + MCA Program 14/07/2026',
  'B.A. Yoga Science 14/07/2026',
];
const SAMPLE: Record<string, string> = {
  first_name: 'Raghv',
  email: 'qe174@gmail.com',
  phone_number: '+918888333322',
  city: 'Lucknow',
  state: 'UP',
};
const TARGETS = [
  'Applicant Name',
  'Email ID',
  'MobileNumber',
  'City',
  'State',
  'Remarks',
  'Source',
  'Program',
  'leadCampaign',
];
const defaults = (): Mapping[] =>
  Object.keys(SAMPLE).map((source, i) => ({ source, target: TARGETS[i] }));
const seed = (): Entry[] =>
  PAGES.flatMap((page, p) => [
    {
      id: `page-${p}`,
      name: page,
      page,
      kind: 'pages' as const,
      fetched: p === 0,
      mapped: p === 0,
      published: p === 0,
      isDefault: false,
      mappings: defaults(),
      statics: [{ target: 'Source', value: 'Facebook Ads' }],
    },
    ...FORM_NAMES.map((name, i) => ({
      id: `${931849902644093 + p * 100000 + i}`,
      name,
      page,
      kind: 'forms' as const,
      fetched: [2, 3, 11].includes(i),
      mapped: [2, 3, 11].includes(i),
      published: [2, 3, 11].includes(i),
      isDefault: false,
      mappings: defaults(),
      statics: [
        { target: 'Source', value: 'Facebook Ads' },
        { target: 'leadCampaign', value: name },
      ],
    })),
  ]);
const btn =
  'inline-flex items-center justify-center gap-1.5 rounded border border-border bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed';
const orange = `${btn} !border-orange-500 !bg-orange-500 !text-white hover:!bg-orange-600`;
const control =
  'h-8 w-full rounded border border-border bg-white px-2 text-xs disabled:bg-slate-50 disabled:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300';
function Badge({ entry }: { entry: Entry }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[11px] ${entry.published ? 'border-lime-300 bg-lime-50 text-lime-600' : entry.mapped ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500'}`}
    >
      {entry.published ? 'Published' : entry.mapped ? 'Mapped' : 'Not started'}
    </span>
  );
}
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold">{title}</h3>
        {action}
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

export default function FacebookPagesForms({ onReady }: { onReady?: (ready: boolean) => void }) {
  const [entries, setEntries] = useSetupState<Entry[]>('facebook', 'FacebookPagesForms.entries', seed);
  const [kind, setKind] = useSetupState<'forms' | 'pages' | ''>('facebook', 'FacebookPagesForms.kind', '');
  const [page, setPage] = useSetupState('facebook', 'FacebookPagesForms.page', PAGES[0]);
  const [warning, setWarning] = useState<Entry | null>(null);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [notice, setNotice] = useState('');
  const [noLead, setNoLead] = useState<Entry | null>(null);
  const [leadEntry, setLeadEntry] = useState<Entry | null>(null);
  const [leads, setLeads] = useState<Record<string, FetchedLead>>({});
  const [demoResult, setDemoResult] = useState('empty');
  const fetchLead = (entry: Entry) => {
    setNotice('');
    if (demoResult === 'empty') {
      setNoLead(entry);
      return;
    }
    const lead = {
      id: `demo-${crypto.randomUUID()}`,
      receivedAt: new Date().toLocaleString(),
      fields: { ...SAMPLE },
      added: false,
    };
    setLeads((all) => ({ ...all, [entry.id]: lead }));
    setEntries((all) => all.map((e) => (e.id === entry.id ? { ...e, fetched: true } : e)));
    setNotice(`${entry.name}: Lead Fetch Successful (demo).`);
    // A successful fetch takes the user straight into Map Fields for this page/form.
    open(entry);
  };
  const open = (entry: Entry) => setDraft(structuredClone(entry));
  const update = (patch: Partial<Entry>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const close = () => setDraft(null);
  const errors = draft
    ? [
        ...draft.mappings
          .filter((m) => !m.source || !m.target)
          .map(() => 'Select Facebook and CRM fields for every row.'),
        ...['Email ID', 'MobileNumber']
          .filter((target) => !draft.mappings.some((m) => m.target === target))
          .map((target) => `${target} is required.`),
        ...draft.statics
          .filter((s) => !s.target || !s.value.trim())
          .map(() => 'Complete each static field and value.'),
        ...draft.mappings
          .filter(
            (m) =>
              m.target === 'Email ID' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SAMPLE[m.source] ?? '')
          )
          .map(() => 'Email ID must map to a valid email value.'),
        ...draft.mappings
          .filter(
            (m) => m.target === 'MobileNumber' && !/^\+?\d{10,15}$/.test(SAMPLE[m.source] ?? '')
          )
          .map(() => 'MobileNumber must map to a valid phone value.'),
        ...([...draft.mappings.map((m) => m.target), ...draft.statics.map((s) => s.target)].some(
          (t, i, all) => t && all.indexOf(t) !== i
        )
          ? ['CRM fields must be unique.']
          : []),
      ]
    : [];
  const save = () => {
    if (!draft || draft.published || errors.length) return;
    const saved = { ...draft, mapped: true };
    setEntries((all) =>
      all.map((e) =>
        e.id === saved.id
          ? saved
          : saved.isDefault &&
              (saved.kind === 'pages' || e.page === saved.page) &&
              e.kind === saved.kind
            ? { ...e, isDefault: false }
            : e
      )
    );
    setNotice(`${draft.name}: integration saved. Mapping is not live yet.`);
    onReady?.(true);
    close();
  };
  const publish = (entry: Entry) => {
    setEntries((all) => all.map((e) => (e.id === entry.id ? { ...e, published: true } : e)));
    setNotice(`${entry.name}: demo mapping published.`);
    const row: Integration = {
      id: `int-facebook-${entry.id}`,
      name: `Facebook Lead Ads - ${entry.name}`,
      type: 'facebook',
      status: 'active',
      lastSync: 'Just now',
      events24h: 0,
      successRate: 0,
      latencyMs: 0,
      owner: 'Pramod Bhujbal',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      environment: 'production',
      errorCount: 0,
    };
    addActivatedIntegration(row);
  };
  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">
        Demo pages, forms and test leads — live Meta services are not connected.
      </p>
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer">Demo test lead response</summary>
        <select
          aria-label="Demo test lead response"
          className={`${control} mt-2 max-w-md`}
          value={demoResult}
          onChange={(e) => setDemoResult(e.target.value)}
        >
          <option value="empty">No test lead found</option>
          <option value="success">Test lead available</option>
        </select>
      </details>
      <Section title="Integration Type">
        <label className="block max-w-md space-y-2 text-sm">
          Integration Types
          <select
            className={control}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as typeof kind);
              setNotice('');
              onReady?.(false);
            }}
          >
            <option value="">Select Facebook Type</option>
            <option value="pages">Page wise Integration</option>
            <option value="forms">Form wise Integration</option>
          </select>
        </label>
        {kind === 'forms' && (
          <label className="block max-w-md space-y-2 text-sm">
            Current page
            <select
              className={control}
              value={page}
              onChange={(e) => {
                setPage(e.target.value);
                setNotice('');
                onReady?.(false);
              }}
            >
              {PAGES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        )}
      </Section>
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-xs text-green-700"
        >
          <CheckCircle2 size={14} />
          {notice}
        </p>
      )}
      {kind && (
        <Section title={kind === 'forms' ? 'Lead Gen Forms' : 'Facebook Pages'}>
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
            <span className="border-l-4 border-lime-500 pl-1">Live — receiving leads</span>
            <span className="border-l-4 border-blue-400 pl-1">Mapped — not live yet</span>
            <span className="border-l-4 border-slate-200 pl-1">
              Not started — fetch test lead first
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    kind === 'forms' ? 'Form Name' : 'Page Name',
                    'Status',
                    kind === 'forms' ? 'Form ID' : 'Page ID',
                    'Mapping',
                    '',
                  ].map((h, i) => (
                    <th className="p-3 font-medium" key={i}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries
                  .filter((e) => e.kind === kind && (kind === 'pages' || e.page === page))
                  .map((entry) => (
                    <tr
                      key={entry.id}
                      className={`border-t border-border ${entry.published ? 'border-l-2 border-l-lime-500 bg-lime-50' : entry.mapped ? 'border-l-2 border-l-blue-400 bg-blue-50/40' : 'even:bg-slate-50'}`}
                    >
                      <td className="p-2">{entry.name}</td>
                      <td className="p-2">ACTIVE</td>
                      <td className="p-2">{entry.id}</td>
                      <td className="p-2">
                        <Badge entry={entry} />
                        {entry.isDefault && <span className="ml-2 text-blue-500">Default</span>}
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-3">
                          <button
                            className={btn}
                            disabled={entry.fetched || entry.published}
                            onClick={() => fetchLead(entry)}
                          >
                            Fetch Test Lead
                          </button>
                          {leads[entry.id] && (
                            <button className={btn} onClick={() => setLeadEntry(entry)}>
                              Lead Details
                            </button>
                          )}
                          <button
                            className={entry.mapped ? orange : btn}
                            disabled={!entry.fetched}
                            onClick={() => (entry.published ? setWarning(entry) : open(entry))}
                          >
                            {entry.mapped ? 'Edit Mapping' : 'Map Fields'}
                          </button>
                          {entry.mapped && !entry.published && (
                            <button className={btn} onClick={() => publish(entry)}>
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
      <Modal
        open={!!noLead}
        onClose={() => setNoLead(null)}
        title="No test lead found"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button className={btn} onClick={() => setNoLead(null)}>
              Close
            </button>
            <a className={orange} href={TESTING_TOOL_URL} target="_blank" rel="noopener noreferrer">
              Open Lead Ads Testing Tool
            </a>
          </div>
        }
      >
        <div className="space-y-4 text-xs leading-5 text-slate-500">
          <p>
            We could not find a test lead for <strong>{noLead?.name}</strong> yet. Please submit one
            using Meta&apos;s Lead Ads Testing Tool, then click <strong>Fetch Test Lead</strong>{' '}
            again.
          </p>
          <div className="rounded-md border border-sky-300 bg-sky-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm">
              <Info size={20} className="text-sky-500" />
              How to create a test lead
            </p>
            <ul className="list-disc space-y-1 pl-9">
              <li>Open the Lead Ads Testing Tool using the button below.</li>
              <li>
                Choose your Page: <u>{noLead?.page}</u>
              </li>
              <li>
                {noLead?.kind === 'forms' ? (
                  <>
                    Select the form: <u>{noLead.name}</u>
                  </>
                ) : (
                  'Select a lead form from this page.'
                )}
              </li>
              <li>
                Click <strong>Preview Form.</strong>
              </li>
              <li>Submit the form with dummy contact details.</li>
            </ul>
          </div>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm">
              <AlertTriangle size={20} className="text-amber-500" />
              Important — use safe test contact details
            </p>
            <p className="pl-7">
              Use a <strong>personal email and phone number</strong> that are not used for counselor
              login or your organisation&apos;s CRM domain. Avoid real student or staff contact
              details.
            </p>
          </div>
          <a
            className="text-orange-500"
            href={TESTING_TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            https://developers.facebook.com/tools/lead-ads-testing
          </a>
        </div>
      </Modal>
      <Modal
        open={!!leadEntry}
        onClose={() => setLeadEntry(null)}
        title="Lead Fetch Successful"
        subtitle={`${leadEntry?.name ?? ''} · Demo test lead`}
        size="2xl"
        footer={
          <div className="flex justify-end">
            <button className={btn} onClick={() => setLeadEntry(null)}>
              Close
            </button>
          </div>
        }
      >
        {leadEntry && leads[leadEntry.id] && (
          <div className="space-y-4">
            <p
              role="status"
              className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              <CheckCircle2 size={18} />
              Lead fetched successfully.{' '}
              {leads[leadEntry.id].added
                ? 'Added to this integration’s test samples.'
                : 'Review the lead details below.'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Lead Details</th>
                    <th className="p-3">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Lead ID', leads[leadEntry.id].id],
                    ['Page', leadEntry.page],
                    [leadEntry.kind === 'forms' ? 'Form ID' : 'Page ID', leadEntry.id],
                    ['Received At', leads[leadEntry.id].receivedAt],
                    ...Object.entries(leads[leadEntry.id].fields),
                  ].map(([key, value]) => (
                    <tr className="border-t" key={key}>
                      <td className="p-3">{key}</td>
                      <td className="p-3">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className={orange}
                disabled={leads[leadEntry.id].added || leadEntry.published}
                onClick={() => {
                  setLeads((all) => ({
                    ...all,
                    [leadEntry.id]: { ...all[leadEntry.id], added: true },
                  }));
                  setNotice('Lead added to this integration’s test samples.');
                }}
              >
                <Plus size={13} />
                {leads[leadEntry.id].added ? 'Added' : 'Add'}
              </button>
              <button
                className={`${btn} !text-red-500`}
                disabled={leadEntry.published}
                onClick={() => {
                  setLeads((all) => {
                    const next = { ...all };
                    delete next[leadEntry.id];
                    return next;
                  });
                  setEntries((all) =>
                    all.map((e) => (e.id === leadEntry.id ? { ...e, fetched: false } : e))
                  );
                  setNotice('Fetched test lead deleted. You can fetch a test lead again.');
                  setLeadEntry(null);
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={!!warning}
        onClose={() => setWarning(null)}
        title={`Facebook ${warning?.kind === 'pages' ? 'Page' : 'Form'} Mapping is Published`}
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              className={orange}
              onClick={() => {
                if (warning) open(warning);
                setWarning(null);
              }}
            >
              I Understand
            </button>
          </div>
        }
      >
        <p className="mb-4 text-sm leading-6 text-slate-500">
          This Facebook {warning?.kind === 'pages' ? 'page' : 'form'} mapping is currently published
          and is actively processing leads.
        </p>
        <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-xs">
          <p className="flex items-center gap-2 font-semibold text-orange-500">
            <AlertTriangle size={15} />
            Warning: Mapping changes are frozen
          </p>
          <p>
            To change how Facebook fields map into your CRM, you must first unpublish this mapping.
          </p>
          <ul className="list-disc space-y-2 pl-4">
            <li>Facebook → CRM field mappings cannot be edited</li>
            <li>Default and static CRM fields cannot be modified</li>
            <li>Saving a new sample/test request is disabled</li>
          </ul>
        </div>
        <p className="mt-4 rounded bg-slate-100 p-3 text-xs text-slate-400">
          Please unpublish this Facebook mapping to enable editing.
        </p>
      </Modal>
      <Modal
        open={!!draft}
        onClose={close}
        title="Map Fields"
        subtitle={draft ? `${draft.name} · ${draft.page}` : ''}
        size="2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button className={btn} onClick={close}>
              Cancel
            </button>
            <button
              className={`${btn} !border-red-400 !text-red-500`}
              disabled={!draft?.published}
              onClick={() => {
                if (!draft) return;
                setEntries((all) =>
                  all.map((e) => (e.id === draft.id ? { ...e, published: false } : e))
                );
                update({ published: false });
                setNotice(`${draft.name}: unpublished. Mapping can now be edited.`);
              }}
            >
              Unpublish
            </button>
            <button
              className={orange}
              disabled={!draft || draft.published || errors.length > 0}
              onClick={save}
            >
              Save Integration
            </button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-4 text-slate-500">
            <Badge entry={draft} />
            {draft.published && (
              <p className="flex items-center gap-2 rounded-md border border-blue-300 bg-sky-50 p-3 text-xs">
                <Info size={15} className="text-blue-500" />
                This {draft.kind === 'pages' ? 'page' : 'form'} is published. Unpublish to edit
                field mappings and static fields.
              </p>
            )}
            <Section
              title="Field Mapping"
              action={
                <div className="flex gap-2">
                  <button
                    className={btn}
                    disabled={draft.published}
                    onClick={() => update({ mappings: defaults() })}
                  >
                    <RefreshCw size={12} />
                    Auto-suggest
                  </button>
                  <button
                    className={btn}
                    disabled={draft.published}
                    onClick={() =>
                      update({ mappings: [...draft.mappings, { source: '', target: '' }] })
                    }
                  >
                    <Plus size={12} />
                    Add Row
                  </button>
                </div>
              }
            >
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 font-medium">Facebook Field</th>
                    <th className="p-2 font-medium">CRM Field</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {draft.mappings.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        <select
                          aria-label={`Facebook field ${i + 1}`}
                          disabled={draft.published}
                          className={control}
                          value={m.source}
                          onChange={(e) =>
                            update({
                              mappings: draft.mappings.map((r, j) =>
                                j === i ? { ...r, source: e.target.value } : r
                              ),
                            })
                          }
                        >
                          <option value="">Select Facebook field</option>
                          {Object.keys(SAMPLE).map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <select
                            aria-label={`CRM field ${i + 1}`}
                            disabled={draft.published}
                            className={`${control} pr-24`}
                            value={m.target}
                            onChange={(e) =>
                              update({
                                mappings: draft.mappings.map((r, j) =>
                                  j === i ? { ...r, target: e.target.value } : r
                                ),
                              })
                            }
                          >
                            <option value="">Select CRM field</option>
                            {TARGETS.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                          {['Email ID', 'MobileNumber'].includes(m.target) && (
                            <span className="pointer-events-none absolute right-6 top-1.5 rounded border border-red-200 bg-red-50 px-1 text-[10px] text-red-500">
                              Required
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          aria-label={`Remove mapping ${i + 1}`}
                          className={btn}
                          disabled={draft.published}
                          onClick={() =>
                            update({ mappings: draft.mappings.filter((_, j) => i !== j) })
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            {draft.kind === 'forms' && (
              <Section title="Default Mapping">
                <p className="text-xs leading-6">
                  Mark this {draft.kind === 'forms' ? 'form' : 'page'} as the default mapping. Only
                  one {draft.kind === 'forms' ? 'form per page' : 'page'} can be marked as default. It
                  will be used as a fallback for Facebook leads.
                </p>
                {draft.published && (
                  <p className="rounded border border-blue-300 bg-sky-50 p-3 text-xs">
                    Default mapping cannot be changed while published. Unpublish first to update it.
                  </p>
                )}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    disabled={draft.published}
                    checked={draft.isDefault}
                    onChange={(e) => update({ isDefault: e.target.checked })}
                  />
                  Set as Default Mapping
                </label>
              </Section>
            )}
            <Section
              title="Static Mapping"
              action={
                <button
                  className={btn}
                  disabled={draft.published}
                  onClick={() => update({ statics: [...draft.statics, { target: '', value: '' }] })}
                >
                  <Plus size={12} />
                  Add Static Field
                </button>
              }
            >
              <p className="text-xs">
                These fields are appended to every lead regardless of the Facebook data.
              </p>
              {draft.statics.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    aria-label={`Static CRM field ${i + 1}`}
                    disabled={draft.published}
                    className={control}
                    value={s.target}
                    onChange={(e) =>
                      update({
                        statics: draft.statics.map((r, j) =>
                          i === j ? { ...r, target: e.target.value } : r
                        ),
                      })
                    }
                  >
                    <option value="">Select CRM field</option>
                    {TARGETS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    aria-label={`Static value ${i + 1}`}
                    disabled={draft.published}
                    className={control}
                    value={s.value}
                    onChange={(e) =>
                      update({
                        statics: draft.statics.map((r, j) =>
                          i === j ? { ...r, value: e.target.value } : r
                        ),
                      })
                    }
                  />
                  <button
                    className={btn}
                    aria-label={`Remove static field ${i + 1}`}
                    disabled={draft.published}
                    onClick={() => update({ statics: draft.statics.filter((_, j) => i !== j) })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </Section>
            <Section title="Transformed Lead Preview">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 font-medium">CRM Field</th>
                    <th className="p-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...draft.mappings.map((m) => ({
                      target: m.target,
                      value: SAMPLE[m.source] ?? '',
                    })),
                    ...draft.statics,
                  ]
                    .filter((r) => r.target)
                    .map((r, i) => (
                      <tr className="border-t" key={i}>
                        <td className="p-3">{r.target}</td>
                        <td className="p-3">{r.value || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Section>
            {!draft.published && errors.length > 0 && (
              <p role="alert" className="text-xs text-red-500">
                {[...new Set(errors)].join(' ')}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
