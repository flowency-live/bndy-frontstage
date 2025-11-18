// src/components/wizard/steps/DateTimeStep.tsx
// Placeholder date/time step for testing wizard flow

'use client';

import type { EventWizardFormData } from '@/lib/types';

interface DateTimeStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function DateTimeStep({ formData, onUpdate, onNext }: DateTimeStepProps) {
  const handleSetDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    onUpdate({
      date: dateStr,
      startTime: '21:00',
      endTime: '00:00',
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Date & Time</h2>
        <p className="text-gray-600">
          {formData.date
            ? `${formData.date} at ${formData.startTime}`
            : 'Choose when your event happens'}
        </p>

        {!formData.date ? (
          <button
            onClick={handleSetDate}
            className="w-full rounded-lg bg-orange-500 px-6 py-4 text-white transition-colors hover:bg-orange-600"
          >
            Set Date (Tomorrow at 9 PM)
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full rounded-lg bg-orange-500 px-6 py-4 text-white transition-colors hover:bg-orange-600"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
