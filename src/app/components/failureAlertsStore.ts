// Config-only storage for the "Failure Alerts & Reports" feature. The app has no backend,
// so there is no actual email-sending — this just persists the recipients + schedule
// configuration the admin sets, the same way activatedIntegrationsStore persists activated
// integrations. localStorage keeps it available across client-side navigation/reloads.

const STORAGE_KEY = 'ih_failure_alert_settings';

export interface FailureAlertSettings {
  recipients: string[];
  dailySendTime: string; // 24h "HH:MM"
  enabled: boolean;
}

export const DEFAULT_FAILURE_ALERT_SETTINGS: FailureAlertSettings = {
  recipients: [],
  dailySendTime: '09:00',
  enabled: false,
};

export function getFailureAlertSettings(): FailureAlertSettings {
  if (typeof window === 'undefined') return DEFAULT_FAILURE_ALERT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FAILURE_ALERT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      recipients: Array.isArray(parsed?.recipients) ? parsed.recipients : [],
      dailySendTime: typeof parsed?.dailySendTime === 'string' ? parsed.dailySendTime : DEFAULT_FAILURE_ALERT_SETTINGS.dailySendTime,
      enabled: Boolean(parsed?.enabled),
    };
  } catch {
    return DEFAULT_FAILURE_ALERT_SETTINGS;
  }
}

export function saveFailureAlertSettings(settings: FailureAlertSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently, demo-only feature.
  }
}
