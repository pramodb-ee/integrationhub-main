'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type SetupSnapshot = Record<string, unknown>;
export type IntegrationLog = {
  id: string;
  timestamp: string;
  operation: string;
  status: 'success' | 'failure' | 'info';
  details: string;
};
const PREFIX = 'ih_setup_v1:';
export function readSetup(id: string): SetupSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(PREFIX + id) ?? 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) => !/password|secret|token|api.?key|authorization|httpclientheaders/i.test(key)
        )
        .map(([key, item]) => [key, sanitize(item)])
    );
  return value;
}
export function saveSetup(id: string, value: SetupSnapshot) {
  localStorage.setItem(PREFIX + id, JSON.stringify(sanitize(value)));
}
export function readIntegrationLogs(id: string): IntegrationLog[] {
  try {
    const value = JSON.parse(localStorage.getItem(`ih_logs_v1:${id}`) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
export function appendIntegrationLog(
  id: string,
  operation: string,
  details: string,
  status: IntegrationLog['status'] = 'info'
) {
  const logs = readIntegrationLogs(id);
  localStorage.setItem(
    `ih_logs_v1:${id}`,
    JSON.stringify(
      [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          operation,
          details,
          status,
        },
        ...logs,
      ].slice(0, 500)
    )
  );
}
export const SetupEditContext = createContext<{ values: SetupSnapshot; name: string } | null>(null);

/** Persist setup fields, scoped to provider drafts or an explicitly selected edit snapshot. */
export function useSetupState<T>(
  provider: string,
  key: string,
  initial: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const edit = useContext(SetupEditContext);
  const field = `${provider}.${key}`;
  const [value, setValue] = useState<T>(() => {
    if (edit && Object.prototype.hasOwnProperty.call(edit.values, field))
      return edit.values[field] as T;
    if (edit && key.endsWith('.integrationName')) return edit.name as T;
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    if (edit) {
      edit.values[field] = value;
      return;
    }
    try {
      saveSetup(`draft:${provider}`, { ...readSetup(`draft:${provider}`), [field]: value });
    } catch {
      /* Editing remains usable when browser storage is disabled. */
    }
  }, [edit, field, provider, value]);
  return [value, setValue];
}
