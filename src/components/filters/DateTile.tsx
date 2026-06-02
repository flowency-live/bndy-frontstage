// src/components/filters/DateTile.tsx
"use client";

import { memo } from "react";

interface DateTileProps {
  dayName: string;      // "MON"
  dayNum: number;       // 2
  monthShort: string;   // "JUN"
  isSelected: boolean;
  hasEvents: boolean;
  eventCount?: number;
  onClick: () => void;
}

/**
 * Individual date tile for the map date strip.
 * Glass-morphism dark aesthetic with cyan highlight for selection.
 */
export const DateTile = memo(function DateTile({
  dayName,
  dayNum,
  monthShort,
  isSelected,
  hasEvents,
  eventCount,
  onClick,
}: DateTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        date-tile relative flex flex-col items-center justify-center
        min-w-[52px] px-3 py-2 rounded-xl
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
        ${isSelected
          ? "date-tile-selected"
          : "date-tile-default hover:date-tile-hover"
        }
      `}
      aria-label={`${dayName} ${dayNum} ${monthShort}${hasEvents ? `, ${eventCount} events` : ""}`}
      aria-pressed={isSelected}
    >
      {/* Event indicator dot */}
      {hasEvents && (
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500"
          aria-hidden="true"
        />
      )}

      {/* Day name: MON, TUE, etc */}
      <span className="date-tile-day text-[10px] font-semibold tracking-wide uppercase">
        {dayName}
      </span>

      {/* Day number: 1, 2, 3... */}
      <span className="date-tile-num text-xl font-bold leading-tight">
        {dayNum}
      </span>

      {/* Month: JUN, JUL, etc */}
      <span className="date-tile-month text-[9px] uppercase opacity-60">
        {monthShort}
      </span>

      {/* Event count badge (only if selected and has events) */}
      {isSelected && hasEvents && eventCount && eventCount > 0 && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium text-cyan-400">
          {eventCount} gig{eventCount !== 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
});
