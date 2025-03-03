import { AlertTriangle, XCircle } from 'lucide-react';
import { DateConflict } from '@/lib/types';

interface ConflictWarningProps {
  conflicts: DateConflict[];
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
  if (!conflicts || conflicts.length === 0) return null;
  
  // If any conflict has type === 'exact_duplicate', we consider it blocking.
  const isBlockingConflict = conflicts.some(c => c.type === "exact_duplicate");

  return (
    <div
      className={`mt-4 p-4 border ${
        isBlockingConflict
          ? "border-pink-500 bg-pink-100 text-pink-800"
          : "border-yellow-500 bg-yellow-100 text-yellow-800"
      } rounded-md shadow-md`}
    >
      <div className="flex items-start gap-3">
        {isBlockingConflict ? (
          <XCircle className="h-5 w-5 text-pink-600 flex-shrink-0 mt-1" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
        )}

        {isBlockingConflict ? (
          /* Blocking Conflict => Show a single message */
          <div>
            <h3 className="font-medium">An event already exists for this venue and artist on this date.</h3>
         
          </div>
        ) : (
          /* Partial Conflicts => Show detailed list */
          <div>
            <h3 className="font-medium">
              {conflicts.length === 1
                ? "1 Scheduling Conflict Found"
                : `${conflicts.length} Scheduling Conflicts Found`}
            </h3>

            <ul className="mt-2 text-sm space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index} className="flex items-start gap-2">
                  <strong>
                    {conflict.type === "venue"
                      ? "Venue"
                      : conflict.type === "artist"
                      ? "Artist"
                      : "Conflict"}
                  </strong>
                  <span>
                    {conflict.name}{" "}
                    {conflict.existingEvent
                      ? `already has an event "${conflict.existingEvent.name}" at ${conflict.existingEvent.startTime}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-2 text-sm font-semibold text-yellow-700">
              You can still continue by hitting Next...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
