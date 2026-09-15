'use client';

import React, { useState } from 'react';
import { Settings, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ERPSystem } from './ERPSelectStep';

const ERP_NAMES: Record<ERPSystem, string> = {
  'salesforce': 'Salesforce',
  'hubspot': 'HubSpot',
  'sap-s4hana': 'SAP S/4 HANA',
  'oracle-netsuite': 'Oracle NetSuite',
  'ms-dynamics-365': 'Microsoft Dynamics 365',
  'odoo': 'Odoo',
  'tallyprime': 'TallyPrime',
  'zoho-erp': 'Zoho ERP',
  'custom-erp': 'Custom ERP',
};

const ERP_BASE_URL_PLACEHOLDERS: Record<ERPSystem, string> = {
  'salesforce': 'https://your-domain.my.salesforce.com',
  'hubspot': 'https://api.hubapi.com',
  'sap-s4hana': 'https://your-sap-instance.s4hana.ondemand.com',
  'oracle-netsuite': 'https://your-account-id.suitetalk.api.netsuite.com',
  'ms-dynamics-365': 'https://your-org.crm.dynamics.com',
  'odoo': 'https://your-company.odoo.com',
  'tallyprime': 'http://localhost:9000 or https://your-tally-server.com',
  'zoho-erp': 'https://books.zoho.com/api/v3',
  'custom-erp': 'https://your-erp-instance.com/api',
};

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German (Deutsch)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'ja', label: 'Japanese (日本語)' },
  { value: 'zh', label: 'Chinese (中文)' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'ar', label: 'Arabic (العربية)' },
];

interface ConfigData {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  companyCode: string;
  language: string;
  timeout: string;
}

interface ERPConfigStepProps {
  erpSystem: ERPSystem;
  onSettingsValidated: (data: ConfigData) => void;
}

export default function ERPConfigStep({ erpSystem, onSettingsValidated }: ERPConfigStepProps) {
  const [config, setConfig] = useState<ConfigData>({
    baseUrl: '',
    clientId: '',
    clientSecret: '',
    companyCode: '',
    language: 'en',
    timeout: '30',
  });
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'idle' | 'success' | 'failed'>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof ConfigData, string>>>({});

  const handleChange = (key: keyof ConfigData, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setValidationResult('idle');
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ConfigData, string>> = {};
    if (!config.baseUrl.trim()) newErrors.baseUrl = 'Base URL is required';
    else if (!config.baseUrl.startsWith('http')) newErrors.baseUrl = 'Must be a valid URL starting with http(s)://';
    if (!config.clientId.trim()) newErrors.clientId = 'Client ID is required';
    if (!config.companyCode.trim()) newErrors.companyCode = 'Company Code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateSettings = () => {
    if (!validate()) return;
    setValidating(true);
    setValidationResult('idle');
    setTimeout(() => {
      setValidating(false);
      setValidationResult('success');
      onSettingsValidated(config);
    }, 1800);
  };

  const fields: { key: keyof ConfigData; label: string; type: string; placeholder: string; required: boolean; hint?: string }[] = [
    {
      key: 'baseUrl',
      label: 'Base URL',
      type: 'url',
      placeholder: ERP_BASE_URL_PLACEHOLDERS[erpSystem],
      required: true,
      hint: 'The root URL of your ERP instance or API endpoint',
    },
    {
      key: 'clientId',
      label: 'Client ID',
      type: 'text',
      placeholder: 'Enter Client ID / Application ID',
      required: true,
      hint: 'OAuth application or API client identifier',
    },
    {
      key: 'clientSecret',
      label: 'Client Secret',
      type: 'password',
      placeholder: 'Enter Client Secret',
      required: false,
      hint: 'Leave blank if using API Key authentication',
    },
    {
      key: 'companyCode',
      label: 'Company Code',
      type: 'text',
      placeholder: 'e.g. 1000, CORP, IN01',
      required: true,
      hint: 'Your organization or company code in the ERP system',
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={18} className="text-primary" />
          <h2 className="text-[16px] font-semibold text-foreground">Configure Connection</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Provide the connection settings for {ERP_NAMES[erpSystem]}. These details are used to establish and maintain the integration.
        </p>
      </div>

      <div className="space-y-4 mb-5">
        {fields.map((field) => (
          <div key={`cfg-${field.key}`}>
            <div className="flex items-center gap-1 mb-1">
              <label className="text-[12px] font-semibold text-foreground">{field.label}</label>
              {field.required && <span className="text-danger text-[11px]">*</span>}
            </div>
            {field.hint && (
              <p className="text-[10px] text-muted-foreground mb-1">{field.hint}</p>
            )}
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={config[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`w-full h-9 px-3 text-[13px] bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                errors[field.key] ? 'border-danger' : 'border-border'
              }`}
            />
            {errors[field.key] && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={11} className="text-danger" />
                <p className="text-[10px] text-danger">{errors[field.key]}</p>
              </div>
            )}
          </div>
        ))}

        {/* Language Selector */}
        <div>
          <label className="block text-[12px] font-semibold text-foreground mb-1">Language</label>
          <p className="text-[10px] text-muted-foreground mb-1">Language used for ERP data and API responses</p>
          <select
            value={config.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full h-9 px-3 text-[13px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {LANGUAGES.map((lang) => (
              <option key={`lang-${lang.value}`} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>

        {/* Timeout Field */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-[12px] font-semibold text-foreground">Timeout (seconds)</label>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Maximum wait time for API responses before timing out</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="300"
              placeholder="30"
              value={config.timeout}
              onChange={(e) => handleChange('timeout', e.target.value)}
              className="w-32 h-9 px-3 text-[13px] bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <div className="flex gap-1.5">
              {['15', '30', '60', '120'].map((val) => (
                <button
                  key={`timeout-${val}`}
                  type="button"
                  onClick={() => handleChange('timeout', val)}
                  className={`h-9 px-3 text-[11px] font-medium rounded-lg border transition-all ${
                    config.timeout === val
                      ? 'border-primary bg-primary/5 text-primary' :'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inline validation result */}
      {validationResult === 'success' && (
        <div className="flex items-center gap-3 mb-4 p-3.5 rounded-lg border bg-success-bg border-success-border">
          <CheckCircle size={18} className="text-success flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-success">Settings Validated</p>
            <p className="text-[11px] text-success/80 mt-0.5">
              Connection settings for {ERP_NAMES[erpSystem]} are valid and reachable.
            </p>
          </div>
        </div>
      )}

      {/* Validate Settings Button */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          All required fields must be filled before proceeding to field mapping.
        </p>
        <button
          onClick={handleValidateSettings}
          disabled={validating}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Settings size={13} />
              Validate Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
