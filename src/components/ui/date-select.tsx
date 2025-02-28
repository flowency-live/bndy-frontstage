// src/components/ui/date-select.tsx
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateSelectProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  conflicts?: Array<{
    type: 'venue' | 'artist';
    name: string;
    existingEvent: {
      name: string;
      startTime: string;
    };
  }>;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(date: Date): string {
  const day = date.getDate()
  const formatted = format(date, "eeee d MMM yyyy")
  return formatted.replace(` ${day} `, ` ${getOrdinal(day)} `)
}

export function DateSelect({ date, onSelect, className, conflicts }: DateSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onSelect?.(date)
    setOpen(false)
  }

  // Calculate the minimum date (today at midnight)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const disabledDays = [
    { before: today } // Disable all dates before today
  ]

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-max justify-start text-left font-normal",
              open && "ring-2 ring-primary border-transparent",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDate(date) : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-4",
            "ring-2 ring-primary border-0"
          )} 
          align="start"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabledDays}
            showOutsideDays={true}
            className="p-0"
            weekStartsOn={1}
            footer={conflicts && conflicts.length > 0 ? (
              <div className="mt-4 p-2 bg-yellow-500/10 rounded-md border border-yellow-500/50">
                <p className="text-sm font-medium text-yellow-500">Scheduling conflicts:</p>
                <ul className="mt-1 text-sm text-muted-foreground">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>
                      {conflict.type === 'venue' ? 'Venue' : 'Artist'} {conflict.name} has event "{conflict.existingEvent.name}" at {conflict.existingEvent.startTime}
                    </li>
                  ))}
                </ul>
              </div>
            ) : undefined}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
                "hover:bg-accent rounded-md"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal",
                "hover:bg-primary hover:text-primary-foreground",
                "rounded-md transition-colors aria-selected:opacity-100"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "border border-primary font-bold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_hidden: "invisible"
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}