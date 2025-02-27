// src/components/events/createwizardsteps/DetailsStep/index.tsx
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChevronLeft } from 'lucide-react';
import { EventSection } from './EventSection';
import { TicketSection } from './TicketSection';
import { ConflictWarning } from '../DateStep/ConflictWarning';
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
    
    // Store conflicts in a local state instead of reading directly from the form
    const [conflicts, setConflicts] = useState<DateConflict[]>([]);
    
    // Update local conflicts when form values change
    useEffect(() => {
        // Safely access form values - need to cast to the correct type
        const formConflicts = form.getValues('dateConflicts');
        if (Array.isArray(formConflicts)) {
            setConflicts(formConflicts as DateConflict[]);
        }
    }, [form]);
    
    // Check if there's a blocking conflict
    const hasBlockingConflict = conflicts.some(
        conflict => conflict.type === 'venue' || conflict.type === 'artist'
    ) || false;

    // Generate default event name if not provided
    const eventName = form.watch('name');
    const venue = form.watch('venue');
    const artists = form.watch('artists');
    const isOpenMic = form.watch('isOpenMic');

    // Auto-populate event name if empty
    useEffect(() => {
        if (!eventName && venue?.name) {
            let defaultName = '';
            if (isOpenMic) {
                defaultName = `Open Mic @ ${venue.name}`;
            } else if (artists && artists.length > 0) {
                if (artists.length === 1) {
                    defaultName = `${artists[0].name} @ ${venue.name}`;
                } else {
                    // Multiple artists
                    defaultName = `${artists[0].name} & others @ ${venue.name}`;
                }
            }
            
            if (defaultName) {
                form.setValue('name', defaultName);
            }
        }
    }, [eventName, venue, artists, isOpenMic, form]);

    return (
        <div className="space-y-6">
            {/* Show conflicts first if they exist */}
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
                    className="flex-1"
                    disabled={loading || hasBlockingConflict}
                    onClick={() => form.handleSubmit(onSubmit)()}
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </Button>
            </div>
        </div>
    );
}