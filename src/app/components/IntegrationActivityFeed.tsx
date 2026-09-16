import React from 'react';
import ConnectorIcon, { ConnectorType } from '@/components/ui/ConnectorIcon';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Plus, Pause } from 'lucide-react';
import type { Integration } from './IntegrationTable';


interface ActivityItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'created' | 'paused';
  integration: string;
  connector: ConnectorType;
  message: string;
  time: string;
}

const activities: ActivityItem[] = [
  { id: 'act-001', type: 'error', integration: 'Facebook Lead Gen - Main', connector: 'facebook', message: 'Webhook delivery failed — 3 retries exhausted. Check Page access token.', time: '4 min ago' },
  { id: 'act-002', type: 'success', integration: 'Google Ads - Brand Campaign', connector: 'google-ads', message: 'Sync completed successfully. 142 new leads imported.', time: '12 min ago' },
  { id: 'act-003', type: 'warning', integration: 'IVR Lead Capture - Tier1', connector: 'ivr', message: 'Latency spike detected — avg 1,840ms over last 15 minutes.', time: '28 min ago' },
  { id: 'act-004', type: 'created', integration: 'Zapier - HubSpot Bridge', connector: 'zapier', message: 'New integration created and published by Meera Nair.', time: '1 hr ago' },
  { id: 'act-005', type: 'success', integration: 'JustDial - Premium Leads', connector: 'justdial', message: '89 leads synced. Field mapping validated successfully.', time: '1 hr ago' },
  { id: 'act-006', type: 'info', integration: 'WordPress CF7 - Contact', connector: 'wordpress', message: 'Field mapping updated — 2 new destination fields added.', time: '2 hr ago' },
  { id: 'act-007', type: 'paused', integration: 'LinkedIn Ads - APAC', connector: 'linkedin', message: 'Integration paused by Arjun Sharma for maintenance window.', time: '3 hr ago' },
  { id: 'act-008', type: 'success', integration: 'ERP CRM - Salesforce Sync', connector: 'erp-crm', message: 'Bidirectional sync completed. 0 conflicts detected.', time: '4 hr ago' },
];

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-bg' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-bg' },
  error: { icon: XCircle, color: 'text-danger', bg: 'bg-danger-bg' },
  info: { icon: RefreshCw, color: 'text-info', bg: 'bg-info-bg' },
  created: { icon: Plus, color: 'text-primary', bg: 'bg-primary/10' },
  paused: { icon: Pause, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function IntegrationActivityFeed({ integrations }: { integrations: Integration[] }) {
  const visibleActivities = activities.filter((activity) =>
    integrations.some(
      (integration) =>
        integration.name === activity.integration && integration.type === activity.connector
    )
  );

  return (
    <div className="card-base p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Recent Activity</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Live event stream across all integrations</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-success">
          <div className="pulse-dot w-1.5 h-1.5" />
          Live
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '320px' }}>
        {visibleActivities.map((item) => {
          const cfg = typeConfig[item.type];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="flex items-start gap-3 group">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon size={13} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <ConnectorIcon type={item.connector} size={16} />
                  <span className="text-[12px] font-semibold text-foreground truncate">{item.integration}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{item.message}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">{item.time}</span>
            </div>
          );
        })}
        {visibleActivities.length === 0 && (
          <p className="py-8 text-center text-[11px] text-muted-foreground">
            No recent activity for configured integrations.
          </p>
        )}
      </div>
    </div>
  );
}
