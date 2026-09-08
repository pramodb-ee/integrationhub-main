'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const TIME_RANGES = ['Last 1h', 'Last 6h', 'Last 24h', 'Last 7d', 'Last 14d', 'Last 30d'];

const chartData = [
  { name: 'Facebook', events: 3840, color: '#1877F2' },
  { name: 'Google Ads', events: 2910, color: '#EA4335' },
  { name: 'API', events: 2340, color: '#0F172A' },
  { name: 'Zapier', events: 1980, color: '#FF4A00' },
  { name: 'JustDial', events: 1620, color: '#FF6600' },
  { name: 'LinkedIn', events: 1240, color: '#0A66C2' },
  { name: 'G.Forms', events: 980, color: '#7248B9' },
  { name: 'IVR', events: 740, color: '#D97706' },
  { name: 'WordPress', events: 560, color: '#21759B' },
  { name: 'ERP CRM', events: 420, color: '#7C3AED' },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-dropdown p-3 text-[12px]">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">
          <span className="font-tabular font-semibold text-foreground">{payload[0].value.toLocaleString()}</span> events (24h)
        </p>
      </div>
    );
  }
  return null;
};

export default function ConnectorDistributionChart() {
  const [range, setRange] = useState('Last 24h');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card-base p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Events by Connector (24h)</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total events processed per integration type</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen((open) => !open)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md border border-transparent hover:border-primary/20"
          >
            {range}
            <ChevronDown size={12} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-32 bg-card rounded-lg shadow-lg border border-border py-1">
                {TIME_RANGES.map((option) => (
                  <button
                    key={option}
                    onClick={() => { setRange(option); setIsOpen(false); }}
                    className={`flex items-center w-full px-3 py-1.5 text-[12px] hover:bg-muted transition-colors ${
                      option === range ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <Bar dataKey="events" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}