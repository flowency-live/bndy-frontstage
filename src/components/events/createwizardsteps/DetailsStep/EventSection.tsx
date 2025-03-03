import { ChevronDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EventFormData } from '@/lib/types';

interface EventSectionProps {
  form: UseFormReturn<EventFormData>;
  isExpanded: boolean;
  onToggle: () => void;
}

export function EventSection({ form, isExpanded, onToggle }: EventSectionProps) {
  return (
    <div className="border border-[var(--primary)] rounded-lg p-6 space-y-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-sm font-semibold text-[var(--primary)]">
          Event Information
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    className="bg-transparent border rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                    value={
                      field.value || `${form.watch('artists')[0]?.name} @ ${form.watch('venue')?.name || ''}`
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    {...field}
                    className="bg-transparent border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)] min-h-[120px]"
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
                    className="bg-transparent border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
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
