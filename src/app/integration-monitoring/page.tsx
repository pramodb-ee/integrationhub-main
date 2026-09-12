import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import MonitoringContent from './components/MonitoringContent';

export default function IntegrationMonitoringPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>}>
        <MonitoringContent />
      </Suspense>
    </AppLayout>
  );
}
