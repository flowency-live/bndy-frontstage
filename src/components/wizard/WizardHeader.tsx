// src/components/wizard/WizardHeader.tsx
// Orange-themed wizard header with progress (<100 LOC)

'use client';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
}

export function WizardHeader({
  currentStep,
  totalSteps,
  title,
  onBack,
}: WizardHeaderProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-50 bg-orange-500 text-white shadow-lg">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back Button */}
        {onBack && currentStep > 0 && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/20"
            aria-label="Go back"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        )}

        {/* Title */}
        <h1 className="flex-1 text-center text-xl font-bold">
          {title}
        </h1>

        {/* Spacer for alignment */}
        {onBack && currentStep > 0 && <div className="w-20" />}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-orange-600">
        <div
          className="h-full bg-white transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2 py-3">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-8 rounded-full transition-all ${
              index <= currentStep
                ? 'bg-white'
                : 'bg-white/30'
            }`}
            aria-label={`Step ${index + 1}${index <= currentStep ? ' completed' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
