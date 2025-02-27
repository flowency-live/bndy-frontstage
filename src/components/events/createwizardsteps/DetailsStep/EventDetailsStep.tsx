//src\components\events\createwizardsteps\EventDetailsStep.tsx
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Artist, Venue } from '@/lib/types';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { DateSelect } from "@/components/ui/date-select";
import { PriceInput } from "@/components/ui/price-input";
import { TimeSelect } from "@/components/ui/time-select";
import type { EventFormData } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';
import { checkEventConflicts } from '@/lib/services/event-service';

interface EventDetailsStepProps {
  form: UseFormReturn<EventFormData>;
  loading: boolean;
  onSubmit: (data: EventFormData) => Promise<void>;
  onBack: () => void;
}

export function EventDetailsStep({ form, loading, onSubmit, onBack }: EventDetailsStepProps) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Watch relevant fields for conflict checking
  const date = form.watch('date');
  const startTime = form.watch('startTime');
  const venue = form.watch('venue');
  const artists = form.watch('artists');



  const handleSubmit = async (data: EventFormData) => {
    if (conflicts.length > 0) {
      setShowConflictDialog(true);
    } else {
      await onSubmit(data);
    }
  };

  // Calculate end time based on start time
  const updateEndTime = (newStartTime: string) => {
    const [hours, minutes] = newStartTime.split(':').map(Number);
    const endHours = (hours + 3) % 24;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    form.setValue('endTime', endTime);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

        
        {/* Event Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  // Remove defaultValue prop
                  placeholder={`${form.watch('artists')[0]?.name} @ ${form.watch('venue').name}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date and Price Row */}
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <DateSelect
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString().split("T")[0])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="ticketPrice"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Ticket Price</FormLabel>
                <FormControl>
                  <PriceInput {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Time Row */}
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="startTime"
            defaultValue="19:00"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <TimeSelect
                    {...field}
                    onChange={(time) => {
                      field.onChange(time);
                      // Update end time to be 3 hours later
                      const [hours, minutes] = time.split(':').map(Number);
                      const endHours = (hours + 3) % 24;
                      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      form.setValue('endTime', endTime);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <TimeSelect
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <h3 className="font-medium text-yellow-500">Potential Conflicts Found</h3>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>
                      {conflict.type === 'venue' ? 'Venue' : 'Artist'} {conflict.name} has event "{conflict.existingEvent.name}" at {conflict.existingEvent.startTime}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* URLs */}
        <FormField
          control={form.control}
          name="ticketUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket Website (optional)</FormLabel>
              <FormControl>
                <Input type="url" {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Website (optional)</FormLabel>
              <FormControl>
                <Input type="url" {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !date || !startTime}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>

      {/* Conflict Dialog */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scheduling Conflicts Detected</AlertDialogTitle>
            <AlertDialogDescription>
              <p>This event has scheduling conflicts:</p>
              <ul className="mt-2 list-disc list-inside">
                {conflicts.map((conflict, index) => (
                  <li key={index}>
                    {conflict.type === 'venue' ? 'Venue' : 'Artist'} {conflict.name} has event "{conflict.existingEvent.name}" at {conflict.existingEvent.startTime}
                  </li>
                ))}
              </ul>
              <p>Do you want to create the event anyway?</p>
            </AlertDialogDescription>

          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConflictDialog(false);
                onSubmit(form.getValues());
              }}
            >
              Create Anyway
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}