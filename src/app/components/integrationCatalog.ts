import type { ConnectorType } from '@/components/ui/ConnectorIcon';

export const CATALOG_CATEGORIES = [
  {
    id: 'lead-sources',
    label: 'Lead Sources',
    description: 'Capture leads from advertising and listing platforms',
    connectors: [
      { type: 'facebook' as ConnectorType,     description: 'Capture leads from Facebook Lead Ads and Pages',            popular: true  },
      { type: 'google-forms' as ConnectorType, description: 'Sync responses from Google Forms to your CRM',               popular: true  },
      { type: 'google-ads' as ConnectorType,   description: 'Pull lead data from Google Ads campaigns',                   popular: true  },
      { type: 'justdial' as ConnectorType,     description: 'Import leads from JustDial business listings',               popular: true  },
      { type: 'linkedin' as ConnectorType,     description: 'Capture leads via LinkedIn Lead Gen Forms',                   popular: true  },


    ],
  },
  {
    id: 'developer-api',
    label: 'Publisher API',
    description: 'Code-level and API-based integrations',
    connectors: [
      { type: 'api' as ConnectorType,          description: 'Generic REST API connector for custom integrations',          popular: true  },
      { type: 'shiksha' as ConnectorType,      description: 'Receive and process leads from Shiksha',                      popular: true  },
      { type: 'collegedunia' as ConnectorType, description: 'Capture student enquiries from CollegeDunia'                                 },
      { type: 'webhook' as ConnectorType,      description: 'Receive real-time events through a secure webhook',           popular: true  },

    ],
  },
  {
    id: 'telephony',
    label: 'Telephony / IVR',
    description: 'Inbound call tracking and IVR lead capture',
    connectors: [
      { type: 'tata' as ConnectorType,         description: 'TATA Tele Business Services voice and IVR integration',             popular: true, badge: 'Vendor' },
      { type: 'exotel' as ConnectorType,       description: 'Exotel cloud telephony, call flows, and recordings',              popular: true, badge: 'Vendor' },
      { type: 'knowlarity' as ConnectorType,   description: 'Knowlarity IVR, call routing, and agent workflows',                         badge: 'Vendor' },
      { type: 'mcube' as ConnectorType,     description: 'Mcube IVR lead capture',                                    badge: 'Vendor' },
      { type: 'ivr-custom' as ConnectorType,   description: 'Custom / internal IVR — bring your own vendor',                          badge: 'Custom' },
    ],
  },
  {
    id: 'erp-crm',
    label: 'ERP CRM',
    description: 'Enterprise resource planning and CRM sync',
    connectors: [
      { type: 'erp-crm' as ConnectorType,      description: 'Bidirectional sync with ERP and CRM platforms'                           },
      { type: 'pull-from-crm' as ConnectorType, description: 'Pull records from your CRM into IntegrationHub'                         },
      { type: 'pull-from-erp' as ConnectorType, description: 'Pull records from your ERP into IntegrationHub'                         },
      { type: 'erp-two-way' as ConnectorType,   description: '2-way sync between your ERP and CRM'                                    },
    ],
  },
];

export const AVAILABLE_CONNECTOR_TYPES = new Set<ConnectorType>(CATALOG_CATEGORIES.flatMap((category) => category.connectors.map((connector) => connector.type)));
