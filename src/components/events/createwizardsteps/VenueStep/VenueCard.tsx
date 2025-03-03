import { Building, MapPin } from 'lucide-react';
import type { Venue } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  onSelect: (venue: Venue) => void;
}

export function VenueCard({ venue, onSelect }: VenueCardProps) {
  // Determine icon color: cyan for verified, grey otherwise
  const iconColor = venue.validated ? "text-cyan-500" : "text-gray-500";

  return (
    <div
      className="p-4 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--accent)] transition-colors"
      onClick={() => onSelect(venue)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--secondary-translucent)] flex items-center justify-center mr-3">
          <Building className={`w-5 h-5 ${iconColor}`} />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <h3 className="text-base font-semibold text-[var(--foreground)]">{venue.name}</h3>
          {venue.address && (
            <div className="flex items-start mt-1">
              <MapPin className="w-3 h-3 text-[var(--secondary)] mt-1 mr-1 flex-shrink-0" />
              <p className="text-sm text-[var(--foreground-muted)] break-words">
                {venue.address}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
