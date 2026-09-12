import React from 'react';

export type ConnectorType =
  | 'facebook' | 'google-forms' | 'google-ads' | 'justdial' | 'linkedin' | 'wordpress'

  | 'api'| 'js' | 'php'  |'ivr'| 'tata' | 'exotel' | 'knowlarity' | 'twilio' | 'mcube' | 'ozonetel' | 'myoperator' | 'cloudtalk' | 'ringcentral' | 'ivr-custom' |'erp-crm'
  | 'pull-from-crm' | 'pull-from-erp' | 'erp-two-way'
  | 'zapier';

interface ConnectorIconProps {
  type: ConnectorType;
  size?: number;
}

const connectorConfig: Record<ConnectorType, { label: string; bg: string; text: string; abbr: string }> = {
  // Lead Sources
  'facebook':      { label: 'Facebook',        bg: '#1877F2', text: '#FFFFFF', abbr: 'fb'  },
  'google-forms':  { label: 'Google Forms',     bg: '#7248B9', text: '#FFFFFF', abbr: 'GF'  },
  'google-ads':    { label: 'Google Ads',       bg: '#EA4335', text: '#FFFFFF', abbr: 'GA'  },
  'justdial':      { label: 'JustDial',         bg: '#FF6600', text: '#FFFFFF', abbr: 'JD'  },
  'linkedin':      { label: 'LinkedIn',         bg: '#0A66C2', text: '#FFFFFF', abbr: 'in'  },
  'wordpress':     { label: 'WordPress',        bg: '#21759B', text: '#FFFFFF', abbr: 'WP'  },


  // Developer / API
  'api':           { label: 'API',              bg: '#0F172A', text: '#38BDF8', abbr: 'API' },
  'js':            { label: 'JavaScript',       bg: '#F7DF1E', text: '#0F172A', abbr: 'JS'  },
  'php':           { label: 'PHP',              bg: '#777BB4', text: '#FFFFFF', abbr: 'PHP' },

  // Telephony — generic IVR
  'ivr':           { label: 'IVR',              bg: '#D97706', text: '#FFFFFF', abbr: 'IVR' },
  'tata':          { label: 'TATA',             bg: '#1D4ED8', text: '#FFFFFF', abbr: 'TATA' },
  'exotel':        { label: 'Exotel',           bg: '#0F766E', text: '#FFFFFF', abbr: 'EX'  },
  'knowlarity':    { label: 'Knowlarity',       bg: '#7C3AED', text: '#FFFFFF', abbr: 'KN'  },
  // Telephony — named vendors
  'twilio':        { label: 'Twilio',           bg: '#F22F46', text: '#FFFFFF', abbr: 'TW'  },
  'mcube': { label: 'Mcube', bg: '#2563EB', text: '#FFFFFF', abbr: 'MC' },
  'ozonetel':      { label: 'Ozonetel',         bg: '#0066CC', text: '#FFFFFF', abbr: 'OZ'  },
  'myoperator':    { label: 'MyOperator',       bg: '#FF5722', text: '#FFFFFF', abbr: 'MO'  },
  'cloudtalk':     { label: 'CloudTalk',        bg: '#00B4D8', text: '#FFFFFF', abbr: 'CT'  },
  'ringcentral':   { label: 'RingCentral',      bg: '#0073AE', text: '#FFFFFF', abbr: 'RC'  },
  'ivr-custom':    { label: 'Custom IVR',       bg: '#6B7280', text: '#FFFFFF', abbr: 'IVR' },
  // ERP / CRM
  'erp-crm':       { label: 'ERP CRM',          bg: '#7C3AED', text: '#FFFFFF', abbr: 'ERP' },
  'pull-from-crm': { label: 'Pull from CRM',    bg: '#8B5CF6', text: '#FFFFFF', abbr: 'PC'  },
  'pull-from-erp': { label: 'Pull from ERP',    bg: '#6D28D9', text: '#FFFFFF', abbr: 'PE'  },
  'erp-two-way':   { label: '2 Way ERP Integration', bg: '#5B21B6', text: '#FFFFFF', abbr: '2W' },
  // Automation
  'zapier':        { label: 'Zapier',           bg: '#FF4A00', text: '#FFFFFF', abbr: 'ZAP' },
};

export function getConnectorLabel(type: ConnectorType): string {
  return connectorConfig[type]?.label ?? type;
}

export default function ConnectorIcon({ type, size = 32 }: ConnectorIconProps) {
  const config = connectorConfig[type];
  if (!config) return null;

  const fontSize = size <= 24 ? 8 : size <= 32 ? 9 : 11;
  const borderRadius = size <= 24 ? 4 : 6;

  return (
    <span
      className="inline-flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: config.bg,
        color: config.text,
        fontSize,
        letterSpacing: '-0.02em',
      }}
      title={config.label}
    >
      {config.abbr}
    </span>
  );
}