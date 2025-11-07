// src/components/events/steps/ArtistStep/NewArtistForm.tsx
import { useState } from 'react';
import { GenreSelector } from "@/components/ui/genre-selector";
import { AlertCircle } from 'lucide-react';
import { createArtist } from '@/lib/services/artist-service';
import type { Artist } from '@/lib/types';
import { stringSimilarity } from '@/lib/utils/string-similarity';

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

    const similarArtists = existingArtists.filter(artist =>
        stringSimilarity(artist.name.toLowerCase(), formData.name.toLowerCase()) > 0.8
    );

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

            <input
                type="text"
                placeholder="Location (e.g., Manchester, UK) *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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