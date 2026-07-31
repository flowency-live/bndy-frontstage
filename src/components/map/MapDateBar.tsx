"use client";

// bndy Map v2 — date bar. Quick named ranges + pick-a-day for the next 7 days.
// Drives EventsContext.dateRange (named keys or "date:YYYY-MM-DD"), which the
// map's data query + client filter both already understand. Replaces the legacy
// MapDateStrip when the maplibre engine is active.

import { useMemo } from "react";
import { useEvents } from "@/context/EventsContext";
import { isDateInRangeUniversal } from "@/lib/utils/date-filter-utils";
import type { Event } from "@/lib/types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const RANGES: { key: string; label: string }[] = [
  { key: "today", label: "Tonight" },
  { key: "thisWeekend", label: "Weekend" },
  { key: "thisWeek", label: "This week" },
  { key: "nextWeek", label: "Next week" },
];

function pad(n: number) { return String(n).padStart(2, "0"); }
function iso(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function MapDateBar({ events }: { events: Event[] }) {
  const { dateRange, setDateRange } = useEvents();

  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; }),
    [today],
  );

  // counts from the all-future set so every chip shows its own total
  const rangeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of RANGES) m[r.key] = 0;
    const dayMap: Record<string, number> = {};
    for (const e of events) {
      if (!e.date) continue;
      dayMap[e.date] = (dayMap[e.date] ?? 0) + 1;
      const d = new Date(e.date);
      for (const r of RANGES) if (isDateInRangeUniversal(d, r.key)) m[r.key]++;
    }
    return { m, dayMap };
  }, [events]);

  const isOn = (key: string) => dateRange === key;
  const isDayOn = (d: Date) => dateRange === `date:${iso(d)}`;

  return (
    <div className="bndy-datebar">
      {RANGES.map((r) => (
        <button key={r.key} className={"bndy-chip" + (isOn(r.key) ? " on" : "")} onClick={() => setDateRange(r.key)}>
          <span>{r.label}</span>
          <small>{rangeCounts.m[r.key]} gig{rangeCounts.m[r.key] === 1 ? "" : "s"}</small>
        </button>
      ))}

      <span className="bndy-datebar-sep" aria-hidden />

      {days.map((d, i) => {
        const n = rangeCounts.dayMap[iso(d)] ?? 0;
        const label = i === 0 ? "Today" : i === 1 ? "Tmrw" : DOW[d.getDay()];
        return (
          <button key={iso(d)} className={"bndy-chip bndy-chip-day" + (isDayOn(d) ? " on" : "")} onClick={() => setDateRange(`date:${iso(d)}`)}>
            <span>{label} {d.getDate()}</span>
            <small>{n ? `${n} gig${n === 1 ? "" : "s"}` : MON[d.getMonth()]}</small>
          </button>
        );
      })}
    </div>
  );
}
