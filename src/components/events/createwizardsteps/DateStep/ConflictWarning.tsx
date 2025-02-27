// src/components/events/createwizardsteps/DateStep/ConflictWarning.tsx
import { AlertTriangle, XCircle } from 'lucide-react';
import { DateConflict } from '@/lib/types';

interface ConflictWarningProps {
    conflicts: DateConflict[];
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
    if (!conflicts || conflicts.length === 0) return null;
    
    const isBlockingConflict = conflicts.some(c => c.type === "exact_duplicate");

    return (
        <div className={`mt-4 p-4 border ${isBlockingConflict ? "border-pink-500 bg-pink-100 text-pink-800" : "border-yellow-500 bg-yellow-100 text-yellow-800"} rounded-md shadow-md`}>
            <div className="flex items-center gap-3">
                {isBlockingConflict ? (
                    <XCircle className="h-5 w-5 text-pink-600 flex-shrink-0" />
                ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                )}
                <div>
                    <h3 className="font-medium">
                        {isBlockingConflict ? "❌ This event already exists!" : `${conflicts.length} Scheduling Conflicts Found`}
                    </h3>
                    <ul className="mt-2 text-sm space-y-1">
                        {conflicts.map((conflict, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <strong>
                                    {conflict.type === "venue" 
                                      ? "Venue" 
                                      : conflict.type === "artist" 
                                        ? "Artist" 
                                        : "Duplicate Event"}
                                </strong>
                                <span>
                                    {conflict.name} {conflict.existingEvent ? `has event "${conflict.existingEvent.name}" at ${conflict.existingEvent.startTime}` : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {!isBlockingConflict && (
                        <p className="mt-2 text-sm font-semibold text-yellow-700">
                            You can still proceed with creating this event.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}