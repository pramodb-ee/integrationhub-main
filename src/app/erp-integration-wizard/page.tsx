import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import ERPWizardContent from './components/ERPWizardContent';

export default function ERPIntegrationWizardPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-500">Loading ERP Setup...</div>}>
        <ERPWizardContent />
      </Suspense>
    </AppLayout>
  );
}
