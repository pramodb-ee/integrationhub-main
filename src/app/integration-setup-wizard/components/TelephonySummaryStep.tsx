'use client';

import React from 'react';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import { CheckCircle, Phone, Radio, Mic, Webhook } from 'lucide-react';

interface TelephonySummaryStepProps {
  connectorType: ConnectorType;
  integrationName: string;
  config: Record<string, string>;
  testPassed: boolean;
}

export default function TelephonySummaryStep({ connectorType, integrationName, config, testPassed }: TelephonySummaryStepProps) {
  const enabledFeatures = config.features === 'inbound-ivr'
    ? ['Incoming Calls', 'IVR']
    : config.features === 'inbound-recording'
      ? ['Incoming Calls', 'Call Recording']
      : ['Incoming Calls', 'Outgoing Calls', 'IVR', 'Call Recording'];

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1"><CheckCircle size={18} className="text-primary" /><h2 className="text-[16px] font-semibold text-foreground">Review Integration</h2></div>
        <p className="text-[13px] text-muted-foreground">Review the provider, connection status, and enabled telephony capabilities before activation.</p>
      </div>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30 mb-5">
        <ConnectorIcon type={connectorType} size={44} />
        <div className="flex-1"><p className="text-[15px] font-bold text-foreground">{integrationName || getConnectorLabel(connectorType)}</p><p className="text-[11px] text-muted-foreground">Telephony / IVR · {getConnectorLabel(connectorType)}</p></div>
        <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border ${testPassed ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{testPassed ? 'Tested' : 'Test required'}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="p-4 rounded-xl border border-border"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Connection</p><div className="space-y-2">{['apiKey', 'apiToken', 'authToken', 'accountSid', 'sid', 'virtualNumber', 'webhookUrl'].filter((key) => config[key]).slice(0, 4).map((key) => <div key={key} className="flex justify-between gap-3 text-[11px]"><span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span><span className="font-medium text-foreground truncate">{key.toLowerCase().includes('token') || key.toLowerCase().includes('key') ? 'Configured' : config[key]}</span></div>)}</div></div>
        <div className="p-4 rounded-xl border border-border"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">Enabled Features</p><div className="grid grid-cols-2 gap-2">{enabledFeatures.map((feature, index) => { const Icon = [Phone, Radio, Mic, Webhook][index] || Radio; return <span key={feature} className="flex items-center gap-1.5 text-[11px] text-foreground"><Icon size={13} className="text-primary" />{feature}</span>; })}</div></div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-[11px] text-green-700"><CheckCircle size={14} /> Test validation is mandatory and must pass before Save &amp; Activate.</div>
    </div>
  );
}
