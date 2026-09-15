'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import ConnectorIcon, { ConnectorType, getConnectorLabel } from '@/components/ui/ConnectorIcon';
import type { Integration } from '@/app/components/IntegrationTable';
import { addActivatedIntegration } from '@/app/components/activatedIntegrationsStore';
import WizardStepper from './WizardStepper';
import ApiTestRequestStep from './ApiTestRequestStep';
import FieldMappingStep, { ApiMappingState } from './FieldMappingStep';
import ApiPreviewStep from './ApiPreviewStep';
import { CapturedRequest, cappingError, mappedPayload, mappingErrors } from './apiMapping';

export type DeveloperConnector = 'api' | 'shiksha' | 'collegedunia' | 'webhook';
const LABELS = ['Test Request', 'Field Mapping', 'Preview'];

export default function DeveloperIntegrationFlow({
  connectorType,
}: {
  connectorType: DeveloperConnector;
}) {
  const defaultName = `${getConnectorLabel(connectorType as ConnectorType)} Integration`;
  const integrationId = useRef(`${connectorType}-${Date.now()}`);
  const capturedRequests = useRef<CapturedRequest[]>([]);
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [mapping, setMapping] = useState<ApiMappingState>();
  const [previewVerified, setPreviewVerified] = useState(false);
  const [published, setPublished] = useState(false);
  const [integrationName, setIntegrationName] = useState('');
  const [nameError, setNameError] = useState('');

  const checkCapture = (candidate: Record<string, unknown>) =>
    cappingError(mapping?.capping, candidate, capturedRequests.current);
  const recordCapture = (candidate: Record<string, unknown>) => {
    const now = Date.now();
    capturedRequests.current = [
      ...capturedRequests.current.filter((item) => item.timestamp > now - 86400000),
      { timestamp: now, payload: candidate },
    ];
  };
  const updateMapping = useCallback((state: ApiMappingState) => {
    setMapping(state);
    setPreviewVerified(false);
  }, []);
  const mappingValid = Boolean(mapping) && mappingErrors(mapping!, payload).length === 0;

  const saveToCenter = (status: Integration['status']) =>
    addActivatedIntegration({
      id: integrationId.current,
      name: integrationName.trim(),
      type: connectorType as ConnectorType,
      status,
      lastSync: status === 'active' ? 'Just now' : 'Never',
      events24h: 0,
      successRate: status === 'active' ? 100 : 0,
      latencyMs: 0,
      owner: 'Pramod Bhujbal',
      created: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      environment: 'production',
      errorCount: 0,
    });

  const openPreview = () => {
    if (!mappingValid) return;
    saveToCenter('mapping-pending');
    setStep(2);
  };
  const togglePublished = () => {
    const next = !published;
    setPublished(next);
    saveToCenter(next ? 'active' : 'mapping-pending');
  };

  const content =
    step === 0 ? (
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-foreground">
            Integration Name <span className="text-danger">*</span>
          </span>
          <span className="mb-2 block text-[11px] text-muted-foreground">
            A descriptive name to identify this integration in the center
          </span>
          <input
            value={integrationName}
            onChange={(event) => {
              setIntegrationName(event.target.value);
              setNameError('');
            }}
            placeholder={`e.g. ${defaultName}`}
            className={`h-10 w-full rounded-lg border bg-card px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${nameError ? 'border-danger' : 'border-border'}`}
          />
          {nameError && (
            <span role="alert" className="mt-1 block text-[11px] text-danger">
              {nameError}
            </span>
          )}
        </label>
        <ApiTestRequestStep
          connectorType={connectorType}
          integrationName={integrationName.trim()}
          isNewIntegration
          onCaptureRequest={(requestPayload) => {
            const output = mapping ? mappedPayload(requestPayload, mapping) : requestPayload;
            const error = checkCapture(output);
            if (!error) recordCapture(output);
            return error;
          }}
          onFieldMappingCreated={(requestPayload) => {
            if (!integrationName.trim()) {
              setNameError('Integration Name is required.');
              return;
            }
            setPayload(requestPayload);
            setMapping(undefined);
            setPreviewVerified(false);
            setStep(1);
          }}
        />
      </div>
    ) : step === 1 ? (
      <FieldMappingStep
        connectorType={connectorType as ConnectorType}
        requestPayload={payload}
        initialState={mapping}
        onStateChange={updateMapping}
      />
    ) : mapping ? (
      <div className="space-y-5">
        <ApiPreviewStep
          integrationId={integrationId.current}
          integrationName={integrationName}
          payload={payload}
          mapping={mapping}
          onValidationChange={setPreviewVerified}
          checkCapture={checkCapture}
          recordCapture={recordCapture}
        />
        <div
          className={`flex items-center justify-between rounded-xl border p-4 ${published ? 'border-success-border bg-success-bg' : 'border-warning-border bg-warning-bg'}`}
        >
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              {published ? 'Integration Published' : 'Integration Pending'}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Entry is available in Integration Center.{' '}
              {published
                ? 'Incoming requests are active.'
                : 'Verify the preview, then publish when ready.'}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePublished}
            disabled={!published && !previewVerified}
            className={`h-9 rounded-lg px-5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${published ? 'border border-danger bg-card text-danger' : 'bg-primary text-white'}`}
          >
            {published ? 'Unpublish' : 'Publish Integration'}
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ConnectorIcon type={connectorType as ConnectorType} size={42} />
          <div>
            <h1 className="text-[20px] font-semibold text-foreground">
              {integrationName.trim() || defaultName}
            </h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Step {step + 1} of 3 — {LABELS[step]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[12px] text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft size={13} />
            Back to Center
          </Link>
          {step > 0 && (
            <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[12px] text-muted-foreground">
              <Save size={13} />
              Save Draft
            </button>
          )}
        </div>
      </div>
      <WizardStepper currentStep={step} labels={LABELS} />
      <div className="card-base min-h-[400px] p-6">{content}</div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-[12px] font-semibold disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        {step === 1 ? (
          <button
            onClick={openPreview}
            disabled={!mappingValid}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            Next: Preview
            <ChevronRight size={14} />
          </button>
        ) : (
          <div className="w-32" />
        )}
      </div>
    </div>
  );
}
