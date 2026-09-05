import React from 'react';

type StatusType =
  | 'draft' |'setup-pending' |'test-pending' |'mapping-pending' |'ready' |'active' |'healthy' |'needs-attention' |'failed' |'paused';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { label: string; className: string; dot?: string }> = {
  'draft': { label: 'Draft', className: 'badge-draft', dot: 'bg-slate-400' },
  'setup-pending': { label: 'Setup Pending', className: 'badge-setup-pending', dot: 'bg-info' },
  'test-pending': { label: 'Test Pending', className: 'badge-test-pending', dot: 'bg-orange-500' },
  'mapping-pending': { label: 'Mapping Pending', className: 'badge-mapping-pending', dot: 'bg-accent' },
  'ready': { label: 'Ready to Publish', className: 'badge-ready', dot: 'bg-primary' },
  'active': { label: 'Active', className: 'badge-active', dot: 'bg-success' },
  'healthy': { label: 'Healthy', className: 'badge-healthy', dot: 'bg-success' },
  'needs-attention': { label: 'Needs Attention', className: 'badge-needs-attention', dot: 'bg-warning' },
  'failed': { label: 'Failed', className: 'badge-failed', dot: 'bg-danger' },
  'paused': { label: 'Paused', className: 'badge-paused', dot: 'bg-slate-400' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
}