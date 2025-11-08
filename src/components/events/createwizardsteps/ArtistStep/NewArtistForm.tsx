// src/components/events/steps/ArtistStep/NewArtistForm.tsx
import { useState, useMemo } from 'react';
import { GenreSelector } from "@/components/ui/genre-selector";
import { ArtistTypeSelector } from "@/components/ui/artist-type-selector";
import { ActTypeSelector } from "@/components/ui/act-type-selector";
import { LocationSelector } from "@/components/ui/location-selector";
import { AlertCircle } from 'lucide-react';
import { createArtist } from '@/lib/services/artist-service';
import type { Artist } from '@/lib/types';
import type { ArtistType, ActType } from '@/lib/constants/artist';
import { stringSimilarity } from '@/lib/utils/string-similarity';
import { searchCityAutocomplete } from '@/lib/services/places-service';

interface NewArtistFormProps {
    initialName: string;
    onCancel: () => void;
    onArtistCreated: (artist: Artist) => void;
    existingArtists: Artist[];
}

interface NewArtistData {
    name: string;
    location: string;  // Required field to prevent duplicates
    locationType?: 'national' | 'region' | 'city';
    artist_type?: ArtistType;  // Required field
    genres?: string[];
    acoustic?: boolean;  // Optional acoustic flag
    actType?: ActType[];  // Optional act type(s)
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
        genres: [],
        actType: []
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Memoize similarArtists calculation to prevent recalculating on every render
    const similarArtists = useMemo(() => {
        if (!formData.name || formData.name.length < 2) return [];
        return existingArtists.filter(artist =>
            stringSimilarity(artist.name.toLowerCase(), formData.name.toLowerCase()) > 0.8
        );
    }, [formData.name, existingArtists]);

    const handleLocationChange = (location: string, locationType: 'national' | 'region' | 'city') => {
        setFormData({ ...formData, location, locationType });
    };

    const handleCitySearch = async (query: string) => {
        const predictions = await searchCityAutocomplete(query);
        return predictions.map(p => ({
            place_id: p.place_id,
            description: p.description,
            structured_formatting: {
                main_text: p.structured_formatting?.main_text || '',
                secondary_text: p.structured_formatting?.secondary_text || '',
            },
        }));
    };

    const handleSubmit = async () => {
        const newErrors: { [key: string]: string } = {};

        // Validate required fields
        if (!formData.name) newErrors.name = 'Artist name is required';
        if (!formData.location) newErrors.location = 'Location is required';
        if (!formData.artist_type) newErrors.artist_type = 'Artist type is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
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
        setErrors({});
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

            <LocationSelector
                value={formData.location}
                onChange={handleLocationChange}
                onCitySearch={handleCitySearch}
                required
            />

            <ArtistTypeSelector
                selectedType={formData.artist_type}
                onChange={(type) => setFormData({ ...formData, artist_type: type })}
                required
                error={errors.artist_type}
            />

            <ActTypeSelector
                selectedTypes={formData.actType || []}
                onChange={(types) => setFormData({ ...formData, actType: types })}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                    type="checkbox"
                    id="acoustic"
                    checked={formData.acoustic || false}
                    onChange={(e) => setFormData({ ...formData, acoustic: e.target.checked })}
                    style={{
                        width: '1rem',
                        height: '1rem',
                        cursor: 'pointer',
                        accentColor: 'var(--primary)'
                    }}
                />
                <label
                    htmlFor="acoustic"
                    style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--foreground)',
                        cursor: 'pointer'
                    }}
                >
                    Acoustic performances
                </label>
            </div>

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
                    disabled={!formData.name || !formData.location || !formData.artist_type || loading}
                    style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        borderRadius: '0.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        cursor: (!formData.name || !formData.location || !formData.artist_type || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!formData.name || !formData.location || !formData.artist_type || loading) ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        if (!(!formData.name || !formData.location || !formData.artist_type || loading)) {
                            e.currentTarget.style.opacity = '0.9';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!(!formData.name || !formData.location || !formData.artist_type || loading)) {
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