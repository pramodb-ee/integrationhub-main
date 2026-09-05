import React from 'react';
import { Check } from 'lucide-react';

const ERP_STEPS = [
  { id: 'step-1', label: 'Select ERP', description: 'Choose system' },
  { id: 'step-2', label: 'Authenticate', description: 'Connect & validate' },
  { id: 'step-3', label: 'Configure & Map', description: 'CURL + field mapping' },
  { id: 'step-4', label: 'Schedule', description: 'Sync frequency' },
  { id: 'step-5', label: 'Summary', description: 'Review & activate' },
  { id: 'step-6', label: 'Monitor', description: 'Track health' },
];

interface ERPWizardStepperProps {
  currentStep: number;
}

export default function ERPWizardStepper({ currentStep }: ERPWizardStepperProps) {
  return (
    <div className="card-base p-4">
      <div className="flex items-center">
        {ERP_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isActive
                      ? 'bg-white border-primary text-primary shadow-sm'
                      : 'bg-white border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check size={13} /> : <span>{idx + 1}</span>}
                </div>
                <div className="mt-1.5 text-center hidden sm:block">
                  <p className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {idx < ERP_STEPS.length - 1 && (
                <div className={`step-connector mx-1 sm:mx-1.5 mt-0 sm:-mt-5 ${isCompleted ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
