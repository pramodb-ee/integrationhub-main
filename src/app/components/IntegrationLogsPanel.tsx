'use client';
import React, { useEffect, useState } from 'react';
import OverlayPortal from '@/components/ui/OverlayPortal';
import { X, RefreshCw, Download } from 'lucide-react';
import { getConnectorLabel } from '@/components/ui/ConnectorIcon';
import type { Integration } from './IntegrationTable';
import { readIntegrationLogs, IntegrationLog } from './integrationSetupStore';
import TataCallLogsPanel from '@/app/integration-setup-wizard/components/TataCallLogsPanel';
export default function IntegrationLogsPanel({
  integration,
  onClose,
}: {
  integration: Integration | null;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  useEffect(() => {
    setLogs(integration ? readIntegrationLogs(integration.id) : []);
    setSearch('');
    setStatus('all');
  }, [integration?.id]);
  if (!integration) return null;
  if (integration.type === 'tata') {
    return <TataCallLogsPanel open={true} onClose={onClose} user={null} />;
  }
  const filtered = logs.filter(
    (l) =>
      (status === 'all' || l.status === status) &&
      (l.operation + l.details).toLowerCase().includes(search.toLowerCase())
  );
  const telephony = [
    'tata',
    'exotel',
    'knowlarity',
    'mcube',
    'ozonetel',
    'myoperator',
    'ivr-custom',
    'twilio',
  ].includes(integration.type);
  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-logs-title"
      >
        <button
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-label="Close logs"
          onClick={onClose}
        />
        <aside className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col border-l border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 id="integration-logs-title" className="font-semibold">
                {integration.name} ? Logs
              </h2>
              <p className="text-xs text-muted-foreground">
                {getConnectorLabel(integration.type)} ? {integration.id}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 space-y-4 overflow-auto p-5">
            <p className="text-xs text-muted-foreground">
              Saved events for this integration only. Live provider logs require the backend
              connection.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                aria-label="Search logs"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded border border-border px-3 py-2 text-xs"
              />
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded border border-border px-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="info">Info</option>
              </select>
              <button
                className="flex items-center gap-2 text-xs"
                onClick={() => setLogs(readIntegrationLogs(integration.id))}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                disabled={!filtered.length}
                className="flex items-center gap-2 text-xs disabled:opacity-40"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob(
                      [JSON.stringify({ integrationId: integration.id, logs: filtered }, null, 2)],
                      { type: 'application/json' }
                    )
                  );
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = integration.id + '-logs.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download size={14} />
                Export
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3">Timestamp (UTC)</th>
                    <th className="p-3">
                      {telephony ? 'Call / Configuration Event' : 'Request / Sync Event'}
                    </th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Details / Error Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="p-3">{l.timestamp}</td>
                      <td className="p-3">{l.operation}</td>
                      <td className="p-3">{l.status}</td>
                      <td className="p-3">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="p-8 text-center text-xs text-muted-foreground">
                  {logs.length
                    ? 'No logs match your filters.'
                    : 'No saved logs exist for this integration yet.'}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </OverlayPortal>
  );
}
