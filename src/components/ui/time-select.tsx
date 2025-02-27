// src/components/ui/time-select.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { formatTime } from '@/lib/utils/date-utils';
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimeSelectProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
  defaultStartIndex?: number;
  placeholder?: string;
}

function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  hours12 = hours12 === 0 ? 12 : hours12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function TimeSelect({
  value,
  onChange,
  className,
  defaultStartIndex = 38,
  placeholder = "Select time"  // Add default
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(defaultStartIndex);
  const listRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState(0);

  // Generate all times (24 hours in 30 min increments)
  const allTimes = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Scroll to selected time when the dropdown opens
  useEffect(() => {
    if (value && open) {
      const selectedIndex = allTimes.indexOf(value);
      if (selectedIndex !== -1) {
        setStartIndex(selectedIndex);
      }
    }
  }, [value, open]);

  // Get current visible window of times
  const visibleTimes = allTimes.slice(startIndex, startIndex + 6);

  const handleScroll = (direction: 'up' | 'down') => {
    setStartIndex(current => {
      if (direction === 'up') {
        if (current === 0) return allTimes.length - 6;
        return Math.max(0, current - 1);
      } else {
        if (current >= allTimes.length - 6) return 0;
        return Math.min(allTimes.length - 6, current + 1);
      }
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEndY = e.touches[0].clientY;
    const direction = touchEndY > touchStartY ? 'down' : 'up';
    handleScroll(direction);
    setTouchStartY(touchEndY);
  };

  // Handle wheel events
  const handleWheel = (e: React.WheelEvent) => {
    handleScroll(e.deltaY > 0 ? 'down' : 'up');
  };

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start text-left font-normal",
            open && "ring-2 ring-primary border-transparent",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? convertTo12Hour(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-full p-0",
          "ring-2 ring-primary border-0"
        )}
        align="start"
      >
        <div className="flex flex-col">
          <Button
            variant="ghost"
            className="h-8 flex items-center justify-center hover:bg-accent"
            onClick={() => handleScroll('up')}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <div
            ref={listRef}
            className="overflow-hidden"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {visibleTimes.map((time) => (
              <div
                key={time}
                className={cn(
                  "px-4 py-2 cursor-pointer transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  time === value && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleTimeSelect(time)}
              >
                {convertTo12Hour(time)}
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            className="h-8 flex items-center justify-center hover:bg-accent"
            onClick={() => handleScroll('down')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}