import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 'step-connect', label: 'Connect', description: 'Select & configure' },
  { id: 'step-validate', label: 'Validate', description: 'Connection check' },
  { id: 'step-mapping', label: 'Field Mapping', description: 'Map source → dest' },
  { id: 'step-preview', label: 'Preview', description: 'Review payload' },
  { id: 'step-publish', label: 'Publish', description: 'Go live' },
  { id: 'step-monitor', label: 'Monitor', description: 'Track health' },
];

interface WizardStepperProps {
  currentStep: number;
  labels?: string[];
  descriptions?: string[];
}

export default function WizardStepper({ currentStep, labels = STEPS.map((step) => step.label), descriptions }: WizardStepperProps) {
  return (
    <div className="card-base p-4">
      <div className="flex items-center">
        {labels.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <React.Fragment key={`step-${idx}-${label}`}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isActive
                      ? 'bg-white border-primary text-primary shadow-sm'
                      : 'bg-white border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : <span>{idx + 1}</span>}
                </div>
                <div className="mt-1.5 text-center hidden sm:block">
                  <p className={`text-[11px] font-semibold leading-tight ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden md:block">
                    {(descriptions ? descriptions[idx] : STEPS[idx]?.description) || 'Integration step'}
                  </p>
                </div>
              </div>
              {idx < labels.length - 1 && (
                <div
                  className={`step-connector mx-1 sm:mx-2 mt-0 sm:-mt-5 ${isCompleted ? 'completed' : ''}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}