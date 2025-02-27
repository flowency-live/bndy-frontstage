// src/components/events/steps/DetailsStep/TicketSection.tsx
import { ChevronDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { PriceInput } from "@/components/ui/price-input";
import type { EventFormData } from '@/lib/types';
import { cn } from "@/lib/utils";

interface TicketSectionProps {
    form: UseFormReturn<EventFormData>;
    isExpanded: boolean;
    onToggle: () => void;
}

export function TicketSection({ form, isExpanded, onToggle }: TicketSectionProps) {
    return (
        <div className="border border-white/30 rounded-lg p-6 space-y-4">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={onToggle}
            >
                <h3 className="text-sm font-semibold text-primary">Ticket Information</h3>
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
                        name="ticketPrice"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl>
                                    <PriceInput {...field} value={field.value || ''} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ticketUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type="url"
                                        {...field}
                                        className="bg-background/50 backdrop-blur-sm border-accent/20"
                                        placeholder="Ticket Website (optional)"
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