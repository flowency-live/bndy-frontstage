// src/components/wizard/steps/ReviewStep.tsx
// Review step with editable fields and neon styling

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { EventWizardFormData } from '@/lib/types';
import { generateEventName } from '@/lib/utils/event-wizard-utils';

interface ReviewStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onSubmit: () => void;
  onNavigateToStep: (step: number) => void;
}

export function ReviewStep({ formData, onUpdate, onSubmit, onNavigateToStep }: ReviewStepProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const eventName = generateEventName(formData);

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

  const handleTitleEdit = () => {
    setEditedTitle(formData.name || eventName);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      onUpdate({ name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Review & Publish</h2>

        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 space-y-4">
          {/* Event Title - Editable */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Name</h3>
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="w-full text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-2 border-orange-500 rounded px-2 py-1 focus:outline-none"
              />
            ) : (
              <button
                onClick={handleTitleEdit}
                className="text-left w-full text-lg font-semibold text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                {formData.name || eventName}
              </button>
            )}
          </div>

          {/* Venue - Cyan Neon Effect */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Venue</h3>
            <button
              onClick={() => onNavigateToStep(0)}
              className="neon-venue px-3 py-1.5 rounded-md text-sm font-bold cursor-pointer"
            >
              {formData.venue?.name || 'Not set'}
            </button>
          </div>

          {/* Artists - Orange Neon Effect */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Artists</h3>
            <div className="flex flex-wrap gap-2">
              {formData.isOpenMic ? (
                <button
                  onClick={() => onNavigateToStep(1)}
                  className="neon-artist px-3 py-1.5 rounded-md text-sm font-bold cursor-pointer"
                >
                  Open Mic
                </button>
              ) : formData.artists.length > 0 ? (
                formData.artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => onNavigateToStep(1)}
                    className="neon-artist px-3 py-1.5 rounded-md text-sm font-bold cursor-pointer"
                  >
                    {artist.name}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => onNavigateToStep(1)}
                  className="text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                >
                  Not set - Click to add
                </button>
              )}
            </div>
          </div>

          {/* Date & Time - Clickable */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</h3>
            <button
              onClick={() => onNavigateToStep(2)}
              className="text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-left"
            >
              {formData.date && formData.startTime
                ? `${formatDisplayDate(formData.date)} at ${formatDisplayTime(formData.startTime)}`
                : 'Not set - Click to add'}
              {formData.endTime && ` - ${formatDisplayTime(formData.endTime)}`}
            </button>
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