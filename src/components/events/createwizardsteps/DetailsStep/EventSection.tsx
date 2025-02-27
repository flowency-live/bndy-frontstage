// src/components/events/steps/DetailsStep/EventSection.tsx
import { ChevronDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { EventFormData } from '@/lib/types';
import { cn } from "@/lib/utils";

interface EventSectionProps {
    form: UseFormReturn<EventFormData>;
    isExpanded: boolean;
    onToggle: () => void;
}

export function EventSection({ form, isExpanded, onToggle }: EventSectionProps) {
    return (
        <div className="border border-white/30 rounded-lg p-6 space-y-4">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={onToggle}
            >
                <h3 className="text-sm font-semibold text-primary">Event Information</h3>
                <ChevronDown
                    className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        isExpanded && "rotate-180"
                    )}
                />
            </div>

            {isExpanded && (
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormControl>
                                <Input
                                    {...field}
                                    className="bg-background/50 backdrop-blur-sm border-accent/20 text-lg"
                                    value={field.value || `${form.watch('artists')[0]?.name} @ ${form.watch('venue').name}`}
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            </FormControl>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        className="bg-background/50 backdrop-blur-sm border-accent/20 min-h-[120px]"
                                        placeholder="Add any additional details about the event..."
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="eventUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type="url"
                                        {...field}
                                        className="bg-background/50 backdrop-blur-sm border-accent/20"
                                        placeholder="Event Website (optional)"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    );
}