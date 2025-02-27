// src/components/events/createwizardsteps/VenueStep/index.tsx
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/Button";
import { searchVenues } from '@/lib/services/venue-service';
import type { EventFormData, Venue } from '@/lib/types';
import { VenueCard } from './VenueCard';

interface VenueStepProps {
    form: UseFormReturn<EventFormData>;
    map?: google.maps.Map | null;
    onVenueSelect: (venue: Venue) => void;
    onBack?: () => void;
}

export function VenueStep({ form, map, onVenueSelect, onBack }: VenueStepProps) {
    const [searchResults, setSearchResults] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Auto-focus the search input on mount
    useEffect(() => {
        const searchInput = document.getElementById('venue-search') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }, []);

    const handleSearch = async (searchTerm: string) => {
        setSearchTerm(searchTerm);
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const results = await searchVenues(searchTerm);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching venues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVenueSelect = (venue: Venue) => {
        // If we have a map and the venue has a location, center the map
        if (map && venue.location) {
            map.panTo(venue.location);
            map.setZoom(16);
        }
        
        onVenueSelect(venue);
    };

    return (
        <div className="space-y-4">
            <Input
                id="venue-search"
                placeholder="Search for venue..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
            />
            
            <ScrollArea className="h-[400px]">
                {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                        Searching venues...
                    </div>
                ) : searchResults.length > 0 ? (
                    searchResults.map((venue, index) => (
                        <VenueCard
                            key={venue.id || `new-${index}`}
                            venue={venue}
                            onSelect={handleVenueSelect}
                        />
                    ))
                ) : searchTerm.length >= 2 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No venues found matching "{searchTerm}"
                    </div>
                ) : (
                    <div className="p-4 text-center text-muted-foreground">
                        Start typing to search for venues
                    </div>
                )}
            </ScrollArea>

            {onBack && (
                <Button variant="outline" className="w-full mt-2" onClick={onBack}>
                    Back
                </Button>
            )}
        </div>
    );
}