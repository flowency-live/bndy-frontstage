// src/components/events/createwizardsteps/DateStep/index.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { DateSelect } from "@/components/ui/date-select";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { checkEventConflicts } from '@/lib/services/event-service';
import { ConflictWarning } from './ConflictWarning';
import type { EventFormData, DateConflict } from '@/lib/types';

// Define a type that matches what DateSelect expects
type DateSelectConflict = {
  type: 'venue' | 'artist';
  name: string;
  existingEvent: {
    name: string;
    startTime: string;
  };
};

interface DateStepProps {
    form: UseFormReturn<EventFormData>;
    onComplete: () => void;
    onBack?: () => void;
}

export function DateStep({ form, onComplete, onBack }: DateStepProps) {
    const [conflicts, setConflicts] = useState<DateConflict[]>([]);
    const [isNextDisabled, setIsNextDisabled] = useState(false);
    const [dateSelected, setDateSelected] = useState(false);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

    const handleDateSelect = async (date: Date | undefined) => {
        if (!date) {
            setDateSelected(false);
            return;
        }

        const dateStr = date.toISOString().split("T")[0];
        setDateSelected(true);
        form.setValue('date', dateStr);

        // Don't run conflict check if we don't have a venue or artists yet
        if (!form.getValues('venue')?.id || (
            !form.getValues('isOpenMic') && 
            (!form.getValues('artists') || form.getValues('artists').length === 0)
        )) {
            return;
        }

        setIsCheckingConflicts(true);
        try {
            const { conflicts: newConflicts, fullMatchConflict } = await checkEventConflicts({
                venue: form.getValues('venue'),
                artists: form.getValues('artists'),
                date: date,
                isOpenMic: form.getValues('isOpenMic') ?? false,
            });

            // Ensure we're only setting conflicts with the correct type
            const typedConflicts: DateConflict[] = newConflicts.map(conflict => ({
                ...conflict,
                // TypeScript needs us to explicitly define the type for proper narrowing
                type: conflict.type === 'exact_duplicate' 
                    ? 'exact_duplicate' 
                    : (conflict.type === 'venue' ? 'venue' : 'artist')
            }));

            setConflicts(typedConflicts);
            
            // Also store the conflicts in the form data for later steps
            form.setValue('dateConflicts', typedConflicts);
            
            setIsNextDisabled(fullMatchConflict); // Block Next only for exact duplicates

            // Auto-progress ONLY IF no blocking conflicts and no warnings
            if (!fullMatchConflict && newConflicts.length === 0) {
                onComplete();
            }
        } catch (error) {
            console.error("Error running conflict check:", error);
        } finally {
            setIsCheckingConflicts(false);
        }
    };

    // Filter conflicts and cast to the expected type for DateSelect
    const dateSelectConflicts: DateSelectConflict[] = conflicts
        .filter(conflict => conflict.type === 'venue' || conflict.type === 'artist')
        .map(conflict => ({
            type: conflict.type as 'venue' | 'artist', // Extra type assertion
            name: conflict.name,
            existingEvent: conflict.existingEvent
        }));

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Select Date</FormLabel>
                        <FormControl>
                            <DateSelect
                                date={field.value ? new Date(field.value) : undefined}
                                onSelect={handleDateSelect}
                                className="w-full"
                                conflicts={dateSelectConflicts}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            {conflicts.length > 0 && (
                <div className="mt-4">
                    <ConflictWarning conflicts={conflicts} />
                </div>
            )}

            {dateSelected && (
                <div className="flex gap-4 mt-6">
                    {onBack && (
                        <Button variant="outline" className="flex-1" onClick={onBack}>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                    )}
                    <Button
                        className="flex-1"
                        disabled={isNextDisabled || isCheckingConflicts}
                        onClick={onComplete}
                    >
                        {isCheckingConflicts ? 'Checking...' : 'Next'}
                        {!isCheckingConflicts && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                </div>
            )}
        </div>
    );
}