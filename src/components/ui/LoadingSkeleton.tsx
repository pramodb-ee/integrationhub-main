import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-muted rounded-md ${className}`} />;
}

export function TableSkeleton({ rows = 8, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={`skel-row-${i + 1}`}
          className="flex items-center gap-4 px-4 py-3 border-b border-border"
        >
          <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton
              key={`skel-cell-${i + 1}-${j + 1}`}
              className="h-4 flex-1"
              style={{ maxWidth: j === 0 ? '180px' : j === cols - 1 ? '80px' : undefined } as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <div className="card-base p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}