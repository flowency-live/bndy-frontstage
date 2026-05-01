"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { Event } from "@/lib/types";
import { getUserLocation, calculateDistance, formatDistance, Location } from "@/lib/utils/distance";
import { ProfileDateGroup, formatDateForGroup, groupEventsByDate } from "./ProfileDateGroup";

interface ProfileDistanceGroupProps {
  events: Event[];
  counterpartType: "artist" | "venue";
  onEventClick: (event: Event) => void;
}

/**
 * Distance range definitions
 */
interface DistanceRange {
  key: string;
  label: string;
  min: number;
  max: number;
}

const DISTANCE_RANGES: DistanceRange[] = [
  { key: "nearby", label: "NEARBY", min: 0, max: 1 },
  { key: "5mi", label: "WITHIN 5 MILES", min: 1, max: 5 },
  { key: "10mi", label: "WITHIN 10 MILES", min: 5, max: 10 },
  { key: "15mi", label: "WITHIN 15 MILES", min: 10, max: 15 },
  { key: "25mi", label: "WITHIN 25 MILES", min: 15, max: 25 },
  { key: "further", label: "FURTHER AWAY", min: 25, max: Infinity },
];

interface EventWithDistance extends Event {
  distanceMiles: number;
}

/**
 * ProfileDistanceGroup - Groups events by distance from user's location
 *
 * Features:
 * - Requests user location permission
 * - Groups events into distance ranges: <1mi, <5mi, <10mi, <15mi, <25mi, 25+mi
 * - Collapsible sections with only closest section expanded by default
 * - Falls back to showing all events if location unavailable
 */
export default function ProfileDistanceGroup({
  events,
  counterpartType,
  onEventClick,
}: ProfileDistanceGroupProps) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied">("loading");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Request user location on mount
  useEffect(() => {
    getUserLocation().then((location) => {
      if (location) {
        setUserLocation(location);
        setLocationStatus("granted");
      } else {
        setLocationStatus("denied");
      }
    });
  }, []);

  // Calculate distances and group events
  const { distanceGroups, nonEmptyRanges } = useMemo(() => {
    if (!userLocation) {
      return { distanceGroups: new Map<string, EventWithDistance[]>(), nonEmptyRanges: [] };
    }

    // Calculate distance for each event
    const eventsWithDistance: EventWithDistance[] = events
      .filter((event) => event.location && event.location.lat !== 0 && event.location.lng !== 0)
      .map((event) => ({
        ...event,
        distanceMiles: calculateDistance(userLocation, event.location),
      }))
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    // Group into distance ranges
    const groups = new Map<string, EventWithDistance[]>();
    DISTANCE_RANGES.forEach((range) => groups.set(range.key, []));

    eventsWithDistance.forEach((event) => {
      const range = DISTANCE_RANGES.find(
        (r) => event.distanceMiles >= r.min && event.distanceMiles < r.max
      );
      if (range) {
        groups.get(range.key)!.push(event);
      }
    });

    // Filter to non-empty ranges
    const nonEmpty = DISTANCE_RANGES.filter((range) => groups.get(range.key)!.length > 0);

    return { distanceGroups: groups, nonEmptyRanges: nonEmpty };
  }, [events, userLocation]);

  // Initialize expanded sections - expand first non-empty section
  useEffect(() => {
    if (nonEmptyRanges.length > 0 && expandedSections.size === 0) {
      setExpandedSections(new Set([nonEmptyRanges[0].key]));
    }
  }, [nonEmptyRanges, expandedSections.size]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  // Loading state
  if (locationStatus === "loading") {
    return (
      <div className="py-8 text-center">
        <MapPin className="w-6 h-6 mx-auto mb-2 text-[var(--lv-orange)] animate-pulse" />
        <p className="text-[var(--lv-text-2)] text-sm">Getting your location...</p>
      </div>
    );
  }

  // Location denied state
  if (locationStatus === "denied" || !userLocation) {
    return (
      <div className="py-8 text-center">
        <MapPin className="w-6 h-6 mx-auto mb-2 text-[var(--lv-text-3)]" />
        <p className="text-[var(--lv-text-2)] text-sm mb-1">Location access needed</p>
        <p className="text-[var(--lv-text-3)] text-xs">
          Enable location to sort events by distance
        </p>
      </div>
    );
  }

  // No events with location data
  if (nonEmptyRanges.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[var(--lv-text-3)]">No events with location data</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nonEmptyRanges.map((range) => {
        const rangeEvents = distanceGroups.get(range.key)!;
        const eventCount = rangeEvents.length;
        const isExpanded = expandedSections.has(range.key);

        // Group events by date within this distance range
        const eventsByDate = groupEventsByDate(rangeEvents);

        return (
          <div key={range.key} className="profile-section-group">
            {/* Collapsible Section header */}
            <button
              type="button"
              className="profile-section-header-toggle"
              onClick={() => toggleSection(range.key)}
              aria-expanded={isExpanded}
              aria-controls={`distance-section-${range.key}`}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--lv-cyan)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--lv-text-3)]" />
                )}
                <h3 className="profile-section-title">{range.label}</h3>
              </div>
              <span className="profile-section-count">
                {eventCount} {eventCount === 1 ? "event" : "events"}
              </span>
            </button>

            {/* Events grouped by date within this distance range */}
            {isExpanded && (
              <div
                id={`distance-section-${range.key}`}
                className="profile-date-events"
              >
                {Array.from(eventsByDate.entries()).map(([dateKey, dateEvents]) => {
                  const { day, monthYear, relativeLabel } = formatDateForGroup(dateKey);

                  // Add distance info to events for display
                  const eventsWithDistanceDisplay = dateEvents.map((event) => ({
                    ...event,
                    distance: (event as EventWithDistance).distanceMiles,
                  }));

                  return (
                    <ProfileDateGroup
                      key={dateKey}
                      day={day}
                      monthYear={monthYear}
                      relativeLabel={relativeLabel}
                      events={eventsWithDistanceDisplay}
                      counterpartType={counterpartType}
                      onEventClick={onEventClick}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
