import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateSelect } from "@/components/ui/date-select";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RecurringSectionProps {
  form: UseFormReturn<EventFormData>;
  isExpanded: boolean;
  onToggle: () => void;
}

export function RecurringSection({ form, isExpanded, onToggle }: RecurringSectionProps) {
  const handleToggle = () => {
    if (!isExpanded) {
      if (!form.getValues('recurring')) {
        form.setValue('recurring', {
          frequency: "weekly",
          endDate: ""
        });
      }
    } else {
      form.setValue('recurring', undefined);
    }
    setTimeout(() => {
      onToggle();
    }, 0);
  };

  return (
    <Card className="border border-[var(--primary)] rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--accent)]"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRecurring"
            checked={isExpanded}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
          />
          <label htmlFor="isRecurring" className="text-sm font-medium">
            Recurring Event
          </label>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {isExpanded && (
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="recurring.frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recurring.endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <DateSelect
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(date?.toISOString().split('T')[0])
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      )}
    </Card>
  );
}
