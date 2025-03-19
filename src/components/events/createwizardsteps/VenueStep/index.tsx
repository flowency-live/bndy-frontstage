import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from 'lucide-react';
import { searchVenues } from '@/lib/services/venue-service';
import type { EventFormData, Venue } from '@/lib/types';
import { VenueCard } from './VenueCard';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

interface VenueStepProps {
    form: UseFormReturn<EventFormData>;
    map?: L.Map | null; // Updated for Leaflet map
    onVenueSelect: (venue: Venue) => void;
    onBack?: () => void;
}

export function VenueStep({ onVenueSelect, onBack }: VenueStepProps) {
    const [searchResults, setSearchResults] = useState<Venue[]>([]);
    const [dbResults, setDbResults] = useState<Venue[]>([]);
    const [googleResults, setGoogleResults] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [googleMapsNeeded, setGoogleMapsNeeded] = useState(false);
    const { isLoaded: googleMapsLoaded, loadGoogleMaps } = useGoogleMaps();

    // Auto-focus the search input on mount
    useEffect(() => {
        const searchInput = document.getElementById('venue-search') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
        }
    }, []);

    // Load Google Maps API if we need to search
    useEffect(() => {
        if (googleMapsNeeded && !googleMapsLoaded) {
            // Load Google Maps API
            loadGoogleMaps().then(success => {
                if (success && searchTerm.length >= 2) {
                    // Re-run the search now that Google Maps is loaded
                    handleSearch(searchTerm);
                }
            });
        }
    }, [googleMapsNeeded, googleMapsLoaded, loadGoogleMaps, searchTerm]);

    const handleSearch = async (searchTerm: string) => {
        setSearchTerm(searchTerm);
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            setDbResults([]);
            setGoogleResults([]);
            return;
        }

        setLoading(true);
        try {
            // First search in your database
            const results = await searchVenues(searchTerm);
            
            // Separate database and Google results
            const dbVenues = results.filter(venue => venue.id);
            const googleVenues = results.filter(venue => !venue.id);
            
            setDbResults(dbVenues);
            setGoogleResults(googleVenues);
            setSearchResults(results);
            
            // If we got no database results, we might need Google Maps API
            if (dbVenues.length === 0 && googleVenues.length === 0) {
                setGoogleMapsNeeded(true);
            }
        } catch (error) {
            console.error('Error searching venues:', error);
            // If the error is about Google not being defined, set the flag to load it
            if (error instanceof Error && error.message.includes('google')) {
                setGoogleMapsNeeded(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVenueSelect = (venue: Venue) => {
        onVenueSelect(venue);
    };

    return (
        <div className="px-6 py-6">
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
                <div className="text-center py-8 text-[var(--foreground-muted)] flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching venues...
                </div>
            ) : googleMapsNeeded && !googleMapsLoaded ? (
                <div className="text-center py-8">
                    <p className="text-[var(--foreground-muted)] mb-4">
                        Loading Google Places to find more venues...
                    </p>
                    <div className="flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                </div>
            ) : searchResults.length > 0 ? (
                <ScrollArea className="mt-4 max-h-[400px] border border-[var(--border)] rounded-lg overflow-hidden">
                    {/* Show database results first with a header */}
                    {dbResults.length > 0 && (
                        <>
                            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] font-medium text-sm">
                                bndy.live
                            </div>
                            {dbResults.map((venue) => (
                                <VenueCard
                                    key={venue.id}
                                    venue={venue}
                                    onSelect={handleVenueSelect}
                                />
                            ))}
                        </>
                    )}
                    
                    {/* Show Google results with a header */}
                    {googleResults.length > 0 && (
                        <>
                            <div className="p-2 bg-[var(--secondary)]/10 text-[var(--secondary)] font-medium text-sm">
                                From Google Places
                            </div>
                            {googleResults.map((venue, index) => (
                                <VenueCard
                                    key={`new-${index}`}
                                    venue={venue}
                                    onSelect={handleVenueSelect}
                                />
                            ))}
                        </>
                    )}
                </ScrollArea>
            ) : searchTerm.length >= 2 ? (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                    No venues found matching &ldquo;{searchTerm}&rdquo;
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