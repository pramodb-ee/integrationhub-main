'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const healthData = [
  { date: 'Aug 19', successful: 1820, failed: 42, warnings: 18 },
  { date: 'Aug 20', successful: 2140, failed: 28, warnings: 31 },
  { date: 'Aug 21', successful: 1960, failed: 67, warnings: 24 },
  { date: 'Aug 22', successful: 2380, failed: 19, warnings: 12 },
  { date: 'Aug 23', successful: 980, failed: 142, warnings: 88 },
  { date: 'Aug 24', successful: 2210, failed: 34, warnings: 19 },
  { date: 'Aug 25', successful: 2450, failed: 22, warnings: 14 },
  { date: 'Aug 26', successful: 2680, failed: 15, warnings: 8 },
  { date: 'Aug 27', successful: 2190, failed: 56, warnings: 41 },
  { date: 'Aug 28', successful: 2890, failed: 11, warnings: 6 },
  { date: 'Aug 29', successful: 2740, failed: 23, warnings: 17 },
  { date: 'Aug 30', successful: 3010, failed: 9, warnings: 4 },
  { date: 'Aug 31', successful: 2640, failed: 38, warnings: 22 },
  { date: 'Sep 1', successful: 1842, failed: 67, warnings: 31 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, p) => sum + p.value, 0);
    const successRate = total > 0 ? ((payload[0]?.value ?? 0) / total * 100).toFixed(1) : '0';
    return (
      <div className="bg-card border border-border rounded-lg shadow-dropdown p-3 text-[12px] min-w-[160px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <div key={`tip-${p.name}`} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground capitalize">{p.name}</span>
            </div>
            <span className="font-semibold font-tabular text-foreground">{p.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
          <span className="text-muted-foreground">Success Rate</span>
          <span className="font-semibold text-success">{successRate}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function HealthTimelineChart() {
  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Sync Health Timeline</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">14-day event outcome breakdown across all integrations</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-success" />
            <span className="text-muted-foreground">Successful</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">Warnings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-danger" />
            <span className="text-muted-foreground">Failed</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={healthData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="successful" stroke="var(--success)" strokeWidth={2} fill="url(#colorSuccess)" name="successful" />
          <Area type="monotone" dataKey="warnings" stroke="var(--warning)" strokeWidth={1.5} fill="url(#colorWarning)" name="warnings" />
          <Area type="monotone" dataKey="failed" stroke="var(--danger)" strokeWidth={1.5} fill="url(#colorFailed)" name="failed" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}