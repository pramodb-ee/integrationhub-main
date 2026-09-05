import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import SetupWizardContent from './components/SetupWizardContent';

export default function IntegrationSetupWizardPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>}>
        <SetupWizardContent />
      </Suspense>
    </AppLayout>
  );
}