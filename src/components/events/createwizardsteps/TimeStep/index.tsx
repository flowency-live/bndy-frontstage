// src/components/events/createwizardsteps/TimeStep/index.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { TimeSelect } from '@/components/ui/time-select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventFormData } from '@/lib/types';

interface TimeStepProps {
    form: UseFormReturn<EventFormData>;
    onComplete: () => void;
    onBack?: () => void;
}

export function TimeStep({ form, onComplete, onBack }: TimeStepProps) {
    const [showEndTime, setShowEndTime] = useState(!!form.getValues('endTime'));

    const adjustTimes = (startTime: string, endTime: string) => {
        const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
        const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

        if (startMinutes >= endMinutes) {
            // If start time is after or equal to end time, set end time to 30 mins after
            const newEndMinutes = startMinutes + 30;
            const newEndHours = Math.floor(newEndMinutes / 60) % 24;
            const newEndMins = newEndMinutes % 60;
            const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}`;
            form.setValue('endTime', newEndTime);
        }
    };

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                            <TimeSelect
                                {...field}
                                placeholder="Add Start Time"
                                onChange={(time) => {
                                    field.onChange(time);
                                    if (showEndTime && form.getValues('endTime')) {
                                        const endTime = form.getValues('endTime');
                                        if (endTime) {
                                            adjustTimes(time, endTime);
                                        }
                                    } else if (!form.getValues('endTime')) {
                                        // Default end time to 3 hours after start
                                        const [hours, minutes] = time.split(':').map(Number);
                                        const endHours = (hours + 3) % 24;
                                        const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                        form.setValue('endTime', endTime);
                                    }
                                }}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="showEndTime"
                    checked={showEndTime}
                    onCheckedChange={(checked) => {
                        setShowEndTime(checked as boolean);
                        if (!checked) {
                            form.setValue('endTime', undefined);
                        } else if (form.getValues('startTime') && !form.getValues('endTime')) {
                            // Default end time to 3 hours after start when enabling
                            const [hours, minutes] = form.getValues('startTime').split(':').map(Number);
                            const endHours = (hours + 3) % 24;
                            const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            form.setValue('endTime', endTime);
                        }
                    }}
                />
                <Label htmlFor="showEndTime">Add End Time</Label>
            </div>

            {showEndTime && (
                <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                                <TimeSelect
                                    {...field}
                                    placeholder="Add End Time"
                                    onChange={(time) => {
                                        field.onChange(time);
                                        if (form.getValues('startTime')) {
                                            adjustTimes(form.getValues('startTime'), time);
                                        }
                                    }}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}

            <div className="flex gap-4 mt-6">
                {onBack && (
                    <Button variant="outline" className="flex-1" onClick={onBack}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                )}
                <Button
                    onClick={onComplete}
                    disabled={!form.getValues('startTime')}
                    className="flex-1"
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}