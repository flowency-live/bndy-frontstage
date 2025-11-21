// src/components/wizard/steps/DateTimeStep.tsx
// Real date/time step with pickers and conflict detection

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { EventWizardFormData } from '@/lib/types';
import DatePickerModal from '@/components/ui/date-picker-modal';
import TimePickerModal from '@/components/ui/time-picker-modal';
// import { checkEventConflicts } from '@/lib/utils/conflict-detection'; // Temporarily disabled

interface DateTimeStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function DateTimeStep({ formData, onUpdate, onNext }: DateTimeStepProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Check for conflicts whenever date/time changes
  // NOTE: Conflict checking temporarily disabled - API endpoint not yet implemented
  useEffect(() => {
    // Skip conflict checking for now
    if (formData.date && formData.startTime && formData.venue && formData.artists.length > 0) {
      // Clear any existing conflicts
      if (formData.conflicts && formData.conflicts.length > 0) {
        onUpdate({ conflicts: [] });
      }
    }
    // Uncomment when /api/events/check-conflicts endpoint is ready:
    // if (formData.date && formData.startTime && formData.venue && formData.artists.length > 0) {
    //   setIsCheckingConflicts(true);
    //   checkEventConflicts(formData)
    //     .then((conflicts) => {
    //       onUpdate({ conflicts });
    //     })
    //     .catch((error) => {
    //       console.error('Failed to check conflicts:', error);
    //       onUpdate({ conflicts: [] });
    //     })
    //     .finally(() => {
    //       setIsCheckingConflicts(false);
    //     });
    // }
  }, [formData.date, formData.startTime, formData.venue?.id, formData.artists.length, formData.conflicts, onUpdate]);

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatDisplayTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return timeStr;
    }
  };

  const hasBlockingConflict = formData.conflicts?.some((c) => c.severity === 'blocking');
  const isComplete = formData.date && formData.startTime;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">When is your event?</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Choose the date and time</p>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <button
            onClick={() => setShowDatePicker(true)}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-left transition-colors hover:border-orange-500"
          >
            {formData.date ? (
              <span className="text-gray-900 dark:text-white">{formatDisplayDate(formData.date)}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">Select date</span>
            )}
          </button>
        </div>

        {/* Start Time Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
          <button
            onClick={() => setShowStartTimePicker(true)}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-left transition-colors hover:border-orange-500"
          >
            {formData.startTime ? (
              <span className="text-gray-900 dark:text-white">{formatDisplayTime(formData.startTime)}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">Select start time</span>
            )}
          </button>
        </div>

        {/* End Time Selection (Optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Time <span className="text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <button
            onClick={() => setShowEndTimePicker(true)}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-left transition-colors hover:border-orange-500"
          >
            {formData.endTime ? (
              <span className="text-gray-900 dark:text-white">{formatDisplayTime(formData.endTime)}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">Select end time (optional)</span>
            )}
          </button>
        </div>

        {/* Conflict Warnings */}
        {isCheckingConflicts && (
          <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-600">
            Checking for conflicts...
          </div>
        )}

        {!isCheckingConflicts && formData.conflicts && formData.conflicts.length > 0 && (
          <div
            className={`rounded-lg p-4 ${
              hasBlockingConflict
                ? 'border-2 border-red-500 bg-red-50'
                : 'border-2 border-yellow-500 bg-yellow-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                {hasBlockingConflict ? (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${hasBlockingConflict ? 'text-red-800' : 'text-yellow-800'}`}>
                  {hasBlockingConflict ? 'Event Already Exists' : 'Potential Conflict'}
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {formData.conflicts.map((conflict, index) => (
                    <li key={index} className={hasBlockingConflict ? 'text-red-700' : 'text-yellow-700'}>
                      {conflict.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onNext}
          disabled={!isComplete || hasBlockingConflict}
          className={`w-full rounded-lg px-6 py-4 font-semibold text-white transition-colors ${
            !isComplete || hasBlockingConflict
              ? 'cursor-not-allowed bg-gray-300'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {hasBlockingConflict ? 'Cannot Continue - Event Exists' : 'Continue'}
        </button>
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={formData.date}
        onSelectDate={(date) => onUpdate({ date })}
        title="Select Event Date"
      />

      {/* Start Time Picker Modal */}
      <TimePickerModal
        isOpen={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        selectedTime={formData.startTime}
        onSelectTime={(time) => onUpdate({ startTime: time })}
        title="Select Start Time"
        defaultTime={formData.venue?.standardStartTime}
      />

      {/* End Time Picker Modal */}
      <TimePickerModal
        isOpen={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        selectedTime={formData.endTime}
        onSelectTime={(time) => onUpdate({ endTime: time })}
        title="Select End Time"
      />
    </div>
  );
}
