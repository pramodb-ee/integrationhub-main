'use client';

import { useSetupState, SetupEditContext, readSetup, saveSetup } from '@/app/components/integrationSetupStore';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import ConnectorIcon from '@/components/ui/ConnectorIcon';
import { AlertCircle, Info, ChevronDown, ChevronUp, Shield, Webhook, Zap, Settings, Database, Activity, Plus, Copy, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import TataOutboundUserManagement from './TataOutboundUserManagement';

interface DynamicConfigFormProps {
  connectorType: ConnectorType;
  onSubmit: (data: Record<string, string>) => void;
  integrationName: string;
  onNameChange: (name: string) => void;
  onOutboundTestCallSuccess?: () => void;
}

type FormField = {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'textarea' | 'number';
  placeholder: string;
  required: boolean;
  helper?: string;
  options?: { value: string; label: string }[];
};

// Default Login URL per connector — used to pre-fill the Inbound "Connect" flow.
const LOGIN_URL_DEFAULTS: Record<string, string> = {
  tata: 'https://cloudphone.tatateleservices.com/login',
};

function TATADynamicSetup({ connectorType, onSubmit, integrationName, onNameChange, onOutboundTestCallSuccess }: { connectorType: ConnectorType; onSubmit: (data: Record<string, string>) => void; integrationName: string; onNameChange: (name: string) => void; onOutboundTestCallSuccess?: () => void }) {
  const [direction, setDirection] = useSetupState<'Inbound' | 'Outbound'>(connectorType, 'DynamicConfigForm.direction', 'Inbound');
  const [isExtension, setIsExtension] = useSetupState(connectorType, 'DynamicConfigForm.isExtension', false);
  const [activeStatus, setActiveStatus] = useSetupState<'Active' | 'Inactive'>(connectorType, 'DynamicConfigForm.activeStatus', 'Inactive');
  const [values, setValues] = useSetupState<Record<string, string>>(connectorType, 'DynamicConfigForm.values', { empId: '081818881818' });
  const [nameTouched, setNameTouched] = useState(false);
  const [loginUrl, setLoginUrl] = useSetupState(connectorType, 'DynamicConfigForm.loginUrl', LOGIN_URL_DEFAULTS[connectorType] ?? '');
  const [loginId, setLoginId] = useSetupState(connectorType, 'DynamicConfigForm.loginId', '');
  const [password, setPassword] = useState('');
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useSetupState<'idle' | 'connected'>(connectorType, 'DynamicConfigForm.connectionStatus', 'idle');
  const textClass = 'w-full h-9 px-3 text-[13px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';
  const labelClass = 'block text-[12px] font-semibold text-foreground mb-1';
  const nameInvalid = nameTouched && !integrationName.trim();

  const handleLoggedIn = () => {
    setLoginPopupOpen(false);
    setConnectionStatus('connected');
  };

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!integrationName.trim()) { setNameTouched(true); return; }
      onSubmit({ ...values, isActive: activeStatus, integrationName, integrationDirection: direction, isExtension: String(isExtension), loginId, connectionStatus });
    }} className="space-y-5">
      <label className="block">
        <span className="block text-[12px] font-semibold text-foreground mb-1">Integration Name <span className="text-danger">*</span></span>
        <span className="block text-[11px] text-muted-foreground mb-1.5">A descriptive name to identify this integration in the center</span>
        <input
          required
          value={integrationName}
          onChange={(event) => { onNameChange(event.target.value); if (nameTouched) setNameTouched(false); }}
          onBlur={() => setNameTouched(true)}
          placeholder={`e.g. ${getConnectorLabel(connectorType)} - Main IVR`}
          className={`${textClass} ${nameInvalid ? 'border-danger focus:ring-2 focus:ring-danger/20 focus:border-danger' : ''}`}
        />
        {nameInvalid && (
          <p className="flex items-center gap-1 text-[11px] text-danger mt-1.5">
            <AlertCircle size={12} /> Integration Name is required.
          </p>
        )}
      </label>
      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{getConnectorLabel(connectorType)} Settings</span><span className="h-px flex-1 bg-border" /></div>
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Integration Direction</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Choose how {getConnectorLabel(connectorType)} IVR should handle calls.</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {(['Inbound', 'Outbound'] as const).map((option) => (
            <button key={option} type="button" onClick={() => setDirection(option)} className={`h-8 px-4 text-[11px] font-semibold rounded-md transition-colors ${direction === option ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>{option}</button>
          ))}
        </div>
      </div>

      {direction === 'Inbound' && (
        <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/20">
          <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Inbound Configuration</span><span className="h-px flex-1 bg-border" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className={labelClass}>Login URL</span>
              <input value={loginUrl} onChange={(event) => { setLoginUrl(event.target.value); setConnectionStatus('idle'); }} placeholder="https://provider.example.com/login" className={textClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Login Id</span>
              <input value={loginId} onChange={(event) => { setLoginId(event.target.value); setConnectionStatus('idle'); }} placeholder="Enter login ID" className={textClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Password</span>
              <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setConnectionStatus('idle'); }} placeholder="Enter password" className={textClass} />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLoginPopupOpen(true)}
              disabled={!loginUrl.trim()}
              className="flex items-center gap-2 h-9 px-4 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={13} /> Connect
            </button>
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-success">
                <CheckCircle2 size={14} /> Connected
              </span>
            )}
          </div>
        </div>
      )}

      {/* Kept mounted (just hidden) so the outbound user list survives switching direction back and forth. */}
      <div className={direction === 'Outbound' ? '' : 'hidden'}>
        <TataOutboundUserManagement connectorType={connectorType} onTestCallSuccess={onOutboundTestCallSuccess} />
      </div>

      <Modal
        open={loginPopupOpen}
        onClose={() => setLoginPopupOpen(false)}
        title={`Connect to ${getConnectorLabel(connectorType)}`}
        subtitle={`Sign in with your ${getConnectorLabel(connectorType)} credentials`}
        size="2xl"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink size={13} /> Open in new tab
            </a>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLoginPopupOpen(false)} className="h-8 px-3 text-[12px] font-medium border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button type="button" onClick={handleLoggedIn} className="h-8 px-4 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">I&apos;ve Logged In</button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/40 text-[12px] text-muted-foreground">
            <Lock size={12} className="text-success flex-shrink-0" />
            <span className="truncate font-tabular">{loginUrl}</span>
          </div>
          <div className="rounded-lg border border-border overflow-hidden bg-white" style={{ height: 420 }}>
            <iframe src={loginUrl} title={`${getConnectorLabel(connectorType)} Login`} className="w-full h-full border-0" />
          </div>
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            If the login page doesn&apos;t load here because of the provider&apos;s security settings, use &ldquo;Open in new tab&rdquo; below, sign in there, then come back and click &ldquo;I&apos;ve Logged In&rdquo;.
          </p>
        </div>
      </Modal>

      <input type="submit" className="hidden" id="config-form-submit" />
    </form>
  );
}

// Integration Architecture Model — shown as a collapsible info panel
const ARCHITECTURE_CAPABILITIES: Record<string, { provider: string; capabilities: string[]; authType: string; webhookSupport: boolean; eventTypes: string[] }> = {
  facebook:     { provider: 'Meta / Facebook',    capabilities: ['Lead Capture', 'Page Integration', 'Webhook Events'],                   authType: 'OAuth 2.0 + Page Token', webhookSupport: true,  eventTypes: ['leadgen', 'page_feed', 'form_submit'] },
  'google-ads': { provider: 'Google Ads API',     capabilities: ['Lead Form Extensions', 'Campaign Tracking', 'Conversion Import'],       authType: 'OAuth 2.0',              webhookSupport: false, eventTypes: ['lead_form_submit', 'conversion'] },
  'google-forms':{ provider: 'Google Workspace', capabilities: ['Form Response Sync', 'Polling', 'Sheet Integration'],                    authType: 'Service Account',        webhookSupport: false, eventTypes: ['form_response'] },
  justdial:     { provider: 'JustDial Business',  capabilities: ['Lead Import', 'Webhook Push', 'Category Filter'],                       authType: 'API Key',                webhookSupport: true,  eventTypes: ['new_lead', 'lead_update'] },
  linkedin:     { provider: 'LinkedIn + Pabbly',  capabilities: ['Lead Gen Forms', 'Pabbly Relay', 'Ad Account Sync'],                    authType: 'OAuth 2.0 via Pabbly',   webhookSupport: true,  eventTypes: ['lead_gen_form_response'] },


  api:          { provider: 'Generic REST API',   capabilities: ['HTTP Push/Pull', 'Custom Headers', 'Auth Flexible'],                    authType: 'Bearer / API Key / Basic',webhookSupport: true,  eventTypes: ['http_post', 'http_get', 'webhook'] },

  ivr:          { provider: 'Generic IVR',        capabilities: ['Call Tracking', 'Lead Capture', 'Webhook Push'],                        authType: 'API Key + Secret',       webhookSupport: true,  eventTypes: ['call_connected', 'call_ended', 'lead_captured'] },
  twilio:       { provider: 'Twilio',             capabilities: ['Programmable Voice', 'Studio Flows', 'Call Tracking', 'SMS'],           authType: 'Account SID + Auth Token',webhookSupport: true, eventTypes: ['call.initiated', 'call.completed', 'recording.completed'] },
  tata:         { provider: 'TATA Tele Business Services', capabilities: ['Inbound Calls', 'Outbound Calls', 'IVR', 'Call Recording'], authType: 'API Key + Token', webhookSupport: true, eventTypes: ['call.incoming', 'call.outgoing', 'call.completed'] },
  exotel:       { provider: 'Exotel',               capabilities: ['Cloud Telephony', 'IVR Flows', 'Call Recording', 'Webhooks'], authType: 'API Key + Token', webhookSupport: true, eventTypes: ['call.initiated', 'call.answered', 'call.completed'] },
  knowlarity:   { provider: 'Knowlarity',           capabilities: ['IVR', 'Call Routing', 'Call Recording', 'Agent Queues'], authType: 'API Key + SID', webhookSupport: true, eventTypes: ['call.received', 'call.connected', 'call.ended'] },
  ozonetel:     { provider: 'Ozonetel CloudAgent',capabilities: ['IVR Flows', 'Call Recording', 'Agent Routing', 'Lead Push'],            authType: 'API Key + Domain',       webhookSupport: true,  eventTypes: ['call_connected', 'call_ended', 'disposition_set'] },
  myoperator:   { provider: 'MyOperator',         capabilities: ['Cloud Telephony', 'IVR Routing', 'Call Analytics', 'CRM Push'],         authType: 'API Token',              webhookSupport: true,  eventTypes: ['call_received', 'call_answered', 'call_missed'] },
  cloudtalk:    { provider: 'CloudTalk',          capabilities: ['Call Center', 'IVR', 'Power Dialer', 'Analytics'],                      authType: 'API Key',                webhookSupport: true,  eventTypes: ['call.created', 'call.answered', 'call.ended'] },
  ringcentral:  { provider: 'RingCentral',        capabilities: ['UCaaS', 'IVR', 'Call Queues', 'Webhooks', 'Analytics'],                 authType: 'OAuth 2.0',              webhookSupport: true,  eventTypes: ['telephony.sessions', 'call.log', 'voicemail'] },
  'ivr-custom': { provider: 'Custom / Internal',  capabilities: ['Flexible Webhook', 'Custom Schema', 'IP Whitelist'],                    authType: 'Custom Token',           webhookSupport: true,  eventTypes: ['custom_event', 'call_event'] },
  'erp-crm':    { provider: 'ERP / CRM Platform', capabilities: ['Bidirectional Sync', 'Object Mapping', 'Delta Sync'],                  authType: 'OAuth 2.0',              webhookSupport: true,  eventTypes: ['record_created', 'record_updated', 'record_deleted'] },
  'pull-from-crm': { provider: 'CRM Platform',    capabilities: ['Scheduled Pull', 'Object Mapping', 'Delta Sync'],                       authType: 'OAuth 2.0',              webhookSupport: false, eventTypes: ['record_pulled'] },
  'pull-from-erp': { provider: 'ERP Platform',    capabilities: ['Scheduled Pull', 'Object Mapping', 'Delta Sync'],                       authType: 'OAuth 2.0',              webhookSupport: false, eventTypes: ['record_pulled'] },
  'erp-two-way':   { provider: 'ERP + CRM Platform', capabilities: ['Bidirectional Sync', 'Conflict Resolution', 'Delta Sync'],           authType: 'OAuth 2.0',              webhookSupport: true,  eventTypes: ['record_created', 'record_updated', 'record_deleted'] },
};

const connectorFields: Partial<Record<ConnectorType, FormField[]>> = {
  facebook: [
    { name: 'pageId',             label: 'Facebook Page ID',        type: 'text',     placeholder: 'e.g. 123456789012345',              required: true,  helper: 'Found in your Facebook Page → About → Page ID' },
    { name: 'leadFormId',         label: 'Lead Form ID',            type: 'text',     placeholder: 'e.g. 987654321098765',              required: true,  helper: 'Page → Publishing Tools → Forms Library' },
    { name: 'accessToken',        label: 'Page Access Token',       type: 'password', placeholder: 'EAA...',                            required: true,  helper: 'Long-lived page access token with leads_retrieval permission' },
    { name: 'webhookVerifyToken', label: 'Webhook Verify Token',    type: 'text',     placeholder: 'Custom verify token string',        required: true,  helper: 'Any random string — used to verify Facebook webhook calls' },
    { name: 'environment',        label: 'Environment',             type: 'select',   placeholder: '',                                  required: true,  options: [{ value: 'production', label: 'Production' }, { value: 'staging', label: 'Staging' }, { value: 'development', label: 'Development' }] },
  ],
  'google-ads': [
    { name: 'customerId',    label: 'Google Ads Customer ID', type: 'text',     placeholder: 'e.g. 123-456-7890',                required: true,  helper: 'Found in your Google Ads account header' },
    { name: 'campaignId',    label: 'Campaign ID',            type: 'text',     placeholder: 'e.g. 1234567890',                  required: false, helper: 'Leave blank to capture leads from all campaigns' },
    { name: 'developerToken',label: 'Developer Token',        type: 'password', placeholder: 'Your Google Ads API developer token', required: true },
    { name: 'refreshToken',  label: 'OAuth Refresh Token',    type: 'password', placeholder: 'OAuth 2.0 refresh token',          required: true },
    { name: 'clientId',      label: 'OAuth Client ID',        type: 'text',     placeholder: 'xxxx.apps.googleusercontent.com',  required: true },
    { name: 'clientSecret',  label: 'OAuth Client Secret',    type: 'password', placeholder: 'Google OAuth client secret',       required: true },
  ],
  'google-forms': [
    { name: 'formId',              label: 'Google Form ID',           type: 'text',     placeholder: 'Extract from form URL after /d/', required: true,  helper: 'docs.google.com/forms/d/[FORM_ID]/edit' },
    { name: 'serviceAccountEmail', label: 'Service Account Email',    type: 'text',     placeholder: 'name@project.iam.gserviceaccount.com', required: true },
    { name: 'privateKeyJson',      label: 'Service Account Key (JSON)',type: 'textarea', placeholder: '{"type": "service_account", ...}', required: true, helper: 'Paste the full JSON key file contents' },
    { name: 'pollInterval',        label: 'Poll Interval (minutes)',  type: 'number',   placeholder: '5',                               required: true,  helper: 'How often to check for new responses (min: 1, max: 60)' },
  ],
  // Generic IVR (legacy)
  ivr: [
    { name: 'vendorName',        label: 'IVR Vendor Name',          type: 'text',     placeholder: 'e.g. Exotel, Knowlarity',          required: true },
    { name: 'webhookUrl',        label: 'Vendor Webhook Endpoint',  type: 'url',      placeholder: 'https://vendor.ivr.com/webhook/v2', required: true, helper: 'URL your IVR vendor will POST call data to' },
    { name: 'apiKey',            label: 'Vendor API Key',           type: 'password', placeholder: 'IVR vendor API key',               required: true },
    { name: 'apiSecret',         label: 'Vendor API Secret',        type: 'password', placeholder: 'IVR vendor API secret',            required: true },
    { name: 'virtualNumber',     label: 'Virtual Number / DID',     type: 'text',     placeholder: '+91 1800 XXX XXXX',                required: true,  helper: 'Inbound number configured with your IVR vendor' },
    { name: 'callbackAuthToken', label: 'Callback Auth Token',      type: 'password', placeholder: 'Token to verify incoming webhook calls', required: true },
  ],
  // Twilio
  twilio: [
    { name: 'accountSid',      label: 'Account SID',              type: 'text',     placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true,  helper: 'Found in Twilio Console → Dashboard' },
    { name: 'authToken',       label: 'Auth Token',               type: 'password', placeholder: 'Twilio Auth Token',                required: true,  helper: 'Keep this secret — used to sign webhook requests' },
    { name: 'phoneNumber',     label: 'Twilio Phone Number',      type: 'text',     placeholder: '+1 555 000 0000',                  required: true,  helper: 'The Twilio number receiving inbound calls' },
    { name: 'studioFlowSid',   label: 'Studio Flow SID (optional)',type: 'text',     placeholder: 'FWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: false, helper: 'If using Twilio Studio for IVR flows' },
    { name: 'statusCallbackUrl',label: 'Status Callback URL',     type: 'url',      placeholder: 'Auto-generated after save',        required: false, helper: 'Twilio will POST call status updates here' },
    { name: 'recordCalls',     label: 'Record Calls',             type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'yes', label: 'Yes — record all calls' }, { value: 'no', label: 'No — do not record' }] },
  ],
  tata: [
    { name: 'apiKey', label: 'TATA API Key', type: 'password', placeholder: 'TATA telephony API key', required: true },
    { name: 'authToken', label: 'TATA Auth Token', type: 'password', placeholder: 'TATA auth token', required: true },
    { name: 'accountSid', label: 'Account / Customer ID', type: 'text', placeholder: 'Your TATA account identifier', required: true },
    { name: 'virtualNumber', label: 'Virtual Number / DID', type: 'text', placeholder: '+91 1800 XXX XXXX', required: true },
    { name: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://your-crm.com/webhooks/tata', required: true },
    { name: 'features', label: 'Enabled Features', type: 'select', placeholder: '', required: true, options: [{ value: 'inbound-outbound-ivr-recording', label: 'Incoming, outgoing, IVR, recording' }, { value: 'inbound-ivr', label: 'Incoming calls and IVR' }] },
  ],
  exotel: [
    { name: 'apiKey', label: 'Exotel API Key', type: 'password', placeholder: 'Exotel API key', required: true },
    { name: 'apiToken', label: 'Exotel API Token', type: 'password', placeholder: 'Exotel API token', required: true },
    { name: 'subdomain', label: 'Exotel Subdomain', type: 'text', placeholder: 'yourcompany', required: true },
    { name: 'virtualNumber', label: 'Exotel Number', type: 'text', placeholder: '+91 1800 XXX XXXX', required: true },
    { name: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://your-crm.com/webhooks/exotel', required: true },
    { name: 'features', label: 'Enabled Features', type: 'select', placeholder: '', required: true, options: [{ value: 'all', label: 'Incoming, outgoing, IVR, recording' }, { value: 'inbound-recording', label: 'Incoming calls and recording' }] },
  ],
  knowlarity: [
    { name: 'apiKey', label: 'Knowlarity API Key', type: 'password', placeholder: 'Knowlarity API key', required: true },
    { name: 'sid', label: 'Knowlarity SID', type: 'text', placeholder: 'Your Knowlarity SID', required: true },
    { name: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Knowlarity auth token', required: true },
    { name: 'virtualNumber', label: 'Virtual Number / DID', type: 'text', placeholder: '+91 1800 XXX XXXX', required: true },
    { name: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://your-crm.com/webhooks/knowlarity', required: true },
    { name: 'features', label: 'Enabled Features', type: 'select', placeholder: '', required: true, options: [{ value: 'all', label: 'Incoming, outgoing, IVR, recording' }, { value: 'ivr-recording', label: 'IVR and recording' }] },
  ],
  // Ozonetel
  ozonetel: [
    { name: 'apiKey',          label: 'Ozonetel API Key',         type: 'password', placeholder: 'Ozonetel API key',                 required: true,  helper: 'Found in Ozonetel Admin → API Settings' },
    { name: 'domain',          label: 'Account Domain',           type: 'text',     placeholder: 'yourcompany.ozonetel.com',         required: true,  helper: 'Your Ozonetel account subdomain' },
    { name: 'did',             label: 'DID / Virtual Number',     type: 'text',     placeholder: '+91 1800 XXX XXXX',                required: true },
    { name: 'agentId',         label: 'Default Agent / Queue ID', type: 'text',     placeholder: 'Agent or queue identifier',        required: false },
    { name: 'webhookSecret',   label: 'Webhook Secret',           type: 'password', placeholder: 'Secret for verifying callbacks',   required: true },
    { name: 'callDisposition', label: 'Capture Disposition',      type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'all', label: 'All calls' }, { value: 'answered', label: 'Answered only' }, { value: 'missed', label: 'Missed only' }] },
  ],
  // MyOperator
  myoperator: [
    { name: 'apiToken',        label: 'MyOperator API Token',     type: 'password', placeholder: 'MyOperator API token',             required: true,  helper: 'Found in MyOperator Dashboard → API' },
    { name: 'companyId',       label: 'Company ID',               type: 'text',     placeholder: 'Your MyOperator company ID',       required: true },
    { name: 'virtualNumber',   label: 'Virtual Number',           type: 'text',     placeholder: '+91 1800 XXX XXXX',                required: true },
    { name: 'webhookUrl',      label: 'Webhook Endpoint',         type: 'url',      placeholder: 'Auto-generated after save',        required: false, helper: 'MyOperator will POST call events here' },
    { name: 'captureType',     label: 'Capture Type',             type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'all', label: 'All calls' }, { value: 'inbound', label: 'Inbound only' }, { value: 'missed', label: 'Missed calls' }] },
  ],
  // CloudTalk
  cloudtalk: [
    { name: 'apiKey',          label: 'CloudTalk API Key',        type: 'password', placeholder: 'CloudTalk API key',                required: true,  helper: 'Found in CloudTalk → Settings → API' },
    { name: 'apiSecret',       label: 'API Secret',               type: 'password', placeholder: 'CloudTalk API secret',             required: true },
    { name: 'inboundNumber',   label: 'Inbound Number',           type: 'text',     placeholder: '+1 555 000 0000',                  required: true },
    { name: 'queueId',         label: 'Queue ID (optional)',       type: 'text',     placeholder: 'Call queue identifier',            required: false },
    { name: 'webhookSecret',   label: 'Webhook Signing Secret',   type: 'password', placeholder: 'Used to verify CloudTalk webhooks', required: true },
    { name: 'callOutcome',     label: 'Capture Outcome',          type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'all', label: 'All outcomes' }, { value: 'answered', label: 'Answered' }, { value: 'voicemail', label: 'Voicemail' }] },
  ],
  // RingCentral
  ringcentral: [
    { name: 'clientId',        label: 'OAuth Client ID',          type: 'text',     placeholder: 'RingCentral app client ID',        required: true,  helper: 'Create an app in RingCentral Developer Console' },
    { name: 'clientSecret',    label: 'OAuth Client Secret',      type: 'password', placeholder: 'RingCentral app client secret',    required: true },
    { name: 'accountId',       label: 'Account ID',               type: 'text',     placeholder: '~ (tilde for current account)',    required: true,  helper: 'Use ~ for the authenticated account' },
    { name: 'extensionId',     label: 'Extension ID (optional)',  type: 'text',     placeholder: '~ or specific extension',          required: false },
    { name: 'webhookSecret',   label: 'Webhook Verification Token',type: 'password', placeholder: 'Token for webhook verification',  required: true },
    { name: 'environment',     label: 'Environment',              type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'production', label: 'Production' }, { value: 'sandbox', label: 'Sandbox' }] },
  ],
  // Custom IVR
  'ivr-custom': [
    { name: 'vendorName',      label: 'Vendor / System Name',     type: 'text',     placeholder: 'e.g. Internal IVR, Exotel, Knowlarity', required: true },
    { name: 'webhookUrl',      label: 'Inbound Webhook URL',      type: 'url',      placeholder: 'Auto-generated after save',        required: false, helper: 'Your vendor will POST call events to this URL' },
    { name: 'authToken',       label: 'Auth Token',               type: 'password', placeholder: 'Token to verify incoming requests', required: true },
    { name: 'virtualNumber',   label: 'Virtual Number / DID',     type: 'text',     placeholder: '+91 1800 XXX XXXX',                required: true },
    { name: 'ipWhitelist',     label: 'IP Whitelist (optional)',   type: 'text',     placeholder: '203.0.113.0, 198.51.100.0',        required: false, helper: 'Restrict webhook calls to specific IPs' },
    { name: 'payloadSchema',   label: 'Expected Payload Fields',  type: 'text',     placeholder: 'caller_id,duration,status,agent',  required: false, helper: 'Comma-separated field names your vendor sends' },
  ],


  api: [
    { name: 'httpMethod',      label: 'HTTP Method',              type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }] },
    { name: 'authType',        label: 'Authentication Type',      type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'bearer', label: 'Bearer Token' }, { value: 'apikey', label: 'API Key Header' }, { value: 'basic', label: 'Basic Auth' }, { value: 'none', label: 'No Auth' }] },
    { name: 'authValue',       label: 'Auth Value / Token',       type: 'password', placeholder: 'Bearer token, API key, or Base64', required: false },
    { name: 'customHeaders',   label: 'Custom Headers (JSON)',    type: 'textarea', placeholder: '{"Content-Type": "application/json"}', required: false, helper: 'Additional HTTP headers as a JSON object' },
    { name: 'timeoutMs',       label: 'Request Timeout (ms)',     type: 'number',   placeholder: '5000',                             required: true },
  ],
  linkedin: [
    { name: 'pabblyWebhookUrl',  label: 'Pabbly Connect Webhook URL', type: 'url',  placeholder: 'https://connect.pabbly.com/workflow/sendwebhookdata/...', required: true, helper: 'Create a Pabbly workflow with LinkedIn Lead Gen trigger' },
    { name: 'linkedinAccountId', label: 'LinkedIn Ad Account ID',     type: 'text', placeholder: 'e.g. 503218495',                  required: true },
    { name: 'leadFormId',        label: 'Lead Gen Form ID',           type: 'text', placeholder: 'LinkedIn Lead Gen Form URN',       required: true },
    { name: 'pabblyAuthToken',   label: 'Pabbly Auth Token',          type: 'password', placeholder: 'Pabbly workflow auth token',   required: false },
  ],
  justdial: [
    { name: 'justdialApiKey',  label: 'JustDial API Key',         type: 'password', placeholder: 'JustDial Business API key',        required: true,  helper: 'Obtain from JustDial Business Partner portal' },
    { name: 'listingId',       label: 'Business Listing ID',      type: 'text',     placeholder: 'e.g. JD1234567890',                required: true },
    { name: 'webhookSecret',   label: 'Webhook Secret',           type: 'password', placeholder: 'Secret for verifying JustDial callbacks', required: true },
    { name: 'leadCategory',    label: 'Lead Category Filter',     type: 'text',     placeholder: 'e.g. Real Estate (blank = all)',   required: false },
  ],

  'erp-crm': [
    { name: 'erpSystem',       label: 'ERP/CRM Platform',         type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'salesforce', label: 'Salesforce' }, { value: 'zoho', label: 'Zoho CRM' }, { value: 'hubspot', label: 'HubSpot' }, { value: 'sap', label: 'SAP' }, { value: 'oracle', label: 'Oracle CRM' }, { value: 'custom', label: 'Custom ERP' }] },
    { name: 'instanceUrl',     label: 'Instance / API URL',       type: 'url',      placeholder: 'https://yourcompany.salesforce.com', required: true },
    { name: 'clientId',        label: 'OAuth Client ID',          type: 'text',     placeholder: 'Connected App Client ID',          required: true },
    { name: 'clientSecret',    label: 'OAuth Client Secret',      type: 'password', placeholder: 'Connected App Client Secret',      required: true },
    { name: 'syncDirection',   label: 'Sync Direction',           type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'inbound', label: 'Inbound only (ERP → Hub)' }, { value: 'outbound', label: 'Outbound only (Hub → ERP)' }, { value: 'bidirectional', label: 'Bidirectional' }] },
    { name: 'syncInterval',    label: 'Sync Interval (minutes)',  type: 'number',   placeholder: '15',                               required: true },
  ],
  'pull-from-crm': [
    { name: 'erpSystem',       label: 'CRM Platform',             type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'salesforce', label: 'Salesforce' }, { value: 'zoho', label: 'Zoho CRM' }, { value: 'hubspot', label: 'HubSpot' }, { value: 'custom', label: 'Custom CRM' }] },
    { name: 'instanceUrl',     label: 'Instance / API URL',       type: 'url',      placeholder: 'https://yourcompany.salesforce.com', required: true },
    { name: 'clientId',        label: 'OAuth Client ID',          type: 'text',     placeholder: 'Connected App Client ID',          required: true },
    { name: 'clientSecret',    label: 'OAuth Client Secret',      type: 'password', placeholder: 'Connected App Client Secret',      required: true },
    { name: 'syncInterval',    label: 'Pull Interval (minutes)',  type: 'number',   placeholder: '15',                               required: true },
  ],
  'pull-from-erp': [
    { name: 'erpSystem',       label: 'ERP Platform',             type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'sap', label: 'SAP' }, { value: 'oracle', label: 'Oracle ERP' }, { value: 'custom', label: 'Custom ERP' }] },
    { name: 'instanceUrl',     label: 'Instance / API URL',       type: 'url',      placeholder: 'https://yourcompany.erp.com',      required: true },
    { name: 'clientId',        label: 'OAuth Client ID',          type: 'text',     placeholder: 'Connected App Client ID',          required: true },
    { name: 'clientSecret',    label: 'OAuth Client Secret',      type: 'password', placeholder: 'Connected App Client Secret',      required: true },
    { name: 'syncInterval',    label: 'Pull Interval (minutes)',  type: 'number',   placeholder: '15',                               required: true },
  ],
  'erp-two-way': [
    { name: 'erpSystem',       label: 'ERP/CRM Platform',         type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'salesforce', label: 'Salesforce' }, { value: 'zoho', label: 'Zoho CRM' }, { value: 'sap', label: 'SAP' }, { value: 'oracle', label: 'Oracle CRM' }, { value: 'custom', label: 'Custom ERP' }] },
    { name: 'instanceUrl',     label: 'Instance / API URL',       type: 'url',      placeholder: 'https://yourcompany.salesforce.com', required: true },
    { name: 'clientId',        label: 'OAuth Client ID',          type: 'text',     placeholder: 'Connected App Client ID',          required: true },
    { name: 'clientSecret',    label: 'OAuth Client Secret',      type: 'password', placeholder: 'Connected App Client Secret',      required: true },
    { name: 'syncDirection',   label: 'Sync Direction',           type: 'select',   placeholder: '',                                 required: true,  options: [{ value: 'bidirectional', label: 'Bidirectional' }] },
    { name: 'syncInterval',    label: 'Sync Interval (minutes)',  type: 'number',   placeholder: '15',                               required: true },
  ],
};

// Architecture info panel component
function ArchitecturePanel({ connectorType }: { connectorType: ConnectorType }) {
  const [expanded, setExpanded] = useState(false);
  const arch = ARCHITECTURE_CAPABILITIES[connectorType];
  if (!arch) return null;

  const pillClass = 'text-[10px] font-medium bg-muted border border-border rounded-full px-2 py-0.5 text-muted-foreground';

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden mb-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database size={13} className="text-primary" />
          <span className="text-[12px] font-semibold text-foreground">Integration Architecture</span>
          <span className="text-[10px] text-muted-foreground">— Provider · Capabilities · Auth · Webhook · Events</span>
        </div>
        {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Settings size={10} /> Provider</p>
            <p className="text-[12px] font-medium text-foreground">{arch.provider}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Shield size={10} /> Authentication</p>
            <p className="text-[12px] font-medium text-foreground">{arch.authType}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Zap size={10} /> Capabilities</p>
            <div className="flex flex-wrap gap-1">
              {arch.capabilities.map((cap) => <span key={`cap-${cap}`} className={pillClass}>{cap}</span>)}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Activity size={10} /> Event Types</p>
            <div className="flex flex-wrap gap-1">
              {arch.eventTypes.map((ev) => <span key={`ev-${ev}`} className={`${pillClass} font-mono`}>{ev}</span>)}
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Webhook size={10} /> Webhook Support</p>
            <span className={`text-[11px] font-semibold ${arch.webhookSupport ? 'text-success' : 'text-muted-foreground'}`}>
              {arch.webhookSupport ? '✓ Supported — real-time event push' : '✗ Not supported — polling only'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DynamicConfigForm({ connectorType, onSubmit, integrationName, onNameChange, onOutboundTestCallSuccess }: DynamicConfigFormProps) {
  const editContext = React.useContext(SetupEditContext);
  const storedConfig = editContext?.values[`${connectorType}.configuration`] as Record<string, string> | undefined;
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Record<string, string>>({ defaultValues: storedConfig });
  React.useEffect(() => {
    const subscription = watch((values) => {
      if (editContext) editContext.values[`${connectorType}.configuration`] = values;
      else try { saveSetup(`draft:${connectorType}`, { ...readSetup(`draft:${connectorType}`), [`${connectorType}.configuration`]: values }); } catch { /* Browser storage is optional. */ }
    });
    return () => subscription.unsubscribe();
  }, [watch, editContext, connectorType]);
  const fields = connectorFields[connectorType] ?? [];

  if (['tata', 'exotel', 'knowlarity', 'mcube', 'ozonetel', 'myoperator', 'ivr-custom'].includes(connectorType)) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-lg border border-border">
          <ConnectorIcon type={connectorType} size={40} />
          <div>
            <p className="text-[14px] font-semibold text-foreground">{getConnectorLabel(connectorType)} Configuration</p>
            <p className="text-[11px] text-muted-foreground">Fill in the required credentials and settings below</p>
          </div>
        </div>
        <TATADynamicSetup key={connectorType} connectorType={connectorType} onSubmit={onSubmit} integrationName={integrationName} onNameChange={onNameChange} onOutboundTestCallSuccess={onOutboundTestCallSuccess} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-lg border border-border">
        <ConnectorIcon type={connectorType} size={40} />
        <div>
          <p className="text-[14px] font-semibold text-foreground">{getConnectorLabel(connectorType)} Configuration</p>
          <p className="text-[11px] text-muted-foreground">Fill in the required credentials and settings below</p>
        </div>
      </div>

      {/* Architecture panel */}
      <ArchitecturePanel connectorType={connectorType} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Integration Name */}
        <div>
          <label className="block text-[12px] font-semibold text-foreground mb-1">
            Integration Name <span className="text-danger">*</span>
          </label>
          <p className="text-[11px] text-muted-foreground mb-1.5">A descriptive name to identify this integration in the center</p>
          <input
            type="text"
            value={integrationName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={`e.g. ${getConnectorLabel(connectorType)} - Main Campaign`}
            className="w-full h-9 px-3 text-[13px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <hr className="flex-1 border-border" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{getConnectorLabel(connectorType)} Settings</span>
          <hr className="flex-1 border-border" />
        </div>

        {fields.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-[13px] bg-muted/30 rounded-lg border border-dashed border-border">
            No additional configuration required for this connector.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={`field-${connectorType}-${field.name}`} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {field.label}
                {field.required && <span className="text-danger ml-0.5">*</span>}
              </label>
              {field.helper && (
                <div className="flex items-start gap-1.5 mb-1.5">
                  <Info size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground">{field.helper}</p>
                </div>
              )}

              {field.type === 'select' ? (
                <select
                  {...register(field.name, { required: field.required ? `${field.label} is required` : false })}
                  className="w-full h-9 px-3 text-[13px] bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={`opt-${field.name}-${opt.value}`} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  {...register(field.name, { required: field.required ? `${field.label} is required` : false })}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 text-[12px] font-mono bg-card rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              ) : (
                <input
                  type={field.type}
                  {...register(field.name, { required: field.required ? `${field.label} is required` : false })}
                  placeholder={field.placeholder}
                  className={`w-full h-9 px-3 text-[13px] bg-card rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors[field.name] ? 'border-danger bg-danger-bg' : 'border-border'}`}
                />
              )}

              {errors[field.name] && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle size={11} className="text-danger flex-shrink-0" />
                  <p className="text-[11px] text-danger">{errors[field.name]?.message as string}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <input type="submit" className="hidden" id="config-form-submit" />
      </form>
    </div>
  );
}
