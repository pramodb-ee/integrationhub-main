'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WizardStepper from './WizardStepper';
import ConnectorSelectStep from './ConnectorSelectStep';
import DynamicConfigForm from './DynamicConfigForm';
import ConnectionTestStep from './ConnectionTestStep';
import FieldMappingStep from './FieldMappingStep';
import PreviewStep from './PreviewStep';
import PublishStep from './PublishStep';
import MonitorBootstrapStep from './MonitorBootstrapStep';
import FacebookIntegrationFlow from './FacebookIntegrationFlow';
import FacebookMonitorStep from './FacebookMonitorStep';
import TelephonySummaryStep from './TelephonySummaryStep';
import TataMonitorStep from './TataMonitorStep';
import ApiIntegrationListStep, { ApiIntegration } from './ApiIntegrationListStep';
import ApiTestRequestStep from './ApiTestRequestStep';
import { ConnectorType } from '@/components/ui/ConnectorIcon';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

const STANDARD_LABELS = ['Connect', 'Validate', 'Field Mapping', 'Preview', 'Publish', 'Monitor'];
const TELEPHONY_LABELS = ['Connect', 'Configure', 'Test', 'Summary', 'Activate', 'Monitor'];
// Call Logs is no longer a numbered wizard step — it opens as a side panel from within Configure and Monitor.
const TATA_LABELS = ['Configure', 'Monitor'];
// Facebook merges Connect + Validate into a single first step, so it has one fewer step than STANDARD_LABELS.
const FACEBOOK_LABELS = ['Connect', 'Field Mapping', 'Preview', 'Publish', 'Monitor'];
// API replaces Select & Configure + Validate with API Configuration (a table of integrations) + Test Request.
const API_LABELS = ['API Configuration', 'Test Request', 'Field Mapping', 'Preview', 'Publish', 'Monitor'];
const TELEPHONY_CONNECTORS: ConnectorType[] = ['tata', 'exotel', 'knowlarity', 'ozonetel', 'myoperator', 'ivr-custom'];

export default function SetupWizardContent() {
  const searchParams = useSearchParams();
  // TATA never shows the connector-picker screen — if the URL already names a
  // telephony connector we land straight on Configure (step 1) with no flash of step 0.
  const [currentStep, setCurrentStep] = useState(() => {
    const typeParam = searchParams.get('type') as ConnectorType | null;
    return typeParam && TELEPHONY_CONNECTORS.includes(typeParam) ? 1 : 0;
  });
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType | null>(() => searchParams.get('type') as ConnectorType | null);
  const [integrationName, setIntegrationName] = useState('');
  const [testPassed, setTestPassed] = useState(false);
  const [configSubmitted, setConfigSubmitted] = useState(false);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [facebookTestLeadRetrieved, setFacebookTestLeadRetrieved] = useState(false);
  const [facebookPayloadValidated, setFacebookPayloadValidated] = useState(false);
  const [tataTestCallSucceeded, setTataTestCallSucceeded] = useState(false);
  const [apiTestRequestMapped, setApiTestRequestMapped] = useState(false);

  const isTelephony = selectedConnector !== null && TELEPHONY_CONNECTORS.includes(selectedConnector);
  const isTata = selectedConnector === 'tata' || selectedConnector === 'ivr-custom';
  const isFacebook = selectedConnector === 'facebook';
  const isApi = selectedConnector === 'api';
  const labels = isTata ? TATA_LABELS : isTelephony ? TELEPHONY_LABELS : isFacebook ? FACEBOOK_LABELS : isApi ? API_LABELS : STANDARD_LABELS;
  const isMonitorStep = isTata ? currentStep === 2 : isTelephony ? currentStep === 5 : isFacebook ? currentStep === 4 : isApi ? currentStep === 5 : currentStep === 6;
  const isLastStep = isTata ? false : isTelephony ? currentStep === 4 : isFacebook ? currentStep === 3 : isApi ? currentStep === 4 : currentStep === 5;
  // For TATA the connector-pick screen (step 0) isn't a numbered step — the stepper only ever shows Configure / Monitor.
  const displayStep = isTata ? Math.max(0, currentStep - 1) : currentStep;
  const hideStepChrome = isTata && currentStep === 0;

  useEffect(() => {
    const typeParam = searchParams.get('type') as ConnectorType | null;
    if (typeParam) {
      setSelectedConnector(typeParam);
      if (TELEPHONY_CONNECTORS.includes(typeParam)) setCurrentStep(1);
    }
  }, [searchParams]);

  const canProceed = () => {
    if (isFacebook) {
      // Step 0 (Connect + Validate merged) can't advance until a test lead has been retrieved and verified.
      if (currentStep === 0) return facebookTestLeadRetrieved;
      // Step 2 (Preview) can't advance to Publish until the sample payload has been test-validated.
      if (currentStep === 2) return facebookPayloadValidated;
      return true;
    }
    if (isApi) {
      // Step 1 (Test Request) can't advance until field mappings have been created from a test request.
      // (Step 0 has no bottom Next button — advancing happens only via an integration's View Details action.)
      if (currentStep === 1) return apiTestRequestMapped;
      return true;
    }
    if (currentStep === 0) return selectedConnector !== null;
    if (isTelephony) {
      if (currentStep === 1) return configSubmitted;
      if (selectedConnector === 'tata' && currentStep === 2) return true;
      if (currentStep === 2) return testPassed;
      return true;
    }
    if (currentStep === 1) return configSubmitted;
    if (currentStep === 2) return testPassed;
    return true;
  };

  const handleConfigSubmit = (data: Record<string, string>) => {
    setConfigData(data);
    setConfigSubmitted(true);
    setCurrentStep(2);
  };

  const renderStep = () => {
    if (isTelephony) {
      if (currentStep === 0) return <ConnectorSelectStep selected={selectedConnector} onSelect={(type) => { setSelectedConnector(type); setConfigSubmitted(false); }} />;
      if (currentStep === 1 && selectedConnector) return <DynamicConfigForm connectorType={selectedConnector} onSubmit={handleConfigSubmit} integrationName={integrationName} onNameChange={setIntegrationName} onOutboundTestCallSuccess={() => setTataTestCallSucceeded(true)} />;
      if (isTata && currentStep === 2) {
        // Call Logs is reached from here via a side panel (per-user in User Management, or "View Call Logs" on this screen) — not a separate step.
        return <TataMonitorStep integrationName={integrationName || 'TATA IVR Integration'} />;
      }
      if (currentStep === 2 && selectedConnector) return <ConnectionTestStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onTestComplete={setTestPassed} />;
      if (currentStep === 3 && selectedConnector) return <TelephonySummaryStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} config={configData} testPassed={testPassed} />;
      if (currentStep === 4 && selectedConnector) return <PublishStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onPublished={() => setCurrentStep(5)} webhookConfigured={webhookConfigured || Boolean(configData.webhookUrl)} onGoToPreview={() => setCurrentStep(1)} />;
      if (currentStep === 5 && selectedConnector) return <MonitorBootstrapStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} />;
      return null;
    }

    if (isFacebook) {
      // Step 0 = Connect + Validate merged (fetch & verify a test lead), Step 1 = Field Mapping, etc.
      if (currentStep === 0) return <FacebookIntegrationFlow onTestLeadRetrieved={setFacebookTestLeadRetrieved} />;
      if (currentStep === 1) return <FieldMappingStep connectorType="facebook" />;
      if (currentStep === 2) return <PreviewStep connectorType="facebook" integrationName={integrationName || 'Facebook Lead Ads Integration'} webhookConfigured={webhookConfigured} onWebhookConfigured={setWebhookConfigured} onValidationChange={setFacebookPayloadValidated} />;
      if (currentStep === 3) return <PublishStep connectorType="facebook" integrationName={integrationName || 'Facebook Lead Ads Integration'} onPublished={() => setCurrentStep(4)} webhookConfigured={webhookConfigured} onGoToPreview={() => setCurrentStep(2)} />;
      if (currentStep === 4) return <FacebookMonitorStep integrationName={integrationName || 'Facebook Lead Ads Integration'} />;
      return null;
    }

    if (isApi) {
      // Step 0 = API Configuration (integrations table + Add New Integration side panel), Step 1 = Test Request, etc.
      // Saving a new integration only adds it to the table — View Details on any row is what jumps to Step 1 (Test Request).
      if (currentStep === 0) return <ApiIntegrationListStep onViewDetails={(integration: ApiIntegration) => { setIntegrationName(integration.name); setCurrentStep(1); }} />;
      if (currentStep === 1) return <ApiTestRequestStep integrationName={integrationName || 'API Integration'} onFieldMappingCreated={() => { setApiTestRequestMapped(true); setCurrentStep(2); }} />;
      if (currentStep === 2) return <FieldMappingStep connectorType="api" />;
      if (currentStep === 3) return <PreviewStep connectorType="api" integrationName={integrationName || 'API Integration'} webhookConfigured={webhookConfigured} onWebhookConfigured={setWebhookConfigured} />;
      if (currentStep === 4) return <PublishStep connectorType="api" integrationName={integrationName || 'API Integration'} onPublished={() => setCurrentStep(5)} webhookConfigured={webhookConfigured} onGoToPreview={() => setCurrentStep(3)} />;
      if (currentStep === 5) return <MonitorBootstrapStep connectorType="api" integrationName={integrationName || 'API Integration'} />;
      return null;
    }

    switch (currentStep) {
      case 0: return <ConnectorSelectStep selected={selectedConnector} onSelect={(type) => { setSelectedConnector(type); setConfigSubmitted(false); }} />;
      case 1: return selectedConnector ? <DynamicConfigForm connectorType={selectedConnector} onSubmit={handleConfigSubmit} integrationName={integrationName} onNameChange={setIntegrationName} /> : null;
      case 2: return selectedConnector ? <ConnectionTestStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onTestComplete={setTestPassed} /> : null;
      case 3: return selectedConnector ? <FieldMappingStep connectorType={selectedConnector} /> : null;
      case 4: return selectedConnector ? <PreviewStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} webhookConfigured={webhookConfigured} onWebhookConfigured={setWebhookConfigured} /> : null;
      case 5: return selectedConnector ? <PublishStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onPublished={() => setCurrentStep(6)} webhookConfigured={webhookConfigured} onGoToPreview={() => setCurrentStep(4)} /> : null;
      case 6: return selectedConnector ? <MonitorBootstrapStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} /> : null;
      default: return null;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < (isTata ? 2 : isTelephony ? 5 : isFacebook ? 4 : isApi ? 5 : 6)) setCurrentStep((step) => step + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Integration Setup Wizard</h1>
          {!hideStepChrome && (
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Step {Math.min(displayStep + 1, labels.length)} of {labels.length} — {labels[Math.min(displayStep, labels.length - 1)]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
              <ChevronLeft size={13} />Back to Center
            </button>
          </Link>
          {currentStep > 0 && !isMonitorStep && (
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
              <Save size={13} />Save Draft
            </button>
          )}
        </div>
      </div>
      {!isMonitorStep && !hideStepChrome && <WizardStepper currentStep={Math.min(displayStep, labels.length - 1)} labels={labels} />}
      <div className="card-base p-6 min-h-[400px]">{renderStep()}</div>
      {!isMonitorStep && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((step) => Math.max(isTata ? 1 : 0, step - 1))}
            disabled={currentStep === (isTata ? 1 : 0)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-40"
          >
            <ChevronLeft size={14} />{displayStep === 0 ? 'Back' : `Back to ${labels[displayStep - 1]}`}
          </button>
          {!hideStepChrome && (
            <div className="flex items-center gap-1.5">
              {labels.map((_, index) => (
                <div key={index} className={`rounded-full ${index === displayStep ? 'w-5 h-2 bg-primary' : index < displayStep ? 'w-2 h-2 bg-primary/40' : 'w-2 h-2 bg-border'}`} />
              ))}
            </div>
          )}
          {currentStep === 1 && isTata ? (
            <div className="flex items-center gap-3">
              {!tataTestCallSucceeded && (
                <span className="text-[11px] text-muted-foreground">Run a successful Test Call to continue</span>
              )}
              <button onClick={() => setConfigSubmitted(true)} className="px-5 py-2 text-[13px] font-semibold bg-card border border-border rounded-lg hover:bg-muted">Save</button>
              <button
                onClick={() => document.getElementById('config-form-submit')?.click()}
                disabled={!tataTestCallSucceeded}
                title={!tataTestCallSucceeded ? 'Complete a successful Test Call for an outbound user before continuing' : undefined}
                className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          ) : currentStep === 1 && !isFacebook && !isApi ? (
            <button onClick={() => document.getElementById('config-form-submit')?.click()} className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">
              <span>{isTelephony ? 'Save & Continue' : 'Save & Test'}</span><ChevronRight size={14} />
            </button>
          ) : isApi && currentStep === 0 ? (
            // No bottom Next here — advancing to Test Request happens only via an integration's View Details action.
            <div className="w-32" />
          ) : isLastStep ? (
            <div className="w-32" />
          ) : (
            <button onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
              Next: {labels[displayStep + 1]}<ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
