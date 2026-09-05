'use client';

import React, { useState } from 'react';
import ERPWizardStepper from './ERPWizardStepper';
import ERPSelectStep from './ERPSelectStep';
import ERPAuthStep from './ERPAuthStep';
import ERPConfigMapStep from './ERPConfigMapStep';
import ERPScheduleStep, { ScheduleConfig } from './ERPScheduleStep';
import ERPSummaryStep from './ERPSummaryStep';
import ERPMonitorStep from './ERPMonitorStep';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Link from 'next/link';
import { ERPId, AuthType, Environment } from './erpRegistry';

const STEP_LABELS = [
  'Select ERP',
  'Connect & Authenticate',
  'Configure & Map',
  'Schedule',
  'Summary',
  'Monitor',
];

export default function ERPWizardContent() {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1
  const [selectedERP, setSelectedERP] = useState<ERPId | null>(null);

  // Step 2
  const [authData, setAuthData] = useState<{
    environment: Environment;
    authType: AuthType | null;
    credentials: Record<string, string>;
  } | null>(null);

  // Step 3 — we track minimal state here; the step manages its own internal state
  // We just need to know if user has visited step 3 to allow Next
  const [step3Visited, setStep3Visited] = useState(false);

  // Step 4
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null);

  // Summary data (passed from step 3 via ref-like approach — we use simple defaults)
  const [configuration, setConfiguration] = useState({
    curlConfigured: false,
    mappingCount: 0,
    staticFieldCount: 0,
    formatMappingCount: 0,
    defaultValueCount: 0,
  });

  const canProceed = () => {
    if (currentStep === 0) return selectedERP !== null;
    if (currentStep === 1) return true;
    if (currentStep === 2) return configuration.mappingCount > 0 || configuration.curlConfigured;
    if (currentStep === 3) return scheduleConfig !== null && Boolean(scheduleConfig.frequency);
    return true;
  };

  const handleERPSelect = (erpId: ERPId) => {
    setSelectedERP(erpId);
    setAuthData(null);
    setStep3Visited(false);
    // Auto-advance to step 2
    setTimeout(() => setCurrentStep(1), 150);
  };

  const handleAuthValidated = (data: { environment: Environment; authType: AuthType; credentials: Record<string, string> }) => {
    setAuthData(data);
  };

  const handleAuthNoAuth = () => {
    // Allow proceeding without auth
    setAuthData({ environment: 'production', authType: null, credentials: {} });
  };

  const handleNext = () => {
    if (currentStep === 2 && !step3Visited) setStep3Visited(true);
    if (canProceed() && currentStep < STEP_LABELS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const isMonitorStep = currentStep === 5;
  const isSummaryStep = currentStep === 4;

  // For step 2: allow Next if no auth type selected (authData may be null but user can skip)
  const canProceedStep2 = () => {
    if (currentStep !== 1) return canProceed();
    // If authData is set (validated or explicitly no-auth), allow next
    if (authData !== null) return true;
    // If no auth type selected at all, also allow next (user can skip auth)
    return true;
  };

  const handleNextWithAuthCheck = () => {
    if (currentStep === 1 && authData === null) {
      // User hasn't selected any auth — treat as no-auth
      handleAuthNoAuth();
    }
    if (currentStep === 2) setStep3Visited(true);
    if (canProceed() && currentStep < STEP_LABELS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ERPSelectStep onSelect={handleERPSelect} />;
      case 1:
        return selectedERP ? (
          <ERPAuthStep
            erpId={selectedERP}
            onValidated={handleAuthValidated}
          />
        ) : null;
      case 2:
        return selectedERP ? <ERPConfigMapStep erpId={selectedERP} onConfigurationChange={setConfiguration} /> : null;
      case 3:
        return (
          <ERPScheduleStep
            onScheduleChange={(cfg) => setScheduleConfig(cfg)}
          />
        );
      case 4:
        return selectedERP ? (
          <ERPSummaryStep
            erpId={selectedERP}
            environment={authData?.environment || 'production'}
            authType={authData?.authType || null}
            scheduleConfig={scheduleConfig}
            curlConfigured={configuration.curlConfigured}
            mappingCount={configuration.mappingCount}
            staticFieldCount={configuration.staticFieldCount}
            formatMappingCount={configuration.formatMappingCount}
            defaultValueCount={configuration.defaultValueCount}
            canActivate={Boolean(scheduleConfig?.frequency) && (configuration.mappingCount > 0 || configuration.curlConfigured)}
            onActivate={() => {}}
            onGoToMonitor={() => setCurrentStep(5)}
          />
        ) : null;
      case 5:
        return selectedERP ? (
          <ERPMonitorStep
            erpId={selectedERP}
            onBack={() => setCurrentStep(4)}
            onFinish={() => setCurrentStep(5)}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">ERP Integration Wizard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Step {currentStep + 1} of {STEP_LABELS.length} — {STEP_LABELS[currentStep]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all text-muted-foreground">
              <ChevronLeft size={13} />
              Back to Center
            </button>
          </Link>
          {currentStep > 0 && currentStep < 4 && (
            <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-card border border-border rounded-lg hover:bg-muted transition-all text-muted-foreground">
              <Save size={13} />
              Save Draft
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <ERPWizardStepper currentStep={currentStep} />

      {/* Step content */}
      <div className="card-base p-6 min-h-[400px]">
        {renderStep()}
      </div>

      {/* Sticky Navigation */}
      {!isMonitorStep && !isSummaryStep && currentStep !== 0 && (
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-5 py-3 shadow-lg">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-card border border-border rounded-xl hover:bg-muted active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              {`Back to ${STEP_LABELS[currentStep - 1]}`}
            </button>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((_, idx) => (
                <div
                  key={`dot-${idx}`}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-5 h-2 bg-primary'
                      : idx < currentStep
                      ? 'w-2 h-2 bg-primary/40' :'w-2 h-2 bg-border'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNextWithAuthCheck}
              disabled={!canProceed()}
              title={!canProceed() ? 'Complete the required setup before continuing' : undefined}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              {`Next: ${STEP_LABELS[currentStep + 1]}`}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Back nav on summary step */}
      {isSummaryStep && (
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-card border border-border rounded-xl hover:bg-muted active:scale-95 transition-all"
          >
            <ChevronLeft size={14} />
            Back to Schedule
          </button>
        </div>
      )}
    </div>
  );
}
