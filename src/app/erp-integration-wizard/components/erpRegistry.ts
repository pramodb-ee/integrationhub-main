'use client';

// ─── ERP Registry ─────────────────────────────────────────────────────────────
// Add any new ERP/IVR/API integration here. The wizard UX stays the same.
// Only provider-specific auth fields and source fields change.

export type ERPId =
  | 'ms-dynamics-365' |'sap-s4hana' |'oracle-netsuite' |'odoo' |'tallyprime' |'zoho-erp' |'salesforce' |'hubspot' |'custom-erp';

export type AuthType = 'auth-key' | 'api-key' | 'username-password' | 'none';
export type Environment = 'production' | 'sandbox';

export interface AuthField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}

export interface ERPDefinition {
  id: ERPId;
  name: string;
  vendor: string;
  category: 'Enterprise' | 'Mid-Market' | 'SMB' | 'CRM' | 'Custom';
  badge: string;
  badgeColor: string;
  iconBg: string;
  iconText: string;
  description: string;
  features: string[];
  supportedAuthTypes: AuthType[];
  authFields: Partial<Record<AuthType, AuthField[]>>;
  sourceFields: string[];
  defaultCurl: string;
}

export const ERP_REGISTRY: ERPDefinition[] = [
  {
    id: 'ms-dynamics-365',
    name: 'Microsoft Dynamics 365',
    vendor: 'Microsoft',
    category: 'Enterprise',
    badge: 'Microsoft',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconText: 'D365',
    description: 'Unified ERP + CRM platform with Azure integration and AI-driven insights',
    features: ['Azure AD', 'Power BI', 'Teams', 'AI Insights'],
    supportedAuthTypes: ['auth-key', 'api-key', 'username-password', 'none'],
    authFields: {
      'auth-key': [
        { key: 'auth_key', label: 'Auth Key', type: 'password', placeholder: 'Enter Auth Key', required: true },
        { key: 'tenant_id', label: 'Tenant ID', type: 'text', placeholder: 'e.g. your-org.crm.dynamics.com', required: true },
      ],
      'api-key': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API Key', required: true },
      ],
      'username-password': [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'user@company.com', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', required: true },
        { key: 'tenant_id', label: 'Tenant ID', type: 'text', placeholder: 'e.g. your-org.crm.dynamics.com', required: false },
      ],
    },
    sourceFields: ['contactid', 'firstname', 'lastname', 'emailaddress1', 'mobilephone', 'telephone1', 'accountid', 'ownerid', 'leadsourcecode', 'statecode', 'createdon', 'modifiedon'],
    defaultCurl: `curl -X GET "https://your-org.crm.dynamics.com/api/data/v9.2/leads" \\\n  -H "Authorization: Bearer {token}" \\\n  -H "Content-Type: application/json" \\\n  -H "OData-MaxVersion: 4.0" \\\n  -H "OData-Version: 4.0"`,
  },
  {
    id: 'sap-s4hana',
    name: 'SAP S/4 HANA',
    vendor: 'SAP',
    category: 'Enterprise',
    badge: 'Enterprise',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100',
    iconText: 'SAP',
    description: 'Enterprise-grade ERP with real-time analytics and intelligent automation',
    features: ['Real-time analytics', 'Multi-currency', 'Compliance', 'Global ops'],
    supportedAuthTypes: ['auth-key', 'api-key', 'username-password', 'none'],
    authFields: {
      'auth-key': [
        { key: 'auth_key', label: 'Auth Key', type: 'password', placeholder: 'Enter SAP Auth Key', required: true },
      ],
      'api-key': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter SAP API Key', required: true },
      ],
      'username-password': [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'SAP username', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'SAP password', required: true },
      ],
    },
    sourceFields: ['BusinessPartner', 'FirstName', 'LastName', 'EmailAddress', 'PhoneNumber', 'CompanyCode', 'SalesOrg', 'CustomerGroup', 'Country', 'Region', 'PostalCode', 'CreatedAt'],
    defaultCurl: `curl -X GET "https://your-sap-instance.s4hana.ondemand.com/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner" \\\n  -H "Authorization: Basic {base64credentials}" \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: application/json"`,
  },
  {
    id: 'oracle-netsuite',
    name: 'Oracle NetSuite',
    vendor: 'Oracle',
    category: 'Enterprise',
    badge: 'Cloud',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    iconBg: 'bg-red-100',
    iconText: 'NS',
    description: 'Cloud-based ERP suite for financials, CRM, and e-commerce',
    features: ['Cloud-native', 'Financials', 'CRM built-in', 'E-commerce'],
    supportedAuthTypes: ['auth-key', 'api-key', 'username-password', 'none'],
    authFields: {
      'auth-key': [
        { key: 'auth_key', label: 'Auth Key', type: 'password', placeholder: 'Enter NetSuite Auth Key', required: true },
        { key: 'account_id', label: 'Account ID', type: 'text', placeholder: 'e.g. 1234567', required: true },
      ],
      'api-key': [
        { key: 'consumer_key', label: 'Consumer Key', type: 'password', placeholder: 'Enter Consumer Key', required: true },
        { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', placeholder: 'Enter Consumer Secret', required: true },
        { key: 'token_id', label: 'Token ID', type: 'text', placeholder: 'Enter Token ID', required: true },
        { key: 'token_secret', label: 'Token Secret', type: 'password', placeholder: 'Enter Token Secret', required: true },
      ],
      'username-password': [
        { key: 'username', label: 'Email', type: 'text', placeholder: 'user@company.com', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', required: true },
        { key: 'account_id', label: 'Account ID', type: 'text', placeholder: 'e.g. 1234567', required: true },
      ],
    },
    sourceFields: ['entityId', 'firstName', 'lastName', 'email', 'phone', 'company', 'subsidiary', 'salesRep', 'leadSource', 'status', 'dateCreated'],
    defaultCurl: `curl -X GET "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer" \\\n  -H "Authorization: NLAuth nlauth_account={account_id},nlauth_email={email},nlauth_signature={password}" \\\n  -H "Content-Type: application/json"`,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    vendor: 'Salesforce',
    category: 'CRM',
    badge: 'CRM',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-100',
    iconText: 'SF',
    description: 'World\'s #1 CRM platform with AI-powered sales and service automation',
    features: ['Einstein AI', 'AppExchange', 'Flow Builder', 'Reports'],
    supportedAuthTypes: ['auth-key', 'api-key', 'username-password', 'none'],
    authFields: {
      'auth-key': [
        { key: 'auth_key', label: 'Auth Key / Bearer Token', type: 'password', placeholder: 'Enter Salesforce Bearer Token', required: true },
        { key: 'instance_url', label: 'Instance URL', type: 'url', placeholder: 'https://your-org.salesforce.com', required: true },
      ],
      'api-key': [
        { key: 'api_key', label: 'Connected App Consumer Key', type: 'password', placeholder: 'Enter Consumer Key', required: true },
        { key: 'api_secret', label: 'Consumer Secret', type: 'password', placeholder: 'Enter Consumer Secret', required: true },
      ],
      'username-password': [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'user@company.com', required: true },
        { key: 'password', label: 'Password + Security Token', type: 'password', placeholder: 'passwordSecurityToken', required: true },
      ],
    },
    sourceFields: ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'MobilePhone', 'AccountId', 'OwnerId', 'LeadSource', 'Status', 'CreatedDate', 'Company'],
    defaultCurl: `curl -X GET "https://your-org.salesforce.com/services/data/v58.0/sobjects/Lead" \\\n  -H "Authorization: Bearer {access_token}" \\\n  -H "Content-Type: application/json"`,
  },
  {
    id: 'odoo',
    name: 'Odoo',
    vendor: 'Odoo',
    category: 'Mid-Market',
    badge: 'Open Source',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-100',
    iconText: 'OD',
    description: 'Open-source modular ERP with 30+ integrated business apps',
    features: ['Modular', 'Open source', 'Community', 'Affordable'],
    supportedAuthTypes: ['api-key', 'username-password', 'none'],
    authFields: {
      'api-key': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter Odoo API Key', required: true },
        { key: 'db_name', label: 'Database Name', type: 'text', placeholder: 'your-database', required: true },
      ],
      'username-password': [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'admin', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', required: true },
        { key: 'db_name', label: 'Database Name', type: 'text', placeholder: 'your-database', required: true },
      ],
    },
    sourceFields: ['id', 'name', 'email', 'phone', 'mobile', 'partner_name', 'user_id', 'team_id', 'source_id', 'medium_id', 'campaign_id', 'create_date'],
    defaultCurl: `curl -X POST "https://your-company.odoo.com/web/dataset/call_kw" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","method":"call","params":{"model":"crm.lead","method":"search_read","args":[[]],"kwargs":{"fields":["name","email","phone"],"limit":10}}}'`,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    vendor: 'HubSpot',
    category: 'CRM',
    badge: 'CRM',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    iconBg: 'bg-orange-100',
    iconText: 'HS',
    description: 'All-in-one CRM platform for marketing, sales, and customer service',
    features: ['Marketing Hub', 'Sales Hub', 'Service Hub', 'CMS'],
    supportedAuthTypes: ['api-key', 'auth-key', 'none'],
    authFields: {
      'api-key': [
        { key: 'api_key', label: 'Private App Token', type: 'password', placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      ],
      'auth-key': [
        { key: 'auth_key', label: 'Auth Key / Bearer Token', type: 'password', placeholder: 'Enter HubSpot Bearer Token', required: true },
      ],
    },
    sourceFields: ['id', 'firstname', 'lastname', 'email', 'phone', 'mobilephone', 'company', 'jobtitle', 'hs_lead_status', 'lifecyclestage', 'createdate', 'hs_analytics_source'],
    defaultCurl: `curl -X GET "https://api.hubapi.com/crm/v3/objects/contacts" \\\n  -H "Authorization: Bearer {private_app_token}" \\\n  -H "Content-Type: application/json"`,
  },
  {
    id: 'tallyprime',
    name: 'TallyPrime',
    vendor: 'Tally Solutions',
    category: 'SMB',
    badge: 'India',
    badgeColor: 'bg-green-50 text-green-700 border-green-200',
    iconBg: 'bg-green-100',
    iconText: 'TP',
    description: 'India-focused accounting and ERP solution for SMBs with GST compliance',
    features: ['GST compliance', 'Payroll', 'Inventory', 'Banking'],
    supportedAuthTypes: ['username-password', 'none'],
    authFields: {
      'username-password': [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'Tally username', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'Tally password', required: true },
      ],
    },
    sourceFields: ['LedgerName', 'Email', 'Phone', 'Address', 'City', 'State', 'PinCode', 'GSTNumber', 'OpeningBalance', 'Date'],
    defaultCurl: `curl -X POST "http://localhost:9000" \\\n  -H "Content-Type: text/xml" \\\n  -d '<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Ledger</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>'`,
  },
  {
    id: 'zoho-erp',
    name: 'Zoho ERP',
    vendor: 'Zoho',
    category: 'Mid-Market',
    badge: 'Suite',
    badgeColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    iconBg: 'bg-yellow-100',
    iconText: 'ZO',
    description: 'Integrated suite of Zoho apps for complete business management',
    features: ['CRM integration', 'Finance', 'HR management', 'Analytics'],
    supportedAuthTypes: ['auth-key', 'api-key', 'none'],
    authFields: {
      'auth-key': [
        { key: 'auth_key', label: 'Auth Token', type: 'password', placeholder: 'Enter Zoho Auth Token', required: true },
        { key: 'org_id', label: 'Organization ID', type: 'text', placeholder: 'Enter Org ID', required: true },
      ],
      'api-key': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter Zoho API Key', required: true },
      ],
    },
    sourceFields: ['Contact_Id', 'First_Name', 'Last_Name', 'Email', 'Phone', 'Mobile', 'Account_Name', 'Lead_Source', 'Lead_Status', 'Owner', 'Created_Time'],
    defaultCurl: `curl -X GET "https://www.zohoapis.com/crm/v3/Leads" \\\n  -H "Authorization: Zoho-oauthtoken {access_token}" \\\n  -H "Content-Type: application/json"`,
  },
  {
    id: 'custom-erp',
    name: 'Custom / REST API',
    vendor: 'Custom',
    category: 'Custom',
    badge: 'Custom',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    iconBg: 'bg-gray-100',
    iconText: 'API',
    description: 'Connect any proprietary or custom-built system via REST API or CURL',
    features: ['REST API', 'Custom fields', 'Flexible auth', 'Webhook support'],
    supportedAuthTypes: ['auth-key', 'api-key', 'username-password', 'none'],
    authFields: {
      'auth-key': [
        { key: 'auth_key', label: 'Auth Key / Bearer Token', type: 'password', placeholder: 'Enter Auth Key or Bearer Token', required: true },
      ],
      'api-key': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API Key', required: true },
        { key: 'api_secret', label: 'API Secret (optional)', type: 'password', placeholder: 'Enter API Secret if required', required: false },
      ],
      'username-password': [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'Enter username or email', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', required: true },
      ],
    },
    sourceFields: ['id', 'name', 'email', 'phone', 'company', 'source', 'status', 'owner', 'created_at', 'custom_field_1', 'custom_field_2'],
    defaultCurl: `curl -X GET "https://your-api.example.com/api/v1/leads" \\\n  -H "Authorization: Bearer {token}" \\\n  -H "Content-Type: application/json"`,
  },
];

export const ERP_MAP = Object.fromEntries(ERP_REGISTRY.map((e) => [e.id, e])) as Record<ERPId, ERPDefinition>;

export const CATEGORY_ORDER: ERPDefinition['category'][] = ['Enterprise', 'CRM', 'Mid-Market', 'SMB', 'Custom'];

export type CRMFieldType = 'String' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 'Email' | 'Mobile' | 'Picklist' | 'Multi-select';

export interface CRMFieldDefinition {
  key: string;
  label: string;
  type: CRMFieldType;
  options?: string[];
}

export const CRM_DESTINATION_FIELDS: CRMFieldDefinition[] = [
  { key: 'lead_name', label: 'Lead Name', type: 'String' },
  { key: 'lead_first_name', label: 'Lead.FirstName', type: 'String' },
  { key: 'email', label: 'Email', type: 'String' },
  { key: 'mobile', label: 'Mobile Number', type: 'String' },
  { key: 'lead_mobile', label: 'Lead.Mobile', type: 'String' },
  { key: 'phone', label: 'Phone', type: 'String' },
  { key: 'company_name', label: 'Company Name', type: 'String' },
  { key: 'city', label: 'City', type: 'String' },
  { key: 'state', label: 'State', type: 'String' },
  { key: 'pincode', label: 'Pincode', type: 'String' },
  { key: 'source', label: 'Lead Source', type: 'String' },
  { key: 'campaign_name', label: 'Campaign Name', type: 'String' },
  { key: 'lead_score', label: 'Lead Score', type: 'Number' },
  { key: 'lead_amount', label: 'Lead.Amount', type: 'Number' },
  { key: 'is_verified', label: 'Is Verified', type: 'Boolean' },
  { key: 'lead_is_verified', label: 'Lead.IsVerified', type: 'Boolean' },
  { key: 'assigned_to', label: 'Assigned To', type: 'String' },
  { key: 'status', label: 'Lead Status', type: 'String' },
  { key: 'dob', label: 'Lead.DOB', type: 'Date' },
  { key: 'admission_date', label: 'Lead.AdmissionDate', type: 'Date' },
  { key: 'registration_date', label: 'Lead.RegistrationDate', type: 'Date' },
  { key: 'follow_up_date', label: 'Lead.FollowUpDate', type: 'Date' },
  { key: 'created_at', label: 'Created At', type: 'DateTime' },
  { key: 'lead_created_date', label: 'Lead.CreatedDate', type: 'DateTime' },
  { key: 'notes', label: 'Notes', type: 'String' },
  { key: 'custom_1', label: 'Custom Field 1', type: 'String' },
  { key: 'custom_2', label: 'Custom Field 2', type: 'String' },
];

export const FIELD_TYPE_FORMATS: Record<string, string[]> = {
  Date: ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyyMMdd'],
  DateTime: ['yyyy-MM-dd HH:mm:ss', 'yyyy-MM-ddTHH:mm:ssZ', 'dd/MM/yyyy HH:mm:ss', 'MM/dd/yyyy hh:mm a', 'ISO 8601'],
  String: ['Uppercase', 'Lowercase', 'Title Case', 'Trim Whitespace', 'None'],
  Number: ['Integer', 'Decimal (2 places)', 'Decimal (4 places)', 'Currency', 'Percentage', 'None'],
  Boolean: ['true/false', '1/0', 'yes/no', 'Y/N', 'True/False'],
};
