import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import type { EventFormData } from '@/lib/types';

interface TimeStepProps {
  form: UseFormReturn<EventFormData>;
  onComplete: () => void;
  onBack?: () => void;
}

export function TimeStep({ form, onComplete, onBack }: TimeStepProps) {
  const [showEndTime, setShowEndTime] = useState(!!form.getValues('endTime'));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSelectingEndTime, setIsSelectingEndTime] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const timeOptionsRef = useRef<HTMLDivElement>(null);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);

      // Also check if the device supports time input
      const input = document.createElement('input');
      input.type = 'time';
      const supported = input.type === 'time';
      // Only use native if mobile AND it properly supports time input
      setIsMobile(isMobileDevice && supported);
    };
    
    checkMobile();
  }, []);

  // Get the venue's standard times
  const venue = form.watch('venue');
  const venueStartTime = venue?.standardStartTime;
  const venueEndTime = venue?.standardEndTime;

  // Set default times on mount or when venue changes
  useEffect(() => {
    const currentStart = form.getValues('startTime');
    if (!currentStart) {
      // Default to venue's start or 21:00
      form.setValue('startTime', venueStartTime || "21:00");
    }

    if (showEndTime && !form.getValues('endTime')) {
      if (venueEndTime) {
        form.setValue('endTime', venueEndTime);
      } else {
        // Default end time is start time + 3 hours
        const [hours, minutes] = (form.getValues('startTime') || "21:00").split(':').map(Number);
        const endHours = (hours + 3) % 24;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        form.setValue('endTime', endTime);
      }
    }
  }, [form, showEndTime, venueStartTime, venueEndTime]);

  // Generate time options in 30-min increments
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';

    const time24 = `${String(hour).padStart(2, '0')}:${minute}`;
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    const time12 = `${hour12}:${minute} ${period}`;

    return { value: time24, label: time12, index: i };
  });

  // Locate a time in the array
  const findTimeIndex = (timeValue: string | undefined): number => {
    if (!timeValue) return 38; // default to ~7:00 PM
    const found = timeOptions.find(t => t.value === timeValue);
    return found ? found.index : 38;
  };

  // Show the picker, scroll to the current selection
  const openTimePicker = (forEndTime: boolean) => {
    if (isMobile) return; // Don't open custom picker on mobile
    
    setIsSelectingEndTime(forEndTime);
    const current = forEndTime ? form.getValues('endTime') : form.getValues('startTime');
    const idx = findTimeIndex(current);
    setShowTimePicker(true);
    setTimeout(() => {
      scrollToTimeIndex(idx);
    }, 100);
  };

  const scrollToTimeIndex = (index: number) => {
    if (!timeOptionsRef.current) return;
    const optionHeight = 40;
    const scrollTop = index * optionHeight - (timeOptionsRef.current.clientHeight / 2) + (optionHeight / 2);
    timeOptionsRef.current.scrollTop = Math.max(0, scrollTop);
  };

  // Select a time from the dropdown
  const handleTimeSelect = (time24: string) => {
    if (isSelectingEndTime) {
      form.setValue('endTime', time24);
    } else {
      form.setValue('startTime', time24);
      // If end time is enabled, default to +3h
      if (showEndTime) {
        const [h, m] = time24.split(':').map(Number);
        const endHours = (h + 3) % 24;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        form.setValue('endTime', endTime);
      }
    }
    setShowTimePicker(false);
  };

  // Handle native time input change
  const handleNativeTimeChange = (e: React.ChangeEvent<HTMLInputElement>, isEnd = false) => {
    const newTime = e.target.value;
    
    if (isEnd) {
      form.setValue('endTime', newTime);
    } else {
      form.setValue('startTime', newTime);
      
      // If end time is enabled, default to +3h
      if (showEndTime) {
        const [h, m] = newTime.split(':').map(Number);
        const endHours = (h + 3) % 24;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        form.setValue('endTime', endTime);
      }
    }
  };

  // Outside click closes the picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 24h -> 12h display
  const formatTime12h = (time24: string | undefined) => {
    if (!time24) return 'Select time';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Scroll up/down
  const handleScrollDirection = (dir: 'up' | 'down') => {
    if (!timeOptionsRef.current) return;
    const scrollAmt = dir === 'up' ? -120 : 120;
    timeOptionsRef.current.scrollTop += scrollAmt;
  };

  // Touch scroll
  const [touchStartY, setTouchStartY] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!timeOptionsRef.current) return;
    const touchY = e.touches[0].clientY;
    const diff = touchStartY - touchY;
    timeOptionsRef.current.scrollTop += diff * 0.5;
    setTouchStartY(touchY);
  };

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Start Time */}
      <div>
        <label className="block mb-2 text-sm text-[var(--foreground-muted)]">
          Start Time
        </label>
        
        {isMobile ? (
          // Native time input for mobile
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Clock className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <input
              type="time"
              value={form.watch('startTime') || ''}
              onChange={(e) => handleNativeTimeChange(e, false)}
              className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
              style={{ borderColor: 'var(--primary)' }}
            />
          </div>
        ) : (
          // Custom time picker for desktop
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Clock className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <button
              type="button"
              className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
              style={{ borderColor: 'var(--primary)' }}
              onClick={() => openTimePicker(false)}
            >
              {formatTime12h(form.watch('startTime'))}
            </button>
          </div>
        )}
      </div>

      {/* Add End Time Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="show-end-time"
          className="rounded border-[var(--border)] text-[var(--primary)] w-4 h-4"
          checked={showEndTime}
          onChange={(e) => {
            setShowEndTime(e.target.checked);
            if (!e.target.checked) {
              form.setValue('endTime', undefined);
            } else {
              // If no endTime is set, default to venue or +3h from start
              const existingEnd = form.getValues('endTime');
              if (!existingEnd) {
                if (venueEndTime) {
                  form.setValue('endTime', venueEndTime);
                } else {
                  const [h, m] = (form.getValues('startTime') || "21:00").split(':').map(Number);
                  const endHours = (h + 3) % 24;
                  const endTime = `${String(endHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  form.setValue('endTime', endTime);
                }
              }
            }
          }}
        />
        <label htmlFor="show-end-time" className="text-sm font-medium">
          Add an end time
        </label>
      </div>

      {/* End Time (only if toggled) */}
      {showEndTime && (
        <div>
          <label className="block mb-2 text-sm text-[var(--foreground-muted)]">
            End Time
          </label>
          
          {isMobile ? (
            // Native time input for mobile
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Clock className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <input
                type="time"
                value={form.watch('endTime') || ''}
                onChange={(e) => handleNativeTimeChange(e, true)}
                className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                style={{ borderColor: 'var(--primary)' }}
              />
            </div>
          ) : (
            // Custom time picker for desktop
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Clock className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <button
                type="button"
                className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                style={{ borderColor: 'var(--primary)' }}
                onClick={() => openTimePicker(true)}
              >
                {formatTime12h(form.watch('endTime'))}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Time Picker Dropdown - only shown on desktop */}
      {!isMobile && showTimePicker && (
        <div
          ref={timePickerRef}
          className="absolute z-20 mt-1 w-[calc(100%-3rem)] bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg px-2"
          style={{ marginLeft: '1.5rem' }} // shift to align under the input
        >
          {/* Scroll Up Button */}
          <div className="time-scroll-button time-scroll-button-top">
            <button
              type="button"
              onClick={() => handleScrollDirection('up')}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--accent)]"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          {/* Time Options */}
          <div
            ref={timeOptionsRef}
            className="time-options max-h-[300px] overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {timeOptions.map((time) => {
              const currentVal = isSelectingEndTime
                ? form.watch('endTime')
                : form.watch('startTime');
              const isSelected = currentVal === time.value;
              return (
                <button
                  key={time.value}
                  type="button"
                  className={`time-option w-full text-left px-4 py-2 ${
                    isSelected ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium' : ''
                  } hover:bg-[var(--accent)]`}
                  onClick={() => handleTimeSelect(time.value)}
                >
                  <div className="flex items-center justify-between">
                    <span>{time.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scroll Down Button */}
          <div className="time-scroll-button time-scroll-button-bottom">
            <button
              type="button"
              onClick={() => handleScrollDirection('down')}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--accent)]"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end mt-6">
        <Button
          className="bg-[var(--primary)] text-white rounded-full px-6 py-3"
          disabled={!form.getValues('startTime')}
          onClick={onComplete}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}