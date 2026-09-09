import type { ApiMappingState, CappingConfig } from './FieldMappingStep';

export function fieldValueError(destination: string, value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (['email', 'mobile', 'lead_status'].includes(destination) && !text) return 'Required value is missing';
  if (destination === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return `Invalid: ${text}`;
  if (destination === 'mobile' && (!/^\+?[\d\s()-]+$/.test(text) || !/^\d{10,15}$/.test(text.replace(/\D/g, '')))) return `Invalid: ${text}`;
  return null;
}

export function mappingErrors(state: ApiMappingState, payload?: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const sources = new Set<string>();
  const destinations = new Set<string>();
  for (const row of state.mappings.filter((item) => item.enabled)) {
    if (!row.sourceField || !row.destinationField) errors.push('Select a source and destination for every enabled mapping.');
    if (sources.has(row.sourceField)) errors.push(`Source field ${row.sourceField} is mapped more than once.`);
    if (destinations.has(row.destinationField)) errors.push(`Destination field ${row.destinationField} is mapped more than once.`);
    sources.add(row.sourceField);
    destinations.add(row.destinationField);
    if (payload && row.sourceField && row.destinationField) {
      const error = fieldValueError(row.destinationField, mappedPayload(payload, { ...state, mappings: [row], staticFields: [] })[row.destinationField]);
      if (error) errors.push(`${row.destinationField}: ${error}`);
    }
  }
  for (const row of state.staticFields) {
    const key = row.key.trim();
    if (!key) errors.push('Enter a destination field for every static mapping.');
    if (destinations.has(key)) errors.push(`Destination field ${key} is mapped more than once.`);
    destinations.add(key);
    const error = fieldValueError(key, row.value);
    if (error) errors.push(`${key}: ${error}`);
  }
  for (const field of ['email', 'mobile', 'lead_status']) {
    if (!destinations.has(field)) errors.push(`${field === 'lead_status' ? 'Status' : field === 'mobile' ? 'Mobile' : 'Email'} is required.`);
  }
  if (state.capping.enabled && (!Number.isInteger(state.capping.requestLimit) || state.capping.requestLimit < 1)) errors.push('Request Limit must be a positive whole number.');
  if (state.capping.enabled && state.capping.fields.some((field) => field.enabled && !field.selectedOption)) errors.push('Select an option for each enabled capping field.');
  return [...new Set(errors)];
}

export function mappedPayload(payload: Record<string, unknown>, state: ApiMappingState): Record<string, unknown> {
  const entries: Array<[string, unknown]> = state.mappings.filter((row) => row.enabled && row.sourceField && row.destinationField).map((row) => {
    let value = payload[row.sourceField];
    if (typeof value === 'string') {
      if (row.transform === 'trim') value = value.trim();
      else if (row.transform === 'lowercase') value = value.toLowerCase();
      else if (row.transform === 'uppercase') value = value.toUpperCase();
    }
    return [row.destinationField, value];
  });
  state.staticFields.filter((row) => row.key.trim()).forEach((row) => entries.push([row.key.trim(), row.value]));
  return Object.fromEntries(entries);
}

export interface CapturedRequest { timestamp: number; payload: Record<string, unknown> }

export function cappingError(config: CappingConfig | undefined, payload: Record<string, unknown>, captured: CapturedRequest[], now = Date.now()): string | null {
  if (!config?.enabled) return null;
  if (!Number.isInteger(config.requestLimit) || config.requestLimit < 1) return 'Request Limit must be a positive whole number.';
  const conditions = config.fields.filter((field) => field.enabled);
  if (conditions.some((field) => !field.selectedOption)) return 'Select an option for every enabled capping field.';
  const matches = (data: Record<string, unknown>) => conditions.length === 0 || conditions.some((field) => String(data[field.key] ?? '') === field.selectedOption && (!field.subDropdownValue || String(data[`sub_${field.key}`] ?? '') === field.subDropdownValue));
  if (!matches(payload)) return null;
  const primarySource = (data: Record<string, unknown>) => String(data.lead_source ?? data.source ?? '');
  const count = captured.filter((item) => item.timestamp > now - config.windowHours * 3600000 && matches(item.payload) && (config.scope !== 'primary_source' || primarySource(item.payload) === primarySource(payload))).length;
  return count >= config.requestLimit ? `Request blocked: limit of ${config.requestLimit} requests per ${config.windowHours === 1 ? '1 Hour' : '1 Day'} reached.` : null;
}

export interface DummyLead { id: string; integrationId: string; fields: Record<string, unknown>; createdAt: string; response: Record<string, unknown>; curl: string }
const LEAD_STORE_KEY = 'integrationhub-dummy-crm-leads';
export function readDummyLeads(): DummyLead[] {
  const value: unknown = JSON.parse(localStorage.getItem(LEAD_STORE_KEY) ?? '[]');
  if (!Array.isArray(value)) throw new Error('Dummy CRM lead storage is invalid.');
  return value as DummyLead[];
}
export function saveDummyLead(lead: DummyLead) { localStorage.setItem(LEAD_STORE_KEY, JSON.stringify([...readDummyLeads(), lead])); }
export function deleteDummyLead(id: string) { localStorage.setItem(LEAD_STORE_KEY, JSON.stringify(readDummyLeads().filter((lead) => lead.id !== id))); }
