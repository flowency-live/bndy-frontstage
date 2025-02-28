// Refined update to VenueStep component
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/Button";
import { MapPin } from 'lucide-react';
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
        <div className="px-6 py-6">
            {/* Removed the duplicate title - the wizard already has this */}
            
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <input
                    id="venue-search"
                    placeholder="Search for venue..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-transparent border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-translucent)]"
                    style={{ borderColor: 'var(--primary)' }}
                />
            </div>
            
            {loading ? (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                    Searching venues...
                </div>
            ) : searchResults.length > 0 ? (
                <ScrollArea className="mt-4 max-h-[400px] border border-[var(--border)] rounded-lg overflow-hidden">
                    {searchResults.map((venue, index) => (
                        <VenueCard
                            key={venue.id || `new-${index}`}
                            venue={venue}
                            onSelect={handleVenueSelect}
                        />
                    ))}
                </ScrollArea>
            ) : searchTerm.length >= 2 ? (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                    No venues found matching "{searchTerm}"
                </div>
            ) : (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                    Start typing to search for venues
                </div>
            )}

            {onBack && (
                <Button variant="outline" className="w-full mt-4" onClick={onBack}>
                    Back
                </Button>
            )}
        </div>
    );
}