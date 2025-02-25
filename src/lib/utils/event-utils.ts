// src/lib/utils/event-utils.ts
import { RecurringFrequency } from '@/lib/types';

export function generateRecurringDates(
    startDate: string,
    endDate: string,
    frequency: RecurringFrequency
): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current <= end) {
        // Clone `current` before pushing to prevent mutation issues
        dates.push(new Date(current).toISOString().split('T')[0]);

        if (frequency === 'weekly') {
            current = new Date(current.setDate(current.getDate() + 7));
        } else if (frequency === 'monthly') {
            current = new Date(current.setMonth(current.getMonth() + 1));
        }
    }

    return dates;
}