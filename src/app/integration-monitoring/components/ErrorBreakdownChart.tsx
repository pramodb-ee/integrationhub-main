'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const errorData = [
  { name: 'Auth Failure', value: 28, color: '#DC2626' },
  { name: 'Timeout', value: 19, color: '#D97706' },
  { name: 'Field Mismatch', value: 12, color: '#7C3AED' },
  { name: 'Rate Limited', value: 8, color: '#0284C7' },
  { name: 'Webhook Error', value: 6, color: '#EA580C' },
  { name: 'Network Error', value: 4, color: '#64748B' },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (active && payload && payload.length) {
    const total = errorData.reduce((s, d) => s + d.value, 0);
    return (
      <div className="bg-card border border-border rounded-lg shadow-dropdown p-3 text-[12px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: payload[0].payload.color }} />
          <span className="font-semibold text-foreground">{payload[0].name}</span>
        </div>
        <p className="text-muted-foreground">
          <span className="font-tabular font-semibold text-foreground">{payload[0].value}</span> events
          ({((payload[0].value / total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function ErrorBreakdownChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = errorData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card-base p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-foreground">Error Distribution</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Failure types in the last 24 hours</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={errorData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                strokeWidth={0}
              >
                {errorData.map((entry, index) => (
                  <Cell
                    key={`cell-err-${entry.name}`}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[20px] font-bold text-foreground font-tabular">{total}</span>
            <span className="text-[9px] text-muted-foreground">errors</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {errorData.map((item, idx) => (
            <div
              key={`err-legend-${item.name}`}
              className={`flex items-center gap-2 transition-opacity ${activeIndex !== null && activeIndex !== idx ? 'opacity-40' : ''}`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-muted-foreground flex-1 truncate">{item.name}</span>
              <span className="text-[11px] font-semibold text-foreground font-tabular">{item.value}</span>
              <span className="text-[10px] text-muted-foreground w-8 text-right font-tabular">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}