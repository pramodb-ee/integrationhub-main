'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const latencyData = [
  { time: '03:00', p50: 142, p95: 480, p99: 920 },
  { time: '04:00', p50: 138, p95: 460, p99: 880 },
  { time: '05:00', p50: 155, p95: 510, p99: 1040 },
  { time: '06:00', p50: 168, p95: 540, p99: 1120 },
  { time: '07:00', p50: 221, p95: 680, p99: 1380 },
  { time: '08:00', p50: 298, p95: 840, p99: 1840 },
  { time: '09:00', p50: 342, p95: 980, p99: 2140 },
  { time: '10:00', p50: 318, p95: 920, p99: 1980 },
  { time: '11:00', p50: 287, p95: 860, p99: 1740 },
  { time: '12:00', p50: 264, p95: 780, p99: 1560 },
  { time: '13:00', p50: 241, p95: 720, p99: 1420 },
  { time: '14:00', p50: 228, p95: 680, p99: 1340 },
  { time: '15:00', p50: 219, p95: 650, p99: 1280 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-dropdown p-3 text-[12px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <div key={`lat-tip-${p.name}`} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-semibold font-tabular text-foreground">{p.value}ms</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LatencyTrendChart() {
  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Latency Percentiles (Today)</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">P50 / P95 / P99 response times across all connectors</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-success rounded" /><span className="text-muted-foreground">P50</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-warning rounded" /><span className="text-muted-foreground">P95</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-danger rounded" /><span className="text-muted-foreground">P99</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={latencyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={1000} stroke="var(--danger)" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'SLA limit', fontSize: 9, fill: 'var(--danger)', position: 'insideTopRight' }} />
          <Line type="monotone" dataKey="p50" stroke="var(--success)" strokeWidth={2} dot={false} name="P50" />
          <Line type="monotone" dataKey="p95" stroke="var(--warning)" strokeWidth={1.5} dot={false} name="P95" />
          <Line type="monotone" dataKey="p99" stroke="var(--danger)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="P99" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}