// src/components/wizard/steps/MoreDetailsStep.tsx
// Optional details step for description, tickets, and event URL

'use client';

import { useState } from 'react';
import type { EventWizardFormData } from '@/lib/types';

interface MoreDetailsStepProps {
  formData: EventWizardFormData;
  onUpdate: (data: Partial<EventWizardFormData>) => void;
  onNext: () => void;
}

export function MoreDetailsStep({ formData, onUpdate, onNext }: MoreDetailsStepProps) {
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showTicketSection, setShowTicketSection] = useState(false);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add More Details</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Optional - you can skip this step</p>
        </div>

        {/* Event Details Section */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowEventDetails(!showEventDetails)}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Event Information</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showEventDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showEventDetails && (
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Add any additional details about the event..."
                  rows={4}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Event URL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Website
                </label>
                <input
                  type="url"
                  value={formData.eventUrl || ''}
                  onChange={(e) => onUpdate({ eventUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Ticket Section */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowTicketSection(!showTicketSection)}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Ticket Information</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showTicketSection ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTicketSection && (
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Ticketed Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ticketed || false}
                  onChange={(e) => onUpdate({ ticketed: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  This is a ticketed event
                </span>
              </label>

              {formData.ticketed && (
                <>
                  {/* Ticket Information */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ticket Details
                    </label>
                    <input
                      type="text"
                      value={formData.ticketinformation || ''}
                      onChange={(e) => onUpdate({ ticketinformation: e.target.value })}
                      placeholder="e.g. £10 advance, £12 door"
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Ticket URL */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ticket Website
                    </label>
                    <input
                      type="url"
                      value={formData.ticketUrl || ''}
                      onChange={(e) => onUpdate({ ticketUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 px-6 py-4 text-gray-700 dark:text-gray-200 font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="flex-1 rounded-lg bg-orange-500 px-6 py-4 text-white font-semibold transition-colors hover:bg-orange-600"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
