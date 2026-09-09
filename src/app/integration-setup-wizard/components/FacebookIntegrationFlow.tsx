'use client';

import FacebookPagesForms from './FacebookPagesForms';
import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
  FileText,
  Settings,
  Info,
} from 'lucide-react';

interface LeadForm {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Draft';
  formId: string;
  mappingStatus: 'Mapped' | 'Unmapped' | 'Partial';
}

interface TestLeadResult {
  formId: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: string;
}

const MOCK_PAGES = [
  { id: 'page-001', name: 'My Business Page' },
  { id: 'page-002', name: 'Brand Awareness Page' },
  { id: 'page-003', name: 'Product Launch Page' },
];

const MOCK_LEAD_FORMS: LeadForm[] = [
  { id: 'lf-001', name: 'Contact Us Form',       status: 'Active',   formId: '987654321001', mappingStatus: 'Mapped' },
  { id: 'lf-002', name: 'Free Trial Signup',     status: 'Active',   formId: '987654321002', mappingStatus: 'Partial' },
  { id: 'lf-003', name: 'Newsletter Subscribe',  status: 'Inactive', formId: '987654321003', mappingStatus: 'Unmapped' },
  { id: 'lf-004', name: 'Demo Request Form',     status: 'Draft',    formId: '987654321004', mappingStatus: 'Unmapped' },
];

const MOCK_TEST_LEADS: Record<string, TestLeadResult> = {
  'lf-001': { formId: '987654321001', leadId: 'lead_abc123', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 555-0100', submittedAt: '2026-09-02 14:30:00' },
  'lf-002': { formId: '987654321002', leadId: 'lead_def456', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 555-0200', submittedAt: '2026-09-02 13:15:00' },
};

const META_TESTING_TOOL_URL = 'https://business.facebook.com/business/loginpage/?next=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Flead-ads-testing#';

type ConnectionState = 'idle' | 'connecting' | 'connected';

interface FacebookIntegrationFlowProps {
  onTestLeadRetrieved?: (retrieved: boolean) => void;
}

interface NoTestLeadModalProps {
  formName: string;
  selectedPageName: string;
  onClose: () => void;
}

function NoTestLeadModal({ formName, selectedPageName, onClose }: NoTestLeadModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-600" />
            <span className="text-[14px] font-semibold text-amber-800 dark:text-amber-400">No Test Lead Found</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            No test lead found for <span className="font-medium text-foreground">{formName}</span>. Please submit one using Meta&apos;s Lead Ads Testing Tool, then click <strong>Fetch Test Lead</strong> again.
          </p>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2.5">
            <p className="text-[12px] font-semibold text-foreground uppercase tracking-wide">Instructions</p>
            <ol className="space-y-2">
              {[
                'Open Lead Ads Testing Tool (link below).',
                `Choose Page: ${selectedPageName}.`,
                `Select form: ${formName}.`,
                'Click Preview Form.',
                'Submit with dummy contact details.',
              ].map((step, i) => (
                <li key={`step-${i + 1}`} className="flex items-start gap-2.5 text-[13px] text-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Safety note */}
          <div className="flex items-start gap-2 text-[12px] text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <span>Use safe test contact details (personal email/phone, not CRM domain).</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="h-8 px-4 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-foreground"
          >
            Close
          </button>
          <a
            href={META_TESTING_TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 h-8 px-4 text-[12px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-all"
          >
            <ExternalLink size={12} />
            Open Lead Ads Testing Tool
          </a>
        </div>
      </div>
    </div>
  );
}

interface TestLeadResultPanelProps {
  result: TestLeadResult;
  onClose: () => void;
}

function TestLeadResultPanel({ result, onClose }: TestLeadResultPanelProps) {
  return (
    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-600" />
          <span className="text-[13px] font-semibold text-green-800 dark:text-green-400">Test Lead Retrieved</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={13} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
        {[
          ['Lead ID', result.leadId],
          ['Form ID', result.formId],
          ['Name', result.name],
          ['Email', result.email],
          ['Phone', result.phone],
          ['Submitted At', result.submittedAt],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-1.5">
            <span className="text-muted-foreground font-medium w-24 flex-shrink-0">{label}:</span>
            <span className="text-foreground font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEST_LEAD_VERIFICATION_CHECKS = [
  'Lead payload matches the Meta Lead Ads schema',
  'Required fields present: Name, Email, Phone',
  'Form is Active and receiving live submissions',
];

function TestLeadVerifiedPanel() {
  return (
    <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={15} className="text-blue-600" />
        <span className="text-[13px] font-semibold text-blue-800 dark:text-blue-400">Test Lead Verified</span>
      </div>
      <div className="space-y-1.5">
        {TEST_LEAD_VERIFICATION_CHECKS.map((check) => (
          <div key={check} className="flex items-start gap-2 text-[12px] text-blue-800 dark:text-blue-300">
            <CheckCircle2 size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <span>{check}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FacebookIntegrationFlow({ onTestLeadRetrieved }: FacebookIntegrationFlowProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [fetchingLeadFor, setFetchingLeadFor] = useState<string | null>(null);
  const [testLeadResults, setTestLeadResults] = useState<Record<string, TestLeadResult | null>>({});
  const [noLeadModalForm, setNoLeadModalForm] = useState<LeadForm | null>(null);
  const popupRef = useRef<Window | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPage = MOCK_PAGES.find((p) => p.id === selectedPageId);

  // Notify parent whenever test lead results change
  useEffect(() => {
    const hasAnyLead = Object.values(testLeadResults).some((v) => v !== null && v !== undefined);
    onTestLeadRetrieved?.(hasAnyLead);
  }, [testLeadResults, onTestLeadRetrieved]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConnect = () => {
    setConnectionState('connecting');
    // Simulate OAuth popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    popupRef.current = window.open(
      'about:blank',
      'facebook_oauth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    if (popupRef.current) {
      popupRef.current.document.write(`
        <html>
          <head><title>Facebook Login</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f0f2f5; }
            .card { background:white; border-radius:8px; padding:32px; max-width:380px; width:100%; box-shadow:0 2px 12px rgba(0,0,0,0.15); text-align:center; }
            .logo { width:48px; height:48px; background:#1877F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:white; font-size:28px; font-weight:bold; }
            h2 { margin:0 0 8px; font-size:20px; color:#1c1e21; }
            p { color:#606770; font-size:14px; margin:0 0 24px; }
            .btn { background:#1877F2; color:white; border:none; border-radius:6px; padding:12px 24px; font-size:15px; font-weight:600; cursor:pointer; width:100%; }
            .note { font-size:12px; color:#90949c; margin-top:16px; }
          </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">f</div>
              <h2>Log in with Facebook</h2>
              <p>This is a simulated OAuth popup for demonstration purposes.</p>
              <button class="btn" onClick="window.close()">Continue as Demo User</button>
              <p class="note">This window will close automatically after login.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Simulate OAuth completion after 2.5s
    setTimeout(() => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      setConnectionState('connected');
    }, 2500);
  };

  const handleFetchTestLead = (form: LeadForm) => {
    setFetchingLeadFor(form.id);
    setTimeout(() => {
      const mockLead = MOCK_TEST_LEADS[form.id] ?? null;
      if (mockLead) {
        setTestLeadResults((prev) => ({ ...prev, [form.id]: mockLead }));
      } else {
        setNoLeadModalForm(form);
      }
      setFetchingLeadFor(null);
    }, 1200);
  };

  const handleReConnect = () => {
    setConnectionState('idle');
    setSelectedPageId('');
    setTestLeadResults({});
    setNoLeadModalForm(null);
    onTestLeadRetrieved?.(false);
  };

  const statusColor: Record<LeadForm['status'], string> = {
    Active:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    Draft:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const mappingColor: Record<LeadForm['mappingStatus'], string> = {
    Mapped:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Partial:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Unmapped: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Facebook Lead Ads Integration</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Connect your Facebook account to capture leads from Lead Ads forms.</p>
        </div>
      </div>

      {/* ── STEP 1: Connect ── */}
      {connectionState === 'idle' && (
        <div className="border border-border rounded-xl p-6 flex flex-col items-center text-center gap-4 bg-muted/20">
          <div className="w-14 h-14 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Connect your Facebook Account</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              Authorize access to your Facebook Pages and Lead Ads forms via secure OAuth.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 h-10 px-6 text-[13px] font-semibold bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] active:scale-95 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            Connect Facebook
          </button>
        </div>
      )}

      {/* ── STEP 1b: Connecting (loading) ── */}
      {connectionState === 'connecting' && (
        <div className="border border-border rounded-xl p-6 flex flex-col items-center text-center gap-3 bg-muted/20">
          <Loader2 size={32} className="text-[#1877F2] animate-spin" />
          <p className="text-[13px] font-medium text-foreground">Waiting for Facebook authorization…</p>
          <p className="text-[12px] text-muted-foreground">Complete the login in the popup window.</p>
        </div>
      )}

      {/* ── STEP 2: Connected ── */}
      {connectionState === 'connected' && (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-3.5">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-green-800 dark:text-green-400">Facebook Connected Successfully</p>
              <p className="text-[12px] text-green-700 dark:text-green-500 mt-0.5">Your Facebook account has been authorized. Select a page to continue.</p>
            </div>
            <button
              onClick={handleReConnect}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-white dark:bg-card border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 active:scale-95 transition-all flex-shrink-0"
              title="Re-authenticate with Facebook"
            >
              <RefreshCw size={12} />
              Re-Connect
            </button>
          </div>

          <FacebookPagesForms onReady={onTestLeadRetrieved} />
        </div>
      )}

      {/* No test lead modal */}
      {noLeadModalForm && (
        <NoTestLeadModal
          formName={noLeadModalForm.name}
          selectedPageName={selectedPage?.name ?? 'Selected Page'}
          onClose={() => setNoLeadModalForm(null)}
        />
      )}
    </div>
  );
}
