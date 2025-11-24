// src/components/wizard/steps/DateTimeStep.tsx
// Real date/time step with pickers and conflict detection

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { EventWizardFormData } from '@/lib/types';
import DatePickerModal from '@/components/ui/date-picker-modal';
import TimePickerModal from '@/components/ui/time-picker-modal';
import { checkEventConflicts } from '@/lib/utils/conflict-detection';

interface DateTimeStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
  onQuickCreate?: () => void;
}

export function DateTimeStep({ formData, onUpdate, onNext, onQuickCreate }: DateTimeStepProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Set default start time on mount if not already set
  useEffect(() => {
    if (!formData.startTime && formData.venue) {
      const defaultTime = formData.venue.standardStartTime || '21:00';
      onUpdate({ startTime: defaultTime });
    }
  }, [formData.venue, formData.startTime, onUpdate]);

  // Check for conflicts whenever date is set (we have venue, artist, date, and default start time)
  useEffect(() => {
    if (formData.date && formData.startTime && formData.venue && (formData.artists.length > 0 || formData.isOpenMic)) {
      setIsCheckingConflicts(true);
      checkEventConflicts(formData)
        .then((conflicts) => {
          onUpdate({ conflicts });
        })
        .catch((error) => {
          console.error('Failed to check conflicts:', error);
          onUpdate({ conflicts: [] });
        })
        .finally(() => {
          setIsCheckingConflicts(false);
        });
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.venue?.id, formData.artists.length, formData.isOpenMic, onUpdate]);

  // Generate event title: "Artist @ Venue - Date, Time"
  const generateEventTitle = () => {
    if (!formData.venue) return '';

    const artistPart = formData.isOpenMic
      ? 'Open Mic'
      : formData.artists.length > 0
        ? formData.artists[0].name
        : '';

    const venuePart = formData.venue.name;
    const datePart = formData.date ? formatDisplayDate(formData.date) : '';
    const timePart = formData.startTime ? formatDisplayTime(formData.startTime) : '';

    if (!artistPart || !datePart || !timePart) return '';

    return `${artistPart} @ ${venuePart} - ${datePart}, ${timePart}`;
  };

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
  const eventTitle = generateEventTitle();

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
          <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-300 animate-pulse">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              Checking for conflicts...
            </div>
          </div>
        )}

        {!isCheckingConflicts && formData.conflicts && formData.conflicts.length > 0 && (
          <div
            className={`rounded-xl p-4 shadow-lg ${
              hasBlockingConflict
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 dark:border-yellow-400'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {hasBlockingConflict ? (
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm ${hasBlockingConflict ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                  {hasBlockingConflict ? 'Event Already Exists' : 'Heads Up!'}
                </h3>
                <div className="mt-1.5 space-y-1">
                  {formData.conflicts.map((conflict, index) => (
                    <p key={index} className={`text-sm ${hasBlockingConflict ? 'text-red-700 dark:text-red-200' : 'text-yellow-700 dark:text-yellow-200'}`}>
                      {conflict.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show what will be created */}
        {eventTitle && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 p-4">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Creating:</div>
            <div className="text-blue-900 dark:text-blue-100 font-semibold">{eventTitle}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action: Quick Create */}
          <button
            onClick={onQuickCreate}
            disabled={!isComplete || hasBlockingConflict}
            className={`w-full rounded-lg px-6 py-4 font-semibold text-white transition-colors ${
              !isComplete || hasBlockingConflict
                ? 'cursor-not-allowed bg-gray-300 dark:bg-gray-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {hasBlockingConflict ? 'Cannot Create - Event Exists' : 'Quick Create Event'}
          </button>

          {/* Secondary Action: Add More Details */}
          <button
            onClick={onNext}
            disabled={!isComplete || hasBlockingConflict}
            className={`w-full rounded-lg px-6 py-3 font-medium transition-colors ${
              !isComplete || hasBlockingConflict
                ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
            }`}
          >
            Add More Details (optional)
          </button>
        </div>
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
        onClose={() => {
          setShowStartTimePicker(false);
        }}
        selectedTime={formData.startTime}
        onSelectTime={(time) => {
          onUpdate({ startTime: time });
          setShowStartTimePicker(false);
        }}
        title="Select Start Time"
        defaultTime={formData.venue?.standardStartTime}
      />

      {/* End Time Picker Modal */}
      <TimePickerModal
        isOpen={showEndTimePicker}
        onClose={() => {
          setShowEndTimePicker(false);
        }}
        selectedTime={formData.endTime}
        onSelectTime={(time) => {
          onUpdate({ endTime: time });
        }}
        title="Select End Time"
        defaultTime="00:00"
      />
    </div>
  );
}
