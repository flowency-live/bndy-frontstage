import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { EventSection } from './EventSection';
import { TicketSection } from './TicketSection';
import { ConflictWarning } from '../DateStep/ConflictWarning';
import { checkEventConflicts } from '@/lib/services/event-service';
import type { EventFormData, DateConflict } from '@/lib/types';
import { RecurringSection } from './RecurringSection';

interface DetailsStepProps {
  form: UseFormReturn<EventFormData>;
  loading: boolean;
  onSubmit: (data: EventFormData) => Promise<void>;
  onBack?: () => void;
}

export function DetailsStep({ form, loading, onSubmit, onBack }: DetailsStepProps) {
  const [showEventSection, setShowEventSection] = useState(true);
  const [showTicketSection, setShowTicketSection] = useState(false);
  const [showRecurringSection, setShowRecurringSection] = useState(false);
  const [conflicts, setConflicts] = useState<DateConflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Watch for changes in key fields that could affect conflicts
  const venue = form.watch('venue');
  const artists = form.watch('artists');
  const date = form.watch('date');
  const isOpenMic = form.watch('isOpenMic');
  
  // Auto-populate event name if empty
  const eventName = form.watch('name');

  // Load initial conflicts from form and then recheck
  useEffect(() => {
    // First, load any existing conflicts from the form
    const formConflicts = form.getValues('dateConflicts');
    if (Array.isArray(formConflicts)) {
      setConflicts(formConflicts as DateConflict[]);
    }
  }, [form]);

  // Re-run conflict check when key fields change
  useEffect(() => {
    const recheckConflicts = async () => {
      // Skip if we don't have the necessary data to check conflicts
      if (!venue?.id || !date || (!isOpenMic && (!artists || artists.length === 0))) {
        return;
      }

      setIsCheckingConflicts(true);
      try {
        const { conflicts: newConflicts, fullMatchConflict } = await checkEventConflicts({
          venue: venue,
          artists: artists,
          date: new Date(date),
          isOpenMic: isOpenMic ?? false,
        });

        // Map conflicts to your DateConflict type
        const typedConflicts: DateConflict[] = newConflicts.map(conflict => ({
          ...conflict,
          type: conflict.type === 'exact_duplicate'
            ? 'exact_duplicate'
            : (conflict.type === 'venue' ? 'venue' : 'artist')
        }));

        setConflicts(typedConflicts);
        
        // Update the form with the latest conflicts
        form.setValue('dateConflicts', typedConflicts);
        
        // Set hasBlockingConflict for button disable logic
        const hasBlocking = fullMatchConflict || typedConflicts.some(c => c.type === 'exact_duplicate');
        setHasBlockingConflict(hasBlocking);
      } catch (error) {
        console.error("Error rechecking conflicts:", error);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    // Recheck conflicts when relevant fields change
    recheckConflicts();
  }, [form, venue, artists, date, isOpenMic]);

  // Track if there are any blocking conflicts
  const [hasBlockingConflict, setHasBlockingConflict] = useState(false);

  // Auto-populate event name based on artist and venue
  useEffect(() => {
    if (!eventName && venue?.name) {
      let defaultName = '';
      if (isOpenMic) {
        defaultName = `Open Mic @ ${venue.name}`;
      } else if (artists && artists.length > 0) {
        defaultName = artists.length === 1
          ? `${artists[0].name} @ ${venue.name}`
          : `${artists[0].name} & others @ ${venue.name}`;
      }
      if (defaultName) {
        form.setValue('name', defaultName);
      }
    }
  }, [eventName, venue, artists, isOpenMic, form]);

  return (
    <div className="space-y-6">
      {conflicts.length > 0 && (
        <ConflictWarning conflicts={conflicts} />
      )}

      <EventSection
        form={form}
        isExpanded={showEventSection}
        onToggle={() => setShowEventSection(prev => !prev)}
      />

      <TicketSection
        form={form}
        isExpanded={showTicketSection}
        onToggle={() => setShowTicketSection(prev => !prev)}
      />

      <RecurringSection
        form={form}
        isExpanded={showRecurringSection}
        onToggle={() => setShowRecurringSection(!showRecurringSection)}
      />

      <div className="flex gap-4 mt-6">
        {onBack && (
          <Button variant="outline" className="flex-1" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-[var(--primary)] text-white rounded-full px-6 py-3"
          disabled={loading || hasBlockingConflict || isCheckingConflicts}
          onClick={() => form.handleSubmit(onSubmit)()}
        >
          {isCheckingConflicts ? 'Checking conflicts...' : 
           loading ? 'Creating...' : 
           'Create Event'}
        </Button>
      </div>
    </div>
  );
}