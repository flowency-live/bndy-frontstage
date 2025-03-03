import { ChevronDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
    <div className="border border-[var(--primary)] rounded-lg p-6 space-y-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-sm font-semibold text-[var(--primary)]">
          Ticket Information
        </h3>
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
                  <PriceInput
                    {...field}
                    value={field.value || ''}
                    className="bg-transparent border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                  />
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
                    className="bg-transparent border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
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
