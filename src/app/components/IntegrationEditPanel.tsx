'use client';
import React, { useMemo, useState } from 'react';
import OverlayPortal from '@/components/ui/OverlayPortal';
import { X } from 'lucide-react';
import type { Integration } from './IntegrationTable';
import { getConnectorLabel } from '@/components/ui/ConnectorIcon';
import {
  SetupEditContext,
  readSetup,
  saveSetup,
  appendIntegrationLog,
} from './integrationSetupStore';
import GoogleAdsIntegrationFlow from '../integration-setup-wizard/components/GoogleAdsIntegrationFlow';
import GoogleFormsIntegrationFlow from '../integration-setup-wizard/components/GoogleFormsIntegrationFlow';
import JustDialIntegrationFlow from '../integration-setup-wizard/components/JustDialIntegrationFlow';
import LinkedInIntegrationFlow from '../integration-setup-wizard/components/LinkedInIntegrationFlow';
import FacebookIntegrationFlow from '../integration-setup-wizard/components/FacebookIntegrationFlow';
import DynamicConfigForm from '../integration-setup-wizard/components/DynamicConfigForm';
import ERPWizardContent from '../erp-integration-wizard/components/ERPWizardContent';
import ERPDataPull from '../erp-data-pull/ERPDataPull';
import FieldMappingStep from '../integration-setup-wizard/components/FieldMappingStep';
export default function IntegrationEditPanel({
  integration,
  onClose,
  onSave,
}: {
  integration: Integration;
  onClose: () => void;
  onSave: (value: Integration) => void;
}) {
  const [saved] = useState(() => readSetup(integration.id));
  const edit = useMemo(
    () => ({ values: structuredClone(saved ?? {}), name: integration.name }),
    [saved, integration.name]
  );
  const [name, setName] = useState(integration.name);
  const [error, setError] = useState('');
  const content =
    integration.type === 'google-ads' ? (
      <GoogleAdsIntegrationFlow />
    ) : integration.type === 'google-forms' ? (
      <GoogleFormsIntegrationFlow />
    ) : integration.type === 'justdial' ? (
      <JustDialIntegrationFlow />
    ) : integration.type === 'linkedin' ? (
      <LinkedInIntegrationFlow />
    ) : integration.type === 'facebook' ? (
      <FacebookIntegrationFlow />
    ) : integration.type === 'erp-crm' ||
      integration.type === 'erp-two-way' ||
      integration.type === 'pull-from-crm' ? (
      <ERPWizardContent />
    ) : integration.type === 'pull-from-erp' ? (
      <ERPDataPull />
    ) : integration.type === 'api' ? (
      <FieldMappingStep connectorType="api" />
    ) : (
      <DynamicConfigForm
        connectorType={integration.type}
        integrationName={name}
        onNameChange={setName}
        onSubmit={(data) => {
          edit.values.configuration = data;
          setError('Configuration updated. Save Changes to keep it.');
        }}
      />
    );
  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-edit-title"
      >
        <button
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-label="Close edit panel"
          onClick={onClose}
        />
        <aside className="absolute inset-y-0 right-0 flex w-full max-w-[1200px] flex-col border-l border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 id="integration-edit-title" className="font-semibold">
                Edit {getConnectorLabel(integration.type)} Integration
              </h2>
              <p className="text-xs text-muted-foreground">
                {integration.name} ? {integration.id}
              </p>
            </div>
            <button aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 overflow-auto p-5">
            {!saved && (
              <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                This older integration has no saved setup snapshot. The provider setup below
                contains defaults; configure and save it to enable exact reopening.
              </p>
            )}
            <SetupEditContext.Provider value={edit}>
              <div
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement;
                  const button = target.closest('button');
                  if (
                    target.closest('a') ||
                    (button &&
                      /^(activate|deactivate|publish) integration/i.test(
                        button.textContent?.trim() ?? ''
                      ))
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    setError('Use Save Changes below to update this integration.');
                  }
                }}
              >
                {content}
              </div>
            </SetupEditContext.Provider>
          </div>
          <footer className="flex items-center justify-end gap-3 border-t border-border p-4">
            {error && (
              <p role="status" className="mr-auto text-xs text-red-600">
                {error}
              </p>
            )}
            <button className="rounded border border-border px-4 py-2 text-xs" onClick={onClose}>
              Cancel
            </button>
            <button
              className="rounded bg-primary px-4 py-2 text-xs text-white"
              onClick={() => {
                try {
                  saveSetup(integration.id, edit.values);
                  appendIntegrationLog(
                    integration.id,
                    'Configuration saved',
                    'Saved setup changes for ' + getConnectorLabel(integration.type),
                    'success'
                  );
                  const storedName = Object.entries(edit.values).find(([key]) =>
                    key.endsWith('.integrationName')
                  )?.[1];
                  onSave({
                    ...integration,
                    name: typeof storedName === 'string' && storedName.trim() ? storedName : name,
                  });
                } catch {
                  setError('Unable to save setup. Browser storage is unavailable.');
                }
              }}
            >
              Save Changes
            </button>
          </footer>
        </aside>
      </div>
    </OverlayPortal>
  );
}
