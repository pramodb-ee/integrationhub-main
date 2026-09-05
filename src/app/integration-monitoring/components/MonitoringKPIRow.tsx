import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, AlertTriangle, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface MonitoringKPIRowProps {
  stats: {
    totalEvents: number;
    successRate: number;
    failedCount: number;
    avgLatency: number;
    activeIntegrations: number;
    p99Latency: number;
  };
}

export default function MonitoringKPIRow({ stats }: MonitoringKPIRowProps) {
  const cards = [
    {
      id: 'mkpi-events',
      label: 'Total Events (24h)',
      value: stats.totalEvents.toLocaleString(),
      change: '+8.3% vs yesterday',
      positive: true,
      icon: Zap,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      id: 'mkpi-success',
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      change: '-1.2% vs yesterday',
      positive: false,
      icon: TrendingUp,
      iconBg: '#F0FDF4',
      iconColor: '#16A34A',
    },
    {
      id: 'mkpi-failed',
      label: 'Failed Events',
      value: stats.failedCount,
      change: '+14 vs yesterday',
      positive: false,
      icon: AlertTriangle,
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      alert: true,
    },
    {
      id: 'mkpi-latency',
      label: 'Avg Latency',
      value: `${stats.avgLatency}ms`,
      change: '-18ms improved',
      positive: true,
      icon: Clock,
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      id: 'mkpi-active',
      label: 'Active Integrations',
      value: stats.activeIntegrations,
      icon: Activity,
      iconBg: '#FAF5FF',
      iconColor: '#7C3AED',
    },
    {
      id: 'mkpi-p99',
      label: 'P99 Latency',
      value: `${stats.p99Latency}ms`,
      change: 'SLA: < 2,000ms',
      positive: stats.p99Latency < 2000,
      icon: Clock,
      iconBg: '#F0F9FF',
      iconColor: '#0284C7',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className={`card-base p-4 transition-shadow hover:shadow-card-hover ${card.alert ? 'border-danger/40 bg-danger-bg/20' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <p className={`text-[10px] font-semibold tracking-wide uppercase ${card.alert ? 'text-danger' : 'text-muted-foreground'}`}>
                {card.label}
              </p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.iconBg }}>
                <Icon size={14} style={{ color: card.iconColor }} />
              </div>
            </div>
            <p className={`text-[26px] font-bold font-tabular leading-none mb-1 ${card.alert ? 'text-danger' : 'text-foreground'}`}>
              {card.value}
            </p>
            {card.change && (
              <div className={`flex items-center gap-1 text-[10px] font-medium ${card.positive ? 'text-success' : 'text-danger'}`}>
                {card.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {card.change}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}