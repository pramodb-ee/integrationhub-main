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
import TelephonySummaryStep from './TelephonySummaryStep';
import TataAddUserStep from './TataAddUserStep';
import { ConnectorType } from '@/components/ui/ConnectorIcon';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

const STANDARD_LABELS = ['Connect', 'Validate', 'Field Mapping', 'Preview', 'Publish', 'Monitor'];
const TELEPHONY_LABELS = ['Connect', 'Configure', 'Test', 'Summary', 'Activate', 'Monitor'];
const TELEPHONY_CONNECTORS: ConnectorType[] = ['tata', 'exotel', 'knowlarity', 'twilio', 'ozonetel', 'myoperator', 'cloudtalk', 'ringcentral', 'ivr-custom'];

export default function SetupWizardContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType | null>(null);
  const [integrationName, setIntegrationName] = useState('');
  const [testPassed, setTestPassed] = useState(false);
  const [configSubmitted, setConfigSubmitted] = useState(false);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [facebookTestLeadRetrieved, setFacebookTestLeadRetrieved] = useState(false);

  const isTelephony = selectedConnector !== null && TELEPHONY_CONNECTORS.includes(selectedConnector);
  const labels = selectedConnector === 'tata'
    ? ['TATA IVR Setup', 'Configure', 'Add User', 'Summary', 'Activate', 'Monitor']
    : isTelephony ? TELEPHONY_LABELS : STANDARD_LABELS;
  const isFacebook = selectedConnector === 'facebook';
  const isMonitorStep = isTelephony ? currentStep === 5 : isFacebook ? currentStep === 5 : currentStep === 6;
  const isLastStep = isTelephony ? currentStep === 4 : isFacebook ? currentStep === 4 : currentStep === 5;

  useEffect(() => {
    const typeParam = searchParams.get('type') as ConnectorType | null;
    if (typeParam) {
      setSelectedConnector(typeParam);
      if (TELEPHONY_CONNECTORS.includes(typeParam)) setCurrentStep(1);
    }
  }, [searchParams]);

  const canProceed = () => {
    if (currentStep === 0) return selectedConnector !== null;
    if (isTelephony) {
      if (currentStep === 1) return configSubmitted;
      if (selectedConnector === 'tata' && currentStep === 2) return true;
      if (currentStep === 2) return testPassed;
      return true;
    }
    if (isFacebook) return currentStep !== 1 || facebookTestLeadRetrieved;
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
      if (currentStep === 1 && selectedConnector) return <DynamicConfigForm connectorType={selectedConnector} onSubmit={handleConfigSubmit} integrationName={integrationName} onNameChange={setIntegrationName} />;
      if (currentStep === 2 && selectedConnector === 'tata') return <TataAddUserStep />;
      if (currentStep === 2 && selectedConnector) return <ConnectionTestStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onTestComplete={setTestPassed} />;
      if (currentStep === 3 && selectedConnector) return <TelephonySummaryStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} config={configData} testPassed={testPassed} />;
      if (currentStep === 4 && selectedConnector) return <PublishStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onPublished={() => setCurrentStep(5)} webhookConfigured={webhookConfigured || Boolean(configData.webhookUrl)} onGoToPreview={() => setCurrentStep(1)} />;
      if (currentStep === 5 && selectedConnector) return <MonitorBootstrapStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} />;
      return null;
    }

    if (isFacebook && currentStep <= 1) return <FacebookIntegrationFlow onTestLeadRetrieved={setFacebookTestLeadRetrieved} onValidate={() => setCurrentStep(2)} testLeadRetrieved={facebookTestLeadRetrieved} />;

    switch (currentStep) {
      case 0: return <ConnectorSelectStep selected={selectedConnector} onSelect={(type) => { setSelectedConnector(type); setConfigSubmitted(false); }} />;
      case 1: return selectedConnector ? <DynamicConfigForm connectorType={selectedConnector} onSubmit={handleConfigSubmit} integrationName={integrationName} onNameChange={setIntegrationName} /> : null;
      case 2: return isFacebook ? <FieldMappingStep connectorType="facebook" /> : selectedConnector ? <ConnectionTestStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onTestComplete={setTestPassed} /> : null;
      case 3: return isFacebook ? <PreviewStep connectorType="facebook" integrationName={integrationName || 'Facebook Lead Ads Integration'} webhookConfigured={webhookConfigured} onWebhookConfigured={setWebhookConfigured} /> : selectedConnector ? <FieldMappingStep connectorType={selectedConnector} /> : null;
      case 4: return isFacebook ? <PublishStep connectorType="facebook" integrationName={integrationName || 'Facebook Lead Ads Integration'} onPublished={() => setCurrentStep(5)} webhookConfigured={webhookConfigured} onGoToPreview={() => setCurrentStep(3)} /> : selectedConnector ? <PreviewStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} webhookConfigured={webhookConfigured} onWebhookConfigured={setWebhookConfigured} /> : null;
      case 5: return isFacebook ? <MonitorBootstrapStep connectorType="facebook" integrationName={integrationName || 'Facebook Lead Ads Integration'} /> : selectedConnector ? <PublishStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} onPublished={() => setCurrentStep(6)} webhookConfigured={webhookConfigured} onGoToPreview={() => setCurrentStep(4)} /> : null;
      case 6: return selectedConnector ? <MonitorBootstrapStep connectorType={selectedConnector} integrationName={integrationName || `${selectedConnector} Integration`} /> : null;
      default: return null;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < (isTelephony ? 5 : 6)) setCurrentStep((step) => step + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-[22px] font-semibold text-foreground tracking-tight">Integration Setup Wizard</h1><p className="text-[13px] text-muted-foreground mt-0.5">Step {Math.min(currentStep + 1, labels.length)} of {labels.length} — {labels[Math.min(currentStep, labels.length - 1)]}</p></div><div className="flex items-center gap-2"><Link href="/"><button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground"><ChevronLeft size={13} />Back to Center</button></Link>{currentStep > 0 && !isMonitorStep && <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-md hover:bg-muted transition-all text-muted-foreground"><Save size={13} />Save Draft</button>}</div></div>
      {!isMonitorStep && <WizardStepper currentStep={Math.min(currentStep, labels.length - 1)} labels={labels} />}
      <div className={`card-base p-6 ${selectedConnector === 'tata' && currentStep === 2 ? '' : 'min-h-[400px]'}`}>{renderStep()}</div>
      {!isMonitorStep && !(selectedConnector === 'tata' && currentStep === 2) && <div className="flex items-center justify-between"><button onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} disabled={currentStep === 0} className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-40"><ChevronLeft size={14} />{currentStep === 0 ? 'Back' : `Back to ${labels[currentStep - 1]}`}</button><div className="flex items-center gap-1.5">{labels.map((_, index) => <div key={index} className={`rounded-full ${index === currentStep ? 'w-5 h-2 bg-primary' : index < currentStep ? 'w-2 h-2 bg-primary/40' : 'w-2 h-2 bg-border'}`} />)}</div>{currentStep === 1 && selectedConnector === 'tata' ? <div className="flex items-center gap-2"><button onClick={() => setConfigSubmitted(true)} className="px-5 py-2 text-[13px] font-semibold bg-card border border-border rounded-lg hover:bg-muted">Save</button><button onClick={() => document.getElementById('config-form-submit')?.click()} className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90">Next <ChevronRight size={14} /></button></div> : currentStep === 1 && !isFacebook ? <button onClick={() => document.getElementById('config-form-submit')?.click()} className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90"><span>{isTelephony ? 'Save & Continue' : 'Save & Test'}</span><ChevronRight size={14} /></button> : isLastStep ? <div className="w-32" /> : <button onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">Next: {labels[currentStep + 1]}<ChevronRight size={14} /></button>}</div>}
    </div>
  );
}
