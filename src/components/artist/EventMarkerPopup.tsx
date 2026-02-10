"use client";

import { useState } from "react";
import Link from "next/link";
import { Event } from "@/lib/types";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface EventMarkerPopupProps {
  events: Event[];
  onClose: () => void;
}

/**
 * EventMarkerPopup - Lightweight popup for map marker clicks
 *
 * Features:
 * - Displays event date, time, and venue
 * - Venue name links to venue page
 * - Navigation for multiple events at same location
 * - No API calls - uses data already available
 */
export default function EventMarkerPopup({ events, onClose }: EventMarkerPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle empty events array
  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 min-w-[200px]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-slate-500 text-sm">No event data</p>
      </div>
    );
  }

  const currentEvent = events[currentIndex];
  const hasMultipleEvents = events.length > 1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === events.length - 1;

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const eventDate = new Date(currentEvent.date);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 min-w-[220px] max-w-[280px] relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>

      {/* Event details */}
      <div className="pr-6">
        {/* Date */}
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          {formatEventDate(eventDate)}
        </p>

        {/* Time */}
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {formatTime(currentEvent.startTime)}
          {currentEvent.endTime && ` - ${formatTime(currentEvent.endTime)}`}
        </p>

        {/* Venue */}
        <div className="mt-2 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <Link
            href={`/venues/${currentEvent.venueId}`}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline"
          >
            {currentEvent.venueName}
          </Link>
        </div>

        {/* City */}
        {currentEvent.venueCity && (
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-5">
            {currentEvent.venueCity}
          </p>
        )}
      </div>

      {/* Navigation for multiple events */}
      {hasMultipleEvents && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous event"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {currentIndex + 1} of {events.length}
          </span>

          <button
            onClick={handleNext}
            disabled={isLast}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next event"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
