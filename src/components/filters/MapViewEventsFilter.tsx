// src/components/filters/MapViewEventsFilter.tsx
import { useState, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import { useEvents } from "@/context/EventsContext";
import { getFormattedDateRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';

const filters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Weekend", value: "thisWeekend" },
  { label: "Next Week", value: "nextWeek" },
  { label: "Next Weekend", value: "nextWeekend" },
];

function getDateRangeForFilter(filter: string) {
  return getFormattedDateRange(filter as DateRangeFilter);
}

export function MapViewEventsFilter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today"); // Default to today
  const { setDateRange } = useEvents();

  // Wrap the filter change logic in useCallback so it's stable.
  const handleFilterChange = useCallback((filter: string) => {
    const filterMap: Record<string, string> = {
      "today": "today",
      "thisWeek": "thisWeek",
      "thisWeekend": "thisWeekend",
      "nextWeek": "nextWeek",
      "nextWeekend": "nextWeekend"
    };
    const mappedFilter = filterMap[filter] || "today";
    setDateRange(mappedFilter);
  }, [setDateRange]);

  // Wrap handleFilterSelect in useCallback.
  const handleFilterSelect = useCallback((filter: string) => {
    setSelectedFilter(filter);
    getDateRangeForFilter(filter);
    handleFilterChange(filter);
    setIsExpanded(false);
  }, [handleFilterChange]);

  // Call once on mount with the default filter "today"
  useEffect(() => {
    handleFilterSelect("today");
  }, [handleFilterSelect]);

  return (
    <div className="fixed bottom-20 md:bottom-10 left-4 z-50 flex flex-col items-center">
      {isExpanded && (
        <div className="map-filter-dropdown">
          {filters
            .filter(f => f.value !== selectedFilter)
            .map(filter => (
              <button
                key={filter.value}
                className="map-filter-option"
                onClick={() => handleFilterSelect(filter.value)}
              >
                {filter.label}
              </button>
            ))}
        </div>
      )}
      <button
        className="map-filter-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className="w-4 h-4 mr-2" />
        {filters.find(f => f.value === selectedFilter)?.label || "Filters"}
      </button>
    </div>
  );
}