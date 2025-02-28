// Refined update to TimeStep component
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import type { EventFormData } from '@/lib/types';

interface TimeStepProps {
    form: UseFormReturn<EventFormData>;
    onComplete: () => void;
    onBack?: () => void;
}

export function TimeStep({ form, onComplete, onBack }: TimeStepProps) {
    const [showEndTime, setShowEndTime] = useState(!!form.getValues('endTime'));
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Time options (30 min increments)
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        
        // 24-hour format for form values
        const time24 = `${String(hour).padStart(2, '0')}:${minute}`;
        
        // 12-hour format for display
        const time12 = `${hour12}:${minute} ${period}`;
        
        return { value: time24, label: time12 };
    });

    // Get commonly used evening times (for quick selection)
    const eveningTimes = timeOptions.filter(time => {
        const hour = parseInt(time.value.split(':')[0]);
        return hour >= 18 && hour <= 21;
    });

    const handleTimeSelect = (time24: string) => {
        form.setValue('startTime', time24);
        
        // Auto-generate end time if enabled
        if (showEndTime) {
            // Default to 3 hours after start
            const [hours, minutes] = time24.split(':').map(Number);
            const endHours = (hours + 3) % 24;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            form.setValue('endTime', endTime);
        }
        
        setShowTimePicker(false);
    };

    // Convert 24h to 12h time for display
    const formatTime12h = (time24h: string | undefined): string => {
        if (!time24h) return 'Add Start Time';
        
        const [hours, minutes] = time24h.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        
        return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    return (
        <div className="px-6 py-6">
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <button 
                    type="button"
                    className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                    style={{ borderColor: 'var(--primary)' }}
                    onClick={() => setShowTimePicker(!showTimePicker)}
                >
                    {formatTime12h(form.watch('startTime'))}
                </button>
                
                {showTimePicker && (
                    <div className="absolute z-20 mt-1 w-full bg-[var(--background)] border border-[var(--primary)] rounded-lg shadow-lg max-h-60 overflow-auto">
                        <div className="sticky top-0 flex justify-center p-2 bg-[var(--background)]">
                            <button 
                                className="p-1 hover:bg-[var(--accent)] rounded-full"
                                onClick={() => {
                                    const scrollContainer = document.querySelector('.time-options');
                                    if (scrollContainer) {
                                        scrollContainer.scrollTop -= 40;
                                    }
                                }}
                            >
                                <ChevronUp className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="time-options overflow-auto max-h-48">
                            {timeOptions.map((time) => (
                                <button
                                    key={time.value}
                                    className={`w-full text-left px-4 py-2 hover:bg-[var(--accent)] 
                                              ${form.watch('startTime') === time.value ? 'bg-[var(--primary-translucent)] text-[var(--primary)] font-medium' : ''}`}
                                    onClick={() => handleTimeSelect(time.value)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{time.label}</span>
                                        {form.watch('startTime') === time.value && (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="sticky bottom-0 flex justify-center p-2 bg-[var(--background)]">
                            <button 
                                className="p-1 hover:bg-[var(--accent)] rounded-full"
                                onClick={() => {
                                    const scrollContainer = document.querySelector('.time-options');
                                    if (scrollContainer) {
                                        scrollContainer.scrollTop += 40;
                                    }
                                }}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add end time option */}
            <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={showEndTime}
                            onChange={(e) => {
                                setShowEndTime(e.target.checked);
                                if (!e.target.checked) {
                                    form.setValue('endTime', undefined);
                                } else if (form.getValues('startTime')) {
                                    // Default end time to 3 hours after start
                                    const [hours, minutes] = form.getValues('startTime').split(':').map(Number);
                                    const endHours = (hours + 3) % 24;
                                    const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                    form.setValue('endTime', endTime);
                                }
                            }}
                        />
                        <div className={`w-5 h-5 border rounded-sm ${showEndTime ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                            {showEndTime && <Check className="w-4 h-4 text-white" />}
                        </div>
                    </div>
                    <span>Add End Time</span>
                </label>
            </div>
            
            {/* End time input - only show if enabled */}
            {showEndTime && (
                <div className="mb-4">
                    <button 
                        type="button"
                        className="w-full px-4 py-3 bg-transparent border rounded-full text-base text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                        style={{ borderColor: 'var(--primary)' }}
                        onClick={() => {
                            // Simplified approach for end time (automatically calculated)
                            if (form.getValues('startTime')) {
                                const [hours, minutes] = form.getValues('startTime').split(':').map(Number);
                                const endHours = (hours + 3) % 24;
                                const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                form.setValue('endTime', endTime);
                            }
                        }}
                    >
                        {formatTime12h(form.watch('endTime'))}
                    </button>
                </div>
            )}
            
            <div className="flex gap-4 mt-6">
                {onBack && (
                    <Button variant="outline" className="flex-1" onClick={onBack}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                )}
                <Button
                    className="flex-1 bg-[var(--primary)] text-white"
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