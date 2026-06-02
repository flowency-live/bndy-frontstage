// src/components/filters/MapDateStrip.tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { DateTile } from "./DateTile";
import { useEvents } from "@/context/EventsContext";
import { format, addDays, startOfDay, isSameDay, parseISO } from "date-fns";

interface DateInfo {
  iso: string;         // "2026-06-02"
  dayName: string;     // "MON"
  dayNum: number;      // 2
  monthShort: string;  // "JUN"
  date: Date;
}

// Generate array of dates for the strip (today + next 13 days = 14 total)
function generateDates(startDate: Date, count: number = 14): DateInfo[] {
  const dates: DateInfo[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(startOfDay(startDate), i);
    dates.push({
      iso: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEE").toUpperCase(),
      dayNum: date.getDate(),
      monthShort: format(date, "MMM").toUpperCase(),
      date,
    });
  }
  return dates;
}

interface MapDateStripProps {
  /** Event counts by date ISO string */
  eventCounts?: Record<string, number>;
}

/**
 * Floating date strip for the map view.
 * Collapsed: Shows current selected date with prev/next arrows.
 * Expanded: Shows scrollable strip of 14 days with event indicators.
 */
export function MapDateStrip({ eventCounts = {} }: MapDateStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setDateRange } = useEvents();

  // Generate date list starting from today
  const dates = useMemo(() => generateDates(new Date()), []);

  // Find current date info
  const currentDateInfo = useMemo(() =>
    dates.find(d => d.iso === selectedDate) || dates[0],
    [dates, selectedDate]
  );

  // Handle date selection
  const handleSelectDate = useCallback((dateInfo: DateInfo) => {
    setSelectedDate(dateInfo.iso);
    // Update context with specific date range (single day)
    setDateRange(`date:${dateInfo.iso}`);
  }, [setDateRange]);

  // Navigate to previous day
  const handlePrevDay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = dates.findIndex(d => d.iso === selectedDate);
    if (currentIndex > 0) {
      handleSelectDate(dates[currentIndex - 1]);
    }
  }, [dates, selectedDate, handleSelectDate]);

  // Navigate to next day
  const handleNextDay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = dates.findIndex(d => d.iso === selectedDate);
    if (currentIndex < dates.length - 1) {
      handleSelectDate(dates[currentIndex + 1]);
    }
  }, [dates, selectedDate, handleSelectDate]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Scroll selected date into view when expanding
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      const selectedIndex = dates.findIndex(d => d.iso === selectedDate);
      const tileWidth = 58; // min-width + gap
      const scrollPosition = Math.max(0, (selectedIndex * tileWidth) - (scrollRef.current.offsetWidth / 2) + (tileWidth / 2));
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  }, [isExpanded, selectedDate, dates]);

  // Check if at start/end for arrow visibility
  const currentIndex = dates.findIndex(d => d.iso === selectedDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < dates.length - 1;

  return (
    <div
      className={`map-date-strip ${isExpanded ? "expanded" : "collapsed"}`}
      role="toolbar"
      aria-label="Date selection"
    >
      {/* Collapsed View */}
      {!isExpanded && (
        <div className="map-date-collapsed">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={!canGoPrev}
            className="map-date-arrow"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleExpanded}
            className="map-date-current"
            aria-expanded={isExpanded}
            aria-label="Expand date picker"
          >
            <span className="map-date-display">
              <span className="font-semibold">{currentDateInfo.dayName}</span>
              <span className="text-lg font-bold mx-1">{currentDateInfo.dayNum}</span>
              <span className="opacity-70">{currentDateInfo.monthShort}</span>
            </span>
            <Calendar className="w-4 h-4 ml-2 opacity-60" />
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={!canGoNext}
            className="map-date-arrow"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="map-date-expanded">
          <button
            type="button"
            onClick={toggleExpanded}
            className="map-date-close"
            aria-label="Collapse date picker"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="map-date-list"
          >
            {dates.map((dateInfo, index) => (
              <div
                key={dateInfo.iso}
                className="date-tile-wrapper"
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <DateTile
                  dayName={dateInfo.dayName}
                  dayNum={dateInfo.dayNum}
                  monthShort={dateInfo.monthShort}
                  isSelected={dateInfo.iso === selectedDate}
                  hasEvents={(eventCounts[dateInfo.iso] ?? 0) > 0}
                  eventCount={eventCounts[dateInfo.iso]}
                  onClick={() => handleSelectDate(dateInfo)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
