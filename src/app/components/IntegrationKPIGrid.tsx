'use client';

import React from 'react';
import { Layers, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
}

function KPICard({ label, value, subtitle, icon: Icon, iconBg, iconColor, alert }: KPICardProps) {
  return (
    <div className={`card-base p-5 transition-shadow hover:shadow-card-hover ${alert ? 'border-danger/40 bg-danger-bg/30' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-[11px] font-semibold tracking-wide uppercase ${alert ? 'text-danger' : 'text-muted-foreground'}`}>
          {label}
        </p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <div className={`metric-value mb-1 font-tabular ${alert ? 'text-danger' : 'text-foreground'}`}>
        {value}
      </div>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

interface IntegrationKPIGridProps {
  stats: {
    totalIntegrations: number;
    activeIntegrations: number;
    failedIntegrations: number;
    avgLatency: number;
    eventsToday: number;
    needsAttention: number;
  };
}

export default function IntegrationKPIGrid({ stats }: IntegrationKPIGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KPICard
        label="Total Integrations"
        value={stats.totalIntegrations}
        subtitle="All configured integrations"
        icon={Layers}
        iconBg="#EFF6FF"
        iconColor="#2563EB"
      />
      <KPICard
        label="Active Integrations"
        value={stats.activeIntegrations}
        subtitle="Currently running"
        icon={CheckCircle}
        iconBg="#F0FDF4"
        iconColor="#16A34A"
      />
      <KPICard
        label="Failed Integrations"
        value={stats.failedIntegrations}
        subtitle="Errors / issues"
        icon={XCircle}
        iconBg="#FEF2F2"
        iconColor="#DC2626"
        alert={stats.failedIntegrations > 0}
      />
      <KPICard
        label="Avg. Response Time"
        value={`${stats.avgLatency}ms`}
        subtitle="Average sync latency"
        icon={Clock}
        iconBg="#FFFBEB"
        iconColor="#D97706"
      />
      <KPICard
        label="Events Processed"
        value={stats.eventsToday.toLocaleString()}
        subtitle="Records synced today"
        icon={Zap}
        iconBg="#FAF5FF"
        iconColor="#7C3AED"
      />
    </div>
  );
}