import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function StepWizard({ steps, currentStep, className }: StepWizardProps) {
  return (
    <div className={cn('w-full py-4', className)}>
      <div className="relative flex items-start justify-between">
        <div className="absolute left-0 right-0 top-7 mx-8 h-0.5 bg-neutral-200" />
        <div
          className="absolute left-0 top-7 mx-8 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 ease-out"
          style={{
            width: `calc(${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}% - 4rem)`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              className="relative z-10 flex flex-1 flex-col items-center"
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-sm font-semibold transition-all duration-300',
                  isCompleted &&
                    'border-accent-500 bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow',
                  isCurrent &&
                    'border-primary-500 bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-glow scale-110 ring-4 ring-primary-100',
                  !isCompleted &&
                    !isCurrent &&
                    'border-neutral-300 bg-white text-neutral-400',
                )}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6" strokeWidth={3} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span className="text-lg">{index + 1}</span>
                )}
              </div>

              <div className="mt-3 text-center px-2">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    (isCompleted || isCurrent)
                      ? 'text-primary-700'
                      : 'text-neutral-400',
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p
                    className={cn(
                      'mt-1 text-xs transition-colors',
                      isCurrent ? 'text-accent-600' : 'text-neutral-400',
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
