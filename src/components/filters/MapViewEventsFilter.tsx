// src/components/filters/EventQuickFilterButton.tsx
import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { useEvents } from "@/context/EventsContext";
import { getFormattedDateRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';


// Define filter options
const filters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Weekend", value: "thisWeekend" },
  { label: "Next Week", value: "nextWeek" },
  { label: "Next Weekend", value: "nextWeekend" },
];

// Date range calculation function
// Updated getDateRangeForFilter function

function getDateRangeForFilter(filter: string) {
  // For debugging, uncomment this line
  // debugDateFilters();
  
  return getFormattedDateRange(filter as DateRangeFilter);
}

export function MapViewEventsFilter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today"); // Default to today
  const { setDateRange } = useEvents();

  // Add detailed debugging
  useEffect(() => {
    console.log("MapViewEventsFilter mounted with selectedFilter:", selectedFilter);
    handleFilterSelect(selectedFilter);
  }, []);
  
  const handleFilterSelect = (filter: string) => {
    console.log(`Selected filter: ${filter}`);
    // Update the state first
    setSelectedFilter(filter);
    
    // Get date range
    const { startDate, endDate } = getDateRangeForFilter(filter);
    console.log(`Date range: ${startDate} to ${endDate}`);
    
    // IMPORTANT: Use the filter parameter here, not the selectedFilter state
    // as state updates are asynchronous
    handleFilterChange(filter, startDate, endDate);
    setIsExpanded(false);
  };
  
  // Convert date range to context's expected format
  const handleFilterChange = (filter: string, startDate: string, endDate: string) => {
    console.log(`Setting date range for: ${filter}`);
    // Map the filter values to the format expected by EventsContext
    const filterMap: Record<string, string> = {
      "today": "today",
      "thisWeek": "thisWeek",
      "thisWeekend": "thisWeekend",
      "nextWeek": "nextWeek",
      "nextWeekend": "nextWeekend"
    };
    
    const mappedFilter = filterMap[filter] || "today";
    console.log(`Mapped filter: ${mappedFilter}`);
    
    // Set the date range in the context
    setDateRange(mappedFilter);
  };

  return (
    <div className="fixed bottom-10 left-4 z-50 flex flex-col items-center">
      {isExpanded && (
        <div className="flex flex-col space-y-2 mb-2 transition-all duration-300">
          {filters
            .filter(f => f.value !== selectedFilter)
            .map(filter => (
              <button
                key={filter.value}
                className="w-full px-4 py-2 rounded-md shadow-md bg-[var(--background)] text-[var(--foreground)] border border-gray-200 dark:border-gray-700"
                onClick={() => handleFilterSelect(filter.value)}
              >
                {filter.label}
              </button>
            ))}
        </div>
      )}

      <button
        className="bg-[var(--primary)] hover:opacity-90 text-white rounded-full px-6 py-3 shadow-lg flex items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className="w-4 h-4 mr-2" />
        {filters.find(f => f.value === selectedFilter)?.label || "Filters"}
      </button>
    </div>
  );
}