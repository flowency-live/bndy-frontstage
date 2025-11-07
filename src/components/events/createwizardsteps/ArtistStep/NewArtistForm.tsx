// src/components/events/steps/ArtistStep/NewArtistForm.tsx
import { useState, useEffect, useRef } from 'react';
import { GenreSelector } from "@/components/ui/genre-selector";
import { AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { createArtist } from '@/lib/services/artist-service';
import type { Artist } from '@/lib/types';
import { stringSimilarity } from '@/lib/utils/string-similarity';
import { searchCityAutocomplete } from '@/lib/services/places-service';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

interface NewArtistFormProps {
    initialName: string;
    onCancel: () => void;
    onArtistCreated: (artist: Artist) => void;
    existingArtists: Artist[];
}

interface NewArtistData {
    name: string;
    location: string;  // Required field to prevent duplicates
    genres?: string[];
    facebookUrl?: string;
    instagramUrl?: string;
    websiteUrl?: string;
}

export function NewArtistForm({
    initialName,
    onCancel,
    onArtistCreated,
    existingArtists
}: NewArtistFormProps) {
    const [formData, setFormData] = useState<NewArtistData>({
        name: initialName,
        location: '',
        genres: []
    });
    const [loading, setLoading] = useState(false);
    const [locationPredictions, setLocationPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const locationWrapperRef = useRef<HTMLDivElement>(null);
    const { isLoaded: googleMapsLoaded, loadGoogleMaps } = useGoogleMaps();

    const similarArtists = existingArtists.filter(artist =>
        stringSimilarity(artist.name.toLowerCase(), formData.name.toLowerCase()) > 0.8
    );

    // Handle location autocomplete search
    useEffect(() => {
        if (formData.location.length < 2) {
            setLocationPredictions([]);
            setShowLocationDropdown(false);
            return;
        }

        const searchLocation = async () => {
            setLocationLoading(true);

            // Load Google Maps if not already loaded
            if (!googleMapsLoaded) {
                await loadGoogleMaps();
            }

            try {
                const results = await searchCityAutocomplete(formData.location);
                setLocationPredictions(results);
                setShowLocationDropdown(results.length > 0);
            } catch (error) {
                console.error('Error searching cities:', error);
                setLocationPredictions([]);
                setShowLocationDropdown(false);
            } finally {
                setLocationLoading(false);
            }
        };

        const timeoutId = setTimeout(searchLocation, 300);
        return () => clearTimeout(timeoutId);
    }, [formData.location, googleMapsLoaded, loadGoogleMaps]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
                setShowLocationDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLocationSelect = (prediction: google.maps.places.AutocompletePrediction) => {
        const location = prediction.description;
        setFormData({ ...formData, location });
        setShowLocationDropdown(false);
        setLocationPredictions([]);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.location) {
            alert('Artist name and location are required');
            return;
        }

        const exactMatch = existingArtists.find(
            artist => artist.name.toLowerCase() === formData.name.toLowerCase()
        );
        
        if (exactMatch) {
            alert('An artist with this exact name already exists');
            return;
        }

        setLoading(true);
        try {
            const artist = await createArtist(formData);
            onArtistCreated(artist);
        } catch (error) {
            console.error('Error creating artist:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Artist Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
                style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    marginBottom: '0.5rem'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />

            <div ref={locationWrapperRef} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <MapPin style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Location (e.g., Manchester, UK) *"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        autoComplete="off"
                        style={{
                            width: '100%',
                            padding: '0.5rem 2.5rem 0.5rem 2.5rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.5rem',
                            border: '2px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--foreground)',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                    {locationLoading && (
                        <Loader2 style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--muted-foreground)', animation: 'spin 1s linear infinite' }} />
                    )}
                </div>

                {/* Dropdown */}
                {showLocationDropdown && locationPredictions.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        zIndex: 50,
                        width: '100%',
                        marginTop: '0.25rem',
                        overflow: 'hidden',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--popover)',
                        padding: '0.25rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        {locationPredictions.map((prediction) => (
                            <div
                                key={prediction.place_id}
                                onClick={() => handleLocationSelect(prediction)}
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderRadius: '0.125rem',
                                    padding: '0.5rem',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <MapPin style={{ width: '1rem', height: '1rem', color: 'var(--muted-foreground)' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {prediction.structured_formatting?.main_text || prediction.description}
                                    </div>
                                    {prediction.structured_formatting?.secondary_text && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {prediction.structured_formatting.secondary_text}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                Location is required to prevent duplicate artists
            </p>

            {similarArtists.length > 0 && (
                <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(234, 179, 8, 0.5)',
                    marginBottom: '0.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <AlertCircle style={{ width: '1rem', height: '1rem', color: '#eab308', marginTop: '0.125rem', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', color: '#eab308', fontWeight: 500 }}>Similar artists found:</p>
                            <ul style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--muted-foreground)', paddingLeft: '1.25rem' }}>
                                {similarArtists.map(artist => (
                                    <li key={artist.id}>{artist.name}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <input
                type="text"
                placeholder="Facebook URL"
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    marginBottom: '0.5rem'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <input
                type="text"
                placeholder="Instagram URL"
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    marginBottom: '0.5rem'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <input
                type="text"
                placeholder="Website URL"
                value={formData.websiteUrl || ''}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    marginBottom: '0.5rem'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />

            <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block', color: 'var(--foreground)' }}>
                    Genres (Optional)
                </label>
                <GenreSelector
                    selectedGenres={formData.genres || []}
                    onChange={(genres) => setFormData({ ...formData, genres })}
                />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        borderRadius: '0.5rem',
                        border: '2px solid var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.location || loading}
                    style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        borderRadius: '0.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        cursor: (!formData.name || !formData.location || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!formData.name || !formData.location || loading) ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        if (!(!formData.name || !formData.location || loading)) {
                            e.currentTarget.style.opacity = '0.9';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!(!formData.name || !formData.location || loading)) {
                            e.currentTarget.style.opacity = '1';
                        }
                    }}
                >
                    {loading ? 'Creating...' : 'Save New Artist'}
                </button>
            </div>
        </div>
    );
}