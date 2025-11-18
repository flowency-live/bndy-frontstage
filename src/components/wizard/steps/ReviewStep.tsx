// src/components/wizard/steps/ReviewStep.tsx
// Placeholder review step for testing wizard flow

'use client';

import type { EventWizardFormData } from '@/lib/types';
import { generateEventName } from '@/lib/utils/event-wizard-utils';

interface ReviewStepProps {
  formData: EventWizardFormData;
  onSubmit: () => void;
}

export function ReviewStep({ formData, onSubmit }: ReviewStepProps) {
  const eventName = generateEventName(formData);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Review & Publish</h2>

        <div className="rounded-lg bg-gray-50 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Event Name</h3>
            <p className="text-lg font-semibold text-gray-900">{eventName}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Venue</h3>
            <p className="text-gray-900">{formData.venue?.name || 'Not set'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Artists</h3>
            <p className="text-gray-900">
              {formData.isOpenMic
                ? 'Open Mic'
                : formData.artists.map((a) => a.name).join(', ') || 'Not set'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
            <p className="text-gray-900">
              {formData.date && formData.startTime
                ? `${formData.date} at ${formData.startTime}`
                : 'Not set'}
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          className="w-full rounded-lg bg-orange-500 px-6 py-4 text-white font-semibold transition-colors hover:bg-orange-600"
        >
          Create Event
        </button>
      </div>
    </div>
  );
}
