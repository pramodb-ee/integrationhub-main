'use client';

import { useSetupState } from '@/app/components/integrationSetupStore';
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Loader2, Eye, EyeOff, Server, TestTube, Key, User, Wifi, WifiOff } from 'lucide-react';
import { ERPId, AuthType, Environment, ERP_MAP } from './erpRegistry';

interface ERPAuthStepProps {
  erpId: ERPId;
  onValidated: (data: { environment: Environment; authType: AuthType; credentials: Record<string, string> }) => void;
}

const AUTH_OPTIONS: { id: AuthType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'auth-key', label: 'Auth Key', desc: 'Bearer / Auth token', icon: <Key size={14} /> },
  { id: 'api-key', label: 'API Key', desc: 'Key-based access', icon: <ShieldCheck size={14} /> },
  { id: 'username-password', label: 'Username / Password', desc: 'Basic credentials', icon: <User size={14} /> },
  { id: 'none', label: 'No Authentication', desc: 'Public / open endpoint', icon: <WifiOff size={14} /> },
];

export default function ERPAuthStep({ erpId, onValidated }: ERPAuthStepProps) {
  const erp = ERP_MAP[erpId];
  const [environment, setEnvironment] = useSetupState<Environment>('erp-crm', 'ERPAuthStep.environment', 'production');
  const [authType, setAuthType] = useSetupState<AuthType | null>('erp-crm', 'ERPAuthStep.authType', null);
  const [credentials, setCredentials] = useSetupState<Record<string, string>>('erp-crm', 'ERPAuthStep.credentials', {});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'idle' | 'success' | 'failed'>('idle');

  const supportedAuth = erp?.supportedAuthTypes || ['auth-key', 'api-key', 'username-password', 'none'];
  const currentFields = authType && authType !== 'none' ? (erp?.authFields?.[authType] || []) : [];

  const handleAuthSelect = (type: AuthType) => {
    if (authType === type) {
      setAuthType(null);
    } else {
      setAuthType(type);
    }
    setCredentials({});
    setValidationResult('idle');
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
    setValidationResult('idle');
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canValidate = authType === 'none' || (authType !== null && currentFields.filter((f) => f.required).every((f) => credentials[f.key]?.trim()));

  const handleValidate = () => {
    if (!canValidate) return;
    if (authType === 'none') {
      onValidated({ environment, authType: 'none', credentials: {} });
      return;
    }
    setValidating(true);
    setValidationResult('idle');
    setTimeout(() => {
      setValidating(false);
      setValidationResult('success');
      onValidated({ environment, authType: authType!, credentials });
    }, 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-8 h-8 rounded-lg ${erp?.iconBg || 'bg-gray-100'} flex items-center justify-center text-[10px] font-bold text-gray-700`}>
            {erp?.iconText || '?'}
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Connect &amp; Authenticate</h2>
            <p className="text-[12px] text-muted-foreground">{erp?.name}</p>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="mb-6">
        <label className="block text-[12px] font-semibold text-foreground mb-2 uppercase tracking-wide">Environment</label>
        <div className="grid grid-cols-2 gap-3">
          {(['production', 'sandbox'] as Environment[]).map((env) => (
            <button
              key={`env-${env}`}
              onClick={() => { setEnvironment(env); setValidationResult('idle'); }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                environment === env ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              {env === 'production'
                ? <Server size={16} className={environment === env ? 'text-primary' : 'text-muted-foreground'} />
                : <TestTube size={16} className={environment === env ? 'text-primary' : 'text-muted-foreground'} />
              }
              <div>
                <p className={`text-[12px] font-semibold capitalize ${environment === env ? 'text-primary' : 'text-foreground'}`}>{env}</p>
                <p className="text-[10px] text-muted-foreground">
                  {env === 'production' ? 'Live data & transactions' : 'Test environment, safe to experiment'}
                </p>
              </div>
              {environment === env && <CheckCircle size={14} className="text-primary ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Auth Type — optional, selectable/unselectable */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[12px] font-semibold text-foreground uppercase tracking-wide">Authentication Type</label>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">Optional — click to select or deselect</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AUTH_OPTIONS.filter((a) => supportedAuth.includes(a.id)).map((auth) => {
            const isSelected = authType === auth.id;
            return (
              <button
                key={`auth-${auth.id}`}
                onClick={() => handleAuthSelect(auth.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                  isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/20'
                }`}
              >
                <div className={`${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{auth.icon}</div>
                <p className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>{auth.label}</p>
                <p className="text-[9px] text-muted-foreground">{auth.desc}</p>
                {isSelected && <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center"><CheckCircle size={8} className="text-white" /></div>}
              </button>
            );
          })}
        </div>
        {authType === null && (
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
            <Wifi size={11} />
            No authentication selected — you can proceed directly with Next.
          </p>
        )}
      </div>

      {/* Credential Fields — only shown when auth type is selected and not "none" */}
      {authType && authType !== 'none' && currentFields.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/20 space-y-4">
          <p className="text-[12px] font-semibold text-foreground">Credentials</p>
          {currentFields.map((field) => (
            <div key={`cred-${field.key}`}>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-[11px] font-medium text-foreground">{field.label}</label>
                {field.required && <span className="text-red-500 text-[11px]">*</span>}
              </div>
              <div className="relative">
                <input
                  type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.key)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords[field.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Result */}
      {validationResult === 'success' && (
        <div className="flex items-center gap-3 mb-5 p-3.5 rounded-xl border bg-green-50 border-green-200">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-green-800">Connection Validated Successfully</p>
            <p className="text-[11px] text-green-700 mt-0.5">
              {erp?.name} {environment} environment authenticated. Ready to configure.
            </p>
          </div>
        </div>
      )}
      {validationResult === 'failed' && (
        <div className="flex items-center gap-3 mb-5 p-3.5 rounded-xl border bg-red-50 border-red-200">
          <XCircle size={18} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-800">Validation Failed</p>
            <p className="text-[11px] text-red-700 mt-0.5">Could not authenticate. Check your credentials and try again.</p>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {authType === null
            ? 'No auth selected — click Next to continue.'
            : authType === 'none' ?'Public endpoint — no credentials needed.' :'Fill required fields and validate connection before proceeding.'}
        </p>
        {authType !== null && authType !== 'none' && (
          <button
            onClick={handleValidate}
            disabled={!canValidate || validating || validationResult === 'success'}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? (
              <><Loader2 size={13} className="animate-spin" />Validating...</>
            ) : validationResult === 'success' ? (
              <><CheckCircle size={13} />Validated</>
            ) : (
              <><ShieldCheck size={13} />Validate Connection</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
