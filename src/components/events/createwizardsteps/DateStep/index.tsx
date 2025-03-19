import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { checkEventConflicts } from '@/lib/services/event-service';
import { ConflictWarning } from './ConflictWarning';
import type { EventFormData, DateConflict } from '@/lib/types';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateStepProps {
  form: UseFormReturn<EventFormData>;
  onComplete: () => void;
  onBack?: () => void;
}

export function DateStep({ form, onComplete }: DateStepProps) {
  const [conflicts, setConflicts] = useState<DateConflict[]>([]);
  const [hasBlockingConflict, setHasBlockingConflict] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get the currently selected date from the form
  const selectedDate = form.watch('date') ? new Date(form.watch('date')) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    const dateStr = date.toISOString().split("T")[0];
    form.setValue('date', dateStr);
    setShowDatePicker(false);

    // Determine if we have enough data to check for conflicts
    const hasVenue = !!form.getValues('venue')?.id;
    const hasArtist = !form.getValues('isOpenMic') && form.getValues('artists')?.length > 0;

    if (hasVenue && (hasArtist || form.getValues('isOpenMic'))) {
      setIsCheckingConflicts(true);
      try {
        const { conflicts: newConflicts, fullMatchConflict } = await checkEventConflicts({
          venue: form.getValues('venue'),
          artists: form.getValues('artists'),
          date: date,
          isOpenMic: form.getValues('isOpenMic') ?? false,
        });

        // Map conflicts to your DateConflict type
        const typedConflicts: DateConflict[] = newConflicts.map(conflict => ({
          ...conflict,
          type: conflict.type === 'exact_duplicate'
            ? 'exact_duplicate'
            : (conflict.type === 'venue' ? 'venue' : 'artist')
        }));

        setConflicts(typedConflicts);
        setHasBlockingConflict(fullMatchConflict);
        form.setValue('dateConflicts', typedConflicts);

        // If no conflicts at all, auto-progress immediately
        if (typedConflicts.length === 0) {
          onComplete();
        }
        // Otherwise, if there are partial conflicts (and not blocking), allow manual progression
      } catch (error) {
        console.error("Error running conflict check:", error);
      } finally {
        setIsCheckingConflicts(false);
      }
    } else {
      onComplete();
    }
  };

  const formatSelectedDate = (date: Date | undefined): string => {
    if (!date) return 'Select date';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';
    return `${day}${suffix} ${month} ${year}`;
  };

  return (
    <div className="px-6 py-6">
      <label className="block mb-2 text-sm text-[var(--foreground-muted)]">
        Select Date
      </label>
      
      {/* Date selection button with orange border and focus ring */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Calendar className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <button
          type="button"
          className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
          style={{ borderColor: 'var(--primary)' }}
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          {formatSelectedDate(selectedDate)}
        </button>
      </div>
      
      {/* Calendar picker container */}
      {showDatePicker && (
        <div className="mt-2 rounded-lg overflow-hidden border border-[var(--primary)]">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={[{ before: today }]}
            fromMonth={today}
            showOutsideDays={true}
            className="event-calendar"
            modifiersClassNames={{
              selected: 'calendar-day-selected',
              today: 'calendar-day-today',
              disabled: 'calendar-day-disabled',
              outside: 'calendar-day-outside',
            }}
            classNames={{
              months: "calendar-months",
              month: "calendar-month",
              caption: "calendar-caption",
              caption_label: "calendar-caption-label",
              nav: "calendar-nav",
              nav_button: "calendar-nav-button",
              table: "calendar-table",
              head_row: "calendar-head-row",
              head_cell: "calendar-head-cell",
              row: "calendar-row",
              cell: "calendar-cell",
              day: "calendar-day",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="w-6 h-6" />,
              IconRight: () => <ChevronRight className="w-6 h-6" />,
            }}
          />
        </div>
      )}

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="mt-4">
          <ConflictWarning conflicts={conflicts} />
        </div>
      )}

      {/* Next button: show only if there are partial conflicts (non-blocking) */}
      {selectedDate && !showDatePicker && conflicts.length > 0 && !hasBlockingConflict && (
        <div className="flex justify-end mt-6">
          <Button
            className="bg-[var(--primary)] text-white rounded-full px-6 py-3"
            disabled={isCheckingConflicts}
            onClick={() => {
              if (!isCheckingConflicts) {
                onComplete();
              }
            }}
          >
            {isCheckingConflicts ? 'Checking...' : 'Next'}
            {!isCheckingConflicts && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      )}
    </div>
  );
}
