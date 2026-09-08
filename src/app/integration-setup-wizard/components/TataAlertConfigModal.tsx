'use client';

import React, { useState } from 'react';
import {
  AlertTriangle, Bell, CheckCircle, ChevronDown, Loader2, Mail, MessageSquare, X,
} from 'lucide-react';

const TIME_OPTIONS = [
  'Daily 8:00 AM', 'Daily 12:00 PM', 'Daily 6:00 PM', 'Daily 8:00 PM', 'Daily 10:00 PM',
];

interface TataAlertConfigModalProps {
  open: boolean;
  onClose: () => void;
  integrationName: string;
}

export default function TataAlertConfigModal({ open, onClose, integrationName }: TataAlertConfigModalProps) {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailTime, setEmailTime] = useState(TIME_OPTIONS[3]);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackRecipients, setSlackRecipients] = useState('');
  const [slackTime, setSlackTime] = useState(TIME_OPTIONS[3]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const canSave = (emailEnabled && emailRecipients.trim()) || (slackEnabled && slackRecipients.trim());

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1400);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning-bg border border-warning-border flex items-center justify-center">
              <Bell size={15} className="text-warning" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Configure Alerts</p>
              <p className="text-[11px] text-muted-foreground">{integrationName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-success-bg border border-success-border flex items-center justify-center">
              <CheckCircle size={24} className="text-success" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Alerts Configured!</p>
            <p className="text-[12px] text-muted-foreground text-center px-6">
              You&apos;ll receive scheduled summaries for <span className="font-semibold">{integrationName}</span>.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-bg border border-warning-border">
              <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-warning leading-relaxed">
                At the selected time, a summary plus details of any failed leads will be sent automatically.
              </p>
            </div>

            {/* Email */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">Email Alert</span>
                </div>
                <button
                  onClick={() => setEmailEnabled((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${emailEnabled ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${emailEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {emailEnabled && (
                <div className="space-y-2.5">
                  <div>
                    <input
                      type="text"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      placeholder="alerts@company.com, ops@company.com"
                      className="w-full h-8 px-3 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Separate multiple email addresses with commas.</p>
                  </div>
                  <div className="relative">
                    <select
                      value={emailTime}
                      onChange={(e) => setEmailTime(e.target.value)}
                      className="w-full h-8 pl-3 pr-8 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                    >
                      {TIME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Slack */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">Slack Alert</span>
                </div>
                <button
                  onClick={() => setSlackEnabled((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${slackEnabled ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${slackEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {slackEnabled && (
                <div className="space-y-2.5">
                  <div>
                    <input
                      type="text"
                      value={slackRecipients}
                      onChange={(e) => setSlackRecipients(e.target.value)}
                      placeholder="#alerts, #ops-oncall"
                      className="w-full h-8 px-3 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Separate multiple Slack channels with commas.</p>
                  </div>
                  <div className="relative">
                    <select
                      value={slackTime}
                      onChange={(e) => setSlackTime(e.target.value)}
                      className="w-full h-8 pl-3 pr-8 text-[12px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                    >
                      {TIME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : <><Bell size={12} /> Save Alerts</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
