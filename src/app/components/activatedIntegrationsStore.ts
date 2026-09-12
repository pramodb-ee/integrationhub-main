import type { Integration } from './IntegrationTable';
import { isRemovedConnector } from './removedConnectors';
import { readSetup, saveSetup, appendIntegrationLog } from './integrationSetupStore';

// Bridges a freshly-activated integration (finished in a setup wizard, e.g. Google Ads,
// Google Forms, TATA) into the Integration Center's "All Integrations" table. The app has
// no backend, and each wizard flow is a separate client component/route, so localStorage is
// the simplest way to carry a new row across the client-side navigation back to "/".

const STORAGE_KEY = 'ih_activated_integrations';

function readAll(): Integration[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Integration[]).filter((row) => !isRemovedConnector(row.type)) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: Integration[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently, demo-only feature.
  }
}

export function getActivatedIntegrations(): Integration[] {
  return readAll();
}

export function addActivatedIntegration(integration: Integration) {
  try {
    const draft = readSetup(`draft:${integration.type}`);
    if (draft) saveSetup(integration.id, draft);
    appendIntegrationLog(integration.id, 'Activation', 'Integration activated in the local demo workflow.', 'success');
  } catch { /* Existing activation behavior remains available without browser storage. */ }
  const current = readAll().filter((row) => row.id !== integration.id);
  writeAll([integration, ...current]);
}

export function removeActivatedIntegration(id: string) {
  writeAll(readAll().filter((row) => row.id !== id));
}
