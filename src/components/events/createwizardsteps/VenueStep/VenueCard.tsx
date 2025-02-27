// src/components/events/steps/VenueStep/VenueCard.tsx
import { Card, CardContent } from "@/components/ui/Card";
import { Building } from 'lucide-react';
import type { Venue } from '@/lib/types';

interface VenueCardProps {
    venue: Venue;
    onSelect: (venue: Venue) => void;
}

export function VenueCard({ venue, onSelect }: VenueCardProps) {
    return (
        <Card
            className="mb-2 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => {
       
                onSelect(venue);
            }}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{venue.name}</h3>
                            <Building className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {venue.address && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {venue.address}
                            </p>
                        )}
                        <p className="text-xs mt-1">
                            {venue.id ? (
                                <span className="text-primary">Verified venue</span>
                            ) : (
                                <span className="text-muted-foreground">
                                    New venue - will be added to database
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}