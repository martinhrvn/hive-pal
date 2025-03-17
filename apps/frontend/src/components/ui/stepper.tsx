import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex items-center justify-center rounded-full border-2 w-10 h-10 text-sm font-medium',
                index < currentStep
                  ? 'bg-primary text-primary-foreground border-primary'
                  : index === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground text-muted-foreground',
              )}
            >
              {index < currentStep ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-xs font-medium',
                index <= currentStep ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 mx-2',
                index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
