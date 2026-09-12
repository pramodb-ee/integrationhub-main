'use client';

import OverlayPortal from '@/components/ui/OverlayPortal';
import React, { useState } from 'react';
import { toast } from 'sonner';
import ConnectorIcon, { getConnectorLabel } from '@/components/ui/ConnectorIcon';
import StatusBadge from '@/components/ui/StatusBadge';
import { X, BellRing, Mail, Clock, Plus, Trash2, AlertTriangle, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Integration } from './IntegrationTable';
import { getFailureAlertSettings, saveFailureAlertSettings } from './failureAlertsStore';

interface FailureAlertsPanelProps {
  integrations: Integration[];
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FailureAlertsPanel({ integrations, onClose }: FailureAlertsPanelProps) {
  const initial = getFailureAlertSettings();
  const [recipients, setRecipients] = useState<string[]>(initial.recipients);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [dailySendTime, setDailySendTime] = useState(initial.dailySendTime);
  const [enabled, setEnabled] = useState(initial.enabled);

  const failing = integrations.filter((i) => i.status === 'failed' || i.status === 'needs-attention');

  const addRecipient = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    if (recipients.some((r) => r.toLowerCase() === email.toLowerCase())) {
      setEmailError('This email is already added');
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setEmailInput('');
    setEmailError(null);
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  const handleSave = () => {
    saveFailureAlertSettings({ recipients, dailySendTime, enabled });
    toast.success('Failure alert settings saved.', {
      description: enabled
        ? `Daily summary will be sent at ${dailySendTime} to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}.`
        : 'Daily summary is currently disabled.',
    });
  };

  return (
    <OverlayPortal><div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg bg-card shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-danger-bg/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <BellRing size={16} className="text-danger" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Failure Alerts & Reports</h2>
              <p className="text-[11px] text-muted-foreground">Configure recipients and the daily failure summary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Daily Summary Email</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Send a daily summary of failed integrations and failed leads</p>
            </div>
            <button
              onClick={() => setEnabled((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-medium"
              title={enabled ? 'Disable daily summary' : 'Enable daily summary'}
            >
              {enabled ? (
                <ToggleRight size={26} className="text-success" />
              ) : (
                <ToggleLeft size={26} className="text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Recipients */}
          <div>
            <p className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Mail size={13} className="text-primary" /> Recipients
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setEmailError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient(); } }}
                placeholder="name@company.com"
                className="flex-1 h-9 px-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                onClick={addRecipient}
                className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus size={13} /> Add
              </button>
            </div>
            {emailError && <p className="text-[11px] text-danger mt-1.5">{emailError}</p>}

            <div className="mt-3 space-y-1.5">
              {recipients.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">No recipients configured yet.</p>
              ) : (
                recipients.map((email) => (
                  <div key={email} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 border border-border">
                    <span className="text-[12px] text-foreground">{email}</span>
                    <button onClick={() => removeRecipient(email)} title="Remove" className="p-1 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-primary" /> Daily Send Time
            </p>
            <input
              type="time"
              value={dailySendTime}
              onChange={(e) => setDailySendTime(e.target.value)}
              className="h-9 px-3 text-[13px] bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">Local time. The summary is generated once per day at this time.</p>
          </div>

          {/* What the email includes */}
          <div className="p-3.5 rounded-lg bg-info-bg border border-info-border">
            <p className="text-[12px] font-semibold text-info mb-1.5 flex items-center gap-1.5">
              <Info size={12} /> What the summary includes
            </p>
            <ul className="space-y-1 text-[11px] text-info/80">
              <li>• Which integrations failed</li>
              <li>• Number of failed leads per integration</li>
              <li>• Failure reasons</li>
            </ul>
          </div>

          {/* Currently failing — read-only preview */}
          <div>
            <p className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-danger" /> Currently Failing / Needs Attention ({failing.length})
            </p>
            {failing.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No integrations are currently failing.</p>
            ) : (
              <div className="space-y-1.5">
                {failing.map((i) => (
                  <div key={i.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/50 border border-border">
                    <ConnectorIcon type={i.type} size={22} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{i.name}</p>
                      <p className="text-[10px] text-muted-foreground">{getConnectorLabel(i.type)} · {i.errorCount ?? 0} failed events</p>
                    </div>
                    <StatusBadge status={i.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">This is a live preview only — no email is sent from this screen.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/20">
          <button onClick={onClose} className="h-9 px-4 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground">
            Cancel
          </button>
          <button onClick={handleSave} className="ml-auto h-9 px-5 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 active:scale-95 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div></OverlayPortal>
  );
}
